// Local-only admin tool: lists products from products.live.json, lets you pick
// photos for one through the browser's file picker, and writes them into
// assets/<slug>/ in submission order. Also lets you set each product's
// category and VAT rate, which are written back into products.live.json.
// Never deployed, never exposed off this machine — the server only binds to 127.0.0.1.
import { spawn } from 'node:child_process'
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { SOURCE_EXTENSIONS } from '../lib/sourceExtensions.mjs'

const repoRoot = path.resolve(import.meta.dirname, '..', '..')
const rawDir = path.join(repoRoot, 'assets')
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

    const categoryMatch = req.method === 'PUT' && pathname.match(/^\/api\/products\/([^/]+)\/category$/)
    if (categoryMatch) return handleSetCategory(req, res, decodeURIComponent(categoryMatch[1]))

    const vatRateMatch = req.method === 'PUT' && pathname.match(/^\/api\/products\/([^/]+)\/vat-rate$/)
    if (vatRateMatch) return handleSetVatRate(req, res, decodeURIComponent(vatRateMatch[1]))

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
