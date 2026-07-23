import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

const STORAGE_KEY = 'svampskogen_store_preview'

// The store is gated behind this while still in development. Visiting with
// ?store=preview flips it on (persisted in localStorage so it survives
// future visits without the query param); ?store=off flips it back off.
function readAndApplyFlag(search: string): boolean {
  const params = new URLSearchParams(search)
  const value = params.get('store')
  if (value === 'preview') {
    localStorage.setItem(STORAGE_KEY, '1')
    return true
  }
  if (value === 'off') {
    localStorage.removeItem(STORAGE_KEY)
    return false
  }
  return localStorage.getItem(STORAGE_KEY) === '1'
}

export function useStorePreview(): boolean {
  const location = useLocation()
  const navigate = useNavigate()
  const [enabled] = useState(() => readAndApplyFlag(location.search))

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (!params.has('store')) return

    params.delete('store')
    const search = params.toString()
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true })
    // Runs once on mount to strip the query param after readAndApplyFlag
    // above has already captured it into localStorage/initial state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return enabled
}
