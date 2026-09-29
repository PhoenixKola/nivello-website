'use client'

import { useEffect, useState, type ComponentType, type ReactNode } from 'react'
import {
  Building2,
  CalendarCheck,
  CalendarClock,
  Check,
  Copy,
  Download,
  FileText,
  Flag,
  AtSign,
  Briefcase,
  Loader2,
  MessageSquare,
  MoreHorizontal,
  Pencil,
  PhoneCall,
  Plus,
  Sparkles,
  Tag as TagIcon,
  Trash2,
  User,
  X
} from 'lucide-react'
import { api, ApiError } from '@/lib/admin/api'
import { COMPANY_SIZES, CONTACT_LOG_TYPES, CONTACT_METHODS, INBOX_STATUS_META, LANGUAGE_LABEL, LEAD_STATUSES, PRIORITIES, PROPOSAL_STATUS_META, STAGE_LABEL } from '@/lib/admin/constants'
import { formatDateTime, formatMoney, formatRelative, hostname, instagramHandle } from '@/lib/admin/format'
import { useNow } from '@/lib/admin/hooks'
import type { Activity, ContactLogType, Lead, LeadDetail, SearchLanguage } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { PriorityBadge, StatusBadge } from '../ui/Badge'
import { Button, IconButton } from '../ui/Button'
import { Skeleton } from '../ui/Controls'
import DateTimePicker from '../ui/DateTimePicker'
import { TextArea } from '../ui/Inputs'
import { Menu, Select } from '../ui/Listbox'
import { ConfirmDialog, Drawer } from '../ui/Overlay'
import TagPicker from '../ui/TagPicker'
import { useToast } from '../ui/Toast'
import { cx, fieldBase, focusRing, labelText, surface } from '../ui/styles'
import ContactActions from './ContactActions'

type SaveState = 'idle' | 'saving' | 'saved'

function Section({ title, icon: Icon, children, actions }: { title: string; icon: ComponentType<{ className?: string }>; children: ReactNode; actions?: ReactNode }) {
  return (
    <section className={cx(surface, 'p-4')} aria-label={title}>
      <div className="mb-3 flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">
          <Icon className="h-3.5 w-3.5" />
          {title}
        </h3>
        {actions}
      </div>
      {children}
    </section>
  )
}

/** Text field that saves on blur/Enter and reverts on Escape. */
function InlineText({ label, value, onSave, type = 'text', placeholder, maxLength = 200 }: { label: string; value: string; onSave: (value: string) => Promise<boolean>; type?: string; placeholder?: string; maxLength?: number }) {
  const [draft, setDraft] = useState<string | null>(null)
  const current = draft ?? value
  const commit = async () => {
    if (draft === null || draft.trim() === value) {
      setDraft(null)
      return
    }
    const ok = await onSave(draft.trim())
    if (ok) setDraft(null)
  }
  return (
    <label className="block min-w-0">
      <span className={labelText}>{label}</span>
      <input
        type={type}
        value={current}
        placeholder={placeholder ?? '—'}
        maxLength={maxLength}
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter') event.currentTarget.blur()
          if (event.key === 'Escape' && draft !== null) {
            event.stopPropagation()
            setDraft(null)
          }
        }}
        className={cx(fieldBase, 'h-9')}
      />
    </label>
  )
}

const ACTIVITY_ICON: Record<string, ComponentType<{ className?: string }>> = {
  imported: Download,
  created: Plus,
  status_changed: Flag,
  contact_logged: PhoneCall,
  follow_up_scheduled: CalendarClock,
  follow_up_completed: CalendarCheck,
  note_added: MessageSquare,
  tag_added: TagIcon,
  tag_removed: TagIcon,
  lead_updated: Pencil,
  enriched: Sparkles,
  duplicate_merged: Copy
}

function Timeline({ activities, now }: { activities: Activity[]; now: number }) {
  if (!activities.length) return <p className="text-sm text-slate-400">No activity yet.</p>
  return (
    <ol className="relative space-y-3 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-slate-200 dark:before:bg-white/10">
      {activities.map(activity => {
        const Icon = ACTIVITY_ICON[activity.type] ?? FileText
        return (
          <li key={activity.id} className="relative flex gap-3">
            <span className="relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 dark:border-white/10 dark:bg-slate-900 dark:text-slate-400">
              <Icon className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm text-slate-800 dark:text-slate-100">{activity.message}</p>
              <p className="text-xs text-slate-400" title={formatDateTime(activity.at)}>
                {now ? formatRelative(activity.at, now) : formatDateTime(activity.at)}
              </p>
            </div>
          </li>
        )
      })}
    </ol>
  )
}

function LeadDetailView({ id, onClose }: { id: string; onClose: () => void }) {
  const { tags, createTag, notifyChanged, navigate, refreshTags } = useAdmin()
  const toast = useToast()
  const now = useNow(30000)
  const [detail, setDetail] = useState<LeadDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const [note, setNote] = useState('')
  const [noteBusy, setNoteBusy] = useState(false)
  const [logType, setLogType] = useState<ContactLogType>('call')
  const [logOutcome, setLogOutcome] = useState('')
  const [logFollowUp, setLogFollowUp] = useState<string | null>(null)
  const [logBusy, setLogBusy] = useState(false)
  const [enriching, setEnriching] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  useEffect(() => {
    let cancelled = false
    api
      .lead(id)
      .then(result => !cancelled && setDetail(result))
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [id])

  const apply = (next: LeadDetail) => {
    setDetail(next)
    notifyChanged()
  }

  const save = async (changes: Partial<Record<keyof Lead, unknown>>) => {
    setSaveState('saving')
    try {
      apply(await api.updateLead(id, changes))
      setSaveState('saved')
      if ('tags' in changes) refreshTags()
      return true
    } catch (err) {
      setSaveState('idle')
      toast.error('Not saved', err instanceof ApiError ? err.message : 'Please try again.')
      return false
    }
  }

  const addNote = async () => {
    if (!note.trim()) return
    setNoteBusy(true)
    try {
      apply(await api.addNote(id, note.trim()))
      setNote('')
    } catch (err) {
      toast.error('Note not saved', (err as Error).message)
    } finally {
      setNoteBusy(false)
    }
  }

  const logContact = async () => {
    setLogBusy(true)
    try {
      apply(await api.logContact(id, { type: logType, outcome: logOutcome.trim(), ...(logFollowUp ? { followUpAt: logFollowUp } : {}) }))
      setLogOutcome('')
      setLogFollowUp(null)
      toast.success('Contact logged')
    } catch (err) {
      toast.error('Could not log contact', (err as Error).message)
    } finally {
      setLogBusy(false)
    }
  }

  const enrich = async () => {
    setEnriching(true)
    try {
      const result = await api.enrich(id)
      apply(result)
      if (result.result.error) toast.error('Instagram lookup failed', result.result.error)
      else toast.info(result.result.status === 'found' ? 'Instagram found' : 'No Instagram link on the website')
    } catch (err) {
      toast.error('Instagram lookup failed', (err as Error).message)
    } finally {
      setEnriching(false)
    }
  }

  if (error) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">Lead unavailable</p>
        <p className="mt-1 text-sm text-slate-500">{error}</p>
        <Button className="mt-4" onClick={onClose}>
          Close
        </Button>
      </div>
    )
  }
  if (!detail) {
    return (
      <div className="space-y-3 p-6" aria-label="Loading lead" role="status">
        <Skeleton className="h-8 w-2/3" />
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="mt-6 h-40" />
        <Skeleton className="h-40" />
      </div>
    )
  }

  const { lead, score } = detail
  const followUpOpen = Boolean(lead.followUpAt) && !lead.followUpCompletedAt

  return (
    <>
      <header className="border-b border-slate-200 bg-white px-5 py-4 dark:border-white/[0.08] dark:bg-slate-900/70 sm:px-6">
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{lead.companyName}</h2>
            <p className="mt-0.5 truncate text-sm text-slate-500 dark:text-slate-400">{[lead.category, [lead.city, lead.country].filter(Boolean).join(', ')].filter(Boolean).join(' · ') || 'No category or location'}</p>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <StatusBadge status={lead.status} />
              <PriorityBadge priority={lead.priority} />
              <span className="ml-1 text-xs text-slate-400" aria-live="polite">
                {saveState === 'saving' ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" /> Saving
                  </span>
                ) : saveState === 'saved' ? (
                  <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                    <Check className="h-3 w-3" /> Saved
                  </span>
                ) : null}
              </span>
            </div>
          </div>
          <Menu
            label="Lead actions"
            items={[{ label: 'Delete lead', icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => setConfirmDelete(true) }]}
            trigger={({ ref, open, toggle, onKeyDown, menuId }) => (
              <IconButton ref={ref} label="Lead actions" aria-haspopup="menu" aria-expanded={open} aria-controls={open ? menuId : undefined} onClick={toggle} onKeyDown={onKeyDown}>
                <MoreHorizontal className="h-4 w-4" />
              </IconButton>
            )}
          />
          <IconButton label="Close lead" onClick={onClose}>
            <X className="h-4 w-4" />
          </IconButton>
        </div>
        <div className="mt-3">
          <ContactActions lead={lead} variant="buttons" />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,20rem)]">
          <div className="min-w-0 space-y-4">
            <Section title="CRM" icon={Flag}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <span className={labelText}>Status</span>
                  <Select label="Status" value={lead.status} onChange={v => save({ status: v })} options={LEAD_STATUSES} />
                </div>
                <div>
                  <span className={labelText}>Priority</span>
                  <Select label="Priority" value={lead.priority} onChange={v => save({ priority: v })} options={PRIORITIES} />
                </div>
                <div className="sm:col-span-2">
                  <InlineText label="Next action" value={lead.nextAction} onSave={v => save({ nextAction: v })} placeholder="e.g. Send website mock-up" maxLength={300} />
                </div>
                <div className="sm:col-span-2">
                  <span className={labelText}>Follow-up</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <DateTimePicker label="Follow-up" value={lead.followUpAt} onChange={v => save({ followUpAt: v })} className="min-w-[14rem] flex-1" />
                    {followUpOpen && (
                      <Button
                        variant="secondary"
                        icon={<CalendarCheck className="h-4 w-4" />}
                        onClick={async () => {
                          try {
                            apply(await api.completeFollowUp(id))
                          } catch (err) {
                            toast.error('Could not update follow-up', (err as Error).message)
                          }
                        }}
                      >
                        Mark done
                      </Button>
                    )}
                  </div>
                  {lead.followUpCompletedAt && <p className="mt-1.5 text-xs text-emerald-600 dark:text-emerald-400">Completed {formatDateTime(lead.followUpCompletedAt)}</p>}
                </div>
                <div className="sm:col-span-2">
                  <span className={labelText}>Tags</span>
                  <TagPicker tags={tags} value={lead.tags} onChange={ids => save({ tags: ids })} onCreate={createTag} />
                </div>
              </div>
            </Section>

            <Section title="Contact" icon={User}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <InlineText label="Contact person" value={lead.contactPerson} onSave={v => save({ contactPerson: v })} maxLength={120} />
                <InlineText label="Role / title" value={lead.contactRole} onSave={v => save({ contactRole: v })} maxLength={120} />
                <InlineText label="Phone" type="tel" value={lead.phone} onSave={v => save({ phone: v })} maxLength={40} />
                <InlineText label="WhatsApp" type="tel" value={lead.whatsapp} onSave={v => save({ whatsapp: v })} maxLength={40} placeholder="Uses phone if empty" />
                <InlineText label="Email" type="email" value={lead.email} onSave={v => save({ email: v })} />
                <div>
                  <span className={labelText}>Preferred contact method</span>
                  <Select label="Preferred contact method" value={lead.preferredContact} onChange={v => save({ preferredContact: v })} options={CONTACT_METHODS} />
                </div>
              </div>
            </Section>

            <Section
              title="Company"
              icon={Building2}
              actions={
                lead.website ? (
                  <Button size="sm" variant="subtle" icon={<AtSign className="h-3.5 w-3.5" />} loading={enriching} onClick={enrich}>
                    {lead.instagram ? 'Re-check Instagram' : 'Find Instagram'}
                  </Button>
                ) : undefined
              }
            >
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <InlineText label="Company name" value={lead.companyName} onSave={v => save({ companyName: v })} />
                </div>
                <InlineText label="Category" value={lead.category} onSave={v => save({ category: v })} maxLength={120} />
                <div>
                  <span className={labelText}>Company size</span>
                  <Select label="Company size" value={lead.companySize} onChange={v => save({ companySize: v })} options={COMPANY_SIZES} />
                </div>
                <InlineText label="Website" type="url" value={lead.website} onSave={v => save({ website: v })} maxLength={500} placeholder="No website" />
                <InlineText label="Instagram" value={lead.instagram} onSave={v => save({ instagram: v })} placeholder="@handle or URL" />
                <div className="sm:col-span-2">
                  <InlineText label="Address" value={lead.address} onSave={v => save({ address: v })} maxLength={300} />
                </div>
                <InlineText label="City" value={lead.city} onSave={v => save({ city: v })} maxLength={120} />
                <InlineText label="Country" value={lead.country} onSave={v => save({ country: v })} maxLength={120} />
              </div>
              <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
                {lead.rating !== null && (
                  <div>
                    <dt className="inline">Rating: </dt>
                    <dd className="inline font-medium text-slate-700 dark:text-slate-200">
                      {lead.rating.toFixed(1)} ★ ({lead.reviewCount ?? 0} reviews)
                    </dd>
                  </div>
                )}
                {lead.website && (
                  <div>
                    <dt className="inline">Site: </dt>
                    <dd className="inline">{hostname(lead.website)}</dd>
                  </div>
                )}
                {lead.instagram && (
                  <div>
                    <dt className="inline">Instagram: </dt>
                    <dd className="inline">{instagramHandle(lead.instagram)}</dd>
                  </div>
                )}
                {lead.enrichment?.instagram && (
                  <div>
                    <dt className="inline">Instagram check: </dt>
                    <dd className="inline">{lead.enrichment.instagram.replace('_', ' ')}</dd>
                  </div>
                )}
              </dl>
            </Section>

            <Section title="Notes" icon={MessageSquare}>
              <TextArea value={note} onChange={e => setNote(e.target.value)} placeholder="Add a note…" aria-label="New note" maxLength={4000} rows={3} />
              <div className="mt-2 flex justify-end">
                <Button size="sm" variant="primary" onClick={addNote} loading={noteBusy} disabled={!note.trim()}>
                  Add note
                </Button>
              </div>
              <ul className="mt-3 space-y-2">
                {detail.notes.map(n => (
                  <li key={n.id} className="group rounded-xl bg-slate-50 px-3 py-2.5 dark:bg-white/[0.04]">
                    <p className="whitespace-pre-wrap break-words text-sm text-slate-800 dark:text-slate-100">{n.body}</p>
                    <div className="mt-1 flex items-center justify-between">
                      <span className="text-xs text-slate-400">{formatDateTime(n.createdAt)}</span>
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            apply(await api.deleteNote(n.id))
                          } catch (err) {
                            toast.error('Could not delete note', (err as Error).message)
                          }
                        }}
                        className={cx('cursor-pointer rounded text-xs text-slate-400 opacity-0 hover:text-red-600 focus:opacity-100 group-hover:opacity-100', focusRing)}
                      >
                        Delete
                      </button>
                    </div>
                  </li>
                ))}
                {!detail.notes.length && <li className="text-sm text-slate-400">No notes yet.</li>}
              </ul>
            </Section>
          </div>

          <div className="min-w-0 space-y-4">
            <Section title="Opportunity score" icon={Sparkles}>
              <p className="flex items-baseline gap-1">
                <span className="text-3xl font-semibold tabular-nums text-slate-900 dark:text-white">{score.score}</span>
                <span className="text-sm text-slate-400">/ 100</span>
              </p>
              <div className="mt-2 h-1.5 rounded-full bg-slate-100 dark:bg-white/[0.07]">
                <div className="h-full rounded-full bg-[var(--brand-blue)] dark:bg-[var(--brand-gold)]" style={{ width: `${score.score}%` }} />
              </div>
              <ul className="mt-3 space-y-1 text-sm" aria-label="Score reasons">
                {score.reasons.map(reason => (
                  <li key={reason.label} className="flex items-start gap-2">
                    <span className={cx('w-8 shrink-0 text-right font-mono text-xs tabular-nums leading-5', reason.delta > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400')}>
                      {reason.delta > 0 ? `+${reason.delta}` : reason.delta}
                    </span>
                    <span className="text-slate-700 dark:text-slate-200">{reason.label}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-[11px] text-slate-400">Starts at 40; each factor adds or subtracts points.</p>
            </Section>

            <Section title="Log contact" icon={PhoneCall}>
              <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="Contact type">
                {CONTACT_LOG_TYPES.map(t => (
                  <button
                    key={t.value}
                    type="button"
                    role="radio"
                    aria-checked={logType === t.value}
                    onClick={() => setLogType(t.value)}
                    className={cx(
                      'h-8 cursor-pointer rounded-lg px-2.5 text-xs font-medium ring-1 ring-inset transition-colors',
                      logType === t.value ? 'bg-slate-900 text-white ring-slate-900 dark:bg-white dark:text-slate-950 dark:ring-white' : 'text-slate-600 ring-slate-200 hover:bg-slate-50 dark:text-slate-300 dark:ring-white/10 dark:hover:bg-white/[0.05]',
                      focusRing
                    )}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
              <input value={logOutcome} onChange={e => setLogOutcome(e.target.value)} placeholder="Outcome (optional)" aria-label="Outcome" maxLength={500} className={cx(fieldBase, 'mt-2.5 h-9')} />
              <div className="mt-2">
                <DateTimePicker label="Next follow-up" value={logFollowUp} onChange={setLogFollowUp} placeholder="Next follow-up (optional)" />
              </div>
              <Button className="mt-2.5 w-full" variant="primary" size="sm" onClick={logContact} loading={logBusy}>
                Log {CONTACT_LOG_TYPES.find(t => t.value === logType)?.label.toLowerCase()}
              </Button>
              {lead.lastContactedAt && <p className="mt-2 text-xs text-slate-500">Last contacted {formatDateTime(lead.lastContactedAt)}</p>}
            </Section>

            <Section title="Business" icon={Briefcase}>
              <RelatedRecords
                detail={detail}
                go={(section, params) => {
                  navigate(section, params)
                  onClose()
                }}
              />
            </Section>

            <Section title="Source" icon={Download}>
              <dl className="space-y-2 text-sm">
                <div>
                  <dt className="text-xs text-slate-400">Origin</dt>
                  <dd className="text-slate-700 dark:text-slate-200">{lead.source === 'discovery' ? 'Discovery' : lead.source === 'csv' ? 'CSV import' : lead.source === 'inbox' ? 'Website inquiry' : 'Manual'}</dd>
                </div>
                {detail.batch ? (
                  <div>
                    <dt className="text-xs text-slate-400">Discovery batch</dt>
                    <dd>
                      <button
                        type="button"
                        onClick={() => {
                          navigate('leads', { batch: detail.batch!.id })
                          onClose()
                        }}
                        className={cx('cursor-pointer rounded text-left text-[#0b6fc0] hover:underline dark:text-[var(--brand-gold)]', focusRing)}
                      >
                        {detail.batch.label}
                      </button>
                    </dd>
                  </div>
                ) : (
                  lead.sourceBatchId && (
                    <div>
                      <dt className="text-xs text-slate-400">Discovery batch</dt>
                      <dd className="text-slate-500">Deleted</dd>
                    </div>
                  )
                )}
                {lead.sourceQuery && (
                  <div>
                    <dt className="text-xs text-slate-400">Query</dt>
                    <dd className="break-words text-slate-700 dark:text-slate-200">
                      {lead.sourceQuery}
                      {lead.sourceLang && ` (${LANGUAGE_LABEL[lead.sourceLang as SearchLanguage] ?? lead.sourceLang})`}
                    </dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs text-slate-400">Imported</dt>
                  <dd className="text-slate-700 dark:text-slate-200">{formatDateTime(lead.createdAt)}</dd>
                </div>
                {lead.sourceId && (
                  <div>
                    <dt className="text-xs text-slate-400">Place ID</dt>
                    <dd className="break-all font-mono text-xs text-slate-500">{lead.sourceId}</dd>
                  </div>
                )}
                {detail.pendingDuplicates > 0 && (
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        navigate('duplicates')
                        onClose()
                      }}
                      className={cx('cursor-pointer rounded text-xs font-medium text-amber-700 hover:underline dark:text-amber-300', focusRing)}
                    >
                      {detail.pendingDuplicates} possible duplicate{detail.pendingDuplicates > 1 ? 's' : ''} to review
                    </button>
                  </div>
                )}
              </dl>
            </Section>

            <Section title="Activity" icon={CalendarClock}>
              <Timeline activities={detail.activities} now={now} />
            </Section>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        danger
        title={`Delete ${lead.companyName}?`}
        description="The lead, its notes and activity are deleted. This cannot be undone."
        confirmLabel="Delete lead"
        onConfirm={async () => {
          try {
            await api.deleteLeads([id])
            toast.success('Lead deleted')
            notifyChanged()
            setConfirmDelete(false)
            onClose()
          } catch (err) {
            toast.error('Could not delete lead', (err as Error).message)
          }
        }}
      />
    </>
  )
}

function RelatedRecords({ detail, go }: { detail: LeadDetail; go: (section: 'inbox' | 'projects' | 'proposals', params: Record<string, string>) => void }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const { inbox, projects, proposals } = detail.related
  const link = 'cursor-pointer rounded text-left text-[#0b6fc0] hover:underline dark:text-[var(--brand-gold)]'
  const createProject = async () => {
    setBusy(true)
    try {
      const created = await api.createProject({ name: `Project for ${detail.lead.companyName}`.slice(0, 120), clientName: detail.lead.companyName, leadId: detail.lead.id, stage: 'discovery' })
      toast.success('Project created')
      go('projects', { project: created.project.id })
    } catch (err) {
      toast.error('Could not create the project', (err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <div className="space-y-3 text-sm">
      {inbox.length > 0 && (
        <div>
          <p className="text-xs text-slate-400">Website inquiries</p>
          <ul className="mt-1 space-y-1">
            {inbox.map(i => (
              <li key={i.id}>
                <button type="button" className={cx(link, focusRing)} onClick={() => go('inbox', { inquiry: i.id })}>
                  {formatDateTime(i.createdAt)}
                </button>
                <span className="ml-1.5 text-xs text-slate-500">{INBOX_STATUS_META[i.status].label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <div>
        <p className="text-xs text-slate-400">Proposals</p>
        {proposals.length ? (
          <ul className="mt-1 space-y-1">
            {proposals.map(p => (
              <li key={p.id}>
                <button type="button" className={cx(link, focusRing)} onClick={() => go('proposals', { proposal: p.id })}>
                  {p.number}
                </button>
                <span className="ml-1.5 text-xs text-slate-500">
                  {PROPOSAL_STATUS_META[p.status].label} · {formatMoney(p.total, p.currency)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">None yet</p>
        )}
      </div>
      <div>
        <p className="text-xs text-slate-400">Projects</p>
        {projects.length ? (
          <ul className="mt-1 space-y-1">
            {projects.map(p => (
              <li key={p.id}>
                <button type="button" className={cx(link, focusRing)} onClick={() => go('projects', { project: p.id })}>
                  {p.name}
                </button>
                <span className="ml-1.5 text-xs text-slate-500">{STAGE_LABEL[p.stage]}</span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-slate-500">None yet</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" icon={<FileText className="h-3.5 w-3.5" />} onClick={() => go('proposals', { new: '1', lead: detail.lead.id })}>
          New proposal
        </Button>
        <Button size="sm" variant="ghost" icon={<Plus className="h-3.5 w-3.5" />} loading={busy} onClick={createProject}>
          New project
        </Button>
      </div>
    </div>
  )
}

export default function LeadDrawer() {
  const { leadId, closeLead } = useAdmin()
  return (
    <Drawer open={leadId !== null} onClose={closeLead} label="Lead details">
      {leadId && <LeadDetailView key={leadId} id={leadId} onClose={closeLead} />}
    </Drawer>
  )
}
