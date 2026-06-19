export default function StructuredData() {
  const organization = {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness'],
    name: 'Nivello',
    url: 'https://www.nivello.it',
    logo: 'https://www.nivello.it/nivello-logo-text.svg',
    email: 'office@nivello.it',
    areaServed: [
      { '@type': 'Country', name: 'Italy' },
      { '@type': 'Place', name: 'Europe' }
    ],
    serviceType: [
      'website design',
      'marketing strategy',
      'software development'
    ]
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }}
    />
  )
}
