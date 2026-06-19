'use client'

import Image from 'next/image'
import { motion, useReducedMotion } from 'framer-motion'

const layers = [
  {
    src: '/hero-layer-08-mesh-glow.png',
    className: 'left-[50%] top-[34%] w-[36%] opacity-52',
    animate: { x: [-3, 0, -3], y: [5, 0, 5], scale: [1.01, 0.96, 1.01], opacity: [0.58, 0.4, 0.58] },
    transition: { duration: 12, repeat: Infinity, ease: 'easeInOut' as const }
  },
  {
    src: '/hero-layer-06-grid-cube-platform.png',
    className: 'left-[3%] top-[20%] w-[88%] opacity-74',
    animate: { rotate: [0, 180, 360], scale: [1, 0.94, 1] },
    transition: { duration: 24, repeat: Infinity, ease: 'linear' as const }
  },
  {
    src: '/hero-layer-07-orbit-rings.png',
    className: 'left-[14%] top-[47%] w-[70%]',
    animate: { y: [0, 10, 0], x: [2, 0, 2], scale: [1, 0.92, 1] },
    transition: { duration: 8.8, repeat: Infinity, ease: 'easeInOut' as const }
  },
  {
    src: '/hero-layer-02-analytics-card.png',
    className: 'left-[20%] top-[3%] w-[54%]',
    animate: { x: [0, 14, 0], y: [0, 30, 0], rotate: [0.8, -1, 0.8], scale: [1, 0.86, 1] },
    transition: { duration: 8.6, repeat: Infinity, ease: 'easeInOut' as const }
  },
  {
    src: '/hero-layer-03-back-glass-panel.png',
    className: 'left-[37%] top-[14%] w-[49%]',
    animate: { x: [0, -10, 0], y: [-3, 20, -3], rotate: [-0.8, 1, -0.8], scale: [1, 0.9, 1] },
    transition: { duration: 8.2, repeat: Infinity, ease: 'easeInOut' as const }
  },
  {
    src: '/hero-layer-01-n-logo.png',
    className: 'left-[19%] top-[24%] w-[64%]',
    animate: { x: [1.2, 0, 1.2], y: [-2, 3, -2], rotate: [0.25, 0, 0.25], scale: [1.01, 0.985, 1.01] },
    transition: { duration: 8.8, repeat: Infinity, ease: 'easeInOut' as const }
  },
  {
    src: '/hero-layer-04-wave-panel.png',
    className: 'left-[7%] top-[35%] w-[40%]',
    animate: { x: [-8, 30, 8, -8], y: [-14, 12, 10, -14], rotate: [-2, 1.8, -0.5, -2], scale: [1, 0.82, 0.92, 1] },
    transition: { duration: 7.2, repeat: Infinity, ease: 'easeInOut' as const }
  },
  {
    src: '/hero-layer-05-code-card-cursor.png',
    className: 'left-[56%] top-[39%] w-[38%]',
    animate: { x: [10, -30, -4, 10], y: [-18, 10, 14, -18], rotate: [2.4, -1.8, 0.7, 2.4], scale: [1, 0.82, 0.9, 1] },
    transition: { duration: 7.1, repeat: Infinity, ease: 'easeInOut' as const }
  }
]

export default function AnimatedHeroGraphic() {
  const reducedMotion = useReducedMotion()

  return (
    <motion.div
      aria-hidden="true"
      className="pointer-events-none relative mx-auto aspect-[4/5] w-full max-w-[340px] transform-gpu sm:max-w-[390px] lg:mr-0 lg:max-w-[490px]"
      initial={{ opacity: 0, scale: 0.94, y: 28 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.75, ease: 'easeOut' as const, delay: 0.1 }}
    >
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
            sizes="(max-width: 640px) 340px, (max-width: 1024px) 390px, 490px"
            className="h-auto w-full select-none object-contain drop-shadow-[0_22px_60px_rgba(15,23,42,0.14)] dark:drop-shadow-[0_22px_70px_rgba(0,0,0,0.35)]"
            draggable={false}
          />
        </motion.div>
      ))}
    </motion.div>
  )
}
