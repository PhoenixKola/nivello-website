'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import Image from 'next/image'
import { ExternalLink } from 'lucide-react'

const projects = [
  { href: 'https://rombonord.com/it/', shot: '/work-rombonord.webp', category: 'Hospitality', title: 'Rombo Nord', desc: 'Sito bilingue per uno storico ristorante e cocktail bar sul mare a Pegli, con percorsi chiari verso menu, eventi e prenotazioni.', details: ['Menu drink e ristorante separati', 'Flusso prenotazione collegato al contatto', 'Visual atmosferici allineati al brand'], color: '#0a1f44' },
  { href: 'https://le-camelie.com/', shot: '/work-lecamelie.webp', category: 'Guesthouse', title: 'Le Camelie', desc: 'Sito compatto per una guesthouse nel centro di Genova, focalizzato su chiarezza, dettagli di comfort e conversioni verso booking engine.', details: ['Gallerie camere e servizi', 'Layout con segnali di fiducia', 'Call to action chiara verso prenotazione'], color: '#385948' },
  { href: 'https://gjergj-jozef-kola.com/', shot: '/work-gjergj.webp', category: 'Portfolio autore', title: 'Gjergj Jozef Kola', desc: 'Sito autore multilingua con piccolo shop, libri, biografia e contatti in un layout calmo e letterario.', details: ['Intro autore e libri in evidenza', 'Pagine libro pronte per e-commerce', 'Contatto per lettori e media'], color: '#A36124' },
  { href: 'https://consteam.eu/', shot: '/work-consteam.webp', category: 'Servizi locali', title: 'Consteam', desc: 'Sito multi-pagina responsive per un’azienda di pulizie e manutenzioni, con focus su servizi, contatti e fiducia.', details: ['Servizi organizzati per offerta', 'Form contatto e richiesta rapida', 'Layout professionale B2B e B2C'], color: '#FFBF43' },
  { href: 'https://yourassistinitaly.com/', shot: '/work-yourassist.webp', category: 'Servizi expat', title: 'Your Assist in Italy', desc: 'Sito bilingue per una consulenza immigrazione a Firenze, pensato per expat che devono orientarsi tra permessi e autorizzazioni.', details: ['Pagine servizio in inglese e italiano', 'Percorsi chiari per consulenza', 'FAQ e testimonianze per fiducia'], color: '#DC2626' }
]

export default function WorkItClient() {
  return (
    <main className="bg-stone-50 dark:bg-slate-950/95">
      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto max-w-7xl px-4 py-20 sm:px-6 md:py-28 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 28 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: 'easeOut' }} className="mb-10 max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-1.5 shadow-sm dark:border-slate-700/60 dark:bg-slate-900/70">
              <div className="h-1.5 w-1.5 rounded-full bg-[var(--brand-blue)]" />
              <span className="text-xs font-semibold uppercase tracking-[0.15em] text-slate-500 dark:text-slate-400">Lavori</span>
            </div>
            <h1 className="font-display text-[2.7rem] font-bold leading-[1.05] tracking-tight text-slate-900 sm:text-5xl lg:text-[3.4rem] dark:text-white">
              Progetti selezionati, costruiti per <span className="text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">apparire solidi</span> e funzionare con chiarezza.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-500 dark:text-slate-300/80">
              Progetti reali in hospitality, editoria, servizi locali e supporto expat. Ogni sito e progettato e sviluppato da Nivello, dalla strategia al lancio.
            </p>
          </motion.div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
            {projects.map((p, i) => (
              <motion.a key={p.title} href={`#${p.title.toLowerCase().replaceAll(' ', '-')}`} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, delay: 0.2 + i * 0.06 }} className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 shadow-sm transition-all hover:border-[var(--project-color)] hover:shadow-[0_8px_22px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/[0.03]" style={{ ['--project-color' as string]: p.color }}>
                <div className="mb-1.5 h-0.5 w-7 rounded-full" style={{ backgroundColor: p.color }} />
                <p className="truncate text-[11px] font-semibold leading-none text-slate-800 dark:text-slate-100">{p.title}</p>
                <p className="mt-1 truncate text-[10px] leading-none text-slate-400 dark:text-slate-500">{p.category}</p>
              </motion.a>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-stone-50 dark:bg-slate-950/95">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-20 md:grid-cols-2 lg:grid-cols-3 md:py-28">
          {projects.map((p, i) => (
            <motion.div key={p.title} id={p.title.toLowerCase().replaceAll(' ', '-')} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5, delay: i * 0.06 }}>
              <Link href={p.href} target="_blank" rel="noopener noreferrer" className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:border-[var(--project-color)] hover:shadow-[0_16px_50px_rgba(15,23,42,0.08)] dark:border-white/10 dark:bg-white/[0.03] dark:hover:shadow-[0_16px_50px_rgba(0,0,0,0.22)]" style={{ ['--project-color' as string]: p.color }}>
                <div className="relative aspect-[16/10] overflow-hidden border-b border-slate-100 dark:border-white/10">
                  <Image src={p.shot} alt={`Sito ${p.title}`} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover object-top transition-transform duration-700 group-hover:scale-[1.03]" />
                </div>
                <div className="flex flex-1 flex-col p-5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-400 dark:text-slate-500">{p.category}</p>
                  <h2 className="mt-2 font-display text-lg font-semibold text-slate-900 dark:text-slate-50">{p.title}</h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-500 dark:text-slate-300/80">{p.desc}</p>
                  <ul className="mt-3 space-y-1.5">
                    {p.details.map(d => (
                      <li key={d} className="flex items-start gap-2 text-xs leading-relaxed text-slate-400 dark:text-slate-400">
                        <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                        {d}
                      </li>
                    ))}
                  </ul>
                  <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-xs font-medium text-slate-600 dark:text-slate-300">
                    Visita il sito
                    <ExternalLink className="h-3.5 w-3.5" />
                  </span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  )
}
