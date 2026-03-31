// lib/image-utils.ts

/**
 * Converts an image file to WebP format with optional compression and resizing
 * @param file - The image file to convert
 * @param options - Conversion options
 * @returns Promise<File> - The converted WebP file
 */
export async function convertToWebP(
  file: File,
  options: {
    quality?: number // 0-1, default 0.8
    maxWidth?: number // Max width in pixels
    maxHeight?: number // Max height in pixels
    maxSizeMB?: number // Target max file size in MB
  } = {}
): Promise<File> {
  const {
    quality = 0.95,
    maxWidth,
    maxHeight,
    maxSizeMB,
  } = options

  return new Promise((resolve, reject) => {
    // Create image element
    const img = new Image()
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('Could not get canvas context'))
      return
    }

    img.onload = () => {
      try {
        // Calculate new dimensions
        let { width, height } = img
        
        // Resize if max dimensions are specified
        if (maxWidth || maxHeight) {
          const aspectRatio = width / height

          if (maxWidth && width > maxWidth) {
            width = maxWidth
            height = width / aspectRatio
          }

          if (maxHeight && height > maxHeight) {
            height = maxHeight
            width = height * aspectRatio
          }
        }

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw image on canvas
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to WebP
        canvas.toBlob(
          async (blob) => {
            if (!blob) {
              reject(new Error('Failed to convert image'))
              return
            }

            // Check if we need to reduce quality further to meet size target
            let finalBlob = blob
            let currentQuality = quality

            if (maxSizeMB && blob.size > maxSizeMB * 1024 * 1024) {
              // Iteratively reduce quality to meet size target
              finalBlob = await reduceToTargetSize(
                canvas,
                maxSizeMB,
                currentQuality
              )
            }

            // Create new file with .webp extension
            const fileName = file.name.replace(/\.[^/.]+$/, '.webp')
            const webpFile = new File([finalBlob], fileName, {
              type: 'image/webp',
              lastModified: Date.now(),
            })

            resolve(webpFile)
          },
          'image/webp',
          quality
        )
      } catch (error) {
        reject(error)
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Load the image
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Reduce image quality iteratively to meet target file size
 */
async function reduceToTargetSize(
  canvas: HTMLCanvasElement,
  targetSizeMB: number,
  initialQuality: number
): Promise<Blob> {
  const targetBytes = targetSizeMB * 1024 * 1024
  let quality = initialQuality
  let blob: Blob | null = null

  // Try reducing quality in steps
  for (let i = 0; i < 5; i++) {
    blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(
        (b) => resolve(b),
        'image/webp',
        quality
      )
    })

    if (!blob) break

    if (blob.size <= targetBytes) {
      return blob
    }

    // Reduce quality by 15% each iteration
    quality *= 0.85
  }

  // Return the last blob even if it didn't meet target
  return blob || new Blob()
}

/**
 * Convert multiple images to WebP
 */
export async function convertMultipleToWebP(
  files: File[],
  options?: Parameters<typeof convertToWebP>[1]
): Promise<File[]> {
  const conversions = files.map((file) => convertToWebP(file, options))
  return Promise.all(conversions)
}

/**
 * Validate if file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/')
}

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Calculate compression ratio
 */
export function getCompressionRatio(
  originalSize: number,
  compressedSize: number
): string {
  const ratio = ((originalSize - compressedSize) / originalSize) * 100
  return `${Math.round(ratio)}%`
}