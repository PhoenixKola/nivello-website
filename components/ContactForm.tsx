'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown, ShieldCheck } from 'lucide-react'
import { getRoutePath, type Locale } from '@/lib/site'

const FORM_ENDPOINT = 'https://formspree.io/f/xyzlpdkl'
type Status = 'idle' | 'submitting' | 'success' | 'error'

const inputCls = 'w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none placeholder:text-slate-400 transition focus:border-[var(--brand-blue)] focus:ring-2 focus:ring-[var(--brand-blue)]/20 dark:border-slate-700 dark:bg-slate-900/60 dark:text-slate-50 dark:placeholder:text-slate-500 dark:focus:border-[var(--brand-gold)] dark:focus:ring-[var(--brand-gold)]/15'
const selectCls = `${inputCls} cursor-pointer appearance-none pr-12 dark:[color-scheme:dark]`
const optionCls = 'bg-white text-slate-900 dark:bg-slate-950 dark:text-slate-50'

const copy = {
  en: {
    name: 'Name',
    namePlaceholder: 'Your name',
    email: 'Email',
    emailPlaceholder: 'you@company.com',
    company: 'Company',
    companyPlaceholder: 'Company or brand name',
    projectType: 'Project type',
    select: 'Select one',
    projectTypes: ['Website / landing page', 'Marketing and messaging', 'Design system / UI', 'Custom software', 'Not sure yet'],
    budget: 'Budget range',
    budgetOptions: ['Not sure yet', 'EUR 1,500-3,500', 'EUR 3,500-7,500', 'EUR 7,500+', 'Custom / ongoing'],
    timing: 'Timing',
    timingOptions: ['Flexible', 'Within 1 month', '1-3 months', 'Later this year'],
    deadline: 'Deadline or launch date',
    deadlinePlaceholder: 'Optional, but useful',
    message: 'Message',
    messagePlaceholder: 'Tell us what you are trying to build, improve, or launch.',
    consentStart: 'I agree that Nivello may contact me about this request and handle my data according to the',
    privacy: 'privacy policy',
    consentEnd: '.',
    submit: 'Send message',
    submitting: 'Sending...',
    success: 'Thanks. Your message has been sent. We usually reply within one business day.',
    error: 'Something went wrong. Please email office@nivello.it directly.',
    reassurance: 'No newsletter signup. No automated sales sequence. Just a practical reply.'
  },
  it: {
    name: 'Nome',
    namePlaceholder: 'Il tuo nome',
    email: 'Email',
    emailPlaceholder: 'tu@azienda.com',
    company: 'Azienda',
    companyPlaceholder: 'Nome azienda o brand',
    projectType: 'Tipo di progetto',
    select: 'Seleziona',
    projectTypes: ['Sito web / landing page', 'Marketing e messaggio', 'Design system / UI', 'Software custom', 'Non lo so ancora'],
    budget: 'Range budget',
    budgetOptions: ['Non lo so ancora', 'EUR 1.500-3.500', 'EUR 3.500-7.500', 'EUR 7.500+', 'Custom / continuativo'],
    timing: 'Tempistiche',
    timingOptions: ['Flessibile', 'Entro 1 mese', '1-3 mesi', "Piu avanti quest'anno"],
    deadline: 'Scadenza o data lancio',
    deadlinePlaceholder: 'Opzionale, ma utile',
    message: 'Messaggio',
    messagePlaceholder: 'Raccontaci cosa vuoi costruire, migliorare o lanciare.',
    consentStart: 'Accetto che Nivello mi contatti per questa richiesta e gestisca i miei dati secondo la',
    privacy: 'privacy policy',
    consentEnd: '.',
    submit: 'Invia messaggio',
    submitting: 'Invio...',
    success: 'Grazie. Il messaggio e stato inviato. Di solito rispondiamo entro un giorno lavorativo.',
    error: 'Qualcosa non ha funzionato. Scrivi direttamente a office@nivello.it.',
    reassurance: 'Nessuna newsletter automatica. Nessuna sequenza commerciale. Solo una risposta pratica.'
  }
} satisfies Record<Locale, Record<string, string | string[]>>

function SelectField({
  name,
  label,
  required,
  options
}: {
  name: string
  label: string
  required?: boolean
  options: string[]
}) {
  return (
    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}{required ? ' *' : ''}
      <div className="relative mt-1.5">
        <select name={name} required={required} className={selectCls}>
          {options.map((option, index) => (
            <option key={option} value={index === 0 && required ? '' : option} className={optionCls}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
      </div>
    </label>
  )
}

export default function ContactForm({ locale = 'en' }: { locale?: Locale }) {
  const [status, setStatus] = useState<Status>('idle')
  const content = copy[locale]

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'submitting') return

    const form = event.currentTarget
    const formData = new FormData(form)
    if (formData.get('website')) return

    setStatus('submitting')
    try {
      const response = await fetch(FORM_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
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

  const statusMessage = status === 'success' ? content.success : status === 'error' ? content.error : ''

  return (
    <motion.form onSubmit={handleSubmit} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {content.name as string} *
          <input name="name" required className={`${inputCls} mt-1.5`} placeholder={content.namePlaceholder as string} />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {content.email as string} *
          <input name="email" type="email" required className={`${inputCls} mt-1.5`} placeholder={content.emailPlaceholder as string} />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
          {content.company as string}
          <input name="company" className={`${inputCls} mt-1.5`} placeholder={content.companyPlaceholder as string} />
        </label>
        <SelectField name="projectType" label={content.projectType as string} required options={[content.select as string, ...(content.projectTypes as string[])]} />
        <SelectField name="budget" label={content.budget as string} options={content.budgetOptions as string[]} />
        <SelectField name="timing" label={content.timing as string} options={content.timingOptions as string[]} />
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {content.deadline as string}
          <input name="deadline" className={`${inputCls} mt-1.5`} placeholder={content.deadlinePlaceholder as string} />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
          {content.message as string} *
          <textarea name="message" required rows={6} className={`${inputCls} mt-1.5 resize-y`} placeholder={content.messagePlaceholder as string} />
        </label>
        <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-stone-50 px-3 py-3 text-xs leading-relaxed text-slate-500 dark:border-white/10 dark:bg-slate-950/45 dark:text-slate-300 sm:col-span-2">
          <input type="checkbox" name="privacyConsent" required className="mt-1 h-4 w-4 rounded border-slate-300 accent-[var(--brand-blue)] dark:accent-[var(--brand-gold)]" />
          <span>
            {content.consentStart as string}{' '}
            <Link href={getRoutePath('privacy', locale)} className="font-medium text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
              {content.privacy as string}
            </Link>
            {content.consentEnd as string}
          </span>
        </label>
      </div>
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <button type="submit" disabled={status === 'submitting'} className="inline-flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-700 disabled:cursor-default disabled:opacity-60 sm:w-auto dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-white">
          {status === 'submitting' ? content.submitting as string : content.submit as string}
          <ArrowRight className="h-4 w-4" />
        </button>
        <p className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <ShieldCheck className="h-3.5 w-3.5" />
          {content.reassurance as string}
        </p>
      </div>
      <p aria-live="polite" className={`mt-3 min-h-4 text-xs font-medium ${status === 'error' ? 'text-red-600 dark:text-red-300' : 'text-[var(--brand-blue)] dark:text-[var(--brand-gold)]'}`}>
        {statusMessage as string}
      </p>
    </motion.form>
  )
}
