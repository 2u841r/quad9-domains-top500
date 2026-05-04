import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'fs'
import { join, resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dir = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dir, '../../')          // repo root
const OUT  = resolve(__dir, '../public/data')  // dashboard/public/data

mkdirSync(OUT, { recursive: true })

// Collect all top500-YYYY-MM-DD.json files
const files = readdirSync(ROOT)
  .filter(f => /^top500-\d{4}-\d{2}-\d{2}\.json$/.test(f))
  .sort()

if (files.length === 0) {
  console.error('No top500-*.json files found in repo root')
  process.exit(1)
}

// Build domain dictionary (domain → uint16 id)
const domainToId = new Map()
const idToDomain = []

function getId(domain) {
  if (!domainToId.has(domain)) {
    const id = idToDomain.length
    domainToId.set(domain, id)
    idToDomain.push(domain)
  }
  return domainToId.get(domain)
}

// First pass: register all domains in date order so IDs are stable
const days = []
for (const file of files) {
  const date = file.slice(7, 17) // top500-YYYY-MM-DD.json
  const lines = readFileSync(join(ROOT, file), 'utf8').trim().split('\n')
  const entries = lines.map(l => JSON.parse(l)).sort((a, b) => a.position - b.position)
  entries.forEach(e => getId(e.domain_name))
  days.push({ date, entries })
}

// Write dict.txt — one domain per line, line index = id
writeFileSync(join(OUT, 'dict.txt'), idToDomain.join('\n'), 'utf8')

// Write binary day files — 500 uint16 LE values in rank order (index = rank-1)
for (const { date, entries } of days) {
  const buf = Buffer.alloc(entries.length * 2)
  for (let i = 0; i < entries.length; i++) {
    buf.writeUInt16LE(getId(entries[i].domain_name), i * 2)
  }
  writeFileSync(join(OUT, `${date}.bin`), buf)
}

// Write manifest — sorted date list
writeFileSync(join(OUT, 'manifest.json'), JSON.stringify(days.map(d => d.date)), 'utf8')

const dictBytes = idToDomain.join('\n').length
const dayBytes = (days[0]?.entries.length ?? 500) * 2
console.log(`✓ ${days.length} days | ${idToDomain.length} unique domains`)
console.log(`  dict.txt   ${dictBytes} bytes`)
console.log(`  per day    ${dayBytes} bytes  (was ~36,460 bytes NDJSON)`)
console.log(`  total data ${(dictBytes + days.length * dayBytes).toLocaleString()} bytes`)
