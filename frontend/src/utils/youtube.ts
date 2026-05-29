export function extractVideoId(link: string): string | null {
  if (!link) return null

  const candidates = [
    /youtube\.com\/watch\?v=([^&?#]+)/i,
    /youtu\.be\/([^&?#]+)/i,
    /youtube\.com\/embed\/([^&?#]+)/i,
    /youtube\.com\/v\/([^&?#]+)/i,
  ]

  for (const pattern of candidates) {
    const match = link.match(pattern)
    if (match?.[1]) return match[1]
  }

  return null
}

export function buildThumbnail(link: string): string {
  const videoId = extractVideoId(link)

  if (!videoId) return 'https://placehold.co/640x360/0f172a/ffffff?text=Sem+thumbnail'

  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`
}

export function buildEmbedUrl(link: string): string {
  const videoId = extractVideoId(link)

  if (!videoId) return ''

  return `https://www.youtube.com/embed/${videoId}`
}
