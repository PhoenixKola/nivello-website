// Local full-stack harness for the admin (Playwright "admin" project, or manual use):
//   mock Google Maps scraper  -> 127.0.0.1:8191
//   mock GitHub Actions API   -> 127.0.0.1:8192 (spawns scripts/lead-discovery-runner.mjs per dispatch)
//   PHP built-in server       -> 127.0.0.1:4174 serving ./out (run `npm run build` first)
// Uses a fresh data directory and a random per-run callback secret; nothing touches real GitHub.
import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve('.admin-test')
const dataDir = resolve(root, 'data')
rmSync(root, { recursive: true, force: true })
mkdirSync(dataDir, { recursive: true })

const secret = randomBytes(32).toString('hex')
const token = 'mock-token-' + randomBytes(8).toString('hex')
const ports = { php: 4174, scraper: 8191, github: 8192 }
// A fresh access code per run: nothing in the repository knows it.
const accessCode = 'test-' + randomBytes(9).toString('hex')
writeFileSync(resolve(root, 'env.json'), JSON.stringify({ secret, token, dataDir, ports, accessCode }))

const children = []
function start(name, command, args, env) {
  const child = spawn(command, args, { env: { ...process.env, ...env }, stdio: ['ignore', 'inherit', 'inherit'] })
  child.on('exit', code => {
    if (!shuttingDown) {
      console.error(`[admin-stack] ${name} exited (${code})`)
      shutdown(1)
    }
  })
  children.push(child)
}

let shuttingDown = false
function shutdown(code = 0) {
  shuttingDown = true
  for (const child of children) child.kill()
  process.exit(code)
}
process.on('SIGINT', () => shutdown())
process.on('SIGTERM', () => shutdown())

start('scraper', process.execPath, ['scripts/mock-google-maps-scraper.mjs'], { PORT: String(ports.scraper), MOCK_JOB_SECONDS: '1' })
start('github', process.execPath, ['scripts/mock-github-actions.mjs'], {
  PORT: String(ports.github),
  MOCK_GITHUB_TOKEN: token,
  NIVELLO_ADMIN_CALLBACK_SECRET: secret,
  SCRAPER_URL: `http://127.0.0.1:${ports.scraper}`,
  RUNNER_TIME_SCALE: '0.02'
})
start('php', 'php', ['-S', `127.0.0.1:${ports.php}`, '-t', 'out'], {
  NIVELLO_ADMIN_DATA_DIR: dataDir,
  NIVELLO_ADMIN_ACCESS_CODE: accessCode,
  NIVELLO_GITHUB_API_BASE: `http://127.0.0.1:${ports.github}`,
  NIVELLO_GITHUB_TOKEN: token,
  NIVELLO_ADMIN_CALLBACK_SECRET: secret,
  NIVELLO_ADMIN_PUBLIC_BASE_URL: `http://127.0.0.1:${ports.php}`,
  NIVELLO_ALLOW_HTTP_CALLBACK: '1',
  NIVELLO_ENRICH_ALLOW_PRIVATE: '1',
  NIVELLO_TEST_TIME_SCALE: '0.02',
  PHP_CLI_SERVER_WORKERS: '4'
})
console.log(`[admin-stack] http://127.0.0.1:${ports.php}/admin/`)
