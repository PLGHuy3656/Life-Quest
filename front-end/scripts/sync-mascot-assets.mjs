/**
 * Deterministic Gate I Fox V2 Asset Sync Script
 *
 * Extracts ONLY approved runtime GLB modules, cosmetic GLBs, reference manifests,
 * and poster image from Git tag `mascot-v2-gate-i` (resolving Git LFS objects via
 * `git lfs smudge`), verifies SHA-256 checksums, and writes `public/models/assets.lock.json`.
 *
 * Never copies Blender `.blend` sources or preview `.mp4` videos into `public/`.
 * Generated `public/models/` and `public/fox_poster.png` are gitignored so binaries
 * are never duplicated in Git history.
 */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const feRoot = resolve(here, '..')
const repoRoot = resolve(feRoot, '..')
const TAG = process.env.FOX_V2_GIT_TAG || 'mascot-v2-gate-i'
const FALLBACK_DIR = process.env.FOX_V2_ASSETS_DIR || ''

const sha256 = (buf) => createHash('sha256').update(buf).digest('hex')

const H1_COSMETICS = [
  'student_glasses',
  'student_cap',
  'sports_headband',
  'explorer_backpack',
  'simple_jacket',
  'explorer_magnifier',
  'slot_test_sneakers',
  'slot_test_tail_ribbon'
]

const H2_COSMETICS = [
  'sports_jersey',
  'sports_sneakers',
  'explorer_hat',
  'mage_hat',
  'mage_capelet',
  'mage_wand',
  'ninja_headband',
  'ninja_gi',
  'ninja_scroll',
  'tet_khan_dong',
  'tet_ao_dai',
  'tet_lixi'
]

const ASSETS = [
  {
    src: '06_EXPORTS/glb/fox_v2_anim_e2.glb',
    dst: 'public/models/fox_v2_anim_e2.glb',
    lockPrefix: 'e884d675eee0fb45'
  },
  {
    src: '06_EXPORTS/glb/modules/fox_v2_g1_1_quest_reward_streak.anim.glb',
    dst: 'public/models/modules/fox_v2_g1_1_quest_reward_streak.anim.glb'
  },
  {
    src: '06_EXPORTS/glb/modules/fox_v2_g1_1_reference_poses.json',
    dst: 'public/models/modules/fox_v2_g1_1_reference_poses.json'
  },
  {
    src: '06_EXPORTS/glb/modules/fox_v2_g2_1_daily_life.anim.glb',
    dst: 'public/models/modules/fox_v2_g2_1_daily_life.anim.glb'
  },
  {
    src: '06_EXPORTS/glb/modules/fox_v2_g2_1_reference_poses.json',
    dst: 'public/models/modules/fox_v2_g2_1_reference_poses.json'
  },
  {
    src: '06_EXPORTS/glb/modules/fox_v2_g3_challenge_social.anim.glb',
    dst: 'public/models/modules/fox_v2_g3_challenge_social.anim.glb'
  },
  {
    src: '06_EXPORTS/glb/modules/fox_v2_g3_reference_poses.json',
    dst: 'public/models/modules/fox_v2_g3_reference_poses.json'
  },
  {
    src: '06_EXPORTS/glb/modules/fox_v2_i_voice_assistant.anim.glb',
    dst: 'public/models/modules/fox_v2_i_voice_assistant.anim.glb'
  },
  {
    src: '06_EXPORTS/glb/modules/fox_v2_i_reference_poses.json',
    dst: 'public/models/modules/fox_v2_i_reference_poses.json'
  },
  ...H1_COSMETICS.map((id) => ({
    src: `06_EXPORTS/glb/cosmetics/${id}.glb`,
    dst: `public/models/cosmetics/${id}.glb`
  })),
  {
    src: '06_EXPORTS/glb/cosmetics/cosmetic_reference_h1.json',
    dst: 'public/models/cosmetics/cosmetic_reference_h1.json'
  },
  ...H2_COSMETICS.map((id) => ({
    src: `06_EXPORTS/glb/cosmetics/${id}.glb`,
    dst: `public/models/cosmetics/${id}.glb`
  })),
  {
    src: '06_EXPORTS/glb/cosmetics/cosmetic_reference_h2.json',
    dst: 'public/models/cosmetics/cosmetic_reference_h2.json'
  },
  {
    src: '07_WEB_PREVIEW/companion_sandbox_i/public/fox_poster.png',
    dst: 'public/fox_poster.png'
  }
]

function isLfsPointer(buf) {
  return buf.subarray(0, 40).toString('utf8').startsWith('version https://git-lfs.github.com/spec/')
}

function readFromGitTag(relPath) {
  const raw = execFileSync('git', ['-C', repoRoot, 'show', `${TAG}:mascot/fox-v2/${relPath}`], {
    maxBuffer: 64 * 1024 * 1024
  })
  if (isLfsPointer(raw)) {
    return execFileSync('git', ['-C', repoRoot, 'lfs', 'smudge'], {
      input: raw,
      maxBuffer: 64 * 1024 * 1024
    })
  }
  return raw
}

function loadExpectedChecksums() {
  try {
    const text = readFromGitTag('09_DOCS/GATE_I_FINAL_SHA256SUMS.txt').toString('utf8')
    const map = new Map()
    for (const line of text.split(/\r?\n/)) {
      const m = /^([0-9a-f]{64})\s+\*?(.+)$/i.exec(line.trim())
      if (m) {
        const normalized = m[2].replace(/\\/g, '/').replace(/^LifeQuest_Fox_V2\//, '')
        map.set(normalized, m[1].toLowerCase())
      }
    }
    return map
  } catch {
    return new Map()
  }
}

const expectedSums = loadExpectedChecksums()
const lockOut = {}
let verifiedCount = 0

for (const asset of ASSETS) {
  let buf
  const fallbackPath = FALLBACK_DIR ? resolve(FALLBACK_DIR, asset.src) : ''
  if (fallbackPath && existsSync(fallbackPath)) {
    buf = readFileSync(fallbackPath)
  } else {
    buf = readFromGitTag(asset.src)
  }

  const hash = sha256(buf)
  if (asset.lockPrefix && !hash.startsWith(asset.lockPrefix)) {
    console.error(`[mascot-assets] CHECKSUM MISMATCH on ${asset.src}: got ${hash}`)
    process.exit(1)
  }
  const expected = expectedSums.get(asset.src)
  if (expected && expected !== hash) {
    console.error(
      `[mascot-assets] GATE_I_FINAL_SHA256SUMS mismatch on ${asset.src}: expected ${expected}, got ${hash}`
    )
    process.exit(1)
  }
  if (expected) verifiedCount += 1

  const outPath = resolve(feRoot, asset.dst)
  mkdirSync(dirname(outPath), { recursive: true })
  writeFileSync(outPath, buf)

  lockOut[asset.dst] = {
    source: `${TAG}:mascot/fox-v2/${asset.src}`,
    bytes: buf.length,
    sha256: hash
  }
}

const lockPath = resolve(feRoot, 'public/models/assets.lock.json')
mkdirSync(dirname(lockPath), { recursive: true })
writeFileSync(lockPath, JSON.stringify({ tag: TAG, count: ASSETS.length, assets: lockOut }, null, 2))

console.log(
  `[mascot-assets] Synced ${ASSETS.length} approved Gate I assets from ${TAG} (${verifiedCount} verified against GATE_I_FINAL_SHA256SUMS.txt).`
)
