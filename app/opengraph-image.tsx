import { ImageResponse } from 'next/og'

export const dynamic = 'force-static'
export const alt = 'Nivello — Premium websites for ambitious Italian brands'
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
          position: 'relative'
        }}
      >
        {/* Glow accents */}
        <div
          style={{
            position: 'absolute',
            top: -160,
            left: -120,
            width: 520,
            height: 520,
            borderRadius: '9999px',
            background: 'rgba(16,185,129,0.35)',
            filter: 'blur(120px)'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: -180,
            right: -100,
            width: 480,
            height: 480,
            borderRadius: '9999px',
            background: 'rgba(56,189,248,0.30)',
            filter: 'blur(120px)'
          }}
        />

        {/* Top row: wordmark + tag */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 40, fontWeight: 700, color: '#ffffff', letterSpacing: -1 }}>
            Nivello
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 20,
              color: '#94a3b8',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 9999,
              padding: '10px 22px'
            }}
          >
            Based in Italy · Working across Europe
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              fontSize: 78,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              color: '#f8fafc'
            }}
          >
            Premium websites for
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 78,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -2,
              fontStyle: 'italic',
              backgroundImage: 'linear-gradient(120deg, #6ee7b7 0%, #38bdf8 48%, #f0abfc 100%)',
              backgroundClip: 'text',
              color: 'transparent'
            }}
          >
            ambitious Italian brands.
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', fontSize: 26, color: '#cbd5e1' }}>
            Strategy · Design · Next.js development
          </div>
          <div style={{ display: 'flex', fontSize: 26, color: '#6ee7b7' }}>nivello.it</div>
        </div>
      </div>
    ),
    { ...size }
  )
}
