import { expect, test, type Page } from '@playwright/test'
import { accessCode, resetMocks, totp } from './helpers'

test.describe.configure({ mode: 'serial', timeout: 120_000 })

async function login(page: Page) {
  await page.goto('/admin/')
  await page.getByLabel('Access code', { exact: true }).fill(accessCode())
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.locator('header h1')).toBeVisible()
}

test.beforeAll(async () => {
  await resetMocks()
})

test('login: wrong code shows an error, the right code opens the workspace without the public site chrome', async ({ page }) => {
  await page.goto('/admin/')
  await expect(page.getByText('Internal workspace')).toBeVisible()
  await page.getByLabel('Access code', { exact: true }).fill('definitely-wrong')
  await page.getByRole('button', { name: 'Show access code' }).click()
  await expect(page.getByLabel('Access code', { exact: true })).toHaveAttribute('type', 'text')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('alert').filter({ hasText: 'not correct' })).toBeVisible()

  await page.getByLabel('Access code', { exact: true }).fill(accessCode())
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Overview', level: 1 })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Our Work' })).toHaveCount(0)
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/)
})

test('the access code is not in the page or its JavaScript', async ({ page, request }) => {
  await page.goto('/admin/')
  const html = await page.content()
  expect(html).not.toContain(accessCode())
  const scripts = await page.locator('script[src]').evaluateAll(els => els.map(el => (el as HTMLScriptElement).src))
  for (const src of scripts) expect(await (await request.get(src)).text()).not.toContain(accessCode())
})

test('authenticator setup, second-step login and recovery work from the UI', async ({ page }) => {
  await login(page)
  await page.goto('/admin/#/settings')
  await expect(page.getByText('Two-factor authentication', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Set up' }).click()

  let dialog = page.getByRole('dialog')
  await dialog.getByLabel('Access code', { exact: true }).fill(accessCode())
  await dialog.getByRole('button', { name: 'Continue' }).click()
  await expect(dialog.getByRole('img', { name: 'Authenticator setup QR code' })).toBeVisible()
  const secret = (await dialog.locator('code').textContent())!.trim()
  await dialog.getByLabel('Six-digit authenticator code').fill(totp(secret))
  await dialog.getByRole('button', { name: 'Verify and enable' }).click()

  await expect(dialog.getByRole('heading', { name: 'Save your recovery codes' })).toBeVisible()
  const recoveryCodes = (await dialog.locator('code').allTextContents()).map(code => code.trim())
  expect(recoveryCodes).toHaveLength(10)
  await dialog.getByRole('button', { name: 'I saved these codes' }).click()
  await expect(page.getByText('Authenticator verification is enabled')).toBeVisible()

  await page.getByRole('button', { name: 'Log out' }).click()
  await page.getByLabel('Access code', { exact: true }).fill(accessCode())
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('heading', { name: 'Verify it’s you' })).toBeVisible()
  await page.getByLabel('Authenticator or recovery code').fill(recoveryCodes[0])
  await page.getByRole('button', { name: 'Verify and continue' }).click()
  await expect(page.getByText('Two-factor authentication', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: 'Disable' }).click()
  dialog = page.getByRole('dialog')
  await dialog.getByLabel('Access code', { exact: true }).fill(accessCode())
  await dialog.getByLabel('Authenticator or recovery code').fill(recoveryCodes[1])
  await dialog.getByRole('button', { name: 'Disable MFA' }).click()
  await expect(page.getByText('Only the access code is required')).toBeVisible()
})

test('discovery from the UI completes and "View leads" opens the exact batch filter', async ({ page }) => {
  await login(page)
  await page.getByRole('navigation', { name: 'Admin' }).getByRole('link', { name: 'Lead Forge' }).click()
  await expect(page.getByRole('navigation', { name: 'Lead Forge' }).getByRole('link', { name: 'Leads', exact: true })).toHaveAttribute('aria-current', 'page')
  await page.getByRole('navigation', { name: 'Lead Forge' }).getByRole('link', { name: 'Find leads' }).click()
  await page.getByLabel('Country').fill('Albania')
  await page.getByLabel('City').fill('Tirana')
  await page.getByLabel('Business category').fill('yoga studio')
  await page.getByRole('spinbutton', { name: 'Qualified leads wanted' }).fill('3')
  await page.getByRole('spinbutton', { name: 'Qualified leads wanted' }).press('Enter')

  const noWebsite = page.getByRole('switch', { name: 'Only businesses without a website' })
  await noWebsite.click()
  await expect(page.getByRole('switch', { name: 'Extract email from website' })).toBeEnabled()
  await noWebsite.click()
  await expect(page.getByRole('switch', { name: 'Extract email from website' })).toBeDisabled()

  await page.getByRole('button', { name: /^Search languages/ }).click()
  await page.getByRole('option', { name: /Italian/ }).click()
  await page.keyboard.press('Escape')

  await page.getByRole('button', { name: 'Start discovery' }).click()
  const card = page.getByRole('group', { name: 'Discovery yoga studio · Tirana' }).first()
  await expect(card.getByText('Complete')).toBeVisible({ timeout: 60_000 })
  await expect(card.getByText(/3\s*\/ 3/)).toBeVisible()
  await card.getByRole('button', { name: 'View leads' }).click()
  await expect(page).toHaveURL(/#\/leads\?batch=batch_[a-f0-9]{16}/)
  await expect(page.getByText(/^Batch: yoga studio · Tirana · /)).toBeVisible()
  await expect(page.getByText(/^3\s+leads\s+match/)).toBeVisible()
})

test('lead drawer saves in place; date picker accepts typed hours and minutes', async ({ page }) => {
  await login(page)
  await page.goto('/admin/#/leads')
  const firstCompany = page.locator('table tbody tr').first().locator('td').nth(1).getByRole('button')
  const name = (await firstCompany.textContent())!.trim()
  await firstCompany.click()
  const drawer = page.getByRole('dialog', { name: 'Lead details' })
  await expect(drawer.getByRole('heading', { name })).toBeVisible()

  await drawer.getByRole('button', { name: /^Status:/ }).click()
  await page.getByRole('option', { name: 'Interested' }).click()
  await expect(drawer.getByText('Saved')).toBeVisible()
  await expect(drawer).toBeVisible()
  await expect(drawer.getByRole('button', { name: 'Status: Interested' })).toBeVisible()

  await drawer.getByRole('button', { name: /^Follow-up:/ }).click()
  const picker = page.getByRole('dialog', { name: 'Follow-up' })
  const hour = picker.getByRole('spinbutton', { name: 'Hour' })
  const minute = picker.getByRole('spinbutton', { name: 'Minute' })
  await hour.click()
  await page.keyboard.type('23')
  await expect(hour).toHaveValue('23')
  // A full "23" must not block typing: focusing again and typing replaces it.
  await hour.click()
  await page.keyboard.type('09')
  await expect(hour).toHaveValue('09')
  await expect(minute).toBeFocused()
  await page.keyboard.type('7')
  await expect(minute).toHaveValue('07')
  await minute.press('ArrowUp')
  await expect(minute).toHaveValue('08')
  // Out-of-range input clamps: "27" becomes 23.
  await hour.click()
  await page.keyboard.type('27')
  await expect(hour).toHaveValue('23')
  await hour.click()
  await page.keyboard.type('09')
  await picker.getByRole('button', { name: 'Done' }).click()
  await expect(drawer.getByRole('button', { name: /^Follow-up: .*09:08/ })).toBeVisible()
  await expect(drawer.getByText('Saved')).toBeVisible()

  await drawer.getByRole('textbox', { name: 'New note' }).fill('Called, asked for pricing.')
  await drawer.getByRole('button', { name: 'Add note' }).click()
  await expect(drawer.getByText('Called, asked for pricing.')).toBeVisible()
  await expect(drawer.getByText('Note added')).toBeVisible()

  await page.keyboard.press('Escape')
  await expect(drawer).toBeHidden()
})

test('bulk delete asks for confirmation; saved views persist', async ({ page }) => {
  await login(page)
  await page.goto('/admin/#/leads')
  await expect(page.locator('table tbody tr').first()).toBeVisible()
  const countText = async () => Number((await page.getByText(/^\d[\d,]*\s+leads?$/).first().textContent())!.replace(/\D/g, ''))
  const before = await countText()
  const boxes = page.locator('table tbody tr input[type="checkbox"]')
  await boxes.nth(0).check()
  await boxes.nth(1).check()
  const bar = page.getByRole('region', { name: 'Bulk actions' })
  await expect(bar.getByText('2 selected')).toBeVisible()
  await bar.getByRole('button', { name: 'Delete' }).click()
  const confirm = page.getByRole('dialog', { name: 'Delete 2 leads?' })
  await expect(confirm).toBeVisible()
  await confirm.getByRole('button', { name: 'Cancel' }).click()
  await expect(await countText()).toBe(before)
  await bar.getByRole('button', { name: 'Delete' }).click()
  await page.getByRole('dialog', { name: 'Delete 2 leads?' }).getByRole('button', { name: 'Delete 2 leads' }).click()
  await expect(page.getByText('Leads deleted')).toBeVisible()
  await expect.poll(countText).toBe(before - 2)

  await page.getByRole('button', { name: 'High priority' }).click()
  await page.getByRole('button', { name: 'Save view' }).click()
  await page.getByRole('dialog', { name: 'Save current filters as a view' }).getByLabel('View name').fill('Priority calls')
  await page.getByRole('dialog', { name: 'Save current filters as a view' }).getByRole('button', { name: 'Save view' }).click()
  await expect(page.getByRole('button', { name: 'Priority calls', exact: true, pressed: true })).toBeVisible()
  await page.reload()
  await expect(page.getByRole('button', { name: 'Priority calls', exact: true })).toBeVisible()
})

test('mobile: no horizontal overflow, drawer navigation works, logout returns to sign-in', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await login(page)
  for (const hash of ['#/dashboard', '#/leads', '#/find', '#/followups', '#/duplicates', '#/history', '#/analytics', '#/inbox', '#/projects', '#/proposals', '#/health', '#/settings']) {
    await page.goto(`/admin/${hash}`)
    await page.waitForTimeout(400)
    const { overflow, culprits } = await page.evaluate(() => {
      const vw = window.innerWidth
      const culprits: string[] = []
      for (const el of document.querySelectorAll('body *')) {
        const r = el.getBoundingClientRect()
        if (r.right <= vw + 1 || r.width === 0) continue
        let parent = el.parentElement
        let clipped = false
        while (parent) {
          if (/(auto|scroll|hidden)/.test(getComputedStyle(parent).overflowX)) {
            clipped = true
            break
          }
          parent = parent.parentElement
        }
        if (!clipped) culprits.push(`${el.tagName} ${String(el.className).slice(0, 80)} "${(el.textContent ?? '').trim().slice(0, 40)}"`)
      }
      return { overflow: document.documentElement.scrollWidth - vw, culprits: culprits.slice(0, 6) }
    })
    expect(overflow, `${hash}: ${culprits.join(' | ')}`).toBeLessThanOrEqual(0)
  }
  await page.getByRole('button', { name: 'Open navigation' }).click()
  const nav = page.getByRole('dialog', { name: 'Navigation' })
  await nav.getByRole('link', { name: 'Lead Forge' }).click()
  await expect(nav).toHaveCount(0)
  await page.getByRole('navigation', { name: 'Lead Forge' }).getByRole('link', { name: 'Follow-ups' }).click()
  await expect(page.getByRole('heading', { name: 'Follow-ups', level: 1 })).toBeVisible()

  await page.locator('header button[aria-haspopup="menu"]').click()
  await page.getByRole('menuitem', { name: 'Log out' }).click()
  await expect(page.getByRole('heading', { name: 'Sign in to Nivello Admin' })).toBeVisible()
  await expect(page.getByText('You have been signed out.')).toBeVisible()
})
