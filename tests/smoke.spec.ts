import { expect, test } from '@playwright/test'

test('EN homepage renders', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page).toHaveTitle('Nivello')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Modern web development')
  await expect(page.locator('main')).toHaveCount(1)
})

test('IT homepage renders', async ({ page }) => {
  await page.goto('/it/')
  await expect(page.locator('html')).toHaveAttribute('lang', 'it')
  await expect(page.getByRole('heading', { level: 1 })).toContainText('Sviluppo web moderno')
})

test('main navigation reaches the work page', async ({ page }) => {
  await page.goto('/')
  const nav = page.getByRole('navigation', { name: 'Main navigation' }).first()
  await nav.getByRole('link', { name: 'Our Work' }).click()
  await expect(page).toHaveURL(/\/work\/$/)
  await expect(page).toHaveTitle('Work | Nivello')
  await expect(nav.getByRole('link', { name: 'Our Work' })).toHaveAttribute('aria-current', 'page')
})

test('theme toggle switches the theme', async ({ page }) => {
  await page.goto('/')
  const html = page.locator('html')
  await expect(html).toHaveClass(/\bdark\b/)
  await page.getByRole('button', { name: 'Switch to light mode' }).click()
  await expect(html).not.toHaveClass(/\bdark\b/)
  await page.getByRole('button', { name: 'Switch to dark mode' }).click()
  await expect(html).toHaveClass(/\bdark\b/)
})

test('project launcher carries context into the contact form', async ({ page }) => {
  await page.goto('/')
  const launcher = page.getByRole('region', { name: 'Two quick answers, and your project is already taking shape.' })
  await launcher.getByRole('button', { name: /^Web app/ }).click()
  await launcher.getByRole('button', { name: /^Redesign/ }).click()
  await launcher.getByRole('link', { name: 'Start this project' }).click()
  await expect(page).toHaveURL(/\/contact\/\?build=app&stage=redesign$/)
  await expect(page.locator('select[name="projectType"]')).toHaveValue('Custom web app / software')
  await expect(page.locator('input[name="projectBrief"]')).toHaveValue('Web app / software · Redesign')
})

test('featured work defaults to ProGreen and exposes both project surfaces', async ({ page }) => {
  await page.goto('/')
  const spotlight = page.getByRole('region', { name: 'Real projects, brought on stage.' })
  const projectTabs = spotlight.getByRole('tab')

  await expect(projectTabs.first()).toHaveText('ProGreen')
  await expect(projectTabs.first()).toHaveAttribute('aria-selected', 'true')
  await expect(spotlight.getByText('01 / 06', { exact: true })).toBeVisible()
  await expect(spotlight.getByText('Public website', { exact: true })).toBeVisible()
  await expect(spotlight.getByText('Site-visit request as the primary conversion', { exact: true })).toBeVisible()

  const appMode = spotlight.getByRole('button', { name: 'Web app', exact: true })
  await appMode.focus()
  await appMode.press('Enter')
  await expect(appMode).toHaveAttribute('aria-pressed', 'true')
  await expect(spotlight.getByText('Operations web app', { exact: true })).toBeVisible()
  await expect(spotlight.getByText('Daily reports and progress updates', { exact: true })).toBeVisible()
  await expect(spotlight.getByRole('img', { name: 'Anonymised preview of the ProGreen web app' })).toBeVisible()
})

test('contact page loads without launcher context', async ({ page }) => {
  await page.goto('/contact/')
  await expect(page.getByRole('form', { name: 'Project enquiry form' })).toBeVisible()
  await expect(page.locator('select[name="projectType"]')).toHaveValue('')
  await expect(page.locator('input[name="projectBrief"]')).toHaveCount(0)
})

test('case study loads', async ({ page }) => {
  await page.goto('/work/progreen/')
  await expect(page).toHaveTitle('ProGreen case study | Nivello')
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
})

for (const path of ['/', '/it/', '/work/', '/contact/']) {
  test(`no horizontal overflow on mobile: ${path}`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(path)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(0)
  })
}

test('language switch links point to the matching page in the other language', async ({ page }) => {
  await page.goto('/it/work/progreen/')
  await expect(page.locator('a[href*="/it/it/"]')).toHaveCount(0)
  await expect(page.locator('header a[href="/work/progreen/"]').first()).toBeAttached()
  await page.goto('/services/development/')
  await expect(page.locator('header a[href="/it/services/development/"]').first()).toBeAttached()
  await page.goto('/about/')
  await expect(page.locator('header a[href="/it/chi-siamo/"]').first()).toBeAttached()
})

test('the 404 page offers the other language home, not a missing page', async ({ page }) => {
  const response = await page.goto('/this-page-does-not-exist/')
  expect(response?.status()).toBe(404)
  await expect(page.locator('header a[href="/it/"]').first()).toBeAttached()
  await expect(page.locator('a[href*="_not-found"]')).toHaveCount(0)
})
