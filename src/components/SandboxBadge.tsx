import styled from 'styled-components'

// The Vite dev server is the only place the site runs against the Stripe
// sandbox; deployed builds use live Stripe and have this compiled out.
const isSandbox = import.meta.env.DEV

const Badge = styled.div`
  position: fixed;
  top: 1.25rem;
  left: 0.75rem;
  z-index: 10;
  padding: 0.35rem 0.7rem;
  border-radius: 999px;
  background: #e0a526;
  color: #12140e;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  pointer-events: none;
`

export function SandboxBadge() {
  return isSandbox ? <Badge>Sandbox</Badge> : null
}
