import type { Metadata } from 'next'
import { pageSeo } from '../../seo'
import ContactItClient from './ContactItClient'

export const metadata: Metadata = pageSeo.contactIt

export default function ContactItPage() {
  return <ContactItClient />
}
