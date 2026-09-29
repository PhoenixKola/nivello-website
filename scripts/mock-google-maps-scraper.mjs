// Deterministic stand-in for gosom/google-maps-scraper's web API, for local development and tests.
// Synthetic data only. Behaviour can be switched at runtime:
//   POST /__mock/mode {"mode": "normal" | "fail" | "stuck" | "stale" | "reject" | "vanish" | "offline", "jobSeconds": 2}
//   GET  /__mock/state   -> jobs, deleted ids, mode
//
// Usage: node scripts/mock-google-maps-scraper.mjs   (PORT env, default 8091)
import { createServer } from 'node:http'
import { createHash, randomUUID } from 'node:crypto'

const port = Number(process.env.PORT || 8091)
const UNIVERSE = 40
const CSV_HEADERS = [
  'input_id', 'link', 'title', 'category', 'address', 'open_hours', 'popular_times', 'website', 'phone', 'plus_code',
  'review_count', 'review_rating', 'reviews_per_rating', 'latitude', 'longitude', 'cid', 'status', 'descriptions',
  'reviews_link', 'thumbnail', 'timezone', 'price_range', 'data_id', 'street_view_url', 'place_id', 'images',
  'reservations', 'order_online', 'menu', 'owner', 'complete_address', 'credit_cards_accepted', 'about',
  'user_reviews', 'user_reviews_extended', 'emails'
]

let mode = 'normal'
let jobSeconds = Number(process.env.MOCK_JOB_SECONDS || 2)
const jobs = new Map()
const deleted = []

const hash = value => parseInt(createHash('sha1').update(value).digest('hex').slice(0, 8), 16)
const slug = value => value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
const csvCell = value => {
  const text = String(value ?? '')
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}

// "dentist near Tirana, Albania" -> { category: "dentist", city: "Tirana", country: "Albania" }
function parseQuery(query) {
  const match = query.match(/^(?:local\s+)?(.+?)\s+(?:companies\s+|services\s+)?(?:in|near|around|central|north|south|east|west)\s+([^,]+),\s*(.+)$/i)
  return match
    ? { category: match[1].trim(), city: match[2].trim(), country: match[3].trim() }
    : { category: query, city: 'Testville', country: 'Testland' }
}

function businesses(job) {
  const query = job.data.keywords[0]
  const { category, city, country } = parseQuery(query)
  // Overlapping windows: different query variations return partly the same businesses;
  // language never changes the result set (so cross-language duplicates are real).
  const offset = (hash(query.toLowerCase()) % 8) * 5
  const count = Math.min(12, job.data.depth * 4)
  const rows = []
  for (let n = 0; n < count; n++) {
    const i = (offset + n) % UNIVERSE
    const placeId = `mock-${slug(category)}-${slug(city)}-${i}`
    const hasWebsite = i % 3 === 0
    const website = hasWebsite ? `http://127.0.0.1:${port}/site/${placeId}` : ''
    rows.push({
      input_id: job.id,
      link: `https://www.google.com/maps/place/?q=place_id:${placeId}`,
      title: i % 11 === 10 ? '' : `${category.replace(/\b\w/g, c => c.toUpperCase())} Studio ${i + 1}`,
      category,
      address: `Via Test ${i + 1}, ${city}`,
      website,
      // Unique per business (category + city + index), like real phone numbers.
      phone: i % 5 === 4 ? '' : `+355 69 ${1000000 + ((hash(`${slug(category)}|${slug(city)}`) % 8000000) + i * 7919) % 8999999}`,
      review_count: String((i * 7) % 60),
      review_rating: (3.5 + (i % 15) / 10).toFixed(1),
      latitude: (41.3 + i / 1000).toFixed(6),
      longitude: (19.8 + i / 1000).toFixed(6),
      cid: String(900000 + i),
      data_id: `0x${i.toString(16)}`,
      place_id: placeId,
      complete_address: JSON.stringify({ borough: '', street: `Via Test ${i + 1}`, city, postal_code: '1001', state: '', country }),
      emails: hasWebsite && job.data.email ? `info@studio${i + 1}.example.com` : ''
    })
  }
  return rows
}

function toCsv(rows) {
  const lines = [CSV_HEADERS.join(',')]
  for (const row of rows) lines.push(CSV_HEADERS.map(h => csvCell(row[h])).join(','))
  return lines.join('\n') + '\n'
}

function jobStatus(job) {
  if (job.forcedStatus) return job.forcedStatus
  const elapsed = (Date.now() - job.createdAt) / 1000
  if (elapsed < 0.5) return 'pending'
  if (job.mode === 'stuck' || job.mode === 'stale') return 'working'
  if (elapsed < job.seconds) return 'working'
  return job.mode === 'fail' ? 'failed' : 'ok'
}

function publicJob(job) {
  return { ID: job.id, Name: job.name, Date: new Date(job.createdAt).toISOString(), Status: jobStatus(job), Data: { ...job.data, max_time: job.data.max_time * 1e9 } }
}

function send(res, status, body, type = 'application/json') {
  res.writeHead(status, { 'Content-Type': type })
  res.end(type === 'application/json' ? JSON.stringify(body) : body)
}

async function readBody(req) {
  let raw = ''
  for await (const chunk of req) raw += chunk
  return raw ? JSON.parse(raw) : {}
}

createServer(async (req, res) => {
  const url = new URL(req.url, 'http://localhost')
  const path = url.pathname

  if (path === '/__mock/mode' && req.method === 'POST') {
    const body = await readBody(req)
    mode = body.mode || 'normal'
    if (body.jobSeconds) jobSeconds = Number(body.jobSeconds)
    if (body.forceStatus && body.jobId && jobs.has(body.jobId)) jobs.get(body.jobId).forcedStatus = body.forceStatus
    return send(res, 200, { mode, jobSeconds })
  }
  if (path === '/__mock/state') {
    return send(res, 200, { mode, jobSeconds, jobs: [...jobs.values()].map(publicJob), deleted })
  }
  // Site Health targets: /status/503, /slow/1500 (ms), /redirect -> /status/200.
  const statusMatch = path.match(/^\/status\/(\d{3})$/)
  if (statusMatch) return send(res, Number(statusMatch[1]), 'status', 'text/plain')
  const slowMatch = path.match(/^\/slow\/(\d+)$/)
  if (slowMatch) return setTimeout(() => send(res, 200, 'slow', 'text/plain'), Number(slowMatch[1]))
  if (path === '/redirect') {
    res.writeHead(301, { Location: '/status/200' })
    return res.end()
  }
  if (path.startsWith('/site/')) {
    const id = path.slice(6)
    const i = Number(id.split('-').pop())
    const instagram = i % 2 === 0 ? `<a href="https://www.instagram.com/studio_${i + 1}/">Instagram</a>` : ''
    return send(res, 200, `<!doctype html><html><body><h1>${id}</h1>${instagram}<a href="https://www.instagram.com/p/xyz/">post</a></body></html>`, 'text/html')
  }

  if (mode === 'offline') {
    req.socket.destroy()
    return
  }
  if (path === '/health') return send(res, 200, { status: 'ok' })

  if (path === '/api/v1/jobs' && req.method === 'POST') {
    if (mode === 'reject') return send(res, 500, { code: 500, message: 'mock rejected job' })
    const body = await readBody(req)
    if (!body.depth || !body.max_time) return send(res, 422, { code: 422, message: 'depth and max_time are required' })
    const id = randomUUID()
    jobs.set(id, {
      id,
      name: body.name,
      createdAt: Date.now(),
      seconds: jobSeconds,
      mode,
      data: { keywords: body.keywords, lang: body.lang, depth: body.depth, email: body.email, max_time: body.max_time }
    })
    return send(res, 201, { id })
  }
  if (path === '/api/v1/jobs' && req.method === 'GET') {
    return send(res, 200, [...jobs.values()].filter(job => job.mode !== 'vanish').map(publicJob))
  }

  const match = path.match(/^\/api\/v1\/jobs\/([^/]+)(\/download)?$/)
  if (match) {
    const job = jobs.get(match[1])
    const missing = () => send(res, 404, { code: 404, message: 'job not found' })
    if (req.method === 'DELETE') {
      deleted.push(match[1])
      jobs.delete(match[1])
      return send(res, 200, '', 'text/plain')
    }
    if (!job || job.mode === 'vanish') return missing()
    if (!match[2]) return send(res, 200, publicJob(job))

    const status = jobStatus(job)
    if (status === 'pending') return send(res, 404, { code: 404, message: 'file not found' })
    if (status === 'failed') return send(res, 404, { code: 404, message: 'file not found' })
    // While working: header-only CSV (the real scraper can do this), except "stale" jobs whose results already exist.
    const elapsed = (Date.now() - job.createdAt) / 1000
    const ready = status === 'ok' || (job.mode === 'stale' && elapsed >= job.seconds)
    return send(res, 200, ready ? toCsv(businesses(job)) : CSV_HEADERS.join(',') + '\n', 'text/csv')
  }

  send(res, 404, { code: 404, message: 'not found' })
}).listen(port, '127.0.0.1', () => console.log(`Mock google-maps-scraper on http://127.0.0.1:${port} (mode: ${mode})`))
