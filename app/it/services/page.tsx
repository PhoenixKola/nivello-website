import type { Metadata } from 'next'
import { pageSeo } from '../../seo'
import ServicesItClient from './ServicesItClient'

export const metadata: Metadata = pageSeo.servicesIt

export default function ServicesItPage() {
  return <ServicesItClient />
}
