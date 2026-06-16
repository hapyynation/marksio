export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const MAX_SIZE_BYTES = 10 * 1024 * 1024

export function validateFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) return 'Yalnızca JPG, PNG veya WebP dosyaları desteklenir.'
  if (file.size > MAX_SIZE_BYTES) return "Dosya boyutu 10 MB'ı geçemez."
  return null
}

export function validateImageUrl(url: string): string | null {
  try {
    const pathname = new URL(url).pathname.toLowerCase()
    if (!pathname.match(/\.(jpe?g|png|webp)(\?.*)?$/)) {
      return "Geçerli bir görsel URL'si girin (jpg/png/webp ile bitmelidir)."
    }
    return null
  } catch {
    return "Geçerli bir görsel URL'si girin (jpg/png/webp ile bitmelidir)."
  }
}
