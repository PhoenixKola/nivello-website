import type { Metadata } from 'next'
import { pageSeo } from '../seo'
import ProcessClient from './ProcessClient'

export const metadata: Metadata = pageSeo.process

export default function ProcessPage() {
  return <ProcessClient />
}
