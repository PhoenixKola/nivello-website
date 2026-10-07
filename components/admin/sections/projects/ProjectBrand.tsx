'use client'

import { useState } from 'react'
import { ArrowDown, ArrowUp, Copy, Eraser } from 'lucide-react'
import type { BrandColor, Project } from '@/lib/admin/types'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { useToast } from '../../ui/Toast'
import { cx, fieldBase, focusRing } from '../../ui/styles'

const SLOTS = 5
const SUGGESTED = ['Primary', 'Secondary', 'Accent', 'Surface', 'Success']

/** "#abc" / "2764ff" → "#2764FF"; anything else stays as typed so the field can show it as invalid. */
export function normalizeHex(value: string) {
  let hex = value.trim().toUpperCase()
  if (hex && !hex.startsWith('#')) hex = `#${hex}`
  const short = /^#([0-9A-F])([0-9A-F])([0-9A-F])$/.exec(hex)
  if (short) hex = `#${short[1]}${short[1]}${short[2]}${short[2]}${short[3]}${short[3]}`
  return hex
}
const isHex = (hex: string) => /^#[0-9A-F]{6}$/.test(hex)

function padded(colors: BrandColor[]): BrandColor[] {
  return Array.from({ length: SLOTS }, (_, i) => colors[i] ?? { label: '', hex: '' })
}

export default function ProjectBrand({ project, onSave, saving }: { project: Project; onSave: (colors: BrandColor[]) => Promise<boolean>; saving: boolean }) {
  const toast = useToast()
  const [colors, setColors] = useState<BrandColor[]>(() => padded(project.brandColors))
  const invalid = colors.some(c => c.hex !== '' && !isHex(normalizeHex(c.hex)))
  const dirty = JSON.stringify(colors.map(c => ({ label: c.label, hex: c.hex ? normalizeHex(c.hex) : '' }))) !== JSON.stringify(padded(project.brandColors))
  const update = (index: number, patch: Partial<BrandColor>) => setColors(list => list.map((c, i) => (i === index ? { ...c, ...patch } : c)))
  const move = (index: number, delta: number) =>
    setColors(list => {
      const next = [...list]
      const [item] = next.splice(index, 1)
      next.splice(index + delta, 0, item)
      return next
    })

  return (
    <Card>
      <CardHeader title="Brand colors" description="Up to five main colors for this client. Internal reference only." />
      <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
        {colors.map((color, index) => {
          const hex = color.hex ? normalizeHex(color.hex) : ''
          const valid = hex === '' || isHex(hex)
          return (
            <li key={index} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <span className="w-5 text-xs font-medium tabular-nums text-slate-400">{index + 1}</span>
              <label className={cx('relative h-11 w-11 shrink-0 cursor-pointer overflow-hidden rounded-xl ring-1 ring-inset ring-slate-200 dark:ring-white/15', focusRing)} style={{ background: isHex(hex) ? hex : undefined }}>
                <span className="sr-only">Pick color {index + 1}</span>
                {!isHex(hex) && <span aria-hidden="true" className="absolute inset-0 bg-[repeating-linear-gradient(45deg,transparent,transparent_4px,rgba(148,163,184,0.25)_4px,rgba(148,163,184,0.25)_8px)]" />}
                <input type="color" value={isHex(hex) ? hex.toLowerCase() : '#ffffff'} onChange={e => update(index, { hex: e.target.value.toUpperCase() })} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
              </label>
              <input
                aria-label={`Name for color ${index + 1}`}
                value={color.label}
                maxLength={30}
                placeholder={SUGGESTED[index]}
                onChange={e => update(index, { label: e.target.value })}
                className={cx(fieldBase, 'h-9 w-36 min-w-0 flex-1 sm:flex-none')}
              />
              <input
                aria-label={`HEX value for color ${index + 1}`}
                aria-invalid={!valid}
                value={color.hex}
                maxLength={7}
                placeholder="#2764FF"
                onChange={e => update(index, { hex: e.target.value })}
                onBlur={() => color.hex && update(index, { hex: normalizeHex(color.hex) })}
                className={cx(fieldBase, 'h-9 w-28 font-mono uppercase', !valid && 'border-red-400 dark:border-red-400/60')}
              />
              {!valid && <span className="text-xs text-red-600 dark:text-red-400">Use #RRGGBB</span>}
              <div className="ml-auto flex items-center gap-1">
                <button type="button" aria-label={`Copy color ${index + 1}`} disabled={!isHex(hex)} onClick={async () => { await navigator.clipboard.writeText(hex); toast.success(`${hex} copied`) }} className={cx('flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white/[0.07]', focusRing)}>
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label={`Move color ${index + 1} up`} disabled={index === 0} onClick={() => move(index, -1)} className={cx('flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white/[0.07]', focusRing)}>
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label={`Move color ${index + 1} down`} disabled={index === SLOTS - 1} onClick={() => move(index, 1)} className={cx('flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-white/[0.07]', focusRing)}>
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
                <button type="button" aria-label={`Clear color ${index + 1}`} disabled={!color.hex && !color.label} onClick={() => update(index, { hex: '', label: '' })} className={cx('flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-30 dark:hover:bg-red-400/10', focusRing)}>
                  <Eraser className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          )
        })}
      </ul>
      <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3 dark:border-white/[0.06]">
        <Button variant="ghost" disabled={!dirty || saving} onClick={() => setColors(padded(project.brandColors))}>
          Discard
        </Button>
        <Button variant="primary" loading={saving} disabled={!dirty || invalid} onClick={() => onSave(colors.map(c => ({ label: c.label.trim(), hex: c.hex ? normalizeHex(c.hex) : '' })))}>
          Save colors
        </Button>
      </div>
    </Card>
  )
}
