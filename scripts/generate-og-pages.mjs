// Generates static HTML files for routes that need their own Open Graph
// preview (title/description/image) when shared on social media. GitHub
// Pages serves whatever file sits at a given path, and Facebook's crawler
// never executes JavaScript, so a per-route file with baked-in <meta> tags
// is the only way to get a distinct preview without running a server.
// React still hydrates the page normally for real visitors.
import { readFile, writeFile, mkdir } from 'node:fs/promises'
import path from 'node:path'

const distDir = path.resolve(import.meta.dirname, '..', 'dist')

const pages = [
  {
    route: 'course',
    title: 'Kurser och turer – Svampskogen',
    description:
      'Svampkursen är nu öppen för anmälan! Följ med ut i skogen och lär dig om ätbara och giftiga svampar.',
    image: 'https://svampskogen.com/og/course.jpg',
  },
]

function replaceTag(html, pattern, replacement) {
  if (!pattern.test(html)) {
    throw new Error(`Expected to find ${pattern} in template HTML`)
  }
  return html.replace(pattern, replacement)
}

async function main() {
  const template = await readFile(path.join(distDir, 'index.html'), 'utf8')

  for (const page of pages) {
    const url = `https://svampskogen.com/${page.route}`
    let html = template
    html = replaceTag(html, /<title>.*?<\/title>/, `<title>${page.title}</title>`)
    html = replaceTag(html, /<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${url}" />`)
    html = replaceTag(html, /<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${page.description}" />`)
    html = replaceTag(html, /<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${page.title}" />`)
    html = replaceTag(
      html,
      /<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${page.description}" />`,
    )
    html = replaceTag(html, /<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`)
    html = replaceTag(html, /<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${page.image}" />`)
    html = replaceTag(html, /<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${page.title}" />`)
    html = replaceTag(
      html,
      /<meta name="twitter:description" content="[^"]*" \/>/,
      `<meta name="twitter:description" content="${page.description}" />`,
    )
    html = replaceTag(html, /<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${page.image}" />`)

    const outDir = path.join(distDir, page.route)
    await mkdir(outDir, { recursive: true })
    await writeFile(path.join(outDir, 'index.html'), html)
  }
}

main()
