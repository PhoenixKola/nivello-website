const dateTime = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
const dateOnly = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
const shortDate = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short' })
const timeOnly = new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' })

export function formatDateTime(iso: string | null | undefined) {
  return iso ? dateTime.format(new Date(iso)) : '—'
}

export function formatDate(iso: string | null | undefined) {
  return iso ? dateOnly.format(new Date(iso)) : '—'
}

export function formatShortDate(iso: string | null | undefined) {
  return iso ? shortDate.format(new Date(iso)) : '—'
}

export function formatTime(iso: string | null | undefined) {
  return iso ? timeOnly.format(new Date(iso)) : ''
}

export function formatRelative(iso: string | null | undefined, now: number) {
  if (!iso) return '—'
  const diff = new Date(iso).getTime() - now
  const abs = Math.abs(diff)
  const minute = 60_000
  const hour = 60 * minute
  const day = 24 * hour
  const [value, unit] =
    abs < minute ? [0, 'now'] : abs < hour ? [Math.round(abs / minute), 'min'] : abs < day ? [Math.round(abs / hour), 'h'] : [Math.round(abs / day), 'd']
  if (unit === 'now') return 'just now'
  return diff < 0 ? `${value}${unit === 'min' ? ' min' : unit} ago` : `in ${value}${unit === 'min' ? ' min' : unit}`
}

export function formatDuration(ms: number) {
  if (!Number.isFinite(ms) || ms < 0) return '—'
  const total = Math.floor(ms / 1000)
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  if (h) return `${h}h ${String(m).padStart(2, '0')}m`
  if (m) return `${m}m ${String(s).padStart(2, '0')}s`
  return `${s}s`
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-GB').format(value)
}

export function hostname(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}

export function instagramHandle(url: string) {
  const match = /instagram\.com\/([^/?#]+)/i.exec(url)
  return match ? `@${match[1]}` : url
}

export function phoneDigits(phone: string) {
  return phone.replace(/[^\d+]/g, '')
}

export function whatsappLink(number: string) {
  return `https://wa.me/${number.replace(/\D/g, '')}`
}

/** Integer cents to a localized currency string. */
export function formatMoney(cents: number | null | undefined, currency = 'EUR', locale = 'en-GB') {
  if (cents === null || cents === undefined) return '—'
  return new Intl.NumberFormat(locale, { style: 'currency', currency, minimumFractionDigits: cents % 100 === 0 ? 0 : 2, maximumFractionDigits: 2 }).format(cents / 100)
}

/** YYYY-MM-DD (a calendar date, not an instant) for display. */
export function formatDay(date: string | null | undefined, locale = 'en-GB') {
  if (!date) return '—'
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
}

/** YYYY-MM-DD as a short day label ("23 Sept"). */
export function formatShortDay(date: string, locale = 'en-GB') {
  return new Intl.DateTimeFormat(locale, { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${date}T00:00:00Z`))
}
