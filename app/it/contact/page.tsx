import type { Metadata } from 'next'
import ContactPage from '@/components/ContactPage'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo.contactIt

export default function ContactItRoutePage() {
  return <ContactPage locale="it" />
}
