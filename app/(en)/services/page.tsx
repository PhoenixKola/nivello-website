import type { Metadata } from 'next'
import ServicesShowcase from '@/components/ServicesShowcase'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo.services

export default function ServicesRoutePage() {
  return <ServicesShowcase locale="en" />
}
