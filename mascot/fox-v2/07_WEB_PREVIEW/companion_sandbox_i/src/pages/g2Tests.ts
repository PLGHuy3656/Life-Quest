import { Vector3 } from 'three';
import type { FoxController, FoxState } from '../mascot';
import { CLIP_META, FOX_STATE_DEFS, G2_BASE_CLIPS, G2_ONE_SHOT_CLIPS, type FoxClipName, type FoxEventName } from '../mascot';

// Gate G2 transition / priority / interaction / prop / lifecycle tests. Deterministic: the controller is
// paused (the host keeps drawing the frozen pose) and advanced with controller.debug.step(dt).
// Assertions are not relaxed to pass: every threshold is written next to the check and reported.

export interface G2TestResult { name: string; pass: boolean; detail: Record<string, unknown> }
const DT = 1 / 30;

function step(c: FoxController, seconds: number, each?: () => void) { for (let t = 0; t < seconds - 1e-9; t += DT) { c.debug.step(DT); each?.(); } }
function reset(c: FoxController) {
  const d = c.debug;
  d.daily.clear(); d.anim.cancelOneShots(); d.effects.clearTransient(); d.effects.clearProps();
  c.setReducedMotion(false); c.setEffectsEnabled(true); c.setStreak({ active: false }); c.setLevel(20, { immediate: true }); c.setMood('neutral');
  c.setActivity('idle'); d.anim.setBaseInstant('idle', 0); c.setDailyTuning({ impatienceAfterS: 20 });
  step(c, 0.8);
}
function ev(c: FoxController, name: FoxEventName, payload?: unknown) { return c.handleEvent(name as string, payload); }
function bonesWorld(c: FoxController) {
  const out: number[] = [], v = new Vector3();
  for (const n of ['HIPS', 'HEAD', 'PAW_L', 'PAW_R', 'FOOT_L', 'FOOT_R', 'TAIL_04', 'EAR_L_02']) { c.debug.bones[n].getWorldPosition(v); out.push(v.x, v.y, v.z); }
  return out;
}
function faceSig(c: FoxController) {
  const v: number[] = [];
  c.debug.fox.traverse(o => { const m = o as unknown as { isMesh?: boolean; name: string; morphTargetInfluences?: number[] }; if (m.isMesh && m.morphTargetInfluences && m.name.startsWith('FOX_')) v.push(...m.morphTargetInfluences); });
  return v;
}
function eyeHide(c: FoxController) {
  const m = c.debug.objs.FOX_Eye_L as unknown as { morphTargetDictionary?: Record<string, number>; morphTargetInfluences?: number[] };
  return m?.morphTargetInfluences && m.morphTargetDictionary ? m.morphTargetInfluences[m.morphTargetDictionary.hide] : -1;
}
function matSig(c: FoxController) {
  const out: string[] = [];
  c.debug.fox.traverse(o => {
    const m = o as unknown as { isMesh?: boolean; name: string; material?: unknown; children: unknown[] };
    if (!m.isMesh || m.name.startsWith('FX_') || m.name.startsWith('PROXY_')) return;
    for (const mat of ([] as { uuid: string; color?: { getHexString(): string }; opacity: number; transparent: boolean }[]).concat(m.material as never)) out.push(`${m.name}:${mat.uuid}:${mat.color?.getHexString()}:${mat.opacity}:${mat.transparent}`);
  });
  return out.join('|');
}
const BN = ['HIPS', 'HEAD', 'PAW_L', 'PAW_R', 'FOOT_L', 'FOOT_R', 'TAIL_04', 'EAR_L_02'];
const shotsDuring = (c: FoxController, seconds: number) => {
  const seen: string[] = []; let maxJump = 0, prev = bonesWorld(c); const jumps: number[] = [], who: string[] = [];
  step(c, seconds, () => {
    const s = c.debug.anim.currentShot; if (s && seen[seen.length - 1] !== s) seen.push(s);
    const b = bonesWorld(c); let m = 0, mb = '';
    for (let i = 0; i < b.length; i += 3) { const d = Math.hypot(b[i] - prev[i], b[i + 1] - prev[i + 1], b[i + 2] - prev[i + 2]); if (d > m) { m = d; mb = BN[i / 3]; } }
    jumps.push(m); who.push(`${mb}@${c.getState().base}/${c.debug.anim.currentShot ?? '-'}`); maxJump = Math.max(maxJump, m); prev = b;
  });
  return { seen, maxJump, jumps, who };
};
/** A transition pop = a frame whose bone motion is far above both neighbours (and above 2.5 cm / frame at 30 fps). */
function pops(j: number[]) { const out: number[] = []; for (let i = 2; i < j.length - 2; i++) { const nb = Math.max(j[i - 2], j[i - 1], j[i + 1], j[i + 2]); if (j[i] > 0.025 && j[i] > 2.5 * nb) out.push(i); } return out; }

export function runG2Tests(c: FoxController): G2TestResult[] {
  const R: G2TestResult[] = [];
  const add = (name: string, pass: boolean, detail: Record<string, unknown> = {}) => R.push({ name, pass, detail });
  const wasPaused = c.isPaused; c.pause();
  const A = c.debug.anim, FX = c.debug.effects, D = c.debug.daily;
  const warns: string[] = []; const ow = console.warn; console.warn = (...a: unknown[]) => { warns.push(a.map(String).join(' ')); ow(...a); };
  try {
    reset(c);
    const sig0 = matSig(c), fxObjects0 = FX.getStats().rootObjects;
    const mod = c.getStats().modules.find(m => m.id === 'g2_daily_life');
    const all = [...G2_BASE_CLIPS, ...G2_ONE_SHOT_CLIPS];
    add('G2 module bound: every G2 clip available', !!mod?.ok && all.every(k => A.has(k)), { module: mod, missing: all.filter(k => !A.has(k)) });

    // ---------------------------------------------------------------- each G2 one-shot: plays, owns the face, cleans up
    {
      const rows: Record<string, unknown>[] = []; let ok = true;
      for (const clip of G2_ONE_SHOT_CLIPS) {
        reset(c);
        const f0 = faceSig(c); const r = c.play(clip as FoxClipName, { priority: 60 }); let fd = 0;
        step(c, CLIP_META[clip].durationS + 0.4, () => { const f = faceSig(c); fd = Math.max(fd, ...f.map((x, i) => Math.abs(x - f0[i]))); });
        step(c, 1.0);
        const st = c.getState();
        const row = { clip, r, faceDelta: +fd.toFixed(3), base: st.base, shot: st.oneShot, fxActive: FX.getStats().active, props: FX.propState().map(p => p.id) };
        rows.push(row);
        if (r !== 'played' || fd < 0.2 || st.oneShot !== null || st.base !== 'idle' || row.props.length) ok = false;
      }
      add('every G2 one-shot plays, drives the face (Δ ≥ 0.2), ends on idle without leftover props', ok, { rows });
    }

    // ---------------------------------------------------------------- the five required round trips
    const trips: [string, [FoxEventName, unknown?][], FoxState][] = [
      ['idle → study → idle', [['STUDY_STARTED'], ['STUDY_COMPLETED']], 'study'],
      ['idle → sports → idle', [['SPORTS_STARTED'], ['SPORTS_COMPLETED']], 'sports'],
      ['idle → sleep → wake → idle', [['SLEEP_ENTERED'], ['SLEEP_ENDED']], 'sleep'],
      ['idle → alarm → alarm_success → idle', [['ALARM_STARTED'], ['ALARM_DISMISSED']], 'alarm'],
      ['idle → cooldown → cooldown_complete → idle', [['COOLDOWN_STARTED', { progress: 0.25 }], ['COOLDOWN_COMPLETED']], 'cooldown'],
    ];
    for (const [name, [enter, exit], state] of trips) {
      reset(c);
      const def = FOX_STATE_DEFS[state];
      const r1 = ev(c, enter[0], enter[1]);
      const a = shotsDuring(c, (def.start ? CLIP_META[def.start].durationS : 0) + 0.6);
      const mid = c.getState(), midProps = FX.propState().map(p => p.id).sort(), midFx = FX.activeStateFx();
      const loopT = A.baseTime(def.base);
      const b = shotsDuring(c, 2.0);                                  // loop persists
      const persist = c.getState().base === def.base && D.visible === state;
      const r2 = ev(c, exit[0], exit[1]);
      const e = shotsDuring(c, (def.complete ? CLIP_META[def.complete].durationS : 0) + 1.5);
      const end = c.getState();
      const pp = [...pops(a.jumps).map(i => `start f${i} ${a.who[i]} ${a.jumps[i].toFixed(3)}`), ...pops(b.jumps).map(i => `loop f${i} ${b.who[i]}`), ...pops(e.jumps).map(i => `exit f${i} ${e.who[i]} ${e.jumps[i].toFixed(3)}`)];
      const pass = r1.result === 'handled' && r2.result === 'handled'
        && (!def.start || a.seen.includes(def.start)) && mid.base === def.base && D.visible === null && persist
        && JSON.stringify(midProps) === JSON.stringify([...def.props].sort()) && def.fx.filter(f => f !== 'timer.watch').every(f => midFx.includes(f as never))
        && (!def.complete || e.seen.includes(def.complete)) && end.base === 'idle' && end.oneShot === null && FX.propState().length === 0 && FX.activeStateFx().length === 0 && pp.length === 0;
      add(`transition ${name}`, pass, { startShots: a.seen, midBase: mid.base, loopTimeAfterStart: +loopT.toFixed(3), midProps, midFx, persist, exitShots: e.seen, endBase: end.base,
        endProps: FX.propState(), endFx: FX.activeStateFx(), maxBoneStepPerFrame_m: +Math.max(a.maxJump, b.maxJump, e.maxJump).toFixed(4), pops: pp, popRule: '> 2.5 cm/frame and > 2.5× both neighbours' });
    }

    // the state loop begins where the start clip ends (loop time at the switch ≈ 0)
    {
      reset(c);
      ev(c, 'STUDY_STARTED');
      let switchT: number | null = null, prev: string = A.getBase();
      step(c, CLIP_META.study_start.durationS + 0.3, () => { const b = A.getBase(); if (b !== prev && b === 'study_focus') switchT = A.baseTime('study_focus'); prev = b; });
      add('start clip → state loop switched under it at loop time ≈ 0', switchT !== null && switchT < 0.1, { loopTimeAtSwitch: switchT });
    }

    // ---------------------------------------------------------------- WAKE_REQUESTED / WAKE_LATE / alarm from sleep
    {
      reset(c); ev(c, 'SLEEP_ENTERED'); step(c, CLIP_META.sleep_enter.durationS + 1);
      const r = ev(c, 'WAKE_REQUESTED'); const s = shotsDuring(c, CLIP_META.wake_start.durationS + 1.2);
      add('WAKE_REQUESTED while asleep → wake_start → idle', s.seen.includes('wake_start') && c.getState().base === 'idle' && D.visible === null && FX.propState().length === 0, { r: r.state, shots: s.seen, base: c.getState().base });
      reset(c); const r2 = ev(c, 'WAKE_REQUESTED'); const s2 = shotsDuring(c, 3);
      add('WAKE_REQUESTED while awake → wave (no state change)', s2.seen.includes('wave') && D.visible === null, { shots: s2.seen, steps: r2.steps });
      reset(c); ev(c, 'SLEEP_ENTERED'); step(c, CLIP_META.sleep_enter.durationS + 1);
      ev(c, 'WAKE_LATE'); const s3 = shotsDuring(c, CLIP_META.wake_start.durationS + CLIP_META.wake_late.durationS + 1.5);
      add('WAKE_LATE while asleep → wake_start then wake_late (queued) → idle', s3.seen.join() === 'wake_start,wake_late' && c.getState().base === 'idle', { shots: s3.seen });
      reset(c); ev(c, 'SLEEP_ENTERED'); step(c, CLIP_META.sleep_enter.durationS + 1);
      ev(c, 'ALARM_STARTED'); const s4 = shotsDuring(c, CLIP_META.wake_start.durationS + 1.5);
      const ok4 = s4.seen.includes('wake_start') && D.visible === 'alarm' && c.getState().base === 'alarm_ring' && !D.isActive('sleep') && FX.propState().some(p => p.id === 'alarm_clock');
      ev(c, 'ALARM_DISMISSED'); const s5 = shotsDuring(c, CLIP_META.alarm_success.durationS + 1.5);
      add('ALARM_STARTED while asleep → wake_start → alarm_ring; dismissed → alarm_success → idle', ok4 && s5.seen.includes('alarm_success') && c.getState().base === 'idle' && FX.propState().length === 0,
        { wake: s4.seen, visibleAfterWake: ok4, dismiss: s5.seen, props: FX.propState() });
      reset(c); ev(c, 'ALARM_STARTED'); step(c, 1); ev(c, 'ALARM_DISMISSED', { snoozed: true }); const s6 = shotsDuring(c, 1.5);
      add('ALARM_DISMISSED {snoozed} → no celebration, alarm ends', !s6.seen.includes('alarm_success') && D.visible === null && c.getState().base === 'idle', { shots: s6.seen });
    }

    // ---------------------------------------------------------------- priorities: alarm over study, study resumes
    {
      reset(c); ev(c, 'STUDY_STARTED'); step(c, CLIP_META.study_start.durationS + 0.5);
      ev(c, 'ALARM_STARTED'); step(c, 1.0);
      const during = { visible: D.visible, active: D.activeStates(), base: c.getState().base, props: FX.propState().map(p => p.id).sort() };
      ev(c, 'ALARM_DISMISSED'); const s = shotsDuring(c, CLIP_META.alarm_success.durationS + CLIP_META.study_start.durationS + 1);
      const after = { visible: D.visible, base: c.getState().base, props: FX.propState().map(p => p.id).sort() };
      ev(c, 'STUDY_COMPLETED'); step(c, CLIP_META.study_complete.durationS + 1);
      add('priority: alarm (60) suspends study (35); dismiss → alarm_success → study resumes (study_start) → complete → idle',
        during.visible === 'alarm' && during.base === 'alarm_ring' && during.active.join() === 'alarm,study' && during.props.join() === 'alarm_clock'
        && s.seen.join() === 'alarm_success,study_start' && after.visible === 'study' && after.base === 'study_focus' && after.props.join() === 'notebook,pencil'
        && c.getState().base === 'idle' && D.activeStates().length === 0, { during, resumeShots: s.seen, after, end: c.getState().base });
      reset(c); ev(c, 'SPORTS_STARTED'); step(c, 3); const r = ev(c, 'COOLDOWN_STARTED', { progress: 0.1 }); step(c, 1);
      add('priority: cooldown (25) behind sports (40) stays suspended, sports keeps the base', r.state === 'suspended' && D.visible === 'sports' && c.getState().base === 'sports_active' && !FX.propState().some(p => p.id === 'timer'),
        { r: r.state, visible: D.visible, base: c.getState().base });
    }

    // ---------------------------------------------------------------- interruptions
    {
      reset(c); ev(c, 'STUDY_STARTED'); step(c, 0.7);
      const np = FX.propState().map(p => p.id);
      ev(c, 'QUEST_COMPLETED'); const s = shotsDuring(c, CLIP_META.quest_complete.durationS + 1.0);
      const ok = s.seen[0] === 'quest_complete' && c.getState().base === 'study_focus' && D.visible === 'study' && FX.propState().map(p => p.id).sort().join() === 'notebook,pencil';
      add('interrupt: QUEST_COMPLETED (50) interrupts study_start; afterwards the study loop + props are restored', ok, { propsBefore: np, shots: s.seen, base: c.getState().base, props: FX.propState() });
      reset(c); ev(c, 'STUDY_STARTED'); step(c, 0.7);
      ev(c, 'ALARM_STARTED'); step(c, 1.2);
      add('cancel: alarm during study_start → notebook / pencil leave, alarm clock appears', FX.propState().map(p => p.id).join() === 'alarm_clock' && c.getState().base === 'alarm_ring', { props: FX.propState(), base: c.getState().base });
      reset(c); ev(c, 'SLEEP_ENTERED'); step(c, 1.0); const r3 = ev(c, 'SLEEP_ENDED'); const s2 = shotsDuring(c, 2.0);
      add('interrupt: SLEEP_ENDED during sleep_enter → start clip fades out (posture fade, no pop), idle, no pillow / mat', r3.state === 'left-mid-start' && !s2.seen.length && c.getState().base === 'idle' && c.getState().oneShot === null && FX.propState().length === 0 && pops(s2.jumps).length === 0,
        { r: r3.state, shots: s2.seen, props: FX.propState(), maxStep: +s2.maxJump.toFixed(4) });
      reset(c); ev(c, 'SLEEP_ENTERED'); step(c, CLIP_META.sleep_enter.durationS - 0.2); const r4 = ev(c, 'SLEEP_ENDED'); const s4 = shotsDuring(c, CLIP_META.sleep_wake.durationS + 1.5);
      add('SLEEP_ENDED once the loop is under the start clip → sleep_wake → idle', s4.seen.includes('sleep_wake') && c.getState().base === 'idle' && FX.propState().length === 0, { r: r4.state, shots: s4.seen });
    }

    // ---------------------------------------------------------------- temporary interactions never break a state
    {
      const tap = (t: 'head' | 'tail') => (c.debug.interaction as unknown as { cb: { onTap(t: string, v: string): void } }).cb.onTap(t, 'keyboard');
      const rows: Record<string, unknown>[] = []; let ok = true;
      for (const [state, enter, expect] of [['study', 'STUDY_STARTED', 'reaction'], ['sleep', 'SLEEP_ENTERED', 'reaction'], ['alarm', 'ALARM_STARTED', 'clip'], ['sports', 'SPORTS_STARTED', 'clip'], ['cooldown', 'COOLDOWN_STARTED', 'clip']] as const) {
        reset(c); ev(c, enter as FoxEventName); const def = FOX_STATE_DEFS[state];
        step(c, (def.start ? CLIP_META[def.start].durationS : 0) + 0.8);
        const rl0 = D.reactions.log.length; let minEye = 1;
        tap('head'); const s1 = shotsDuring(c, 0.5); minEye = Math.min(minEye, eyeHide(c));
        step(c, 3.6, () => { minEye = Math.min(minEye, eyeHide(c)); }); tap('tail'); const s2 = shotsDuring(c, 4.0);
        const st = c.getState();
        const row = { state, shots: [...s1.seen, ...s2.seen], reactions: D.reactions.log.length - rl0, base: st.base, visible: D.visible, minEyeHide: +minEye.toFixed(3) };
        rows.push(row);
        const kept = st.base === def.base && D.visible === state;
        if (expect === 'reaction' && (row.shots.length || row.reactions < 2 || !kept)) ok = false;
        if (expect === 'clip' && (!row.shots.includes('head_pet') || !kept)) ok = false;
        if (state === 'sleep' && row.minEyeHide < 0.99) ok = false;              // eyes stay closed while asleep (open-eye mesh hidden)
      }
      add('interaction: head-pet / tail-touch never end study, sleep, alarm, sports or cooldown (seated / asleep answer procedurally)', ok, { rows });
    }

    // ---------------------------------------------------------------- low-priority events are suppressed by states
    {
      reset(c); ev(c, 'SLEEP_ENTERED'); step(c, CLIP_META.sleep_enter.durationS + 1);
      const r = ev(c, 'XP_GAINED'); step(c, 0.5);
      reset(c); ev(c, 'STUDY_STARTED'); step(c, CLIP_META.study_start.durationS + 0.5);
      const r2 = ev(c, 'TASK_COMPLETED'); step(c, 0.3); const shot2 = c.getState().oneShot;
      const r3 = ev(c, 'QUEST_COMPLETED'); step(c, 0.3); const shot3 = c.getState().oneShot;
      add('event thresholds: sleep suppresses XP_GAINED, study suppresses TASK_COMPLETED (20 < 50) but plays QUEST_COMPLETED (50)',
        r.suppressedBy === 'sleep' && r2.suppressedBy === 'study' && shot2 === null && shot3 === 'quest_complete' && !r3.suppressedBy, { r: r.suppressedBy, r2: r2.suppressedBy, shot2, shot3 });
    }

    // ---------------------------------------------------------------- idle variation never fires during sleep / sports / alarm
    {
      const rows: Record<string, unknown>[] = []; let ok = true;
      for (const enter of ['SLEEP_ENTERED', 'SPORTS_STARTED', 'ALARM_STARTED'] as FoxEventName[]) {
        reset(c); ev(c, enter); step(c, 5); const n0 = c.debug.idle.log.filter(e => e.type !== 'tempo').length;
        let maxW = 0; step(c, 25, () => { maxW = Math.max(maxW, c.debug.idle.weight); });
        const n1 = c.debug.idle.log.filter(e => e.type !== 'tempo').length;
        rows.push({ enter, newIdleEvents: n1 - n0, maxIdleWeight: +maxW.toFixed(4) }); if (n1 !== n0 || maxW > 0.001) ok = false;
      }
      add('idle variation never interrupts sleep, exercise or an active alarm (25 s each)', ok, { rows });
    }

    // ---------------------------------------------------------------- cooldown: data-driven progress + runtime impatience
    {
      reset(c); c.setDailyTuning({ impatienceAfterS: 3 });
      ev(c, 'COOLDOWN_STARTED', { progress: 0.1 }); step(c, 1.0);
      c.setCooldown({ progress: 0.4 }); step(c, 1.5);
      const timer = FX.getProp('timer') as unknown as { value: number } | undefined;
      const p1 = timer?.value ?? -1, base1 = c.getState().base;
      step(c, 2.0);
      const base2 = c.getState().base;
      ev(c, 'COOLDOWN_STARTED', { durationS: 10, progress: 0.5 }); c.setCooldown({ durationS: 10 });
      reset(c); c.setDailyTuning({ impatienceAfterS: 999 }); ev(c, 'COOLDOWN_STARTED', { durationS: 4 }); step(c, 2.0);
      const interp = D.cooldown.progress;
      ev(c, 'COOLDOWN_COMPLETED'); const s = shotsDuring(c, CLIP_META.cooldown_complete.durationS + 1);
      add('cooldown: progress is data (0.4 → timer 0.4), impatience only after the runtime delay (3 s), display interpolation from an app duration, complete → idle',
        Math.abs(p1 - 0.4) < 1e-6 && base1 === 'cooldown_wait' && base2 === 'cooldown_wait_impatient' && interp > 0.4 && interp < 0.6 && s.seen.includes('cooldown_complete') && c.getState().base === 'idle' && !FX.propState().length,
        { timerValue: p1, baseBeforeDelay: base1, baseAfterDelay: base2, interpolatedAt2sOf4s: +interp.toFixed(3), shots: s.seen });
    }

    // ---------------------------------------------------------------- reduced motion
    {
      reset(c); c.setReducedMotion(true);
      ev(c, 'STUDY_STARTED'); const s = shotsDuring(c, 1.0); const b1 = c.getState().base;
      ev(c, 'STUDY_COMPLETED'); step(c, 1.0);
      ev(c, 'SPORTS_STARTED'); step(c, 1.0); const b2 = c.getState().base, fx2 = FX.activeStateFx();
      ev(c, 'SPORTS_COMPLETED'); step(c, 1.0);
      add('reduced motion: large start / complete clips skipped (face pulse), study loop kept, sports uses idle without sweat', s.seen.length === 0 && b1 === 'study_focus' && b2 === 'idle' && fx2.length === 0 && c.getState().base === 'idle',
        { shots: s.seen, studyBase: b1, sportsBase: b2, sportsFx: fx2 });
      c.setReducedMotion(false);
    }

    // ---------------------------------------------------------------- level scale: props follow the Fox scale
    {
      reset(c); ev(c, 'COOLDOWN_STARTED', { progress: 0.3 }); step(c, 1);
      c.setLevel(1, { immediate: true }); step(c, 0.2); const s1 = [c.debug.fox.scale.x, FX.root.scale.x];
      c.setLevel(35, { immediate: true }); step(c, 0.2); const s2 = [c.debug.fox.scale.x, FX.root.scale.x];
      add('level scaling: props / effects root scale = Fox scale (Lv1, Lv35)', Math.abs(s1[0] - s1[1]) < 1e-6 && Math.abs(s2[0] - s2[1]) < 1e-6 && s1[0] < s2[0], { lv1: s1, lv35: s2 });
    }

    // ---------------------------------------------------------------- pause / resume / dispose-safe cleanup
    {
      reset(c); ev(c, 'STUDY_STARTED'); step(c, CLIP_META.study_start.durationS + 1);
      const t0 = A.baseTime('study_focus');
      for (let i = 0; i < 20; i++) c.update(DT);                     // paused: update() is a no-op
      const t1 = A.baseTime('study_focus');
      step(c, 0.5); const t2 = A.baseTime('study_focus');
      add('pause freezes the state loop; stepping resumes it', Math.abs(t1 - t0) < 1e-9 && t2 > t1, { t0, t1, t2 });
      d_clearAll(c);
      add('clear(): no props / state effects / FX objects remain', FX.propState().length === 0 && FX.activeStateFx().length === 0 && FX.getStats().rootObjects <= fxObjects0 + 1, { objects: FX.getStats().rootObjects, baseline: fxObjects0 });
    }

    add('Fox materials never modified by G2 props / effects', matSig(c) === sig0, {});
    add('no unknown effect cues / clips / states warned during the suite', !warns.some(w => /unknown/.test(w)), { warns: warns.slice(0, 10) });
  } finally {
    console.warn = ow;
    reset(c);
    if (!wasPaused) c.resume();
  }
  return R;
}

function d_clearAll(c: FoxController) {
  c.debug.daily.clear(); c.debug.anim.cancelOneShots(); c.debug.effects.clearTransient();
  for (let i = 0; i < 40; i++) c.debug.step(DT);
}

/** Fallback suite (page loaded with ?modules=0): every G2 event still answers with its documented fallback. */
export function runG2FallbackTests(c: FoxController): G2TestResult[] {
  const R: G2TestResult[] = [];
  const add = (name: string, pass: boolean, detail: Record<string, unknown> = {}) => R.push({ name, pass, detail });
  const wasPaused = c.isPaused; c.pause();
  try {
    reset(c);
    add('G2 module absent: no G2 clip available', ![...G2_BASE_CLIPS, ...G2_ONE_SHOT_CLIPS].some(k => c.debug.anim.has(k)), { modules: c.getStats().modules });
    const rows: Record<string, unknown>[] = []; let ok = true;
    const cases: [FoxEventName, unknown, (s: ReturnType<FoxController['getState']>) => boolean][] = [
      ['SLEEP_ENTERED', undefined, s => s.activity === 'resting' && s.base === 'idle'],
      ['SLEEP_ENDED', undefined, s => s.activity === 'idle'],
      ['STUDY_STARTED', undefined, s => s.base === 'idle' && s.mood === 'proud'],
      ['STUDY_COMPLETED', undefined, s => s.base === 'idle'],
      ['SPORTS_STARTED', undefined, s => s.base === 'idle' && s.mood === 'excited'],
      ['SPORTS_COMPLETED', undefined, s => s.base === 'idle'],
      ['ALARM_STARTED', undefined, s => s.base === 'idle' && s.mood === 'surprised'],
      ['ALARM_DISMISSED', undefined, s => s.base === 'idle'],
      ['COOLDOWN_STARTED', { progress: 0.2 }, s => s.base === 'idle'],
      ['COOLDOWN_COMPLETED', undefined, s => s.base === 'idle'],
      ['WAKE_REQUESTED', undefined, s => s.oneShot === 'wave'],
      ['WAKE_LATE', undefined, s => s.mood === 'surprised'],
    ];
    for (const [name, payload, check] of cases) {
      const r = c.handleEvent(name as string, payload); step(c, 0.4);
      const st = c.getState(); const pass = r.result === 'handled' && check(st) && c.debug.effects.propState().length === 0;
      rows.push({ name, result: r.result, state: r.state, activity: st.activity, base: st.base, mood: st.mood, shot: st.oneShot, pass });
      if (!pass) ok = false; step(c, 3);
    }
    add('every G2 event answers with its documented fallback (no clip, no prop, no error)', ok, { rows });
  } finally { reset(c); if (!wasPaused) c.resume(); }
  return R;
}
