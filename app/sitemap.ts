import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://your-domain.com'

  return [
    {
      url: `${baseUrl}/`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/services`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/work`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/process`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date()
    }
  ]
}