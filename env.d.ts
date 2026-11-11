/// <reference types="vite/client" />

declare module '*?url' {
  const src: string
  export default src
}

declare module 'sql.js' {
  export type SqlValue = string | number | null | Uint8Array

  export interface Statement {
    bind(values?: SqlValue[]): boolean
    step(): boolean
    get(): SqlValue[]
    getColumnNames(): string[]
    free(): boolean
  }

  export interface Database {
    prepare(sql: string): Statement
  }

  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number> | null) => Database
  }

  export default function initSqlJs(config?: {
    locateFile?: (file: string) => string
  }): Promise<SqlJsStatic>
}

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<object, object, unknown>
  export default component
}
