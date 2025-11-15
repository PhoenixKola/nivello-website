'use client'

import { FormEvent, useState } from 'react'

const FORM_ENDPOINT = 'https://formspree.io/f/abcdwxyz'

type Status = 'idle' | 'submitting' | 'success' | 'error'

export default function ContactPage() {
  const [status, setStatus] = useState<Status>('idle')

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'submitting') return

    setStatus('submitting')

    const form = event.currentTarget
    const formData = new FormData(form)

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
            Contact
          </p>
          <h1 className="text-2xl font-semibold text-slate-50 md:text-3xl">
            Tell us about your project.
          </h1>
          <p className="mt-3 max-w-2xl text-sm text-slate-300">
            Share a bit about your brand, your goals, and your timing. We
            usually reply within one business day.
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
                    Name
                  </label>
                  <input
                    id="name"
                    name="name"
                    required
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2"
                    placeholder="Your full name"
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
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="company"
                  className="mb-1 block text-xs font-medium text-slate-200"
                >
                  Company
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
                    Approx. budget
                  </label>
                  <select
                    id="budget"
                    name="budget"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-500/70 focus:ring-2"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Select a range
                    </option>
                    <option value="under-3k">Under €3,000</option>
                    <option value="3-7k">€3,000 – €7,000</option>
                    <option value="7-15k">€7,000 – €15,000</option>
                    <option value="15k-plus">€15,000+</option>
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="timeline"
                    className="mb-1 block text-xs font-medium text-slate-200"
                  >
                    Ideal timeline
                  </label>
                  <select
                    id="timeline"
                    name="timeline"
                    className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 focus:border-emerald-500/70 focus:ring-2"
                    defaultValue=""
                  >
                    <option value="" disabled>
                      Choose an option
                    </option>
                    <option value="asap">As soon as possible</option>
                    <option value="1-2-months">Within 1–2 months</option>
                    <option value="3-plus-months">In 3+ months</option>
                    <option value="not-sure">Not sure yet</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="mb-1 block text-xs font-medium text-slate-200"
                >
                  Tell us about your project
                </label>
                <textarea
                  id="message"
                  name="message"
                  required
                  rows={5}
                  className="w-full rounded-xl border border-slate-800 bg-slate-900/60 px-3 py-2 text-sm text-slate-50 outline-none ring-emerald-500/40 placeholder:text-slate-500 focus:border-emerald-500/70 focus:ring-2"
                  placeholder="Share what you do, what you need, and any links we should see."
                />
              </div>

              <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:items-center sm:justify-between">
                <button
                  type="submit"
                  disabled={status === 'submitting' || status === 'success'}
                  className="inline-flex items-center justify-center w-44 rounded-full bg-slate-50 px-5 py-2.5 text-sm font-semibold text-slate-950 shadow-sm shadow-emerald-500/30 hover:bg-slate-200 disabled:cursor-default disabled:bg-slate-300"
                >
                  {status === 'submitting'
                    ? 'Sending...'
                    : status === 'success'
                    ? 'Message sent'
                    : 'Send message'}
                </button>
                <p className="text-xs text-slate-400">
                  By sending this form you agree we can use your details to
                  contact you about this project.
                </p>
              </div>

              {status === 'success' && (
                <p className="mt-3 text-xs text-emerald-300">
                  Thank you for your message. We&apos;ll get back to you shortly.
                </p>
              )}

              {status === 'error' && (
                <p className="mt-3 text-xs text-rose-300">
                  Something went wrong while sending your message. Please try
                  again in a moment or email us directly at{' '}
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
                Preferred collaboration
              </p>
              <p className="mt-2">
                We enjoy long-term collaborations with brands, agencies, and
                startups that value clear communication and clean design.
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Typical projects
              </p>
              <ul className="mt-2 space-y-1 text-sm text-slate-300">
                <li>New marketing site for a product or service</li>
                <li>Full redesign of an outdated website</li>
                <li>Brand and UX refresh for a SaaS or platform</li>
              </ul>
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Direct contact
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
                Based in Italy, comfortable working across European time zones.
              </p>
            </div>
          </aside>
        </div>
      </section>
    </main>
  )
}