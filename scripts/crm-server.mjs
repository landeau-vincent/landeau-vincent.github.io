import express from 'express'
import multer from 'multer'
import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  withDb,
  withDbRead,
  getLanguages,
  getWorksList,
  getWorkFull,
  saveWorkFull,
  deleteWork,
  getClientsList,
  getClientFull,
  saveClientFull,
  deleteClient,
  getStrings,
  upsertString,
  addLanguage,
  removeLanguage,
} from './db/repository.mjs'
import { runQuery } from './db/sqlite-node.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const crmDir = join(root, 'crm')
const publicDir = join(root, 'public')
const PORT = 4174

const upload = multer({ storage: multer.memoryStorage() })

const app = express()
app.use(express.json({ limit: '2mb' }))
app.use(express.static(crmDir))

app.get('/api/languages', async (_req, res) => {
  const langs = await withDbRead((db) => getLanguages(db))
  res.json(langs)
})

app.post('/api/languages', async (req, res) => {
  const { code, name } = req.body ?? {}
  if (!code) return res.status(400).json({ error: 'code required' })
  await withDb((db) => {
    addLanguage(db, code.trim(), name?.trim() || code.trim())
  })
  res.json({ ok: true })
})

app.delete('/api/languages/:code', async (req, res) => {
  try {
    await withDb((db) => removeLanguage(db, req.params.code))
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: e.message })
  }
})

app.get('/api/strings', async (req, res) => {
  const lang = String(req.query.lang ?? 'en')
  const prefix = String(req.query.prefix ?? '')
  const rows = await withDbRead((db) => getStrings(db, lang, prefix))
  res.json(rows)
})

app.put('/api/strings', async (req, res) => {
  const entries = req.body?.entries ?? []
  await withDb((db) => {
    for (const { lang, key, value } of entries) {
      upsertString(db, lang, key, value)
    }
  })
  res.json({ ok: true })
})

app.get('/api/works', async (_req, res) => {
  const works = await withDbRead((db) => getWorksList(db))
  res.json(works)
})

app.get('/api/works/:slug', async (req, res) => {
  const work = await withDbRead((db) => getWorkFull(db, req.params.slug))
  if (!work) return res.status(404).json({ error: 'not found' })
  res.json(work)
})

app.put('/api/works/:slug', async (req, res) => {
  const slug = req.params.slug
  await withDb((db) => saveWorkFull(db, { ...req.body, slug }))
  res.json({ ok: true })
})

app.post('/api/works', async (req, res) => {
  const slug = req.body?.slug?.trim()
  if (!slug) return res.status(400).json({ error: 'slug required' })
  const exists = await withDbRead(
    (db) => runQuery(db, 'SELECT slug FROM works WHERE slug = ?', [slug]).length > 0
  )
  if (exists) return res.status(409).json({ error: 'slug exists' })
  await withDb((db) =>
    saveWorkFull(db, {
      slug,
      year: req.body.year ?? '',
      url: req.body.url ?? '',
      sort_order: req.body.sort_order ?? 99,
      translations: req.body.translations ?? [],
      roles: req.body.roles ?? [],
      sections: req.body.sections ?? [],
    })
  )
  mkdirSync(join(publicDir, 'works', slug), { recursive: true })
  res.json({ ok: true, slug })
})

app.delete('/api/works/:slug', async (req, res) => {
  await withDb((db) => deleteWork(db, req.params.slug))
  res.json({ ok: true })
})

app.post('/api/works/:slug/upload', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' })
  const subpath = (req.body?.path ?? req.file.originalname).replace(/^\/+/, '')
  const dest = join(publicDir, 'works', req.params.slug, subpath)
  mkdirSync(dirname(dest), { recursive: true })
  writeFileSync(dest, req.file.buffer)
  res.json({ path: `/${subpath}` })
})

app.get('/api/clients', async (_req, res) => {
  res.json(await withDbRead((db) => getClientsList(db)))
})

app.get('/api/clients/:slug', async (req, res) => {
  const client = await withDbRead((db) => getClientFull(db, req.params.slug))
  if (!client) return res.status(404).json({ error: 'not found' })
  res.json(client)
})

app.put('/api/clients/:slug', async (req, res) => {
  await withDb((db) => saveClientFull(db, { ...req.body, slug: req.params.slug }))
  res.json({ ok: true })
})

app.post('/api/clients', async (req, res) => {
  const slug = req.body?.slug?.trim()
  if (!slug) return res.status(400).json({ error: 'slug required' })
  await withDb((db) =>
    saveClientFull(db, {
      slug,
      url: req.body.url ?? '',
      sort_order: req.body.sort_order ?? 99,
      translations: req.body.translations ?? [],
    })
  )
  res.json({ ok: true })
})

app.delete('/api/clients/:slug', async (req, res) => {
  await withDb((db) => deleteClient(db, req.params.slug))
  res.json({ ok: true })
})

app.post('/api/clients/:slug/logo', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'file required' })
  const dest = join(publicDir, 'clients', `${req.params.slug}.png`)
  mkdirSync(join(publicDir, 'clients'), { recursive: true })
  writeFileSync(dest, req.file.buffer)
  res.json({ ok: true })
})

app.listen(PORT, '127.0.0.1', () => {
  console.log(`Portfolio CRM http://127.0.0.1:${PORT}`)
})
