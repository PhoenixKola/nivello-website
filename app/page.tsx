import type { Metadata } from 'next'
import { pageSeo } from './seo'
import HomeClient from './HomeClient'

export const metadata: Metadata = pageSeo.home

export default function Home() {
  return <HomeClient />
}
