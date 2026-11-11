import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { openDatabase, saveDatabase, runQuery } from './sqlite-node.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '../..')
export const dbPath = join(root, 'public', 'portfolio.sqlite')

export async function withDb(mutator) {
  const db = await openDatabase(dbPath)
  try {
    const result = await mutator(db)
    saveDatabase(db, dbPath)
    return result
  } finally {
    db.close()
  }
}

export async function withDbRead(reader) {
  const db = await openDatabase(dbPath)
  try {
    return await reader(db)
  } finally {
    db.close()
  }
}

export function getLanguages(db) {
  return runQuery(db, 'SELECT code, name, sort_order FROM languages ORDER BY sort_order, code')
}

export function getWorksList(db) {
  return runQuery(db, 'SELECT slug, year, url, sort_order FROM works ORDER BY sort_order, slug')
}

export function getWorkFull(db, slug) {
  const work = runQuery(db, 'SELECT * FROM works WHERE slug = ?', [slug])[0]
  if (!work) return null
  const translations = runQuery(
    db,
    'SELECT * FROM work_translations WHERE work_slug = ?',
    [slug]
  )
  const roles = runQuery(
    db,
    'SELECT role_key, sort_order FROM work_roles WHERE work_slug = ? ORDER BY sort_order',
    [slug]
  )
  const sections = runQuery(
    db,
    `SELECT id, section_key, direction, sort_order FROM work_sections
     WHERE work_slug = ? ORDER BY sort_order`,
    [slug]
  ).map((section) => {
    const items = runQuery(
      db,
      `SELECT id, type, src, filter, sort_order FROM work_section_items
       WHERE section_id = ? ORDER BY sort_order`,
      [section.id]
    )
    const sectionTranslations = runQuery(
      db,
      'SELECT lang_code, title, body FROM work_section_translations WHERE section_id = ?',
      [section.id]
    )
    return { ...section, items, translations: sectionTranslations }
  })
  return { ...work, translations, roles, sections }
}

export function saveWorkFull(db, payload) {
  const { slug, year, url, sort_order, translations, roles, sections } = payload
  db.run(
    `INSERT INTO works (slug, year, url, sort_order) VALUES (?, ?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET year = excluded.year, url = excluded.url, sort_order = excluded.sort_order`,
    [slug, year ?? '', url ?? '', sort_order ?? 0]
  )
  db.run('DELETE FROM work_translations WHERE work_slug = ?', [slug])
  db.run('DELETE FROM work_roles WHERE work_slug = ?', [slug])
  for (const tr of translations ?? []) {
    db.run(
      `INSERT INTO work_translations
       (work_slug, lang_code, nav_label, title, subtitle, description, challenges, solutions)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        slug,
        tr.lang_code,
        tr.nav_label ?? '',
        tr.title ?? '',
        tr.subtitle ?? '',
        tr.description ?? '',
        tr.challenges ?? '',
        tr.solutions ?? '',
      ]
    )
  }
  for (const [i, role] of (roles ?? []).entries()) {
    const roleKey = typeof role === 'string' ? role : role.role_key
    db.run('INSERT INTO work_roles (work_slug, role_key, sort_order) VALUES (?, ?, ?)', [
      slug,
      roleKey,
      i,
    ])
  }
  const existingSections = runQuery(db, 'SELECT id FROM work_sections WHERE work_slug = ?', [slug])
  for (const row of existingSections) {
    db.run('DELETE FROM work_section_items WHERE section_id = ?', [row.id])
    db.run('DELETE FROM work_section_translations WHERE section_id = ?', [row.id])
  }
  db.run('DELETE FROM work_sections WHERE work_slug = ?', [slug])
  for (const [i, section] of (sections ?? []).entries()) {
    db.run(
      'INSERT INTO work_sections (work_slug, section_key, direction, sort_order) VALUES (?, ?, ?, ?)',
      [slug, section.section_key, section.direction ?? '', i]
    )
    const sectionId = Number(db.exec('SELECT last_insert_rowid() AS id')[0].values[0][0])
    for (const tr of section.translations ?? []) {
      db.run(
        'INSERT INTO work_section_translations (section_id, lang_code, title, body) VALUES (?, ?, ?, ?)',
        [sectionId, tr.lang_code, tr.title ?? '', tr.body ?? '']
      )
    }
    for (const [j, item] of (section.items ?? []).entries()) {
      db.run(
        `INSERT INTO work_section_items (section_id, type, src, filter, sort_order)
         VALUES (?, ?, ?, ?, ?)`,
        [sectionId, item.type, item.src ?? '', item.filter ? 1 : 0, j]
      )
    }
  }
}

export function deleteWork(db, slug) {
  db.run('DELETE FROM works WHERE slug = ?', [slug])
}

export function getClientsList(db) {
  return runQuery(db, 'SELECT slug, url, sort_order FROM clients ORDER BY sort_order, slug')
}

export function getClientFull(db, slug) {
  const client = runQuery(db, 'SELECT * FROM clients WHERE slug = ?', [slug])[0]
  if (!client) return null
  const translations = runQuery(
    db,
    'SELECT lang_code, nav_label, title, subtitle FROM client_translations WHERE client_slug = ?',
    [slug]
  )
  return { ...client, translations }
}

export function saveClientFull(db, payload) {
  const { slug, url, sort_order, translations } = payload
  db.run(
    `INSERT INTO clients (slug, url, sort_order) VALUES (?, ?, ?)
     ON CONFLICT(slug) DO UPDATE SET url = excluded.url, sort_order = excluded.sort_order`,
    [slug, url ?? '', sort_order ?? 0]
  )
  db.run('DELETE FROM client_translations WHERE client_slug = ?', [slug])
  for (const tr of translations ?? []) {
    db.run(
      `INSERT INTO client_translations (client_slug, lang_code, nav_label, title, subtitle)
       VALUES (?, ?, ?, ?, ?)`,
      [slug, tr.lang_code, tr.nav_label ?? '', tr.title ?? '', tr.subtitle ?? '']
    )
  }
}

export function deleteClient(db, slug) {
  db.run('DELETE FROM clients WHERE slug = ?', [slug])
}

export function getStrings(db, lang, prefix = '') {
  if (prefix) {
    return runQuery(
      db,
      `SELECT key, value FROM strings WHERE lang_code = ? AND key LIKE ? ORDER BY key`,
      [lang, `${prefix}%`]
    )
  }
  return runQuery(db, 'SELECT key, value FROM strings WHERE lang_code = ? ORDER BY key', [lang])
}

export function upsertString(db, lang, key, value) {
  db.run(
    `INSERT INTO strings (lang_code, key, value) VALUES (?, ?, ?)
     ON CONFLICT(lang_code, key) DO UPDATE SET value = excluded.value`,
    [lang, key, value ?? '']
  )
}

export function addLanguage(db, code, name) {
  const maxOrder = runQuery(db, 'SELECT MAX(sort_order) AS m FROM languages')[0]?.m ?? -1
  db.run('INSERT INTO languages (code, name, sort_order) VALUES (?, ?, ?)', [
    code,
    name ?? code,
    maxOrder + 1,
  ])
}

export function removeLanguage(db, code) {
  if (code === 'en') throw new Error('Cannot remove default language en')
  db.run('DELETE FROM languages WHERE code = ?', [code])
}
