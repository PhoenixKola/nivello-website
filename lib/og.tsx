import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import type { ReactElement } from 'react'

export const ogSize = { width: 1200, height: 630 }

const GOLD = '#ffbf43'
const BLUE = '#159bff'
const PURPLE = '#7c3aed'

// Satori only paints radial gradients as the backgroundImage of a sized
// element -- as a standalone blurred circle div it renders a hard-edged disc.
const AMBIENT = [
  'radial-gradient(circle at 80% 4%, rgba(21,155,255,0.40), rgba(5,7,14,0) 55%)',
  'radial-gradient(circle at 6% 98%, rgba(124,58,237,0.34), rgba(5,7,14,0) 52%)',
  'radial-gradient(circle at 60% 82%, rgba(255,191,67,0.16), rgba(5,7,14,0) 45%)'
].join(', ')

// Google's CSS API only hands back TTF (which Satori can parse) to an old UA;
// a modern one returns woff2, which it cannot.
const LEGACY_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_6_8) AppleWebKit/533.20.25 (KHTML, like Gecko) Version/5.0.4 Safari/533.20.27'

type OgFont = { name: string; data: ArrayBuffer; weight: 400 | 600 | 700; style: 'normal' }

async function fetchGoogleFont(family: string, name: string, weight: OgFont['weight']): Promise<OgFont | null> {
  try {
    const css = await fetch(`https://fonts.googleapis.com/css2?family=${family}&display=swap`, {
      headers: { 'User-Agent': LEGACY_UA }
    }).then(response => response.text())

    const url = css.match(/src:\s*url\(([^)]+)\)\s*format\('truetype'\)/)?.[1]
    if (!url) return null

    return { name, data: await fetch(url).then(response => response.arrayBuffer()), weight, style: 'normal' }
  } catch {
    return null
  }
}

let fontsPromise: Promise<OgFont[]> | null = null

/**
 * Brand fonts for the social cards, fetched once per build. Falls back to an
 * empty list (next/og then uses its bundled font) so a network hiccup degrades
 * the card instead of failing the build.
 */
export function loadOgFonts(): Promise<OgFont[]> {
  fontsPromise ??= Promise.all([
    fetchGoogleFont('Fraunces:opsz,wght@9..144,700', 'Fraunces', 700),
    fetchGoogleFont('Inter:wght@400', 'Inter', 400),
    fetchGoogleFont('Inter:wght@600', 'Inter', 600)
  ]).then(fonts => fonts.filter((font): font is OgFont => font !== null))

  return fontsPromise
}

function GridLines() {
  return (
    <div style={{ position: 'absolute', inset: 0, display: 'flex' }}>
      {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(index => (
        <div
          key={`v${index}`}
          style={{
            position: 'absolute',
            left: 100 * (index + 1),
            top: 0,
            width: 1,
            height: ogSize.height,
            background: 'rgba(148,163,184,0.055)'
          }}
        />
      ))}
      {[0, 1, 2, 3, 4].map(index => (
        <div
          key={`h${index}`}
          style={{
            position: 'absolute',
            top: 105 * (index + 1),
            left: 0,
            height: 1,
            width: ogSize.width,
            background: 'rgba(148,163,184,0.055)'
          }}
        />
      ))}
    </div>
  )
}

let logoDataUri: string | null = null

/** The real brand mark, inlined as a data URI (Satori cannot fetch files). */
function getLogoDataUri() {
  if (logoDataUri === null) {
    try {
      const file = readFileSync(join(process.cwd(), 'public', 'nivello-icon.png'))
      logoDataUri = `data:image/png;base64,${file.toString('base64')}`
    } catch {
      logoDataUri = ''
    }
  }

  return logoDataUri
}

/**
 * The shared social card. Both the root opengraph-image and the per-page
 * /og/[slug] route render this, so every link preview stays identical.
 */
export function OgCard({
  eyebrow,
  title,
  description
}: {
  eyebrow: string
  title: string
  description: string
}): ReactElement {
  const logo = getLogoDataUri()

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        position: 'relative',
        background: '#05070e',
        backgroundImage: AMBIENT,
        color: '#f8fafc',
        fontFamily: 'Inter'
      }}
    >
      <GridLines />

      {/* brand spine */}
      <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 12, display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1, background: BLUE }} />
        <div style={{ flex: 1, background: PURPLE }} />
        <div style={{ flex: 1, background: GOLD }} />
      </div>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          padding: '58px 76px 54px 88px'
        }}
      >
        {/* header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            {logo ? <img src={logo} width={68} height={68} alt="" /> : null}
            <div style={{ display: 'flex', fontSize: 38, fontWeight: 600, letterSpacing: -0.6 }}>Nivello</div>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              border: '1px solid rgba(255,191,67,0.45)',
              background: 'rgba(255,191,67,0.08)',
              borderRadius: 999,
              padding: '11px 26px',
              color: GOLD,
              fontSize: 19,
              fontWeight: 600,
              letterSpacing: 2.4,
              textTransform: 'uppercase'
            }}
          >
            {eyebrow}
          </div>
        </div>

        {/* headline block */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', width: 96, height: 5, borderRadius: 999, background: GOLD, marginBottom: 30 }} />
          <div
            style={{
              display: 'flex',
              maxWidth: 900,
              fontFamily: 'Fraunces',
              fontSize: 74,
              fontWeight: 700,
              lineHeight: 1.05,
              letterSpacing: -1.6
            }}
          >
            {title}
          </div>
          <div style={{ display: 'flex', maxWidth: 780, marginTop: 24, fontSize: 27, lineHeight: 1.4, color: '#9aa8bd' }}>
            {description}
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            paddingTop: 26,
            borderTop: '1px solid rgba(148,163,184,0.16)'
          }}
        >
          <div style={{ display: 'flex', fontSize: 24, fontWeight: 600, color: '#e2e8f0' }}>nivello.it</div>
          <div style={{ display: 'flex', fontSize: 21, color: '#7c8ba1', letterSpacing: 0.4 }}>
            Strategy · Design · Development
          </div>
        </div>
      </div>
    </div>
  )
}
