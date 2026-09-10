import type { Metadata } from 'next'
import AboutPage from '@/components/AboutPage'
import { pageSeo } from '../../seo'

export const metadata: Metadata = pageSeo.aboutIt

export default function AboutItRoute() {
  return <AboutPage locale="it" />
}
