import type { Metadata } from 'next'
import { pageSeo } from '../seo'
import WorkClient from './WorkClient'

export const metadata: Metadata = pageSeo.work

export default function WorkPage() {
  return <WorkClient />
}
