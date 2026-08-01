'use client'

import { motion, useReducedMotion } from 'framer-motion'

/**
 * Decorative hero graphic for the contact page.
 *
 * Plays once on load: a message is written line by line, folds into an
 * envelope that draws itself, the flap seals, and the whole thing lifts off
 * with a "sent" check. Every element shares TOTAL so the phases line up, and
 * every keyframe track ends on its settled value so the graphic holds the
 * finished frame instead of clearing itself.
 *
 * With prefers-reduced-motion the same elements snap straight to that final
 * frame, so the graphic is never left blank.
 */
const TOTAL = 4.8

const barWidths = [104, 122, 86, 58]

export default function MessageSendAnimation() {
  const reducedMotion = useReducedMotion()

  // Keyframes for motion, a single settled value when motion is reduced.
  const kf = (frames: number[], still: number) => (reducedMotion ? still : frames)
  const tr = (times: number[]) =>
    reducedMotion ? { duration: 0 } : { duration: TOTAL, times, ease: 'easeInOut' as const }
  const fadeIn = (delay: number) =>
    reducedMotion ? { duration: 0 } : { duration: 1.1, delay, ease: 'easeOut' as const }

  const accent = '[stroke:var(--brand-blue)] dark:[stroke:var(--brand-gold)]'

  return (
    <div className="relative mx-auto w-full max-w-[300px] sm:max-w-[380px] lg:max-w-[440px]">
      {/* ambient glow behind the graphic */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-full bg-[var(--brand-blue)]/15 blur-[90px] dark:bg-[var(--brand-gold)]/15"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.7 }}
        transition={fadeIn(0.1)}
      />

      <svg viewBox="0 0 360 300" className="relative w-full" aria-hidden="true" fill="none">
        {/* soft ring */}
        <motion.circle
          cx="180"
          cy="168"
          r="118"
          strokeWidth="1"
          strokeOpacity="0.22"
          className={accent}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={fadeIn(0.25)}
        />

        {/* ── the letter (behind the envelope body, so it slides "into" it) ── */}
        <motion.g
          initial={{ opacity: 0, y: 0, scale: 1 }}
          animate={{
            opacity: kf([0, 0, 1, 1, 0, 0], 0),
            y: kf([0, 0, 0, 104, 104], 104),
            scale: kf([1, 1, 1, 0.82, 0.82], 0.82)
          }}
          transition={{
            opacity: tr([0, 0.2, 0.28, 0.56, 0.64, 1]),
            y: tr([0, 0.2, 0.5, 0.63, 1]),
            scale: tr([0, 0.2, 0.5, 0.63, 1])
          }}
          style={{ transformOrigin: '180px 90px' }}
        >
          <rect
            x="103"
            y="8"
            width="154"
            height="118"
            rx="12"
            strokeWidth="1.75"
            className="fill-white stroke-slate-200 dark:fill-slate-900 dark:stroke-slate-700"
          />
          {barWidths.map((width, index) => (
            <motion.rect
              key={width}
              x="121"
              y={32 + index * 21}
              width={width}
              height="8"
              rx="4"
              className={
                index === barWidths.length - 1
                  ? 'fill-[var(--brand-blue)] dark:fill-[var(--brand-gold)]'
                  : 'fill-slate-200 dark:fill-slate-600'
              }
              initial={{ scaleX: 0 }}
              animate={{ scaleX: kf([0, 0, 1, 1], 1) }}
              transition={{ scaleX: tr([0, 0.28 + index * 0.035, 0.36 + index * 0.035, 1]) }}
              style={{ transformOrigin: '121px 0' }}
            />
          ))}
        </motion.g>

        {/* ── envelope (lifts off once sealed) ── */}
        <motion.g
          initial={{ y: 0, rotate: 0 }}
          animate={{ y: kf([0, 0, -18, -18], -18), rotate: kf([0, 0, -3.5, -3.5], -3.5) }}
          transition={{ y: tr([0, 0.78, 0.9, 1]), rotate: tr([0, 0.78, 0.9, 1]) }}
          style={{ transformOrigin: '180px 185px' }}
        >
          {/* body — filled with the page background so the letter vanishes behind it */}
          <motion.rect
            x="68"
            y="112"
            width="224"
            height="148"
            rx="16"
            strokeWidth="2.25"
            className={`fill-stone-50 dark:fill-slate-950 ${accent}`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: kf([0, 0, 1, 1], 1), opacity: kf([0, 1, 1], 1) }}
            transition={{ pathLength: tr([0, 0.04, 0.26, 1]), opacity: tr([0, 0.05, 1]) }}
          />

          {/* open flap guides, visible while the letter is still outside */}
          <motion.path
            d="M68 128 L180 210 L292 128"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeOpacity="0.28"
            className={accent}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: kf([0, 0, 1, 1], 0), opacity: kf([0, 0, 1, 1, 0, 0], 0) }}
            transition={{ pathLength: tr([0, 0.24, 0.34, 1]), opacity: tr([0, 0.24, 0.34, 0.6, 0.68, 1]) }}
          />

          {/* sealed flap */}
          <motion.path
            d="M68 128 L180 210 L292 128"
            strokeWidth="2.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={accent}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: kf([0, 0, 1, 1], 1), opacity: kf([0, 0, 1, 1], 1) }}
            transition={{ pathLength: tr([0, 0.66, 0.78, 1]), opacity: tr([0, 0.65, 0.69, 1]) }}
          />
        </motion.g>

        {/* ── speed trail on lift-off ── */}
        {[0, 1, 2].map(index => (
          <motion.line
            key={index}
            x1="52"
            y1={150 + index * 26}
            x2="96"
            y2={150 + index * 26}
            strokeWidth="2.5"
            strokeLinecap="round"
            className={accent}
            initial={{ opacity: 0, x: 0 }}
            animate={{ opacity: kf([0, 0, 0.75, 0, 0], 0), x: kf([0, 10, -18, -44, -44], -44) }}
            transition={{
              opacity: tr([0, 0.79 + index * 0.02, 0.85 + index * 0.02, 0.95, 1]),
              x: tr([0, 0.79 + index * 0.02, 0.86 + index * 0.02, 0.96, 1])
            }}
          />
        ))}

        {/* ── "sent" check badge ── */}
        <motion.g
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: kf([0, 0, 1, 1], 1), scale: kf([0, 0, 1.18, 1, 1], 1) }}
          transition={{ opacity: tr([0, 0.85, 0.91, 1]), scale: tr([0, 0.85, 0.92, 0.96, 1]) }}
          style={{ transformOrigin: '276px 222px' }}
        >
          <circle cx="276" cy="222" r="26" className="fill-[var(--brand-blue)] dark:fill-[var(--brand-gold)]" />
          <path
            d="M264 222 L273 231 L289 214"
            strokeWidth="3.25"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="[stroke:#fff] dark:[stroke:#0f172a]"
          />
        </motion.g>

        {/* static accents */}
        {[
          { cx: 62, cy: 78, r: 4, delay: 0.35 },
          { cx: 306, cy: 96, r: 3, delay: 0.5 },
          { cx: 318, cy: 176, r: 2.5, delay: 0.65 }
        ].map(dot => (
          <motion.circle
            key={`${dot.cx}-${dot.cy}`}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            className="fill-[var(--brand-blue)] dark:fill-[var(--brand-gold)]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.55 }}
            transition={fadeIn(dot.delay)}
          />
        ))}
      </svg>
    </div>
  )
}
