import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

// Features gated while still in development. Visiting with ?<param>=<on>
// flips one on (persisted in localStorage so it survives future visits
// without the query param); ?<param>=<off> flips it back off.
const FLAGS = {
  store: { param: 'store', on: 'preview', off: 'off', storageKey: 'svampskogen_store_preview' },
  pickup: { param: 'pickup', on: 'enabled', off: 'disabled', storageKey: 'svampskogen_pickup_preview' },
} as const

type FlagName = keyof typeof FLAGS
export type PreviewFlags = Record<FlagName, boolean>

function readAndApplyFlag(params: URLSearchParams, name: FlagName): boolean {
  const { param, on, off, storageKey } = FLAGS[name]
  const value = params.get(param)
  if (value === on) {
    localStorage.setItem(storageKey, '1')
    return true
  }
  if (value === off) {
    localStorage.removeItem(storageKey)
    return false
  }
  return localStorage.getItem(storageKey) === '1'
}

// All flags are read in one hook so their query params get stripped in a
// single navigate; separate hooks would each navigate from the same original
// search and put the other's param back.
export function usePreviewFlags(): PreviewFlags {
  const location = useLocation()
  const navigate = useNavigate()
  const [flags] = useState<PreviewFlags>(() => {
    const params = new URLSearchParams(location.search)
    return { store: readAndApplyFlag(params, 'store'), pickup: readAndApplyFlag(params, 'pickup') }
  })

  useEffect(() => {
    const params = new URLSearchParams(location.search)
    const flagParams = Object.values(FLAGS).map((flag) => flag.param)
    if (!flagParams.some((param) => params.has(param))) return

    for (const param of flagParams) params.delete(param)
    const search = params.toString()
    navigate({ pathname: location.pathname, search: search ? `?${search}` : '' }, { replace: true })
    // Runs once on mount to strip the query params after readAndApplyFlag
    // above has already captured them into localStorage/initial state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return flags
}
