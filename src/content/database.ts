import { createDbWorker } from 'sql.js-httpvfs'
import workerUrl from 'sql.js-httpvfs/dist/sqlite.worker.js?url'
import wasmUrl from 'sql.js-httpvfs/dist/sql-wasm.wasm?url'

export type SqlWorker = Awaited<ReturnType<typeof createDbWorker>>

let dbWorker: SqlWorker | null = null

export function portfolioDatabaseUrl(): string {
  if (import.meta.env.DEV) {
    return `${window.location.origin}/portfolio.sqlite`
  }
  return new URL('portfolio.sqlite', import.meta.env.BASE_URL).href
}

export async function openPortfolioDatabase(): Promise<SqlWorker['db']> {
  if (dbWorker) return dbWorker.db

  const config = {
    from: 'inline' as const,
    config: {
      serverMode: 'full' as const,
      requestChunkSize: 4096,
      url: portfolioDatabaseUrl(),
    },
  }

  dbWorker = await createDbWorker([config], workerUrl, wasmUrl, 32 * 1024 * 1024)
  return dbWorker.db
}

type ExecResult = { columns: string[]; values: unknown[][] }

type ExecDb = {
  exec: (sql: string, params?: unknown[]) => Promise<ExecResult[]>
}

export async function queryAll<T extends Record<string, unknown>>(
  sql: string,
  params: unknown[] = []
): Promise<T[]> {
  const db = (await openPortfolioDatabase()) as unknown as ExecDb
  const result = await db.exec(sql, params)
  if (!result?.[0]) return []
  const { columns, values } = result[0]
  return values.map((row) => {
    const obj: Record<string, unknown> = {}
    columns.forEach((col, i) => {
      obj[col] = row[i]
    })
    return obj as T
  })
}
