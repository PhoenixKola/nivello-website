'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

const ease = 'easeInOut' as const

const layers = [
  {
    src: '/hero-layer-08-mesh-glow.png',
    className: 'left-[50%] top-[32%] w-[34%] opacity-45',
    animate: { x: [-4, 0, -4], y: [6, 0, 6], scale: [1, 0.94, 1], opacity: [0.55, 0.34, 0.55] },
    transition: { duration: 12, repeat: Infinity, ease }
  },
  {
    src: '/hero-layer-06-grid-cube-platform.png',
    className: 'left-[3%] top-[24%] w-[90%] opacity-78',
    animate: { rotate: [0, 180, 360], scale: [1, 0.92, 1] },
    transition: { duration: 26, repeat: Infinity, ease: 'linear' as const }
  },
  {
    src: '/hero-layer-07-orbit-rings.png',
    className: 'left-[15%] top-[54%] w-[68%]',
    animate: { x: [0, 2, 0], y: [0, -6, 0], scale: [1, 0.94, 1] },
    transition: { duration: 8.8, repeat: Infinity, ease }
  },
  {
    src: '/hero-layer-02-analytics-card.png',
    className: 'left-[21%] top-[2%] w-[52%]',
    animate: { x: [0, 12, 0], y: [0, 34, 0], rotate: [0.8, -1.4, 0.8], scale: [1, 0.82, 1] },
    transition: { duration: 8.2, repeat: Infinity, ease }
  },
  {
    src: '/hero-layer-03-back-glass-panel.png',
    className: 'left-[39%] top-[13%] w-[46%]',
    animate: { x: [0, -15, 0], y: [-2, 25, -2], rotate: [-1, 1.2, -1], scale: [1, 0.88, 1] },
    transition: { duration: 8.2, repeat: Infinity, ease }
  },
  {
    src: '/hero-layer-01-n-logo.png',
    className: 'left-[19%] top-[25%] w-[64%] z-10',
    animate: { x: [0, 1, 0], y: [-1, 2, -1], rotate: [0.2, 0, 0.2], scale: [1.02, 0.99, 1.02] },
    transition: { duration: 8.2, repeat: Infinity, ease }
  },
  {
    src: '/hero-layer-04-wave-panel.png',
    className: 'left-[7%] top-[36%] w-[39%] z-20',
    animate: { x: [-10, 28, 4, -10], y: [-16, 10, 14, -16], rotate: [-2.4, 2, -0.4, -2.4], scale: [1, 0.78, 0.9, 1] },
    transition: { duration: 6.8, repeat: Infinity, ease }
  },
  {
    src: '/hero-layer-05-code-card-cursor.png',
    className: 'left-[57%] top-[37%] w-[38%] z-20',
    animate: { x: [11, -28, -4, 11], y: [-18, 11, 15, -18], rotate: [2.6, -2, 0.7, 2.6], scale: [1, 0.78, 0.9, 1] },
    transition: { duration: 6.6, repeat: Infinity, ease }
  }
]

const nodes = [
  { className: 'left-[17%] top-[39%] bg-[var(--brand-gold)]', delay: 0 },
  { className: 'left-[77%] top-[35%] bg-[var(--brand-blue)]', delay: 0.5 },
  { className: 'left-[68%] top-[66%] bg-[var(--brand-purple)]', delay: 1 }
]

export default function AnimatedHeroGraphic() {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none relative mx-auto aspect-[4/5] w-full max-w-[350px] transform-gpu sm:max-w-[400px] lg:mr-0 lg:max-w-[500px]"
      initial={{ opacity: 0, scale: 0.9, y: 24 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' as const, delay: 0.08 }}
    >
      <motion.div
        className="absolute left-[18%] top-[18%] h-[58%] w-[64%] rounded-full border border-[var(--brand-blue)]/20 dark:border-[var(--brand-blue)]/30"
        animate={reducedMotion ? undefined : { rotate: [0, 360], scale: [1, 0.94, 1] }}
        transition={reducedMotion ? undefined : { duration: 22, repeat: Infinity, ease: 'linear' as const }}
      />
      <motion.div
        className="absolute left-[10%] top-[27%] h-[48%] w-[80%] rotate-[-16deg] rounded-full border border-[var(--brand-gold)]/18 dark:border-[var(--brand-gold)]/25"
        animate={reducedMotion ? undefined : { rotate: [-16, -376], scale: [1, 0.95, 1] }}
        transition={reducedMotion ? undefined : { duration: 28, repeat: Infinity, ease: 'linear' as const }}
      />
      <motion.div
        className="absolute left-[24%] top-[23%] h-[45%] w-[54%] rotate-[24deg] rounded-full border border-[var(--brand-purple)]/18 dark:border-[var(--brand-purple)]/28"
        animate={reducedMotion ? undefined : { rotate: [24, 384], opacity: [0.72, 0.38, 0.72] }}
        transition={reducedMotion ? undefined : { duration: 18, repeat: Infinity, ease: 'linear' as const }}
      />

      <div className="absolute left-[22%] top-[49%] h-px w-[56%] bg-[var(--brand-blue)]/25 dark:bg-[var(--brand-blue)]/35" />
      <div className="absolute left-[33%] top-[31%] h-[42%] w-px rotate-[18deg] bg-[var(--brand-gold)]/20 dark:bg-[var(--brand-gold)]/30" />

      {nodes.map(node => (
        <motion.span
          key={node.className}
          className={`absolute h-2 w-2 rounded-full shadow-[0_0_18px_currentColor] ${node.className}`}
          animate={reducedMotion ? undefined : { scale: [0.7, 1.35, 0.7], opacity: [0.35, 1, 0.35] }}
          transition={reducedMotion ? undefined : { duration: 2.8, repeat: Infinity, delay: node.delay, ease }}
        />
      ))}

      {layers.map(layer => (
        <motion.div
          key={layer.src}
          className={`absolute transform-gpu ${layer.className}`}
          animate={reducedMotion ? undefined : layer.animate}
          transition={reducedMotion ? undefined : layer.transition}
        >
          <Image
            src={layer.src}
            alt=""
            width={1254}
            height={1254}
            priority
            sizes="(max-width: 640px) 350px, (max-width: 1024px) 400px, 500px"
            className="h-auto w-full select-none object-contain drop-shadow-[0_22px_60px_rgba(15,23,42,0.14)] dark:drop-shadow-[0_22px_70px_rgba(0,0,0,0.35)]"
            draggable={false}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
