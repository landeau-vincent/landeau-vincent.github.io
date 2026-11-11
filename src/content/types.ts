export type WorkSectionItem = {
  type: string
  src?: string
  filter?: boolean
}

export type WorkSection = {
  direction?: string
  items: WorkSectionItem[]
}

export type WorkEntry = {
  'nav-label': string
  title: string
  subtitle: string
  date: string
  url: string
  roles: string[]
  sections: Record<string, WorkSection>
}

export type ClientEntry = {
  'nav-label': string
  title: string
  subtitle: string
  url: string
}
