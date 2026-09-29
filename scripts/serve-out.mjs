// Minimal static server for the exported site, mirroring the production Apache setup
// (directory index.html, 404.html fallback). Used by the Playwright smoke tests.
import { createServer } from 'node:http'
import { readFile, stat } from 'node:fs/promises'
import { extname, join, normalize, resolve } from 'node:path'

const root = resolve('out')
const port = Number(process.env.PORT || 4173)
const types = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.webmanifest': 'application/manifest+json'
}

async function resolveFile(pathname) {
  const target = normalize(join(root, decodeURIComponent(pathname)))
  if (!target.startsWith(root)) return null
  try {
    const info = await stat(target)
    return info.isDirectory() ? join(target, 'index.html') : target
  } catch {
    return null
  }
}

createServer(async (req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost')
  const file = await resolveFile(pathname)
  try {
    if (!file) throw new Error('not found')
    const body = await readFile(file)
    res.writeHead(200, { 'Content-Type': types[extname(file)] || 'application/octet-stream' })
    res.end(body)
  } catch {
    res.writeHead(404, { 'Content-Type': types['.html'] })
    res.end(await readFile(join(root, '404.html')).catch(() => 'Not found'))
  }
}).listen(port, () => console.log(`Serving ${root} on http://localhost:${port}`))
