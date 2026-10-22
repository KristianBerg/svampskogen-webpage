// Local-only admin tool: lists products from products.live.json, lets you pick
// photos for one through the browser's file picker, and writes them into
// assets/<slug>/ in submission order. Existing photos can be reordered or
// deleted, which renumbers both the raw files and their processed webp
// outputs. Also lets you set each product's
// category, VAT rate and Swedish/English name and description, which are
// written back into products.live.json.
// Never deployed, never exposed off this machine — the server only binds to 127.0.0.1.
import { spawn } from 'node:child_process'
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { SIZES } from '../lib/resizeProductImage.mjs'
import { SOURCE_EXTENSIONS } from '../lib/sourceExtensions.mjs'

const repoRoot = path.resolve(import.meta.dirname, '..', '..')
const rawDir = path.join(repoRoot, 'assets')
const publicProductsDir = path.join(repoRoot, 'public', 'products')
const indexHtmlPath = path.join(import.meta.dirname, 'index.html')
const liveProductsPath = path.join(repoRoot, 'src', 'data', 'products.live.json')
const PORT = 4500

// Read per request (not cached) so hand edits to products.live.json show up
// without restarting the server.
async function loadLiveProducts() {
  return JSON.parse(await readFile(liveProductsPath, 'utf8'))
}

// Matches the field order in productTypes.ts, so a field the uploader adds
// (e.g. a first category) lands where a hand-written entry would put it
// instead of at the end. Unknown fields keep their place after these.
const FIELD_ORDER = ['slug', 'stripePriceId', 'vatRate', 'inStock', 'category', 'name', 'description']

function orderFields(product) {
  const ordered = {}
  for (const key of FIELD_ORDER) if (key in product) ordered[key] = product[key]
  return Object.assign(ordered, product)
}

// Applies `update` to one product and writes the file back in the same
// 2-space format it's stored in, so diffs only show the changed fields.
async function updateLiveProduct(slug, update) {
  const products = await loadLiveProducts()
  const index = products.findIndex((product) => product.slug === slug)
  if (index === -1) throw new Error(`Unknown product slug: ${slug}`)
  products[index] = orderFields(update({ ...products[index] }))
  await writeFile(liveProductsPath, `${JSON.stringify(products, null, 2)}\n`)
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
    vatRate: product.vatRate,
    imageCount: counts[product.slug] ?? 0,
    copy: { name: product.name, description: product.description },
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

async function handleSetCategory(req, res, slug) {
  const products = await loadLiveProducts()
  if (!products.some((product) => product.slug === slug)) {
    sendJson(res, 404, { error: `Unknown product slug: ${slug}` })
    return
  }

  const { category: raw } = JSON.parse((await readBody(req)).toString('utf8') || '{}')
  const category = typeof raw === 'string' ? raw.trim() : ''
  if (/[\r\n]/.test(category) || category.length > 60) {
    sendJson(res, 400, { error: 'Category must be a single line of at most 60 characters.' })
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

async function handleProcess(res) {
  const child = spawn('node', [path.join(repoRoot, 'scripts', 'process-images.mjs')], { cwd: repoRoot })
  let output = ''
  child.stdout.on('data', (chunk) => (output += chunk))
  child.stderr.on('data', (chunk) => (output += chunk))
  child.on('close', (code) => {
    sendJson(res, code === 0 ? 200 : 500, { code, output })
  })
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
    if (req.method === 'POST' && pathname === '/api/process') return handleProcess(res)

    const uploadMatch = req.method === 'POST' && pathname.match(/^\/api\/products\/([^/]+)\/upload$/)
    if (uploadMatch) return handleUpload(req, res, decodeURIComponent(uploadMatch[1]))

    const photosMatch = pathname.match(/^\/api\/products\/([^/]+)\/photos$/)
    if (photosMatch && req.method === 'GET') return handleGetPhotos(res, decodeURIComponent(photosMatch[1]))
    if (photosMatch && req.method === 'PUT') return handleSetPhotos(req, res, decodeURIComponent(photosMatch[1]))

    const thumbMatch = req.method === 'GET' && pathname.match(/^\/api\/products\/([^/]+)\/photos\/(\d+)\/thumb$/)
    if (thumbMatch) return handleThumb(res, decodeURIComponent(thumbMatch[1]), Number(thumbMatch[2]))

    const categoryMatch = req.method === 'PUT' && pathname.match(/^\/api\/products\/([^/]+)\/category$/)
    if (categoryMatch) return handleSetCategory(req, res, decodeURIComponent(categoryMatch[1]))

    const vatRateMatch = req.method === 'PUT' && pathname.match(/^\/api\/products\/([^/]+)\/vat-rate$/)
    if (vatRateMatch) return handleSetVatRate(req, res, decodeURIComponent(vatRateMatch[1]))

    const copyMatch = req.method === 'PUT' && pathname.match(/^\/api\/products\/([^/]+)\/copy$/)
    if (copyMatch) return handleSetCopy(req, res, decodeURIComponent(copyMatch[1]))

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
