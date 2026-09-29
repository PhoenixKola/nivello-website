'use client'

import { useCallback, useEffect, useState, type DragEvent, type FormEvent } from 'react'
import { AlertCircle, CalendarClock, FilePlus2, FolderKanban, GripVertical, Link2, MoveRight, Plus, Trash2, X } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { CURRENCIES, PRIORITIES, PRIORITY_LABEL, PROJECT_STAGES, PROPOSAL_STATUS_META, STAGE_LABEL, STATUS_LABEL } from '@/lib/admin/constants'
import { formatDay, formatMoney } from '@/lib/admin/format'
import { useDebounced, useMediaQuery } from '@/lib/admin/hooks'
import type { Currency, LeadPriority, Project, ProjectDetail, ProjectList, ProjectStage } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card, CardHeader } from '../ui/Card'
import { EmptyState, Skeleton, Tabs, useShowMore } from '../ui/Controls'
import { SearchInput, TextArea, TextField } from '../ui/Inputs'
import { Menu, Select } from '../ui/Listbox'
import { ConfirmDialog, Drawer, Modal } from '../ui/Overlay'
import { useToast } from '../ui/Toast'
import { cx, focusRing } from '../ui/styles'
import { ActivityTimeline, DrawerHeader, EntityPicker, RecordLink } from './ops/shared'

type View = 'pipeline' | 'all' | 'due' | 'archived'
const BOARD_STAGES = PROJECT_STAGES.filter(s => s.value !== 'archived')
const stageOptions = PROJECT_STAGES.map(s => ({
  value: s.value,
  label: s.label
}))

function DueBadge({ project }: { project: Project }) {
  if (!project.targetDate) return null
  if (project.due === 'overdue') return <Badge tone="red">Overdue · {formatDay(project.targetDate)}</Badge>
  if (project.due === 'soon') return <Badge tone="amber">Due {formatDay(project.targetDate)}</Badge>
  return (
    <span className="inline-flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400">
      <CalendarClock aria-hidden="true" className="h-3.5 w-3.5" />
      {formatDay(project.targetDate)}
    </span>
  )
}

const PRIORITY_DOT: Record<LeadPriority, string> = {
  low: 'bg-slate-300',
  normal: 'bg-sky-400',
  high: 'bg-orange-500',
  urgent: 'bg-red-500'
}

function ProjectCard({ project, onOpen, onMove, draggable }: { project: Project; onOpen: () => void; onMove: (stage: ProjectStage) => void; draggable?: boolean }) {
  return (
    <div
      draggable={draggable}
      onDragStart={event => {
        event.dataTransfer.setData('text/nivello-project', project.id)
        event.dataTransfer.effectAllowed = 'move'
      }}
      className={cx(
        'group rounded-xl border border-slate-200/80 bg-white p-3 shadow-sm transition-shadow hover:shadow-md dark:border-white/[0.08] dark:bg-slate-900',
        draggable && 'cursor-grab active:cursor-grabbing'
      )}
    >
      <div className="flex items-start gap-2">
        {draggable && <GripVertical aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />}
        <button type="button" onClick={onOpen} className={cx('min-w-0 flex-1 cursor-pointer text-left', focusRing)}>
          <span className="flex items-center gap-1.5">
            <span className={cx('h-1.5 w-1.5 shrink-0 rounded-full', PRIORITY_DOT[project.priority])} title={`${PRIORITY_LABEL[project.priority]} priority`} aria-hidden="true" />
            <span className="truncate text-sm font-medium text-slate-900 dark:text-white">{project.name}</span>
          </span>
          {project.clientName && <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{project.clientName}</span>}
          {project.nextAction && <span className="mt-1.5 block truncate text-xs text-slate-600 dark:text-slate-300">Next: {project.nextAction}</span>}
        </button>
        <Menu
          label={`Move ${project.name}`}
          items={PROJECT_STAGES.filter(s => s.value !== project.stage).map(s => ({
            label: `Move to ${s.label}`,
            onSelect: () => onMove(s.value)
          }))}
          trigger={({ ref, open, toggle, onKeyDown, menuId }) => (
            <button
              ref={ref}
              type="button"
              aria-label={`Move ${project.name} to another stage`}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls={open ? menuId : undefined}
              onClick={toggle}
              onKeyDown={onKeyDown}
              className={cx(
                'flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.07] dark:hover:text-white',
                focusRing
              )}
            >
              <MoveRight className="h-3.5 w-3.5" />
            </button>
          )}
        />
      </div>
      <div className="mt-2 flex flex-wrap items-center gap-2">
        {project.value !== null && <span className="text-xs font-medium tabular-nums text-slate-700 dark:text-slate-200">{formatMoney(project.value, project.currency)}</span>}
        <DueBadge project={project} />
      </div>
    </div>
  )
}

function Board({ projects, onOpen, onMove }: { projects: Project[]; onOpen: (id: string) => void; onMove: (id: string, stage: ProjectStage) => void }) {
  const [over, setOver] = useState<ProjectStage | null>(null)
  const drop = (event: DragEvent, stage: ProjectStage) => {
    event.preventDefault()
    setOver(null)
    const id = event.dataTransfer.getData('text/nivello-project')
    if (id) onMove(id, stage)
  }
  return (
    <div className="relative -mx-1 overflow-x-auto px-1 pb-3" role="region" aria-label="Project pipeline board" tabIndex={0}>
      <div className="flex w-max gap-3">
        {BOARD_STAGES.map(stage => {
          const items = projects.filter(p => p.stage === stage.value)
          return (
            <section
              key={stage.value}
              aria-label={`${stage.label} (${items.length})`}
              onDragOver={event => {
                if (event.dataTransfer.types.includes('text/nivello-project')) {
                  event.preventDefault()
                  setOver(stage.value)
                }
              }}
              onDragLeave={() => setOver(o => (o === stage.value ? null : o))}
              onDrop={event => drop(event, stage.value)}
              className={cx(
                'flex w-64 shrink-0 flex-col rounded-2xl border bg-slate-100/60 p-2 transition-colors dark:bg-white/[0.03]',
                over === stage.value ? 'border-[var(--brand-blue)] bg-sky-50 dark:border-[var(--brand-gold)] dark:bg-white/[0.06]' : 'border-transparent'
              )}
            >
              <h3 className="flex items-center gap-2 px-2 pb-2 pt-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                <span className={cx('h-2 w-2 rounded-full', stage.dot)} aria-hidden="true" />
                {stage.label}
                <span className="ml-auto rounded-full bg-white px-1.5 text-[10px] tabular-nums text-slate-500 dark:bg-white/10 dark:text-slate-300">{items.length}</span>
              </h3>
              <div className="flex min-h-24 flex-col gap-2">
                {items.map(project => (
                  <ProjectCard key={project.id} project={project} draggable onOpen={() => onOpen(project.id)} onMove={s => onMove(project.id, s)} />
                ))}
                {!items.length && <p className="rounded-xl border border-dashed border-slate-300 px-3 py-4 text-center text-xs text-slate-400 dark:border-white/10">Drop a project here</p>}
              </div>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function MobilePipeline({
  projects,
  counts,
  onOpen,
  onMove
}: {
  projects: Project[]
  counts: Record<ProjectStage, number>
  onOpen: (id: string) => void
  onMove: (id: string, stage: ProjectStage) => void
}) {
  const [stage, setStage] = useState<ProjectStage>(() => BOARD_STAGES.find(s => counts[s.value] > 0)?.value ?? 'lead')
  const items = projects.filter(p => p.stage === stage)
  return (
    <div className="space-y-3">
      <Select
        label="Stage"
        value={stage}
        onChange={setStage}
        options={BOARD_STAGES.map(s => ({
          value: s.value,
          label: `${s.label} (${counts[s.value]})`
        }))}
      />
      {items.length ? (
        items.map(p => <ProjectCard key={p.id} project={p} onOpen={() => onOpen(p.id)} onMove={s => onMove(p.id, s)} />)
      ) : (
        <p className="py-8 text-center text-sm text-slate-400">No projects in {STAGE_LABEL[stage]}.</p>
      )}
    </div>
  )
}

type FormState = {
  name: string
  clientName: string
  stage: ProjectStage
  priority: LeadPriority
  value: string
  currency: Currency
  startDate: string
  targetDate: string
  deliveredDate: string
  nextAction: string
  notes: string
  tags: string
  links: { label: string; url: string }[]
}

const toForm = (p?: Project): FormState => ({
  name: p?.name ?? '',
  clientName: p?.clientName ?? '',
  stage: p?.stage ?? 'lead',
  priority: p?.priority ?? 'normal',
  value: p?.value !== null && p?.value !== undefined ? String(p.value / 100) : '',
  currency: p?.currency ?? 'EUR',
  startDate: p?.startDate ?? '',
  targetDate: p?.targetDate ?? '',
  deliveredDate: p?.deliveredDate ?? '',
  nextAction: p?.nextAction ?? '',
  notes: p?.notes ?? '',
  tags: p?.tags.join(', ') ?? '',
  links: p?.links ?? []
})

const fromForm = (f: FormState) => ({
  name: f.name,
  clientName: f.clientName,
  stage: f.stage,
  priority: f.priority,
  value: f.value.trim() === '' ? null : Number(f.value.replace(',', '.')),
  currency: f.currency,
  startDate: f.startDate || null,
  targetDate: f.targetDate || null,
  deliveredDate: f.deliveredDate || null,
  nextAction: f.nextAction,
  notes: f.notes,
  tags: f.tags
    .split(',')
    .map(t => t.trim())
    .filter(Boolean),
  links: f.links.filter(l => l.url.trim())
})

function ProjectFields({ form, setForm }: { form: FormState; setForm: (update: (f: FormState) => FormState) => void }) {
  const set =
    <K extends keyof FormState>(key: K) =>
    (value: FormState[K]) =>
      setForm(f => ({ ...f, [key]: value }))
  return (
    <div className="space-y-4">
      <TextField label="Project name" value={form.name} maxLength={120} onChange={e => set('name')(e.target.value)} required />
      <TextField label="Client" value={form.clientName} maxLength={120} onChange={e => set('clientName')(e.target.value)} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="mb-1.5 block">Stage</span>
          <Select label="Stage" value={form.stage} onChange={set('stage')} options={stageOptions} />
        </label>
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="mb-1.5 block">Priority</span>
          <Select label="Priority" value={form.priority} onChange={set('priority')} options={PRIORITIES} />
        </label>
      </div>
      <div className="grid grid-cols-[1fr_7rem] gap-3">
        <TextField label="Value (optional)" inputMode="decimal" value={form.value} onChange={e => set('value')(e.target.value)} placeholder="e.g. 2400" />
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">
          <span className="mb-1.5 block">Currency</span>
          <Select label="Currency" value={form.currency} onChange={set('currency')} options={CURRENCIES.map(c => ({ value: c, label: c }))} />
        </label>
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <TextField label="Start" type="date" value={form.startDate} onChange={e => set('startDate')(e.target.value)} />
        <TextField label="Target" type="date" value={form.targetDate} onChange={e => set('targetDate')(e.target.value)} />
        <TextField label="Delivered" type="date" value={form.deliveredDate} onChange={e => set('deliveredDate')(e.target.value)} />
      </div>
      <TextField label="Next action" value={form.nextAction} maxLength={200} onChange={e => set('nextAction')(e.target.value)} placeholder="e.g. Send homepage design" />
      <div>
        <p className="mb-1.5 text-xs font-medium text-slate-600 dark:text-slate-300">Links</p>
        <div className="space-y-2">
          {form.links.map((link, i) => (
            <div key={i} className="flex gap-2">
              <input
                aria-label="Link label"
                value={link.label}
                maxLength={60}
                placeholder="Label"
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    links: f.links.map((l, j) => (j === i ? { ...l, label: e.target.value } : l))
                  }))
                }
                className="h-9 w-28 shrink-0 rounded-lg border border-slate-200 bg-white px-2.5 text-sm dark:border-white/10 dark:bg-slate-900"
              />
              <input
                aria-label="Link URL"
                value={link.url}
                maxLength={500}
                placeholder="https://"
                inputMode="url"
                onChange={e =>
                  setForm(f => ({
                    ...f,
                    links: f.links.map((l, j) => (j === i ? { ...l, url: e.target.value } : l))
                  }))
                }
                className="h-9 min-w-0 flex-1 rounded-lg border border-slate-200 bg-white px-2.5 text-sm dark:border-white/10 dark:bg-slate-900"
              />
              <button
                type="button"
                aria-label="Remove link"
                onClick={() =>
                  setForm(f => ({
                    ...f,
                    links: f.links.filter((_, j) => j !== i)
                  }))
                }
                className={cx('flex h-9 w-9 shrink-0 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 dark:hover:bg-white/[0.07]', focusRing)}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
          {form.links.length < 12 && (
            <Button
              size="sm"
              variant="ghost"
              icon={<Plus className="h-3.5 w-3.5" />}
              onClick={() =>
                setForm(f => ({
                  ...f,
                  links: [...f.links, { label: '', url: '' }]
                }))
              }
            >
              Add link
            </Button>
          )}
          <p className="text-xs text-slate-400">Production, staging, GitHub, Figma, docs. Never store passwords or credentials here.</p>
        </div>
      </div>
      <TextField label="Tags" value={form.tags} onChange={e => set('tags')(e.target.value)} placeholder="Comma separated, e.g. retainer, ecommerce" />
      <TextArea label="Notes" value={form.notes} maxLength={10000} onChange={e => set('notes')(e.target.value)} />
    </div>
  )
}

function NewProjectModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const toast = useToast()
  const [form, setForm] = useState<FormState>(toForm())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const submit = async (event: FormEvent) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      const created = await api.createProject(fromForm(form) as Partial<Project>)
      toast.success('Project created', created.project.name)
      setForm(toForm())
      onCreated(created.project.id)
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="New project"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form="new-project" loading={busy}>
            Create project
          </Button>
        </>
      }
    >
      <form id="new-project" onSubmit={submit} noValidate>
        <ProjectFields form={form} setForm={setForm} />
        {error && (
          <p role="alert" className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-400/10 dark:text-red-300">
            {error}
          </p>
        )}
      </form>
    </Modal>
  )
}

function ProjectDrawer({ id, onClose, onChanged }: { id: string; onClose: () => void; onChanged: () => void }) {
  const { openLead, navigate } = useAdmin()
  const toast = useToast()
  const [data, setData] = useState<ProjectDetail | null>(null)
  const [form, setForm] = useState<FormState | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [picker, setPicker] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const apply = useCallback((detail: ProjectDetail) => {
    setData(detail)
    setForm(toForm(detail.project))
  }, [])

  useEffect(() => {
    let cancelled = false
    api
      .project(id)
      .then(detail => !cancelled && apply(detail))
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [id, apply])

  const dirty = !!data && !!form && JSON.stringify(fromForm(form)) !== JSON.stringify(fromForm(toForm(data.project)))

  const save = async (changes: Partial<Project> | Record<string, unknown>) => {
    setSaving(true)
    try {
      apply(await api.updateProject(id, changes as Partial<Project>))
      toast.success('Project saved')
      onChanged()
    } catch (err) {
      toast.error('Could not save', (err as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const p = data?.project
  return (
    <Drawer open onClose={onClose} label={p ? `Project ${p.name}` : 'Project'}>
      <DrawerHeader
        title={p ? p.name : <Skeleton className="h-6 w-48" />}
        badge={p && <Badge tone={p.stage === 'delivered' ? 'green' : p.stage === 'archived' ? 'slate' : 'indigo'}>{STAGE_LABEL[p.stage]}</Badge>}
        subtitle={p?.clientName}
        onClose={onClose}
        closeIcon={<X className="h-4 w-4" />}
      />
      <div className="min-h-0 flex-1 overflow-y-auto">
        {error && !data && <EmptyState icon={<AlertCircle className="h-5 w-5" />} title="Project unavailable" description={error} />}
        {p && data && form && (
          <div className="grid grid-cols-1 gap-4 px-5 py-5 lg:grid-cols-[1fr_18rem]">
            <form
              onSubmit={e => {
                e.preventDefault()
                save(fromForm(form))
              }}
              noValidate
              className="min-w-0 space-y-4"
            >
              <ProjectFields form={form} setForm={update => setForm(f => (f ? update(f) : f))} />
              <div className="sticky bottom-0 -mx-1 flex justify-end gap-2 bg-stone-50/95 px-1 py-3 backdrop-blur dark:bg-slate-950/95">
                <Button variant="ghost" disabled={!dirty || saving} onClick={() => setForm(toForm(p))}>
                  Discard
                </Button>
                <Button variant="primary" type="submit" loading={saving} disabled={!dirty}>
                  Save changes
                </Button>
              </div>
            </form>
            <div className="space-y-4">
              <Card>
                <CardHeader title="Linked records" />
                <div className="space-y-3 px-5 pb-5 pt-2 text-sm">
                  <div>
                    <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Lead / client</p>
                    {p.lead ? (
                      <div className="flex flex-wrap items-center gap-2">
                        <RecordLink onClick={() => openLead(p.lead!.id)} hint={STATUS_LABEL[p.lead.status]}>
                          {p.lead.companyName}
                        </RecordLink>
                        <button type="button" className={cx('cursor-pointer text-xs text-slate-500 hover:underline', focusRing)} onClick={() => save({ leadId: null })}>
                          Unlink
                        </button>
                      </div>
                    ) : (
                      <Button size="sm" variant="ghost" icon={<Link2 className="h-3.5 w-3.5" />} onClick={() => setPicker(true)}>
                        Link lead
                      </Button>
                    )}
                  </div>
                  {data.inquiry && (
                    <div>
                      <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Original inquiry</p>
                      <RecordLink onClick={() => navigate('inbox', { inquiry: data.inquiry!.id })}>{data.inquiry.name}</RecordLink>
                    </div>
                  )}
                  <div>
                    <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Proposals</p>
                    <ul className="space-y-1">
                      {data.proposals.map(prop => (
                        <li key={prop.id}>
                          <RecordLink onClick={() => navigate('proposals', { proposal: prop.id })} hint={`${PROPOSAL_STATUS_META[prop.status].label} · ${formatMoney(prop.total, prop.currency)}`}>
                            {prop.number}
                          </RecordLink>
                        </li>
                      ))}
                    </ul>
                    <Button size="sm" variant="ghost" className="mt-1" icon={<FilePlus2 className="h-3.5 w-3.5" />} onClick={() => navigate('proposals', { new: '1', project: p.id })}>
                      New proposal
                    </Button>
                  </div>
                  {p.links.length > 0 && (
                    <div>
                      <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Links</p>
                      <ul className="space-y-1">
                        {p.links.map(link => (
                          <li key={link.url}>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className={cx('text-sm text-[#0b6fc0] hover:underline dark:text-[var(--brand-gold)]', focusRing)}>
                              {link.label}
                            </a>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </Card>
              <Card>
                <CardHeader title="Activity" />
                <ActivityTimeline activities={data.activities} />
              </Card>
              <Button variant="ghost" size="sm" icon={<Trash2 className="h-3.5 w-3.5" />} className="text-red-600 dark:text-red-400" onClick={() => setConfirmDelete(true)}>
                Delete project
              </Button>
            </div>
          </div>
        )}
      </div>
      <EntityPicker kind="lead" open={picker} onClose={() => setPicker(false)} onPick={leadId => save({ leadId })} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        danger
        title="Delete project?"
        description="The project and its activity are removed. Linked inquiries and proposals are kept and simply unlinked."
        confirmLabel="Delete project"
        onConfirm={async () => {
          try {
            await api.deleteProject(id)
            toast.success('Project deleted')
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

function ProjectTable({ projects, onOpen, empty }: { projects: Project[]; onOpen: (id: string) => void; empty: string }) {
  const { visible, button } = useShowMore(projects)
  if (!projects.length) return <EmptyState icon={<FolderKanban className="h-5 w-5" />} title={empty} />
  return (
    <>
      <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">
        {visible.map(p => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onOpen(p.id)}
              className={cx('flex w-full cursor-pointer flex-wrap items-center gap-x-4 gap-y-1.5 px-5 py-3 text-left hover:bg-slate-50 dark:hover:bg-white/[0.03]', focusRing)}
            >
              <span className="min-w-0 flex-1 basis-48">
                <span className="block truncate text-sm font-medium text-slate-900 dark:text-white">{p.name}</span>
                <span className="block truncate text-xs text-slate-500 dark:text-slate-400">{[p.clientName, p.nextAction && `Next: ${p.nextAction}`].filter(Boolean).join(' · ')}</span>
              </span>
              <Badge>{STAGE_LABEL[p.stage]}</Badge>
              <DueBadge project={p} />
              <span className="w-24 text-right text-sm tabular-nums text-slate-700 dark:text-slate-200">{formatMoney(p.value, p.currency)}</span>
            </button>
          </li>
        ))}
      </ul>
      {button}
    </>
  )
}

export default function Projects() {
  const { route, navigate } = useAdmin()
  const toast = useToast()
  const desktop = useMediaQuery('(min-width: 768px)')
  const [view, setView] = useState<View>('pipeline')
  const [q, setQ] = useState('')
  const debouncedQ = useDebounced(q)
  const [data, setData] = useState<ProjectList | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [version, setVersion] = useState(0)
  const selected = route.params.get('project')

  useEffect(() => {
    let cancelled = false
    api
      .projects(debouncedQ)
      .then(result => {
        if (cancelled) return
        setData(result)
        setError(null)
      })
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [debouncedQ, version])

  const refresh = useCallback(() => setVersion(v => v + 1), [])
  const open = (id: string) => navigate('projects', { project: id })

  const move = async (id: string, stage: ProjectStage) => {
    const previous = data
    setData(d =>
      d
        ? {
            ...d,
            projects: d.projects.map(p => (p.id === id ? { ...p, stage } : p))
          }
        : d
    )
    try {
      await api.updateProject(id, { stage })
      toast.success(`Moved to ${STAGE_LABEL[stage]}`)
      refresh()
    } catch (err) {
      setData(previous)
      toast.error('Could not move the project', (err as Error).message)
    }
  }

  const projects = data?.projects ?? []
  const active = projects.filter(p => p.stage !== 'archived')
  const due = projects.filter(p => p.due).sort((a, b) => (a.targetDate ?? '').localeCompare(b.targetDate ?? ''))
  const archived = projects.filter(p => p.stage === 'archived')
  const stats = data?.stats
  const pipelineValue = stats
    ? Object.entries(stats.pipelineValue)
        .map(([c, v]) => formatMoney(v ?? 0, c))
        .join(' + ')
    : ''

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Tabs
          label="Project views"
          value={view}
          onChange={setView}
          tabs={[
            { value: 'pipeline', label: 'Pipeline' },
            {
              value: 'all',
              label: 'All projects',
              count: data ? active.length : undefined
            },
            {
              value: 'due',
              label: 'Due soon',
              count: data ? due.length : undefined
            },
            {
              value: 'archived',
              label: 'Archived',
              count: data ? archived.length : undefined
            }
          ]}
        />
        <div className="flex w-full items-center gap-2 sm:w-auto">
          <SearchInput value={q} onChange={setQ} placeholder="Search projects…" label="Search projects" className="min-w-0 flex-1 sm:w-60" />
          <Button variant="primary" size="sm" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => setCreating(true)}>
            New project
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[
            ['Active projects', String(stats.active)],
            ['Due in 14 days', String(stats.dueSoon)],
            ['Overdue', String(stats.overdue)],
            ['Open pipeline value', pipelineValue || '—']
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl border border-slate-200/80 bg-white p-4 dark:border-white/[0.08] dark:bg-slate-900/60">
              <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
              <p
                className={cx(
                  'mt-1 truncate text-xl font-semibold tabular-nums tracking-tight text-slate-900 dark:text-white',
                  label === 'Overdue' && stats.overdue > 0 && 'text-red-600 dark:text-red-400'
                )}
              >
                {value}
              </p>
            </div>
          ))}
        </div>
      )}

      {error && !data ? (
        <Card>
          <EmptyState icon={<AlertCircle className="h-5 w-5" />} title="Projects unavailable" description={error} action={<Button onClick={refresh}>Try again</Button>} />
        </Card>
      ) : !data ? (
        <Skeleton className="h-72" />
      ) : !projects.length && !q ? (
        <Card>
          <EmptyState
            icon={<FolderKanban className="h-5 w-5" />}
            title="No projects yet"
            description="Create one here, from a website inquiry, or by accepting a proposal."
            action={
              <Button variant="primary" icon={<Plus className="h-4 w-4" />} onClick={() => setCreating(true)}>
                New project
              </Button>
            }
          />
        </Card>
      ) : view === 'pipeline' ? (
        desktop ? (
          <Board projects={active} onOpen={open} onMove={move} />
        ) : (
          <MobilePipeline projects={active} counts={data.counts} onOpen={open} onMove={move} />
        )
      ) : (
        <Card>
          {view === 'all' && <ProjectTable projects={active} onOpen={open} empty="No projects match." />}
          {view === 'due' && <ProjectTable projects={due} onOpen={open} empty="Nothing due in the next 14 days." />}
          {view === 'archived' && <ProjectTable projects={archived} onOpen={open} empty="No archived projects." />}
        </Card>
      )}

      <NewProjectModal
        open={creating}
        onClose={() => setCreating(false)}
        onCreated={id => {
          setCreating(false)
          refresh()
          open(id)
        }}
      />
      {selected && /^prj_[a-f0-9]{16}$/.test(selected) && <ProjectDrawer key={selected} id={selected} onClose={() => navigate('projects')} onChanged={refresh} />}
    </div>
  )
}
