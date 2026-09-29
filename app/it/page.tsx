import type { Metadata } from 'next'
import HomePage from '@/components/HomePage'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo.homeIt

export default function HomeItPage() {
  return <HomePage locale="it" />
}
