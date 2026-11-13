// Generates static HTML files for routes that need their own Open Graph
// preview (title/description/image) when shared on social media. GitHub
// Pages serves whatever file sits at a given path, and Facebook's crawler
// never executes JavaScript, so a per-route file with baked-in <meta> tags
// is the only way to get a distinct preview without running a server.
// React still hydrates the page normally for real visitors.
import { existsSync } from 'node:fs'
import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'
import sharp from 'sharp'

const distDir = path.resolve(import.meta.dirname, '..', 'dist')
const catalogPath = path.resolve(import.meta.dirname, '..', 'src', 'data', 'products.json')
const categoriesPath = path.resolve(import.meta.dirname, '..', 'src', 'data', 'categories.json')
const siteUrl = 'https://svampskogen.com'
const maxDescriptionLength = 160

// On since the store launched. Turn off to stop publishing a static page and
// sitemap entry per product.
const generateProductPages = true

const staticPages = [
  {
    route: 'course',
    outputFile: 'course/index.html',
    title: 'Kurser och turer – Svampskogen',
    description:
      'Säsongens svampkurser är avslutade. Nya kurser kommer under svampsäsongen 2027.',
    image: `${siteUrl}/og/course.jpg`,
  },
  // A .html file is served with 200 at the extensionless path, while a
  // directory URL gets a 301 to its trailing-slash form.
  {
    route: 'about',
    outputFile: 'about.html',
    title: 'Om oss – Svampskogen',
    description:
      'Svampskogen är en specialbutik för svampplockning och friluftsliv i Mitt Möllan i Malmö. Öppettider, kontakt och mer om butiken.',
    image: `${siteUrl}/og/home.jpg`,
  },
  {
    route: 'returns',
    outputFile: 'returns.html',
    title: 'Retur och villkor – Svampskogen',
    description: 'Ångerrätt, reklamation, leverans och köpvillkor för Svampskogens webbutik.',
    image: `${siteUrl}/og/home.jpg`,
  },
  {
    route: 'withdraw',
    outputFile: 'withdraw.html',
    title: 'Ångra köp – Svampskogen',
    description: 'Ångra ditt köp från Svampskogens webbutik.',
    image: `${siteUrl}/og/home.jpg`,
    // A form, not something anyone searches for. Also left out of the sitemap.
    noindex: true,
  },
  {
    route: 'privacy',
    outputFile: 'privacy.html',
    title: 'Integritetspolicy – Svampskogen',
    description: 'Så behandlar Svampskogen dina personuppgifter.',
    image: `${siteUrl}/og/home.jpg`,
  },
]

function replaceTag(html, pattern, replacement) {
  if (!pattern.test(html)) {
    throw new Error(`Expected to find ${pattern} in template`)
  }
  return html.replace(pattern, () => replacement)
}

// Names and descriptions come from the catalog and can contain quotes.
function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function productDescription(product) {
  const text = product.description.sv.replace(/\s+/g, ' ').trim()
  if (!text) {
    return `${product.name.sv} från Svampskogen, din butik i Malmö för svampplockning och friluftsliv.`
  }
  if (text.length <= maxDescriptionLength) return text

  const cut = text.slice(0, maxDescriptionLength - 1)
  const lastSpace = cut.lastIndexOf(' ')
  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).replace(/[\s,;:.]+$/, '')}…`
}

// Matches the policy on the returns page (src/locales/sv/translation.json,
// returns_*) and the DHL rate in src/data/shippingMethods.ts. Update together.
const shippingPriceSek = 60
const offerPolicies = {
  shippingDetails: {
    '@type': 'OfferShippingDetails',
    shippingRate: { '@type': 'MonetaryAmount', value: shippingPriceSek, currency: 'SEK' },
    shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'SE' },
    deliveryTime: {
      '@type': 'ShippingDeliveryTime',
      handlingTime: { '@type': 'QuantitativeValue', minValue: 0, maxValue: 4, unitCode: 'DAY' },
      transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
    },
  },
  hasMerchantReturnPolicy: {
    '@type': 'MerchantReturnPolicy',
    applicableCountry: 'SE',
    returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
    merchantReturnDays: 14,
    returnMethod: ['https://schema.org/ReturnByMail', 'https://schema.org/ReturnInStore'],
    returnFees: 'https://schema.org/ReturnFeesCustomerResponsibility',
    merchantReturnLink: `${siteUrl}/returns`,
  },
}

// Product photos are numbered 1-full.webp, 2-full.webp, ... (see src/lib/productImages.ts).
async function productPhotoPaths(slug) {
  const dir = path.join(distDir, 'products', slug)
  if (!existsSync(dir)) return []
  return (await readdir(dir))
    .map((file) => file.match(/^(\d+)-full\.webp$/))
    .filter(Boolean)
    .sort((a, b) => Number(a[1]) - Number(b[1]))
    .map((match) => `products/${slug}/${match[0]}`)
}

// schema.org Product markup, so search engines can show price and stock, and so
// crawlers that don't run JavaScript still get the full product facts.
function productJsonLd(product, url, photoPaths, categoryNames) {
  const data = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name.sv,
    description: product.description.sv.replace(/\s+/g, ' ').trim() || undefined,
    sku: product.slug,
    url,
    image: photoPaths.length > 0 ? photoPaths.map((photo) => `${siteUrl}/${photo}`) : undefined,
    category: categoryNames.get(product.category),
    offers: {
      '@type': 'Offer',
      url,
      price: (product.priceOre / 100).toFixed(2),
      priceCurrency: 'SEK',
      availability: product.inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      seller: { '@type': 'Organization', name: 'Svampskogen', url: `${siteUrl}/` },
      ...offerPolicies,
    },
  }
  // "<" is escaped so catalog text can never close the script tag.
  return JSON.stringify(data, null, 2).replace(/</g, '\\u003c')
}

// Same filter as src/data/products.ts, read as JSON because this runs under plain Node.
async function buildProductPages() {
  const catalog = JSON.parse(await readFile(catalogPath, 'utf8'))
  const categories = JSON.parse(await readFile(categoriesPath, 'utf8'))
  const categoryNames = new Map(categories.map((category) => [category.id, category.name.sv]))

  return Promise.all(
    catalog
      .filter((product) => product.published)
      .map(async (product) => {
        const page = {
          route: `store/${product.slug}`,
          // Not <slug>/index.html: Pages answers a directory URL with a 301 to the
          // trailing-slash form, which would redirect away from the canonical URL.
          // A .html file is served with 200 at the extensionless path.
          outputFile: `store/${product.slug}.html`,
          title: `${product.name.sv} – Svampskogen`,
          description: productDescription(product),
          image: `${siteUrl}/og/home.jpg`,
        }

        const photoPaths = await productPhotoPaths(product.slug)
        if (photoPaths.length > 0) {
          // The template declares home.jpg's 1200x630, which photos don't share.
          const { width, height } = await sharp(path.join(distDir, photoPaths[0])).metadata()
          page.image = `${siteUrl}/${photoPaths[0]}`
          page.imageSize = { width, height }
        }
        page.jsonLd = productJsonLd(product, `${siteUrl}/${page.route}`, photoPaths, categoryNames)
        return page
      }),
  )
}

// public/sitemap.xml lists the fixed routes. Product URLs are added here so the
// sitemap always matches the pages this script actually emitted.
async function addToSitemap(pages) {
  const sitemapPath = path.join(distDir, 'sitemap.xml')
  const entries = pages.map((page) => `  <url>\n    <loc>${siteUrl}/${page.route}</loc>\n  </url>\n`).join('')
  const sitemap = await readFile(sitemapPath, 'utf8')
  await writeFile(sitemapPath, replaceTag(sitemap, /<\/urlset>/, `${entries}</urlset>`))
}

async function main() {
  const template = await readFile(path.join(distDir, 'index.html'), 'utf8')
  const productPages = generateProductPages ? await buildProductPages() : []
  const pages = [...staticPages, ...productPages]

  for (const page of pages) {
    const url = `${siteUrl}/${page.route}`
    const title = escapeHtml(page.title)
    const description = escapeHtml(page.description)
    let html = template
    html = replaceTag(html, /<title>.*?<\/title>/, `<title>${title}</title>`)
    html = replaceTag(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`)
    html = replaceTag(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${description}" />`)
    html = replaceTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${title}" />`)
    html = replaceTag(
      html,
      /<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${description}" />`,
    )
    html = replaceTag(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
    html = replaceTag(html, /<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${page.image}" />`)
    if (page.imageSize) {
      html = replaceTag(html, /<meta property="og:image:width" content="[^"]*" \/>/, `<meta property="og:image:width" content="${page.imageSize.width}" />`)
      html = replaceTag(html, /<meta property="og:image:height" content="[^"]*" \/>/, `<meta property="og:image:height" content="${page.imageSize.height}" />`)
    }
    html = replaceTag(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${title}" />`)
    html = replaceTag(
      html,
      /<meta name="twitter:description" content="[^"]*" \/>/,
      `<meta name="twitter:description" content="${description}" />`,
    )
    html = replaceTag(html, /<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${page.image}" />`)
    if (page.noindex) {
      html = replaceTag(html, /<\/head>/, `  <meta name="robots" content="noindex" />\n  </head>`)
    }
    if (page.jsonLd) {
      html = replaceTag(html, /<\/head>/, `  <script type="application/ld+json">\n${page.jsonLd}\n    </script>\n  </head>`)
    }

    const outputPath = path.join(distDir, page.outputFile)
    await mkdir(path.dirname(outputPath), { recursive: true })
    await writeFile(outputPath, html)
  }

  await addToSitemap(productPages)
}

main()
