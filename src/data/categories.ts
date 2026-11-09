import type { Category } from './productTypes'
import data from './categories.json'

// Lives in categories.json so the CMS can edit it as plain data. The order here
// is the order of the store's category buttons.
export const categories: Category[] = data
