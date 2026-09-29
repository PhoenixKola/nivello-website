import { readFileSync } from 'node:fs'
import { expect, request, test, type Page } from '@playwright/test'
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

  const board = page.getByRole('region', { name: 'Project pipeline board' })
  const lead = board.getByRole('region', { name: /^Lead \(/ })
  await expect(lead.getByText('UI test project')).toBeVisible()
  await lead.getByRole('button', { name: 'Move UI test project to another stage' }).click()
  await page.getByRole('menuitem', { name: 'Move to Design' }).click()
  await expect(board.getByRole('region', { name: /^Design \(/ }).getByText('UI test project')).toBeVisible()
})

test('projects on mobile use a stage selector instead of the board', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page)
  await page.goto('/admin/#/projects')
  await expect(page.getByRole('region', { name: 'Project pipeline board' })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Stage/ }).or(page.getByLabel('Stage')).first()).toBeVisible()
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

  await page.getByRole('button', { name: 'Mark as sent' }).click()
  await expect(page.getByText('Sent', { exact: true }).first()).toBeVisible()
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
