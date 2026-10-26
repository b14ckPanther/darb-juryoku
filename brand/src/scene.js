// The Juryoku 3D scene: you, sitting straight at your laptop, in the camera's frame, spine lit.
// Built from src/mark.svg (fills become bevelled gold, strokes become rods). Used by the live showcase
// (index.html) and the headless renderer (render.html).
import * as THREE from 'three'
import { SVGLoader } from 'three/addons/loaders/SVGLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

const col = (hex) => new THREE.Color(hex)
const U = 1 / 100 // SVG units (0..200) to world units (-1..1)
const FRAME_CENTRE = new THREE.Vector2(94, 96)

/** Seeded random, so every render of the gold flakes is identical. */
function rng(seed) {
  let s = seed >>> 0
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296)
}

/** Builds the mark from SVG: returns { group, frame, spine, lens } with materials to animate. */
function buildMark(svgText, C) {
  const gold = new THREE.MeshPhysicalMaterial({ color: col(C.gold.hex), metalness: 1, roughness: 0.22, clearcoat: 0.5, clearcoatRoughness: 0.15 })
  const forest = new THREE.MeshPhysicalMaterial({ color: col(C.forest.hex), metalness: 0.2, roughness: 0.45, clearcoat: 0.8, clearcoatRoughness: 0.2 })
  const glow = () => new THREE.MeshPhysicalMaterial({ color: col(C.goldLight.hex), metalness: 0.6, roughness: 0.25, emissive: col(C.goldLight.hex), emissiveIntensity: 0.35 })
  const mats = { frame: glow(), spine: glow(), lens: glow() }
  const parts = { frame: new THREE.Group(), spine: new THREE.Group(), lens: new THREE.Group(), body: new THREE.Group() }
  const pick = (hex, role) => {
    if (role !== 'body') return mats[role]
    const c = col(hex)
    if (c.equals(col(C.forest.hex))) return forest
    if (c.equals(col(C.night.hex))) return null
    return gold
  }
  const roleOf = (node) => (node.closest('#frame') ? 'frame' : node.closest('#spine') ? 'spine' : node.closest('#lens') ? 'lens' : 'body')

  const svg = new SVGLoader().parse(svgText)
  for (const path of svg.paths) {
    const node = path.userData.node
    if (node?.id === 'bg') continue
    const role = roleOf(node)
    const st = path.userData.style
    const z = role === 'body' ? 4 : 6 // glowing parts sit just in front, never z-fight the gold
    if (st.fill && st.fill !== 'none') {
      const m = pick(st.fill, role)
      if (m)
        for (const shape of SVGLoader.createShapes(path)) {
          const g = new THREE.ExtrudeGeometry(shape, { depth: 6, bevelEnabled: true, bevelThickness: 2.2, bevelSize: 1.6, bevelSegments: 6, curveSegments: 48 })
          const mesh = new THREE.Mesh(g, m)
          if (role !== 'body') mesh.position.z = 2
          parts[role].add(mesh)
        }
    }
    if (st.stroke && st.stroke !== 'none') {
      const m = pick(st.stroke, role)
      if (!m) continue
      const r = (st.strokeWidth || 1) / 2
      for (const sub of path.subPaths) {
        const pts = []
        for (const c of sub.curves) {
          const p = c.getPoints(c.isLineCurve ? 1 : 48)
          if (pts.length) p.shift()
          pts.push(...p)
        }
        const curve = new THREE.CurvePath()
        for (let i = 1; i < pts.length; i++)
          curve.add(new THREE.LineCurve3(new THREE.Vector3(pts[i - 1].x, pts[i - 1].y, z), new THREE.Vector3(pts[i].x, pts[i].y, z)))
        parts[role].add(new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(64, pts.length * 8), r, 24, false), m))
        const ball = new THREE.SphereGeometry(r, 24, 16)
        const joints = sub.curves.some((c) => c.isLineCurve) ? pts : [pts[0], pts.at(-1)]
        for (const p of joints) {
          const s = new THREE.Mesh(ball, m)
          s.position.set(p.x, p.y, z)
          parts[role].add(s)
        }
      }
    }
  }
  // the frame scales about its own centre
  parts.frame.position.set(FRAME_CENTRE.x, FRAME_CENTRE.y, 0)
  for (const c of parts.frame.children) c.position.x -= FRAME_CENTRE.x, c.position.y -= FRAME_CENTRE.y
  const svgSpace = new THREE.Group()
  svgSpace.add(parts.body, parts.spine, parts.lens, parts.frame)
  svgSpace.scale.set(U, -U, U)
  svgSpace.position.set(-100 * U, 100 * U, 0)
  const group = new THREE.Group()
  group.add(svgSpace)
  return { group, frame: parts.frame, mats }
}

export async function createScene(canvas, tokens, opts = {}) {
  const { width, height, markScale = 0.7, view = 'front', transparent = false, dpr = 1 } = opts
  const C = tokens.color
  const R = tokens.render

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: transparent, preserveDrawingBuffer: true })
  renderer.setPixelRatio(dpr)
  renderer.setSize(width, height, false)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = R.exposure
  renderer.outputColorSpace = THREE.SRGBColorSpace

  const scene = new THREE.Scene()
  const pmrem = new THREE.PMREMGenerator(renderer)
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
  scene.environmentIntensity = 0.8

  const aspect = width / height
  const camera = new THREE.PerspectiveCamera(view === 'hero' ? 26 : 18, aspect, 0.1, 50)

  // ---- ground: true night at the edges, forest rising behind the figure, fine grain
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(12, 12),
    new THREE.ShaderMaterial({
      uniforms: { uEdge: { value: col(C.night.hex) }, uCore: { value: col(C.forest.hex) } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader: `uniform vec3 uEdge; uniform vec3 uCore; varying vec2 vUv;
        float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898,78.233))) * 43758.5453); }
        void main(){
          float d = length((vUv - .5) * vec2(1., 1.1)) * 12. / 2.4;
          vec3 c = mix(uCore * 1.6, uEdge * .55, smoothstep(.0, 1.15, d));
          c += (h(floor(vUv * 2400.)) - .5) * .006;
          gl_FragColor = vec4(c, 1.);
        }`,
    }),
  )
  ground.position.z = -0.32
  scene.add(ground)

  // a warm pool of light behind the figure, stronger once the camera locks on
  const pool = new THREE.Mesh(
    new THREE.CircleGeometry(1.6, 96),
    new THREE.ShaderMaterial({
      transparent: true,
      depthWrite: false,
      uniforms: { uColor: { value: col(C.goldDeep.hex) }, uStrength: { value: 0.0 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.); }',
      fragmentShader:
        'uniform vec3 uColor; uniform float uStrength; varying vec2 vUv; void main(){ float d = length(vUv-.5)*2.; float a = smoothstep(1.,0.,d); gl_FragColor = vec4(uColor, a*a*uStrength); }',
    }),
  )
  pool.position.z = -0.3
  scene.add(pool)

  // ---- gold flakes in the night, seeded so renders are repeatable
  const flakes = new THREE.InstancedMesh(
    new THREE.CircleGeometry(1, 5),
    new THREE.MeshPhysicalMaterial({ color: col(C.gold.hex), metalness: 1, roughness: 0.35, envMapIntensity: 0.9, side: THREE.DoubleSide }),
    120,
  )
  {
    const rand = rng(7)
    const m = new THREE.Matrix4()
    const q = new THREE.Quaternion()
    for (let i = 0; i < flakes.count; i++) {
      const x = (rand() * 2 - 1) * 2.4
      const y = -1.4 + Math.pow(rand(), 1.8) * 2.8
      const s = 0.003 + Math.pow(rand(), 4) * 0.013
      q.setFromEuler(new THREE.Euler(rand() * 0.6, rand() * 0.6, rand() * Math.PI))
      m.compose(new THREE.Vector3(x, y, -0.29 + rand() * 0.01), q, new THREE.Vector3(s, s * (0.5 + rand()), s))
      flakes.setMatrixAt(i, m)
    }
  }
  scene.add(flakes)

  // ---- the mark
  const svgUrl = new URL('./mark.svg', import.meta.url)
  const mark = buildMark(await (await fetch(svgUrl)).text(), C)
  const figure = new THREE.Group()
  figure.add(mark.group)
  figure.scale.setScalar(markScale)
  figure.rotation.set(-0.06, 0.14, 0)
  scene.add(figure)

  const key = new THREE.DirectionalLight(col(C.goldLight.hex), 1.5)
  key.position.set(-2.5, 3, 4)
  scene.add(key)
  const fill = new THREE.DirectionalLight(0xffffff, 0.55)
  fill.position.set(3, -1, 2)
  scene.add(fill)

  // ---- post
  const composer = new EffectComposer(renderer)
  composer.setPixelRatio(dpr)
  composer.setSize(width, height)
  composer.addPass(new RenderPass(scene, camera))
  composer.addPass(new UnrealBloomPass(new THREE.Vector2(width, height), R.bloom.strength, R.bloom.radius, R.bloom.threshold))
  composer.addPass(new OutputPass())

  // ---- camera framing
  const pointer = new THREE.Vector2()
  function frame() {
    if (view === 'hero') {
      camera.position.set(0.55 + pointer.x * 0.35, 0.18 + pointer.y * 0.22, 6.2)
      camera.lookAt(0.55, 0.05, 0)
    } else {
      const dist = 1 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2))
      camera.position.set(0, 0, dist * Math.max(1, 1 / aspect))
      camera.lookAt(0, 0, 0)
    }
  }
  if (view === 'hero') {
    figure.position.set(0.95, 0, 0)
    pool.position.x = 0.95
  }

  // ---- camera focus: 0 = searching (frame wide and dim), 1 = locked on (frame tight, spine and lens lit)
  let current = 1
  const base = col(C.goldLight.hex)
  function setAlign(a) {
    current = a
    const t = Math.max(0, Math.min(1, a))
    mark.frame.scale.setScalar(1 + 0.18 * (1 - t))
    const f = mark.mats.frame
    f.emissiveIntensity = 0.08 + 0.45 * t
    f.color.copy(base).multiplyScalar(0.45 + 0.55 * t)
    mark.mats.spine.emissiveIntensity = 0.05 + 0.75 * Math.pow(t, 1.6)
    mark.mats.lens.emissiveIntensity = 0.1 + 0.9 * t
    pool.material.uniforms.uStrength.value = 0.08 + t * 0.28
  }

  function render() {
    frame()
    composer.render()
  }
  function setPointer(x, y) {
    pointer.set(x, y)
  }
  function resize(w, h) {
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
    composer.setSize(w, h)
  }
  function dispose() {
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) o.material.dispose?.()
    })
    composer.dispose()
    pmrem.dispose()
    renderer.dispose()
  }

  setAlign(1)
  return { render, setAlign, setPointer, resize, dispose, get align() { return current } }
}
