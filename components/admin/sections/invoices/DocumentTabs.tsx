'use client'

import { useAdmin } from '../../AdminContext'
import { Tabs } from '../../ui/Controls'

/** Local document tabs: Preventivi and Fatture live in the same area. */
export default function DocumentTabs({ value }: { value: 'proposals' | 'invoices' }) {
  const { navigate } = useAdmin()
  return (
    <Tabs<'proposals' | 'invoices'>
      label="Document type"
      value={value}
      onChange={next => navigate('proposals', next === 'invoices' ? { doc: 'invoices' } : {})}
      tabs={[
        { value: 'proposals', label: 'Preventivi' },
        { value: 'invoices', label: 'Fatture' }
      ]}
    />
  )
}
