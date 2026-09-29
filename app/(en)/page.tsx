import type { Metadata } from 'next'
import HomePage from '@/components/HomePage'
import { pageSeo } from '@/lib/seo'

export const metadata: Metadata = pageSeo.home

export default function HomeRoute() {
  return <HomePage locale="en" />
}
