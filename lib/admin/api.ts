import type {
  AnalyticsSummary,
  Batch,
  DashboardSummary,
  DuplicateItem,
  Health,
  HealthOverview,
  ImportPreview,
  InboxDetail,
  InboxStatus,
  InboxSummary,
  Proposal,
  ProposalDetail,
  ProposalStatus,
  ProposalSummary,
  Project,
  ProjectDetail,
  ProjectList,
  Incident,
  Monitor,
  MonitorInput,
  ImportRow,
  LeadDetail,
  LeadFilters,
  LeadList,
  LeadSort,
  LeadSummary,
  Paged,
  SavedView,
  Tag
} from './types'

/** Proposal fields as the API accepts them: money as decimal amounts (the server converts to cents). */
export type ProposalInput = Omit<Proposal, 'id' | 'number' | 'status' | 'items' | 'milestones' | 'totals' | 'createdAt' | 'updatedAt' | 'sentAt' | 'acceptedAt' | 'rejectedAt'> & {
  items: { description: string; details: string; quantity: number; unit: string; unitPrice: number; optional: boolean }[]
  milestones: { label: string; due: string; percent: number }[]
}

const BASE = '/admin-api'

export class ApiError extends Error {
  constructor(public code: string, message: string, public status: number, public details?: Record<string, unknown>) {
    super(message)
  }
}

let csrfToken: string | null = null
let onUnauthenticated: ((expired: boolean) => void) | null = null

export function setCsrfToken(token: string | null) {
  csrfToken = token
}

export function setUnauthenticatedHandler(handler: ((expired: boolean) => void) | null) {
  onUnauthenticated = handler
}

type RequestOptions = { method?: 'GET' | 'POST'; body?: unknown; form?: FormData; signal?: AbortSignal; raw?: boolean }

async function request<T>(endpoint: string, action: string, query: Record<string, string> = {}, options: RequestOptions = {}): Promise<T> {
  const params = new URLSearchParams({ action, ...query })
  const method = options.method ?? 'GET'
  const headers: Record<string, string> = { Accept: 'application/json' }
  if (method !== 'GET' && csrfToken) headers['X-CSRF-Token'] = csrfToken
  let body: BodyInit | undefined
  if (options.form) body = options.form
  else if (options.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(options.body)
  }

  let response: Response
  try {
    response = await fetch(`${BASE}/${endpoint}.php?${params}`, {
      method,
      headers,
      body,
      credentials: 'same-origin',
      signal: options.signal,
      cache: 'no-store'
    })
  } catch (error) {
    if ((error as Error).name === 'AbortError') throw error
    throw new ApiError('NETWORK_ERROR', 'Could not reach the admin API. Check your connection.', 0)
  }

  if (options.raw && response.ok) return response as unknown as T

  let payload: { ok: boolean; data?: T; error?: { code: string; message: string; details?: Record<string, unknown> } } | null = null
  try {
    payload = await response.json()
  } catch {
    throw new ApiError(
      'BAD_RESPONSE',
      response.status >= 500 ? 'The admin API failed. Is PHP running on this server?' : `Unexpected response (HTTP ${response.status}).`,
      response.status
    )
  }
  if (!payload?.ok) {
    const error = payload?.error ?? { code: 'UNKNOWN', message: 'Request failed.' }
    if (response.status === 401 && endpoint !== 'auth') onUnauthenticated?.(error.code === 'SESSION_EXPIRED')
    throw new ApiError(error.code, error.message, response.status, error.details)
  }
  return payload.data as T
}

const post = <T>(endpoint: string, action: string, body?: unknown) => request<T>(endpoint, action, {}, { method: 'POST', body: body ?? {} })

export function filtersToQuery(filters: Partial<LeadFilters>): Record<string, string> {
  const query: Record<string, string> = {}
  for (const [key, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      if (value.length) query[key] = value.join(',')
    } else if (typeof value === 'boolean') {
      if (value) query[key] = '1'
    } else if (value) {
      query[key] = String(value)
    }
  }
  return query
}

async function downloadCsv(body: unknown, fallbackName: string) {
  const response = await request<Response>('export', 'leads', {}, { method: 'POST', body, raw: true })
  const blob = await response.blob()
  const disposition = response.headers.get('Content-Disposition') ?? ''
  const name = /filename="([^"]+)"/.exec(disposition)?.[1] ?? fallbackName
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return Number(response.headers.get('X-Row-Count') ?? 0)
}

export const api = {
  session: () => request<{ authenticated: boolean; expired: boolean; csrfToken: string | null }>('auth', 'session'),
  login: (code: string) => post<{ authenticated: boolean; csrfToken: string }>('auth', 'login', { code }),
  logout: () => post<{ authenticated: boolean }>('auth', 'logout'),

  health: (refresh = false) => request<Health>('health', 'status', refresh ? { refresh: '1' } : {}),
  backupNow: () => post<{ file: string }>('health', 'backup'),

  dashboard: () => request<DashboardSummary>('dashboard', 'summary'),

  leads: (filters: Partial<LeadFilters>, page: number, pageSize: number, sort: LeadSort, dir: 'asc' | 'desc', signal?: AbortSignal, withIds = false) =>
    request<LeadList>(
      'leads',
      'list',
      { ...filtersToQuery(filters), page: String(page), pageSize: String(pageSize), sort, dir, ...(withIds ? { withIds: '1' } : {}) },
      { signal }
    ),
  followUps: (bucket: 'overdue' | 'today' | 'upcoming' | 'done', page: number) =>
    request<Paged<LeadSummary> & { counts: Record<'overdue' | 'today' | 'upcoming' | 'done', number> }>('leads', 'followups', {
      bucket,
      page: String(page),
      tzOffset: String(new Date().getTimezoneOffset())
    }),
  lead: (id: string) => request<LeadDetail>('leads', 'get', { id }),
  createLead: (lead: Record<string, unknown>, force = false) => post<LeadDetail>('leads', 'create', { lead, force }),
  updateLead: (id: string, changes: Record<string, unknown>) => post<LeadDetail>('leads', 'update', { id, changes }),
  deleteLeads: (ids: string[]) => post<{ deleted: number }>('leads', 'delete', { ids }),
  bulk: (ids: string[], op: 'status' | 'priority' | 'followUp' | 'addTag' | 'removeTag', value: string | null) =>
    post<{ updated: number }>('leads', 'bulk', { ids, op, value }),
  addNote: (id: string, body: string) => post<LeadDetail>('leads', 'note', { id, body }),
  deleteNote: (noteId: string) => post<LeadDetail>('leads', 'delete-note', { noteId }),
  logContact: (id: string, payload: { type: string; outcome: string; followUpAt?: string | null; nextAction?: string }) =>
    post<LeadDetail>('leads', 'log-contact', { id, ...payload }),
  completeFollowUp: (id: string) => post<LeadDetail>('leads', 'complete-follow-up', { id }),
  enrich: (id: string) => post<LeadDetail & { result: { instagram: string | null; status: string; error: string | null } }>('leads', 'enrich', { id }),

  startDiscovery: (params: Record<string, unknown>) => post<{ batch: Batch }>('discovery', 'start', params),
  discoveryStatus: (signal?: AbortSignal) => request<{ open: Batch[]; at: string }>('discovery', 'status', {}, { method: 'POST', body: {}, signal }),
  stopBatch: (id: string) => post<{ batch: Batch }>('discovery', 'stop', { id }),
  reconcileBatch: (id: string) => post<{ batch: Batch }>('discovery', 'reconcile', { id }),
  batches: (page: number, pageSize: number) => request<Paged<Batch> & { pageSize: number }>('batches', 'list', { page: String(page), pageSize: String(pageSize) }),
  batch: (id: string) => request<{ batch: Batch }>('batches', 'get', { id }),
  deleteBatch: (id: string, deleteLeads: boolean) => post<{ deleted: boolean; deletedLeads: number }>('batches', 'delete', { id, deleteLeads }),

  analytics: (from: string, to: string, signal?: AbortSignal) => request<AnalyticsSummary>('analytics', 'summary', { from, to }, { signal }),

  siteHealth: (signal?: AbortSignal) => request<HealthOverview>('site-health', 'list', {}, { signal }),
  monitor: (id: string) => request<{ monitor: Monitor; incidents: Incident[] }>('site-health', 'get', { id }),
  incidents: () => request<{ incidents: Incident[] }>('site-health', 'incidents'),
  createMonitor: (monitor: MonitorInput) => post<{ monitor: Monitor }>('site-health', 'create', { monitor }),
  updateMonitor: (id: string, monitor: Partial<MonitorInput>) => post<{ monitor: Monitor; incidents: Incident[] }>('site-health', 'update', { id, monitor }),
  deleteMonitor: (id: string) => post<{ deleted: boolean }>('site-health', 'delete', { id }),
  checkMonitor: (id: string) => post<{ monitor: Monitor; incidents: Incident[] }>('site-health', 'check', { id }),

  inbox: (status: InboxStatus | 'all', q: string, page: number) =>
    request<{ items: InboxSummary[]; total: number; page: number; pages: number; counts: Record<InboxStatus, number> }>('inbox', 'list', { status, q, page: String(page) }),
  inquiry: (id: string) => request<InboxDetail>('inbox', 'get', { id }),
  inquiryStatus: (id: string, status: InboxStatus) => post<InboxDetail>('inbox', 'status', { id, status }),
  inquiryNote: (id: string, body: string) => post<InboxDetail>('inbox', 'note', { id, body }),
  inquiryDeleteNote: (id: string, noteId: string) => post<InboxDetail>('inbox', 'delete-note', { id, noteId }),
  inquiryReplied: (id: string) => post<InboxDetail>('inbox', 'mark-replied', { id }),
  inquiryToLead: (id: string) => post<InboxDetail>('inbox', 'convert-lead', { id }),
  inquiryLinkLead: (id: string, leadId: string | null) => post<InboxDetail>('inbox', 'link-lead', { id, leadId }),
  inquiryToProject: (id: string) => post<InboxDetail>('inbox', 'create-project', { id }),
  inquiryLinkProject: (id: string, projectId: string | null) => post<InboxDetail>('inbox', 'link-project', { id, projectId }),
  deleteInquiry: (id: string) => post<{ deleted: boolean }>('inbox', 'delete', { id }),

  projects: (q = '') => request<ProjectList>('projects', 'list', { q }),
  project: (id: string) => request<ProjectDetail>('projects', 'get', { id }),
  createProject: (project: Partial<Project>) => post<ProjectDetail>('projects', 'create', { project }),
  updateProject: (id: string, changes: Partial<Project>) => post<ProjectDetail>('projects', 'update', { id, changes }),
  deleteProject: (id: string) => post<{ deleted: boolean }>('projects', 'delete', { id }),

  proposals: (status: ProposalStatus | 'all', q = '') => request<{ proposals: ProposalSummary[]; counts: Record<ProposalStatus, number> }>('proposals', 'list', { status, q }),
  proposal: (id: string) => request<ProposalDetail>('proposals', 'get', { id }),
  createProposal: (proposal: Partial<ProposalInput>) => post<ProposalDetail>('proposals', 'create', { proposal }),
  updateProposal: (id: string, proposal: Partial<ProposalInput>) => post<ProposalDetail>('proposals', 'update', { id, proposal }),
  proposalStatus: (id: string, status: ProposalStatus, project: 'none' | 'create' | 'update' = 'none') => post<ProposalDetail>('proposals', 'status', { id, status, project }),
  duplicateProposal: (id: string) => post<ProposalDetail>('proposals', 'duplicate', { id }),
  deleteProposal: (id: string) => post<{ deleted: boolean }>('proposals', 'delete', { id }),

  tags: () => request<{ tags: Tag[] }>('tags', 'list'),
  createTag: (name: string, color: string) => post<{ tag: Tag; tags: Tag[] }>('tags', 'create', { name, color }),
  updateTag: (id: string, name: string, color: string) => post<{ tags: Tag[] }>('tags', 'update', { id, name, color }),
  deleteTag: (id: string) => post<{ tags: Tag[] }>('tags', 'delete', { id }),

  views: () => request<{ views: SavedView[] }>('saved-views', 'list'),
  createView: (name: string, filters: LeadFilters) => post<{ view: SavedView; views: SavedView[] }>('saved-views', 'create', { name, filters }),
  renameView: (id: string, name: string) => post<{ views: SavedView[] }>('saved-views', 'update', { id, name }),
  deleteView: (id: string) => post<{ views: SavedView[] }>('saved-views', 'delete', { id }),

  duplicates: (page: number) => request<Paged<DuplicateItem>>('duplicates', 'list', { page: String(page) }),
  mergeDuplicate: (id: string, fields: string[]) => post<{ merged: string[] }>('duplicates', 'merge', { id, fields }),
  dismissDuplicate: (id: string) => post<{ dismissed: boolean }>('duplicates', 'dismiss', { id }),

  exportLeads: (target: { ids: string[] } | { batchId: string } | { filters: Partial<LeadFilters> }) => downloadCsv(target, 'nivello-leads.csv'),

  importPreview: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<ImportPreview>('import', 'preview', {}, { method: 'POST', form })
  },
  importEvaluate: (token: string, mapping: Record<string, string>) =>
    post<{ counts: ImportPreview['counts']; sample: ImportRow[] }>('import', 'evaluate', { token, mapping }),
  importCommit: (token: string, mapping: Record<string, string>) =>
    post<{ imported: number; duplicateCandidates: number; total: number; new: number; duplicate: number; invalid: number }>('import', 'commit', { token, mapping })
}
