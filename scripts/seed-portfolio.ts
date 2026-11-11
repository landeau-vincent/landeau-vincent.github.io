import { existsSync, mkdirSync, unlinkSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { works, clients } from '../src/assets/data'
import { en } from '../src/assets/locales/en'
import { fr } from '../src/assets/locales/fr'
import { flattenLocale } from './db/flatten-locale.mjs'
import { openDatabase, saveDatabase, execSchema } from './db/sqlite-node.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const dbPath = join(root, 'public', 'portfolio.sqlite')

mkdirSync(dirname(dbPath), { recursive: true })
if (existsSync(dbPath)) unlinkSync(dbPath)

async function main() {
const db = await openDatabase(dbPath)
execSchema(db, join(__dirname, 'db', 'schema.sql'))

function insert(sql: string, params: (string | number)[]) {
  db.run(sql, params)
}

insert('INSERT INTO languages (code, name, sort_order) VALUES (?, ?, ?)', ['en', 'English', 0])
insert('INSERT INTO languages (code, name, sort_order) VALUES (?, ?, ?)', ['fr', 'Français', 1])

for (const [lang, messages] of [
  ['en', en],
  ['fr', fr],
] as const) {
  const flat = flattenLocale(messages)
  for (const [key, value] of Object.entries(flat)) {
    insert('INSERT INTO strings (lang_code, key, value) VALUES (?, ?, ?)', [lang, key, value])
  }
}

let workOrder = 0
for (const [slug, work] of Object.entries(works)) {
  insert('INSERT INTO works (slug, year, url, sort_order) VALUES (?, ?, ?, ?)', [
    slug,
    work.date ?? '',
    work.url ?? '',
    workOrder++,
  ])
  const enWork = (en['work-item'] as Record<string, unknown>)?.[slug] as Record<string, unknown> ?? {}
  const frWork = (fr['work-item'] as Record<string, unknown>)?.[slug] as Record<string, unknown> ?? {}
  const workTrSql = `INSERT INTO work_translations
    (work_slug, lang_code, nav_label, title, subtitle, description, challenges, solutions)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  insert(workTrSql, [
    slug,
    'en',
    work['nav-label'] ?? '',
    work.title ?? '',
    work.subtitle ?? '',
    String(enWork.description ?? ''),
    String(enWork.challenges ?? ''),
    String(enWork.solutions ?? ''),
  ])
  insert(workTrSql, [
    slug,
    'fr',
    work['nav-label'] ?? '',
    work.title ?? '',
    work.subtitle ?? '',
    String(frWork.description ?? ''),
    String(frWork.challenges ?? ''),
    String(frWork.solutions ?? ''),
  ])
  ;(work.roles ?? []).forEach((role, i) => {
    insert('INSERT INTO work_roles (work_slug, role_key, sort_order) VALUES (?, ?, ?)', [
      slug,
      role,
      i,
    ])
  })

  const sections = work.sections ?? {}
  let sectionOrder = 0
  for (const [sectionKey, section] of Object.entries(sections)) {
    insert(
      'INSERT INTO work_sections (work_slug, section_key, direction, sort_order) VALUES (?, ?, ?, ?)',
      [slug, sectionKey, section.direction ?? '', sectionOrder++]
    )
    const sectionId = Number(db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0])
    const enContent = (enWork.content as Record<string, { title?: string; text?: string }>)?.[sectionKey] ?? {}
    const frContent = (frWork.content as Record<string, { title?: string; text?: string }>)?.[sectionKey] ?? {}
    const hasText = (section.items ?? []).some((item) => item.type === 'text')
    if (hasText) {
      insert(
        'INSERT INTO work_section_translations (section_id, lang_code, title, body) VALUES (?, ?, ?, ?)',
        [sectionId, 'en', enContent.title ?? '', enContent.text ?? '']
      )
      insert(
        'INSERT INTO work_section_translations (section_id, lang_code, title, body) VALUES (?, ?, ?, ?)',
        [sectionId, 'fr', frContent.title ?? '', frContent.text ?? '']
      )
    }
    ;(section.items ?? []).forEach((item, i) => {
      insert(
        `INSERT INTO work_section_items (section_id, type, src, filter, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [sectionId, item.type, item.src ?? '', item.filter ? 1 : 0, i]
      )
    })
  }
}

let clientOrder = 0
for (const [slug, client] of Object.entries(clients)) {
  insert('INSERT INTO clients (slug, url, sort_order) VALUES (?, ?, ?)', [
    slug,
    client.url ?? '',
    clientOrder++,
  ])
  for (const lang of ['en', 'fr']) {
    insert(
      `INSERT INTO client_translations (client_slug, lang_code, nav_label, title, subtitle)
       VALUES (?, ?, ?, ?, ?)`,
      [slug, lang, client['nav-label'] ?? '', client.title ?? '', client.subtitle ?? '']
    )
  }
}

db.run('PRAGMA journal_mode = DELETE')
saveDatabase(db, dbPath)
db.close()
console.log('Seeded', dbPath)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
