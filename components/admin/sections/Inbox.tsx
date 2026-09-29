'use client'

import { useCallback, useEffect, useState } from 'react'
import { AlertCircle, AlertTriangle, Ban, CheckCheck, FolderPlus, Inbox as InboxIcon, Link2, Mail, Trash2, UserPlus, X } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { INBOX_STATUSES, INBOX_STATUS_META, STAGE_LABEL, STATUS_LABEL } from '@/lib/admin/constants'
import { formatDateTime, formatRelative } from '@/lib/admin/format'
import { useDebounced, useNow } from '@/lib/admin/hooks'
import type { InboxDetail, InboxStatus, InboxSummary } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState, Pagination, Skeleton, Tabs } from '../ui/Controls'
import { SearchInput, TextArea } from '../ui/Inputs'
import { Select } from '../ui/Listbox'
import { ConfirmDialog, Drawer } from '../ui/Overlay'
import { useToast } from '../ui/Toast'
import { cx, focusRing } from '../ui/styles'
import { ActivityTimeline, DetailRow, DrawerHeader, EntityPicker, RecordLink, type PickerKind } from './ops/shared'

type Filter = InboxStatus | 'all'
const FILTERS: Filter[] = ['all', 'new', 'qualified', 'converted', 'closed', 'spam']

export function InboxStatusBadge({ status }: { status: InboxStatus }) {
  const meta = INBOX_STATUS_META[status]
  return (
    <Badge tone={meta.tone} dot={status === 'new'}>
      {meta.label}
    </Badge>
  )
}

function InquiryDetail({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { openLead, navigate } = useAdmin()
  const toast = useToast()
  const [data, setData] = useState<InboxDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState<string | null>(null)
  const [note, setNote] = useState('')
  const [picker, setPicker] = useState<PickerKind | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .inquiry(id)
      .then(result => !cancelled && setData(result))
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [id])

  const run = async (key: string, action: () => Promise<InboxDetail>, success?: string) => {
    setBusy(key)
    try {
      setData(await action())
      if (success) toast.success(success)
      onChanged()
    } catch (err) {
      toast.error('Action failed', (err as Error).message)
    } finally {
      setBusy(null)
    }
  }

  const item = data?.item
  const mailto = item
    ? `mailto:${encodeURIComponent(item.email)}?subject=${encodeURIComponent(item.locale === 'it' ? 'La tua richiesta a Nivello' : 'Your inquiry to Nivello')}&body=${encodeURIComponent(
        `${item.locale === 'it' ? 'Ciao' : 'Hi'} ${item.name.split(' ')[0]},\n\n\n\n---\n> ${item.message.split('\n').join('\n> ')}`
      )}`
    : '#'

  return (
    <Drawer open onClose={onClose} label={item ? `Inquiry from ${item.name}` : 'Inquiry'}>
      <DrawerHeader
        title={item ? item.name : <Skeleton className="h-6 w-40" />}
        badge={item && <InboxStatusBadge status={item.status} />}
        subtitle={item && [item.company, item.email].filter(Boolean).join(' · ')}
        onClose={onClose}
        closeIcon={<X className="h-4 w-4" />}
      />
      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-5 py-5">
        {error && !data && <EmptyState icon={<AlertCircle className="h-5 w-5" />} title="Inquiry unavailable" description={error} />}
        {item && data && (
          <>
            {item.delivery === 'failed' && (
              <p role="status" className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm text-amber-800 dark:border-amber-400/20 dark:bg-amber-400/10 dark:text-amber-200">
                <AlertTriangle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
                The email delivery (Formspree) failed for this inquiry, so it may not be in the mailbox. Reply from here.
              </p>
            )}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="primary"
                size="sm"
                icon={<Mail className="h-3.5 w-3.5" />}
                onClick={() => {
                  window.location.href = mailto
                }}
              >
                Reply by email
              </Button>
              {item.status === 'new' && (
                <Button size="sm" icon={<CheckCheck className="h-3.5 w-3.5" />} loading={busy === 'replied'} onClick={() => run('replied', () => api.inquiryReplied(id), 'Marked as replied')}>
                  Mark replied
                </Button>
              )}
              {!data.lead && (
                <Button size="sm" icon={<UserPlus className="h-3.5 w-3.5" />} loading={busy === 'lead'} onClick={() => run('lead', () => api.inquiryToLead(id), 'Lead ready')}>
                  Convert to lead
                </Button>
              )}
              {!data.project && (
                <Button size="sm" icon={<FolderPlus className="h-3.5 w-3.5" />} loading={busy === 'project'} onClick={() => run('project', () => api.inquiryToProject(id), 'Project created')}>
                  Create project
                </Button>
              )}
              <div className="w-full sm:w-44">
                <Select
                  label="Status"
                  size="sm"
                  value={item.status}
                  options={INBOX_STATUSES.map(s => ({ value: s.value, label: s.label }))}
                  onChange={status => run('status', () => api.inquiryStatus(id, status))}
                />
              </div>
            </div>

            <Card>
              <CardHeader title="Message" description={`Received ${formatDateTime(item.createdAt)}${item.page ? ` on ${item.page}` : ''}`} />
              <div className="px-5 pb-5 pt-3">
                {item.brief && <p className="mb-3 rounded-lg bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:bg-white/[0.04] dark:text-slate-200">Project launcher: {item.brief}</p>}
                <p className="whitespace-pre-line break-words text-sm leading-relaxed text-slate-800 dark:text-slate-100">{item.message}</p>
              </div>
            </Card>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <Card>
                <CardHeader title="Details" />
                <dl className="px-5 pb-4 pt-1">
                  <DetailRow label="Email">
                    <a href={`mailto:${item.email}`} className={cx('break-all hover:underline', focusRing)}>
                      {item.email}
                    </a>
                  </DetailRow>
                  {item.company && <DetailRow label="Company">{item.company}</DetailRow>}
                  {item.projectType && <DetailRow label="Project type">{item.projectType}</DetailRow>}
                  {item.budget && <DetailRow label="Budget">{item.budget}</DetailRow>}
                  {item.timing && <DetailRow label="Timing">{item.timing}</DetailRow>}
                  {item.deadline && <DetailRow label="Deadline">{item.deadline}</DetailRow>}
                  <DetailRow label="Language">{item.locale === 'it' ? 'Italian' : 'English'}</DetailRow>
                  <DetailRow label="Source">{item.source.startsWith('launcher_') ? 'Project launcher' : 'Contact page'}</DetailRow>
                </dl>
              </Card>
              <Card>
                <CardHeader title="Linked records" />
                <div className="space-y-3 px-5 pb-5 pt-2 text-sm">
                  <div>
                    <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Lead</p>
                    {data.lead ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <RecordLink onClick={() => openLead(data.lead!.id)} hint={STATUS_LABEL[data.lead.status]}>
                          {data.lead.companyName}
                        </RecordLink>
                        <button type="button" className={cx('cursor-pointer text-xs text-slate-500 hover:underline', focusRing)} onClick={() => run('unlink-lead', () => api.inquiryLinkLead(id, null))}>
                          Unlink
                        </button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" icon={<Link2 className="h-3.5 w-3.5" />} onClick={() => setPicker('lead')}>
                        Link existing lead
                      </Button>
                    )}
                  </div>
                  <div>
                    <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Project</p>
                    {data.project ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <RecordLink onClick={() => navigate('projects', { project: data.project!.id })} hint={STAGE_LABEL[data.project.stage]}>
                          {data.project.name}
                        </RecordLink>
                        <button type="button" className={cx('cursor-pointer text-xs text-slate-500 hover:underline', focusRing)} onClick={() => run('unlink-project', () => api.inquiryLinkProject(id, null))}>
                          Unlink
                        </button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" icon={<Link2 className="h-3.5 w-3.5" />} onClick={() => setPicker('project')}>
                        Link existing project
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <CardHeader title="Notes" />
              <div className="space-y-3 px-5 pb-5 pt-2">
                {item.notes.map(n => (
                  <div key={n.id} className="group rounded-lg bg-slate-50 px-3 py-2 dark:bg-white/[0.04]">
                    <p className="whitespace-pre-line text-sm text-slate-800 dark:text-slate-100">{n.body}</p>
                    <div className="mt-1 flex items-center justify-between text-xs text-slate-400">
                      <span>{formatDateTime(n.createdAt)}</span>
                      <button type="button" className={cx('cursor-pointer hover:text-red-600', focusRing)} onClick={() => run('note-del', () => api.inquiryDeleteNote(id, n.id))}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
                <form
                  onSubmit={async e => {
                    e.preventDefault()
                    if (!note.trim()) return
                    await run('note', () => api.inquiryNote(id, note.trim()))
                    setNote('')
                  }}
                  className="space-y-2"
                >
                  <TextArea label="Add a note" value={note} onChange={e => setNote(e.target.value)} maxLength={5000} className="min-h-[72px]" />
                  <Button type="submit" size="sm" loading={busy === 'note'} disabled={!note.trim()}>
                    Save note
                  </Button>
                </form>
              </div>
            </Card>

            <Card>
              <CardHeader title="Activity" />
              <ActivityTimeline activities={data.activities} />
            </Card>

            <div className="flex flex-wrap justify-end gap-2">
              {item.status !== 'spam' && (
                <Button size="sm" variant="ghost" icon={<Ban className="h-3.5 w-3.5" />} onClick={() => run('spam', () => api.inquiryStatus(id, 'spam'), 'Marked as spam')}>
                  Mark as spam
                </Button>
              )}
              {(item.status === 'spam' || item.status === 'closed') && (
                <Button size="sm" variant="ghost" icon={<Trash2 className="h-3.5 w-3.5" />} className="text-red-600 dark:text-red-400" onClick={() => setConfirmDelete(true)}>
                  Delete
                </Button>
              )}
            </div>
          </>
        )}
      </div>
      {picker && (
        <EntityPicker
          kind={picker}
          open
          onClose={() => setPicker(null)}
          onPick={pickedId => run('link', () => (picker === 'lead' ? api.inquiryLinkLead(id, pickedId) : api.inquiryLinkProject(id, pickedId)), 'Linked')}
        />
      )}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        danger
        title="Delete inquiry?"
        description="The inquiry, its notes and activity are removed permanently."
        confirmLabel="Delete"
        onConfirm={async () => {
          try {
            await api.deleteInquiry(id)
            toast.success('Inquiry deleted')
            setConfirmDelete(false)
            onChanged()
            onClose()
          } catch (err) {
            toast.error('Could not delete', (err as Error).message)
          }
        }}
      />
    </Drawer>
  )
}

export default function Inbox() {
  const { route, navigate, refreshHealth } = useAdmin()
  const now = useNow(60000)
  const [filter, setFilter] = useState<Filter>('all')
  const [q, setQ] = useState('')
  const debouncedQ = useDebounced(q)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<{ items: InboxSummary[]; total: number; pages: number; counts: Record<InboxStatus, number> } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const selected = route.params.get('inquiry')

  useEffect(() => {
    let cancelled = false
    api
      .inbox(filter, debouncedQ, page)
      .then(result => {
        if (cancelled) return
        setData(result)
        setError(null)
      })
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [filter, debouncedQ, page, version])

  const refresh = useCallback(() => {
    setVersion(v => v + 1)
    refreshHealth()
  }, [refreshHealth])
  const counts = data?.counts
  const allCount = counts ? Object.entries(counts).reduce((sum, [k, v]) => (k === 'spam' ? sum : sum + v), 0) : undefined

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          label="Inbox filter"
          value={filter}
          onChange={value => {
            setFilter(value)
            setPage(1)
          }}
          tabs={FILTERS.map(f => ({ value: f, label: f === 'all' ? 'All' : INBOX_STATUS_META[f].label, count: f === 'all' ? allCount : counts?.[f] }))}
        />
        <SearchInput
          value={q}
          onChange={value => {
            setQ(value)
            setPage(1)
          }}
          placeholder="Search name, email, message…"
          label="Search inquiries"
          className="w-full sm:w-72"
        />
      </div>

      <Card>
        {error && !data ? (
          <EmptyState icon={<AlertCircle className="h-5 w-5" />} title="Inbox unavailable" description={error} action={<Button onClick={refresh}>Try again</Button>} />
        ) : !data ? (
          <div className="space-y-2 p-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : !data.items.length ? (
          <EmptyState
            icon={<InboxIcon className="h-5 w-5" />}
            title={q ? 'No inquiries match your search' : filter === 'all' ? 'No inquiries yet' : `No ${INBOX_STATUS_META[filter as InboxStatus].label.toLowerCase()} inquiries`}
            description={filter === 'all' && !q ? 'Messages sent through the website contact form appear here, alongside the usual email delivery.' : undefined}
          />
        ) : (
          <>
            <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
              {data.items.map(item => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => navigate('inbox', { inquiry: item.id })}
                    className={cx('flex w-full cursor-pointer items-start gap-3 px-5 py-3.5 text-left hover:bg-slate-50 dark:hover:bg-white/[0.03]', focusRing)}
                  >
                    <span aria-hidden="true" className={cx('mt-2 h-2 w-2 shrink-0 rounded-full', item.status === 'new' ? 'bg-sky-500' : 'bg-transparent')} />
                    <span className="min-w-0 flex-1">
                      <span className="flex flex-wrap items-baseline gap-x-2">
                        <span className={cx('truncate text-sm text-slate-900 dark:text-white', item.status === 'new' ? 'font-semibold' : 'font-medium')}>{item.name}</span>
                        {item.company && <span className="truncate text-xs text-slate-500 dark:text-slate-400">{item.company}</span>}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-slate-600 dark:text-slate-300">{item.excerpt}</span>
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <InboxStatusBadge status={item.status} />
                        {item.projectType && <Badge>{item.projectType}</Badge>}
                        {item.leadId && <Badge tone="teal">Lead</Badge>}
                        {item.projectId && <Badge tone="purple">Project</Badge>}
                        {item.delivery === 'failed' && <Badge tone="amber">Email not delivered</Badge>}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs text-slate-400">{formatRelative(item.createdAt, now)}</span>
                  </button>
                </li>
              ))}
            </ul>
            {data.pages > 1 && (
              <div className="border-t border-slate-100 px-5 py-3 dark:border-white/[0.06]">
                <Pagination page={page} pages={data.pages} onPage={setPage} />
              </div>
            )}
          </>
        )}
      </Card>
      {selected && /^inq_[a-f0-9]{16}$/.test(selected) && <InquiryDetail key={selected} id={selected} onClose={() => navigate('inbox')} onChanged={refresh} />}
    </div>
  )
}
