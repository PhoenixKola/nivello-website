import type { Metadata } from 'next'
import ContactPage from '@/components/ContactPage'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo.contact

export default function ContactRoutePage() {
  return <ContactPage locale="en" />
}
