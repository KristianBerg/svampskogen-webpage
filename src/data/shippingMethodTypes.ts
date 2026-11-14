export interface ShippingMethod {
  id: string
  // Same unit and role as Product.priceOre.
  priceOre: number
  // Charged like any product line item, so it needs its own VAT rate for the
  // Worker to resolve (see worker/src/index.ts).
  vatRate: number
  name: {
    sv: string
    en: string
  }
}

export interface FreeShippingOffer {
  // Products subtotal at or above which shipping is free.
  minSubtotalOre: number
  // ISO time with offset; the offer applies before this moment.
  endsAt: string
  // For copy such as "fri frakt t.o.m. 15 december".
  lastDay: {
    sv: string
    en: string
  }
}

// Pickup has no ShippingMethod entry: it's free and the same in both catalogs.
export type DeliveryMethod = 'shipping' | 'pickup'
