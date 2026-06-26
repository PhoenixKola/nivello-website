import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import ServiceDetailPage from '@/components/ServiceDetailPage'
import { absoluteUrl } from '@/lib/site'
import { getService, getServicePath, services, type ServiceSlug } from '@/lib/services'

export function generateStaticParams() {
  return services.map(service => ({ slug: service.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const service = getService(slug, 'it')
  if (!service) return {}

  return {
    title: service.title,
    description: service.intro,
    alternates: {
      canonical: getServicePath(service.slug, 'it'),
      languages: {
        en: getServicePath(service.slug, 'en'),
        it: getServicePath(service.slug, 'it')
      }
    },
    openGraph: {
      title: service.title,
      description: service.intro,
      url: absoluteUrl(getServicePath(service.slug, 'it')),
      siteName: 'Nivello',
      type: 'website',
      locale: 'it_IT',
      images: [{ url: '/og/services-it', width: 1200, height: 630, alt: service.title }]
    }
  }
}

export default async function ServiceItPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const service = getService(slug, 'it')
  if (!service) notFound()
  return <ServiceDetailPage slug={slug as ServiceSlug} locale="it" />
}
