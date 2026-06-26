import type { Metadata } from 'next'
import { pageSeo } from './seo'
import HomeClient from './HomeClient'

export const metadata: Metadata = {
  ...pageSeo.home,
  title: {
    absolute: 'Nivello'
  }
}

export default function Home() {
  return <HomeClient />
}
