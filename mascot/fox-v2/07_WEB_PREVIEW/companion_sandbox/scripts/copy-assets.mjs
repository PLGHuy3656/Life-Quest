// Copies the runtime assets from the workspace into the sandbox:
//  * the approved Gate E2 Fox GLB (hash-locked — the sandbox never ships a different Fox)
//  * animation-only modules (Gate G1+) and their clip specs. Modules carry no Fox body; the runtime
//    validates every track against the E2 Fox at load time (FoxModelLoader.bindModule).
import { createHash } from 'node:crypto';
import { copyFileSync, mkdirSync, readFileSync, existsSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const sandbox = resolve(here, '..');
const workspace = resolve(here, '../../..');                 // LifeQuest_Fox_V2/
const sha = buf => createHash('sha256').update(buf).digest('hex');

const ASSETS = [
  { src: '06_EXPORTS/glb/fox_v2_anim_e2.glb', dst: 'public/models/fox_v2_anim_e2.glb', lock: 'e884d675eee0fb45' },          // approved E2
  { src: '06_EXPORTS/glb/modules/fox_v2_g1_quest_reward_streak.anim.glb', dst: 'public/models/modules/fox_v2_g1_quest_reward_streak.anim.glb' },
  { src: '04_ANIMATIONS/g1_quest_reward_streak/anim_spec_g1.json', dst: 'src/mascot/modules/g1_quest_reward_streak.spec.json' },
  { src: '06_EXPORTS/glb/modules/fox_v2_g1_reference_poses.json', dst: 'public/models/modules/fox_v2_g1_reference_poses.json' },
];

const lockOut = {};
for (const a of ASSETS) {
  const src = resolve(workspace, a.src), dst = resolve(sandbox, a.dst);
  if (!existsSync(src)) {
    if (existsSync(dst) && (!a.lock || sha(readFileSync(dst)).startsWith(a.lock))) { console.log(`[assets] ${a.src} not in workspace; keeping the copy in ${a.dst}`); continue; }
    console.error(`[assets] missing ${src}`); process.exit(1);
  }
  const buf = readFileSync(src), h = sha(buf);
  if (a.lock && !h.startsWith(a.lock)) { console.error(`[assets] ${a.src} is not the approved file (sha256 ${h})`); process.exit(1); }
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
  lockOut[a.dst] = { source: a.src, bytes: buf.length, sha256: h };
  console.log(`[assets] ${a.src} ${buf.length} B sha256 ${h.slice(0, 16)}… → ${a.dst}`);
}
writeFileSync(resolve(sandbox, 'public/models/assets.lock.json'), JSON.stringify(lockOut, null, 2));
