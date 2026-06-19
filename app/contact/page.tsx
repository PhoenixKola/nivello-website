import type { Metadata } from 'next'
import { pageSeo } from '../seo'
import ContactClient from './ContactClient'

export const metadata: Metadata = pageSeo.contact

export default function ContactPage() {
  return <ContactClient />
}
