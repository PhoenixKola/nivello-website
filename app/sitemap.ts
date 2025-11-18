import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://www.nivello.it'

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
    },
    {
      url: `${baseUrl}/it`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/it/services`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/it/work`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/it/process`,
      lastModified: new Date()
    },
    {
      url: `${baseUrl}/it/contact`,
      lastModified: new Date()
    }
  ]
}