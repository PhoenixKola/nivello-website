'use client'

import { useId, useState } from 'react'
import { formatNumber } from '@/lib/admin/format'
import { cx } from './styles'

export function BarList({ items, empty, format = formatNumber }: { items: { label: string; count: number }[]; empty: string; format?: (n: number) => string }) {
  const max = Math.max(1, ...items.map(i => i.count))
  if (!items.length) return <p className="px-5 pb-5 pt-3 text-sm text-slate-400">{empty}</p>
  return (
    <ul className="space-y-2.5 px-5 pb-5 pt-3">
      {items.map(item => (
        <li key={item.label}>
          <div className="mb-1 flex justify-between gap-3 text-xs">
            <span className="truncate font-medium text-slate-700 dark:text-slate-200" title={item.label}>
              {item.label}
            </span>
            <span className="tabular-nums text-slate-500">{format(item.count)}</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.06]">
            <div className="h-full rounded-full bg-[var(--brand-blue)]/80 dark:bg-[var(--brand-gold)]/80" style={{ width: `${(item.count / max) * 100}%` }} />
          </div>
        </li>
      ))}
    </ul>
  )
}

export type SeriesPoint = { label: string; values: number[] }

const LINE_COLORS = ['var(--brand-blue)', 'var(--brand-purple)']

/**
 * Lightweight SVG line/area chart. The first series is filled; a second (optional) is dashed.
 * The SVG stretches to the container at a fixed height; labels and markers are HTML so they never scale.
 * A hidden table carries the same numbers for screen readers.
 */
export function TrendChart({ points, series, height = 180, formatLabel = (l: string) => l }: { points: SeriesPoint[]; series: string[]; height?: number; formatLabel?: (label: string) => string }) {
  const id = useId()
  const [hover, setHover] = useState<number | null>(null)
  const W = 1000
  const H = 100
  const max = Math.max(1, ...points.flatMap(p => p.values))
  const xPct = (i: number) => (points.length <= 1 ? 50 : (i / (points.length - 1)) * 100)
  const yPct = (v: number) => 100 - (v / max) * 92
  const path = (s: number) => points.map((p, i) => `${i ? 'L' : 'M'}${(xPct(i) * W) / 100},${yPct(p.values[s] ?? 0)}`).join(' ')
  const area = points.length ? `${path(0)} L${(xPct(points.length - 1) * W) / 100},${H} L${(xPct(0) * W) / 100},${H} Z` : ''
  const tickEvery = Math.max(1, Math.ceil(points.length / 7))
  const active = hover !== null ? points[hover] : null

  return (
    <div>
      <div
        className="relative"
        style={{ height }}
        onMouseLeave={() => setHover(null)}
        onMouseMove={event => {
          const rect = event.currentTarget.getBoundingClientRect()
          const rel = (event.clientX - rect.left) / rect.width
          setHover(Math.min(points.length - 1, Math.max(0, Math.round(rel * (points.length - 1)))))
        }}
      >
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="absolute inset-0 h-full w-full overflow-visible" role="img" aria-label={`Trend of ${series.join(' and ')}, maximum ${formatNumber(max)}`}>
          <defs>
            <linearGradient id={`${id}-fill`} x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--brand-blue)" stopOpacity="0.22" />
              <stop offset="100%" stopColor="var(--brand-blue)" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map(f => (
            <line key={f} x1={0} x2={W} y1={H - f * 92} y2={H - f * 92} className="stroke-slate-200 dark:stroke-white/[0.06]" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
          ))}
          <line x1={0} x2={W} y1={H} y2={H} className="stroke-slate-200 dark:stroke-white/10" vectorEffect="non-scaling-stroke" />
          {points.length > 0 && <path d={area} fill={`url(#${id}-fill)`} />}
          {series.map((_, s) => (
            <path key={s} d={path(s)} fill="none" stroke={LINE_COLORS[s % LINE_COLORS.length]} strokeWidth={s ? 1.5 : 2} strokeDasharray={s ? '4 3' : undefined} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          ))}
        </svg>
        {active && hover !== null && (
          <>
            <div aria-hidden="true" className="pointer-events-none absolute inset-y-0 w-px bg-slate-300 dark:bg-white/20" style={{ left: `${xPct(hover)}%` }} />
            {series.map((_, s) => (
              <span
                key={s}
                aria-hidden="true"
                className="pointer-events-none absolute h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-white dark:ring-slate-900"
                style={{ left: `${xPct(hover)}%`, top: `${yPct(active.values[s] ?? 0)}%`, background: LINE_COLORS[s % LINE_COLORS.length] }}
              />
            ))}
            <div
              className={cx(
                'pointer-events-none absolute top-0 z-10 rounded-lg bg-slate-900 px-2.5 py-1.5 text-[11px] text-white shadow-lg dark:bg-slate-700',
                xPct(hover) > 70 ? '-translate-x-[calc(100%+8px)]' : 'translate-x-2'
              )}
              style={{ left: `${xPct(hover)}%` }}
            >
              <p className="font-medium">{formatLabel(active.label)}</p>
              {series.map((name, s) => (
                <p key={name} className="whitespace-nowrap tabular-nums text-slate-300">
                  {name}: <span className="text-white">{formatNumber(active.values[s] ?? 0)}</span>
                </p>
              ))}
            </div>
          </>
        )}
      </div>
      <div aria-hidden="true" className="relative mt-2 h-4 text-[11px] text-slate-400">
        {points.map((p, i) => {
          const last = points.length - 1
          const middle = Math.round(last / 2)
          const edge = i === 0 || i === last
          if (!edge && i !== middle && i % tickEvery !== 0) return null
          // Narrow screens keep only the first, middle and last labels.
          const narrowHidden = !edge && i !== middle
          return (
            <span
              key={p.label}
              className={cx('absolute whitespace-nowrap', narrowHidden && 'hidden sm:block', i === 0 ? '' : i === last ? '-translate-x-full' : '-translate-x-1/2')}
              style={{ left: `${xPct(i)}%` }}
            >
              {formatLabel(p.label)}
            </span>
          )
        })}
      </div>
      <table className="sr-only">
        <caption>{series.join(', ')} by day</caption>
        <thead>
          <tr>
            <th>Date</th>
            {series.map(s => (
              <th key={s}>{s}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {points.map(p => (
            <tr key={p.label}>
              <td>{formatLabel(p.label)}</td>
              {p.values.map((v, i) => (
                <td key={i}>{v}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

/** Tiny inline sparkline for response times or small series. */
export function Sparkline({ values, className, tone = 'brand', label }: { values: (number | null)[]; className?: string; tone?: 'brand' | 'green' | 'red'; label: string }) {
  const nums = values.filter((v): v is number => v !== null)
  const w = 120
  const h = 28
  if (nums.length < 2) return <span className={cx('text-xs text-slate-400', className)}>—</span>
  const max = Math.max(...nums)
  const min = Math.min(...nums)
  const span = max - min || 1
  let d = ''
  values.forEach((v, i) => {
    if (v === null) return
    const px = (i / (values.length - 1)) * w
    const py = h - 2 - ((v - min) / span) * (h - 4)
    d += `${d ? 'L' : 'M'}${px.toFixed(1)},${py.toFixed(1)} `
  })
  const stroke = tone === 'green' ? '#10b981' : tone === 'red' ? '#ef4444' : 'var(--brand-blue)'
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className={cx('h-7 w-28', className)} role="img" aria-label={label}>
      <path d={d} fill="none" stroke={stroke} strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}
