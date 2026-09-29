// Shared admin design tokens (Tailwind class strings) so every control looks and behaves alike.

export const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-blue)] focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-[var(--brand-gold)] dark:focus-visible:ring-offset-slate-950'

export const surface =
  'rounded-2xl border border-slate-200/80 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] dark:border-white/[0.08] dark:bg-slate-900/60 dark:shadow-none'

export const popoverSurface =
  'rounded-xl border border-slate-200 bg-white shadow-[0_18px_50px_-12px_rgba(15,23,42,0.25)] dark:border-white/10 dark:bg-slate-900 dark:shadow-[0_18px_50px_-12px_rgba(0,0,0,0.7)]'

export const fieldBase =
  'w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 placeholder:text-slate-400 transition-colors hover:border-slate-300 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/20 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500 dark:hover:border-white/20 dark:focus:border-[var(--brand-gold)] dark:focus:ring-[var(--brand-gold)]/20'

export const labelText = 'mb-1.5 block text-xs font-medium text-slate-600 dark:text-slate-300'
export const mutedText = 'text-slate-500 dark:text-slate-400'
export const sectionTitle = 'text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-500'

export const optionRow =
  'flex w-full cursor-pointer select-none items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-slate-700 dark:text-slate-200'
export const optionActive = 'bg-slate-100 dark:bg-white/[0.07]'

export function cx(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(' ')
}
