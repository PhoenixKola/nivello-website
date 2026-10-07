import type { InvoiceStatus, PaymentMethod, SdiStatus } from '@/lib/admin/types'

type Tone = 'slate' | 'blue' | 'green' | 'red' | 'amber' | 'indigo' | 'teal'

/** Business status of a Fattura (separate from its SdI transmission status). */
export const INVOICE_STATUS_META: Record<InvoiceStatus, { label: string; tone: Tone }> = {
  draft: { label: 'Draft', tone: 'slate' },
  ready: { label: 'Ready', tone: 'blue' },
  issued: { label: 'Issued', tone: 'indigo' },
  paid: { label: 'Paid', tone: 'green' },
  cancelled: { label: 'Cancelled', tone: 'red' }
}

export const SDI_STATUS_META: Record<SdiStatus, { label: string; tone: Tone; hint: string }> = {
  not_exported: { label: 'Not exported', tone: 'slate', hint: 'No XML has been generated yet.' },
  xml_generated: { label: 'XML generated', tone: 'amber', hint: 'Downloaded from Nivello but not yet recorded as sent to SdI.' },
  to_send: { label: 'To send via SdI', tone: 'amber', hint: 'Waiting to be submitted through the Agenzia delle Entrate portal, PEC or your accountant.' },
  sent: { label: 'Sent', tone: 'blue', hint: 'Submitted to SdI; waiting for the receipt.' },
  delivered: { label: 'Delivered', tone: 'green', hint: 'SdI delivery receipt (ricevuta di consegna) received.' },
  rejected: { label: 'Rejected', tone: 'red', hint: 'SdI rejected the file (notifica di scarto): the invoice was not issued.' },
  undeliverable: { label: 'Unable to deliver', tone: 'amber', hint: 'Mancata consegna: SdI accepted the file but could not deliver it; the invoice is issued and available in the client’s reserved area.' }
}

export const PAYMENT_METHOD_LABEL: Record<PaymentMethod, string> = {
  '': 'Not specified',
  bank_transfer: 'Bank transfer',
  card: 'Card',
  cash: 'Cash',
  paypal: 'PayPal',
  other: 'Other'
}
