const { PDFDocument } = require('pdf-lib')

/**
 * Lossless PDF compression using pdf-lib.
 * Re-serializes the PDF which removes redundant objects and cross-reference tables.
 * Text remains fully extractable. Visual quality is unchanged.
 *
 * Falls back to original buffer if compression fails or makes file larger.
 *
 * @param {Buffer} inputBuffer - original PDF buffer
 * @returns {{ buffer: Buffer, originalSize: number, compressedSize: number, compressed: boolean }}
 */
const compressPdf = async (inputBuffer) => {
  const originalSize = inputBuffer.length

  try {
    const pdfDoc = await PDFDocument.load(inputBuffer, {
      ignoreEncryption: true  // handle encrypted PDFs gracefully
    })

    // Save with object compression enabled — removes redundant data
    const compressedBytes = await pdfDoc.save({ useObjectStreams: true })
    const compressedBuffer = Buffer.from(compressedBytes)
    const compressedSize = compressedBuffer.length

    // Only use compressed version if it's actually smaller
    if (compressedSize < originalSize) {
      const savedPercent = (((originalSize - compressedSize) / originalSize) * 100).toFixed(1)
      console.log(`[PDF] Compressed: ${(originalSize / 1024).toFixed(1)}KB → ${(compressedSize / 1024).toFixed(1)}KB (saved ${savedPercent}%)`)
      return { buffer: compressedBuffer, originalSize, compressedSize, compressed: true }
    }

    // Compressed version is same size or larger — use original
    console.log(`[PDF] Compression skipped: no size reduction (${(originalSize / 1024).toFixed(1)}KB)`)
    return { buffer: inputBuffer, originalSize, compressedSize: originalSize, compressed: false }

  } catch (err) {
    // Fallback to original on any error
    console.error(`[PDF] Compression failed, using original: ${err.message}`)
    return { buffer: inputBuffer, originalSize, compressedSize: originalSize, compressed: false }
  }
}

module.exports = compressPdf
