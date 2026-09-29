import type { Metadata } from 'next'
import WorkShowcase from '@/components/WorkShowcase'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo.work

export default function WorkRoutePage() {
  return <WorkShowcase locale="en" />
}
