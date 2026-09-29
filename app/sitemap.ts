import type { MetadataRoute } from 'next'
import { getProjectPath, getProjects } from '@/lib/projects'
import { getServicePath, services } from '@/lib/services'
import { SITE_URL, siteRoutes, type Locale } from '@/lib/site'

export const dynamic = 'force-static'

type LocalizedPaths = Record<Locale, string>

// Keep the trailing slash on the home URL so entries match canonical links exactly.
const url = (path: string) => `${SITE_URL}${path}`

function entry(paths: LocalizedPaths, locale: Locale): MetadataRoute.Sitemap[number] {
  return {
    url: url(paths[locale]),
    alternates: {
      languages: { en: url(paths.en), it: url(paths.it), 'x-default': url(paths.en) }
    }
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: LocalizedPaths[] = [
    ...siteRoutes.map(route => route.paths),
    ...services.map(service => ({ en: getServicePath(service.slug, 'en'), it: getServicePath(service.slug, 'it') })),
    ...getProjects('en').map(project => ({ en: getProjectPath(project.slug, 'en'), it: getProjectPath(project.slug, 'it') }))
  ]

  return (['en', 'it'] as const).flatMap(locale => pages.map(paths => entry(paths, locale)))
}
