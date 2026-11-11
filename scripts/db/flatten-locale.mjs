export function flattenLocale(obj, prefix = '') {
  const out = {}
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flattenLocale(value, path))
    } else {
      out[path] = value === undefined || value === null ? '' : String(value)
    }
  }
  return out
}
