// Shared between process-images.mjs (filtering raw files) and the image
// uploader (validating uploads) so the two can't drift out of sync.
export const SOURCE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png'])
