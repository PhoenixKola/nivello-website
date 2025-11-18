'use client'

import { FormEvent, useState } from 'react'

const FORM_ENDPOINT = 'https://formspree.io/f/xyzlpdkl'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function ContactPageIt() {
  const [status, setStatus] = useState<Status>('idle')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'submitting') return

    setStatus('submitting')

    const form = event.currentTarget
    const formData = new FormData(form)
    formData.append('language', 'it')

    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: {
          Accept: 'application/json'
        }
      })

      if (response.ok) {
        setStatus('success')
        form.reset()
      } else {
        setStatus('error')
      }
    } catch {
      setStatus('error')
    }
  }

  return (
    <main className="bg-slate-950">
      <section className="border-b border-slate-900">
        <div className="mx-auto max-w-6xl px-4 pb-10 pt-10 md:pb-14 md:pt-14">
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-emerald-300">
            Contatti
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Raccontaci del tuo progetto.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Parlaci del tuo brand, dei tuoi obiettivi e delle tempistiche.
            Di solito rispondiamo entro un giorno lavorativo.
          </p>
        </div>
      </section>

      <section>
        <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] md:py-14">
          <div className="rounded-2xl border border-slate-800 bg-slate-950/90 p-6">
            <form onSubmit={handleSubmit} className="space-y-4 text-sm">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="name"
                    className="mb-1 block text-xs font-medium text-slate-200"
                  >
                    Nome
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2"
                    placeholder="Il tuo nome completo"
                  />
                </div>
                <div>
                  <label
                    htmlFor="email"
                    className="mb-1 block text-xs font-medium text-slate-200"
                  >
                    Email
                  </label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2"
                    placeholder="tu@azienda.it"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="company"
                  className="mb-1 block text-xs font-medium text-slate-200"
                >
                  Azienda
                </label>
                <input
                  id="company"
                  name="company"
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2"
                  placeholder="Brand, studio, startup..."
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label
                    htmlFor="budget"
                    className="mb-1 block text-xs font-medium text-slate-200"
                  >
                    Budget indicativo
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-500/70 focus:ring-2"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Seleziona una fascia
                    </option>
                    <option value="under-3k">Meno di 3.000 €</option>
                    <option value="3-7k">3.000 – 7.000 €</option>
                    <option value="7-15k">7.000 – 15.000 €</option>
                    <option value="15k-plus">Oltre 15.000 €</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="timeline"
                    className="mb-1 block text-xs font-medium text-slate-200"
                  >
                    Tempistiche ideali
                  </label>
                  <select
                    id="timeline"
                    name="timeline"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-500/70 focus:ring-2"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Scegli un&apos;opzione
                    </option>
                    <option value="asap">Il prima possibile</option>
                    <option value="1-2-months">Entro 1–2 mesi</option>
                    <option value="3-plus-months">Tra 3+ mesi</option>
                    <option value="not-sure">Non sono sicuro</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-1 block text-xs font-medium text-slate-200"
                >
                  Raccontaci il progetto
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2"
                  placeholder="Descrivi cosa fai, cosa ti serve e inserisci eventuali link utili."
                />
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={status === 'submitting' || status === 'success'}
                  className="inline-flex w-44 items-center justify-center rounded-full bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/30 hover:bg-slate-200 disabled:cursor-default disabled:bg-slate-300"
                >
                  {status === 'submitting'
                    ? 'Invio in corso...'
                    : status === 'success'
                    ? 'Messaggio inviato'
                    : 'Invia il messaggio'}
                </button>
                <p className="text-xs text-slate-400">
                  Inviando questo form ci autorizzi a contattarti in merito al
                  progetto.
                </p>
              </div>

              {status === 'success' && (
                <p className="mt-3 text-xs text-emerald-300">
                  Grazie per il messaggio. Ti risponderemo al più presto.
                </p>
              )}

              {status === 'error' && (
                <p className="mt-3 text-xs text-rose-300">
                  Qualcosa è andato storto durante l&apos;invio. Riprova tra
                  poco oppure scrivici direttamente a{' '}
                  <a
                    href="mailto:hello@nivello.studio"
                    className="underline"
                  >
                    hello@nivello.studio
                  </a>
                  .
                </p>
              )}
            </form>
          </div>

          <aside className="space-y-4 rounded-2xl border border-slate-800 bg-slate-950/90 p-6 text-sm text-slate-300">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Collaborazioni ideali
              </p>
              <p className="mt-2">
                Lavoriamo volentieri con brand, agenzie e startup che apprezzano
                una comunicazione chiara e un design curato.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Progetti tipici
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                <li>Nuovo sito marketing per un prodotto o servizio</li>
                <li>Restyling completo di un sito esistente</li>
                <li>Refresh di brand e UX per SaaS o piattaforme</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Contatto diretto
              </p>
              <p className="mt-2">
                Email:{' '}
                <a
                  href="mailto:hello@nivello.studio"
                  className="text-emerald-300 hover:text-emerald-200"
                >
                  hello@nivello.studio
                </a>
              </p>
              <p className="mt-1 text-xs text-slate-400">
                Siamo in Italia e lavoriamo senza problemi con fusi orari
                europei.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}