// Self-hosts MediaPipe under the app origin (agent manual 1.3): copies the Tasks Vision WASM from
// node_modules into public/vendor/mediapipe/wasm and downloads the pose model once, refusing a file
// whose SHA-256 differs from config/pose.yaml. Run with `pnpm --filter web vendor` (build runs it).
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { parsePoseConfig } from '../src/config/posture';

const root = new URL('../../../', import.meta.url);
const config = parsePoseConfig(
  readFileSync(new URL('config/pose.yaml', root), 'utf8'),
  'config/pose.yaml',
);
const pub = new URL('public/', new URL('apps/web/', root));
const wasmFrom = new URL('node_modules/@mediapipe/tasks-vision/wasm/', new URL('apps/web/', root));
const wasmTo = new URL(`.${config.wasm_base}/`, pub);
const modelTo = new URL(`.${config.model_path}`, pub);
const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');

mkdirSync(wasmTo, { recursive: true });
cpSync(wasmFrom, wasmTo, { recursive: true });
console.log(`Copied MediaPipe WASM to ${wasmTo.pathname}`);

if (existsSync(modelTo) && sha(readFileSync(modelTo)) === config.model_sha256) {
  console.log(`Model present and verified: ${modelTo.pathname}`);
} else {
  const response = await fetch(config.model_source);
  if (!response.ok) throw new Error(`Model download failed: HTTP ${response.status}`);
  const bytes = new Uint8Array(await response.arrayBuffer());
  if (sha(bytes) !== config.model_sha256)
    throw new Error(
      'Downloaded model does not match model_sha256 in config/pose.yaml; refusing it',
    );
  writeFileSync(modelTo, bytes);
  console.log(`Downloaded and verified ${modelTo.pathname}`);
}
