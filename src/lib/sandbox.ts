// The Vite dev server is the only place the site runs against the Stripe
// sandbox; deployed builds use live Stripe and have anything gated on this
// compiled out.
export const isSandbox = import.meta.env.DEV
