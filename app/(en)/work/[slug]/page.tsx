import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CaseStudyPage from '@/components/CaseStudyPage'
import { absoluteUrl } from '@/lib/site'
import { localeAlternates } from '@/lib/seo'
import { getProject, getProjectPath, getProjects } from '@/lib/projects'

export function generateStaticParams() {
  return getProjects('en').map(project => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const project = getProject(slug, 'en')
  if (!project) return {}
  const title = `${project.title} case study`

  return {
    title,
    description: project.desc,
    alternates: localeAlternates(
      { en: getProjectPath(project.slug, 'en'), it: getProjectPath(project.slug, 'it') },
      'en'
    ),
    openGraph: {
      title: `${title} | Nivello`,
      description: project.desc,
      url: absoluteUrl(getProjectPath(project.slug, 'en')),
      siteName: 'Nivello',
      type: 'article',
      locale: 'en_US',
      images: [{ url: project.shot, width: 1200, height: 800, alt: project.title }]
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | Nivello`,
      description: project.desc,
      images: [project.shot]
    }
  }
}

export default async function ProjectPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!getProject(slug, 'en')) notFound()
  return <CaseStudyPage slug={slug} />
}
