export interface ShippingMethod {
  id: string
  stripePriceId: string
  // Charged like any product line item, so it needs its own VAT rate for the
  // Worker to resolve (see worker/src/index.ts).
  vatRate: number
  name: {
    sv: string
    en: string
  }
}
