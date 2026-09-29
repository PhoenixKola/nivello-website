'use client'

import { cx, focusRing } from './styles'

export type LocalNavItem = { id: string; label: string; href: string; active: boolean; count?: number | null; onSelect?: () => void }

/** Secondary navigation inside a product area. Scrolls horizontally on narrow screens. */
export default function LocalNav({ items, label }: { items: LocalNavItem[]; label: string }) {
  return (
    <nav aria-label={label} className="relative -mx-1 mb-5 overflow-x-auto px-1 [scrollbar-width:none]">
      <ul className="flex w-max min-w-full gap-1 border-b border-slate-200 dark:border-white/[0.08]">
        {items.map(item => (
          <li key={item.id}>
            <a
              href={item.href}
              onClick={item.onSelect}
              aria-current={item.active ? 'page' : undefined}
              className={cx(
                'relative -mb-px inline-flex h-10 items-center gap-1.5 whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors',
                item.active
                  ? 'border-[var(--brand-blue)] text-slate-900 dark:border-[var(--brand-gold)] dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white',
                focusRing
              )}
            >
              {item.label}
              {item.count ? (
                <span className="rounded-full bg-slate-100 px-1.5 text-[10px] font-semibold tabular-nums text-slate-600 dark:bg-white/10 dark:text-slate-300">{item.count}</span>
              ) : null}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
