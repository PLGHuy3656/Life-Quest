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
  { src: '06_EXPORTS/glb/modules/fox_v2_g1_1_quest_reward_streak.anim.glb', dst: 'public/models/modules/fox_v2_g1_1_quest_reward_streak.anim.glb' },   // G1.1
  { src: '04_ANIMATIONS/g1_1_cinematic_polish/anim_spec_g1_1.json', dst: 'src/mascot/modules/g1_1_quest_reward_streak.spec.json' },
  { src: '06_EXPORTS/glb/modules/fox_v2_g1_1_reference_poses.json', dst: 'public/models/modules/fox_v2_g1_1_reference_poses.json' },
  // Gate G2.1 daily-life module (corrected G2 clips, same contract) (animation only) + its clip / prop / VFX contract and Blender reference poses
  { src: '06_EXPORTS/glb/modules/fox_v2_g2_1_daily_life.anim.glb', dst: 'public/models/modules/fox_v2_g2_1_daily_life.anim.glb' },
  { src: '04_ANIMATIONS/g2_1_deformation_polish/anim_spec_g2_1.json', dst: 'src/mascot/modules/g2_1_daily_life.spec.json' },
  { src: '06_EXPORTS/glb/modules/fox_v2_g2_1_reference_poses.json', dst: 'public/models/modules/fox_v2_g2_1_reference_poses.json' },
  // Gate G3 challenge / duo-group / private-social module (animation only) + its clip / prop / VFX / contact contract and reference poses
  { src: '06_EXPORTS/glb/modules/fox_v2_g3_challenge_social.anim.glb', dst: 'public/models/modules/fox_v2_g3_challenge_social.anim.glb' },
  { src: '04_ANIMATIONS/g3_challenge_social/anim_spec_g3.json', dst: 'src/mascot/modules/g3_challenge_social.spec.json' },
  { src: '06_EXPORTS/glb/modules/fox_v2_g3_reference_poses.json', dst: 'public/models/modules/fox_v2_g3_reference_poses.json' },
  // Gate H1 persistent cosmetics: one skinned GLB per item (canonical skeleton, bound by joint name) + the build catalog
  { src: '05_COSMETICS/h1_prototypes/cosmetic_catalog_h1.json', dst: 'src/mascot/cosmetics/cosmetic_catalog_h1.json' },
  ...['student_glasses', 'student_cap', 'sports_headband', 'explorer_backpack', 'simple_jacket', 'explorer_magnifier', 'slot_test_sneakers', 'slot_test_tail_ribbon']
    .map(id => ({ src: `06_EXPORTS/glb/cosmetics/${id}.glb`, dst: `public/models/cosmetics/${id}.glb` })),
  { src: '06_EXPORTS/glb/cosmetics/cosmetic_reference_h1.json', dst: 'public/models/cosmetics/cosmetic_reference_h1.json' },
  // Gate H2 outfit library: 12 new item GLBs + their build catalogue
  { src: '05_COSMETICS/h2_outfits/cosmetic_catalog_h2.json', dst: 'src/mascot/cosmetics/cosmetic_catalog_h2.json' },
  ...['sports_jersey', 'sports_sneakers', 'explorer_hat', 'mage_hat', 'mage_capelet', 'mage_wand', 'ninja_headband', 'ninja_gi', 'ninja_scroll', 'tet_khan_dong', 'tet_ao_dai', 'tet_lixi']
    .map(id => ({ src: `06_EXPORTS/glb/cosmetics/${id}.glb`, dst: `public/models/cosmetics/${id}.glb` })),
  { src: '06_EXPORTS/glb/cosmetics/cosmetic_reference_h2.json', dst: 'public/models/cosmetics/cosmetic_reference_h2.json' },
  // Gate I voice assistant module (animation only) + its clip / prop / VFX contract and reference poses
  { src: '06_EXPORTS/glb/modules/fox_v2_i_voice_assistant.anim.glb', dst: 'public/models/modules/fox_v2_i_voice_assistant.anim.glb' },
  { src: '04_ANIMATIONS/i_voice_assistant/anim_spec_i.json', dst: 'src/mascot/modules/i_voice_assistant.spec.json' },
  { src: '06_EXPORTS/glb/modules/fox_v2_i_reference_poses.json', dst: 'public/models/modules/fox_v2_i_reference_poses.json' },
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
