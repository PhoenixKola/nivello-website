import { spawnSync } from 'node:child_process'
import { expect, test } from '@playwright/test'

test('PHP storage, session, SSRF, plan and score checks', () => {
  const run = spawnSync('php', ['tests/admin/php/unit.php'], { encoding: 'utf8' })
  const output = run.stdout.slice(run.stdout.indexOf('{'))
  const report = JSON.parse(output)
  expect(report.failed, JSON.stringify(report.failed, null, 2)).toEqual([])
  expect(report.total).toBeGreaterThanOrEqual(19)
})
