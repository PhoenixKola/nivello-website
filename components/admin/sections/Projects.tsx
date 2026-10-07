'use client'

import { useCallback, useEffect, useState, type DragEvent, type FormEvent } from 'react'
import { AlertCircle, CalendarClock, FolderKanban, GripVertical, MoveRight, Plus } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { PRIORITY_LABEL, PROJECT_STAGES, STAGE_LABEL, WORKFLOW_GROUPS } from '@/lib/admin/constants'
import { formatDay, formatMoney } from '@/lib/admin/format'
import { useDebounced, useMediaQuery } from '@/lib/admin/hooks'
import type { LeadPriority, Project, ProjectList, ProjectStage } from '@/lib/admin/types'
import { useAdmin } from '../AdminContext'
import { Badge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { EmptyState, Skeleton, Tabs, useShowMore } from '../ui/Controls'
import { SearchInput } from '../ui/Inputs'
import { Menu } from '../ui/Listbox'
import { Modal } from '../ui/Overlay'
import { useToast } from '../ui/Toast'
import { cx, focusRing } from '../ui/styles'
import { fromForm, ProjectFields, toForm, type FormState } from './projects/ProjectForm'
import ProjectWorkspace from './projects/ProjectWorkspace'

type View = 'pipeline' | 'all' | 'due' | 'archived'

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

const STAGE_DOT = Object.fromEntries(PROJECT_STAGES.map(s => [s.value, s.dot])) as Record<ProjectStage, string>

function StageChip({ stage }: { stage: ProjectStage }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-medium text-slate-700 dark:bg-white/[0.08] dark:text-slate-200">
      <span className={cx('h-1.5 w-1.5 rounded-full', STAGE_DOT[stage])} aria-hidden="true" />
      {STAGE_LABEL[stage]}
    </span>
  )
}

function PriorityLabel({ priority }: { priority: LeadPriority }) {
  if (priority === 'urgent') return <Badge tone="red">Urgent</Badge>
  if (priority === 'high') return <Badge tone="amber">High</Badge>
  return <span className="text-[11px] text-slate-500 dark:text-slate-400">{PRIORITY_LABEL[priority]}</span>
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
        'group rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-white/[0.08] dark:bg-slate-900',
        draggable && 'cursor-grab active:cursor-grabbing'
      )}
    >
      <div className="flex items-start gap-2">
        {draggable && <GripVertical aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0 text-slate-300 dark:text-slate-600" />}
        <button type="button" onClick={onOpen} className={cx('min-w-0 flex-1 cursor-pointer text-left', focusRing)}>
          <span className="line-clamp-2 text-sm font-semibold leading-snug text-slate-900 dark:text-white">{project.name}</span>
          {project.clientName && <span className="mt-0.5 block truncate text-xs text-slate-500 dark:text-slate-400">{project.clientName}</span>}
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
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <StageChip stage={project.stage} />
        <PriorityLabel priority={project.priority} />
      </div>
      {project.nextAction && <p className="mt-3 line-clamp-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">Next: {project.nextAction}</p>}
      {(project.value !== null || project.targetDate) && (
        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3 dark:border-white/[0.06]">
          <span className="text-xs font-semibold tabular-nums text-slate-800 dark:text-slate-100">{project.value !== null ? formatMoney(project.value, project.currency) : ''}</span>
          <DueBadge project={project} />
        </div>
      )}
    </div>
  )
}

/** Four workflow groups; a drop into a group with several stages asks which exact stage to use. */
function Board({ projects, onOpen, onMove, draggable }: { projects: Project[]; onOpen: (id: string) => void; onMove: (id: string, stage: ProjectStage) => void; draggable: boolean }) {
  const [over, setOver] = useState<string | null>(null)
  const [pending, setPending] = useState<{ groupId: string; projectId: string } | null>(null)
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({})
  const drop = (event: DragEvent, group: (typeof WORKFLOW_GROUPS)[number]) => {
    event.preventDefault()
    setOver(null)
    const id = event.dataTransfer.getData('text/nivello-project')
    if (!id) return
    if (group.stages.length === 1) onMove(id, group.stages[0])
    else setPending({ groupId: group.id, projectId: id })
  }
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4" role="region" aria-label="Project pipeline board">
      {WORKFLOW_GROUPS.map(group => {
        const items = projects.filter(p => group.stages.includes(p.stage))
        const isCollapsed = collapsed[group.id] ?? false
        const choosing = pending?.groupId === group.id ? projects.find(p => p.id === pending.projectId) : null
        return (
          <section
            key={group.id}
            aria-label={`${group.label} (${items.length})`}
            onDragOver={event => {
              if (event.dataTransfer.types.includes('text/nivello-project')) {
                event.preventDefault()
                setOver(group.id)
              }
            }}
            onDragLeave={() => setOver(o => (o === group.id ? null : o))}
            onDrop={event => drop(event, group)}
            className={cx(
              'flex min-w-0 flex-col rounded-2xl border bg-slate-100/60 p-3 transition-colors dark:bg-white/[0.03]',
              over === group.id ? 'border-[var(--brand-blue)] bg-sky-50 dark:border-[var(--brand-gold)] dark:bg-white/[0.06]' : 'border-transparent'
            )}
          >
            <h3>
              <button
                type="button"
                aria-expanded={!isCollapsed}
                onClick={() => setCollapsed(c => ({ ...c, [group.id]: !isCollapsed }))}
                className={cx('block w-full cursor-pointer rounded-lg px-1 pb-2.5 pt-0.5 text-left', focusRing)}
              >
                <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400">
                  <span>{group.label}</span>
                  <span aria-hidden="true">·</span>
                  <span className="tabular-nums text-slate-700 dark:text-slate-200">{items.length}</span>
                </span>
                <span className="mt-0.5 block text-[11px] text-slate-400">{group.stages.map(stage => STAGE_LABEL[stage]).join(' · ')}</span>
              </button>
            </h3>
            {choosing && (
              <div role="group" aria-label={`Choose a stage for ${choosing.name}`} className="mb-3 rounded-xl border border-[var(--brand-blue)]/40 bg-white p-3 dark:border-[var(--brand-gold)]/40 dark:bg-slate-900">
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Move <span className="font-semibold text-slate-900 dark:text-white">{choosing.name}</span> to:
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {group.stages.map(stage => (
                    <Button
                      key={stage}
                      size="sm"
                      variant={stage === choosing.stage ? 'ghost' : 'secondary'}
                      disabled={stage === choosing.stage}
                      onClick={() => {
                        setPending(null)
                        onMove(choosing.id, stage)
                      }}
                    >
                      {STAGE_LABEL[stage]}
                    </Button>
                  ))}
                  <Button size="sm" variant="ghost" onClick={() => setPending(null)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}
            {!isCollapsed && (
              <div className="flex min-h-24 flex-col gap-3">
                {items.map(project => (
                  <ProjectCard key={project.id} project={project} draggable={draggable} onOpen={() => onOpen(project.id)} onMove={s => onMove(project.id, s)} />
                ))}
                {!items.length && (
                  <p className="rounded-xl border border-dashed border-slate-300 px-3 py-6 text-center text-xs text-slate-400 dark:border-white/10">
                    {draggable ? 'Drop a project here' : 'No projects'}
                  </p>
                )}
              </div>
            )}
          </section>
        )
      })}
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
  const [creating, setCreating] = useState(() => route.params.get('new') === '1')
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

  if (selected && /^prj_[a-f0-9]{16}$/.test(selected)) {
    const tab = route.params.get('tab')
    return <ProjectWorkspace key={selected} id={selected} tab={tab} onChanged={refresh} />
  }

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
        <Board projects={projects} onOpen={open} onMove={move} draggable={desktop} />
      ) : (
        <Card>
          {view === 'all' && <ProjectTable projects={active} onOpen={open} empty="No projects match." />}
          {view === 'due' && <ProjectTable projects={due} onOpen={open} empty="Nothing due in the next 14 days." />}
          {view === 'archived' && <ProjectTable projects={archived} onOpen={open} empty="No archived projects." />}
        </Card>
      )}

      <NewProjectModal
        open={creating}
        onClose={() => {
          setCreating(false)
          if (route.params.get('new')) navigate('projects')
        }}
        onCreated={id => {
          setCreating(false)
          refresh()
          open(id)
        }}
      />
    </div>
  )
}
