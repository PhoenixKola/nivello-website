// First-party, aggregate-only analytics for the public site (see public/admin-api/_analytics.php).
// No cookies, no fingerprinting: a random id lives in sessionStorage for the tab's lifetime only.
// Failures are silent by design; tracking must never affect navigation or forms.

export const ANALYTICS_EVENTS = [
  'page_view',
  'cta_click',
  'project_launcher_start',
  'project_launcher_complete',
  'contact_start',
  'contact_submit',
  'work_case_study_open'
] as const

export type AnalyticsEvent = (typeof ANALYTICS_EVENTS)[number]

const ENDPOINT = '/admin-api/analytics-track.php'
const SESSION_KEY = 'nv_sid'

function disabled() {
  if (typeof window === 'undefined') return true
  const nav = navigator as Navigator & { globalPrivacyControl?: boolean }
  return nav.doNotTrack === '1' || nav.globalPrivacyControl === true || window.location.pathname.startsWith('/admin')
}

function sessionId() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY)
    if (!id) {
      const bytes = crypto.getRandomValues(new Uint8Array(12))
      id = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
      sessionStorage.setItem(SESSION_KEY, id)
    }
    return id
  } catch {
    return null
  }
}

// Funnel steps count once per session, so "started" can never exceed the sessions it came from.
const ONCE_PER_SESSION: ReadonlySet<AnalyticsEvent> = new Set(['project_launcher_start', 'project_launcher_complete', 'contact_start'])

function firstInSession(event: AnalyticsEvent) {
  if (!ONCE_PER_SESSION.has(event)) return true
  try {
    const key = `nv_once_${event}`
    if (sessionStorage.getItem(key)) return false
    sessionStorage.setItem(key, '1')
  } catch {
    // Without sessionStorage there is no session id either, so nothing is sent.
  }
  return true
}

/** The browser's IANA time zone; the server turns it into a country code. No IP is used. */
function timeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || undefined
  } catch {
    return undefined
  }
}

function device() {
  const width = window.innerWidth
  return width < 640 ? 'mobile' : width < 1024 ? 'tablet' : 'desktop'
}

/** Labels are short snake_case identifiers, e.g. "hero_primary". */
export function track(event: AnalyticsEvent, label?: string) {
  if (disabled()) return
  const s = sessionId()
  if (!s || !firstInSession(event)) return
  const payload = JSON.stringify({
    e: event,
    p: window.location.pathname,
    s,
    l: document.documentElement.lang === 'it' ? 'it' : 'en',
    d: device(),
    r: document.referrer || undefined,
    c: label,
    z: timeZone()
  })
  try {
    // text/plain keeps the beacon a simple request; the endpoint parses JSON itself.
    const blob = new Blob([payload], { type: 'text/plain' })
    if (navigator.sendBeacon?.(ENDPOINT, blob)) return
    void fetch(ENDPOINT, { method: 'POST', body: payload, keepalive: true, headers: { 'Content-Type': 'text/plain' } }).catch(() => {})
  } catch {
    // ignore
  }
}
