export default function StructuredData() {
  const structuredData = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': ['Organization', 'LocalBusiness'],
        '@id': 'https://www.nivello.it/#organization',
        name: 'Nivello',
        url: 'https://www.nivello.it',
        logo: 'https://www.nivello.it/icon.svg',
        email: 'office@nivello.it',
        areaServed: [
          { '@type': 'Country', name: 'Italy' },
          { '@type': 'Place', name: 'Europe' }
        ],
        serviceType: ['website design', 'marketing strategy', 'software development']
      },
      {
        '@type': 'WebSite',
        '@id': 'https://www.nivello.it/#website',
        url: 'https://www.nivello.it',
        name: 'Nivello',
        publisher: { '@id': 'https://www.nivello.it/#organization' },
        inLanguage: ['en', 'it']
      },
      {
        '@type': 'ItemList',
        '@id': 'https://www.nivello.it/#services',
        name: 'Nivello services',
        itemListElement: [
          { '@type': 'Service', position: 1, name: 'Website strategy', provider: { '@id': 'https://www.nivello.it/#organization' } },
          { '@type': 'Service', position: 2, name: 'Marketing pages and messaging', provider: { '@id': 'https://www.nivello.it/#organization' } },
          { '@type': 'Service', position: 3, name: 'Brand and product design', provider: { '@id': 'https://www.nivello.it/#organization' } },
          { '@type': 'Service', position: 4, name: 'Next.js development', provider: { '@id': 'https://www.nivello.it/#organization' } }
        ]
      }
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
    />
  )
}
