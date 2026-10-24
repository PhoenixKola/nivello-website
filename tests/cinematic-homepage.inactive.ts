// Retained for the dormant cinematic homepage; rename to .spec.ts when reactivating it.
import { expect, test } from '@playwright/test'
import { NEUTRAL_STRINGS, sceneCopy } from '../components/home-cinematic/engine/i18n'

// Software WebGL so the live homepage tests can run in headless CI.
test.use({ launchOptions: { args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] } })

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
  await launcher.getByRole('link', { name: 'Start this project' }).first().click()
  await expect(page).toHaveURL(/\/contact\/\?build=app&stage=redesign$/)
  await expect(page.locator('select[name="projectType"]')).toHaveValue('Custom web app / software')
  await expect(page.locator('input[name="projectBrief"]')).toHaveValue('Web app / software · Redesign')
})

test('featured work defaults to ProGreen and exposes both project surfaces', async ({ page }) => {
  await page.goto('/')
  const spotlight = page.getByRole('region', { name: 'Real projects, brought on stage.' })
  const projects = spotlight.locator('.cin-hotspot[data-cin-hotspot="work"]')

  await expect(projects).toHaveCount(6)
  await expect(projects.first()).toContainText('ProGreen')
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

for (const [path, cta, email] of [['/', 'Start a conversation', 'office@nivello.it'], ['/it/', 'Iniziamo a parlarne', 'office@nivello.it']]) {
  test(`homepage footer renders once with working links (${path})`, async ({ page }) => {
    await page.goto(path)
    await expect(page.locator('footer#site-footer')).toHaveCount(1)
    const footer = page.locator('footer#site-footer')
    await expect(footer.getByRole('link', { name: cta })).toHaveAttribute('href', /contact\/$/)
    await expect(footer.getByRole('link', { name: email })).toHaveAttribute('href', `mailto:${email}`)
    await expect(footer.getByRole('link', { name: /Privacy/ })).toBeVisible()
  })
}

for (const [path, stages] of [
  ['/', ['Every project starts with a conversation.', 'Design, layer by layer.', 'Code that becomes the product.', 'What we build becomes real.', 'Real projects, brought on stage.', 'What it is like to build with us.']],
  ['/it/', ['Ogni progetto inizia con una conversazione.', 'Il design, livello dopo livello.', 'Il codice che diventa prodotto.', 'Ciò che costruiamo diventa reale.', 'Progetti reali, portati in scena.', 'Com’è costruire con noi.']]
] as [string, string[]][]) {
  test(`homepage tells the full story in order (${path})`, async ({ page }) => {
    await page.goto(path)
    // textContent, not innerText: chapter overlays are visibility-hidden until the page settles into its static or live layout
    const headings = await page.locator('h2').evaluateAll(nodes => nodes.map(node => node.textContent ?? ''))
    const order = stages.map(text => headings.findIndex(item => item.trim() === text))
    expect(order.every(index => index >= 0)).toBe(true)
    expect(order).toEqual([...order].sort((a, b) => a - b))
    await expect(page.locator('footer#site-footer')).toHaveCount(1)
  })

  test(`homepage has no horizontal overflow on a phone (${path})`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto(path)
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
    expect(overflow).toBeLessThanOrEqual(1)
  })
}

// Live (WebGL) homepage checks: ?cin=snap renders the exact scroll position without the intro.
test.describe('live homepage chrome and reviews', () => {
  test.use({ reducedMotion: 'no-preference' })

  const gotoLive = async (page: import('@playwright/test').Page, path = '/') => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('nv_privacy_notice', '1')
      } catch {}
    })
    await page.goto(`${path}?cin=snap`)
    await page.waitForFunction(() => document.querySelector('[data-cin-root]')?.getAttribute('data-mode') !== 'pending', undefined, { timeout: 60000 })
    test.skip((await page.locator('[data-cin-root]').getAttribute('data-mode')) === 'static', 'WebGL unavailable in this environment')
  }
  const scrollToChapter = (page: import('@playwright/test').Page, u: number) =>
    page.evaluate(target => {
      const kids = Array.from(document.querySelector('[data-cin-spacers]')!.children) as HTMLElement[]
      const c = Math.min(kids.length - 1, Math.floor(target))
      window.scrollTo(0, window.scrollY + kids[c].getBoundingClientRect().top + kids[c].offsetHeight * (target - c))
    }, u)

  const overlaps = (a: DOMRect, b: DOMRect) => a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom

  for (const [width, height] of [[360, 800], [390, 844], [430, 932], [768, 1024], [844, 390]]) {
    test(`top chrome never collides at ${width}x${height}`, async ({ page }) => {
      test.setTimeout(90000)
      await page.setViewportSize({ width, height })
      await gotoLive(page)
      for (const u of [2.5, 7.3, 8.9]) {
        await scrollToChapter(page, u)
        await page.waitForTimeout(800)
        const rects = await page.evaluate(() => {
          const get = (selector: string) => {
            const r = document.querySelector(selector)!.getBoundingClientRect()
            return { left: r.left, right: r.right, top: r.top, bottom: r.bottom, width: r.width, height: r.height }
          }
          return { logo: get('.cin-chrome__logo'), stage: get('.cin-stagebar'), menu: get('.cin-chrome__menu'), toc: get('.cin-chrome__toc'), docW: document.documentElement.scrollWidth }
        })
        const box = (r: typeof rects.logo) => r as unknown as DOMRect
        expect(overlaps(box(rects.logo), box(rects.stage))).toBe(false)
        expect(overlaps(box(rects.stage), box(rects.menu))).toBe(false)
        expect(overlaps(box(rects.stage), box(rects.toc))).toBe(false)
        expect(overlaps(box(rects.menu), box(rects.toc))).toBe(false)
        expect(rects.menu.width).toBeGreaterThanOrEqual(44)
        expect(rects.toc.height).toBeGreaterThanOrEqual(44)
        expect(rects.docW).toBeLessThanOrEqual(width + 1)
      }
    })
  }

  test('chapter contents opens, closes on outside tap and on Escape', async ({ page }) => {
    test.setTimeout(90000)
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoLive(page)
    const toc = page.locator('.cin-toc')
    await page.locator('.cin-chrome__toc').click()
    await expect(toc).toHaveAttribute('data-open', 'true')
    await page.mouse.click(200, 700)
    await expect(toc).toHaveAttribute('data-open', 'false')
    await page.locator('.cin-chrome__toc').click()
    await expect(toc).toHaveAttribute('data-open', 'true')
    await page.keyboard.press('Escape')
    await expect(toc).toHaveAttribute('data-open', 'false')
  })

  test('mobile reviews: every review is reachable, readable and focus returns on close', async ({ page }) => {
    test.setTimeout(120000)
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoLive(page)
    await scrollToChapter(page, 7.3)
    await page.waitForTimeout(800)
    const tabs = page.getByRole('tab')
    const count = await tabs.count()
    expect(count).toBeGreaterThanOrEqual(6)
    for (let i = 0; i < count; i += 1) {
      const tab = tabs.nth(i)
      await tab.scrollIntoViewIfNeeded()
      const box = (await tab.boundingBox())!
      expect(box.height).toBeGreaterThanOrEqual(44)
      expect(box.width).toBeGreaterThanOrEqual(100)
      await tab.click()
      const card = page.locator('.cin-review__card')
      await expect(card).toBeVisible()
      await expect(card.locator('blockquote')).not.toBeEmpty()
      await expect(card.locator('a.cin-link')).toHaveAttribute('href', /work\/|projects\/|\//)
      const cardBox = (await card.boundingBox())!
      expect(cardBox.x).toBeGreaterThanOrEqual(0)
      expect(cardBox.x + cardBox.width).toBeLessThanOrEqual(391)
    }
    await page.keyboard.press('Escape')
    await expect(page.locator('.cin-review__card')).toHaveCount(0)
    await expect(page.locator('[role="tab"]:focus')).toHaveCount(1)
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(391)
  })

  test('active chapter text is fully opaque and the chapter state follows the scroll, forward and back', async ({ page }) => {
    test.setTimeout(120000)
    await page.setViewportSize({ width: 390, height: 844 })
    await gotoLive(page)
    const state = () =>
      page.evaluate(() => {
        const active = Array.from(document.querySelectorAll<HTMLElement>('[data-cin-overlay]')).filter(el => getComputedStyle(el).visibility !== 'hidden')
        return { index: active.map(el => el.dataset.cinOverlay), opacity: active.map(el => Number(getComputedStyle(el).opacity)), label: document.querySelector('.cin-stagebar')?.textContent }
      })
    for (const [u, chapter] of [[2.5, '2'], [4.5, '4'], [7.3, '7'], [4.5, '4'], [2.5, '2']] as [number, string][]) {
      await scrollToChapter(page, u)
      // software WebGL renders slowly, so wait for the frame that reflects this scroll position
      await expect.poll(async () => (await state()).index, { timeout: 15000 }).toEqual([chapter])
      await expect.poll(async () => (await state()).opacity[0], { timeout: 15000 }).toBeGreaterThan(0.99)
    }
  })
})


// Static (reduced motion) homepage: every project stays reachable as a plain list, with its information shown.
test('static homepage lists every project and shows its details', async ({ page }) => {
  await page.goto('/')
  const spots = page.locator('.cin-hotspot[data-cin-hotspot="work"]')
  await expect(spots).toHaveCount(6)
  await spots.nth(1).click()
  await expect(page.locator('.cin-work-info h3')).not.toBeEmpty()
  await expect(page.locator('footer#site-footer')).toHaveCount(1)
})

test.describe('live scroll rail, project cylinder and finale', () => {
  test.use({ reducedMotion: 'no-preference' })

  const open = async (page: import('@playwright/test').Page, query: string) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('nv_privacy_notice', '1')
      } catch {}
    })
    await page.goto(`/?cin=snap${query}`)
    await page.waitForFunction(() => document.querySelector('[data-cin-root]')?.getAttribute('data-mode') !== 'pending', undefined, { timeout: 60000 })
    test.skip((await page.locator('[data-cin-root]').getAttribute('data-mode')) === 'static', 'WebGL unavailable in this environment')
    await page.waitForTimeout(2500)
  }
  const position = (page: import('@playwright/test').Page) =>
    page.evaluate(() => {
      const kids = Array.from(document.querySelector('[data-cin-spacers]')!.children) as HTMLElement[]
      const tops = kids.map(k => window.scrollY + k.getBoundingClientRect().top)
      let c = 0
      while (c < kids.length - 1 && window.scrollY >= tops[c + 1]) c += 1
      const last = c === kids.length - 1
      const length = last ? Math.max(1, kids[c].offsetHeight - window.innerHeight) : kids[c].offsetHeight
      return Math.round((c + Math.min(1, (window.scrollY - tops[c]) / length)) * 100) / 100
    })
  // One trackpad-style fling: many wheel events, far more distance than the gap between two stops.
  const fling = (page: import('@playwright/test').Page, dy = 140) =>
    page.evaluate(async delta => {
      for (let i = 0; i < 14; i += 1) {
        document.body.dispatchEvent(new WheelEvent('wheel', { deltaY: delta, bubbles: true, cancelable: true }))
        await new Promise(resolve => setTimeout(resolve, 16))
      }
    }, dy)
  const settleOn = async (page: import('@playwright/test').Page, target: number) => {
    await expect.poll(() => position(page), { timeout: 20000 }).toBeGreaterThan(target - 0.03)
  }

  test('one gesture moves exactly one stop, forward and back', async ({ page }) => {
    test.setTimeout(180000)
    await open(page, '&guide=1')
    for (const stop of [1.55, 2.17, 2.5]) {
      await fling(page)
      await page.waitForTimeout(1800)
      await settleOn(page, stop)
      expect(Math.abs((await position(page)) - stop)).toBeLessThan(0.03)
    }
    await fling(page, -140)
    await page.waitForTimeout(1800)
    await expect.poll(() => position(page), { timeout: 20000 }).toBeLessThan(2.2)
    expect(Math.abs((await position(page)) - 2.17)).toBeLessThan(0.03)
  })

  test('opening a project locks the rail until Back, then the journey continues', async ({ page }) => {
    test.setTimeout(240000)
    await open(page, '&guide=1')
    for (let i = 0; i < 40 && (await position(page)) < 6.55; i += 1) {
      await fling(page)
      await page.waitForTimeout(1500)
    }
    await expect(page.locator('#cinematic-work')).toHaveAttribute('data-chamber', 'true')
    const spot = page.locator('[data-cin-hotspot="work"][data-show="true"]').first()
    await expect(spot).toBeVisible({ timeout: 20000 })
    const box = (await spot.boundingBox())!
    await page.mouse.click(box.x + box.width / 2, box.y + box.height / 2)
    await expect(page.locator('#cinematic-work')).toHaveAttribute('data-detail', 'true')
    const before = await page.evaluate(() => window.scrollY)
    await fling(page)
    await page.keyboard.press('PageDown')
    await page.waitForTimeout(1200)
    expect(await page.evaluate(() => window.scrollY)).toBe(before)
    await page.locator('.cin-back').click()
    await expect(page.locator('#cinematic-work')).toHaveAttribute('data-detail', 'false')
    await fling(page)
    await expect.poll(() => position(page), { timeout: 20000 }).toBeGreaterThan(7.1)
  })

  test('footer starts hidden and can be shown and hidden again on the summit', async ({ page }) => {
    test.setTimeout(120000)
    await open(page, '')
    await page.evaluate(() => {
      const kids = Array.from(document.querySelector('[data-cin-spacers]')!.children) as HTMLElement[]
      const last = kids[kids.length - 1]
      window.scrollTo(0, window.scrollY + last.getBoundingClientRect().top + Math.max(1, last.offsetHeight - window.innerHeight) * 0.9)
    })
    const toggle = page.locator('.cin-foot__toggle')
    await expect(toggle).toBeVisible({ timeout: 20000 })
    await expect(page.locator('footer#site-footer')).toHaveAttribute('data-hidden', 'true')
    await expect(toggle).toHaveText(/Show footer/)
    // directly under the Menu control, on the same right edge
    const menu = (await page.locator('.cin-chrome__menu').boundingBox())!
    const button = (await toggle.boundingBox())!
    expect(button.y).toBeGreaterThan(menu.y + menu.height)
    expect(Math.abs(button.x + button.width - (menu.x + menu.width))).toBeLessThan(6)
    await toggle.click()
    await expect(page.locator('footer#site-footer')).toHaveAttribute('data-hidden', 'false')
    await expect(toggle).toHaveText(/Hide footer/)
    await toggle.click()
    await expect(page.locator('footer#site-footer')).toHaveAttribute('data-hidden', 'true')
  })
})


// ── EN / IT: words painted into the 3D world ────────────────────────────────────────────────────────────────────

const flattenCopy = (value: unknown, path = ''): [string, string][] => {
  if (typeof value === 'string') return [[path, value]]
  if (typeof value === 'function') return [[path, (value as (n: number) => string)(1)]]
  if (Array.isArray(value)) return value.flatMap((item, index) => flattenCopy(item, `${path}[${index}]`))
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => flattenCopy(item, path ? `${path}.${key}` : key))
  return []
}

test('every in-world label has an Italian translation (or is deliberately language-neutral)', () => {
  const english = flattenCopy(sceneCopy.en)
  const italian = new Map(flattenCopy(sceneCopy.it))
  expect(english.length).toBeGreaterThan(30)
  for (const [path, en] of english) {
    const it = italian.get(path)
    expect(it, `missing Italian for ${path}`).toBeTruthy()
    if (/[A-Za-z]{3,}/.test(en) && !NEUTRAL_STRINGS.has(en)) expect(it, `${path} is still English`).not.toBe(en)
    expect(`${en} ${it}`).not.toMatch(/lorem|todo|placeholder/i)
  }
})

test.describe('labels painted into the live world follow the page locale', () => {
  test.use({ reducedMotion: 'no-preference' })

  const labelsAt = async (page: import('@playwright/test').Page, path: string, stops: number[]) => {
    await page.addInitScript(() => {
      try {
        localStorage.setItem('nv_privacy_notice', '1')
      } catch {}
    })
    await page.goto(`${path}?cin=snap`)
    await page.waitForFunction(() => document.querySelector('[data-cin-root]')?.getAttribute('data-mode') !== 'pending', undefined, { timeout: 60000 })
    test.skip((await page.locator('[data-cin-root]').getAttribute('data-mode')) === 'static', 'WebGL unavailable in this environment')
    for (const stop of stops) {
      await page.evaluate(target => {
        const kids = Array.from(document.querySelector('[data-cin-spacers]')!.children) as HTMLElement[]
        const c = Math.min(kids.length - 1, Math.floor(target))
        window.scrollTo(0, window.scrollY + kids[c].getBoundingClientRect().top + kids[c].offsetHeight * (target - c))
      }, stop)
      await page.waitForTimeout(2500)
    }
    return page.evaluate(() => Array.from((window as unknown as { __cinLabels: Set<string> }).__cinLabels))
  }

  test('Italian page paints Italian words on the monitors, plaques and signs', async ({ page }) => {
    test.setTimeout(180000)
    const labels = await labelsAt(page, '/it/', [2.5, 3.75, 4.75])
    for (const expected of ['Cliente', 'Responsabile prodotto', 'OBIETTIVI', 'Servizi', 'Chi siamo', 'Siti web che', 'lavorano per te.', 'Iniziamo', 'architettura  ·  Backend', 'PROGETTI', 'RECENSIONI', 'DICONO DI NOI']) {
      expect(labels, `missing "${expected}"`).toContain(expected)
    }
    for (const forbidden of ['Client', 'Product owner', 'GOALS', 'Services', 'About', 'Websites that', 'work for you.', 'Get started', 'architecture  ·  Backend', 'PROJECTS', 'CLIENT FEEDBACK']) {
      expect(labels, `English "${forbidden}" painted on the Italian page`).not.toContain(forbidden)
    }
  })

  test('English page paints English words', async ({ page }) => {
    test.setTimeout(180000)
    const labels = await labelsAt(page, '/', [2.5, 3.75, 4.75])
    for (const expected of ['Client', 'Product owner', 'GOALS', 'Services', 'Websites that', 'Get started', 'architecture  ·  Backend', 'PROJECTS', 'REVIEWS', 'CLIENT FEEDBACK']) {
      expect(labels, `missing "${expected}"`).toContain(expected)
    }
    expect(labels).not.toContain('Cliente')
    expect(labels).not.toContain('PROGETTI')
  })

  test('switching the locale repaints the same textures in place', async ({ page }) => {
    test.setTimeout(180000)
    await labelsAt(page, '/', [2.5])
    const after = await page.evaluate(() => {
      const w = window as unknown as { __cinLabels: Set<string>; __cin: { setLocale(locale: 'en' | 'it', data: { reviews: never[] }): void } }
      w.__cinLabels.clear()
      w.__cin.setLocale('it', { reviews: [] })
      return Array.from(w.__cinLabels)
    })
    expect(after).toContain('Cliente')
    expect(after).toContain('PROGETTI')
    expect(after).toContain('Siti web che')
    expect(after).not.toContain('Client')
    expect(after).not.toContain('PROJECTS')
  })
})
