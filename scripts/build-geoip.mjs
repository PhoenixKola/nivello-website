#!/usr/bin/env node
// Builds the compact IP-to-country tables used by admin analytics (public/admin-api/_geoip.php).
//
// Source: the "geo-whois-asn-country" ranges from https://github.com/sapics/ip-location-db
// (data by NRO, https://www.nro.net, CC BY 4.0). Download the two "-num" CSVs, then:
//
//   node scripts/build-geoip.mjs geo-whois-asn-country-ipv4-num.csv geo-whois-asn-country-ipv6-num.csv
//
// Output format (both files): sorted fixed-size records of [range start, big-endian][2-byte country].
// IPv4 keys are 4 bytes; IPv6 keys are the top 8 bytes (the /64 prefix is plenty for a country).
// Unassigned gaps are stored as "--". Lookup = binary search for the last start <= address.

import { readFileSync, writeFileSync } from 'node:fs'

const [ipv4Csv, ipv6Csv] = process.argv.slice(2)
if (!ipv4Csv || !ipv6Csv) {
  console.error('Usage: node scripts/build-geoip.mjs <ipv4-num.csv> <ipv6-num.csv>')
  process.exit(1)
}

function build(csvPath, keyBytes, shift) {
  const max = (1n << BigInt(keyBytes * 8)) - 1n
  const rows = readFileSync(csvPath, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map(line => {
      const [start, end, cc] = line.trim().split(',')
      return { start: BigInt(start) >> shift, end: BigInt(end) >> shift, cc: /^[A-Z]{2}$/.test(cc) ? cc : '--' }
    })
    .sort((a, b) => (a.start < b.start ? -1 : a.start > b.start ? 1 : 0))

  const records = []
  const push = (start, cc) => {
    const last = records[records.length - 1]
    if (last && last.cc === cc) return
    if (last && last.start === start) {
      last.cc = cc
      return
    }
    records.push({ start, cc })
  }
  let next = 0n
  for (const row of rows) {
    if (row.end < next) continue // fully covered by an earlier (coarser) range
    const start = row.start < next ? next : row.start
    if (start > next) push(next, '--')
    push(start, row.cc)
    next = row.end + 1n
  }
  if (next <= max) push(next, '--')

  const size = keyBytes + 2
  const out = Buffer.alloc(records.length * size)
  records.forEach((record, i) => {
    let value = record.start
    for (let b = keyBytes - 1; b >= 0; b--) {
      out[i * size + b] = Number(value & 0xffn)
      value >>= 8n
    }
    out.write(record.cc, i * size + keyBytes, 'ascii')
  })
  return { out, count: records.length }
}

const v4 = build(ipv4Csv, 4, 0n)
const v6 = build(ipv6Csv, 8, 64n)
writeFileSync('public/admin-api/_geo-ipv4.bin', v4.out)
writeFileSync('public/admin-api/_geo-ipv6.bin', v6.out)
console.log(`IPv4: ${v4.count} ranges (${(v4.out.length / 1024).toFixed(0)} KB), IPv6: ${v6.count} ranges (${(v6.out.length / 1024).toFixed(0)} KB)`)
