'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import {
  ArrowRight,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Code2,
  Compass,
  Globe2,
  Languages,
  Megaphone,
  Palette
} from 'lucide-react'
import TestimonialsSection from '@/components/TestimonialsSection'
import BottomCta from '@/components/BottomCta'
import AnimatedHeroGraphic from '@/components/AnimatedHeroGraphic'

const fadeInUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: 'easeOut' as const } }
}

const processSteps = [
  {
    title: 'Discovery & strategy',
    body: 'We clarify goals, audiences, offers, and constraints before design begins. You leave with a practical direction, not a vague moodboard.',
    icon: Compass,
    color: 'var(--brand-gold)'
  },
  {
    title: 'Messaging & marketing',
    body: 'We shape the story, calls to action, and conversion path around what customers need to understand. This gives every page a clear job.',
    icon: Megaphone,
    color: 'var(--brand-blue)'
  },
  {
    title: 'Design direction',
    body: 'We create a visual system that feels premium, useful, and aligned with your brand. The result is polished without becoming decorative noise.',
    icon: Palette,
    color: 'var(--brand-purple)'
  },
  {
    title: 'Build & launch',
    body: 'We develop the site in Next.js, test the important flows, and prepare it for a stable launch. After launch, small improvements stay easy.',
    icon: Code2,
    color: 'var(--brand-blue)'
  }
]

const projects = [
  {
    href: 'https://rombonord.com/it/',
    shot: '/work-rombonord.webp',
    category: 'Hospitality',
    title: 'Rombo Nord',
    body: 'Bilingual site for a seaside restaurant and cocktail bar in Genova Pegli.',
    color: '#0a1f44'
  },
  {
    href: 'https://le-camelie.com/',
    shot: '/work-lecamelie.webp',
    category: 'Guesthouse',
    title: 'Le Camelie',
    body: 'Conversion-focused property site for a guesthouse in central Genova.',
    color: '#385948'
  },
  {
    href: 'https://gjergj-jozef-kola.com/',
    shot: '/work-gjergj.webp',
    category: 'Author portfolio',
    title: 'Gjergj Jozef Kola',
    body: 'Multilingual author website with biography, books, and contact paths.',
    color: '#A36124'
  },
  {
    href: 'https://consteam.eu/',
    shot: '/work-consteam.webp',
    category: 'Local services',
    title: 'Consteam',
    body: 'Multi-page website for cleaning and maintenance services.',
    color: '#FFBF43'
  },
  {
    href: 'https://yourassistinitaly.it/',
    shot: '/work-yourassist.webp',
    category: 'Expat services',
    title: 'Your Assist in Italy',
    body: 'Bilingual consulting site for immigration and relocation support.',
    color: '#DC2626'
  }
]

export default function HomeClient() {
  const [projectIndex, setProjectIndex] = useState(0)

  const scrollProjects = (direction: 'prev' | 'next') => {
    setProjectIndex(current => {
      const offset = direction === 'next' ? 1 : -1
      return (current + offset + projects.length) % projects.length
    })
  }

  return (
    <main className="bg-stone-50 dark:bg-slate-950/95">
      <section className="relative overflow-hidden bg-stone-50 dark:bg-slate-950/95">
        <div className="relative z-10 mx-auto grid min-h-[88vh] max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10 lg:px-10 lg:py-20">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' as const }}
            className="text-center lg:text-left"
          >
            <div className="mb-7 inline-flex items-center gap-2.5 rounded-full border border-slate-200/80 bg-white/85 px-4 py-2 shadow-sm backdrop-blur-md dark:border-white/10 dark:bg-white/5">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--brand-gold)]" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-300/90">
                Based in Italy. Working across Europe
              </span>
            </div>

            <h1 className="text-[2.7rem] font-bold leading-[1.03] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] xl:text-[4rem] dark:text-white">
              Premium websites for{' '}
              <span className="italic text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">ambitious brands.</span>
            </h1>

            <p className="mx-auto mt-6 max-w-xl text-base leading-relaxed text-slate-500 sm:text-lg lg:mx-0 dark:text-slate-300/75">
              Strategy, marketing, design, and Next.js development for brands that want to look sharper, communicate clearly, and convert better.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-4 lg:justify-start">
              <Link href="/work" className="inline-flex items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-8 py-3.5 text-sm font-semibold text-white shadow-[0_10px_30px_rgba(15,23,42,0.08)] transition-all hover:-translate-y-0.5 hover:border-slate-700 hover:bg-slate-800 dark:border-white/20 dark:bg-transparent dark:text-white dark:shadow-none dark:hover:border-[var(--brand-gold)]/55 dark:hover:bg-white/[0.06]">
                View our work
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/contact" className="rounded-full border border-slate-300 bg-white/85 px-8 py-3.5 text-sm font-medium text-slate-700 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-[var(--brand-gold)] dark:border-white/15 dark:bg-white/5 dark:text-slate-200 dark:hover:border-[var(--brand-gold)]/60">
                Book a call
              </Link>
            </div>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 lg:justify-start">
              {[
                { icon: Languages, label: 'Italian & English' },
                { icon: CheckCircle2, label: 'Strategy to launch' },
                { icon: Code2, label: 'React / Next.js' },
                { icon: Globe2, label: 'EU-friendly' }
              ].map(item => (
                <div key={item.label} className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
                  <item.icon className="h-4 w-4 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />
                  <span>{item.label}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="flex items-center justify-center lg:justify-end">
            <AnimatedHeroGraphic />
          </div>
        </div>
      </section>

      <motion.section
        className="bg-stone-50 dark:bg-slate-950/95"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mb-12">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
              Process
            </p>
            <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white">
              A simple four-step process.
            </h2>
            <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
              No endless calls, no messy handovers. Just a clear path from idea to launch.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {processSteps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.03] dark:shadow-none dark:hover:border-white/20"
              >
                <span className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
                  <step.icon className="h-5 w-5" style={{ color: step.color }} />
                </span>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">0{i + 1}</p>
                <h3 className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300/80">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.section>

      <motion.section
        className="bg-stone-50 dark:bg-slate-950/95"
        variants={fadeInUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.25 }}
      >
        <div className="mx-auto max-w-6xl px-4 py-20 md:py-28">
          <div className="mb-10 flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
                Featured work
              </p>
              <h2 className="font-display text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-[2.75rem] dark:text-white">
                A snapshot of what we build.
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
                Real projects across hospitality, local business, publishing, and professional services.
              </p>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
            <div className="flex transition-transform duration-500 ease-out" style={{ transform: `translateX(-${projectIndex * 100}%)` }}>
              {projects.map(project => (
                <div
                  key={project.title}
                  className="grid min-w-full cursor-default md:grid-cols-[1.35fr_0.65fr]"
                  style={{ ['--project-color' as string]: project.color }}
                >
                  <Link
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group/image relative aspect-[16/10] cursor-pointer overflow-hidden bg-slate-100 md:aspect-[16/9] dark:bg-slate-900"
                  >
                    <Image
                      src={project.shot}
                      alt={`${project.title} website`}
                      fill
                      sizes="(max-width: 768px) 100vw, 780px"
                      className="object-cover object-top transition-transform duration-700 group-hover/image:scale-[1.025]"
                    />
                  </Link>
                  <div className="flex flex-col justify-center p-6">
                    <div className="mb-4 h-1 w-12 rounded-full" style={{ backgroundColor: project.color }} />
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{project.category}</p>
                    <h3 className="mt-2 font-display text-2xl font-semibold text-slate-900 dark:text-slate-50">{project.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-slate-500 dark:text-slate-300/80">{project.body}</p>
                    <Link href={project.href} target="_blank" rel="noopener noreferrer" className="mt-5 inline-flex w-fit cursor-pointer items-center gap-2 text-sm font-medium text-slate-700 transition-colors hover:text-[var(--brand-blue)] dark:text-slate-200 dark:hover:text-[var(--brand-gold)]">
                      View project
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
            <button type="button" aria-label="Previous projects" onClick={() => scrollProjects('prev')} className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-sm transition hover:-translate-x-0.5 hover:border-[var(--brand-gold)] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/35 dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-100 dark:hover:bg-slate-900">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Next projects" onClick={() => scrollProjects('next')} className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full border border-slate-200 bg-white/95 text-slate-700 shadow-sm transition hover:translate-x-0.5 hover:border-[var(--brand-gold)] hover:bg-white focus:outline-none focus:ring-2 focus:ring-[var(--brand-gold)]/35 dark:border-white/10 dark:bg-slate-950/90 dark:text-slate-100 dark:hover:bg-slate-900">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <Link href="/work" className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-[var(--brand-blue)] hover:text-blue-500 dark:text-[var(--brand-gold)] dark:hover:text-yellow-300">
            See more projects
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </motion.section>

      <TestimonialsSection />
      <BottomCta />
    </main>
  )
}
