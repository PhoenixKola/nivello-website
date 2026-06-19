import type { Metadata } from 'next'
import { pageSeo } from '../seo'
import HomeItClient from './HomeItClient'

export const metadata: Metadata = pageSeo.homeIt

export default function HomeIt() {
  return <HomeItClient />
}
