PRAGMA journal_mode = DELETE;
PRAGMA page_size = 4096;

CREATE TABLE IF NOT EXISTS languages (
  code TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS strings (
  lang_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  key TEXT NOT NULL,
  value TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (lang_code, key)
);

CREATE TABLE IF NOT EXISTS works (
  slug TEXT PRIMARY KEY NOT NULL,
  year TEXT NOT NULL DEFAULT '',
  url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS work_translations (
  work_slug TEXT NOT NULL REFERENCES works(slug) ON DELETE CASCADE,
  lang_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  nav_label TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  description TEXT NOT NULL DEFAULT '',
  challenges TEXT NOT NULL DEFAULT '',
  solutions TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (work_slug, lang_code)
);

CREATE TABLE IF NOT EXISTS work_roles (
  work_slug TEXT NOT NULL REFERENCES works(slug) ON DELETE CASCADE,
  role_key TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (work_slug, role_key)
);

CREATE TABLE IF NOT EXISTS work_sections (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  work_slug TEXT NOT NULL REFERENCES works(slug) ON DELETE CASCADE,
  section_key TEXT NOT NULL,
  direction TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0,
  UNIQUE (work_slug, section_key)
);

CREATE TABLE IF NOT EXISTS work_section_items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  section_id INTEGER NOT NULL REFERENCES work_sections(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  src TEXT NOT NULL DEFAULT '',
  filter INTEGER NOT NULL DEFAULT 0,
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS work_section_translations (
  section_id INTEGER NOT NULL REFERENCES work_sections(id) ON DELETE CASCADE,
  lang_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  body TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (section_id, lang_code)
);

CREATE TABLE IF NOT EXISTS clients (
  slug TEXT PRIMARY KEY NOT NULL,
  url TEXT NOT NULL DEFAULT '',
  sort_order INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS client_translations (
  client_slug TEXT NOT NULL REFERENCES clients(slug) ON DELETE CASCADE,
  lang_code TEXT NOT NULL REFERENCES languages(code) ON DELETE CASCADE,
  nav_label TEXT NOT NULL DEFAULT '',
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT NOT NULL DEFAULT '',
  PRIMARY KEY (client_slug, lang_code)
);

CREATE INDEX IF NOT EXISTS idx_strings_key ON strings(key);
CREATE INDEX IF NOT EXISTS idx_work_sections_slug ON work_sections(work_slug);
