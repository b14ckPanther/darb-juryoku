import {
  ACESFilmicToneMapping,
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  CanvasTexture,
  DoubleSide,
  Mesh,
  MeshBasicMaterial,
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

// Rim brightness above 1 is what crosses the bloom threshold; at a weak match the rim stays below it.
const RIM_HDR_GAIN = 1.05;

/**
 * The WebGL overlay: the painted backdrop on a plane, the ideal outline as a dashed screen-space line,
 * the rim as an HDR line with per-vertex warmth, bloom from tokens, ACES exposure, and a few gold motes
 * during the match moment. One instance per canvas; call dispose() when done.
 */
export class WebGLOverlay {
  private renderer: WebGLRenderer;
  private composer: EffectComposer;
  private bloom: UnrealBloomPass;
  private scene = new Scene();
  private camera = new OrthographicCamera(0, 1, 0, 1, -10, 10);
  private backdrop = document.createElement('canvas');
  private texture = new CanvasTexture(this.backdrop);
  private plane: Mesh;
  private ideal: Line2;
  private rim: Line2;
  private motes: Points;
  private moteSeeds: Float32Array;
  private size = { w: 0, h: 0, dpr: 1 };

  constructor(canvas: HTMLCanvasElement) {
    const { glow } = designTokens;
    this.renderer = new WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true,
      powerPreference: 'low-power',
    });
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = glow.exposure;
    this.texture.colorSpace = SRGBColorSpace;
    // The camera's y axis points down, like the canvas. That flips triangle winding, so the backdrop
    // plane is double-sided and the texture is not flipped on upload.
    this.texture.flipY = false;

    this.plane = new Mesh(
      new PlaneGeometry(1, 1),
      new MeshBasicMaterial({ map: this.texture, toneMapped: false, side: DoubleSide }),
    );
    this.scene.add(this.plane);

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
        toneMapped: false,
      }),
    );
    this.rim = new Line2(
      new LineGeometry(),
      new LineMaterial({ linewidth: glow.rim_width_px, vertexColors: true, transparent: true }),
    );
    this.scene.add(this.rim, this.ideal);

    const count = glow.motes_max;
    this.moteSeeds = Float32Array.from({ length: count }, (_, i) => (i * 0.618034) % 1);
    const moteGeometry = new BufferGeometry();
    moteGeometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 3), 3));
    const [r = 0, g = 0, b = 0] = toLinear(toRgb(overlayColours.rim));
    this.motes = new Points(
      moteGeometry,
      new PointsMaterial({
        size: 5,
        sizeAttenuation: false,
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
        map: roundSprite(),
      }),
    );
    (this.motes.material as PointsMaterial).color.setRGB(r * 1.4, g * 1.4, b * 1.4);
    this.scene.add(this.motes);

    this.composer = new EffectComposer(this.renderer);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.bloom = new UnrealBloomPass(
      new Vector2(1, 1),
      glow.bloom.strength,
      glow.bloom.radius,
      glow.bloom.threshold,
    );
    this.composer.addPass(this.bloom);
    this.composer.addPass(new OutputPass());
  }

  resize(w: number, h: number, dpr: number) {
    if (w === this.size.w && h === this.size.h && dpr === this.size.dpr) return;
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
  }

  render(frame: Frame, time: number, reducedMotion: boolean) {
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
    (this.ideal.material as LineMaterial).dashOffset = reducedMotion ? 0 : -time * 0.006;

    const gain = 0.3 + frame.intensity * RIM_HDR_GAIN;
    const [r = 0, g = 0, b = 0] = toLinear(frame.rimColour);
    const rimGeometry = this.rim.geometry as LineGeometry;
    rimGeometry.setPositions(frame.body.flatMap(([x, y]) => [x, y, 0.5]));
    rimGeometry.setColors(frame.body.flatMap(() => [r * gain, g * gain, b * gain]));
    (this.rim.material as LineMaterial).opacity = Math.max(0.08, frame.intensity);

    this.updateMotes(frame, time, reducedMotion);
    this.bloom.strength = designTokens.glow.bloom.strength * (reducedMotion ? 0.8 : 1);
    this.composer.render();
  }

  private updateMotes(frame: Frame, time: number, reducedMotion: boolean) {
    const visible = frame.matchMoment && !reducedMotion;
    this.motes.visible = visible;
    if (!visible) return;
    const shoulders = [
      frame.body[Math.floor(frame.body.length * 0.15)],
      frame.body[Math.floor(frame.body.length * 0.85)],
    ];
    const positions = this.motes.geometry.getAttribute('position') as BufferAttribute;
    this.moteSeeds.forEach((seed, i) => {
      const anchor = shoulders[i % 2] ?? [0, 0];
      const life = (time / 2600 + seed) % 1;
      positions.setXYZ(
        i,
        anchor[0] + Math.sin(seed * 40 + life * 3) * 14,
        anchor[1] - life * frame.height * 0.22,
        0.8,
      );
    });
    positions.needsUpdate = true;
    (this.motes.material as PointsMaterial).opacity = 0.9;
  }

  dispose() {
    this.composer.dispose();
    this.renderer.dispose();
    this.texture.dispose();
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

export function webglAvailable(): boolean {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'));
  } catch {
    return false;
  }
}
