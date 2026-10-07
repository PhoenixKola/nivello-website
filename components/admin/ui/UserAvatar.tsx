import type { UserBrief } from '@/lib/admin/types'
import { cx } from './styles'

const TONES = [
  'bg-sky-100 text-sky-800 dark:bg-sky-400/15 dark:text-sky-200',
  'bg-violet-100 text-violet-800 dark:bg-violet-400/15 dark:text-violet-200',
  'bg-amber-100 text-amber-900 dark:bg-amber-400/15 dark:text-amber-200',
  'bg-emerald-100 text-emerald-800 dark:bg-emerald-400/15 dark:text-emerald-200',
  'bg-rose-100 text-rose-800 dark:bg-rose-400/15 dark:text-rose-200',
  'bg-teal-100 text-teal-800 dark:bg-teal-400/15 dark:text-teal-200'
]

/** "Francesko CTO" → "FR": a trailing all-caps word is a job title, not a surname. */
export function initials(name: string) {
  const words = name.trim().split(/\s+/).filter(Boolean)
  if (!words.length) return '?'
  const second = words[1]
  if (second && second !== second.toUpperCase()) return (words[0][0] + second[0]).toUpperCase()
  return words[0].slice(0, 2).toUpperCase()
}

function tone(id: string) {
  let hash = 0
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0
  return TONES[hash % TONES.length]
}

export default function UserAvatar({ user, size = 'md', className }: { user: Pick<UserBrief, 'id' | 'displayName'>; size?: 'sm' | 'md'; className?: string }) {
  return (
    <span
      aria-hidden="true"
      title={user.displayName}
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-semibold', size === 'sm' ? 'h-6 w-6 text-[10px]' : 'h-7 w-7 text-xs', tone(user.id), className)}
    >
      {initials(user.displayName)}
    </span>
  )
}
