// Local-only admin tool: lists products from products.json, lets you pick
// photos for one through the browser's file picker, and writes them into
// assets/<slug>/ in submission order. Existing photos can be reordered or
// deleted, which renumbers both the raw files and their processed webp
// outputs. Also lets you add a product (created unpublished), publish or
// unpublish one, and set its price,
// category, VAT rate, variants and Swedish/English name and description, which are
// written back into products.json. Store categories are managed in their own
// tab and written to categories.json. Those changes can then be committed
// to git from the same page (commit only, pushing stays a manual step).
// Never deployed, never exposed off this machine — the server only binds to 127.0.0.1.
import { execFile, spawn } from 'node:child_process'
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { promisify } from 'node:util'
import { SIZES } from '../lib/resizeProductImage.mjs'
import { SOURCE_EXTENSIONS } from '../lib/sourceExtensions.mjs'

const repoRoot = path.resolve(import.meta.dirname, '..', '..')
const rawDir = path.join(repoRoot, 'assets')
const publicProductsDir = path.join(repoRoot, 'public', 'products')
const indexHtmlPath = path.join(import.meta.dirname, 'index.html')
const productsPath = path.join(repoRoot, 'src', 'data', 'products.json')
const categoriesPath = path.join(repoRoot, 'src', 'data', 'categories.json')
const PORT = Number(process.env.CMS_PORT) || 4500

// Everything the CMS writes that's tracked in git. Commits are limited to
// these paths so unrelated work in the tree never gets swept in. assets/ is
// gitignored, so raw photos aren't part of this.
const CMS_PATHS = ['src/data/products.json', 'src/data/categories.json', 'src/data/productImageCounts.generated.ts', 'public/products']
const DEFAULT_COMMIT_MESSAGE = 'Update product catalog from the CMS'
const execFileAsync = promisify(execFile)

// Read per request (not cached) so hand edits to products.json show up
// without restarting the server.
async function loadLiveProducts() {
  return JSON.parse(await readFile(productsPath, 'utf8'))
}

async function loadCategories() {
  return JSON.parse(await readFile(categoriesPath, 'utf8'))
}

// The same 2-space format the files are stored in, so diffs only show the
// changed fields.
async function writeJson(filePath, data) {
  await writeFile(filePath, `${JSON.stringify(data, null, 2)}\n`)
}

// Matches the field order in productTypes.ts, so a field the uploader adds
// (e.g. a first category) lands where a hand-written entry would put it
// instead of at the end. Unknown fields keep their place after these.
const FIELD_ORDER = ['slug', 'priceOre', 'vatRate', 'published', 'inStock', 'category', 'name', 'description', 'variants']

function orderFields(product) {
  const ordered = {}
  for (const key of FIELD_ORDER) if (key in product) ordered[key] = product[key]
  return Object.assign(ordered, product)
}

async function updateLiveProduct(slug, update) {
  const products = await loadLiveProducts()
  const index = products.findIndex((product) => product.slug === slug)
  if (index === -1) throw new Error(`Unknown product slug: ${slug}`)
  products[index] = orderFields(update({ ...products[index] }))
  await writeJson(productsPath, products)
}

async function loadImageCounts() {
  const module = await import(`../../src/data/productImageCounts.generated.ts?t=${Date.now()}`)
  return module.productImageCounts
}

async function nextIndexFor(slug) {
  const dir = path.join(rawDir, slug)
  await mkdir(dir, { recursive: true })
  const files = await readdir(dir)
  const indices = files.map((file) => parseInt(file, 10)).filter((n) => !Number.isNaN(n))
  return indices.length > 0 ? Math.max(...indices) + 1 : 1
}

// Raw photos for a slug in the same order process-images.mjs numbers its
// outputs, so position i here is public/products/<slug>/<i+1>-*.webp.
async function listRawPhotos(slug) {
  const files = await readdir(path.join(rawDir, slug)).catch(() => [])
  return files
    .filter((file) => SOURCE_EXTENSIONS.has(path.extname(file).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }))
}

function sendJson(res, status, body) {
  const json = JSON.stringify(body)
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(json) })
  res.end(json)
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  return Buffer.concat(chunks)
}

async function handleGetProducts(res) {
  const [products, counts] = await Promise.all([loadLiveProducts(), loadImageCounts()])
  const list = products.map((product) => ({
    slug: product.slug,
    name: product.name.sv,
    category: product.category ?? null,
    published: product.published,
    priceOre: product.priceOre,
    vatRate: product.vatRate,
    imageCount: counts[product.slug] ?? 0,
    copy: { name: product.name, description: product.description },
    variants: product.variants ?? [],
  }))
  sendJson(res, 200, list)
}

async function handleUpload(req, res, slug) {
  const products = await loadLiveProducts()
  if (!products.some((product) => product.slug === slug)) {
    sendJson(res, 404, { error: `Unknown product slug: ${slug}` })
    return
  }

  const filename = req.headers['x-filename'] ?? ''
  const ext = path.extname(filename).toLowerCase()
  if (!SOURCE_EXTENSIONS.has(ext)) {
    sendJson(res, 400, { error: `Unsupported file type: ${ext || '(none)'}. Use jpg or png.` })
    return
  }

  const body = await readBody(req)
  const index = await nextIndexFor(slug)
  const outPath = path.join(rawDir, slug, `${index}${ext}`)
  await writeFile(outPath, body)
  sendJson(res, 200, { wrote: path.relative(repoRoot, outPath) })
}

async function handleGetPhotos(res, slug) {
  const photos = await listRawPhotos(slug)
  sendJson(res, 200, photos.map((file, index) => ({ n: index + 1, file })))
}

async function handleThumb(res, slug, n) {
  try {
    const body = await readFile(path.join(publicProductsDir, slug, `${n}-thumb.webp`))
    res.writeHead(200, { 'Content-Type': 'image/webp', 'Cache-Control': 'no-store' })
    res.end(body)
  } catch {
    sendJson(res, 404, { error: 'No thumbnail' })
  }
}

// Renames every `from` path to its `to` path via temporary names, so a swap
// (2 -> 1 while 1 -> 2) never overwrites a file that hasn't moved yet.
async function renameAll(moves) {
  const staged = []
  for (const [i, { from, to }] of moves.entries()) {
    const temp = path.join(path.dirname(from), `.reorder-${i}${path.extname(from)}`)
    await rename(from, temp)
    staged.push({ temp, to })
  }
  for (const { temp, to } of staged) await rename(temp, to)
}

// `order` lists the current photo numbers (1-based) in their new order;
// any number left out is deleted. Raw files are renumbered 1..n, and the
// processed webps are renamed to match instead of regenerated (rename keeps
// mtimes, so process-images still sees them as up to date). Deleted raw
// files go to assets/<slug>/.deleted/ rather than being removed outright,
// since assets/ is gitignored and they'd otherwise be gone for good.
async function handleSetPhotos(req, res, slug) {
  const products = await loadLiveProducts()
  if (!products.some((product) => product.slug === slug)) {
    sendJson(res, 404, { error: `Unknown product slug: ${slug}` })
    return
  }

  const photos = await listRawPhotos(slug)
  const { order } = JSON.parse((await readBody(req)).toString('utf8') || '{}')
  const valid =
    Array.isArray(order) &&
    order.every((n) => Number.isInteger(n) && n >= 1 && n <= photos.length) &&
    new Set(order).size === order.length
  if (!valid) {
    sendJson(res, 400, { error: 'Photo order is out of date or invalid. Reload and try again.' })
    return
  }

  const slugRawDir = path.join(rawDir, slug)
  const slugOutDir = path.join(publicProductsDir, slug)
  const kept = new Set(order)

  const deletedDir = path.join(slugRawDir, '.deleted')
  for (const [index, file] of photos.entries()) {
    const n = index + 1
    if (kept.has(n)) continue
    await mkdir(deletedDir, { recursive: true })
    await rename(path.join(slugRawDir, file), path.join(deletedDir, `${Date.now()}-${file}`))
    for (const variant of Object.keys(SIZES)) {
      await rm(path.join(slugOutDir, `${n}-${variant}.webp`), { force: true })
    }
  }

  const rawMoves = order.map((oldN, index) => {
    const file = photos[oldN - 1]
    return { from: path.join(slugRawDir, file), to: path.join(slugRawDir, `${index + 1}${path.extname(file)}`) }
  })
  await renameAll(rawMoves)

  const existingOutputs = new Set(await readdir(slugOutDir).catch(() => []))
  const outMoves = []
  for (const [index, oldN] of order.entries()) {
    for (const variant of Object.keys(SIZES)) {
      const from = `${oldN}-${variant}.webp`
      if (!existingOutputs.has(from)) continue
      outMoves.push({ from: path.join(slugOutDir, from), to: path.join(slugOutDir, `${index + 1}-${variant}.webp`) })
    }
  }
  await renameAll(outMoves)

  // process-images only writes outputs, so trailing numbers left over from
  // deleted photos have to be cleaned up here.
  for (let n = order.length + 1; n <= photos.length; n++) {
    for (const variant of Object.keys(SIZES)) {
      await rm(path.join(slugOutDir, `${n}-${variant}.webp`), { force: true })
    }
  }

  sendJson(res, 200, { count: order.length })
}

async function handleSetPublished(req, res, slug) {
  const products = await loadLiveProducts()
  if (!products.some((product) => product.slug === slug)) {
    sendJson(res, 404, { error: `Unknown product slug: ${slug}` })
    return
  }

  const { published } = JSON.parse((await readBody(req)).toString('utf8') || '{}')
  if (typeof published !== 'boolean') {
    sendJson(res, 400, { error: 'published must be true or false.' })
    return
  }

  await updateLiveProduct(slug, (product) => ({ ...product, published }))
  sendJson(res, 200, { published })
}

// Entered in whole kronor: the storefront doesn't show öre, so a price like
// 49.50 would display as 50 kr and charge 49.50. An upper limit catches typos.
const MAX_PRICE_KR = 99999
const PRICE_ERROR = `Price must be a whole number of kronor from 1 to ${MAX_PRICE_KR}.`

function isValidPriceKr(priceKr) {
  return Number.isInteger(priceKr) && priceKr >= 1 && priceKr <= MAX_PRICE_KR
}

async function handleSetPrice(req, res, slug) {
  const products = await loadLiveProducts()
  if (!products.some((product) => product.slug === slug)) {
    sendJson(res, 404, { error: `Unknown product slug: ${slug}` })
    return
  }

  const { priceKr } = JSON.parse((await readBody(req)).toString('utf8') || '{}')
  if (!isValidPriceKr(priceKr)) {
    sendJson(res, 400, { error: PRICE_ERROR })
    return
  }

  const priceOre = priceKr * 100
  await updateLiveProduct(slug, (product) => ({ ...product, priceOre }))
  sendJson(res, 200, { priceOre })
}

const UNKNOWN_CATEGORY_ERROR = 'That category no longer exists. Reload and try again.'

// An empty category means none, so only a non-empty one has to exist.
async function isAssignableCategory(category) {
  if (!category) return true
  return (await loadCategories()).some((entry) => entry.id === category)
}

async function handleSetCategory(req, res, slug) {
  const products = await loadLiveProducts()
  if (!products.some((product) => product.slug === slug)) {
    sendJson(res, 404, { error: `Unknown product slug: ${slug}` })
    return
  }

  const { category } = JSON.parse((await readBody(req)).toString('utf8') || '{}')
  if (!(await isAssignableCategory(category))) {
    sendJson(res, 400, { error: UNKNOWN_CATEGORY_ERROR })
    return
  }

  await updateLiveProduct(slug, (product) => {
    if (category) product.category = category
    else delete product.category
    return product
  })
  sendJson(res, 200, { category: category || null })
}

// Swedish VAT rates; the Worker maps each to a Stripe Tax Rate object, so
// anything outside this list would fail at checkout.
const VAT_RATES = [0.25, 0.12, 0.06]

async function handleSetVatRate(req, res, slug) {
  const products = await loadLiveProducts()
  if (!products.some((product) => product.slug === slug)) {
    sendJson(res, 404, { error: `Unknown product slug: ${slug}` })
    return
  }

  const { vatRate } = JSON.parse((await readBody(req)).toString('utf8') || '{}')
  if (!VAT_RATES.includes(vatRate)) {
    sendJson(res, 400, { error: `VAT rate must be one of ${VAT_RATES.join(', ')}.` })
    return
  }

  await updateLiveProduct(slug, (product) => ({ ...product, vatRate }))
  sendJson(res, 200, { vatRate })
}

const LANGS = ['sv', 'en']

// Names show up in headings, cart rows and the Stripe Checkout line item, so
// they must be a single non-empty line. Descriptions may span paragraphs.
function validateCopy(name, description) {
  for (const lang of LANGS) {
    if (typeof name?.[lang] !== 'string' || typeof description?.[lang] !== 'string') {
      return 'Name and description need both sv and en.'
    }
    if (!name[lang].trim() || /[\r\n]/.test(name[lang]) || name[lang].length > 120) {
      return `The ${lang} name must be a single line of 1 to 120 characters.`
    }
    if (description[lang].length > 5000) return `The ${lang} description is too long.`
  }
  return null
}

async function handleSetCopy(req, res, slug) {
  const products = await loadLiveProducts()
  if (!products.some((product) => product.slug === slug)) {
    sendJson(res, 404, { error: `Unknown product slug: ${slug}` })
    return
  }

  const { name, description } = JSON.parse((await readBody(req)).toString('utf8') || '{}')
  const error = validateCopy(name, description)
  if (error) {
    sendJson(res, 400, { error })
    return
  }

  const copy = {
    name: { sv: name.sv.trim(), en: name.en.trim() },
    description: { sv: description.sv.trim(), en: description.en.trim() },
  }
  await updateLiveProduct(slug, (product) => ({ ...product, ...copy }))
  sendJson(res, 200, copy)
}

// The slug becomes the product's URL (/store/<slug>) and its photo folder
// names, so it's kept to lowercase ASCII words joined by single hyphens.
const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const MAX_SLUG_LENGTH = 60

const MAX_VARIANT_NAME_LENGTH = 60

function isValidEntryName(name) {
  return LANGS.every(
    (lang) =>
      typeof name?.[lang] === 'string' &&
      name[lang].trim() !== '' &&
      !/[\r\n]/.test(name[lang]) &&
      name[lang].length <= MAX_VARIANT_NAME_LENGTH,
  )
}

// Ids are what saved carts, Stripe orders and products refer to, so each must
// be unique among its siblings. The browser keeps them stable when a name is edited.
function validateNamedEntries(entries, label) {
  if (!Array.isArray(entries)) return `${label}s must be a list.`
  for (const entry of entries) {
    if (typeof entry?.id !== 'string' || !SLUG_PATTERN.test(entry.id)) return `${label} has an invalid id.`
    if (!isValidEntryName(entry.name)) {
      return `Each ${label.toLowerCase()} needs a Swedish and English name, single line, at most ${MAX_VARIANT_NAME_LENGTH} characters.`
    }
  }
  if (new Set(entries.map((entry) => entry.id)).size !== entries.length) return `Two ${label.toLowerCase()}s share an id.`
  return null
}

function validateVariants(variants) {
  const categoryError = validateNamedEntries(variants, 'Category')
  if (categoryError) return categoryError
  for (const category of variants) {
    const optionError = validateNamedEntries(category.options, 'Option')
    if (optionError) return optionError
    // A category with nothing to pick would make the product impossible to buy.
    if (category.options.length === 0) return `${category.name.en} needs at least one option.`
  }
  return null
}

function normalizeNamedEntry({ id, name }) {
  return { id, name: { sv: name.sv.trim(), en: name.en.trim() } }
}

async function handleSetVariants(req, res, slug) {
  const products = await loadLiveProducts()
  if (!products.some((product) => product.slug === slug)) {
    sendJson(res, 404, { error: `Unknown product slug: ${slug}` })
    return
  }

  const { variants } = JSON.parse((await readBody(req)).toString('utf8') || '{}')
  const error = validateVariants(variants)
  if (error) {
    sendJson(res, 400, { error })
    return
  }

  const normalized = variants.map((category) => ({
    ...normalizeNamedEntry(category),
    options: category.options.map(normalizeNamedEntry),
  }))
  await updateLiveProduct(slug, (product) => {
    if (normalized.length > 0) product.variants = normalized
    else delete product.variants
    return product
  })
  sendJson(res, 200, { variants: normalized })
}

// Two categories with the same name would be indistinguishable, both in the
// CMS selector and as store buttons.
function validateCategories(categories) {
  const entryError = validateNamedEntries(categories, 'Category')
  if (entryError) return entryError
  for (const lang of LANGS) {
    const names = categories.map((category) => category.name[lang].trim().toLowerCase())
    if (new Set(names).size !== names.length) return `Two categories can't have the same ${lang} name.`
  }
  return null
}

async function saveCategories(res, categories, status = 200) {
  const error = validateCategories(categories)
  if (error) {
    sendJson(res, 400, { error })
    return
  }
  const normalized = categories.map(normalizeNamedEntry)
  await writeJson(categoriesPath, normalized)
  sendJson(res, status, normalized)
}

async function handleGetCategories(res) {
  sendJson(res, 200, await loadCategories())
}

async function handleCreateCategory(req, res) {
  const { id, name } = JSON.parse((await readBody(req)).toString('utf8') || '{}')
  await saveCategories(res, [...(await loadCategories()), { id, name }], 201)
}

async function handleUpdateCategory(req, res, id) {
  const categories = await loadCategories()
  if (!categories.some((category) => category.id === id)) {
    sendJson(res, 404, { error: UNKNOWN_CATEGORY_ERROR })
    return
  }
  const { name } = JSON.parse((await readBody(req)).toString('utf8') || '{}')
  await saveCategories(res, categories.map((category) => (category.id === id ? { id, name } : category)))
}

async function handleReorderCategories(req, res) {
  const categories = await loadCategories()
  const byId = new Map(categories.map((category) => [category.id, category]))
  const { order } = JSON.parse((await readBody(req)).toString('utf8') || '{}')
  const valid =
    Array.isArray(order) &&
    order.length === categories.length &&
    new Set(order).size === order.length &&
    order.every((id) => byId.has(id))
  if (!valid) {
    sendJson(res, 400, { error: 'Category order is out of date. Reload and try again.' })
    return
  }
  await saveCategories(res, order.map((id) => byId.get(id)))
}

// Products are cleared first, so stopping halfway can leave an unused
// category but never a product pointing at one that's gone.
async function handleDeleteCategory(res, id) {
  const categories = await loadCategories()
  if (!categories.some((category) => category.id === id)) {
    sendJson(res, 404, { error: UNKNOWN_CATEGORY_ERROR })
    return
  }
  const products = await loadLiveProducts()
  for (const product of products) {
    if (product.category === id) delete product.category
  }
  await writeJson(productsPath, products)
  await saveCategories(res, categories.filter((category) => category.id !== id))
}

// New products start unpublished with empty descriptions, so they can get
// photos and copy in the CMS before going on the store.
async function handleCreateProduct(req, res) {
  const { slug, priceKr, vatRate, category, name } = JSON.parse((await readBody(req)).toString('utf8') || '{}')

  if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug) || slug.length > MAX_SLUG_LENGTH) {
    sendJson(res, 400, { error: `Slug must be lowercase letters, digits and single hyphens, at most ${MAX_SLUG_LENGTH} characters.` })
    return
  }
  if (!isValidPriceKr(priceKr)) {
    sendJson(res, 400, { error: PRICE_ERROR })
    return
  }
  if (!VAT_RATES.includes(vatRate)) {
    sendJson(res, 400, { error: `VAT rate must be one of ${VAT_RATES.join(', ')}.` })
    return
  }
  if (!(await isAssignableCategory(category))) {
    sendJson(res, 400, { error: UNKNOWN_CATEGORY_ERROR })
    return
  }
  const description = { sv: '', en: '' }
  const copyError = validateCopy(name, description)
  if (copyError) {
    sendJson(res, 400, { error: copyError })
    return
  }

  const products = await loadLiveProducts()
  if (products.some((product) => product.slug === slug)) {
    sendJson(res, 409, { error: `A product with slug ${slug} already exists.` })
    return
  }

  const product = orderFields({
    slug,
    priceOre: priceKr * 100,
    vatRate,
    published: false,
    inStock: true,
    ...(category ? { category } : {}),
    name: { sv: name.sv.trim(), en: name.en.trim() },
    description,
  })
  products.push(product)
  await writeJson(productsPath, products)
  sendJson(res, 201, product)
}

async function handleProcess(res) {
  const child = spawn('node', [path.join(repoRoot, 'scripts', 'process-images.mjs')], { cwd: repoRoot })
  let output = ''
  child.stdout.on('data', (chunk) => (output += chunk))
  child.stderr.on('data', (chunk) => (output += chunk))
  child.on('close', (code) => {
    sendJson(res, code === 0 ? 200 : 500, { code, output })
  })
}

async function git(...args) {
  const { stdout } = await execFileAsync('git', args, { cwd: repoRoot })
  return stdout
}

async function listCmsChanges() {
  const output = await git('status', '--porcelain', '-z', '--no-renames', '--untracked-files=all', '--', ...CMS_PATHS)
  return output.split('\0').filter(Boolean).map((entry) => entry.slice(3))
}

async function handleGetChanges(res) {
  sendJson(res, 200, { files: await listCmsChanges() })
}

async function handleCommit(req, res) {
  const { message: raw } = JSON.parse((await readBody(req)).toString('utf8') || '{}')
  const message = (typeof raw === 'string' && raw.trim()) || DEFAULT_COMMIT_MESSAGE

  const files = await listCmsChanges()
  if (files.length === 0) {
    sendJson(res, 409, { error: 'Nothing to commit.' })
    return
  }

  try {
    await git('add', '-A', '--', ...CMS_PATHS)
    // The pathspec keeps anything else that happens to be staged out of this commit.
    await git('commit', '-m', message, '--', ...CMS_PATHS)
  } catch (error) {
    sendJson(res, 500, { error: (error.stderr || error.stdout || error.message).trim() })
    return
  }
  const hash = (await git('rev-parse', '--short', 'HEAD')).trim()
  sendJson(res, 200, { hash, count: files.length })
}

async function handleIndex(res) {
  const html = await readFile(indexHtmlPath, 'utf8')
  res.writeHead(200, { 'Content-Type': 'text/html' })
  res.end(html)
}

const server = createServer((req, res) => {
  const { pathname } = new URL(req.url, 'http://localhost')

  const run = async () => {
    if (req.method === 'GET' && pathname === '/') return handleIndex(res)
    if (req.method === 'GET' && pathname === '/api/products') return handleGetProducts(res)
    if (req.method === 'POST' && pathname === '/api/products') return handleCreateProduct(req, res)
    if (req.method === 'GET' && pathname === '/api/categories') return handleGetCategories(res)
    if (req.method === 'POST' && pathname === '/api/categories') return handleCreateCategory(req, res)
    if (req.method === 'POST' && pathname === '/api/categories/reorder') return handleReorderCategories(req, res)
    if (req.method === 'POST' && pathname === '/api/process') return handleProcess(res)
    if (req.method === 'GET' && pathname === '/api/changes') return handleGetChanges(res)
    if (req.method === 'POST' && pathname === '/api/commit') return handleCommit(req, res)

    const storeCategoryMatch = pathname.match(/^\/api\/categories\/([^/]+)$/)
    if (storeCategoryMatch && req.method === 'PUT') return handleUpdateCategory(req, res, decodeURIComponent(storeCategoryMatch[1]))
    if (storeCategoryMatch && req.method === 'DELETE') return handleDeleteCategory(res, decodeURIComponent(storeCategoryMatch[1]))

    const uploadMatch = req.method === 'POST' && pathname.match(/^\/api\/products\/([^/]+)\/upload$/)
    if (uploadMatch) return handleUpload(req, res, decodeURIComponent(uploadMatch[1]))

    const photosMatch = pathname.match(/^\/api\/products\/([^/]+)\/photos$/)
    if (photosMatch && req.method === 'GET') return handleGetPhotos(res, decodeURIComponent(photosMatch[1]))
    if (photosMatch && req.method === 'PUT') return handleSetPhotos(req, res, decodeURIComponent(photosMatch[1]))

    const thumbMatch = req.method === 'GET' && pathname.match(/^\/api\/products\/([^/]+)\/photos\/(\d+)\/thumb$/)
    if (thumbMatch) return handleThumb(res, decodeURIComponent(thumbMatch[1]), Number(thumbMatch[2]))

    const publishedMatch = req.method === 'PUT' && pathname.match(/^\/api\/products\/([^/]+)\/published$/)
    if (publishedMatch) return handleSetPublished(req, res, decodeURIComponent(publishedMatch[1]))

    const priceMatch = req.method === 'PUT' && pathname.match(/^\/api\/products\/([^/]+)\/price$/)
    if (priceMatch) return handleSetPrice(req, res, decodeURIComponent(priceMatch[1]))

    const categoryMatch = req.method === 'PUT' && pathname.match(/^\/api\/products\/([^/]+)\/category$/)
    if (categoryMatch) return handleSetCategory(req, res, decodeURIComponent(categoryMatch[1]))

    const vatRateMatch = req.method === 'PUT' && pathname.match(/^\/api\/products\/([^/]+)\/vat-rate$/)
    if (vatRateMatch) return handleSetVatRate(req, res, decodeURIComponent(vatRateMatch[1]))

    const copyMatch = req.method === 'PUT' && pathname.match(/^\/api\/products\/([^/]+)\/copy$/)
    if (copyMatch) return handleSetCopy(req, res, decodeURIComponent(copyMatch[1]))

    const variantsMatch = req.method === 'PUT' && pathname.match(/^\/api\/products\/([^/]+)\/variants$/)
    if (variantsMatch) return handleSetVariants(req, res, decodeURIComponent(variantsMatch[1]))

    sendJson(res, 404, { error: 'Not found' })
  }

  run().catch((error) => {
    console.error(error)
    sendJson(res, 500, { error: String(error) })
  })
})

server.listen(PORT, '127.0.0.1', () => {
  console.log(`Image uploader running at http://127.0.0.1:${PORT}`)
})
