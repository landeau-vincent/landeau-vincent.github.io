import initSqlJs, { type Database, type SqlValue } from 'sql.js'
import wasmUrl from 'sql.js/dist/sql-wasm.wasm?url'
import browserWasmUrl from 'sql.js/dist/sql-wasm-browser.wasm?url'

let database: Database | null = null

export function portfolioDatabaseUrl(): string {
  if (import.meta.env.DEV) {
    return `${window.location.origin}/portfolio.sqlite`
  }
  return new URL('portfolio.sqlite', import.meta.env.BASE_URL).href
}

async function openPortfolioDatabase(): Promise<Database> {
  if (database) return database

  const [SQL, response] = await Promise.all([
    initSqlJs({
      locateFile: (file) => (file.includes('browser') ? browserWasmUrl : wasmUrl),
    }),
    fetch(portfolioDatabaseUrl()),
  ])
  if (!response.ok) {
    throw new Error(`Could not fetch portfolio database (${response.status})`)
  }

  database = new SQL.Database(new Uint8Array(await response.arrayBuffer()))
  return database
}

export async function queryAll<T extends Record<string, unknown>>(
  sql: string,
  params: SqlValue[] = []
): Promise<T[]> {
  const db = await openPortfolioDatabase()
  const statement = db.prepare(sql)
  try {
    if (params.length) statement.bind(params)
    const columns = statement.getColumnNames()
    const rows: T[] = []
    while (statement.step()) {
      const values = statement.get()
      const row: Record<string, unknown> = {}
      columns.forEach((column, index) => {
        row[column] = values[index]
      })
      rows.push(row as T)
    }
    return rows
  } finally {
    statement.free()
  }
}
