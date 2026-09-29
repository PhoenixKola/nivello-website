// Second write of a contact-form inquiry into the private Nivello Inbox (public/admin-api/inbox-capture.php).
// Formspree remains the delivery path; this capture never blocks or changes what the visitor sees.

const CAPTURE_ENDPOINT = '/admin-api/inbox-capture.php'
const FIELDS = ['name', 'email', 'company', 'projectType', 'budget', 'timing', 'deadline', 'message', 'projectBrief'] as const

export function newSubmissionId() {
  const bytes = new Uint8Array(16)
  crypto.getRandomValues(bytes)
  return Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('')
}

export function captureInquiry(form: FormData, meta: { submissionId: string; delivery: 'delivered' | 'failed'; source: string; locale: string }) {
  const payload: Record<string, string> = { ...meta, page: window.location.pathname }
  for (const field of FIELDS) {
    const value = form.get(field)
    if (typeof value === 'string') payload[field] = value
  }
  try {
    // keepalive lets the request finish even if the visitor navigates away right after sending.
    void fetch(CAPTURE_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'same-origin'
    }).catch(() => {})
  } catch {
    // Never let the private capture affect the public form.
  }
}
