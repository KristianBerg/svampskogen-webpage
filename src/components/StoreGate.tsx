import type { ReactNode } from 'react'
import StoreComingSoonPage from '../pages/StoreComingSoonPage'

export function StoreGate({ enabled, children }: { enabled: boolean; children: ReactNode }) {
  return enabled ? <>{children}</> : <StoreComingSoonPage />
}
