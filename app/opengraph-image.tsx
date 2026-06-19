import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'
export const alt = 'Nivello | Premium websites for Italian brands'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: '#020408',
          padding: '72px 80px',
          color: '#f8fafc'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 800 }}>Nivello</div>
          <div style={{ display: 'flex', gap: 10 }}>
            <div style={{ width: 54, height: 8, borderRadius: 999, background: '#FFBF43' }} />
            <div style={{ width: 54, height: 8, borderRadius: 999, background: '#159BFF' }} />
            <div style={{ width: 54, height: 8, borderRadius: 999, background: '#7C3AED' }} />
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          <div style={{ display: 'flex', color: '#FFBF43', fontSize: 24, fontWeight: 700 }}>
            Based in Italy. Working across Europe.
          </div>
          <div style={{ display: 'flex', maxWidth: 960, fontSize: 78, fontWeight: 800, lineHeight: 1.04 }}>
            Premium websites for Italian brands
          </div>
          <div style={{ display: 'flex', maxWidth: 760, fontSize: 28, lineHeight: 1.35, color: '#cbd5e1' }}>
            Strategy, marketing, design, and Next.js development.
          </div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#94a3b8', fontSize: 24 }}>
          <span>Gold. Blue. Purple.</span>
          <span>nivello.it</span>
        </div>
      </div>
    ),
    { ...size }
  )
}
