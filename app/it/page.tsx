import type { Metadata } from 'next'
import { pageSeo } from '../seo'
import HomeItClient from './HomeItClient'

export const metadata: Metadata = {
  ...pageSeo.homeIt,
  title: {
    absolute: 'Nivello'
  }
}

export default function HomeIt() {
  return <HomeItClient />
}
