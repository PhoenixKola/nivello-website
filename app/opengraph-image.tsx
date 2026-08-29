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
        title="Premium digital solutions for ambitious brands"
        description="Strategy, marketing, design, and Next.js development."
      />
    ),
    { ...size, fonts: fonts.length ? fonts : undefined }
  )
}
