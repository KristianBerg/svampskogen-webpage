// Builds dist/merchant-feed.xml, the product feed Google Merchant Center fetches
// for free Shopping listings and Shopping ads. generate-og-pages.mjs calls it on
// each build, so it always matches the catalog.
//
// Format: RSS 2.0 with Google's g: namespace
// (support.google.com/merchants/answer/7052112). Shipping and returns aren't in
// the feed: they're set once in Merchant Center's settings, which can also
// express the free-shipping-over-400-kr offer that a per-product value can't.
//
// One item per product. Variants (colour, embroidery) don't change the price,
// so they aren't split into separate items.

const maxDescriptionLength = 5000
const maxTitleLength = 150
const maxAdditionalImages = 10

function xmlEscape(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

// Book details are stored one per line ("Förlag: ..."), so lines within a
// paragraph are joined with semicolons and paragraphs with a space.
function plainDescription(product) {
  const text = product.description.sv
    .split(/\n\s*\n/)
    .map((block) =>
      block
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .join('; '),
    )
    .filter(Boolean)
    .join(' ')
  return (text || product.name.sv).slice(0, maxDescriptionLength)
}

// Own products have no barcode and no outside brand. Saying so stops Google
// from flagging them as missing a GTIN. Branded products without a known GTIN
// leave it out instead: claiming none exists when the maker assigned one can
// get the item disapproved.
function hasNoIdentifiers(product) {
  return !product.gtin && (!product.brand || product.brand === 'Svampskogen')
}

function item(product, { siteUrl, photoPaths, categoryName }) {
  const link = `${siteUrl}/store/${product.slug}`
  const images = photoPaths.map((photo) => `${siteUrl}/${photo}`)
  const fields = [
    ['g:id', product.slug],
    ['g:title', product.name.sv.slice(0, maxTitleLength)],
    ['g:description', plainDescription(product)],
    ['g:link', link],
    ['g:image_link', images[0]],
    ...images.slice(1, 1 + maxAdditionalImages).map((image) => ['g:additional_image_link', image]),
    ['g:availability', product.inStock ? 'in_stock' : 'out_of_stock'],
    ['g:price', `${(product.priceOre / 100).toFixed(2)} SEK`],
    ['g:condition', 'new'],
    ['g:brand', product.brand],
    ['g:gtin', product.gtin],
    ['g:identifier_exists', hasNoIdentifiers(product) ? 'no' : undefined],
    ['g:product_type', categoryName],
  ]
  const lines = fields
    .filter(([, value]) => value !== undefined)
    .map(([tag, value]) => `      <${tag}>${xmlEscape(String(value))}</${tag}>`)
  return `    <item>\n${lines.join('\n')}\n    </item>`
}

// products: published products. photoPathsBySlug: Map of slug to photo paths
// relative to the site root. Products without a photo are left out, since
// Google rejects an item with no image.
export function merchantFeed({ siteUrl, products, categories, photoPathsBySlug }) {
  const categoryNames = new Map(categories.map((category) => [category.id, category.name.sv]))
  const items = products
    .filter((product) => (photoPathsBySlug.get(product.slug) ?? []).length > 0)
    .map((product) =>
      item(product, {
        siteUrl,
        photoPaths: photoPathsBySlug.get(product.slug),
        categoryName: categoryNames.get(product.category),
      }),
    )
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>Svampskogen</title>
    <link>${siteUrl}/</link>
    <description>Produkter från Svampskogen, butik i Malmö för svampplockning och friluftsliv.</description>
${items.join('\n')}
  </channel>
</rss>
`
}
