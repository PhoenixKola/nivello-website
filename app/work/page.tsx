import Link from 'next/link'
import BottomCta from '@/components/BottomCta'

export default function WorkPage() {
  return (
    <div>
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 md:pb-14 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Our work
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Selected projects and collaborations.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            A snapshot of recent launches across hospitality, publishing, and
            local businesses – all designed and built by Nivello.
          </p>
        </div>
      </section>

      <section className="border-b border-slate-900">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 md:grid-cols-3 md:py-14">

          <Link
            href="https://rombonord.com/it/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/90 p-5 transition hover:border-emerald-500/40 hover:bg-slate-950 hover:shadow-md hover:shadow-emerald-500/20"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Hospitality · Restaurant &amp; Cocktail Bar
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Rombo Nord · Genova Pegli
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Bilingual website for a historic seaside restaurant and cocktail
              bar in Pegli, with clear paths to menus, events, and reservations.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>Separate drink and restaurant menus</li>
              <li>Online booking flow linked to the contact channel</li>
              <li>Atmospheric visuals aligned with the brand</li>
            </ul>
            <span className="mt-4 text-xs text-emerald-300">
              Visit site ↗
            </span>
          </Link>

          <Link
            href="https://le-camelie.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/90 p-5 transition hover:border-sky-500/40 hover:bg-slate-950 hover:shadow-md hover:shadow-sky-500/20"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Hospitality · Guesthouse Website
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Le Camelie · Rooms in Genova
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Compact property site for a guesthouse in the centre of Genova,
              focused on clarity, comfort details, and booking-engine conversions.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>Room galleries and amenities overview</li>
              <li>Trust-focused layout with review highlights</li>
              <li>Clear call-to-action to booking engine</li>
            </ul>
            <span className="mt-4 text-xs text-sky-300">
              Visit site ↗
            </span>
          </Link>

          <Link
            href="https://gjergj-jozef-kola.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/90 p-5 transition hover:border-fuchsia-500/40 hover:bg-slate-950 hover:shadow-md hover:shadow-fuchsia-500/20"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Publishing · Author Portfolio
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Gjergj Jozef Kola · Author site
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Multilingual author website with a small shop, presenting books,
              biography, and contact in a calm, literary layout.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>Author intro and featured books</li>
              <li>Book pages ready for e-commerce</li>
              <li>Contact for readers and media</li>
            </ul>
            <span className="mt-4 text-xs text-fuchsia-300">
              Visit site ↗
            </span>
          </Link>

          <Link
            href="https://consteam.eu/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/90 p-5 transition hover:border-emerald-500/40 hover:bg-slate-950 hover:shadow-md hover:shadow-emerald-500/20"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Local Business · Home Services
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Consteam · Professional Cleaning & Maintenance
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Responsive multi-page site for a cleaning & maintenance company,
              emphasizing services, contact flows and trust signals for clients.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>Service overview with clear sections per offer</li>
              <li>Contact form and easy-to-access request flow</li>
              <li>Clean, professional layout suited for B2B / B2C conversions</li>
            </ul>
            <span className="mt-4 text-xs text-emerald-300">
              Visit site ↗
            </span>
          </Link>

        </div>
      </section>

      <BottomCta />
    </div>
  )
}