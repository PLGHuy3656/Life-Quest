import { Mesh } from 'three';
import { EXPRESSIONS, type FoxMood } from './foxContract';
import { smooth } from './foxMath';

// Facial morph layer. A persistent mood plus optional timed "pulses" (e.g. an event shows `sad`
// for 4 s, then the persistent mood returns). Clips with faceControl own the face while they play;
// the mood fades back in afterwards. Only existing D1.1 morph targets are written.

export class FoxFaceController {
  private mood: FoxMood = 'neutral';
  private pulse: { mood: FoxMood; until: number } | null = null;
  private shown: FoxMood = 'neutral';
  private w = 0;
  private t = 0;
  /** Weight the face layer had this frame (idle blink is skipped while an expression owns the eyes). */
  override = 0;

  constructor(private meshes: Mesh[]) {}

  setMood(mood: FoxMood, durationS?: number) {
    if (!(mood in EXPRESSIONS)) return;
    if (durationS && durationS > 0) this.pulse = { mood, until: this.t + durationS };
    else { this.mood = mood; this.pulse = null; }
  }
  get persistentMood() { return this.mood; }
  get visibleMood(): FoxMood { return this.pulse ? this.pulse.mood : this.mood; }

  update(dt: number, faceControl: number) {
    this.t += dt;
    if (this.pulse && this.t >= this.pulse.until) this.pulse = null;
    const want = this.visibleMood;
    // switching moods fades through the current weight (no hard pop)
    if (want !== this.shown) { this.w = smooth(this.w, 0, 14, dt); if (this.w < 0.05 || this.shown === 'neutral') this.shown = want; }
    else this.w = smooth(this.w, want === 'neutral' ? 0 : 1, 12, dt);
    const w = this.w * (1 - faceControl);
    this.override = w;
    if (w < 1e-4) return;
    const tgt = EXPRESSIONS[this.shown];
    for (const m of this.meshes) {
      const dict = m.morphTargetDictionary!, inf = m.morphTargetInfluences!, set = tgt[m.name];
      for (const morph in dict) { const i = dict[morph]; inf[i] = inf[i] * (1 - w) + ((set && set[morph]) || 0) * w; }
    }
  }
}
