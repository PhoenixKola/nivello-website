import type { Metadata } from 'next'
import AboutPage from '@/components/AboutPage'
import { pageSeo } from '../seo'

export const metadata: Metadata = pageSeo.about

export default function AboutRoute() {
  return <AboutPage locale="en" />
}
