export type Locale = 'en' | 'it'

export type RouteKey =
  | 'home'
  | 'services'
  | 'work'
  | 'process'
  | 'contact'
  | 'about'
  | 'imprint'
  | 'privacy'
  | 'disclaimer'

type SiteRoute = {
  key: RouteKey
  paths: Record<Locale, string>
  labels: Record<Locale, string>
  nav?: boolean
  footer?: boolean
}

export const siteRoutes: SiteRoute[] = [
  { key: 'home', paths: { en: '/', it: '/it/' }, labels: { en: 'Home', it: 'Home' }, nav: true },
  { key: 'services', paths: { en: '/services/', it: '/it/services/' }, labels: { en: 'Services', it: 'Servizi' }, nav: true },
  { key: 'work', paths: { en: '/work/', it: '/it/work/' }, labels: { en: 'Our Work', it: 'Lavori' }, nav: true },
  { key: 'process', paths: { en: '/process/', it: '/it/process/' }, labels: { en: 'How we work', it: 'Metodo' }, nav: true },
  { key: 'contact', paths: { en: '/contact/', it: '/it/contact/' }, labels: { en: 'Contact', it: 'Contatti' }, nav: true, footer: true },
  { key: 'about', paths: { en: '/about/', it: '/it/chi-siamo/' }, labels: { en: 'About', it: 'Chi siamo' }, footer: true },
  { key: 'imprint', paths: { en: '/imprint/', it: '/it/impronta/' }, labels: { en: 'Imprint', it: 'Impronta' }, footer: true },
  { key: 'privacy', paths: { en: '/privacy/', it: '/it/privacy/' }, labels: { en: 'Privacy', it: 'Privacy' }, footer: true },
  { key: 'disclaimer', paths: { en: '/disclaimer/', it: '/it/disclaimer/' }, labels: { en: 'Disclaimer', it: 'Disclaimer' }, footer: true }
]

export const SITE_URL = 'https://www.nivello.it'

export function normalizePath(path: string) {
  const cleanPath = path.split(/[?#]/)[0]?.replace(/\/+$/, '') || '/'
  return cleanPath === '' ? '/' : cleanPath
}

export function withTrailingSlash(path: string) {
  if (path === '/') return path
  return `${normalizePath(path)}/`
}

export function getRoute(key: RouteKey) {
  const route = siteRoutes.find(item => item.key === key)
  if (!route) throw new Error(`Unknown route key: ${key}`)
  return route
}

export function getRoutePath(key: RouteKey, locale: Locale) {
  return getRoute(key).paths[locale]
}

export function getPathLocale(path: string): Locale {
  const normalized = normalizePath(path)
  return normalized === '/it' || normalized.startsWith('/it/') ? 'it' : 'en'
}

export function findRouteByPath(path: string) {
  const normalized = normalizePath(path)
  return siteRoutes.find(route =>
    Object.values(route.paths).some(routePath => normalizePath(routePath) === normalized)
  )
}

export function getLocalizedPath(path: string, locale: Locale) {
  const route = findRouteByPath(path)
  if (route) return route.paths[locale]

  const normalized = normalizePath(path)
  if (locale === 'en') {
    const englishPath = normalized.replace(/^\/it(?=\/|$)/, '') || '/'
    return withTrailingSlash(englishPath)
  }

  return normalized === '/' ? '/it/' : withTrailingSlash(`/it${normalized}`)
}

export const navRoutes = siteRoutes.filter(route => route.nav)
export const footerRoutes = siteRoutes.filter(route => route.footer)
export const sitemapRoutes = siteRoutes

export function absoluteUrl(path: string) {
  return `${SITE_URL}${path === '/' ? '' : path}`
}
