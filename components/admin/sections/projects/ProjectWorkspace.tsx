'use client'

import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { AlertCircle, ArrowLeft, CalendarClock, FilePlus2, FileText, Link2, MoreHorizontal, Pencil, Receipt, Trash2 } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { PRIORITY_LABEL, PROJECT_STAGES, PROPOSAL_STATUS_META, STAGE_LABEL, STATUS_LABEL } from '@/lib/admin/constants'
import { formatDay, formatMoney } from '@/lib/admin/format'
import type { Project, ProjectDetail, ProjectStage } from '@/lib/admin/types'
import { useAdmin } from '../../AdminContext'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { EmptyState, Progress, Skeleton, Tabs } from '../../ui/Controls'
import { Menu } from '../../ui/Listbox'
import { ConfirmDialog, Modal } from '../../ui/Overlay'
import { useToast } from '../../ui/Toast'
import { cx, focusRing } from '../../ui/styles'
import UserAvatar from '../../ui/UserAvatar'
import { INVOICE_STATUS_META } from '../invoices/meta'
import { ActivityTimeline, EntityPicker, RecordLink } from '../ops/shared'
import ProjectAccess from './ProjectAccess'
import ProjectBrand from './ProjectBrand'
import ProjectDocuments from './ProjectDocuments'
import ProjectFinance, { FinanceSummary } from './ProjectFinance'
import { fromForm, ProjectFields, toForm, type FormState } from './ProjectForm'
import { ProjectMilestones, ProjectProgressCard, ProjectTasks } from './ProjectWork'

export type WorkspaceTab = 'overview' | 'tasks' | 'milestones' | 'finance' | 'brand' | 'access' | 'documents' | 'activity'
const TABS: WorkspaceTab[] = ['overview', 'tasks', 'milestones', 'finance', 'brand', 'access', 'documents', 'activity']
const STAGE_DOT = Object.fromEntries(PROJECT_STAGES.map(s => [s.value, s.dot])) as Record<ProjectStage, string>

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">{label}</dt>
      <dd className="mt-0.5 truncate text-sm text-slate-800 dark:text-slate-100">{children}</dd>
    </div>
  )
}

/** Full-page project workspace (replaces the old drawer). Tabs are deep-linkable: #/projects?project=…&tab=finance */
export default function ProjectWorkspace({ id, tab: requestedTab, onChanged }: { id: string; tab: string | null; onChanged: () => void }) {
  const { navigate, openLead } = useAdmin()
  const toast = useToast()
  const [data, setData] = useState<ProjectDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState(false)
  const [form, setForm] = useState<FormState>(toForm())
  const [saving, setSaving] = useState(false)
  const [picker, setPicker] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const tab: WorkspaceTab = TABS.includes(requestedTab as WorkspaceTab) ? (requestedTab as WorkspaceTab) : 'overview'

  useEffect(() => {
    let cancelled = false
    api
      .project(id)
      .then(detail => !cancelled && setData(detail))
      .catch(err => !cancelled && setError(err.message))
    return () => {
      cancelled = true
    }
  }, [id])

  const apply = useCallback(
    (detail: ProjectDetail) => {
      setData(detail)
      onChanged()
    },
    [onChanged]
  )

  const save = async (changes: Partial<Project> | Record<string, unknown>, message = 'Project saved') => {
    setSaving(true)
    try {
      apply(await api.updateProject(id, changes as Partial<Project>))
      toast.success(message)
      return true
    } catch (err) {
      toast.error('Could not save', (err as Error).message)
      return false
    } finally {
      setSaving(false)
    }
  }

  const goTab = (next: WorkspaceTab) => navigate('projects', next === 'overview' ? { project: id } : { project: id, tab: next })
  const back = () => navigate('projects')

  if (error && !data) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" icon={<ArrowLeft className="h-4 w-4" />} onClick={back}>
          Projects
        </Button>
        <Card>
          <EmptyState icon={<AlertCircle className="h-5 w-5" />} title="Project unavailable" description={error} />
        </Card>
      </div>
    )
  }
  if (!data) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-28" />
        <Skeleton className="h-10 w-2/3" />
        <Skeleton className="h-80" />
      </div>
    )
  }

  const p = data.project
  const progress = p.progress
  const percent = progress.hasTasks ? progress.taskPercent ?? 0 : progress.milestonePercent ?? 0

  return (
    <div className="space-y-5">
      <header className="rounded-2xl border border-slate-200/80 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-5 dark:border-white/[0.08] dark:bg-slate-900/60">
        <div className="flex flex-wrap items-start gap-3">
          <button type="button" onClick={back} className={cx('inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg px-2 text-xs font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.07] dark:hover:text-white', focusRing)}>
            <ArrowLeft aria-hidden="true" className="h-4 w-4" />
            Projects
          </button>
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <Button size="sm" variant="secondary" icon={<Pencil className="h-3.5 w-3.5" />} onClick={() => { setForm(toForm(p)); setEditing(true) }}>
              Edit details
            </Button>
            <Button size="sm" variant="secondary" icon={<Receipt className="h-3.5 w-3.5" />} onClick={() => navigate('proposals', { doc: 'invoices', new: '1', project: p.id })}>
              New Fattura
            </Button>
            <Menu
              label="Project actions"
              items={[
                { label: 'New Preventivo', icon: <FilePlus2 className="h-4 w-4" />, onSelect: () => navigate('proposals', { new: '1', project: p.id }) },
                { label: p.lead ? 'Change linked lead' : 'Link lead', icon: <Link2 className="h-4 w-4" />, onSelect: () => setPicker(true) },
                { label: 'Delete project', icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => setConfirmDelete(true) }
              ]}
              trigger={({ ref, open, toggle, onKeyDown, menuId }) => (
                <button
                  ref={ref}
                  type="button"
                  aria-label="More project actions"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  aria-controls={open ? menuId : undefined}
                  onClick={toggle}
                  onKeyDown={onKeyDown}
                  className={cx('flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-500 ring-1 ring-inset ring-slate-200 hover:bg-slate-50 dark:ring-white/10 dark:hover:bg-white/[0.06]', focusRing)}
                >
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              )}
            />
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
          <div className="min-w-0">
            <h2 className="break-words text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">{p.name}</h2>
            <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{p.clientName || 'No client set'}</p>
          </div>
          <div className="w-full max-w-xs">
            <div className="mb-1 flex justify-between text-xs text-slate-500 dark:text-slate-400">
              <span>Progress</span>
              <span className="font-medium tabular-nums text-slate-700 dark:text-slate-200">{progress.hasTasks || progress.milestoneCount ? `${percent}%` : '—'}</span>
            </div>
            <Progress value={percent} max={100} label="Project progress" tone={progress.overdueTasks ? 'amber' : 'brand'} />
          </div>
        </div>

        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 border-t border-slate-100 pt-4 sm:grid-cols-3 lg:grid-cols-5 dark:border-white/[0.06]">
          <Fact label="Stage">
            <Menu
              label="Change stage"
              align="start"
              items={PROJECT_STAGES.filter(s => s.value !== p.stage).map(s => ({ label: `Move to ${s.label}`, onSelect: () => save({ stage: s.value }, `Moved to ${s.label}`) }))}
              trigger={({ ref, open, toggle, onKeyDown, menuId }) => (
                <button
                  ref={ref}
                  type="button"
                  aria-haspopup="menu"
                  aria-expanded={open}
                  aria-controls={open ? menuId : undefined}
                  onClick={toggle}
                  onKeyDown={onKeyDown}
                  className={cx('inline-flex cursor-pointer items-center gap-1.5 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700 hover:bg-slate-200 dark:bg-white/[0.08] dark:text-slate-200 dark:hover:bg-white/[0.14]', focusRing)}
                >
                  <span className={cx('h-1.5 w-1.5 rounded-full', STAGE_DOT[p.stage])} aria-hidden="true" />
                  {STAGE_LABEL[p.stage]}
                </button>
              )}
            />
          </Fact>
          <Fact label="Priority">{p.priority === 'urgent' ? <Badge tone="red">Urgent</Badge> : p.priority === 'high' ? <Badge tone="amber">High</Badge> : PRIORITY_LABEL[p.priority]}</Fact>
          <Fact label="Target date">
            <span className={cx('inline-flex items-center gap-1', p.due === 'overdue' && 'font-medium text-red-600 dark:text-red-400')}>
              <CalendarClock aria-hidden="true" className="h-3.5 w-3.5 text-slate-400" />
              {p.targetDate ? `${formatDay(p.targetDate)}${p.due === 'overdue' ? ' · overdue' : ''}` : '—'}
            </span>
          </Fact>
          <Fact label="Value">{p.finance.contracted !== null ? formatMoney(p.finance.contracted, p.currency) : '—'}</Fact>
          <Fact label="Next action">{p.nextAction || '—'}</Fact>
        </dl>
      </header>

      <Tabs<WorkspaceTab>
        label="Project workspace"
        value={tab}
        onChange={goTab}
        tabs={[
          { value: 'overview', label: 'Overview' },
          { value: 'tasks', label: 'Tasks', count: progress.taskCount },
          { value: 'milestones', label: 'Milestones', count: progress.milestoneCount },
          { value: 'finance', label: 'Finance' },
          { value: 'brand', label: 'Brand' },
          { value: 'access', label: 'Access' },
          { value: 'documents', label: 'Documents', count: data.proposals.length + data.invoices.length },
          { value: 'activity', label: 'Activity' }
        ]}
      />

      {tab === 'overview' && <Overview data={data} goTab={goTab} openLead={openLead} navigate={navigate} />}
      {tab === 'tasks' && <ProjectTasks detail={data} onChange={apply} />}
      {tab === 'milestones' && <ProjectMilestones detail={data} onChange={apply} />}
      {tab === 'finance' && <ProjectFinance detail={data} onChange={apply} />}
      {tab === 'brand' && <ProjectBrand project={p} onSave={colors => save({ brandColors: colors }, 'Brand colors saved')} saving={saving} />}
      {tab === 'access' && <ProjectAccess projectId={p.id} />}
      {tab === 'documents' && <ProjectDocuments detail={data} />}
      {tab === 'activity' && (
        <Card>
          <CardHeader title="Activity" description="Everything that happened on this project, newest first." />
          <ActivityTimeline activities={data.activities} />
        </Card>
      )}

      <Modal
        open={editing}
        onClose={() => setEditing(false)}
        size="lg"
        title="Edit project details"
        footer={
          <>
            <Button variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
            <Button variant="primary" type="submit" form="edit-project" loading={saving}>
              Save changes
            </Button>
          </>
        }
      >
        <form
          id="edit-project"
          noValidate
          onSubmit={async (event: FormEvent) => {
            event.preventDefault()
            if (await save(fromForm(form), 'Details updated')) setEditing(false)
          }}
        >
          <ProjectFields form={form} setForm={update => setForm(f => update(f))} />
        </form>
      </Modal>
      <EntityPicker kind="lead" open={picker} onClose={() => setPicker(false)} onPick={leadId => { save({ leadId }, 'Lead linked') }} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        danger
        title="Delete project?"
        description="The project, its tasks, payments, brand colors, credentials and activity are removed. Linked inquiries, Preventivi and Fatture are kept and unlinked."
        confirmLabel="Delete project"
        onConfirm={async () => {
          try {
            await api.deleteProject(id)
            toast.success('Project deleted')
            setConfirmDelete(false)
            onChanged()
            back()
          } catch (err) {
            toast.error('Could not delete', (err as Error).message)
          }
        }}
      />
    </div>
  )
}

function Overview({ data, goTab, openLead, navigate }: { data: ProjectDetail; goTab: (tab: WorkspaceTab) => void; openLead: (id: string) => void; navigate: ReturnType<typeof useAdmin>['navigate'] }) {
  const p = data.project
  const nextTasks = p.tasks.filter(t => t.status !== 'done').sort((a, b) => (a.dueDate ?? '9999').localeCompare(b.dueDate ?? '9999')).slice(0, 4)
  return (
    <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0 space-y-5">
        <ProjectProgressCard detail={data} />
        <Card>
          <CardHeader title="Finance" description="Contracted, invoiced and paid are tracked separately." actions={<Button size="sm" variant="ghost" onClick={() => goTab('finance')}>Open finance</Button>} />
          <div className="px-5 pb-5 pt-3">
            <FinanceSummary finance={p.finance} />
          </div>
        </Card>
        <Card>
          <CardHeader title="Upcoming" actions={<Button size="sm" variant="ghost" onClick={() => goTab('tasks')}>All tasks</Button>} />
          {nextTasks.length || p.progress.nextMilestone ? (
            <ul className="divide-y divide-slate-100 px-2 pb-2 pt-1 dark:divide-white/[0.06]">
              {p.progress.nextMilestone && (
                <li className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  <Badge tone="purple">Milestone</Badge>
                  <span className="min-w-0 flex-1 truncate text-slate-800 dark:text-slate-100">{p.progress.nextMilestone.title}</span>
                  <span className="shrink-0 text-xs text-slate-500">{formatDay(p.progress.nextMilestone.dueDate)}</span>
                </li>
              )}
              {nextTasks.map(task => (
                <li key={task.id} className="flex items-center gap-3 px-3 py-2.5 text-sm">
                  {task.assigneeUser ? <UserAvatar user={task.assigneeUser} size="sm" /> : <span className="h-6 w-6 shrink-0 rounded-full border border-dashed border-slate-300 dark:border-white/20" aria-hidden="true" />}
                  <span className="min-w-0 flex-1 truncate text-slate-800 dark:text-slate-100">{task.title}</span>
                  <span className={cx('shrink-0 text-xs', task.overdue ? 'font-medium text-red-600 dark:text-red-400' : 'text-slate-500')}>{task.dueDate ? `${task.overdue ? 'Overdue · ' : ''}${formatDay(task.dueDate)}` : 'No date'}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 pb-5 pt-2 text-sm text-slate-400">No open tasks or milestones.</p>
          )}
        </Card>
        <Card>
          <CardHeader title="Recent activity" actions={<Button size="sm" variant="ghost" onClick={() => goTab('activity')}>All activity</Button>} />
          <ActivityTimeline activities={data.activities.slice(0, 6)} />
        </Card>
      </div>

      <div className="space-y-5">
        <Card>
          <CardHeader title="Summary" />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 px-5 pb-5 pt-3">
            <Fact label="Client">{p.clientName || '—'}</Fact>
            <Fact label="Start">{p.startDate ? formatDay(p.startDate) : '—'}</Fact>
            <Fact label="Target">{p.targetDate ? formatDay(p.targetDate) : '—'}</Fact>
            <Fact label="Delivered">{p.deliveredDate ? formatDay(p.deliveredDate) : '—'}</Fact>
          </dl>
          {p.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-5 pb-4">
              {p.tags.map(tag => (
                <Badge key={tag}>{tag}</Badge>
              ))}
            </div>
          )}
          {p.notes && <p className="whitespace-pre-line border-t border-slate-100 px-5 py-4 text-sm text-slate-600 dark:border-white/[0.06] dark:text-slate-300">{p.notes}</p>}
          {p.links.length > 0 && (
            <ul className="space-y-1 border-t border-slate-100 px-5 py-4 dark:border-white/[0.06]">
              {p.links.map(link => (
                <li key={link.url}>
                  <a href={link.url} target="_blank" rel="noopener noreferrer" className={cx('text-sm text-[#0b6fc0] hover:underline dark:text-[var(--brand-gold)]', focusRing)}>
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card>
          <CardHeader title="Linked records" />
          <div className="space-y-3 px-5 pb-5 pt-2 text-sm">
            <div>
              <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Lead / client</p>
              {p.lead ? <RecordLink onClick={() => openLead(p.lead!.id)} hint={STATUS_LABEL[p.lead.status]}>{p.lead.companyName}</RecordLink> : <p className="text-slate-400">No lead linked</p>}
            </div>
            {data.inquiry && (
              <div>
                <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Original inquiry</p>
                <RecordLink onClick={() => navigate('inbox', { inquiry: data.inquiry!.id })}>{data.inquiry.name}</RecordLink>
              </div>
            )}
            <div>
              <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Preventivi</p>
              {data.proposals.length ? (
                <ul className="space-y-1">
                  {data.proposals.map(prop => (
                    <li key={prop.id}>
                      <RecordLink onClick={() => navigate('proposals', { proposal: prop.id })} hint={`${PROPOSAL_STATUS_META[prop.status].label} · ${formatMoney(prop.total, prop.currency)}`}>
                        {prop.number}
                      </RecordLink>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">None yet</p>
              )}
            </div>
            <div>
              <p className="mb-1 text-xs text-slate-500 dark:text-slate-400">Fatture</p>
              {data.invoices.length ? (
                <ul className="space-y-1">
                  {data.invoices.map(inv => (
                    <li key={inv.id}>
                      <RecordLink onClick={() => navigate('proposals', { doc: 'invoices', invoice: inv.id })} hint={inv.number ? `${INVOICE_STATUS_META[inv.status].label} · ${formatMoney(inv.total, inv.currency)}` : formatMoney(inv.total, inv.currency)}>
                        {inv.number ?? 'Draft'}
                      </RecordLink>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-slate-400">None yet</p>
              )}
            </div>
            <Button size="sm" variant="ghost" icon={<FileText className="h-3.5 w-3.5" />} onClick={() => goTab('documents')}>
              All documents
            </Button>
          </div>
        </Card>
      </div>
    </div>
  )
}
