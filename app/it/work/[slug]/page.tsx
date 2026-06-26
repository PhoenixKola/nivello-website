import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import CaseStudyPage from '@/components/CaseStudyPage'
import { absoluteUrl } from '@/lib/site'
import { getProject, getProjectPath, getProjects } from '@/lib/projects'

export function generateStaticParams() {
  return getProjects('it').map(project => ({ slug: project.slug }))
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const project = getProject(slug, 'it')
  if (!project) return {}

  return {
    title: `${project.title} case study`,
    description: project.desc,
    alternates: {
      canonical: getProjectPath(project.slug, 'it'),
      languages: {
        en: getProjectPath(project.slug, 'en'),
        it: getProjectPath(project.slug, 'it')
      }
    },
    openGraph: {
      title: `${project.title} case study`,
      description: project.desc,
      url: absoluteUrl(getProjectPath(project.slug, 'it')),
      siteName: 'Nivello',
      type: 'article',
      locale: 'it_IT',
      images: [{ url: project.shot, width: 1200, height: 800, alt: project.title }]
    }
  }
}

export default async function ProjectItPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  if (!getProject(slug, 'it')) notFound()
  return <CaseStudyPage slug={slug} locale="it" />
}
