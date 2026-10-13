'use client'

import type { Locale } from '@/lib/site'

const copy = {
  en: {
    name: 'Identity',
    kind: 'Nivello',
    title: 'Where ideas become real.',
    body: 'Nivello is a web development studio. We turn clear thinking into digital products people use.'
  },
  it: {
    name: 'Identità',
    kind: 'Nivello',
    title: 'Dove le idee diventano reali.',
    body: 'Nivello è uno studio di sviluppo web. Trasformiamo idee chiare in prodotti digitali che le persone usano.'
  }
} satisfies Record<Locale, Record<string, string>>

/** Chapter 02: the large glowing mark reveals itself; the copy stays short so the logo owns the frame. */
export default function HomeLogoReveal({ locale }: { locale: Locale }) {
  const t = copy[locale]
  return (
    <section id="cinematic-logo" className="cin-ov cin-ov--logo" data-cin-overlay="1" aria-labelledby="home-logo-heading">
      <div className="cin-start cin-logo">
        <p className="cin-eyebrow"><i aria-hidden="true" /><span className="cin-head__no">02</span><span className="cin-head__name">{t.name}</span></p>
        <h2 id="home-logo-heading" className="cin-start__title">{t.title}</h2>
        <p className="cin-start__body">{t.body}</p>
      </div>
    </section>
  )
}
