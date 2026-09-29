'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import Image from 'next/image'
import { motion, useMotionValue, useReducedMotion, useSpring, useTransform, type Transition } from 'framer-motion'

/**
 * Nivello Build Engine — the homepage hero stage.
 *
 * One choreography, run once on load: ASSEMBLE -> CONNECT -> RESOLVE -> SETTLE.
 * Guides draw the build area, two real product fragments (a layout skeleton and
 * a code block) lock onto them, connectors resolve into the centre, and the
 * Nivello mark locks in. After ~1.6s nothing moves again except an optional,
 * heavily restrained pointer parallax on fine-pointer devices.
 *
 * Geometry is scale-invariant: the surfaces carry fixed aspect ratios and
 * percentage-based internals, so the SVG connectors meet their edges at every
 * breakpoint instead of drifting as the stage shrinks.
 *
 * Every element keeps a constant `initial` and always receives an `animate`
 * target: with prefers-reduced-motion the transitions collapse to 0s so the
 * resolved composition paints immediately, rather than being left at opacity 0.
 */

const EASE = [0.22, 0.61, 0.36, 1] as const
const SETTLE_MS = 1700
const PARALLAX_PX = 9

function subscribeToFinePointer(onChange: () => void) {
  const query = window.matchMedia('(pointer: fine)')
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}

const getFinePointer = () => window.matchMedia('(pointer: fine)').matches
const getFinePointerServer = () => false

export default function HeroBuildEngine() {
  const reducedMotion = useReducedMotion()
  const stageRef = useRef<HTMLDivElement>(null)
  const [settled, setSettled] = useState(false)
  const finePointer = useSyncExternalStore(subscribeToFinePointer, getFinePointer, getFinePointerServer)

  const step = (delay: number, duration: number): Transition =>
    reducedMotion ? { duration: 0 } : { duration, delay, ease: EASE }

  useEffect(() => {
    const timer = window.setTimeout(() => setSettled(true), reducedMotion ? 0 : SETTLE_MS)
    return () => window.clearTimeout(timer)
  }, [reducedMotion])

  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const springX = useSpring(pointerX, { stiffness: 110, damping: 20, mass: 0.4 })
  const springY = useSpring(pointerY, { stiffness: 110, damping: 20, mass: 0.4 })

  const guidesX = useTransform(springX, value => value * 0.3)
  const guidesY = useTransform(springY, value => value * 0.3)
  const markX = useTransform(springX, value => value * 0.6)
  const markY = useTransform(springY, value => value * 0.6)
  const panelX = useTransform(springX, value => value * 1.15)
  const panelY = useTransform(springY, value => value * 1.15)
  const codeX = useTransform(springX, value => value * 1.4)
  const codeY = useTransform(springY, value => value * 1.4)

  const parallaxOn = settled && finePointer && !reducedMotion

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!parallaxOn || !stageRef.current) return

    const rect = stageRef.current.getBoundingClientRect()
    pointerX.set(((event.clientX - rect.left) / rect.width - 0.5) * PARALLAX_PX)
    pointerY.set(((event.clientY - rect.top) / rect.height - 0.5) * PARALLAX_PX)
  }

  const resetPointer = () => {
    pointerX.set(0)
    pointerY.set(0)
  }

  const surface =
    'rounded-xl border border-slate-200 bg-white shadow-[0_18px_40px_-28px_rgba(15,23,42,0.45)] dark:border-white/12 dark:bg-slate-900/85 dark:shadow-[0_18px_40px_-24px_rgba(0,0,0,0.85)]'
  const bar = 'block rounded-full'

  return (
    <div
      ref={stageRef}
      aria-hidden="true"
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
      className="relative mx-auto aspect-square w-full max-w-[330px] select-none sm:max-w-[420px] lg:mr-0 lg:max-w-[520px]"
    >
      {/* ── Stage 1: structure — grid, brackets, ticks ── */}
      <motion.svg
        viewBox="0 0 400 400"
        fill="none"
        className="absolute inset-0 h-full w-full"
        style={{ x: guidesX, y: guidesY }}
      >
        {[100, 200, 300].map((offset, index) => (
          <g key={offset} className="stroke-slate-400/30 dark:stroke-white/10" strokeWidth="1">
            <motion.line
              x1={offset}
              y1="14"
              x2={offset}
              y2="386"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={step(0.04 + index * 0.05, 0.4)}
            />
            <motion.line
              x1="14"
              y1={offset}
              x2="386"
              y2={offset}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={step(0.08 + index * 0.05, 0.4)}
            />
          </g>
        ))}

        {['M10 46 V10 H46', 'M354 10 H390 V46', 'M390 354 V390 H354', 'M46 390 H10 V354'].map((d, index) => (
          <motion.path
            key={d}
            d={d}
            strokeWidth="1.75"
            strokeLinecap="round"
            className="stroke-slate-400/70 dark:stroke-white/25"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={step(0.06 + index * 0.06, 0.45)}
          />
        ))}

        {Array.from({ length: 9 }).map((_, index) => (
          <motion.line
            key={`tick-${index}`}
            x1={228 + index * 20}
            y1="376"
            x2={228 + index * 20}
            y2={index % 2 === 0 ? 364 : 370}
            strokeWidth="1.5"
            strokeLinecap="round"
            className="stroke-slate-400/60 dark:stroke-white/20"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={step(0.5 + index * 0.025, 0.3)}
          />
        ))}

        {/* ── Stage 3: connectors resolve into the centre ── */}
        {/* layout skeleton -> mark (all breakpoints) */}
        <motion.path
          d="M100 166 V200 H134"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="stroke-[var(--brand-blue)]"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ pathLength: 1, opacity: 1 }}
          transition={step(0.95, 0.35)}
        />
        <motion.circle
          cx="100"
          cy="166"
          r="4.5"
          className="fill-[var(--brand-blue)]"
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={step(1.24, 0.3)}
          style={{ transformOrigin: '100px 166px' }}
        />

        {/* code fragment -> mark (hidden where the fragment is hidden) */}
        <g className="hidden sm:block">
          <motion.path
            d="M300 272 V200 H266"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="stroke-[var(--brand-purple)] dark:stroke-[var(--brand-gold)]"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={step(1.05, 0.35)}
          />
          <motion.circle
            cx="300"
            cy="272"
            r="4.5"
            className="fill-[var(--brand-purple)] dark:fill-[var(--brand-gold)]"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={step(1.32, 0.3)}
            style={{ transformOrigin: '300px 272px' }}
          />
        </g>

        {/* ── Stage 4: lock brackets clamp the mark ── */}
        {['M138 164 V138 H164', 'M236 138 H262 V164', 'M262 236 V262 H236', 'M164 262 H138 V236'].map((d, index) => (
          <motion.path
            key={d}
            d={d}
            strokeWidth="2"
            strokeLinecap="round"
            className="stroke-[var(--brand-gold)]"
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            transition={step(1.3 + index * 0.05, 0.35)}
          />
        ))}
      </motion.svg>

      {/* ── Stage 2: interface — layout skeleton ── */}
      <motion.div
        className={`absolute left-[3%] top-[7%] aspect-[16/11] w-[50%] overflow-hidden ${surface}`}
        style={{ x: panelX, y: panelY }}
        initial={{ opacity: 0, y: -10, clipPath: 'inset(0 0 100% 0)' }}
        animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
        transition={step(0.42, 0.5)}
      >
        <div className="flex h-[20%] items-center gap-[3%] border-b border-slate-200 px-[5%] dark:border-white/10">
          <span className="aspect-square h-[26%] rounded-full bg-slate-300 dark:bg-slate-600" />
          <span className="aspect-square h-[26%] rounded-full bg-slate-300 dark:bg-slate-600" />
          <span className="aspect-square h-[26%] rounded-full bg-slate-300 dark:bg-slate-600" />
          <span className="ml-[4%] h-[20%] w-[42%] rounded-full bg-slate-200 dark:bg-slate-700/70" />
        </div>

        <div className="flex h-[80%] flex-col justify-between p-[6%]">
          {[
            { h: 'h-[9%]', w: 'w-[72%]', tone: 'bg-slate-300 dark:bg-slate-600' },
            { h: 'h-[6%]', w: 'w-[90%]', tone: 'bg-slate-200 dark:bg-slate-700/70' },
            { h: 'h-[6%]', w: 'w-[64%]', tone: 'bg-slate-200 dark:bg-slate-700/70' }
          ].map((line, index) => (
            <motion.span
              key={line.w}
              className={`${bar} ${line.h} ${line.w} ${line.tone}`}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={step(0.6 + index * 0.07, 0.35)}
              style={{ transformOrigin: 'left center' }}
            />
          ))}

          <div className="grid h-[30%] grid-cols-2 gap-[5%]">
            {[0, 1].map(index => (
              <motion.span
                key={index}
                className={`block h-full rounded-md ${
                  index === 0
                    ? 'bg-[var(--brand-blue)]/85'
                    : 'bg-slate-100 ring-1 ring-slate-200 dark:bg-white/[0.06] dark:ring-white/10'
                }`}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={step(0.8 + index * 0.08, 0.35)}
              />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Stage 2b: interface — code fragment (sm and up) ── */}
      <motion.div
        className={`absolute left-[52%] top-[68%] hidden aspect-[16/7] w-[46%] overflow-hidden sm:block ${surface}`}
        style={{ x: codeX, y: codeY }}
        initial={{ opacity: 0, y: 12, clipPath: 'inset(0 0 100% 0)' }}
        animate={{ opacity: 1, y: 0, clipPath: 'inset(0 0 0% 0)' }}
        transition={step(0.62, 0.5)}
      >
        <div className="flex h-[30%] items-center gap-[4%] border-b border-slate-200 px-[5%] dark:border-white/10">
          <span className="font-mono text-[9px] font-semibold leading-none text-[var(--brand-blue)] lg:text-[11px] dark:text-[var(--brand-gold)]">
            &lt;/&gt;
          </span>
          <span className="h-[16%] w-[26%] rounded-full bg-slate-200 dark:bg-slate-700/70" />
        </div>

        <div className="flex h-[70%] flex-col justify-between p-[5%]">
          {[
            { indent: 'ml-0', width: 'w-[66%]', tone: 'bg-slate-300 dark:bg-slate-600' },
            { indent: 'ml-[8%]', width: 'w-[52%]', tone: 'bg-[var(--brand-purple)]/70 dark:bg-[var(--brand-gold)]/70' },
            { indent: 'ml-[8%]', width: 'w-[74%]', tone: 'bg-slate-200 dark:bg-slate-700/70' },
            { indent: 'ml-0', width: 'w-[38%]', tone: 'bg-slate-200 dark:bg-slate-700/70' }
          ].map((line, index) => (
            <motion.span
              key={line.width}
              className={`${bar} h-[11%] ${line.indent} ${line.width} ${line.tone}`}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={step(0.78 + index * 0.07, 0.32)}
              style={{ transformOrigin: 'left center' }}
            />
          ))}
        </div>
      </motion.div>

      {/* ── Stage 4: the Nivello mark locks into place ── */}
      <motion.div
        className="absolute left-1/2 top-1/2 w-[20%] -translate-x-1/2 -translate-y-1/2"
        style={{ x: markX, y: markY }}
        initial={{ opacity: 0, scale: 0.72 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={
          reducedMotion
            ? { duration: 0 }
            : { duration: 0.55, delay: 1.02, type: 'spring', stiffness: 220, damping: 16 }
        }
      >
        <Image
          src="/nivello-icon.png"
          alt=""
          width={256}
          height={256}
          sizes="(max-width: 640px) 66px, (max-width: 1024px) 84px, 104px"
          className="h-auto w-full"
          draggable={false}
        />
      </motion.div>

      {/* ── Resolved state ── */}
      <motion.div
        className="absolute bottom-[6%] left-[3%] inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 shadow-sm dark:border-white/12 dark:bg-slate-900/85 dark:shadow-none"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={step(1.42, 0.4)}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-300">
          Live
        </span>
      </motion.div>
    </div>
  )
}
