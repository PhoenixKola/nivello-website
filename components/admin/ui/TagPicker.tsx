'use client'

import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { Check, Plus, Tag as TagIcon } from 'lucide-react'
import { TAG_COLORS } from '@/lib/admin/constants'
import type { Tag, TagColor } from '@/lib/admin/types'
import Popover from './Popover'
import { TagChip, TagSwatch } from './Badge'
import { cx, fieldBase, focusRing, optionActive, optionRow } from './styles'

type TagPickerProps = {
  tags: Tag[]
  value: string[]
  onChange: (ids: string[]) => void
  onCreate?: (name: string, color: TagColor) => Promise<Tag | null>
  label?: string
}

/** Assign/remove tags with search, keyboard navigation and inline tag creation. */
export default function TagPicker({ tags, value, onChange, onCreate, label = 'Tags' }: TagPickerProps) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [color, setColor] = useState<TagColor>('blue')
  const [creating, setCreating] = useState(false)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const listId = useId()

  const selected = value.map(id => tags.find(t => t.id === id)).filter((t): t is Tag => Boolean(t))
  const filtered = tags.filter(t => t.name.toLowerCase().includes(query.trim().toLowerCase()))
  const canCreate = Boolean(onCreate) && query.trim() !== '' && !tags.some(t => t.name.toLowerCase() === query.trim().toLowerCase())
  const toggle = (id: string) => onChange(value.includes(id) ? value.filter(v => v !== id) : [...value, id])

  const create = async () => {
    if (!onCreate || !canCreate) return
    setCreating(true)
    const tag = await onCreate(query.trim(), color)
    setCreating(false)
    if (tag) {
      onChange([...value, tag.id])
      setQuery('')
    }
  }

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const total = filtered.length + (canCreate ? 1 : 0)
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (total) setActive(i => (i + (event.key === 'ArrowDown' ? 1 : -1) + total) % total)
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (active < filtered.length) {
        if (filtered[active]) toggle(filtered[active].id)
      } else {
        create()
      }
    }
  }

  return (
    <div>
      <div className="flex flex-wrap items-center gap-1.5">
        {selected.map(tag => (
          <TagChip key={tag.id} name={tag.name} color={tag.color} onRemove={() => toggle(tag.id)} />
        ))}
        <button
          ref={buttonRef}
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => {
            setOpen(o => !o)
            setActive(0)
          }}
          className={cx(
            'inline-flex h-6 cursor-pointer items-center gap-1 rounded-md border border-dashed border-slate-300 px-2 text-xs font-medium text-slate-500 hover:border-slate-400 hover:text-slate-800 dark:border-white/20 dark:text-slate-400 dark:hover:text-white',
            focusRing
          )}
        >
          <TagIcon aria-hidden="true" className="h-3 w-3" />
          {selected.length ? 'Edit' : 'Add tag'}
        </button>
      </div>
      <Popover anchorRef={buttonRef} open={open} onClose={() => setOpen(false)} minWidth={250} role="dialog" ariaLabel={label}>
        <input
          autoFocus
          value={query}
          onChange={event => {
            setQuery(event.target.value)
            setActive(0)
          }}
          onKeyDown={onKeyDown}
          placeholder="Search or create a tag"
          aria-label="Search tags"
          aria-controls={listId}
          aria-activedescendant={`${listId}-${active}`}
          className={cx(fieldBase, 'mb-1.5 h-8 text-xs')}
        />
        <div id={listId} role="listbox" aria-multiselectable="true" aria-label={label}>
          {filtered.map((tag, index) => {
            const isSelected = value.includes(tag.id)
            return (
              <div
                key={tag.id}
                id={`${listId}-${index}`}
                role="option"
                aria-selected={isSelected}
                onPointerMove={() => setActive(index)}
                onPointerDown={event => event.preventDefault()}
                onClick={() => toggle(tag.id)}
                className={cx(optionRow, index === active && optionActive)}
              >
                <TagSwatch color={tag.color} />
                <span className="flex-1 truncate">{tag.name}</span>
                {isSelected && <Check aria-hidden="true" className="h-4 w-4 text-[var(--brand-blue)] dark:text-[var(--brand-gold)]" />}
              </div>
            )
          })}
          {!filtered.length && !canCreate && <p className="px-2.5 py-2 text-xs text-slate-400">{tags.length ? 'No matching tags' : 'No tags yet. Type a name to create one.'}</p>}
        </div>
        {canCreate && (
          <div className="mt-1 border-t border-slate-100 pt-2 dark:border-white/[0.07]">
            <div className="mb-2 flex items-center gap-1.5 px-1" role="radiogroup" aria-label="Tag color">
              {TAG_COLORS.map(c => (
                <button
                  key={c}
                  type="button"
                  role="radio"
                  aria-checked={color === c}
                  aria-label={c}
                  onClick={() => setColor(c)}
                  className={cx('flex h-6 w-6 cursor-pointer items-center justify-center rounded-full', color === c && 'ring-2 ring-slate-400 dark:ring-white/50', focusRing)}
                >
                  <TagSwatch color={c} className="h-3.5 w-3.5" />
                </button>
              ))}
            </div>
            <div
              id={`${listId}-${filtered.length}`}
              role="button"
              tabIndex={-1}
              onPointerMove={() => setActive(filtered.length)}
              onClick={create}
              className={cx(optionRow, active === filtered.length && optionActive, creating && 'opacity-60')}
            >
              <Plus aria-hidden="true" className="h-4 w-4" />
              <span className="truncate">Create “{query.trim()}”</span>
            </div>
          </div>
        )}
      </Popover>
    </div>
  )
}
