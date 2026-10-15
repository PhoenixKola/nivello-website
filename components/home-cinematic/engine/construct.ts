import type { Color, Material } from 'three'

export type CutUniforms = { uBuild: { value: number }; uBase: { value: number }; uHeight: { value: number }; uEdge: { value: Color } }

/**
 * Adds a world-height cut to a material: solid below the build line with a glowing seam at it, nothing above.
 * `line` instead keeps only the band at and above the cut (a blueprint over the unbuilt part).
 */
export function constructible<T extends Material>(material: T, uniforms: CutUniforms, kind: 'solid' | 'line'): T {
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms)
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vBY;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vBY = (modelMatrix * vec4(transformed, 1.0)).y;')
    const cut = `
      float cutY = uBase + uBuild * uHeight;
      ${kind === 'solid' ? 'if (vBY > cutY) discard;' : 'if (uBuild > 0.995 || vBY < cutY - 0.2) discard;'}
    `
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vBY;\nuniform float uBuild;\nuniform float uBase;\nuniform float uHeight;\nuniform vec3 uEdge;')
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>\n${cut}`)
    if (kind === 'solid') {
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <emissivemap_fragment>',
        '#include <emissivemap_fragment>\n  totalEmissiveRadiance += uEdge * smoothstep(0.9, 0.0, cutY - vBY) * step(uBuild, 0.995) * 1.6;'
      )
    }
  }
  // Both uniforms and the cut kind are part of the program, so every constructible material of a kind shares one program.
  material.customProgramCacheKey = () => `construct-${kind}`
  return material
}
