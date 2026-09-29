import type { Metadata } from 'next'
import WorkShowcase from '@/components/WorkShowcase'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo.workIt

export default function WorkItRoutePage() {
  return <WorkShowcase locale="it" />
}
