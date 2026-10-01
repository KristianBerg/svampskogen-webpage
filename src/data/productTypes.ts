export interface Product {
  slug: string
  stripePriceId: string
  vatRate: number
  inStock: boolean
  images: [string, ...string[]]
  name: {
    sv: string
    en: string
  }
  description: {
    sv: string
    en: string
  }
}
