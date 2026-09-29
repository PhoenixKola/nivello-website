import type { Metadata } from 'next'
import ServicesShowcase from '@/components/ServicesShowcase'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo.servicesIt

export default function ServicesItRoutePage() {
  return <ServicesShowcase locale="it" />
}
