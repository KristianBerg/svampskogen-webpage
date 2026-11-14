// Builds dist/llms.txt (llmstxt.org): a Markdown summary of the site for
// language models, with links to every product and page. generate-og-pages.mjs
// calls it on each build, so it always matches the catalog.
//
// Business facts (address, hours, email) come from the Store JSON-LD in
// index.html, the same source search engines read.

const swedishDays = {
  Monday: 'måndag',
  Tuesday: 'tisdag',
  Wednesday: 'onsdag',
  Thursday: 'torsdag',
  Friday: 'fredag',
  Saturday: 'lördag',
  Sunday: 'söndag',
}

// Characters that would break a Markdown link label.
const markdownText = (text) => text.replace(/([[\]\\])/g, '\\$1')

const maxDescriptionLength = 300

// One line per product. Book details are stored as "Författare: ...", one per
// line, so lines within a paragraph are joined with semicolons.
function describe(product) {
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
  if (text.length <= maxDescriptionLength) return text
  const cut = text.slice(0, maxDescriptionLength - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.]+$/, '')}…`
}

const hour = (time) => time.replace(/^0?(\d+):00$/, '$1')

// [{dayOfWeek: ['Thursday', 'Friday'], opens: '11:00', closes: '18:00'}, ...]
// becomes "torsdag och fredag 11–18, lördag 11–17, söndag 12–16".
function formatHours(specs) {
  return specs
    .map((spec) => {
      const days = [spec.dayOfWeek].flat().map((day) => swedishDays[day] ?? day)
      const dayText = days.length > 1 ? `${days.slice(0, -1).join(', ')} och ${days.at(-1)}` : days[0]
      return `${dayText} ${hour(spec.opens)}–${hour(spec.closes)}`
    })
    .join(', ')
}

// Reads the Store JSON-LD out of the built index.html.
export function storeFromTemplate(html) {
  for (const match of html.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
    const data = JSON.parse(match[1])
    if (data['@type'] === 'Store') return data
  }
  throw new Error('No Store JSON-LD found in index.html')
}

export function llmsTxt({ siteUrl, store, products, categories, pages, shippingPriceSek, formatPrice }) {
  const { streetAddress, postalCode, addressLocality } = store.address
  const inStock = products.filter((product) => product.inStock)
  const groups = categories
    .map((category) => ({ name: category.name.sv, items: inStock.filter((product) => product.category === category.id) }))
    .filter((group) => group.items.length > 0)
  const uncategorized = inStock.filter((product) => !categories.some((category) => category.id === product.category))
  if (uncategorized.length > 0) groups.push({ name: 'Övrigt', items: uncategorized })

  const productSections = groups
    .map(
      (group) => `### ${group.name}

${group.items
  .map(
    (product) =>
      `- [${markdownText(product.name.sv)}](${siteUrl}/store/${product.slug}): ${[`${formatPrice(product.priceOre)}.`, describe(product)].filter(Boolean).join(' ')}`,
  )
  .join('\n')}`,
    )
    .join('\n\n')

  const pageLinks = pages
    .map((page) => `- [${markdownText(page.linkText)}](${siteUrl}/${page.route}): ${page.description}`)
    .join('\n')

  return `# Svampskogen

> Butik och webbutik i Malmö för svampplockning och friluftsliv. Odlingskit, plockpåsar, böcker, pyssel och presenter med naturen som tema, med leverans i hela Sverige.

Fysisk butik på ${streetAddress}, ${postalCode} ${addressLocality} (Mitt Möllan). Öppet ${formatHours(store.openingHoursSpecification)}.
Leverans med DHL inom Sverige för ${shippingPriceSek} kr, eller gratis upphämtning i butiken. 14 dagars ångerrätt.
Kontakt: ${store.email}

## Produkter

${productSections}

## Om butiken

- [Butiken](${siteUrl}/): alla produkter i webbutiken.
${pageLinks}
`
}
