'use client'

import { useState } from 'react'
import { CalendarClock, ChevronDown, Download, Flag, Tag as TagIcon, Trash2, X } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { LEAD_STATUSES, PRIORITIES } from '@/lib/admin/constants'
import { formatNumber } from '@/lib/admin/format'
import type { LeadPriority, LeadStatus, Tag } from '@/lib/admin/types'
import { Button } from '../ui/Button'
import DateTimePicker from '../ui/DateTimePicker'
import { Menu, Select } from '../ui/Listbox'
import { ConfirmDialog, Modal } from '../ui/Overlay'
import { useToast } from '../ui/Toast'
import { cx, focusRing } from '../ui/styles'

type Props = {
  ids: string[]
  tags: Tag[]
  totalMatching: number
  allMatchingSelected: boolean
  onSelectAllMatching: () => void
  onClear: () => void
  onDone: () => void
}

type BulkOp = 'status' | 'priority' | 'followUp' | 'addTag' | 'removeTag'
const CONFIRM_ABOVE = 25

function MenuButton({ label, icon, items }: { label: string; icon: React.ReactNode; items: { label: string; onSelect: () => void }[] }) {
  return (
    <Menu
      label={label}
      align="start"
      items={items}
      trigger={({ ref, open, toggle, onKeyDown, menuId }) => (
        <button
          ref={ref}
          type="button"
          aria-haspopup="menu"
          aria-expanded={open}
          aria-controls={open ? menuId : undefined}
          onClick={toggle}
          onKeyDown={onKeyDown}
          className={cx('inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-white/90 hover:bg-white/10 dark:text-slate-800 dark:hover:bg-slate-900/10', focusRing)}
        >
          {icon}
          {label}
          <ChevronDown aria-hidden="true" className="h-3 w-3 opacity-70" />
        </button>
      )}
    />
  )
}

export default function BulkBar({ ids, tags, totalMatching, allMatchingSelected, onSelectAllMatching, onClear, onDone }: Props) {
  const toast = useToast()
  const [followUpOpen, setFollowUpOpen] = useState(false)
  const [followUp, setFollowUp] = useState<string | null>(null)
  const [tagMode, setTagMode] = useState<'addTag' | 'removeTag' | null>(null)
  const [tagId, setTagId] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, setPending] = useState<{ title: string; run: () => Promise<boolean> } | null>(null)
  const [busy, setBusy] = useState(false)
  const count = ids.length

  const apply = async (op: BulkOp, value: string | null, message: string) => {
    setBusy(true)
    try {
      const result = await api.bulk(ids, op, value)
      toast.success(message, `${formatNumber(result.updated)} leads updated.`)
      onDone()
      return true
    } catch (error) {
      toast.error('Bulk update failed', (error as Error).message)
      return false
    } finally {
      setBusy(false)
    }
  }

  /** Changes to many leads at once ask first; small selections apply immediately. */
  const run = async (op: BulkOp, value: string | null, message: string, description: string) => {
    if (count <= CONFIRM_ABOVE) return apply(op, value, message)
    return new Promise<boolean>(resolve => {
      setPending({
        title: `${description} for ${formatNumber(count)} leads?`,
        run: async () => {
          const ok = await apply(op, value, message)
          resolve(ok)
          return ok
        }
      })
    })
  }

  const exportSelected = async () => {
    try {
      const rows = await api.exportLeads({ ids })
      toast.success('Export ready', `${formatNumber(rows)} leads exported.`)
    } catch (error) {
      toast.error('Export failed', (error as Error).message)
    }
  }

  const remove = async () => {
    try {
      const result = await api.deleteLeads(ids)
      toast.success('Leads deleted', `${formatNumber(result.deleted)} leads removed.`)
      setConfirmDelete(false)
      onClear()
      onDone()
    } catch (error) {
      toast.error('Delete failed', (error as Error).message)
    }
  }

  return (
    <>
      <div role="region" aria-label="Bulk actions" className="admin-pop-in sticky bottom-4 z-30 mx-auto flex w-fit max-w-full flex-wrap items-center gap-1 rounded-2xl bg-slate-900 px-2 py-1.5 text-white shadow-[0_20px_50px_-15px_rgba(15,23,42,0.6)] dark:bg-slate-100 dark:text-slate-900">
        <span className="px-2 text-xs font-semibold tabular-nums" aria-live="polite">
          {formatNumber(count)} selected
        </span>
        {!allMatchingSelected && totalMatching > count && (
          <button type="button" onClick={onSelectAllMatching} className={cx('rounded-lg px-2 text-xs underline underline-offset-2 opacity-80 hover:opacity-100', focusRing)}>
            Select all {formatNumber(totalMatching)}
          </button>
        )}
        <span className="mx-1 hidden h-5 w-px bg-white/20 sm:block dark:bg-slate-900/15" aria-hidden="true" />
        <MenuButton label="Status" icon={<Flag className="h-3.5 w-3.5" />} items={LEAD_STATUSES.map(s => ({ label: s.label, onSelect: () => run('status', s.value satisfies LeadStatus, `Status set to ${s.label}`, `Set status to ${s.label}`) }))} />
        <MenuButton label="Priority" icon={<Flag className="h-3.5 w-3.5" />} items={PRIORITIES.map(p => ({ label: p.label, onSelect: () => run('priority', p.value satisfies LeadPriority, `Priority set to ${p.label}`, `Set priority to ${p.label}`) }))} />
        <MenuButton
          label="Tags"
          icon={<TagIcon className="h-3.5 w-3.5" />}
          items={[
            { label: 'Add tag…', onSelect: () => setTagMode('addTag') },
            { label: 'Remove tag…', onSelect: () => setTagMode('removeTag') }
          ]}
        />
        <MenuButton
          label="Follow-up"
          icon={<CalendarClock className="h-3.5 w-3.5" />}
          items={[
            { label: 'Set follow-up…', onSelect: () => setFollowUpOpen(true) },
            { label: 'Clear follow-up', onSelect: () => run('followUp', null, 'Follow-ups cleared', 'Clear follow-ups') }
          ]}
        />
        <button type="button" onClick={exportSelected} className={cx('inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium hover:bg-white/10 dark:hover:bg-slate-900/10', focusRing)}>
          <Download className="h-3.5 w-3.5" />
          Export
        </button>
        <button type="button" onClick={() => setConfirmDelete(true)} className={cx('inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2.5 text-xs font-medium text-red-300 hover:bg-red-500/20 dark:text-red-600 dark:hover:bg-red-600/10', focusRing)}>
          <Trash2 className="h-3.5 w-3.5" />
          Delete
        </button>
        <button type="button" onClick={onClear} aria-label="Clear selection" className={cx('ml-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg hover:bg-white/10 dark:hover:bg-slate-900/10', focusRing)}>
          <X className="h-4 w-4" />
        </button>
      </div>

      <Modal
        open={followUpOpen}
        onClose={() => setFollowUpOpen(false)}
        size="sm"
        title={`Schedule follow-up for ${formatNumber(count)} leads`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setFollowUpOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={busy}
              onClick={async () => {
                setFollowUpOpen(false)
                await run('followUp', followUp, followUp ? 'Follow-up scheduled' : 'Follow-up cleared', followUp ? 'Schedule a follow-up' : 'Clear follow-ups')
              }}
            >
              {followUp ? 'Schedule' : 'Clear follow-ups'}
            </Button>
          </>
        }
      >
        <DateTimePicker label="Follow-up date and time" value={followUp} onChange={setFollowUp} placeholder="Pick a date (empty clears follow-ups)" />
      </Modal>

      <Modal
        open={tagMode !== null}
        onClose={() => setTagMode(null)}
        size="sm"
        title={tagMode === 'addTag' ? `Add a tag to ${formatNumber(count)} leads` : `Remove a tag from ${formatNumber(count)} leads`}
        footer={
          <>
            <Button variant="ghost" onClick={() => setTagMode(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              loading={busy}
              disabled={!tagId}
              onClick={async () => {
                if (!tagMode) return
                const tagName = tags.find(t => t.id === tagId)?.name ?? 'tag'
                setTagMode(null)
                await run(tagMode, tagId, tagMode === 'addTag' ? 'Tag added' : 'Tag removed', tagMode === 'addTag' ? `Add “${tagName}”` : `Remove “${tagName}”`)
              }}
            >
              {tagMode === 'addTag' ? 'Add tag' : 'Remove tag'}
            </Button>
          </>
        }
      >
        {tags.length ? (
          <Select label="Tag" value={tagId} onChange={setTagId} options={tags.map(t => ({ value: t.id, label: t.name }))} placeholder="Choose a tag" />
        ) : (
          <p className="text-sm text-slate-500">No tags exist yet. Create tags from a lead or in Settings.</p>
        )}
      </Modal>

      <ConfirmDialog
        open={pending !== null}
        onClose={() => setPending(null)}
        title={pending?.title ?? ''}
        description="This changes every selected lead and is recorded in each lead’s activity."
        confirmLabel="Apply to all"
        onConfirm={async () => {
          if (pending && (await pending.run())) setPending(null)
        }}
      />

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={remove}
        danger
        title={`Delete ${formatNumber(count)} leads?`}
        description="Their notes, activity and pending duplicate reviews are deleted too. This cannot be undone."
        confirmLabel={`Delete ${formatNumber(count)} leads`}
      />
    </>
  )
}
