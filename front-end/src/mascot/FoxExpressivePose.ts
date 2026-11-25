import type { Bone, Mesh } from 'three'
import { FoxBoneOps, smooth } from './foxMath'

/**
 * Runtime procedural pose overlay for LifeQuest Fox V2.
 * Runs purely on top of the approved Gate I skeleton via FoxBoneOps (zero GLB modifications).
 */
export type FoxPoseMode = 'none' | 'cover_eyes' | 'peek' | 'curious' | 'nod'

export class FoxExpressivePose {
  private mode: FoxPoseMode = 'none'
  private coverW = 0
  private peekW = 0
  private curiousW = 0
  private nodW = 0
  private t = 0

  constructor(
    private ops: FoxBoneOps,
    private B: Record<string, Bone>,
    private eyes: Mesh[]
  ) {}

  setMode(mode: FoxPoseMode) {
    this.mode = mode
  }

  getMode(): FoxPoseMode {
    return this.mode
  }

  update(dt: number, oneShotWeight: number, reducedMotion: boolean) {
    this.t += dt
    const scale = reducedMotion ? 0.45 : 1
    // Cover-eyes & peek stay responsive even during gentle transitions; curious/nod yield to big one-shots
    const privacyScale = reducedMotion ? 0.65 : 1
    const free = (1 - oneShotWeight * 0.85) * scale

    this.coverW = smooth(this.coverW, this.mode === 'cover_eyes' ? privacyScale : 0, 10, dt)
    this.peekW = smooth(this.peekW, this.mode === 'peek' ? privacyScale : 0, 10, dt)
    this.curiousW = smooth(this.curiousW, this.mode === 'curious' ? free : 0, 8, dt)
    this.nodW = smooth(this.nodW, this.mode === 'nod' ? free : 0, 8, dt)

    // 1. Cover Eyes + Turn Head Away (Password Privacy)
    if (this.coverW > 1e-3) {
      const w = this.coverW
      const breath = Math.sin(this.t * 2.6) * 2.2 * w
      // Raise both arms up & inward toward the eyes
      this.ops.addLocal(this.B.ARM_L, 'x', -112 * w + breath)
      this.ops.addLocal(this.B.ARM_L, 'z', -34 * w)
      this.ops.addLocal(this.B.ARM_L, 'y', 24 * w)
      this.ops.addLocal(this.B.PAW_L, 'x', -24 * w)

      this.ops.addLocal(this.B.ARM_R, 'x', -112 * w + breath)
      this.ops.addLocal(this.B.ARM_R, 'z', 34 * w)
      this.ops.addLocal(this.B.ARM_R, 'y', -24 * w)
      this.ops.addLocal(this.B.PAW_R, 'x', -24 * w)

      // Shy head & neck turn away
      this.ops.addLocal(this.B.NECK, 'y', 16 * w)
      this.ops.addLocal(this.B.NECK, 'x', 6 * w)
      this.ops.addLocal(this.B.HEAD, 'y', 26 * w)
      this.ops.addLocal(this.B.HEAD, 'z', -9 * w)
      this.ops.addLocal(this.B.HEAD, 'x', 7 * w)

      // Softly folded ears
      this.ops.addLocal(this.B.EAR_L_01, 'x', -13 * w)
      this.ops.addLocal(this.B.EAR_R_01, 'x', -13 * w)
    }

    // 2. Peek-a-boo (When user toggles "Show password" while focused)
    if (this.peekW > 1e-3) {
      const w = this.peekW
      // Left paw still shields left eye, right paw drops halfway to peek
      this.ops.addLocal(this.B.ARM_L, 'x', -108 * w)
      this.ops.addLocal(this.B.ARM_L, 'z', -30 * w)
      this.ops.addLocal(this.B.PAW_L, 'x', -20 * w)

      this.ops.addLocal(this.B.ARM_R, 'x', -44 * w)
      this.ops.addLocal(this.B.ARM_R, 'z', 14 * w)

      // Playful curious tilt
      this.ops.addLocal(this.B.HEAD, 'y', -7 * w)
      this.ops.addLocal(this.B.HEAD, 'z', 13 * w)
      this.ops.addLocal(this.B.EAR_R_01, 'x', 11 * w)
      this.ops.addLocal(this.B.EAR_L_01, 'x', -6 * w)
    }

    // 3. Curious Head Tilt + Ear Perk + Gentle Tail Sway (Email focus)
    if (this.curiousW > 1e-3) {
      const w = this.curiousW
      this.ops.addLocal(this.B.HEAD, 'z', 12 * w)
      this.ops.addLocal(this.B.HEAD, 'x', -4 * w)
      this.ops.addLocal(this.B.EAR_L_01, 'x', 9 * w)
      this.ops.addLocal(this.B.EAR_R_01, 'x', 11 * w)
      for (let i = 1; i <= 4; i++) {
        this.ops.addLocal(
          this.B['TAIL_0' + i],
          'y',
          7 * w * Math.sin(this.t * 6.5 - i * 0.5) * (i === 1 ? 0.5 : 0.35)
        )
      }
    }

    // 4. Happy Nod + Upbeat Tail Wag (Username / Survey selection)
    if (this.nodW > 1e-3) {
      const w = this.nodW
      this.ops.addLocal(this.B.HEAD, 'x', Math.sin(this.t * 6.2) * 5.5 * w)
      this.ops.addLocal(this.B.EAR_L_01, 'x', 8 * w)
      this.ops.addLocal(this.B.EAR_R_01, 'x', 8 * w)
      for (let i = 1; i <= 4; i++) {
        this.ops.addLocal(
          this.B['TAIL_0' + i],
          'y',
          11 * w * Math.sin(this.t * 9.5 - i * 0.55) * (i === 1 ? 0.55 : 0.38)
        )
      }
    }
  }

  /** Runs after FoxFaceController so cover_eyes closes both eyes and peek winks playfully. */
  applyEyes() {
    if (this.coverW <= 1e-3 && this.peekW <= 1e-3) return
    for (const m of this.eyes) {
      const D = m.morphTargetDictionary
      const inf = m.morphTargetInfluences
      if (!D || !inf) continue
      if ((inf[D.hide] ?? 0) > 0.5) continue

      if (this.coverW > 1e-3 && D.Blink !== undefined) {
        inf[D.Blink] = Math.max(inf[D.Blink], Math.min(1, this.coverW * 1.15))
      }

      if (this.peekW > 1e-3) {
        if (m.name === 'FOX_Eye_L' && D.Blink !== undefined) {
          inf[D.Blink] = Math.max(inf[D.Blink], Math.min(1, this.peekW * 1.15))
        }
        if (m.name === 'FOX_Eye_R' && D.Wide !== undefined) {
          inf[D.Wide] = Math.max(inf[D.Wide], 0.6 * this.peekW)
        }
      }
    }
  }
}
