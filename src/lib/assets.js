/**
 * Resolve the asset paths stored in the extracted content model
 * (e.g. "images/destinations/barbados.jpg") to hashed build URLs.
 *
 * The content model is plain JSON, so it can't hold ES imports. Vite's
 * import.meta.glob gives us an eager map of every asset at build time,
 * which keeps hashing, and tree-shaking of unused files, intact.
 */
const modules = import.meta.glob('../assets/**/*.{png,jpg,jpeg,svg,webp}', {
  eager: true,
  import: 'default',
})

const byPath = Object.fromEntries(
  Object.entries(modules).map(([key, url]) => [
    key.replace('../assets/', ''),
    url,
  ])
)

export function assetUrl(path) {
  if (!path) return undefined
  const hit = byPath[path]
  if (!hit && import.meta.env.DEV) {
    console.warn(`[assets] missing: ${path}`)
  }
  return hit
}

export default assetUrl
