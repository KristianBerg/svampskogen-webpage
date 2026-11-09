// Fails the build if a catalog price is unusable. The type system already makes
// priceOre required; this catches values a type can't, since Stripe would accept
// 0 and sell the product for free. Must be whole kronor because the storefront
// doesn't show öre, so 4950 would display as 50 kr and charge 49.50.
// Also fails on a category id that doesn't exist, since the product would
// silently drop out of its category on the store.
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const dataDir = path.resolve(import.meta.dirname, '..', 'src', 'data')
const problems = []

const products = JSON.parse(await readFile(path.join(dataDir, 'products.json'), 'utf8'))
const categories = JSON.parse(await readFile(path.join(dataDir, 'categories.json'), 'utf8'))
const categoryIds = new Set(categories.map((category) => category.id))
for (const { slug, priceOre, category } of products) {
  if (!Number.isInteger(priceOre) || priceOre <= 0 || priceOre % 100 !== 0) {
    problems.push(`products.json: ${slug} has priceOre ${priceOre}, expected a positive whole number of kronor in öre`)
  }
  if (category !== undefined && !categoryIds.has(category)) {
    problems.push(`products.json: ${slug} has category ${category}, which isn't in categories.json`)
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'))
  process.exit(1)
}
