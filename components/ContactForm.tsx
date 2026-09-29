'use client'

import { FormEvent, useMemo, useRef, useState, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, ChevronDown, ShieldCheck, Sparkles } from 'lucide-react'
import { track } from '@/lib/analytics'
import { captureInquiry, newSubmissionId } from '@/lib/inboxCapture'
import { buildToProjectTypeIndex, describeBrief, parseBrief } from '@/lib/projectBrief'
import { CONTACT_FORM_ENDPOINT, getRoutePath, type Locale } from '@/lib/site'

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
    projectTypes: ['Website development', 'Custom web app / software', 'Design support / UI', 'Strategy / marketing support', 'Not sure yet'],
    budget: 'Budget range',
    budgetOptions: ['Not sure yet', 'EUR 800-1,800', 'EUR 1,800-3,500', 'EUR 3,500-7,500', 'EUR 7,500+', 'Custom / ongoing'],
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
    reassurance: 'No newsletter signup. No automated sales sequence. Just a practical reply.',
    briefLabel: 'Your starting point',
    formLabel: 'Project enquiry form',
    requiredNote: 'Fields marked * are required.'
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
    projectTypes: ['Sviluppo sito web', 'App web / software custom', 'Supporto design / UI', 'Supporto strategia / marketing', 'Non lo so ancora'],
    budget: 'Budget indicativo',
    budgetOptions: ['Non lo so ancora', 'EUR 800-1.800', 'EUR 1.800-3.500', 'EUR 3.500-7.500', 'EUR 7.500+', 'Su misura / continuativo'],
    timing: 'Tempistiche',
    timingOptions: ['Flessibile', 'Entro 1 mese', '1-3 mesi', "Più avanti quest'anno"],
    deadline: 'Scadenza o data di lancio',
    deadlinePlaceholder: 'Opzionale, ma utile',
    message: 'Messaggio',
    messagePlaceholder: 'Raccontaci cosa vuoi costruire, migliorare o lanciare.',
    consentStart: 'Accetto che Nivello mi contatti per questa richiesta e gestisca i miei dati secondo la',
    privacy: 'privacy policy',
    consentEnd: '.',
    submit: 'Invia messaggio',
    submitting: 'Invio...',
    success: 'Grazie. Il messaggio è stato inviato. Di solito rispondiamo entro un giorno lavorativo.',
    error: 'Qualcosa non ha funzionato. Scrivi direttamente a office@nivello.it.',
    reassurance: 'Nessuna newsletter automatica. Nessuna sequenza commerciale. Solo una risposta pratica.',
    briefLabel: 'Il tuo punto di partenza',
    formLabel: 'Modulo di richiesta progetto',
    requiredNote: 'I campi contrassegnati da * sono obbligatori.'
  }
} satisfies Record<Locale, Record<string, string | string[]>>

// Visual cue only; the native `required` attribute is what assistive tech announces.
function RequiredMark() {
  return <span aria-hidden="true"> *</span>
}

function SelectField({
  name,
  label,
  required,
  options,
  defaultValue
}: {
  name: string
  label: string
  required?: boolean
  options: string[]
  defaultValue?: string
}) {
  return (
    <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
      {label}
      {required && <RequiredMark />}
      <span className="relative mt-1.5 block">
        <select name={name} required={required} defaultValue={defaultValue} className={selectCls}>
          {options.map((option, index) => (
            <option key={option} value={index === 0 && required ? '' : option} className={optionCls}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
      </span>
    </label>
  )
}

const subscribeToNothing = () => () => {}

export default function ContactForm({ locale = 'en' }: { locale?: Locale }) {
  const [status, setStatus] = useState<Status>('idle')
  const started = useRef(false)
  // One id per inquiry: a retry after a failed send updates the same inbox record instead of adding another.
  const submissionId = useRef<string | null>(null)
  const content = copy[locale]
  // Static export: the query string only exists in the browser, so read it after hydration.
  const search = useSyncExternalStore(subscribeToNothing, () => window.location.search, () => '')
  const brief = useMemo(() => parseBrief(search), [search])
  const briefSummary = describeBrief(brief, locale)
  const prefilledProjectType = brief.build ? (content.projectTypes as string[])[buildToProjectTypeIndex[brief.build]] : undefined

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (status === 'submitting') return

    const form = event.currentTarget
    const formData = new FormData(form)
    if (formData.get('website')) return

    setStatus('submitting')
    submissionId.current ??= newSubmissionId()
    const source = brief.build ? `launcher_${brief.build}` : 'direct'
    let delivered = false
    try {
      const response = await fetch(CONTACT_FORM_ENDPOINT, {
        method: 'POST',
        body: formData,
        headers: { Accept: 'application/json' }
      })
      delivered = response.ok
    } catch {
      delivered = false
    }
    // Recorded either way, so an inquiry is not lost when the email delivery fails.
    captureInquiry(formData, { submissionId: submissionId.current, delivery: delivered ? 'delivered' : 'failed', source, locale })

    if (delivered) {
      setStatus('success')
      track('contact_submit', source)
      submissionId.current = null
      form.reset()
    } else {
      setStatus('error')
    }
  }

  return (
    <motion.form
      onSubmit={handleSubmit}
      onFocus={() => {
        if (!started.current) {
          started.current = true
          track('contact_start')
        }
      }}
      aria-label={content.formLabel as string} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-white/[0.03]">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      {briefSummary && (
        <div className="mb-5 flex items-start gap-3 rounded-xl border border-[var(--brand-blue)]/25 bg-[var(--brand-blue)]/[0.06] px-4 py-3 dark:border-[var(--brand-gold)]/30 dark:bg-[var(--brand-gold)]/[0.07]">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" aria-hidden="true" />
          <p className="text-sm text-slate-700 dark:text-slate-200">
            <span className="font-semibold">{content.briefLabel as string}:</span> {briefSummary}
          </p>
          <input type="hidden" name="projectBrief" value={briefSummary} />
        </div>
      )}
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">{content.requiredNote as string}</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {content.name as string}
          <RequiredMark />
          <input name="name" autoComplete="name" required className={`${inputCls} mt-1.5`} placeholder={content.namePlaceholder as string} />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {content.email as string}
          <RequiredMark />
          <input name="email" type="email" autoComplete="email" required className={`${inputCls} mt-1.5`} placeholder={content.emailPlaceholder as string} />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
          {content.company as string}
          <input name="company" autoComplete="organization" className={`${inputCls} mt-1.5`} placeholder={content.companyPlaceholder as string} />
        </label>
        <SelectField
          key={prefilledProjectType ?? 'none'}
          name="projectType"
          label={content.projectType as string}
          required
          options={[content.select as string, ...(content.projectTypes as string[])]}
          defaultValue={prefilledProjectType}
        />
        <SelectField name="budget" label={content.budget as string} options={content.budgetOptions as string[]} />
        <SelectField name="timing" label={content.timing as string} options={content.timingOptions as string[]} />
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {content.deadline as string}
          <input name="deadline" autoComplete="off" className={`${inputCls} mt-1.5`} placeholder={content.deadlinePlaceholder as string} />
        </label>
        <label className="text-sm font-medium text-slate-700 dark:text-slate-200 sm:col-span-2">
          {content.message as string}
          <RequiredMark />
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
        <button type="submit" disabled={status === 'submitting'} aria-busy={status === 'submitting'} className="inline-flex w-full cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-full bg-slate-900 px-6 py-2.5 text-sm font-semibold text-white transition-all hover:bg-slate-700 disabled:cursor-default disabled:opacity-60 sm:w-auto dark:bg-slate-50 dark:text-slate-950 dark:hover:bg-white">
          {status === 'submitting' ? content.submitting as string : content.submit as string}
          <ArrowRight aria-hidden="true" className="h-4 w-4" />
        </button>
        <p className="inline-flex items-center gap-1.5 text-xs text-slate-400 dark:text-slate-500">
          <ShieldCheck aria-hidden="true" className="h-3.5 w-3.5" />
          {content.reassurance as string}
        </p>
      </div>
      <p role="status" className="mt-3 min-h-4 text-xs font-medium text-[var(--brand-blue)] dark:text-[var(--brand-gold)]">
        {status === 'success' ? (content.success as string) : ''}
      </p>
      <p role="alert" className="min-h-0 text-xs font-medium text-red-600 dark:text-red-300">
        {status === 'error' ? (content.error as string) : ''}
      </p>
    </motion.form>
  )
}
