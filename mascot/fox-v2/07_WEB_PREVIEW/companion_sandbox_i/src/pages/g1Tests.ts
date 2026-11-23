import type { FoxController } from '../mascot';
import { CLIP_META, G1_ONE_SHOT_CLIPS, STREAK_TIER_COLORS, type FoxOneShotClip, type FoxStreakTier } from '../mascot';

// Gate G1 transition / priority / effect tests. Deterministic: the controller is paused (the host
// keeps rendering the frozen pose) and advanced with controller.debug.step(dt).

export interface G1TestResult { name: string; pass: boolean; detail: Record<string, unknown> }
const DT = 1 / 30;

function step(c: FoxController, seconds: number) { for (let t = 0; t < seconds - 1e-9; t += DT) c.debug.step(DT); }
function reset(c: FoxController) {
  c.debug.anim.cancelOneShots(); c.debug.effects.clearTransient();
  c.setReducedMotion(false); c.setEffectsEnabled(true); c.setStreak({ active: false }); c.setLevel(20, { immediate: true }); c.setMood('neutral');
  step(c, 1.2);
}
function foxMaterialSignature(c: FoxController) {
  const out: string[] = [];
  c.debug.fox.traverse(o => {
    const m = o as unknown as { isMesh?: boolean; name: string; material?: unknown };
    if (!m.isMesh || m.name.startsWith('FX_') || m.name.startsWith('PROXY_')) return;
    for (const mat of ([] as { uuid: string; color?: { getHexString(): string }; opacity: number; transparent: boolean; name: string }[]).concat(m.material as never)) {
      out.push(`${m.name}:${mat.uuid}:${mat.color?.getHexString()}:${mat.opacity}:${mat.transparent}`);
    }
  });
  return out.join('|');
}
function faceSignature(c: FoxController) {
  const v: number[] = [];
  c.debug.fox.traverse(o => { const m = o as unknown as { isMesh?: boolean; name: string; morphTargetInfluences?: number[] }; if (m.isMesh && m.morphTargetInfluences && m.name.startsWith('FOX_')) v.push(...m.morphTargetInfluences); });
  return v;
}

export function runG1Tests(c: FoxController): G1TestResult[] {
  const R: G1TestResult[] = [];
  const add = (name: string, pass: boolean, detail: Record<string, unknown> = {}) => R.push({ name, pass, detail });
  const wasPaused = c.isPaused; c.pause();
  const A = c.debug.anim, FX = c.debug.effects;
  try {
    reset(c);
    const baseObjects = FX.getStats().rootObjects, matSig = foxMaterialSignature(c);

    // 1 + 2 + 8: every G1 one-shot plays, animates the face, cleans its effects and returns to the right base
    for (const streak of [false, true]) {
      const rows: Record<string, unknown>[] = [];
      let ok = true;
      for (const clip of G1_ONE_SHOT_CLIPS) {
        reset(c);
        if (streak && clip !== 'streak_lost') c.setStreak({ active: true, tier: 'blue' });
        step(c, 0.6);
        const face0 = faceSignature(c);
        const r = c.play(clip, { priority: 60 });
        let faceDelta = 0, maxFx = 0;
        const D = CLIP_META[clip].durationS;
        for (let t = 0; t < D + 0.4; t += DT) {
          c.debug.step(DT);
          const f = faceSignature(c); faceDelta = Math.max(faceDelta, ...f.map((x, i) => Math.abs(x - face0[i])));
          maxFx = Math.max(maxFx, FX.getStats().active);
        }
        step(c, 2.0);
        const st = c.getState(), fx = FX.getStats();
        const expectBase = streak && clip !== 'streak_lost' ? 'streak_active' : 'idle';
        const row = { clip, r, faceDelta: +faceDelta.toFixed(3), maxEffects: maxFx, after: { shot: st.oneShot, base: st.base, baseW: st.weights[expectBase as 'idle'], effects: fx.active, rootObjects: fx.rootObjects, char: fx.char } };
        const pass = r === 'played' && faceDelta > 0.3 && maxFx > 0 && st.oneShot === null && st.base === expectBase && (st.weights as Record<string, number>)[expectBase] > 0.98 && fx.active === 0 && fx.char === 0 && fx.rootObjects <= baseObjects + 8;
        ok = ok && pass; rows.push({ ...row, pass });
      }
      add(`Every G1 one-shot plays, animates the face, spawns + cleans its effects and returns to ${streak ? 'streak_active (streak on)' : 'idle'}`, ok, { rows });
    }

    // 3: priorities
    reset(c);
    const lu = c.handleEvent('LEVEL_UP', { level: 21 }); step(c, 0.3);
    const tap = A.request('head_pet', { priority: 20, source: 'interaction' });
    add('LEVEL_UP (50) is not interrupted by a head tap (20)', lu.play === 'played' && tap === 'rejected' && A.currentShot === 'level_up', { lu: lu.play, tap, shot: A.currentShot });

    // 4: queue
    reset(c);
    const qc = c.handleEvent('QUEST_COMPLETED'); step(c, 0.2);
    const xp = c.handleEvent('XP_GAINED', { amount: 50 });
    const q = A.queued.map(x => x.name);
    step(c, CLIP_META.quest_complete.durationS + 0.1);
    add('QUEST_COMPLETED then XP_GAINED: receive_xp waits in the queue and plays after quest_complete', qc.play === 'played' && xp.play === 'queued' && q[0] === 'receive_xp' && A.currentShot === 'receive_xp', { qc: qc.play, xp: xp.play, queue: q, next: A.currentShot });

    // 5: level applied at the apex cue
    reset(c);
    c.handleEvent('LEVEL_UP', { level: 30 });
    // G1.1 timeline: apex cue at f41 = 1.667 s
    step(c, 1.4); const before = c.getState().scale;
    step(c, 0.5); const pending = c.getState().pendingLevel;
    step(c, 1.0); const after = c.getState().scale;
    add('LEVEL_UP grows the fox at the jump apex (G1.1 cue 1.667 s), not before', before === 1 && pending === null && Math.abs(after - 1.1) < 0.01, { scaleAt140: before, pendingAfterApex: pending, scaleAt290: after });

    // 6: streak_active is a base loop that does not own head or face; petting works and the flame stays
    reset(c);
    c.setStreak({ active: true, tier: 'purple' }); step(c, 1.0);
    const s0 = c.getState();
    const pet = A.request('head_pet', { priority: 20, source: 'interaction' }); step(c, 1.0);
    const flameDuring = c.getStreak().flameVisible, shotDuring = A.currentShot;
    step(c, CLIP_META.head_pet.durationS + 0.6);
    const s1 = c.getState();
    add('streak_active: base loop with look-at free (head/face not owned); head_pet plays over it, flame stays, returns to streak_active',
      s0.base === 'streak_active' && s0.weights.streak_active > 0.98 && CLIP_META.streak_active.headControl === 0 && pet === 'played' && shotDuring === 'head_pet' && flameDuring && s1.base === 'streak_active' && s1.oneShot === null && c.getStreak().flameVisible,
      { base: s0.base, w: s0.weights.streak_active, pet, flameDuring, after: s1.base });

    // 7: interrupted streak_lost cleans up immediately
    reset(c);
    c.setStreak({ active: true, tier: 'orange' }); step(c, 0.6);
    c.handleEvent('STREAK_LOST'); step(c, 1.75);   // G1.1: strike at f37 = 1.5 s, lighter brief soot (strength 0.32)
    const midChar = FX.getStats().char, midLightning = FX.getStats().byCategory.lightning ?? 0;
    c.play('wave', { priority: 60 }); step(c, 0.4);
    const fxAfter = FX.getStats();
    add('streak_lost interrupted after the strike: char overlay removed (≤ 0.4 s), streak ended, effects stopped', midChar > 0.15 && fxAfter.char === 0 && !c.getStreak().active && (fxAfter.byCategory.lightning ?? 0) === 0,
      { charBefore: midChar, lightningBefore: midLightning, charAfter: fxAfter.char, streak: c.getStreak(), active: fxAfter.byCategory });

    // 9: Fox materials never modified
    reset(c);
    c.setStreak({ active: true }); c.handleEvent('STREAK_LOST'); step(c, 1.2);
    const sigDuring = foxMaterialSignature(c);
    step(c, 5); const sigAfter = foxMaterialSignature(c);
    add('Char effect never modifies the Fox materials (same objects, colour, opacity, transparency during and after)', sigDuring === matSig && sigAfter === matSig, { materials: matSig.split('|').length });

    // 10: tiers
    reset(c);
    const tiers: Record<string, unknown> = {}; let tiersOk = true;
    for (const [days, tier] of [[3, 'orange'], [7, 'blue'], [14, 'purple'], [30, 'crimson']] as [number, FoxStreakTier][]) {
      c.setStreak({ active: true, days }); step(c, 1.5);
      const col = FX.streak.colors, want = STREAK_TIER_COLORS[tier];
      const hx = (h: string) => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
      const okT = c.getStreak().tier === tier && hx(col.mid).every((v, i) => Math.abs(v - hx(want.mid)[i]) <= 2);
      tiers[`${days}d`] = { tier: c.getStreak().tier, mid: col.mid, want: want.mid }; tiersOk = tiersOk && okT;
    }
    add('Streak tiers by days: 3 orange · 7 blue · 14 purple · 30 crimson (flame colours)', tiersOk, tiers);

    // 11: effects disabled → no visuals, logic still runs
    reset(c);
    c.setEffectsEnabled(false);
    c.handleEvent('LEVEL_UP', { level: 1 }); let maxFxOff = 0;
    for (let t = 0; t < 2.5; t += DT) { c.debug.step(DT); maxFxOff = Math.max(maxFxOff, FX.getStats().active); }
    add('Effects disabled: no effect objects spawn, but the level change still applies at the apex', maxFxOff === 0 && Math.abs(c.getState().scale - 0.8) < 0.01, { maxEffects: maxFxOff, scale: c.getState().scale });

    // 12: reduced motion
    reset(c);
    c.setReducedMotion(true); c.setStreak({ active: true }); step(c, 0.5);
    const rl = c.handleEvent('STREAK_LOST'); let lightning = 0;
    for (let t = 0; t < 1.5; t += DT) { c.debug.step(DT); lightning = Math.max(lightning, FX.getStats().byCategory.lightning ?? 0); }
    add('Reduced motion: STREAK_LOST → flame fades out gently + sad face, no lightning / char / jolt', !c.getStreak().active && lightning === 0 && FX.getStats().char === 0 && c.getState().oneShot === null && (rl.steps ?? []).every(s => s.kind !== 'play'),
      { streak: c.getStreak(), lightning, steps: rl.steps });

    // 13: module fallback path is wired (registry reacts with fallbackSteps when a clip is missing)
    const avail = new Set(c.availableClips());
    add('All 9 G1 clips are bound on this instance (core + module = 16 clips)', G1_ONE_SHOT_CLIPS.every((k: FoxOneShotClip) => avail.has(k)) && avail.has('streak_active') && avail.size === 16, { available: [...avail] });
    reset(c);
  } finally { if (!wasPaused) c.resume(); }
  return R;
}
