// Fails the build if a catalog price is unusable. The type system already makes
// priceOre required; this catches values a type can't, since Stripe would accept
// 0 and sell the product for free. Must be whole kronor because the storefront
// doesn't show öre, so 4950 would display as 50 kr and charge 49.50.
import { readFile } from 'node:fs/promises'
import path from 'node:path'

const dataDir = path.resolve(import.meta.dirname, '..', 'src', 'data')
const problems = []

for (const file of ['products.live.json', 'products.sandbox.json']) {
  const products = JSON.parse(await readFile(path.join(dataDir, file), 'utf8'))
  for (const { slug, priceOre } of products) {
    if (!Number.isInteger(priceOre) || priceOre <= 0 || priceOre % 100 !== 0) {
      problems.push(`${file}: ${slug} has priceOre ${priceOre}, expected a positive whole number of kronor in öre`)
    }
  }
}

if (problems.length > 0) {
  console.error(problems.join('\n'))
  process.exit(1)
}
