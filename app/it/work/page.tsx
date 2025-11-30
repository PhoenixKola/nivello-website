import Link from 'next/link'
import BottomCtaIt from '@/components/BottomCtaIt'

export default function WorkPageIt() {
  return (
    <div>
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 md:pb-14 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Progetti
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Selezione di lavori e collaborazioni.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Una fotografia di lanci recenti tra ristorazione, ospitalità, editoria
            e servizi locali – progettati e sviluppati da Nivello.
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
              Hospitality · Ristorante e Cocktail Bar
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Rombo Nord · Genova Pegli
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Sito bilingue per un ristorante e cocktail bar storico sul mare a
              Pegli, con percorsi chiari verso menù, eventi e contatti.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>Menù distinti per ristorante e drink</li>
              <li>Struttura pensata per prenotazioni e richieste</li>
              <li>Immagini e tono in linea con l&apos;atmosfera del locale</li>
            </ul>
            <span className="mt-4 text-xs text-emerald-300">
              Visita il sito ↗
            </span>
          </Link>

          <Link
            href="https://le-camelie.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/90 p-5 transition hover:border-sky-500/40 hover:bg-slate-950 hover:shadow-md hover:shadow-sky-500/20"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Hospitality · Affittacamere
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Le Camelie · Camere a Genova
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Sito compatto per una struttura ricettiva nel centro di Genova,
              focalizzato su chiarezza, comfort e prenotazioni online.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>Schede camera con foto e servizi in evidenza</li>
              <li>Testi orientati alla fiducia e alle recensioni</li>
              <li>Call to action chiara verso il canale di prenotazione</li>
            </ul>
            <span className="mt-4 text-xs text-sky-300">
              Visita il sito ↗
            </span>
          </Link>

          <Link
            href="https://gjergj-jozef-kola.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/90 p-5 transition hover:border-fuchsia-500/40 hover:bg-slate-950 hover:shadow-md hover:shadow-fuchsia-500/20"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Editoria · Sito autore
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Gjergj Jozef Kola · Sito autore
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Sito multilingue per uno scrittore, con catalogo libri, biografia
              e un piccolo shop in un impianto visivo sobrio e letterario.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>Presentazione dell’autore e dei titoli principali</li>
              <li>Pagine libro pronte per l’e-commerce</li>
              <li>Sezione contatti per lettori e stampa</li>
            </ul>
            <span className="mt-4 text-xs text-fuchsia-300">
              Visita il sito ↗
            </span>
          </Link>

          <Link
            href="https://consteam.eu/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-950/90 p-5 transition hover:border-emerald-500/40 hover:bg-slate-950 hover:shadow-md hover:shadow-emerald-500/20"
          >
            <p className="text-xs uppercase tracking-[0.18em] text-slate-500">
              Impresa locale · Pulizie e manutenzione
            </p>
            <h2 className="mt-2 text-sm font-semibold text-slate-50">
              Consteam · Pulizie & Manutenzione Professionale
            </h2>
            <p className="mt-2 text-sm text-slate-300">
              Sito responsive multi-pagina per una ditta di pulizie e manutenzione,
              con enfasi sui servizi offerti, moduli di contatto e percorsi chiari
              per i clienti.
            </p>
            <ul className="mt-3 space-y-1 text-xs text-slate-400">
              <li>Panoramica servizi con sezioni dedicate</li>
              <li>Flusso di richiesta facilmente accessibile</li>
              <li>Layout pulito e professionale, ideale per conversioni B2B / B2C</li>
            </ul>
            <span className="mt-4 text-xs text-emerald-300">
              Visita il sito ↗
            </span>
          </Link>

        </div>
      </section>

      <BottomCtaIt />
    </div>
  )
}