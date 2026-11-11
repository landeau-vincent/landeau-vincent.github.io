import { reactive } from 'vue'
import { queryAll } from './database'
import { unflattenStrings } from './unflatten'
import type { ClientEntry, WorkEntry, WorkSection, WorkSectionItem } from './types'
import type { I18n } from 'vue-i18n'

type StringRow = { lang_code: string; key: string; value: string }
type WorkRow = { slug: string; year: string; url: string; sort_order: number }
type WorkTr = {
  work_slug: string
  lang_code: string
  nav_label: string
  title: string
  subtitle: string
  description: string
  challenges: string
  solutions: string
}
type RoleRow = { work_slug: string; role_key: string; sort_order: number }
type SectionRow = {
  id: number
  work_slug: string
  section_key: string
  direction: string
  sort_order: number
}
type ItemRow = {
  section_id: number
  type: string
  src: string
  filter: number
  sort_order: number
}
type SectionTr = { section_id: number; lang_code: string; title: string; body: string }
type ClientRow = { slug: string; url: string; sort_order: number }
type ClientTr = {
  client_slug: string
  lang_code: string
  nav_label: string
  title: string
  subtitle: string
}
type LangRow = { code: string; name: string; sort_order: number }

export const portfolioReady = reactive({ loaded: false })

export const works = reactive<Record<string, WorkEntry>>({})
export const clients = reactive<Record<string, ClientEntry>>({})

export let languagesAvailable: string[] = ['en', 'fr']

const stringRowsByLang = new Map<string, Record<string, string>>()
const workTranslations = new Map<string, WorkTr[]>()
const sectionTranslations = new Map<number, SectionTr[]>()
const clientTranslations = new Map<string, ClientTr[]>()

let structuralWorks = new Map<string, { year: string; url: string; roles: string[]; sections: Record<string, WorkSection> }>()
let structuralClients = new Map<string, { url: string }>()

function mergeWorkMessages(lang: string) {
  const flat = { ...(stringRowsByLang.get(lang) ?? stringRowsByLang.get('en') ?? {}) }
  const messages = unflattenStrings(flat) as Record<string, unknown>
  if (!messages['work-item']) messages['work-item'] = {}
  const workItem = messages['work-item'] as Record<string, unknown>

  for (const [slug, struct] of structuralWorks) {
    const tr =
      workTranslations.get(slug)?.find((t) => t.lang_code === lang) ??
      workTranslations.get(slug)?.find((t) => t.lang_code === 'en')
    const existing = (workItem[slug] as Record<string, unknown>) ?? {}
    workItem[slug] = {
      ...existing,
      description: tr?.description ?? existing.description ?? '',
      challenges: tr?.challenges ?? existing.challenges ?? '',
      solutions: tr?.solutions ?? existing.solutions ?? '',
      content: existing.content ?? {},
    }
    const entry = workItem[slug] as Record<string, unknown>
    const contentBlock = (entry.content as Record<string, unknown>) ?? {}
    entry.content = contentBlock

    for (const sectionKey of Object.keys(struct.sections)) {
      const sectionId = sectionIdByKey.get(`${slug}:${sectionKey}`)
      if (sectionId == null) continue
      const secTr =
        sectionTranslations.get(sectionId)?.find((t) => t.lang_code === lang) ??
        sectionTranslations.get(sectionId)?.find((t) => t.lang_code === 'en')
      if (secTr) {
        contentBlock[sectionKey] = {
          title: secTr.title,
          text: secTr.body,
        }
      }
    }
  }

  messagesByLang.set(lang, messages)
}

const messagesByLang = new Map<string, Record<string, unknown>>()

export function applyPortfolioI18n(instance: I18n) {
  for (const [lang, messages] of messagesByLang) {
    instance.global.setLocaleMessage(lang, messages)
  }
}

const sectionIdByKey = new Map<string, number>()

export function applyPortfolioLocale(lang: string) {
  for (const [slug, struct] of structuralWorks) {
    const tr =
      workTranslations.get(slug)?.find((t) => t.lang_code === lang) ??
      workTranslations.get(slug)?.find((t) => t.lang_code === 'en')
    if (!tr) continue
    works[slug] = {
      'nav-label': tr.nav_label,
      title: tr.title,
      subtitle: tr.subtitle,
      date: struct.year,
      url: struct.url,
      roles: [...struct.roles],
      sections: struct.sections,
    }
  }

  for (const [slug, struct] of structuralClients) {
    const tr =
      clientTranslations.get(slug)?.find((t) => t.lang_code === lang) ??
      clientTranslations.get(slug)?.find((t) => t.lang_code === 'en')
    if (!tr) continue
    clients[slug] = {
      'nav-label': tr.nav_label,
      title: tr.title,
      subtitle: tr.subtitle,
      url: struct.url,
    }
  }

  mergeWorkMessages(lang)
}

export function syncPortfolioLocaleToI18n(instance: I18n, lang: string) {
  const messages = messagesByLang.get(lang)
  if (messages) instance.global.setLocaleMessage(lang, messages)
}

export async function initPortfolio(): Promise<void> {
  const langs = await queryAll<LangRow>(
    'SELECT code, name, sort_order FROM languages ORDER BY sort_order, code'
  )
  languagesAvailable = langs.map((l) => l.code)

  const strings = await queryAll<StringRow>('SELECT lang_code, key, value FROM strings')
  for (const row of strings) {
    if (!stringRowsByLang.has(row.lang_code)) stringRowsByLang.set(row.lang_code, {})
    stringRowsByLang.get(row.lang_code)![row.key] = row.value
  }

  const workRows = await queryAll<WorkRow>('SELECT slug, year, url, sort_order FROM works ORDER BY sort_order')
  const trRows = await queryAll<WorkTr>('SELECT * FROM work_translations')
  const roleRows = await queryAll<RoleRow>(
    'SELECT work_slug, role_key, sort_order FROM work_roles ORDER BY sort_order'
  )
  const sectionRows = await queryAll<SectionRow>(
    'SELECT id, work_slug, section_key, direction, sort_order FROM work_sections ORDER BY sort_order'
  )
  const itemRows = await queryAll<ItemRow>(
    'SELECT section_id, type, src, filter, sort_order FROM work_section_items ORDER BY sort_order'
  )
  const secTrRows = await queryAll<SectionTr>(
    'SELECT section_id, lang_code, title, body FROM work_section_translations'
  )

  for (const tr of trRows) {
    if (!workTranslations.has(tr.work_slug)) workTranslations.set(tr.work_slug, [])
    workTranslations.get(tr.work_slug)!.push(tr)
  }
  for (const tr of secTrRows) {
    if (!sectionTranslations.has(tr.section_id)) sectionTranslations.set(tr.section_id, [])
    sectionTranslations.get(tr.section_id)!.push(tr)
  }

  sectionIdByKey.clear()
  for (const section of sectionRows) {
    sectionIdByKey.set(`${section.work_slug}:${section.section_key}`, section.id)
  }

  const itemsBySection = new Map<number, WorkSectionItem[]>()
  for (const item of itemRows) {
    if (!itemsBySection.has(item.section_id)) itemsBySection.set(item.section_id, [])
    const entry: WorkSectionItem = { type: item.type }
    if (item.src) entry.src = item.src
    if (item.filter) entry.filter = true
    itemsBySection.get(item.section_id)!.push(entry)
  }

  structuralWorks = new Map()
  for (const work of workRows) {
    const roles = roleRows.filter((r) => r.work_slug === work.slug).map((r) => r.role_key)
    const sections: Record<string, WorkSection> = {}
    for (const sec of sectionRows.filter((s) => s.work_slug === work.slug)) {
      const section: WorkSection = { items: itemsBySection.get(sec.id) ?? [] }
      if (sec.direction) section.direction = sec.direction
      sections[sec.section_key] = section
    }
    structuralWorks.set(work.slug, { year: work.year, url: work.url, roles, sections })
  }

  const clientRows = await queryAll<ClientRow>(
    'SELECT slug, url, sort_order FROM clients ORDER BY sort_order'
  )
  const clientTrRows = await queryAll<ClientTr>('SELECT * FROM client_translations')
  for (const tr of clientTrRows) {
    if (!clientTranslations.has(tr.client_slug)) clientTranslations.set(tr.client_slug, [])
    clientTranslations.get(tr.client_slug)!.push(tr)
  }
  structuralClients = new Map(clientRows.map((c) => [c.slug, { url: c.url }]))

  for (const lang of languagesAvailable) {
    mergeWorkMessages(lang)
  }
  portfolioReady.loaded = true
}
