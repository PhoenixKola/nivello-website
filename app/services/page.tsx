import type { Metadata } from 'next'
import { pageSeo } from '../seo'
import ServicesClient from './ServicesClient'

export const metadata: Metadata = pageSeo.services

export default function ServicesPage() {
  return <ServicesClient />
}
