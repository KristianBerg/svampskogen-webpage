import placeholderImage from '../assets/products/placeholder.svg'
import type { Product } from './productTypes'

// Live catalog, built up incrementally from the PayPal POS (Zettle) export.
// Entries below have real Stripe Price IDs but still need real marketing
// copy (name.en, description.sv/en) and real product photos.
export const products: Product[] = [
  {
    slug: 'notknappare',
    stripePriceId: 'price_1ULlXv09vQZGLxR7wyD2J7rh',
    vatRate: 0.25,
    inStock: true,
    images: [placeholderImage],
    name: {
      sv: 'Nötknäppare',
      en: 'TODO: write copy',
    },
    description: {
      sv: 'TODO: write copy',
      en: 'TODO: write copy',
    },
  },
  {
    slug: 'flaskkork-ekorre',
    stripePriceId: 'price_1ULlkK09vQZGLxR7ajghaWk6',
    vatRate: 0.25,
    inStock: true,
    images: [placeholderImage],
    name: {
      sv: 'Flaskkork – Ekorre',
      en: 'TODO: write copy',
    },
    description: {
      sv: 'TODO: write copy',
      en: 'TODO: write copy',
    },
  },
  {
    slug: 'flaskkork-groda',
    stripePriceId: 'price_1ULlkM09vQZGLxR7fV715Xdj',
    vatRate: 0.25,
    inStock: true,
    images: [placeholderImage],
    name: {
      sv: 'Flaskkork – Groda',
      en: 'TODO: write copy',
    },
    description: {
      sv: 'TODO: write copy',
      en: 'TODO: write copy',
    },
  },
  {
    slug: 'skrin-skata',
    stripePriceId: 'price_1ULlXy09vQZGLxR7z8K5Gsxu',
    vatRate: 0.25,
    inStock: true,
    images: [placeholderImage],
    name: {
      sv: 'Skrin skata',
      en: 'TODO: write copy',
    },
    description: {
      sv: 'TODO: write copy',
      en: 'TODO: write copy',
    },
  },
  {
    slug: 'svampkrok-kantarell',
    stripePriceId: 'price_1ULlkF09vQZGLxR7dSzAs50R',
    vatRate: 0.25,
    inStock: true,
    images: [placeholderImage],
    name: {
      sv: 'Svampkrok – Kantarell',
      en: 'TODO: write copy',
    },
    description: {
      sv: 'TODO: write copy',
      en: 'TODO: write copy',
    },
  },
  {
    slug: 'svampkrok-stensopp',
    stripePriceId: 'price_1ULlkH09vQZGLxR7o2cVaoY1',
    vatRate: 0.25,
    inStock: true,
    images: [placeholderImage],
    name: {
      sv: 'Svampkrok – Stensopp',
      en: 'TODO: write copy',
    },
    description: {
      sv: 'TODO: write copy',
      en: 'TODO: write copy',
    },
  },
  {
    slug: 'svampkrok-flugsvamp',
    stripePriceId: 'price_1ULlkJ09vQZGLxR73vY6ESHb',
    vatRate: 0.25,
    inStock: true,
    images: [placeholderImage],
    name: {
      sv: 'Svampkrok – Flugsvamp',
      en: 'TODO: write copy',
    },
    description: {
      sv: 'TODO: write copy',
      en: 'TODO: write copy',
    },
  },
]
