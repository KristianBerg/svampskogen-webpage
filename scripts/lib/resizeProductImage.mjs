// The one reusable piece if this pipeline is ever retriggered from
// somewhere other than the local CLI script (e.g. a CI build step feeding
// off a CMS-managed media folder instead of a local raw-photo folder) —
// kept separate from how/when it's invoked.
import sharp from 'sharp'

export const SIZES = {
  thumb: 400,
  full: 800,
}

export async function resizeProductImage(sourcePath, outPath, width, quality = 80) {
  await sharp(sourcePath).resize({ width, withoutEnlargement: true }).webp({ quality }).toFile(outPath)
}
