import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const wasmDir = join(dirname(fileURLToPath(import.meta.url)), '../../node_modules/sql.js/dist')

let SQL = null

export async function getSqlJs() {
  if (!SQL) {
    SQL = await initSqlJs({
      locateFile: (file) => join(wasmDir, file),
    })
  }
  return SQL
}

export async function openDatabase(dbPath) {
  const SQL = await getSqlJs()
  const fileBuffer = existsSync(dbPath) ? readFileSync(dbPath) : null
  const db = fileBuffer ? new SQL.Database(fileBuffer) : new SQL.Database()
  return db
}

export function saveDatabase(db, dbPath) {
  const data = db.export()
  writeFileSync(dbPath, Buffer.from(data))
}

export function runExec(db, sql) {
  db.run(sql)
}

export function runQuery(db, sql, params = []) {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject())
  }
  stmt.free()
  return rows
}

export function runOne(db, sql, params = []) {
  const rows = runQuery(db, sql, params)
  return rows[0] ?? null
}

export function execSchema(db, schemaPath) {
  const schema = readFileSync(schemaPath, 'utf8')
  db.run(schema)
}
