import type { BatchStatus, CompanySize, ContactLogType, ContactMethod, Currency, InboxStatus, LeadFilters, LeadPriority, LeadStatus, ProjectStage, ProposalStatus, ProposalUnit, SearchLanguage, TagColor } from './types'

export const LEAD_STATUSES: { value: LeadStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'follow_up', label: 'Follow-up' },
  { value: 'interested', label: 'Interested' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' }
]
export const STATUS_LABEL = Object.fromEntries(LEAD_STATUSES.map(s => [s.value, s.label])) as Record<LeadStatus, string>

export const PRIORITIES: { value: LeadPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'normal', label: 'Normal' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' }
]
export const PRIORITY_LABEL = Object.fromEntries(PRIORITIES.map(p => [p.value, p.label])) as Record<LeadPriority, string>

export const COMPANY_SIZES: { value: CompanySize; label: string }[] = [
  { value: 'unknown', label: 'Unknown' },
  { value: 'solo', label: 'Solo' },
  { value: '2-10', label: '2–10' },
  { value: '11-50', label: '11–50' },
  { value: '51-200', label: '51–200' },
  { value: '200+', label: '200+' }
]

export const CONTACT_METHODS: { value: ContactMethod; label: string }[] = [
  { value: '', label: 'Not set' },
  { value: 'phone', label: 'Phone' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'in_person', label: 'In person' },
  { value: 'other', label: 'Other' }
]

export const CONTACT_LOG_TYPES: { value: ContactLogType; label: string }[] = [
  { value: 'call', label: 'Called' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'other', label: 'Other' }
]

export const SEARCH_LANGUAGES: { value: SearchLanguage; label: string }[] = [
  { value: 'en', label: 'English' },
  { value: 'it', label: 'Italian' },
  { value: 'sq', label: 'Albanian' },
  { value: 'de', label: 'German' },
  { value: 'fr', label: 'French' },
  { value: 'es', label: 'Spanish' }
]
export const LANGUAGE_LABEL = Object.fromEntries(SEARCH_LANGUAGES.map(l => [l.value, l.label])) as Record<SearchLanguage, string>

export const BATCH_STATUS_LABEL: Record<BatchStatus, string> = {
  queued: 'Queued',
  dispatching: 'Dispatching',
  starting: 'Starting runner',
  working: 'Working',
  retrying: 'Retrying',
  complete: 'Complete',
  stopped: 'Stopped',
  exhausted: 'Exhausted',
  error: 'Needs attention'
}
export const OPEN_BATCH_STATUSES: BatchStatus[] = ['queued', 'dispatching', 'starting', 'working', 'retrying']

export const TAG_COLORS: TagColor[] = ['blue', 'gold', 'purple', 'green', 'red', 'teal', 'pink', 'slate']

export const EMPTY_FILTERS: LeadFilters = {
  q: '',
  status: [],
  priority: [],
  country: '',
  city: '',
  category: '',
  tag: '',
  batch: '',
  noWebsite: false,
  hasEmail: false,
  hasInstagram: false,
  followUpDue: false
}

export const BUILT_IN_VIEWS: { id: string; name: string; filters: Partial<LeadFilters> }[] = [
  { id: 'all', name: 'All leads', filters: {} },
  { id: 'new', name: 'New', filters: { status: ['new'] } },
  { id: 'due', name: 'Follow-ups due', filters: { followUpDue: true } },
  { id: 'high', name: 'High priority', filters: { priority: ['high', 'urgent'] } },
  { id: 'no-website', name: 'No website', filters: { noWebsite: true } },
  { id: 'has-email', name: 'Has email', filters: { hasEmail: true } },
  { id: 'has-instagram', name: 'Has Instagram', filters: { hasInstagram: true } },
  { id: 'won', name: 'Won', filters: { status: ['won'] } },
  { id: 'lost', name: 'Lost', filters: { status: ['lost'] } }
]

export const INBOX_STATUSES: { value: InboxStatus; label: string; tone: 'blue' | 'indigo' | 'teal' | 'green' | 'slate' | 'red' }[] = [
  { value: 'new', label: 'New', tone: 'blue' },
  { value: 'replied', label: 'Replied', tone: 'indigo' },
  { value: 'qualified', label: 'Qualified', tone: 'teal' },
  { value: 'converted', label: 'Converted', tone: 'green' },
  { value: 'closed', label: 'Closed', tone: 'slate' },
  { value: 'spam', label: 'Spam', tone: 'red' }
]
export const INBOX_STATUS_META = Object.fromEntries(INBOX_STATUSES.map(s => [s.value, s])) as Record<InboxStatus, (typeof INBOX_STATUSES)[number]>

export const PROJECT_STAGES: { value: ProjectStage; label: string; dot: string }[] = [
  { value: 'lead', label: 'Lead', dot: 'bg-slate-400' },
  { value: 'discovery', label: 'Discovery', dot: 'bg-sky-500' },
  { value: 'proposal', label: 'Proposal', dot: 'bg-violet-500' },
  { value: 'approved', label: 'Approved', dot: 'bg-indigo-500' },
  { value: 'design', label: 'Design', dot: 'bg-pink-500' },
  { value: 'development', label: 'Development', dot: 'bg-amber-500' },
  { value: 'qa', label: 'QA', dot: 'bg-orange-500' },
  { value: 'delivered', label: 'Delivered', dot: 'bg-emerald-500' },
  { value: 'maintenance', label: 'Maintenance', dot: 'bg-teal-500' },
  { value: 'archived', label: 'Archived', dot: 'bg-slate-300' }
]
export const STAGE_LABEL = Object.fromEntries(PROJECT_STAGES.map(s => [s.value, s.label])) as Record<ProjectStage, string>
export const OPEN_STAGES: ProjectStage[] = ['lead', 'discovery', 'proposal', 'approved', 'design', 'development', 'qa']

export const PROPOSAL_STATUSES: { value: ProposalStatus; label: string; tone: 'slate' | 'blue' | 'green' | 'red' | 'amber' }[] = [
  { value: 'draft', label: 'Draft', tone: 'slate' },
  { value: 'sent', label: 'Sent', tone: 'blue' },
  { value: 'accepted', label: 'Accepted', tone: 'green' },
  { value: 'rejected', label: 'Rejected', tone: 'red' },
  { value: 'expired', label: 'Expired', tone: 'amber' }
]
export const PROPOSAL_STATUS_META = Object.fromEntries(PROPOSAL_STATUSES.map(s => [s.value, s])) as Record<ProposalStatus, (typeof PROPOSAL_STATUSES)[number]>

export const CURRENCIES: Currency[] = ['EUR', 'USD', 'GBP', 'CHF']
export const PROPOSAL_UNITS: { value: ProposalUnit; label: string }[] = [
  { value: 'fixed', label: 'Fixed' },
  { value: 'hour', label: 'Hour' },
  { value: 'day', label: 'Day' },
  { value: 'month', label: 'Month' },
  { value: 'item', label: 'Item' },
  { value: 'page', label: 'Page' }
]
