'use client'

import { motion, useReducedMotion } from 'framer-motion'

type RevealProps = {
  as?: 'div' | 'li'
  delay?: number
  className?: string
  children: React.ReactNode
}

// Scroll-triggered fade for otherwise server-rendered content.
export default function Reveal({ as = 'div', delay = 0, className, children }: RevealProps) {
  const reducedMotion = useReducedMotion()
  const Component = as === 'li' ? motion.li : motion.div

  return (
    <Component
      className={className}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={reducedMotion ? { duration: 0 } : { duration: 0.5, delay }}
    >
      {children}
    </Component>
  )
}
