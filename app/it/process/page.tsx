import type { Metadata } from 'next'
import { pageSeo } from '../../seo'
import ProcessItClient from './ProcessItClient'

export const metadata: Metadata = pageSeo.processIt

export default function ProcessItPage() {
  return <ProcessItClient />
}
