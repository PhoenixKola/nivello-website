import { ImageResponse } from 'next/og'
import { loadOgFonts, OgCard, ogSize } from '@/lib/og'

export const dynamic = 'force-static'
export const alt = 'Nivello'
export const size = ogSize
export const contentType = 'image/png'

export default async function OpengraphImage() {
  const fonts = await loadOgFonts()

  return new ImageResponse(
    (
      <OgCard
        eyebrow="Nivello"
        title="Modern web development for ambitious brands"
        description="Fast, maintainable websites and web apps built with Next.js."
      />
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  )
}
