'use client'

import type { ComponentType } from 'react'
import { Globe, AtSign, Mail, MapPin, MessageCircle, Phone } from 'lucide-react'
import { phoneDigits, whatsappLink } from '@/lib/admin/format'
import type { Lead, LeadSummary } from '@/lib/admin/types'
import { cx, focusRing } from '../ui/styles'

type ContactLead = Pick<LeadSummary, 'companyName' | 'phone' | 'whatsapp' | 'email' | 'instagram' | 'website' | 'googleMapsUrl'> | Lead

type Action = { key: string; label: string; href: string; icon: ComponentType<{ className?: string }>; external?: boolean }

/** Only actions with real data are rendered. */
export function contactActions(lead: ContactLead): Action[] {
  const actions: Action[] = []
  if (lead.phone) actions.push({ key: 'call', label: 'Call', href: `tel:${phoneDigits(lead.phone)}`, icon: Phone })
  const wa = lead.whatsapp || lead.phone
  if (wa) actions.push({ key: 'whatsapp', label: 'WhatsApp', href: whatsappLink(wa), icon: MessageCircle, external: true })
  if (lead.email) actions.push({ key: 'email', label: 'Email', href: `mailto:${lead.email}`, icon: Mail })
  if (lead.instagram) actions.push({ key: 'instagram', label: 'Instagram', href: lead.instagram, icon: AtSign, external: true })
  if (lead.website) actions.push({ key: 'website', label: 'Website', href: lead.website, icon: Globe, external: true })
  if (lead.googleMapsUrl) actions.push({ key: 'maps', label: 'Google Maps', href: lead.googleMapsUrl, icon: MapPin, external: true })
  return actions
}

export default function ContactActions({ lead, variant = 'icons', only }: { lead: ContactLead; variant?: 'icons' | 'buttons'; only?: string[] }) {
  const actions = contactActions(lead).filter(a => !only || only.includes(a.key))
  if (!actions.length) return variant === 'icons' ? <span className="text-xs text-slate-400">—</span> : null
  return (
    <div className={cx('flex flex-wrap items-center', variant === 'icons' ? 'gap-0.5' : 'gap-2')}>
      {actions.map(action => (
        <a
          key={action.key}
          href={action.href}
          target={action.external ? '_blank' : undefined}
          rel={action.external ? 'noopener noreferrer' : undefined}
          aria-label={`${action.label}: ${lead.companyName}`}
          title={action.label}
          onClick={event => event.stopPropagation()}
          className={cx(
            variant === 'icons'
              ? 'flex h-8 w-8 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'
              : 'inline-flex h-9 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-sm font-medium text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-white/10 dark:bg-white/[0.04] dark:text-slate-200 dark:hover:bg-white/[0.08]',
            focusRing
          )}
        >
          <action.icon className="h-4 w-4" />
          {variant === 'buttons' && action.label}
        </a>
      ))}
    </div>
  )
}
