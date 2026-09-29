'use client'

import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import Popover from './Popover'
import { cx, fieldBase, optionActive, optionRow } from './styles'

export type Option<T extends string = string> = { value: T; label: string; hint?: string; icon?: ReactNode; disabled?: boolean }

/** Keyboard model shared by single and multi select: arrows, Home/End, Enter/Space, typeahead. */
function useListNavigation<T extends string>(options: Option<T>[], onPick: (option: Option<T>) => void) {
  const [active, setActive] = useState(-1)
  const typed = useRef({ text: '', at: 0 })
  const move = (from: number, delta: number) => {
    if (!options.length) return -1
    let next = from
    for (let i = 0; i < options.length; i++) {
      next = (next + delta + options.length) % options.length
      if (!options[next].disabled) return next
    }
    return from
  }
  const onKeyDown = (event: KeyboardEvent, open: boolean, setOpen: (open: boolean) => void) => {
    const key = event.key
    if (!open) {
      if (key === 'ArrowDown' || key === 'ArrowUp' || key === 'Enter' || key === ' ') {
        event.preventDefault()
        setOpen(true)
      }
      return
    }
    if (key === 'ArrowDown' || key === 'ArrowUp') {
      event.preventDefault()
      setActive(current => move(current < 0 ? (key === 'ArrowDown' ? -1 : 0) : current, key === 'ArrowDown' ? 1 : -1))
    } else if (key === 'Home' || key === 'End') {
      event.preventDefault()
      setActive(key === 'Home' ? move(-1, 1) : move(0, -1))
    } else if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      if (active >= 0 && options[active] && !options[active].disabled) onPick(options[active])
    } else if (key === 'Tab') {
      setOpen(false)
    } else if (key.length === 1 && /\S/.test(key)) {
      const now = Date.now()
      typed.current = { text: (now - typed.current.at < 700 ? typed.current.text : '') + key.toLowerCase(), at: now }
      const index = options.findIndex(o => !o.disabled && o.label.toLowerCase().startsWith(typed.current.text))
      if (index >= 0) setActive(index)
    }
  }
  return { active, setActive, onKeyDown }
}

function OptionList<T extends string>({
  id,
  options,
  isSelected,
  active,
  setActive,
  onPick,
  multi,
  label
}: {
  id: string
  options: Option<T>[]
  isSelected: (value: T) => boolean
  active: number
  setActive: (index: number) => void
  onPick: (option: Option<T>) => void
  multi?: boolean
  label: string
}) {
  return (
    <div id={id} role="listbox" aria-label={label} aria-multiselectable={multi || undefined}>
      {options.length === 0 && <p className="px-2.5 py-2 text-sm text-slate-400">No options</p>}
      {options.map((option, index) => {
        const selected = isSelected(option.value)
        return (
          <div
            key={option.value}
            id={`${id}-opt-${index}`}
            role="option"
            aria-selected={selected}
            aria-disabled={option.disabled || undefined}
            onPointerMove={() => setActive(index)}
            onPointerDown={event => event.preventDefault()}
            onClick={() => !option.disabled && onPick(option)}
            className={cx(optionRow, index === active && optionActive, option.disabled && 'cursor-not-allowed opacity-50')}
          >
            {multi ? (
              <span
                className={cx(
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border',
                  selected ? 'border-[var(--brand-blue)] bg-[var(--brand-blue)] text-white dark:border-[var(--brand-gold)] dark:bg-[var(--brand-gold)] dark:text-slate-950' : 'border-slate-300 dark:border-white/25'
                )}
                aria-hidden="true"
              >
                {selected && <Check className="h-3 w-3" strokeWidth={3} />}
              </span>
            ) : null}
            {option.icon}
            <span className="min-w-0 flex-1">
              <span className="block truncate">{option.label}</span>
              {option.hint && <span className="block truncate text-xs text-slate-400">{option.hint}</span>}
            </span>
            {!multi && selected && <Check aria-hidden="true" className="h-4 w-4 shrink-0 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />}
          </div>
        )
      })}
    </div>
  )
}

type SelectProps<T extends string> = {
  value: T
  onChange: (value: T) => void
  options: Option<T>[]
  label: string
  placeholder?: string
  className?: string
  size?: 'sm' | 'md'
  disabled?: boolean
  id?: string
}

export function Select<T extends string>({ value, onChange, options, label, placeholder = 'Select', className, size = 'md', disabled, id }: SelectProps<T>) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listId = useId()
  const selected = options.find(o => o.value === value)
  const pick = (option: Option<T>) => {
    onChange(option.value)
    setOpen(false)
    buttonRef.current?.focus()
  }
  const nav = useListNavigation(options, pick)
  const toggle = (next: boolean) => {
    setOpen(next)
    if (next) nav.setActive(Math.max(0, options.findIndex(o => o.value === value)))
  }
  return (
    <>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${selected?.label ?? placeholder}`}
        aria-activedescendant={open && nav.active >= 0 ? `${listId}-opt-${nav.active}` : undefined}
        onClick={() => toggle(!open)}
        onKeyDown={event => nav.onKeyDown(event, open, toggle)}
        className={cx(fieldBase, 'flex cursor-pointer items-center justify-between gap-2 text-left', size === 'sm' ? 'h-8 text-xs' : 'h-9', className)}
      >
        <span className={cx('flex min-w-0 items-center gap-2 truncate', !selected && 'text-slate-400')}>
          {selected?.icon}
          <span className="truncate">{selected?.label ?? placeholder}</span>
        </span>
        <ChevronDown aria-hidden="true" className={cx('h-4 w-4 shrink-0 text-slate-400 transition-transform', open && 'rotate-180')} />
      </button>
      <Popover anchorRef={buttonRef} open={open} onClose={() => setOpen(false)} matchWidth>
        <OptionList id={listId} label={label} options={options} isSelected={v => v === value} active={nav.active} setActive={nav.setActive} onPick={pick} />
      </Popover>
    </>
  )
}

type MultiSelectProps<T extends string> = {
  values: T[]
  onChange: (values: T[]) => void
  options: Option<T>[]
  label: string
  placeholder?: string
  className?: string
  size?: 'sm' | 'md'
  summary?: (selected: Option<T>[]) => string
  id?: string
}

export function MultiSelect<T extends string>({ values, onChange, options, label, placeholder = 'Any', className, size = 'md', summary, id }: MultiSelectProps<T>) {
  const [open, setOpen] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listId = useId()
  const selected = options.filter(o => values.includes(o.value))
  const pick = (option: Option<T>) => onChange(values.includes(option.value) ? values.filter(v => v !== option.value) : [...values, option.value])
  const nav = useListNavigation(options, pick)
  const text = selected.length === 0 ? placeholder : summary ? summary(selected) : selected.length <= 2 ? selected.map(o => o.label).join(', ') : `${selected.length} selected`
  return (
    <>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`${label}: ${selected.length ? selected.map(o => o.label).join(', ') : placeholder}`}
        aria-activedescendant={open && nav.active >= 0 ? `${listId}-opt-${nav.active}` : undefined}
        onClick={() => {
          setOpen(!open)
          nav.setActive(0)
        }}
        onKeyDown={event => nav.onKeyDown(event, open, setOpen)}
        className={cx(fieldBase, 'flex cursor-pointer items-center justify-between gap-2 text-left', size === 'sm' ? 'h-8 text-xs' : 'h-9', className)}
      >
        <span className={cx('truncate', !selected.length && 'text-slate-400')}>{text}</span>
        <span className="flex shrink-0 items-center gap-1.5">
          {selected.length > 0 && (
            <span className="rounded-full bg-[var(--brand-blue)]/12 px-1.5 text-[10px] font-semibold tabular-nums text-[#0b6fc0] dark:bg-[var(--brand-gold)]/15 dark:text-[var(--brand-gold)]">{selected.length}</span>
          )}
          <ChevronDown aria-hidden="true" className={cx('h-4 w-4 text-slate-400 transition-transform', open && 'rotate-180')} />
        </span>
      </button>
      <Popover anchorRef={buttonRef} open={open} onClose={() => setOpen(false)} matchWidth minWidth={200}>
        <OptionList id={listId} label={label} options={options} isSelected={v => values.includes(v)} active={nav.active} setActive={nav.setActive} onPick={pick} multi />
        {values.length > 0 && (
          <div className="mt-1 border-t border-slate-100 pt-1 dark:border-white/[0.07]">
            <button type="button" onClick={() => onChange([])} className={cx(optionRow, 'text-xs text-slate-500 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-white/[0.05]')}>
              Clear selection
            </button>
          </div>
        )}
      </Popover>
    </>
  )
}

export type MenuItem = { label: string; icon?: ReactNode; onSelect: () => void; danger?: boolean; disabled?: boolean }

export function Menu({ trigger, items, label, align = 'end' }: { trigger: (props: { ref: React.RefObject<HTMLButtonElement | null>; open: boolean; toggle: () => void; onKeyDown: (e: KeyboardEvent) => void; menuId: string }) => ReactNode; items: MenuItem[]; label: string; align?: 'start' | 'end' }) {
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLButtonElement>(null)
  const menuId = useId()
  const run = (item: MenuItem) => {
    if (item.disabled) return
    setOpen(false)
    item.onSelect()
  }
  const onKeyDown = (event: KeyboardEvent) => {
    if (!open) {
      if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        setOpen(true)
        setActive(0)
      }
      return
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      setActive(i => (i + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      run(items[active])
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }
  return (
    <>
      {trigger({ ref, open, toggle: () => setOpen(o => !o), onKeyDown, menuId })}
      <Popover anchorRef={ref} open={open} onClose={() => setOpen(false)} align={align} minWidth={190}>
        <div role="menu" id={menuId} aria-label={label} aria-activedescendant={`${menuId}-item-${active}`}>
          {items.map((item, index) => (
            <div
              key={item.label}
              id={`${menuId}-item-${index}`}
              role="menuitem"
              aria-disabled={item.disabled || undefined}
              onPointerMove={() => setActive(index)}
              onPointerDown={event => event.preventDefault()}
              onClick={() => run(item)}
              className={cx(optionRow, index === active && optionActive, item.danger && 'text-red-600 dark:text-red-300', item.disabled && 'cursor-not-allowed opacity-50')}
            >
              {item.icon}
              {item.label}
            </div>
          ))}
        </div>
      </Popover>
    </>
  )
}
