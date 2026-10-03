'use client'

import Image from 'next/image'
import { useRef, useState, type PointerEvent } from 'react'
import { motion, useInView, useMotionValue, useReducedMotion, useSpring, useTransform } from 'framer-motion'
import type { Locale } from '@/lib/site'

const copy = {
  en: {
    website: 'Public website',
    software: 'Business software',
    layers: ['Structure', 'Interface', 'Media', 'Code']
  },
  it: {
    website: 'Sito pubblico',
    software: 'Software gestionale',
    layers: ['Struttura', 'Interfaccia', 'Media', 'Codice']
  }
} satisfies Record<Locale, { website: string; software: string; layers: string[] }>

type Focus = 'website' | 'software' | null

export default function AnimatedHeroGraphic({ locale }: { locale: Locale }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const isInView = useInView(rootRef, { amount: 0.15 })
  const [focus, setFocus] = useState<Focus>(null)
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const smoothX = useSpring(pointerX, { stiffness: 90, damping: 22, mass: 0.5 })
  const smoothY = useSpring(pointerY, { stiffness: 90, damping: 22, mass: 0.5 })
  const rotateY = useTransform(smoothX, [-1, 1], [-2.5, 2.5])
  const rotateX = useTransform(smoothY, [-1, 1], [1.5, -1.5])
  const t = copy[locale]

  function handlePointerMove(event: PointerEvent<HTMLDivElement>) {
    if (reducedMotion || !isInView || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const x = (event.clientX - bounds.left) / bounds.width
    const y = (event.clientY - bounds.top) / bounds.height
    pointerX.set((x - 0.5) * 2)
    pointerY.set((y - 0.5) * 2)
    setFocus(x < 0.46 ? 'website' : x > 0.54 ? 'software' : null)
  }

  function resetPointer() {
    pointerX.set(0)
    pointerY.set(0)
    setFocus(null)
  }

  const instant = reducedMotion ? 0 : undefined

  return (
    <div
      ref={rootRef}
      aria-hidden="true"
      className="dnse-stage relative mx-auto w-full max-w-[680px]"
      data-focus={focus ?? 'core'}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetPointer}
    >
      <motion.div
        className="dnse-scene relative h-full w-full"
        style={reducedMotion ? undefined : { rotateX, rotateY }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: instant ?? 0.35 }}
      >
        <div className="dnse-grid" />
        <motion.div
          className="dnse-baseline"
          initial={{ scaleX: reducedMotion ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: instant ?? 0.8, delay: reducedMotion ? 0 : 0.25, ease: [0.22, 1, 0.36, 1] }}
        />

        <div className="dnse-output-position dnse-output-position--website">
          <motion.div
            className="dnse-output dnse-output--website"
            initial={reducedMotion ? false : { opacity: 0, x: 72, y: 16, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            transition={{ duration: instant ?? 0.9, delay: reducedMotion ? 0 : 1.28, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="dnse-output-depth">
              <div className="dnse-surface-bar"><i /><i /><i /><span>progreen.it</span></div>
              <Image
                src="/work-progreen-live.webp"
                alt=""
                width={1600}
                height={900}
                priority
                sizes="(max-width: 640px) 260px, (max-width: 1024px) 330px, 360px"
                className="h-auto w-full select-none"
                draggable={false}
              />
              <span className="dnse-output-label">{t.website}</span>
            </div>
          </motion.div>
        </div>

        <div className="dnse-output-position dnse-output-position--software">
          <motion.div
            className="dnse-output dnse-output--software"
            initial={reducedMotion ? false : { opacity: 0, x: -72, y: -16, scale: 0.92 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            transition={{ duration: instant ?? 0.9, delay: reducedMotion ? 0 : 1.62, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="dnse-output-depth">
              <div className="dnse-surface-bar dnse-surface-bar--software"><span>OPERATIONS / PROGREEN</span><b /></div>
              <Image
                src="/work-progreen-app-redacted.webp"
                alt=""
                width={1812}
                height={868}
                priority
                sizes="(max-width: 640px) 260px, (max-width: 1024px) 330px, 370px"
                className="h-auto w-full select-none"
                draggable={false}
              />
              <span className="dnse-output-label">{t.software}</span>
            </div>
          </motion.div>
        </div>

        <motion.div
          className="dnse-connector dnse-connector--left"
          initial={{ scaleX: reducedMotion ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: instant ?? 0.55, delay: reducedMotion ? 0 : 1.06, ease: [0.22, 1, 0.36, 1] }}
        />
        <motion.div
          className="dnse-connector dnse-connector--right"
          initial={{ scaleX: reducedMotion ? 1 : 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: instant ?? 0.55, delay: reducedMotion ? 0 : 1.26, ease: [0.22, 1, 0.36, 1] }}
        />

        <motion.div
          className="dnse-core"
          initial={reducedMotion ? false : { opacity: 0, scale: 0.7, rotateY: 44 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0 }}
          transition={{ duration: instant ?? 0.75, delay: reducedMotion ? 0 : 0.16, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="dnse-core-frame">
            <motion.div
              className="dnse-core-logo"
              initial={reducedMotion ? false : { clipPath: 'inset(0 100% 0 0)' }}
              animate={{ clipPath: 'inset(0 0% 0 0)' }}
              transition={{ duration: instant ?? 0.7, delay: reducedMotion ? 0 : 0.38, ease: [0.22, 1, 0.36, 1] }}
            >
              <Image src="/nivello-logo-text-light.svg" alt="" width={210} height={60} className="h-auto w-full dark:hidden" draggable={false} />
              <Image src="/nivello-logo-text.svg" alt="" width={210} height={60} className="hidden h-auto w-full dark:block" draggable={false} />
            </motion.div>
          </div>
        </motion.div>

        <div className="dnse-layer-stack">
          {t.layers.map((label, index) => (
            <motion.div
              key={label}
              className={`dnse-layer dnse-layer--${index + 1}`}
              initial={reducedMotion ? false : { opacity: 0, x: index % 2 ? 96 : -96, scaleX: 0.25 }}
              animate={{ opacity: 1, x: 0, scaleX: 1 }}
              transition={{ duration: instant ?? 0.55, delay: reducedMotion ? 0 : 0.55 + index * 0.13, ease: [0.22, 1, 0.36, 1] }}
            >
              <span>{label}</span>
            </motion.div>
          ))}
        </div>

        <motion.div
          className="dnse-lock dnse-lock--left"
          initial={{ opacity: reducedMotion ? 1 : 0, scale: reducedMotion ? 1 : 1.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: instant ?? 0.25, delay: reducedMotion ? 0 : 2.08 }}
        />
        <motion.div
          className="dnse-lock dnse-lock--right"
          initial={{ opacity: reducedMotion ? 1 : 0, scale: reducedMotion ? 1 : 1.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: instant ?? 0.25, delay: reducedMotion ? 0 : 2.22 }}
        />
      </motion.div>
    </div>
  )
}
