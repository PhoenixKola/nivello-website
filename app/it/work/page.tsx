import type { Metadata } from 'next'
import { pageSeo } from '../../seo'
import WorkItClient from './WorkItClient'

export const metadata: Metadata = pageSeo.workIt

export default function WorkItPage() {
  return <WorkItClient />
}
