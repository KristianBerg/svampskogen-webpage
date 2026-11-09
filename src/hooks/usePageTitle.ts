import { useEffect } from 'react'

const SITE_NAME = 'Svampskogen'

// Keeps the tab title right during client-side navigation and language changes. Uses
// the same pattern as the static pages from scripts/generate-og-pages.mjs. The home
// page passes nothing and gets the bare site name.
export function usePageTitle(pageName?: string) {
  useEffect(() => {
    document.title = pageName ? `${pageName} – ${SITE_NAME}` : SITE_NAME
  }, [pageName])
}
