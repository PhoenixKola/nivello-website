'use client'

import { useMemo, useState, type FormEvent } from 'react'
import { ArrowDown, ArrowUp, Check, CircleAlert, Flag, ListTodo, Plus, Trash2 } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { formatDay } from '@/lib/admin/format'
import type { ProjectDetail, ProjectMilestone, ProjectMilestoneStatus, ProjectTask, ProjectTaskPriority, ProjectTaskStatus } from '@/lib/admin/types'
import { Badge } from '../../ui/Badge'
import { Button } from '../../ui/Button'
import { Card, CardHeader } from '../../ui/Card'
import { EmptyState, Progress } from '../../ui/Controls'
import { TextArea, TextField } from '../../ui/Inputs'
import { Select } from '../../ui/Listbox'
import { ConfirmDialog, Modal } from '../../ui/Overlay'
import { useToast } from '../../ui/Toast'
import { cx, focusRing } from '../../ui/styles'

const TASK_STATUSES: { value: ProjectTaskStatus; label: string }[] = [
  { value: 'todo', label: 'To do' }, { value: 'in_progress', label: 'In progress' }, { value: 'blocked', label: 'Blocked' }, { value: 'done', label: 'Done' }
]
const MILESTONE_STATUSES: { value: ProjectMilestoneStatus; label: string }[] = [
  { value: 'not_started', label: 'Not started' }, { value: 'in_progress', label: 'In progress' }, { value: 'blocked', label: 'Blocked' }, { value: 'completed', label: 'Completed' }
]
const PRIORITIES: { value: ProjectTaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' }, { value: 'normal', label: 'Normal' }, { value: 'high', label: 'High' }, { value: 'urgent', label: 'Urgent' }
]

type TaskDraft = Pick<ProjectTask, 'title' | 'description' | 'status' | 'priority' | 'dueDate' | 'assignee' | 'milestoneId'>
type MilestoneDraft = Pick<ProjectMilestone, 'title' | 'description' | 'status' | 'dueDate'>
const blankTask = (): TaskDraft => ({ title: '', description: '', status: 'todo', priority: 'normal', dueDate: null, assignee: '', milestoneId: null })
const blankMilestone = (): MilestoneDraft => ({ title: '', description: '', status: 'not_started', dueDate: null })

export function ProjectProgressCard({ detail }: { detail: ProjectDetail }) {
  const p = detail.project.progress
  return (
    <Card>
      <CardHeader title="Progress" description={p.hasTasks ? `${p.completedTasks} of ${p.taskCount} tasks complete` : 'Add tasks to start measuring delivery progress.'} />
      <div className="space-y-4 px-5 pb-5 pt-2">
        <Progress value={p.completedTasks} max={p.taskCount || 1} label="Task completion" tone={p.overdueTasks ? 'amber' : 'brand'} />
        <div className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
          <Metric label="Tasks" value={p.hasTasks ? `${p.taskPercent}%` : '—'} />
          <Metric label="Milestones" value={p.milestoneCount ? `${p.milestonePercent}%` : '—'} />
          <Metric label="Overdue" value={String(p.overdueTasks)} warn={p.overdueTasks > 0} />
          <Metric label="Next due" value={p.nextTask?.dueDate ? formatDay(p.nextTask.dueDate) : p.nextMilestone?.dueDate ? formatDay(p.nextMilestone.dueDate) : '—'} />
        </div>
      </div>
    </Card>
  )
}

function Metric({ label, value, warn }: { label: string; value: string; warn?: boolean }) {
  return <div className="rounded-xl bg-slate-50 px-3 py-2 dark:bg-white/[0.04]"><p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p><p className={cx('mt-1 font-semibold tabular-nums text-slate-900 dark:text-white', warn && 'text-orange-600 dark:text-orange-300')}>{value}</p></div>
}

export function ProjectTasks({ detail, onChange }: { detail: ProjectDetail; onChange: (detail: ProjectDetail) => void }) {
  const toast = useToast()
  const [status, setStatus] = useState<ProjectTaskStatus | 'all' | 'open' | 'overdue' | 'completed'>('all')
  const [milestone, setMilestone] = useState('all')
  const [editing, setEditing] = useState<ProjectTask | 'new' | null>(null)
  const [draft, setDraft] = useState<TaskDraft>(blankTask)
  const [deleting, setDeleting] = useState<ProjectTask | null>(null)
  const [busy, setBusy] = useState(false)
  const items = useMemo(() => detail.project.tasks.filter(task => {
    const statusMatch = status === 'all' || (status === 'open' && task.status !== 'done') || (status === 'overdue' && task.overdue) || (status === 'completed' && task.status === 'done') || task.status === status
    return statusMatch && (milestone === 'all' || task.milestoneId === milestone)
  }), [detail.project.tasks, status, milestone])
  const open = (task?: ProjectTask) => { setEditing(task ?? 'new'); setDraft(task ? { title: task.title, description: task.description, status: task.status, priority: task.priority, dueDate: task.dueDate, assignee: task.assignee, milestoneId: task.milestoneId } : blankTask()) }
  const save = async (event: FormEvent) => {
    event.preventDefault(); setBusy(true)
    try {
      const next = editing === 'new' ? await api.createProjectTask(detail.project.id, draft) : await api.updateProjectTask(detail.project.id, editing!.id, draft)
      onChange(next); setEditing(null); toast.success(editing === 'new' ? 'Task added' : 'Task updated')
    } catch (error) { toast.error('Task not saved', (error as Error).message) } finally { setBusy(false) }
  }
  const quickStatus = async (task: ProjectTask, nextStatus: ProjectTaskStatus) => {
    try { onChange(await api.updateProjectTask(detail.project.id, task.id, { status: nextStatus })); toast.success(nextStatus === 'done' ? 'Task completed' : 'Task updated') } catch (error) { toast.error('Task not updated', (error as Error).message) }
  }
  return (
    <div className="space-y-4">
      <ProjectProgressCard detail={detail} />
      <Card>
        <CardHeader title="Tasks" description="Plan the next actions, owners and deadlines." actions={<Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => open()}>Add task</Button>} />
        <div className="grid grid-cols-1 gap-2 border-y border-slate-100 px-5 py-3 sm:grid-cols-2 dark:border-white/[0.06]">
          <Select label="Task status filter" value={status} onChange={setStatus} options={[{ value: 'all', label: 'All tasks' }, { value: 'open', label: 'Open' }, { value: 'overdue', label: 'Overdue' }, { value: 'completed', label: 'Completed' }, ...TASK_STATUSES.filter(item => item.value === 'in_progress' || item.value === 'blocked')]} />
          <Select label="Milestone filter" value={milestone} onChange={setMilestone} options={[{ value: 'all', label: 'All milestones' }, ...detail.project.milestones.map(m => ({ value: m.id, label: m.title }))]} />
        </div>
        {!items.length ? <EmptyState icon={<ListTodo className="h-5 w-5" />} title="No matching tasks" description="Add a task or adjust the filters." /> : <ul className="divide-y divide-slate-100 dark:divide-white/[0.06]">{items.map(task => (
          <li key={task.id} className="px-5 py-4">
            <div className="flex flex-wrap items-start gap-3">
              <button type="button" onClick={() => quickStatus(task, task.status === 'done' ? 'todo' : 'done')} aria-label={task.status === 'done' ? `Reopen ${task.title}` : `Complete ${task.title}`} className={cx('mt-0.5 flex h-7 w-7 shrink-0 cursor-pointer items-center justify-center rounded-full border', task.status === 'done' ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-300 text-transparent hover:text-slate-400 dark:border-white/20', focusRing)}><Check className="h-4 w-4" /></button>
              <button type="button" onClick={() => open(task)} className={cx('min-w-40 flex-1 cursor-pointer text-left', focusRing)}><span className={cx('font-medium text-slate-900 dark:text-white', task.status === 'done' && 'line-through opacity-60')}>{task.title}</span>{task.description && <span className="mt-1 block text-sm text-slate-500 dark:text-slate-400">{task.description}</span>}<span className="mt-2 flex flex-wrap gap-2 text-xs text-slate-500">{task.assignee && <span>{task.assignee}</span>}{task.dueDate && <span className={task.overdue ? 'font-medium text-red-600 dark:text-red-400' : ''}>{task.overdue ? 'Overdue · ' : ''}{formatDay(task.dueDate)}</span>}</span></button>
              <div className="w-36"><Select label={`Status for ${task.title}`} size="sm" value={task.status} onChange={value => quickStatus(task, value)} options={TASK_STATUSES} /></div>
              <Badge tone={task.priority === 'urgent' ? 'red' : task.priority === 'high' ? 'amber' : 'slate'}>{task.priority}</Badge>
              <button type="button" aria-label={`Delete ${task.title}`} onClick={() => setDeleting(task)} className={cx('flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-400/10', focusRing)}><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </li>
        ))}</ul>}
      </Card>
      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add task' : 'Edit task'} footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" form="project-task-form" type="submit" loading={busy}>Save task</Button></>}>
        <form id="project-task-form" onSubmit={save} className="space-y-3"><TextField label="Task title" required maxLength={200} value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} /><TextArea label="Description" maxLength={4000} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} /><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Select label="Status" value={draft.status} onChange={value => setDraft(d => ({ ...d, status: value }))} options={TASK_STATUSES} /><Select label="Priority" value={draft.priority} onChange={value => setDraft(d => ({ ...d, priority: value }))} options={PRIORITIES} /><TextField label="Due date" type="date" value={draft.dueDate ?? ''} onChange={e => setDraft(d => ({ ...d, dueDate: e.target.value || null }))} /><TextField label="Assignee" maxLength={120} value={draft.assignee} onChange={e => setDraft(d => ({ ...d, assignee: e.target.value }))} /></div><Select label="Milestone" value={draft.milestoneId ?? ''} onChange={value => setDraft(d => ({ ...d, milestoneId: value || null }))} options={[{ value: '', label: 'No milestone' }, ...detail.project.milestones.map(m => ({ value: m.id, label: m.title }))]} /></form>
      </Modal>
      <ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} danger title="Delete task?" description={deleting?.title} confirmLabel="Delete task" onConfirm={async () => { if (!deleting) return; try { onChange(await api.deleteProjectTask(detail.project.id, deleting.id)); setDeleting(null); toast.success('Task deleted') } catch (error) { toast.error('Task not deleted', (error as Error).message) } }} />
    </div>
  )
}

export function ProjectMilestones({ detail, onChange }: { detail: ProjectDetail; onChange: (detail: ProjectDetail) => void }) {
  const toast = useToast()
  const [editing, setEditing] = useState<ProjectMilestone | 'new' | null>(null)
  const [draft, setDraft] = useState<MilestoneDraft>(blankMilestone)
  const [deleting, setDeleting] = useState<ProjectMilestone | null>(null)
  const [busy, setBusy] = useState(false)
  const open = (item?: ProjectMilestone) => { setEditing(item ?? 'new'); setDraft(item ? { title: item.title, description: item.description, status: item.status, dueDate: item.dueDate } : blankMilestone()) }
  const save = async (event: FormEvent) => { event.preventDefault(); setBusy(true); try { const next = editing === 'new' ? await api.createProjectMilestone(detail.project.id, draft) : await api.updateProjectMilestone(detail.project.id, editing!.id, draft); onChange(next); setEditing(null); toast.success(editing === 'new' ? 'Milestone added' : 'Milestone updated') } catch (error) { toast.error('Milestone not saved', (error as Error).message) } finally { setBusy(false) } }
  const changeStatus = async (item: ProjectMilestone, status: ProjectMilestoneStatus) => { try { onChange(await api.updateProjectMilestone(detail.project.id, item.id, { status })); toast.success(status === 'completed' ? 'Milestone completed' : 'Milestone updated') } catch (error) { toast.error('Milestone not updated', (error as Error).message) } }
  const move = async (index: number, delta: number) => { const items = [...detail.project.milestones]; const [item] = items.splice(index, 1); items.splice(index + delta, 0, item); try { onChange(await api.reorderProjectMilestones(detail.project.id, items.map(i => i.id))) } catch (error) { toast.error('Order not saved', (error as Error).message) } }
  return <div className="space-y-4"><ProjectProgressCard detail={detail} /><Card><CardHeader title="Milestones" description="Group delivery into clear checkpoints." actions={<Button size="sm" variant="primary" icon={<Plus className="h-3.5 w-3.5" />} onClick={() => open()}>Add milestone</Button>} />{!detail.project.milestones.length ? <EmptyState icon={<Flag className="h-5 w-5" />} title="No milestones yet" description="Add the first delivery checkpoint." /> : <ol className="divide-y divide-slate-100 dark:divide-white/[0.06]">{detail.project.milestones.map((item, index) => <li key={item.id} className="flex flex-wrap items-start gap-3 px-5 py-4"><div className="flex flex-col gap-1"><button type="button" aria-label={`Move ${item.title} up`} disabled={index === 0} onClick={() => move(index, -1)} className={cx('text-slate-400 disabled:opacity-25', focusRing)}><ArrowUp className="h-4 w-4" /></button><button type="button" aria-label={`Move ${item.title} down`} disabled={index === detail.project.milestones.length - 1} onClick={() => move(index, 1)} className={cx('text-slate-400 disabled:opacity-25', focusRing)}><ArrowDown className="h-4 w-4" /></button></div><button type="button" onClick={() => open(item)} className={cx('min-w-44 flex-1 text-left', focusRing)}><span className="font-medium text-slate-900 dark:text-white">{item.title}</span>{item.description && <span className="mt-1 block text-sm text-slate-500">{item.description}</span>}<span className="mt-2 block text-xs text-slate-500">{item.completedTaskCount}/{item.taskCount} tasks{item.dueDate ? ` · ${formatDay(item.dueDate)}` : ''}</span></button><div className="w-36"><Select label={`Status for ${item.title}`} size="sm" value={item.status} onChange={value => changeStatus(item, value)} options={MILESTONE_STATUSES} /></div>{item.status === 'blocked' && <Badge tone="red"><CircleAlert className="mr-1 h-3 w-3" />Blocked</Badge>}<button type="button" aria-label={`Delete ${item.title}`} onClick={() => setDeleting(item)} className={cx('flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-red-600', focusRing)}><Trash2 className="h-3.5 w-3.5" /></button></li>)}</ol>}</Card><Modal open={!!editing} onClose={() => setEditing(null)} title={editing === 'new' ? 'Add milestone' : 'Edit milestone'} footer={<><Button variant="ghost" onClick={() => setEditing(null)}>Cancel</Button><Button variant="primary" form="project-milestone-form" type="submit" loading={busy}>Save milestone</Button></>}><form id="project-milestone-form" onSubmit={save} className="space-y-3"><TextField label="Milestone title" required maxLength={160} value={draft.title} onChange={e => setDraft(d => ({ ...d, title: e.target.value }))} /><TextArea label="Description" maxLength={2000} value={draft.description} onChange={e => setDraft(d => ({ ...d, description: e.target.value }))} /><div className="grid grid-cols-1 gap-3 sm:grid-cols-2"><Select label="Status" value={draft.status} onChange={value => setDraft(d => ({ ...d, status: value }))} options={MILESTONE_STATUSES} /><TextField label="Due date" type="date" value={draft.dueDate ?? ''} onChange={e => setDraft(d => ({ ...d, dueDate: e.target.value || null }))} /></div></form></Modal><ConfirmDialog open={!!deleting} onClose={() => setDeleting(null)} danger title="Delete milestone?" description="Linked tasks are kept and become unassigned." confirmLabel="Delete milestone" onConfirm={async () => { if (!deleting) return; try { onChange(await api.deleteProjectMilestone(detail.project.id, deleting.id)); setDeleting(null); toast.success('Milestone deleted') } catch (error) { toast.error('Milestone not deleted', (error as Error).message) } }} /></div>
}
