import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
  NoToneMapping,
  OrthographicCamera,
  PlaneGeometry,
  Points,
  PointsMaterial,
  SRGBColorSpace,
  Scene,
  Vector2,
  WebGLRenderer,
} from 'three';
import { Line2 } from 'three/addons/lines/Line2.js';
import { LineGeometry } from 'three/addons/lines/LineGeometry.js';
import { LineMaterial } from 'three/addons/lines/LineMaterial.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { designTokens } from '../design';
import { overlayColours, paintBackdrop, toRgb, type Frame } from './scene';

// Token colours are sRGB; the WebGL pipeline works in linear light and OutputPass converts back.
const linear = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toLinear = (rgb: number[]) => rgb.map(linear);

/**
 * The WebGL overlay: the painted backdrop on a plane, the ideal outline as a dashed screen-space line,
 * the rim as a bright line whose gain follows the match, bloom from tokens, and a few gold motes during
 * the match moment. No tone mapping: the backdrop and outline show the exact token colours, as the 2D
 * fallback does, and exposure scales only the rim. `setFrame` rebuilds the scene when the pose, match
 * or size changes; `draw` moves only the dash and motes. Call `dispose()` when done.
 */
export class WebGLOverlay {
  private renderer: WebGLRenderer;
  private composer: EffectComposer;
  private passes: { dispose(): void }[];
  private bloom: UnrealBloomPass;
  private scene = new Scene();
  private camera = new OrthographicCamera(0, 1, 0, 1, -10, 10);
  private backdrop = document.createElement('canvas');
  private texture = new CanvasTexture(this.backdrop);
  private sprite = roundSprite();
  private plane: Mesh<PlaneGeometry, MeshBasicMaterial>;
  private ideal: Line2;
  private rim: Line2;
  private motes: Points<BufferGeometry, PointsMaterial>;
  private moteSeeds: Float32Array;
  private size = { w: 0, h: 0, dpr: 1 };
  private frame: Frame | null = null;

  constructor(canvas: HTMLCanvasElement, options: { preserveDrawingBuffer?: boolean } = {}) {
    const { glow } = designTokens;
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      // Only screenshot and pixel tests need the buffer kept after compositing.
      preserveDrawingBuffer: options.preserveDrawingBuffer ?? false,
      powerPreference: 'low-power',
    });
    this.renderer.toneMapping = NoToneMapping;
    this.texture.colorSpace = SRGBColorSpace;
    // The camera's y axis points down, like the canvas. That flips triangle winding, so the backdrop
    // plane is double-sided and the texture is not flipped on upload.
    this.texture.flipY = false;

    this.plane = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({ map: this.texture, side: DoubleSide }),
    );
    this.ideal = new Line2(
      new LineGeometry(),
      new LineMaterial({
        vertexColors: true,
        linewidth: glow.outline_width_px,
        dashed: true,
        dashSize: glow.outline_dash[0],
        gapSize: glow.outline_dash[1],
        transparent: true,
        opacity: glow.outline_opacity,
      }),
    );
    this.rim = new Line2(
      new LineGeometry(),
      new LineMaterial({ linewidth: glow.rim_width_px, vertexColors: true, transparent: true }),
    );

    const count = glow.motes_max;
    this.moteSeeds = Float32Array.from({ length: count }, (_, i) => (i * 0.618034) % 1);
    const moteGeometry = new BufferGeometry();
    moteGeometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
    const [r = 0, g = 0, b = 0] = toLinear(toRgb(overlayColours.rim));
    const k = glow.motes.brightness;
    this.motes = new Points(
      moteGeometry,
      new PointsMaterial({
        size: glow.motes.size_px,
        sizeAttenuation: false,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        map: this.sprite,
      }),
    );
    this.motes.material.color.setRGB(r * k, g * k, b * k);
    this.scene.add(this.plane, this.rim, this.ideal, this.motes);

    this.composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    this.bloom = new UnrealBloomPass(
      new Vector2(1, 1),
      glow.bloom.strength,
      glow.bloom.radius,
      glow.bloom.threshold,
    );
    const output = new OutputPass();
    this.passes = [renderPass, this.bloom, output];
    for (const pass of this.passes) this.composer.addPass(pass as RenderPass);
  }

  resize(w: number, h: number, dpr: number): boolean {
    if (w === this.size.w && h === this.size.h && dpr === this.size.dpr) return false;
    this.size = { w, h, dpr };
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(w, h, false);
    this.composer.setPixelRatio(dpr);
    this.composer.setSize(w, h);
    this.camera.right = w;
    this.camera.bottom = h;
    this.camera.updateProjectionMatrix();
    this.plane.scale.set(w, h, 1);
    this.plane.position.set(w / 2, h / 2, -1);
    this.backdrop.width = Math.round(w * dpr);
    this.backdrop.height = Math.round(h * dpr);
    const resolution = new Vector2(w * dpr, h * dpr);
    (this.ideal.material as LineMaterial).resolution.copy(resolution);
    (this.rim.material as LineMaterial).resolution.copy(resolution);
    return true;
  }

  /** Rebuild the backdrop and lines for a new pose, match or size. */
  setFrame(frame: Frame, reducedMotion: boolean) {
    const { glow } = designTokens;
    this.frame = frame;
    const ctx = this.backdrop.getContext('2d');
    if (ctx) {
      ctx.setTransform(this.size.dpr, 0, 0, this.size.dpr, 0, 0);
      paintBackdrop(ctx, frame);
      this.texture.needsUpdate = true;
    }

    const idealGeometry = this.ideal.geometry as LineGeometry;
    idealGeometry.setPositions(frame.ideal.flatMap(([x, y]) => [x, y, 0]));
    idealGeometry.setColors(frame.idealColours.flatMap(toLinear));
    this.ideal.computeLineDistances();

    const gain = (glow.rim_floor_gain + frame.intensity * glow.rim_hdr_gain) * glow.exposure;
    const [r = 0, g = 0, b = 0] = toLinear(frame.rimColour);
    const rimGeometry = this.rim.geometry as LineGeometry;
    rimGeometry.setPositions(frame.body.flatMap(([x, y]) => [x, y, 0.5]));
    rimGeometry.setColors(frame.body.flatMap(() => [r * gain, g * gain, b * gain]));
    (this.rim.material as LineMaterial).opacity = Math.max(glow.rim_min_opacity, frame.intensity);
    this.motes.visible = frame.matchMoment && !reducedMotion;
  }

  /** Draw at `time` ms: only the dash offset and the motes move between frames. */
  draw(time: number, reducedMotion: boolean) {
    const { glow } = designTokens;
    (this.ideal.material as LineMaterial).dashOffset = reducedMotion
      ? 0
      : (-time / 1000) * glow.dash_speed_px_s;
    if (this.frame && this.motes.visible) this.updateMotes(this.frame, time);
    this.composer.render();
  }

  private updateMotes(frame: Frame, time: number) {
    const { motes } = designTokens.glow;
    const shoulders = [
      frame.body[Math.floor(frame.body.length * 0.15)],
      frame.body[Math.floor(frame.body.length * 0.85)],
    ];
    const positions = this.motes.geometry.getAttribute('position') as BufferAttribute;
    this.moteSeeds.forEach((seed, i) => {
      const anchor = shoulders[i % 2] ?? [0, 0];
      const life = (time / motes.period_ms + seed) % 1;
      positions.setXYZ(
        i,
        anchor[0] + Math.sin(seed * 40 + life * 3) * motes.sway_px,
        anchor[1] - life * frame.height * motes.rise_fraction,
        0.8,
      );
    });
    positions.needsUpdate = true;
  }

  /** Free every GPU resource and release the context, so remounting never piles contexts up. */
  dispose() {
    for (const pass of this.passes) pass.dispose();
    this.composer.dispose();
    for (const mesh of [this.plane, this.ideal, this.rim, this.motes]) {
      mesh.geometry.dispose();
      (mesh.material as { dispose(): void }).dispose();
    }
    this.texture.dispose();
    this.sprite.dispose();
    this.renderer.dispose();
    this.renderer.forceContextLoss();
  }
}

/** A soft round dot, so motes read as specks of light rather than square pixels. */
function roundSprite(): CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 32;
  const ctx = c.getContext('2d');
  if (ctx) {
    const g = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    g.addColorStop(0, 'rgba(255,255,255,1)');
    g.addColorStop(0.45, 'rgba(255,255,255,0.55)');
    g.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 32, 32);
  }
  return new CanvasTexture(c);
}

let webgl2: boolean | null = null;

/** Whether WebGL2 works here. Probed once; the probe context is released straight away. */
export function webglAvailable(): boolean {
  if (webgl2 === null) {
    try {
      const gl = document.createElement('canvas').getContext('webgl2');
      webgl2 = Boolean(gl);
      gl?.getExtension('WEBGL_lose_context')?.loseContext();
    } catch {
      webgl2 = false;
    }
  }
  return webgl2;
}
