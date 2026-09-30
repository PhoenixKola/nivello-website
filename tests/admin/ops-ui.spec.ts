import { readFileSync } from 'node:fs'
import { expect, request, test, type Page } from '@playwright/test'
import JSZip from 'jszip'
import { accessCode, ADMIN_BASE } from './helpers'

test.describe.configure({ mode: 'serial', timeout: 120_000 })

async function login(page: Page) {
  await page.goto('/admin/')
  await page.getByLabel('Access code', { exact: true }).fill(accessCode())
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.locator('header h1')).toBeVisible()
}

const nav = (page: Page) => page.getByRole('navigation', { name: 'Admin' })

test('sidebar groups product areas; local tabs stay inside each area', async ({ page }) => {
  await login(page)
  for (const area of ['Overview', 'Lead Forge', 'Analytics', 'Inbox', 'Projects', 'Proposals', 'Site Health', 'Settings']) {
    await expect(nav(page).getByRole('link', { name: new RegExp(`^${area}`) })).toBeVisible()
  }
  // Lead Forge sub-pages are not in the sidebar.
  await expect(nav(page).getByRole('link', { name: 'Follow-ups' })).toHaveCount(0)
  await nav(page).getByRole('link', { name: /^Analytics/ }).click()
  await expect(page.getByRole('heading', { name: 'Analytics', level: 1 })).toBeVisible()
  await expect(page.getByRole('tablist', { name: 'Analytics views' })).toBeVisible()
  await expect(nav(page).getByRole('link', { name: /^Analytics/ })).toHaveAttribute('aria-current', 'page')
})

test('inbox: a captured inquiry can be opened, noted and converted to a lead', async ({ page }) => {
  const site = await request.newContext({ baseURL: ADMIN_BASE })
  const res = await site.post('/admin-api/inbox-capture.php', {
    headers: { Origin: ADMIN_BASE, 'Content-Type': 'text/plain' },
    data: JSON.stringify({ submissionId: 'f'.repeat(32), delivery: 'failed', name: 'Paolo Bianchi', email: 'paolo@bianchi-ui.test', company: 'Bianchi UI', projectType: 'Website development', message: 'We need a landing page for a product launch.', locale: 'it', source: 'direct' })
  })
  expect(res.status()).toBe(204)
  await site.dispose()

  await login(page)
  await nav(page).getByRole('link', { name: /^Inbox/ }).click()
  // Wait for the Inbox view: the Overview's "New inquiries" list has a button with the same name.
  await expect(page.getByRole('heading', { name: 'Inbox', level: 1 })).toBeVisible()
  await page.locator('#admin-main').getByRole('button', { name: /Paolo Bianchi/ }).first().click()
  const drawer = page.getByRole('dialog', { name: 'Inquiry from Paolo Bianchi' })
  await expect(drawer.getByText('The email delivery (Formspree) failed')).toBeVisible()
  await drawer.getByLabel('Add a note').fill('Wants to launch in May')
  await drawer.getByRole('button', { name: 'Save note' }).click()
  await expect(drawer.getByText('Wants to launch in May')).toBeVisible()
  await drawer.getByRole('button', { name: 'Convert to lead' }).click()
  await expect(drawer.getByRole('button', { name: /Bianchi UI/ })).toBeVisible()
  await expect(drawer.getByText('Converted', { exact: true }).first()).toBeVisible()
})

test('inbox renders submitted HTML as plain text', async ({ page }) => {
  const payload = '<img src=x onerror="window.__xss=1"><script>window.__xss=2</script><b>bold</b>'
  const site = await request.newContext({ baseURL: ADMIN_BASE })
  const res = await site.post('/admin-api/inbox-capture.php', {
    headers: { Origin: ADMIN_BASE, 'Content-Type': 'text/plain' },
    data: JSON.stringify({ submissionId: 'e'.repeat(31) + 'a', delivery: 'delivered', name: '<i>Mallory</i>', email: 'mallory@xss.test', message: payload, locale: 'en', source: 'direct' })
  })
  expect(res.status()).toBe(204)
  await site.dispose()

  await login(page)
  await page.goto('/admin/#/inbox')
  await expect(page.getByRole('heading', { name: 'Inbox', level: 1 })).toBeVisible()
  await page.locator('#admin-main').getByRole('button', { name: /<i>Mallory<\/i>/ }).first().click()
  const drawer = page.getByRole('dialog', { name: 'Inquiry from <i>Mallory</i>' })
  await expect(drawer.getByText(payload)).toBeVisible()
  await expect(drawer.locator('img[src="x"], b')).toHaveCount(0)
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined()
})

test('projects: create, move with the accessible menu, open details', async ({ page }) => {
  await login(page)
  await nav(page).getByRole('link', { name: /^Projects/ }).click()
  await page.getByRole('button', { name: 'New project' }).first().click()
  const modal = page.getByRole('dialog', { name: 'New project' })
  await modal.getByLabel('Project name').fill('UI test project')
  await modal.getByLabel('Client', { exact: true }).fill('UI Client')
  await modal.getByRole('button', { name: 'Create project' }).click()

  const drawer = page.getByRole('dialog', { name: 'Project UI test project' })
  await expect(drawer).toBeVisible()
  await drawer.getByLabel('Next action').fill('Kick-off call')
  await drawer.getByRole('button', { name: 'Save changes' }).click()
  await expect(drawer.getByText('Details updated')).toBeVisible()
  await drawer.getByRole('button', { name: 'Close' }).first().click()

  // Grouped board: the project keeps its exact stage (shown as a chip) inside its workflow group.
  const board = page.getByRole('region', { name: 'Project pipeline board' })
  const sales = board.getByRole('region', { name: /^Sales \(/ })
  await expect(sales.getByText('UI test project')).toBeVisible()
  await sales.getByRole('button', { name: 'Move UI test project to another stage' }).click()
  await page.getByRole('menuitem', { name: 'Move to Design' }).click()
  const delivery = board.getByRole('region', { name: /^Delivery \(/ })
  await expect(delivery.getByText('UI test project')).toBeVisible()
  await expect(delivery.getByText('Design', { exact: true })).toBeVisible()
})

test('projects on mobile stack the workflow groups without horizontal overflow', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page)
  await page.goto('/admin/#/projects')
  const board = page.getByRole('region', { name: 'Project pipeline board' })
  for (const group of ['Sales', 'Delivery', 'Completed', 'Aftercare']) await expect(board.getByRole('region', { name: new RegExp(`^${group} \\(`) })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0)
})

test('project detail manages milestones and tasks in responsive local tabs', async ({ page }, testInfo) => {
  await login(page)
  await page.goto('/admin/#/projects')
  await page.getByRole('tab', { name: /All projects/i }).click()
  const projectButton = page.getByRole('button', { name: /UI test project/ }).first()
  await expect(projectButton).toBeVisible()
  await projectButton.click()
  await page.setViewportSize({ width: 390, height: 844 })
  const drawer = page.getByRole('dialog', { name: 'Project UI test project' })
  await drawer.getByRole('tab', { name: /Milestones/ }).click()
  await drawer.getByRole('button', { name: 'Add milestone' }).click()
  const milestone = page.getByRole('dialog', { name: 'Add milestone' })
  await milestone.getByLabel('Milestone title').fill('Launch readiness')
  await milestone.getByRole('button', { name: 'Save milestone' }).click()
  await expect(drawer.getByText('Launch readiness')).toBeVisible()

  await drawer.getByRole('tab', { name: /Tasks/ }).click()
  await drawer.getByRole('button', { name: 'Add task' }).click()
  const task = page.getByRole('dialog', { name: 'Add task' })
  await task.getByLabel('Task title').fill('Run launch checklist')
  await task.getByLabel('Assignee').fill('Nivello')
  await task.getByRole('button', { name: 'Save task' }).click()
  await expect(drawer.getByText('Run launch checklist')).toBeVisible()
  await drawer.getByRole('button', { name: 'Complete Run launch checklist' }).click()
  await expect(drawer.getByText('1 of 1 tasks complete')).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  await page.screenshot({ path: testInfo.outputPath('project-tasks-mobile.png'), fullPage: true })
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.screenshot({ path: testInfo.outputPath('project-tasks-desktop.png'), fullPage: true })
})

test('proposals: create, add a line, save with server totals, preview and download a PDF', async ({ page }) => {
  await login(page)
  await nav(page).getByRole('link', { name: /^Proposals/ }).click()
  await page.getByRole('button', { name: 'New proposal' }).click()
  const modal = page.getByRole('dialog', { name: 'New proposal' })
  await modal.getByLabel('Title').fill('UI test proposal')
  await modal.getByRole('button', { name: 'Create draft' }).click()

  await expect(page.getByText(/NIV-\d{4}-\d{3}/).first()).toBeVisible()
  await page.getByRole('button', { name: 'Add line' }).click()
  await page.getByLabel('Line 1 description').fill('Landing page')
  await page.getByLabel('Line 1 price').fill('1250.50')
  await expect(page.getByText('Unsaved changes')).toBeVisible()
  await page.getByRole('button', { name: 'Save', exact: true }).click()
  await expect(page.getByText('Unsaved changes')).toHaveCount(0)
  await expect(page.getByText('€1,250.50').first()).toBeVisible()

  await page.getByRole('tab', { name: 'Preview' }).click()
  await expect(page.getByRole('heading', { name: 'UI test proposal', level: 1 })).toBeVisible()
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'PDF' }).click()])
  expect(download.suggestedFilename()).toMatch(/^NIV-\d{4}-\d{3}-ui-test-proposal\.pdf$/)
  const file = readFileSync(await download.path())
  expect(file.subarray(0, 5).toString()).toBe('%PDF-')

  const [docxDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'DOCX' }).click()])
  expect(docxDownload.suggestedFilename()).toMatch(/^NIV-\d{4}-\d{3}\.docx$/)
  expect(readFileSync(await docxDownload.path()).subarray(0, 2).toString()).toBe('PK')

  await page.getByRole('button', { name: 'Mark as sent' }).click()
  await expect(page.getByText('Sent', { exact: true }).first()).toBeVisible()
})

test('realistic Preventivo output and responsive preview retain the template structure', async ({ page }, testInfo) => {
  await login(page)
  const proposalId = await page.evaluate(async () => {
    const session = await fetch('/admin-api/auth.php?action=session').then(response => response.json())
    const csrf = session.data.csrfToken as string
    const today = new Date().toISOString().slice(0, 10)
    const response = await fetch('/admin-api/proposals.php?action=create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf },
      body: JSON.stringify({ proposal: {
        title: 'Piattaforma operativa Alba Energia', language: 'it', clientCode: 'AE', clientName: 'Giulia Bianchi', clientCompany: 'Alba Energia S.r.l.',
        clientSector: 'Energia rinnovabile', clientAddress: 'Via dell Industria 24, Milano', clientPhone: '+39 02 555 0188', clientEmail: 'giulia@alba-energia.example',
        date: today, validUntil: today, intro: 'Una piattaforma su misura per coordinare vendite, installazioni e assistenza sul territorio.',
        sections: [
          { title: 'Analisi e progettazione', note: 'Le attività includono il confronto con i referenti operativi.', items: [
            { title: 'Workshop operativo', description: 'Raccolta dei requisiti con direzione, vendite e assistenza tecnica.', quantity: 2, unit: 'day', unitPrice: 650 },
            { title: 'Architettura UX', description: 'Flussi completi, ruoli e prototipo responsive delle aree principali.', quantity: 1, unit: 'fixed', unitPrice: 1400 }
          ] },
          { title: 'Sviluppo piattaforma', note: 'Implementazione iterativa con revisioni settimanali.', items: [
            { title: 'Accessi, ruoli e dashboard', description: 'Sistema di accesso con ruoli distinti, indicatori operativi e viste personalizzate per ogni reparto.', quantity: 1, unit: 'fixed', unitPrice: 3200 },
            { title: 'Gestione commesse', description: 'Pipeline completa delle commesse con stati, scadenze, documenti e assegnazioni.', quantity: 1, unit: 'fixed', unitPrice: 2600 },
            { title: 'Reportistica', description: 'Report filtrabili ed esportazione dei dati principali.', quantity: 1, unit: 'fixed', unitPrice: 1200 }
          ] },
          { title: 'Lancio e assistenza', note: 'Il canone di assistenza è opzionale.', items: [
            { title: 'Migrazione e formazione', description: 'Importazione iniziale, verifica dei dati e due sessioni formative registrate per il team.', quantity: 1, unit: 'fixed', unitPrice: 1100 },
            { title: 'Assistenza continuativa', description: 'Monitoraggio, aggiornamenti e supporto prioritario.', quantity: 3, unit: 'month', unitPrice: 350, optional: true }
          ] }
        ],
        discount: { type: 'percent', value: 5 }, tax: { label: 'IVA', rate: 22 },
        milestones: [{ label: 'Acconto', percent: 40 }, { label: 'Consegna', percent: 60 }],
        acceptance: { place: 'Milano', date: today }, notes: 'Avvio previsto entro dieci giorni lavorativi dalla conferma.', terms: 'Validità subordinata alla disponibilità del team e al pagamento dell acconto.'
      } })
    })
    const result = await response.json()
    if (!response.ok) throw new Error(result.error?.message ?? 'Fixture creation failed')
    const id = result.data.proposal.id as string

    const canvas = document.createElement('canvas')
    canvas.width = 320
    canvas.height = 120
    const context = canvas.getContext('2d')!
    context.fillStyle = '#0f766e'
    context.fillRect(0, 0, 320, 120)
    context.fillStyle = '#ffffff'
    context.font = 'bold 48px sans-serif'
    context.fillText('ALBA', 82, 76)
    const blob = await new Promise<Blob>((resolve, reject) => canvas.toBlob(value => value ? resolve(value) : reject(new Error('Logo creation failed')), 'image/png'))
    const form = new FormData()
    form.append('id', id)
    form.append('logo', blob, 'alba-client-logo.png')
    const logoResponse = await fetch('/admin-api/proposals.php?action=upload-logo', { method: 'POST', headers: { 'X-CSRF-Token': csrf }, body: form })
    if (!logoResponse.ok) throw new Error('Fixture logo upload failed')
    return id
  })

  await page.goto(`/admin/#/proposals?proposal=${proposalId}`)
  await expect(page.getByText(/NIV-AE-\d{4}-\d{3}/).first()).toBeVisible()
  for (const width of [360, 390, 768, 1366, 1920]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `editor overflow at ${width}px`).toBe(true)
  }

  await page.getByRole('tab', { name: 'Preview' }).click()
  await expect(page.getByRole('heading', { name: 'Piattaforma operativa Alba Energia', level: 1 })).toBeVisible()
  for (const width of [360, 390, 768, 1366, 1920]) {
    await page.setViewportSize({ width, height: width < 768 ? 844 : 1000 })
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth), `preview overflow at ${width}px`).toBe(true)
  }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.screenshot({ path: testInfo.outputPath('preventivo-preview-mobile-dark.png'), fullPage: true })
  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await expect(page.locator('html')).toHaveClass(/light/)
  await page.setViewportSize({ width: 1366, height: 900 })
  await page.screenshot({ path: testInfo.outputPath('preventivo-preview-desktop-light.png'), fullPage: true })

  const docxPath = testInfo.outputPath('alba-energia-preventivo.docx')
  const pdfPath = testInfo.outputPath('alba-energia-preventivo.pdf')
  const [docxDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'DOCX' }).click()])
  await docxDownload.saveAs(docxPath)
  const [pdfDownload] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'PDF' }).click()])
  await pdfDownload.saveAs(pdfPath)

  const archive = await JSZip.loadAsync(readFileSync(docxPath))
  const documentXml = await archive.file('word/document.xml')!.async('text')
  expect(documentXml).toContain('Piattaforma operativa Alba Energia')
  expect(documentXml).toContain('Analisi e progettazione')
  expect(documentXml).toContain('Sviluppo piattaforma')
  expect(documentXml).toContain('Lancio e assistenza')
  expect(documentXml).toContain('Accessi, ruoli e dashboard')
  expect(documentXml).toContain('2 giorni')
  expect(documentXml).toContain('3 mesi')
  expect(documentXml).toContain('PIANO DEI PAGAMENTI')
  expect(documentXml).toContain('Firma del cliente')
  expect(Object.keys(archive.files).some(path => path.startsWith('word/media/'))).toBe(true)
  const pdf = readFileSync(pdfPath)
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
  expect(pdf.length).toBeGreaterThan(15_000)
})

test('overview shows the operations command center', async ({ page }) => {
  await login(page)
  for (const heading of ['Today', 'Business', 'Growth · last 7 days']) {
    await expect(page.getByRole('heading', { name: heading })).toBeVisible()
  }
  await expect(page.getByText('Proposals awaiting reply').first()).toBeVisible()
  await page.getByRole('button', { name: /New inquiries/ }).first().click()
  await expect(page.getByRole('heading', { name: 'Inbox', level: 1 })).toBeVisible()
})
