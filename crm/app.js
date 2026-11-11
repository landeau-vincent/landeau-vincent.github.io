const api = (path, opts = {}) =>
  fetch(path, { headers: { 'Content-Type': 'application/json' }, ...opts }).then(async (r) => {
    const data = await r.json().catch(() => ({}))
    if (!r.ok) throw new Error(data.error || r.statusText)
    return data
  })

let languages = []

function toast(msg) {
  const el = document.getElementById('toast')
  el.textContent = msg
  el.hidden = false
  setTimeout(() => (el.hidden = true), 2500)
}

document.querySelectorAll('#tabs button').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('#tabs button').forEach((b) => b.classList.remove('active'))
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'))
    btn.classList.add('active')
    document.getElementById(`panel-${btn.dataset.tab}`).classList.add('active')
  })
})

async function loadLanguages() {
  languages = await api('/api/languages')
  const sel = document.getElementById('strings-lang')
  sel.innerHTML = languages.map((l) => `<option value="${l.code}">${l.code}</option>`).join('')
  const list = document.getElementById('languages-list')
  list.innerHTML = languages
    .map(
      (l) => `<li>${l.code} — ${l.name}
        ${l.code === 'en' ? '' : `<button type="button" data-code="${l.code}" class="del-lang">Remove</button>`}
      </li>`
    )
    .join('')
  list.querySelectorAll('.del-lang').forEach((b) =>
    b.addEventListener('click', async () => {
      if (!confirm(`Remove language ${b.dataset.code}?`)) return
      await api(`/api/languages/${b.dataset.code}`, { method: 'DELETE' })
      toast('Language removed')
      await loadLanguages()
      await loadWorksList()
    })
  )
}

document.getElementById('language-form').addEventListener('submit', async (e) => {
  e.preventDefault()
  const fd = new FormData(e.target)
  await api('/api/languages', {
    method: 'POST',
    body: JSON.stringify({ code: fd.get('code'), name: fd.get('name') }),
  })
  e.target.reset()
  toast('Language added')
  await loadLanguages()
})

let currentWork = null

async function loadWorksList() {
  const works = await api('/api/works')
  const ul = document.getElementById('works-list')
  ul.innerHTML = works
    .map(
      (w) =>
        `<li><button type="button" data-slug="${w.slug}">${w.slug} <span class="muted">(${w.year})</span></button></li>`
    )
    .join('')
  ul.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => openWork(b.dataset.slug))
  )
}

function emptyTranslation() {
  return languages.map((l) => ({
    lang_code: l.code,
    nav_label: '',
    title: '',
    subtitle: '',
    description: '',
    challenges: '',
    solutions: '',
  }))
}

function renderWorkForm(work) {
  const form = document.getElementById('work-form')
  form.classList.remove('hidden')
  const trMap = Object.fromEntries((work.translations || []).map((t) => [t.lang_code, t]))
  const translations = languages.map((l) => trMap[l.code] || { lang_code: l.code })
  let activeLang = languages[0]?.code || 'en'

  const renderLangFields = () => {
    const t = translations.find((x) => x.lang_code === activeLang) || { lang_code: activeLang }
    return `
      <div class="field-grid">
        <label>Nav label <input data-tr="nav_label" value="${esc(t.nav_label || '')}" /></label>
        <label>Title <input data-tr="title" value="${esc(t.title || '')}" /></label>
        <label>Subtitle <input data-tr="subtitle" value="${esc(t.subtitle || '')}" /></label>
        <label>Description <textarea data-tr="description">${esc(t.description || '')}</textarea></label>
        <label>Challenges <textarea data-tr="challenges">${esc(t.challenges || '')}</textarea></label>
        <label>Solutions <textarea data-tr="solutions">${esc(t.solutions || '')}</textarea></label>
      </div>`
  }

  form.innerHTML = `
    <h2>${esc(work.slug)}</h2>
    <div class="field-grid">
      <label>Slug <input id="w-slug" value="${esc(work.slug)}" ${work._new ? '' : 'readonly'} /></label>
      <label>Year <input id="w-year" value="${esc(work.year || '')}" /></label>
      <label>URL <input id="w-url" value="${esc(work.url || '')}" /></label>
      <label>Sort order <input id="w-sort" type="number" value="${work.sort_order ?? 0}" /></label>
      <label>Roles (comma) <input id="w-roles" value="${esc((work.roles || []).map((r) => r.role_key || r).join(', '))}" /></label>
    </div>
    <div class="lang-tabs" id="w-lang-tabs">
      ${languages.map((l) => `<button type="button" data-lang="${l.code}" class="${l.code === activeLang ? 'active' : ''}">${l.code}</button>`).join('')}
    </div>
    <div id="w-lang-fields">${renderLangFields()}</div>
    <h3>Sections</h3>
    <div id="w-sections"></div>
    <button type="button" id="w-add-section">Add section</button>
    <div class="actions">
      <button type="button" id="w-save" class="primary">Save work</button>
      ${work._new ? '' : '<button type="button" id="w-delete">Delete</button>'}
    </div>
  `

  const sectionsEl = form.querySelector('#w-sections')
  const sections = [...(work.sections || [])]

  function renderSections() {
    sectionsEl.innerHTML = sections
      .map((sec, si) => {
        const trSec = Object.fromEntries((sec.translations || []).map((t) => [t.lang_code, t]))
        const st = trSec[activeLang] || { title: '', body: '' }
        const itemsHtml = (sec.items || [])
          .map(
            (it, ii) => `
          <div class="row">
            <select data-si="${si}" data-ii="${ii}" data-field="type">
              ${['text', 'image', 'local-video', 'video'].map((ty) => `<option ${it.type === ty ? 'selected' : ''}>${ty}</option>`).join('')}
            </select>
            <input data-si="${si}" data-ii="${ii}" data-field="src" placeholder="src path" value="${esc(it.src || '')}" />
            <label><input type="checkbox" data-si="${si}" data-ii="${ii}" data-field="filter" ${it.filter ? 'checked' : ''} /> filter</label>
            <button type="button" data-remove-item="${si}:${ii}">×</button>
          </div>`
          )
          .join('')
        return `
        <div class="section-card" data-si="${si}">
          <label>Key <input data-sec="key" value="${esc(sec.section_key || '')}" /></label>
          <label>Direction <input data-sec="direction" value="${esc(sec.direction || '')}" placeholder="row | row-reverse" /></label>
          <label>Section title (${activeLang}) <input data-sec="title" value="${esc(st.title || '')}" /></label>
          <label>Section text (${activeLang}) <textarea data-sec="body">${esc(st.body || '')}</textarea></label>
          <div>${itemsHtml}</div>
          <button type="button" data-add-item="${si}">Add item</button>
          <button type="button" data-remove-section="${si}">Remove section</button>
        </div>`
      })
      .join('')
    bindSectionEvents()
  }

  function bindSectionEvents() {
    sectionsEl.querySelectorAll('[data-sec]').forEach((el) => {
      el.addEventListener('input', () => {
        const card = el.closest('[data-si]')
        const si = Number(card.dataset.si)
        const field = el.dataset.sec
        if (field === 'key') sections[si].section_key = el.value
        else if (field === 'direction') sections[si].direction = el.value
        else if (field === 'title' || field === 'body') {
          sections[si].translations = sections[si].translations || []
          let tr = sections[si].translations.find((t) => t.lang_code === activeLang)
          if (!tr) {
            tr = { lang_code: activeLang, title: '', body: '' }
            sections[si].translations.push(tr)
          }
          tr[field] = el.value
        }
      })
    })
    sectionsEl.querySelectorAll('[data-field]').forEach((el) => {
      el.addEventListener('change', () => {
        const si = Number(el.dataset.si)
        const ii = Number(el.dataset.ii)
        const field = el.dataset.field
        sections[si].items[ii][field] = field === 'filter' ? el.checked : el.value
      })
      el.addEventListener('input', () => {
        if (el.dataset.field === 'src') {
          const si = Number(el.dataset.si)
          const ii = Number(el.dataset.ii)
          sections[si].items[ii].src = el.value
        }
      })
    })
    sectionsEl.querySelectorAll('[data-add-item]').forEach((b) =>
      b.addEventListener('click', () => {
        const si = Number(b.dataset.addItem)
        sections[si].items = sections[si].items || []
        sections[si].items.push({ type: 'text', src: '', filter: 0 })
        renderSections()
      })
    )
    sectionsEl.querySelectorAll('[data-remove-item]').forEach((b) =>
      b.addEventListener('click', () => {
        const [si, ii] = b.dataset.removeItem.split(':').map(Number)
        sections[si].items.splice(ii, 1)
        renderSections()
      })
    )
    sectionsEl.querySelectorAll('[data-remove-section]').forEach((b) =>
      b.addEventListener('click', () => {
        sections.splice(Number(b.dataset.removeSection), 1)
        renderSections()
      })
    )
  }

  renderSections()

  form.querySelector('#w-add-section').addEventListener('click', () => {
    sections.push({
      section_key: 'section',
      direction: 'row',
      items: [{ type: 'text', src: '', filter: 0 }],
      translations: languages.map((l) => ({ lang_code: l.code, title: '', body: '' })),
    })
    renderSections()
  })

  const langFields = form.querySelector('#w-lang-fields')
  form.querySelectorAll('#w-lang-tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      syncTranslationsFromDom()
      activeLang = btn.dataset.lang
      form.querySelectorAll('#w-lang-tabs button').forEach((b) => b.classList.toggle('active', b === btn))
      langFields.innerHTML = renderLangFields()
      bindTrInputs()
      renderSections()
    })
  })

  function syncTranslationsFromDom() {
    langFields.querySelectorAll('[data-tr]').forEach((el) => {
      const key = el.dataset.tr
      let tr = translations.find((t) => t.lang_code === activeLang)
      if (!tr) {
        tr = { lang_code: activeLang }
        translations.push(tr)
      }
      tr[key] = el.value
    })
  }

  function bindTrInputs() {
    langFields.querySelectorAll('[data-tr]').forEach((el) => {
      el.addEventListener('input', () => {
        const key = el.dataset.tr
        let tr = translations.find((t) => t.lang_code === activeLang)
        if (!tr) {
          tr = { lang_code: activeLang }
          translations.push(tr)
        }
        tr[key] = el.value
      })
    })
  }
  bindTrInputs()

  form.querySelector('#w-save').addEventListener('click', async () => {
    syncTranslationsFromDom()
    const slug = form.querySelector('#w-slug').value.trim()
    const payload = {
      slug,
      year: form.querySelector('#w-year').value.trim(),
      url: form.querySelector('#w-url').value.trim(),
      sort_order: Number(form.querySelector('#w-sort').value) || 0,
      roles: form
        .querySelector('#w-roles')
        .value.split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      translations,
      sections,
    }
    try {
      if (work._new) await api('/api/works', { method: 'POST', body: JSON.stringify(payload) })
      else await api(`/api/works/${slug}`, { method: 'PUT', body: JSON.stringify(payload) })
      toast('Work saved')
      work._new = false
      currentWork = payload
      await loadWorksList()
    } catch (e) {
      toast(e.message)
    }
  })

  const delBtn = form.querySelector('#w-delete')
  if (delBtn) {
    delBtn.addEventListener('click', async () => {
      if (!confirm('Delete this work?')) return
      await api(`/api/works/${work.slug}`, { method: 'DELETE' })
      form.classList.add('hidden')
      await loadWorksList()
      toast('Deleted')
    })
  }
}

async function openWork(slug) {
  currentWork = await api(`/api/works/${slug}`)
  renderWorkForm(currentWork)
}

document.getElementById('btn-new-work').addEventListener('click', () => {
  renderWorkForm({
    _new: true,
    slug: 'new-project',
    year: new Date().getFullYear().toString(),
    url: '',
    sort_order: 99,
    roles: [],
    translations: emptyTranslation(),
    sections: [],
  })
})

async function loadClientsList() {
  const clients = await api('/api/clients')
  const ul = document.getElementById('clients-list')
  ul.innerHTML = clients
    .map((c) => `<li><button type="button" data-slug="${c.slug}">${c.slug}</button></li>`)
    .join('')
  ul.querySelectorAll('button').forEach((b) =>
    b.addEventListener('click', () => openClient(b.dataset.slug))
  )
}

function renderClientForm(client) {
  const form = document.getElementById('client-form')
  form.classList.remove('hidden')
  const trMap = Object.fromEntries((client.translations || []).map((t) => [t.lang_code, t]))
  let activeLang = languages[0]?.code || 'en'

  form.innerHTML = `
    <h2>${esc(client.slug)}</h2>
    <label>Slug <input id="c-slug" value="${esc(client.slug)}" ${client._new ? '' : 'readonly'} /></label>
    <label>URL <input id="c-url" value="${esc(client.url || '')}" /></label>
    <div class="lang-tabs" id="c-lang-tabs">
      ${languages.map((l) => `<button type="button" data-lang="${l.code}" class="${l.code === activeLang ? 'active' : ''}">${l.code}</button>`).join('')}
    </div>
    <div class="field-grid" id="c-fields"></div>
    <label>Logo (PNG) <input type="file" id="c-logo" accept="image/png" /></label>
    <div class="actions">
      <button type="button" id="c-save" class="primary">Save</button>
      ${client._new ? '' : '<button type="button" id="c-delete">Delete</button>'}
    </div>
  `

  const translations = languages.map((l) => ({
    lang_code: l.code,
    ...(trMap[l.code] || { nav_label: '', title: '', subtitle: '' }),
  }))

  const fields = form.querySelector('#c-fields')
  const renderFields = () => {
    const t = translations.find((x) => x.lang_code === activeLang)
    fields.innerHTML = `
      <label>Nav label <input id="c-nav" value="${esc(t.nav_label || '')}" /></label>
      <label>Title <input id="c-title" value="${esc(t.title || '')}" /></label>
      <label>Subtitle <input id="c-sub" value="${esc(t.subtitle || '')}" /></label>`
  }
  renderFields()

  form.querySelectorAll('#c-lang-tabs button').forEach((btn) => {
    btn.addEventListener('click', () => {
      syncClientTr()
      activeLang = btn.dataset.lang
      form.querySelectorAll('#c-lang-tabs button').forEach((b) => b.classList.toggle('active', b === btn))
      renderFields()
    })
  })

  function syncClientTr() {
    const t = translations.find((x) => x.lang_code === activeLang)
    if (!t) return
    const nav = form.querySelector('#c-nav')
    if (nav) {
      t.nav_label = nav.value
      t.title = form.querySelector('#c-title').value
      t.subtitle = form.querySelector('#c-sub').value
    }
  }

  form.querySelector('#c-save').addEventListener('click', async () => {
    syncClientTr()
    const slug = form.querySelector('#c-slug').value.trim()
    const payload = {
      slug,
      url: form.querySelector('#c-url').value.trim(),
      sort_order: client.sort_order ?? 0,
      translations,
    }
    if (client._new) await api('/api/clients', { method: 'POST', body: JSON.stringify(payload) })
    else await api(`/api/clients/${slug}`, { method: 'PUT', body: JSON.stringify(payload) })
    const file = form.querySelector('#c-logo').files[0]
    if (file) {
      const body = new FormData()
      body.append('file', file)
      await fetch(`/api/clients/${slug}/logo`, { method: 'POST', body })
    }
    toast('Client saved')
    await loadClientsList()
  })

  const del = form.querySelector('#c-delete')
  if (del) {
    del.addEventListener('click', async () => {
      if (!confirm('Delete client?')) return
      await api(`/api/clients/${client.slug}`, { method: 'DELETE' })
      form.classList.add('hidden')
      await loadClientsList()
    })
  }
}

async function openClient(slug) {
  renderClientForm(await api(`/api/clients/${slug}`))
}

document.getElementById('btn-new-client').addEventListener('click', () => {
  renderClientForm({
    _new: true,
    slug: 'new-client',
    url: '',
    sort_order: 99,
    translations: languages.map((l) => ({
      lang_code: l.code,
      nav_label: '',
      title: '',
      subtitle: '',
    })),
  })
})

let stringRows = []

async function loadStringsEditor() {
  const lang = document.getElementById('strings-lang').value
  const prefix = document.getElementById('strings-prefix').value
  stringRows = await api(`/api/strings?lang=${encodeURIComponent(lang)}&prefix=${encodeURIComponent(prefix)}`)
  const box = document.getElementById('strings-editor')
  box.innerHTML = stringRows
    .map(
      (row, i) => `
    <div class="string-row">
      <code>${esc(row.key)}</code>
      <textarea data-i="${i}">${esc(row.value)}</textarea>
    </div>`
    )
    .join('')
}

document.getElementById('strings-load').addEventListener('click', loadStringsEditor)
document.getElementById('strings-save').addEventListener('click', async () => {
  const lang = document.getElementById('strings-lang').value
  const entries = []
  document.querySelectorAll('#strings-editor textarea').forEach((ta) => {
    const i = Number(ta.dataset.i)
    entries.push({ lang, key: stringRows[i].key, value: ta.value })
  })
  await api('/api/strings', { method: 'PUT', body: JSON.stringify({ entries }) })
  toast('Strings saved')
})

function esc(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/"/g, '&quot;')
}

;(async () => {
  await loadLanguages()
  await loadWorksList()
  await loadClientsList()
})()
