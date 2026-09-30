'use client'

import { useState } from 'react'
import { Bookmark, BookmarkPlus, MoreHorizontal, Pencil, RefreshCw, Star, Trash2 } from 'lucide-react'
import { api } from '@/lib/admin/api'
import { BUILT_IN_VIEWS } from '@/lib/admin/constants'
import type { LeadFilters, SavedView } from '@/lib/admin/types'
import { Button } from '../ui/Button'
import { TextField } from '../ui/Inputs'
import { Menu } from '../ui/Listbox'
import { ConfirmDialog, Modal } from '../ui/Overlay'
import { useToast } from '../ui/Toast'
import { cx, focusRing } from '../ui/styles'

type Props = {
  views: SavedView[]
  onViewsChange: (views: SavedView[]) => void
  activeView: string | null
  onApply: (id: string, filters: Partial<LeadFilters>) => void
  currentFilters: LeadFilters
}

const pill = (active: boolean) =>
  cx(
    'inline-flex h-8 shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 text-xs font-medium transition-colors',
    active
      ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
      : 'bg-white text-slate-600 ring-1 ring-inset ring-slate-200 hover:text-slate-900 dark:bg-white/[0.04] dark:text-slate-300 dark:ring-white/10 dark:hover:text-white',
    focusRing
  )

export default function LeadViews({ views, onViewsChange, activeView, onApply, currentFilters }: Props) {
  const toast = useToast()
  const [saveOpen, setSaveOpen] = useState(false)
  const [renaming, setRenaming] = useState<SavedView | null>(null)
  const [deleting, setDeleting] = useState<SavedView | null>(null)
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)

  const save = async () => {
    if (!name.trim()) return
    setBusy(true)
    try {
      const result = await api.createView(name.trim(), currentFilters)
      onViewsChange(result.views)
      onApply(result.view.id, result.view.filters)
      toast.success('View saved', `“${result.view.name}” is now in your views.`)
      setSaveOpen(false)
    } catch (error) {
      toast.error('Could not save view', (error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  const updateFilters = async (view: SavedView) => {
    try {
      onViewsChange((await api.updateViewFilters(view.id, currentFilters)).views)
      onApply(view.id, currentFilters)
      toast.success('View updated', `“${view.name}” now uses the current filters.`)
    } catch (error) {
      toast.error('Could not update view', (error as Error).message)
    }
  }

  const toggleDefault = async (view: SavedView) => {
    try {
      onViewsChange((await api.setDefaultView(view.isDefault ? null : view.id)).views)
      toast.success(view.isDefault ? 'Default view removed' : 'Default view set', view.isDefault ? 'Leads opens with all leads.' : `Leads opens with “${view.name}”.`)
    } catch (error) {
      toast.error('Could not change the default view', (error as Error).message)
    }
  }

  const rename = async () => {
    if (!renaming || !name.trim()) return
    setBusy(true)
    try {
      onViewsChange((await api.renameView(renaming.id, name.trim())).views)
      setRenaming(null)
    } catch (error) {
      toast.error('Could not rename view', (error as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative -mx-1 flex min-w-0 flex-1 gap-1.5 overflow-x-auto px-1 py-0.5 [scrollbar-width:none]" role="toolbar" aria-label="Lead views">
        {BUILT_IN_VIEWS.map(view => (
          <button key={view.id} type="button" aria-pressed={activeView === view.id} onClick={() => onApply(view.id, view.filters)} className={pill(activeView === view.id)}>
            {view.name}
          </button>
        ))}
        {views.map(view => (
          <span key={view.id} className="inline-flex shrink-0 items-center">
            <button type="button" aria-pressed={activeView === view.id} onClick={() => onApply(view.id, view.filters)} className={cx(pill(activeView === view.id), 'rounded-r-none pr-2')}>
              {view.isDefault ? <Star aria-hidden="true" className="h-3 w-3 fill-current" /> : <Bookmark aria-hidden="true" className="h-3 w-3" />}
              {view.name}
              {view.isDefault && <span className="sr-only"> (default)</span>}
            </button>
            <Menu
              label={`Manage view ${view.name}`}
              items={[
                { label: 'Update with current filters', icon: <RefreshCw className="h-4 w-4" />, onSelect: () => updateFilters(view) },
                { label: view.isDefault ? 'Remove as default' : 'Set as default', icon: <Star className="h-4 w-4" />, onSelect: () => toggleDefault(view) },
                {
                  label: 'Rename',
                  icon: <Pencil className="h-4 w-4" />,
                  onSelect: () => {
                    setName(view.name)
                    setRenaming(view)
                  }
                },
                { label: 'Delete', icon: <Trash2 className="h-4 w-4" />, danger: true, onSelect: () => setDeleting(view) }
              ]}
              trigger={({ ref, open, toggle, onKeyDown, menuId }) => (
                <button
                  ref={ref}
                  type="button"
                  aria-label={`Manage view ${view.name}`}
                  aria-haspopup="menu"
                  aria-expanded={open}
                  aria-controls={open ? menuId : undefined}
                  onClick={toggle}
                  onKeyDown={onKeyDown}
                  className={cx(pill(activeView === view.id), 'rounded-l-none border-l border-white/20 px-1.5 dark:border-slate-900/10')}
                >
                  <MoreHorizontal className="h-3.5 w-3.5" />
                </button>
              )}
            />
          </span>
        ))}
      </div>
      <Button
        size="sm"
        variant="ghost"
        icon={<BookmarkPlus className="h-4 w-4" />}
        onClick={() => {
          setName('')
          setSaveOpen(true)
        }}
      >
        <span className="hidden sm:inline">Save view</span>
      </Button>

      <Modal
        open={saveOpen}
        onClose={() => setSaveOpen(false)}
        size="sm"
        title="Save current filters as a view"
        footer={
          <>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={save} loading={busy} disabled={!name.trim()}>
              Save view
            </Button>
          </>
        }
      >
        <form
          onSubmit={event => {
            event.preventDefault()
            save()
          }}
        >
          <TextField label="View name" value={name} onChange={e => setName(e.target.value)} maxLength={60} data-autofocus placeholder="e.g. Tirana dentists to call" />
        </form>
      </Modal>

      <Modal
        open={renaming !== null}
        onClose={() => setRenaming(null)}
        size="sm"
        title="Rename view"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenaming(null)}>
              Cancel
            </Button>
            <Button variant="primary" onClick={rename} loading={busy} disabled={!name.trim()}>
              Rename
            </Button>
          </>
        }
      >
        <form
          onSubmit={event => {
            event.preventDefault()
            rename()
          }}
        >
          <TextField label="View name" value={name} onChange={e => setName(e.target.value)} maxLength={60} data-autofocus />
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        danger
        title={`Delete view “${deleting?.name ?? ''}”?`}
        description="Only the saved filters are removed. Leads are not affected."
        confirmLabel="Delete view"
        onConfirm={async () => {
          if (!deleting) return
          try {
            onViewsChange((await api.deleteView(deleting.id)).views)
            setDeleting(null)
          } catch (error) {
            toast.error('Could not delete view', (error as Error).message)
          }
        }}
      />
    </div>
  )
}
