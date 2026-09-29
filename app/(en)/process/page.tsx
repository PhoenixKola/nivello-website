import type { Metadata } from 'next'
import ProcessPage from '@/components/ProcessPage'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo.process

export default function ProcessRoutePage() {
  return <ProcessPage locale="en" />
}
