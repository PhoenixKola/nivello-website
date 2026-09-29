export type LeadStatus = 'new' | 'contacted' | 'follow_up' | 'interested' | 'proposal' | 'won' | 'lost'
export type LeadPriority = 'low' | 'normal' | 'high' | 'urgent'
export type CompanySize = 'unknown' | 'solo' | '2-10' | '11-50' | '51-200' | '200+'
export type ContactMethod = '' | 'phone' | 'whatsapp' | 'email' | 'instagram' | 'in_person' | 'other'
export type ContactLogType = 'call' | 'whatsapp' | 'email' | 'meeting' | 'other'
export type TagColor = 'blue' | 'gold' | 'purple' | 'green' | 'red' | 'teal' | 'pink' | 'slate'
export type SearchLanguage = 'en' | 'it' | 'sq' | 'de' | 'fr' | 'es'
export type BatchStatus = 'queued' | 'dispatching' | 'starting' | 'working' | 'retrying' | 'complete' | 'stopped' | 'exhausted' | 'error'

export type Lead = {
  id: string
  sourceId: string
  fingerprint: string
  companyName: string
  category: string
  categories: string[]
  address: string
  city: string
  country: string
  phone: string
  whatsapp: string
  website: string
  email: string
  instagram: string
  googleMapsUrl: string
  latitude: number | null
  longitude: number | null
  rating: number | null
  reviewCount: number | null
  contactPerson: string
  contactRole: string
  preferredContact: ContactMethod
  companySize: CompanySize
  priority: LeadPriority
  status: LeadStatus
  nextAction: string
  lastContactedAt: string | null
  followUpAt: string | null
  followUpCompletedAt: string | null
  tags: string[]
  source: 'discovery' | 'csv' | 'manual' | 'inbox'
  sourceBatchId: string | null
  sourceQuery: string
  sourceLang: string
  enrichment: { instagram?: 'pending' | 'found' | 'not_found' | 'failed'; instagramCheckedAt?: string }
  createdAt: string
  updatedAt: string
}

export type LeadSummary = Pick<
  Lead,
  | 'id' | 'companyName' | 'category' | 'city' | 'country' | 'phone' | 'whatsapp' | 'email' | 'website' | 'instagram'
  | 'googleMapsUrl' | 'contactPerson' | 'status' | 'priority' | 'tags' | 'followUpAt' | 'followUpCompletedAt'
  | 'nextAction' | 'updatedAt' | 'createdAt'
> & { score: number }

export type ScoreReason = { delta: number; label: string }
export type Score = { score: number; reasons: ScoreReason[] }

export type Note = { id: string; leadId: string; body: string; createdAt: string }
export type Activity = { id: string; leadId: string; type: string; message: string; at: string; companyName?: string | null }

export type LeadDetail = {
  lead: Lead
  score: Score
  notes: Note[]
  activities: Activity[]
  batch: { id: string; label: string; status: BatchStatus } | null
  pendingDuplicates: number
  related: LeadRelated
}

export type LeadFilters = {
  q: string
  status: LeadStatus[]
  priority: LeadPriority[]
  country: string
  city: string
  category: string
  tag: string
  batch: string
  noWebsite: boolean
  hasEmail: boolean
  hasInstagram: boolean
  followUpDue: boolean
}

export type LeadSort = 'updated' | 'created' | 'score' | 'company' | 'followUp'

export type LeadList = {
  items: LeadSummary[]
  total: number
  page: number
  pageSize: number
  pages: number
  facets: { countries: string[]; cities: string[]; categories: string[] }
  ids: string[] | null
}

export type Tag = { id: string; name: string; color: TagColor; count: number }
export type SavedView = { id: string; name: string; filters: LeadFilters; createdAt: string }

export type BatchCounters = {
  checked: number
  imported: number
  duplicates: number
  rejected: number
  rejectedWebsite: number
  rejectedPhone: number
  rejectedInvalid: number
}

export type BatchPass = {
  index: number
  query: string
  lang: SearchLanguage
  depth: number
  maxTime?: number
  attempts?: number
  jobId?: string | null
  startedAt?: string
  scraperStatus?: string
  retryAfter?: string
  lastError?: string | null
  rows?: number
  imported?: number
  failed?: boolean
  error?: string
  finishedAt?: string
}

export type Batch = {
  id: string
  label: string
  isOpen: boolean
  createdAt: string
  updatedAt: string
  startedAt: string | null
  finishedAt: string | null
  status: BatchStatus
  params: {
    country: string
    city: string
    category: string
    target: number
    languages: SearchLanguage[]
    noWebsite: boolean
    requirePhone: boolean
    email: boolean
    instagram: boolean
  }
  planLength: number
  planIndex: number
  currentPass: BatchPass | null
  lastPass: BatchPass | null
  counters: BatchCounters
  passesCompleted: number
  passesFailed: number
  error: { code: string; message: string } | null
  runner: { state: 'ok' | 'degraded'; message: string | null }
  github: {
    segment: number
    runId: string | null
    runUrl: string | null
    runStatus: string | null
    dispatchedAt: string | null
    dispatchAttempts: number
    lastCallbackAt: string | null
    cancel: 'requested' | 'cancelled' | 'failed' | 'none' | null
  }
  events: { at: string; level: 'info' | 'warning' | 'success'; message: string }[]
}

export type Paged<T> = { items: T[]; total: number; page: number; pages: number }

export type Health = {
  api: { ok: boolean; time: string }
  storage: {
    ok: boolean
    error: string | null
    writable: boolean
    fileSize: number
    backupCount: number
    lastBackupFile: string | null
    lastBackupAt: string | null
    lastRecovery: { at: string; reason: string; restoredFrom: string; preservedAs: string | null } | null
  }
  discovery: DiscoveryHealth
  counts: { leads: number; batches: number; openBatches: number; tags: number; pendingDuplicates: number; newInquiries: number; siteIssues: number }
}

export type DiscoveryIssue = { code: string; message: string }

export type DiscoveryHealth = {
  available: boolean
  issues: DiscoveryIssue[]
  repo: string
  workflow: string
  ref: string
  callbackUrl: string
  tokenConfigured: boolean
  callbackSecretConfigured: boolean
  apiReachable: boolean | null
  workflowFound: boolean | null
  latestRun: { id: string; status: string; conclusion: string | null; htmlUrl: string | null; title: string | null; createdAt: string | null } | null
}

export type DashboardSummary = {
  totals: {
    leads: number
    new: number
    followUpsDue: number
    contacted: number
    interested: number
    won: number
    lost: number
    importedThisWeek: number
  }
  byStatus: Record<LeadStatus, number>
  topCities: { label: string; count: number }[]
  topCategories: { label: string; count: number }[]
  recentActivity: Activity[]
  upcomingFollowUps: { id: string; companyName: string; followUpAt: string; nextAction: string; status: LeadStatus; overdue: boolean }[]
  pendingDuplicates: number
  ops: {
    inbox: { new: number; failedDelivery: number; latest: InboxSummary[] }
    projects: {
      active: number
      dueSoon: number
      overdue: number
      awaitingProposal: number
      inDevelopment: number
      inQa: number
      recentlyDelivered: number
      value: Partial<Record<Currency, number>>
      due: { id: string; name: string; clientName: string; targetDate: string; due: 'soon' | 'overdue'; stage: ProjectStage }[]
    }
    proposals: { draft: number; sent: number; accepted: number; acceptedThisMonth: number; sentValue: Partial<Record<Currency, number>>; awaiting: ProposalSummary[] }
  } | null
  feed: { id: string; entity: 'lead' | 'inbox' | 'project' | 'proposal'; entityId: string; message: string; at: string; label: string | null }[] | null
  health: { counts: Record<MonitorState, number>; total: number; attention: { id: string; name: string; state: MonitorState; detail: string }[] } | null
  analytics: { totals: AnalyticsSummary['totals']; series: { date: string; pageViews: number }[] } | null
}

export type DuplicateItem = {
  id: string
  reason: string
  source: 'discovery' | 'csv'
  createdAt: string
  candidate: Partial<Lead>
  existing: Partial<Lead> & { id: string; companyName: string }
  fills: string[]
}

export type ImportRow = {
  row: number
  status: 'new' | 'duplicate' | 'invalid'
  reason: string | null
  lead: Lead
  warnings: string[]
}

export type ImportPreview = {
  token: string
  fileName: string
  headers: string[]
  mapping: Record<string, string>
  fields: string[]
  counts: { total: number; new: number; duplicate: number; invalid: number }
  sample: ImportRow[]
}

export type CountItem = { label: string; count: number }

export type AnalyticsSummary = {
  from: string
  to: string
  totals: {
    pageViews: number
    sessions: number
    contactSubmits: number
    contactStarts: number
    launcherStarts: number
    launcherCompletes: number
    caseStudyOpens: number
    ctaClicks: number
    contactConversionRate: number | null
    launcherConversionRate: number | null
  }
  previous: { pageViews: number; sessions: number; contactSubmits: number; launcherCompletes: number }
  series: { date: string; pageViews: number; sessions: number; contactSubmits: number; launcherCompletes: number }[]
  topPages: CountItem[]
  topLandingPages: CountItem[]
  topReferrers: CountItem[]
  devices: CountItem[]
  locales: CountItem[]
  ctas: CountItem[]
  caseStudies: CountItem[]
  launcherOutcomes: CountItem[]
  contactSources: CountItem[]
  unreadableDays: string[]
}

export type MonitorState = 'healthy' | 'warning' | 'down' | 'paused' | 'pending'

export type MonitorCheck = { at: string; ok: boolean; status: number; ms: number | null; error: string | null; source: 'scheduled' | 'manual' }

export type Monitor = {
  id: string
  name: string
  url: string
  expectedStatus: number
  enabled: boolean
  notes: string
  createdAt: string
  updatedAt: string
  last: Omit<MonitorCheck, 'source'> | null
  lastSuccessAt: string | null
  lastFailureAt: string | null
  consecutiveFailures: number
  ssl: { expiresAt: string; issuer: string | null; checkedAt: string } | null
  state: MonitorState
  warnings: string[]
  sslDaysLeft: number | null
  uptime: number | null
  uptimeChecks: number
  avgMs: number | null
  recent: MonitorCheck[]
  openIncident: boolean
}

export type Incident = {
  id: string
  monitorId: string
  monitorName: string
  startedAt: string
  resolvedAt: string | null
  cause: string | null
  lastError: string | null
  failedChecks: number
}

export type HealthOverview = {
  monitors: Monitor[]
  counts: Record<MonitorState, number>
  openIncidents: Incident[]
  lastRun: { at: string; recorded: number } | null
}

export type MonitorInput = { name: string; url: string; expectedStatus: number; enabled: boolean; notes: string }

export type OpsActivity = { id: string; entity: string; entityId: string; type: string; message: string; meta: Record<string, unknown>; at: string }
export type LeadBrief = { id: string; companyName: string; status: LeadStatus; email: string }

export type InboxStatus = 'new' | 'replied' | 'qualified' | 'converted' | 'closed' | 'spam'

export type InboxSummary = {
  id: string
  name: string
  email: string
  company: string
  projectType: string
  budget: string
  status: InboxStatus
  delivery: 'delivered' | 'failed'
  leadId: string | null
  projectId: string | null
  createdAt: string
  excerpt: string
}

export type InboxItem = Omit<InboxSummary, 'excerpt'> & {
  submissionId: string
  timing: string
  deadline: string
  message: string
  brief: string
  source: string
  page: string
  locale: 'en' | 'it'
  notes: { id: string; body: string; createdAt: string }[]
  updatedAt: string
}

export type InboxDetail = { item: InboxItem; lead: LeadBrief | null; project: { id: string; name: string; stage: ProjectStage } | null; activities: OpsActivity[] }

export type ProjectStage = 'lead' | 'discovery' | 'proposal' | 'approved' | 'design' | 'development' | 'qa' | 'delivered' | 'maintenance' | 'archived'
export type Currency = 'EUR' | 'USD' | 'GBP' | 'CHF'

export type Project = {
  id: string
  name: string
  clientName: string
  leadId: string | null
  inboxId: string | null
  proposalId: string | null
  stage: ProjectStage
  priority: LeadPriority
  value: number | null
  currency: Currency
  startDate: string | null
  targetDate: string | null
  deliveredDate: string | null
  nextAction: string
  notes: string
  links: { label: string; url: string }[]
  tags: string[]
  stageChangedAt: string
  createdAt: string
  updatedAt: string
  due: 'soon' | 'overdue' | null
  lead: LeadBrief | null
  proposalCount: number
}

export type ProjectList = {
  projects: Project[]
  counts: Record<ProjectStage, number>
  stats: { active: number; dueSoon: number; overdue: number; pipelineValue: Partial<Record<Currency, number>> }
}

export type ProposalStatus = 'draft' | 'sent' | 'accepted' | 'rejected' | 'expired'
export type ProposalUnit = 'fixed' | 'hour' | 'day' | 'month' | 'item' | 'page'

export type ProposalSummary = {
  id: string
  number: string
  title: string
  status: ProposalStatus
  clientName: string
  clientCompany: string
  currency: Currency
  total: number
  issueDate: string
  validUntil: string | null
  pastValidity: boolean
  leadId: string | null
  projectId: string | null
  updatedAt: string
  sentAt: string | null
  acceptedAt: string | null
}

export type ProjectDetail = { project: Project; inquiry: InboxSummary | null; proposals: ProposalSummary[]; activities: OpsActivity[] }

export type ProposalItem = { description: string; details: string; quantity: number; unit: ProposalUnit; unitPrice: number; optional: boolean; total: number }
export type ProposalMilestone = { label: string; due: string; percent: number; amount: number }

export type Proposal = {
  id: string
  number: string
  title: string
  status: ProposalStatus
  language: 'en' | 'it'
  leadId: string | null
  projectId: string | null
  clientName: string
  clientCompany: string
  clientEmail: string
  currency: Currency
  issueDate: string
  validUntil: string | null
  intro: string
  scope: string
  assumptions: string
  terms: string
  notes: string
  items: ProposalItem[]
  discount: { type: 'none' | 'percent' | 'amount'; value: number }
  tax: { label: string; rate: number }
  milestones: ProposalMilestone[]
  totals: { subtotal: number; discount: number; tax: number; total: number; optional: number }
  createdAt: string
  updatedAt: string
  sentAt: string | null
  acceptedAt: string | null
  rejectedAt: string | null
}

export type ProposalDetail = { proposal: Proposal; lead: LeadBrief | null; project: { id: string; name: string; stage: ProjectStage } | null; activities: OpsActivity[] }

export type LeadRelated = {
  inbox: InboxSummary[]
  projects: { id: string; name: string; stage: ProjectStage; targetDate: string | null }[]
  proposals: ProposalSummary[]
}
