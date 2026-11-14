// Plain HTML that generate-og-pages.mjs writes inside <div id="root"> of each
// generated page. Most AI crawlers don't run JavaScript, so without this they
// see only the <head>. React's createRoot (src/main.tsx) replaces it all on
// load, so it never has to match React's markup; it only has to say the same
// things. When a page's text or structure changes in src/pages, update it here.
import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { returnAddressOneLine } from '../../src/data/returnAddress.ts'

const translationsPath = path.resolve(import.meta.dirname, '..', '..', 'src', 'locales', 'sv', 'translation.json')
const strings = JSON.parse(await readFile(translationsPath, 'utf8'))

const email = 'kristian@svampskogen.com'
const instagramUrl = 'https://instagram.com/svampskogen_malmo'

export function escapeHtml(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

// The Swedish string for a translation key, escaped. Throws on a missing key or
// an unfilled {{placeholder}}, so a renamed key fails the build instead of
// shipping a blank or a literal "{{address}}".
function t(key, values = {}) {
  const text = strings[key]
  if (typeof text !== 'string') throw new Error(`Missing translation key: ${key}`)
  const filled = text.replace(/\{\{(\w+)\}\}/g, (match, name) => {
    if (!(name in values)) throw new Error(`No value for {{${name}}} in ${key}`)
    return values[name]
  })
  return escapeHtml(filled)
}

// Same format as src/lib/formatPrice.ts ("395 kr").
export function formatPrice(amountOre) {
  return new Intl.NumberFormat('sv-SE', { style: 'currency', currency: 'SEK', maximumFractionDigits: 0 }).format(
    amountOre / 100,
  )
}

const paragraphs = (...keys) => keys.map((key) => `<p>${t(key)}</p>`).join('\n')

// Catalog descriptions separate paragraphs with a blank line.
function descriptionHtml(text) {
  return text
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map((block) => `<p>${escapeHtml(block).replace(/\n/g, '<br />')}</p>`)
    .join('\n')
}

const hoursList = `<ul>
<li>${t('hours_days_1')}</li>
<li>${t('hours_days_2')}</li>
<li>${t('hours_days_3')}</li>
<li>${t('hours_days_4')}</li>
</ul>`

// The base styles in index.css (font, background, colors) already apply, since
// the stylesheet loads in <head>. This only puts back the spacing its reset
// removes, for the moment before React renders. React's render removes it too.
const style = `<style>
#static-page { max-width: 40rem; margin: 0 auto; padding: 1.5rem 1rem 3rem; line-height: 1.6; }
#static-page h1, #static-page h2, #static-page h3, #static-page p, #static-page ul, #static-page address, #static-page img { margin-bottom: 0.75rem; }
#static-page header { margin-bottom: 1.5rem; }
#static-page h2, #static-page h3 { margin-top: 1.5rem; }
#static-page ul { padding-left: 1.25rem; }
#static-page nav a { margin-right: 1rem; }
#static-page img { display: block; max-width: 100%; height: auto; }
#static-page address { font-style: normal; }
#static-page a { color: inherit; }
</style>`

const header = `<header>
<p><a href="/">Svampskogen</a>, ${t('subtitle')}</p>
<nav>
<a href="/">${t('nav_store')}</a>
<a href="/about">${t('nav_about')}</a>
<a href="/course">${t('nav_course')}</a>
<a href="/returns">${t('footer_returns_link')}</a>
</nav>
</header>`

// Mirrors src/components/SiteFooter.tsx.
const footer = `<footer>
<h2>${t('hours_heading')}</h2>
${hoursList}
<h2>${t('footer_company_heading')}</h2>
<address>Svampstugan AB (Svampskogen)<br />
Claesgatan 8, 214 26 Malmö<br />
Org.nr 559583-9159<br />
${t('company_vat_label')} SE559583915901<br />
<a href="mailto:${email}">${email}</a></address>
<h2>${t('footer_links_heading')}</h2>
<ul>
<li><a href="/returns">${t('footer_returns_link')}</a></li>
<li><a href="/withdraw">${t('withdraw_link')}</a></li>
<li><a href="/privacy">${t('footer_privacy_link')}</a></li>
</ul>
</footer>`

function wrap(main) {
  return `${style}
<div id="static-page">
${header}
<main>
${main}
</main>
${footer}
</div>`
}

// The front page lists what src/lib/storeListing.ts shows: in-stock products,
// grouped under the categories that have any, in catalog order.
export function storeBody(products, categories) {
  const inStock = products.filter((product) => product.inStock)
  const groups = categories
    .map((category) => ({ name: category.name.sv, items: inStock.filter((product) => product.category === category.id) }))
    .filter((group) => group.items.length > 0)
  const uncategorized = inStock.filter((product) => !categories.some((category) => category.id === product.category))
  if (uncategorized.length > 0) groups.push({ name: 'Övrigt', items: uncategorized })

  const sections = groups
    .map(
      (group) => `<h3>${escapeHtml(group.name)}</h3>
<ul>
${group.items
  .map((product) => `<li><a href="/store/${product.slug}">${escapeHtml(product.name.sv)}</a>, ${formatPrice(product.priceOre)}</li>`)
  .join('\n')}
</ul>`,
    )
    .join('\n')

  return wrap(`<h1>Svampskogen</h1>
<p>${t('subtitle')}. Webbutik och butik på Claesgatan 8 i Mitt Möllan, Malmö, med leverans i hela Sverige.</p>
${paragraphs('about_p1', 'about_p2')}
<h2>${t('store_heading')}</h2>
${sections}`)
}

export function productBody(product, categoryName, photo) {
  const image = photo
    ? `<img src="/${photo.path}" alt="${escapeHtml(product.name.sv)}" width="${photo.width}" height="${photo.height}" />`
    : ''
  const variants = (product.variants ?? [])
    .map(
      (variant) =>
        `<li>${escapeHtml(variant.name.sv)}: ${variant.options.map((option) => escapeHtml(option.name.sv)).join(', ')}</li>`,
    )
    .join('\n')

  return wrap(`<p><a href="/">${t('back_to_store')}</a>${categoryName ? `, ${escapeHtml(categoryName)}` : ''}</p>
<h1>${escapeHtml(product.name.sv)}</h1>
${image}
<p>${formatPrice(product.priceOre)}. ${product.inStock ? 'I lager.' : 'Slut i lager.'}</p>
${variants ? `<ul>\n${variants}\n</ul>` : ''}
${descriptionHtml(product.description.sv)}
<p>Leverans med DHL i hela Sverige, eller hämta i butiken på Claesgatan 8 i Malmö. 14 dagars ångerrätt, se <a href="/returns">${t('footer_returns_link').toLowerCase()}</a>.</p>`)
}

export const aboutBody = () =>
  wrap(`<h1>${t('about_heading')}</h1>
${paragraphs('about_p1', 'about_p2', 'about_p3')}
<h2>${t('suppliers_heading')}</h2>
${paragraphs('suppliers_p1')}
<p><a href="mailto:${email}">${email}</a><br />
<a href="${instagramUrl}">Instagram: @svampskogen_malmo</a></p>`)

export const courseBody = () =>
  wrap(`<h1>${t('course_page_heading')}</h1>
${paragraphs('course_season_over')}
<p>${t('course_notify')} <a href="mailto:${email}">${email}</a>.</p>`)

// Mirrors src/pages/ReturnsPage.tsx. The withdrawal form's blank lines become a
// list of what to fill in.
export const returnsBody = () =>
  wrap(`<h1>${t('returns_heading')}</h1>
${paragraphs('returns_intro')}
<p><a href="/withdraw">${t('withdraw_link')}</a></p>
<h2>${t('returns_withdrawal_heading')}</h2>
${paragraphs('returns_withdrawal_p1', 'returns_withdrawal_p2', 'returns_withdrawal_p3')}
<h2>${t('returns_how_heading')}</h2>
<p>${t('returns_how_p1')}</p>
<p>${t('returns_how_p2', { address: returnAddressOneLine })}</p>
<p>${t('returns_how_p3')}</p>
<h2>${t('returns_form_heading')}</h2>
${paragraphs('returns_form_intro')}
<address>Svampstugan AB (Svampskogen)<br />
Claesgatan 8, 214 26 Malmö<br />
retur@svampskogen.com</address>
${paragraphs('returns_form_statement')}
<ul>
${['returns_form_ordered_on', 'returns_form_received_on', 'returns_form_name', 'returns_form_address', 'returns_form_signature', 'returns_form_date']
  .map((key) => `<li>${t(key)}:</li>`)
  .join('\n')}
</ul>
<h2>${t('returns_complaint_heading')}</h2>
${paragraphs('returns_complaint_p1', 'returns_complaint_p2')}
<h2>${t('returns_purchase_heading')}</h2>
${paragraphs('returns_purchase_p1', 'returns_purchase_p2', 'returns_purchase_p3')}
<h2>${t('returns_company_heading')}</h2>
<address>Svampstugan AB (Svampskogen)<br />
Org.nr 559583-9159<br />
${t('company_vat_label')} SE559583915901<br />
Claesgatan 8, 214 26 Malmö<br />
${email}</address>
<h2>${t('returns_dispute_heading')}</h2>
${paragraphs('returns_dispute_p1')}
<p><a href="https://www.arn.se">${t('returns_dispute_arn_link')}</a></p>`)

// Same sections as src/pages/PrivacyPage.tsx.
const privacySections = [
  ['privacy_controller_heading', 'privacy_controller_p1'],
  ['privacy_data_heading', 'privacy_data_p1', 'privacy_data_p2', 'privacy_data_p3', 'privacy_data_p4'],
  ['privacy_purpose_heading', 'privacy_purpose_p1', 'privacy_purpose_p2', 'privacy_purpose_p3', 'privacy_purpose_p4'],
  ['privacy_recipients_heading', 'privacy_recipients_p1', 'privacy_recipients_p2'],
  ['privacy_transfers_heading', 'privacy_transfers_p1'],
  ['privacy_retention_heading', 'privacy_retention_p1', 'privacy_retention_p2'],
  ['privacy_storage_heading', 'privacy_storage_p1'],
  ['privacy_rights_heading', 'privacy_rights_p1', 'privacy_rights_p2'],
]

export const privacyBody = () =>
  wrap(`<h1>${t('privacy_heading')}</h1>
${paragraphs('privacy_intro', 'privacy_updated')}
${privacySections.map(([heading, ...keys]) => `<h2>${t(heading)}</h2>\n${paragraphs(...keys)}`).join('\n')}`)

// The page itself is a form that needs JavaScript; this just says what it is.
export const withdrawBody = () =>
  wrap(`<h1>${t('withdraw_heading')}</h1>
${paragraphs('withdraw_intro')}
<p>Formuläret kräver JavaScript. Du kan också ångra ditt köp genom att mejla <a href="mailto:retur@svampskogen.com">retur@svampskogen.com</a>.</p>`)
