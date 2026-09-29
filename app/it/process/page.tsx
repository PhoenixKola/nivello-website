import type { Metadata } from 'next'
import ProcessPage from '@/components/ProcessPage'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo.processIt

export default function ProcessItRoutePage() {
  return <ProcessPage locale="it" />
}
