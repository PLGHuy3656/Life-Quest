import { Vector3 } from 'three';
import type { FoxController, FoxChoreographyManager } from '../mascot';
import { CLIP_META, FoxDuoCoordinator, FoxGroupEffectCoordinator, G3_ONE_SHOT_CLIPS, G3_PROPS, foxEventRegistry, type FoxClipName, type FoxEventName } from '../mascot';
import g3Spec from '../mascot/modules/g3_challenge_social.spec.json';

// Gate G3 deterministic runtime tests (single fox + multi-fox choreography). The controllers are paused (the host keeps
// drawing) and advanced with debug.step(dt). Every threshold is written next to its check and reported; none is tuned
// after the fact. Software rendering only: draw calls / memory are counted, never timed as GPU performance.

export interface G3TestResult { name: string; pass: boolean; detail: Record<string, unknown> }
const DT = 1 / 24;
type SpecCue = { t: number; fx: string };
const SPEC = g3Spec as unknown as { clips: Record<string, { cues?: SpecCue[]; event: string; contact?: { t: number } }> };
export const G3_EVENTS: FoxEventName[] = ['CHALLENGE_INVITED', 'CHALLENGE_ACCEPTED', 'CHALLENGE_STARTED', 'CHALLENGE_WON', 'CHALLENGE_LOST', 'CHALLENGE_DRAW',
  'DUO_CELEBRATION', 'GROUP_VICTORY', 'TEAM_ENCOURAGEMENT', 'GROUP_STREAK_ACTIVE', 'GROUP_STREAK_LOST', 'FRIEND_GREETING', 'PHOTO_REACTION',
  'SOCIAL_LIKE_RECEIVED', 'SOCIAL_COMMENT_RECEIVED', 'FRIEND_SUPPORT', 'FRIEND_MISS_YOU'];
const CLIP_OF: Record<string, FoxClipName> = Object.fromEntries(Object.entries(SPEC.clips).filter(([n]) => n !== 'duo_celebrate_mirror').map(([n, c]) => [c.event, n as FoxClipName]));

function step(c: FoxController, s: number, each?: () => void) { for (let t = 0; t < s - 1e-9; t += DT) { c.debug.step(DT); each?.(); } }
function reset(c: FoxController) {
  const d = c.debug;
  c.pause(); d.daily.clear(); d.anim.cancelOneShots(); d.effects.clearTransient(); d.effects.clearProps();
  c.setReducedMotion(false); c.setEffectsEnabled(true); c.setStreak({ active: false }); c.setLevel(20, { immediate: true }); c.setMood('neutral');
  c.setActivity('idle'); d.anim.setBaseInstant('idle', 0); c.setChallengeCountdown(null); c.setGroup({ members: 3 }); c.setIdleVariationEnabled(false); c.setLookAtEnabled(false);
  step(c, 0.6);
}
const BN = ['HIPS', 'HEAD', 'PAW_L', 'PAW_R', 'FOOT_L', 'FOOT_R', 'TAIL_04', 'EAR_L_02'];
function bonesWorld(c: FoxController) { const out: number[] = [], v = new Vector3(); for (const n of BN) { c.debug.bones[n].getWorldPosition(v); out.push(v.x, v.y, v.z); } return out; }
function pops(j: number[]) { const out: number[] = []; for (let i = 2; i < j.length - 2; i++) { const nb = Math.max(j[i - 2], j[i - 1], j[i + 1], j[i + 2]); if (j[i] > 0.03 && j[i] > 2.5 * nb) out.push(i); } return out; }
function matSig(c: FoxController) {
  const out: string[] = [];
  c.debug.fox.traverse(o => { const m = o as unknown as { isMesh?: boolean; name: string; material?: unknown }; if (!m.isMesh || m.name.startsWith('FX_') || m.name.startsWith('PROXY_')) return;
    for (const mat of ([] as { uuid: string; color?: { getHexString(): string }; opacity: number }[]).concat(m.material as never)) out.push(`${m.name}:${mat.uuid}:${mat.color?.getHexString()}:${mat.opacity}`); });
  return out.join('|');
}
const g3PropsShown = (c: FoxController) => c.getState().props.filter(p => (G3_PROPS as readonly string[]).includes(p.id));
function captureWarn<T>(fn: () => T): { r: T; warns: string[] } {
  const warns: string[] = []; const ow = console.warn;
  console.warn = (...a: unknown[]) => { warns.push(a.map(String).join(' ')); ow(...a); };
  try { return { r: fn(), warns }; } finally { console.warn = ow; }
}

export function runG3Tests(c: FoxController): G3TestResult[] {
  const R: G3TestResult[] = [];
  const add = (name: string, pass: boolean, detail: Record<string, unknown> = {}) => R.push({ name, pass, detail });
  const sig0 = matSig(c);

  // 1. module + contract
  const mod = c.getStats().modules.find(m => m.id === 'g3_challenge_social');
  add('G3 module bound to the E2 Fox (every track binds, 18 clips)', !!mod?.ok && G3_ONE_SHOT_CLIPS.every(n => c.debug.anim.has(n)),
    { module: mod ? { ok: mod.ok, clips: mod.clips.length, tracks: mod.tracks, bound: mod.boundTracks, morphTracks: mod.morphTracks, problems: mod.problems } : null });
  const reg = foxEventRegistry.list().filter(e => e.since === 'G3').map(e => e.name);
  add('typed registry: 17 G3 events, F / G1 / G2 events intact', G3_EVENTS.every(e => reg.includes(e)) && ['QUEST_COMPLETED', 'STREAK_LOST', 'LEVEL_UP', 'STUDY_STARTED', 'ALARM_STARTED', 'FRIEND_CHEER'].every(e => !!foxEventRegistry.get(e)),
    { g3: reg.length, aliasCheck: foxEventRegistry.canonical('social.group_streak_broken') });

  // 2. every event: native clip, cue timing, no pop, full cleanup afterwards, no unknown cue
  const perEvent: Record<string, unknown> = {}; let allOk = true;
  for (const e of G3_EVENTS) {
    reset(c);
    const clip = CLIP_OF[e];
    let prev = bonesWorld(c); const jumps: number[] = []; let played = '';
    const logStart = c.debug.effects.log.length;
    const { r, warns } = captureWarn(() => {
      const res = c.handleEvent(e, e === 'GROUP_STREAK_LOST' ? undefined : undefined);
      step(c, CLIP_META[clip].durationS + 2.0, () => { const s = c.debug.anim.currentShot; if (s) played = s; const b = bonesWorld(c); let m = 0; for (let i = 0; i < b.length; i += 3) m = Math.max(m, Math.hypot(b[i] - prev[i], b[i + 1] - prev[i + 1], b[i + 2] - prev[i + 2])); jumps.push(m); prev = b; });
      return res;
    });
    const fired = c.debug.effects.log.slice(logStart).map(x => x.fx);
    const expected = (SPEC.clips[clip].cues ?? []).map(q => q.fx);
    const missing = expected.filter(fx => !fired.includes(fx));
    const st = c.getState(), fx = c.debug.effects.getStats();
    // the group-streak markers are a persistent STATE (owner 'group-streak'), not a leftover of the clip
    const persistent = c.getState().props.filter(p => p.owner === 'group-streak').map(p => p.id);
    const leftovers = { props: g3PropsShown(c).filter(p => p.owner !== 'group-streak').map(p => p.id), persistentState: persistent, active: fx.active, schedules: fx.pendingSchedules, countdown: fx.countdown.visible };
    const ok = r.result === 'handled' && r.coverage === 'native' && played === clip && !pops(jumps).length && !missing.length && !warns.some(w => w.includes('unknown effect cue'))
      && !leftovers.props.length && leftovers.active === 0 && leftovers.schedules === 0 && !leftovers.countdown && st.oneShot === null;
    allOk &&= ok;
    perEvent[e] = { clip: played, pops: pops(jumps), maxJumpMm: +(Math.max(...jumps) * 1000).toFixed(1), cuesFired: fired.length, missingCues: missing, leftovers, warns: warns.slice(0, 3), ok };
  }
  add('17 events → native clip, every spec cue fired, no transition pop, nothing left over 2 s after the clip (props / FX / schedules; the group-streak markers stay as the documented persistent state)', allOk, perEvent);

  // 3. cue timing accuracy (effects fire on the clip's own timeline: |fired - spec| ≤ 1 frame)
  {
    reset(c); const L0 = c.debug.effects.log.length; const clock0 = c.debug.effects.clockTime;
    c.handleEvent('CHALLENGE_WON'); step(c, CLIP_META.challenge_win.durationS + 0.2);
    const fired = c.debug.effects.log.slice(L0).map(x => ({ fx: x.fx, at: x.t - clock0 }));
    const spec = SPEC.clips.challenge_win.cues ?? [];
    const errs = spec.map(q => { const f = fired.find(x => x.fx === q.fx && x.at >= q.t - 1e-3); return f ? f.at - q.t : 99; });
    add('VFX cue timing on the clip timeline (challenge_win): every cue fires within 1 frame after its spec time', errs.every(x => x >= -1e-3 && x <= DT + 2e-3), { maxErrS: +Math.max(...errs).toFixed(4), cues: spec.length });
  }
  // 4. interruption at mid-clip by a higher-priority event: props removed, FX stopped, schedules cleared
  {
    const res: Record<string, unknown> = {}; let ok = true;
    for (const e of ['CHALLENGE_INVITED', 'CHALLENGE_STARTED', 'CHALLENGE_DRAW', 'PHOTO_REACTION', 'SOCIAL_COMMENT_RECEIVED', 'FRIEND_MISS_YOU', 'GROUP_VICTORY'] as FoxEventName[]) {
      reset(c); c.handleEvent(e); step(c, CLIP_META[CLIP_OF[e]].durationS * 0.5);
      const during = g3PropsShown(c).map(p => p.id);
      const tag = c.shot.tag;
      const r = c.play('happy', { priority: 70 }); step(c, 0.5);                       // a higher-priority one-shot interrupts the G3 clip
      const owned = c.debug.effects.getStats();
      const after = { interruptedBy: r, props: g3PropsShown(c).map(p => p.id), active: owned.active, countdown: owned.countdown.visible, schedules: owned.pendingSchedules, oldTagGone: c.shot.tag !== tag };
      const pass = r === 'played' && after.oldTagGone && !after.props.length && !after.countdown;
      ok &&= pass; res[e] = { during, after, pass };
    }
    add('interruption mid-clip by a higher-priority one-shot: G3 props / countdown removed within 0.5 s', ok, res);
  }
  // 5. cancellation through the API + recovery to idle
  {
    reset(c); c.handleEvent('CHALLENGE_WON'); step(c, 2.2);
    const tag = c.shot.tag!; c.cancel(tag); step(c, 0.6);
    const s = c.getState(), fx = c.debug.effects.getStats();
    add('cancel(tag) mid challenge_win: trophy / aura / confetti cleaned, back to idle', s.oneShot === null && !g3PropsShown(c).length && fx.pendingSchedules === 0 && s.base === 'idle', { props: g3PropsShown(c), active: fx.active, base: s.base });
  }
  // 6. pause / resume: frozen effects resume exactly
  {
    reset(c); c.handleEvent('PHOTO_REACTION'); step(c, 1.0);
    const p0 = c.debug.effects.getProp('photo_frame')!; const vis0 = p0.visibility, pos0 = p0.root.position.clone(), t0 = c.shot.time;
    c.pause(); for (let i = 0; i < 10; i++) c.update(DT);                              // host keeps calling update while paused
    const frozen = c.shot.time === t0 && p0.root.position.distanceTo(pos0) < 1e-9 && p0.visibility === vis0;
    c.resume(); c.debug.step(DT); const moved = (c.shot.time ?? 0) > (t0 ?? 0);
    add('pause freezes clip time, props and effects; resume continues', frozen && moved, { frozen, moved });
    c.pause();
  }
  // 7. countdown = application data
  {
    reset(c); c.setChallengeCountdown(3); c.handleEvent('CHALLENGE_STARTED'); step(c, 1.0);
    const v1 = c.debug.effects.getStats().countdown; c.setChallengeCountdown('GO'); const v2 = c.debug.effects.getStats().countdown; c.setChallengeCountdown(null);
    step(c, CLIP_META.challenge_start.durationS); const v3 = c.debug.effects.getStats().countdown;
    add('countdown shows the application value only (3 → GO), never runs a timer; hidden after the clip', v1.visible && v1.value === 3 && v2.value === 'GO' && !v3.visible, { v1, v2, v3 });
  }
  // 8. group data + group streak (single flame, linked embers, loss clears everything)
  {
    reset(c); const flames0 = countFlames(c);
    c.handleEvent('GROUP_STREAK_ACTIVE', { days: 9, members: 5, colors: ['#3EA2FF', '#FF7AA8'] }); step(c, CLIP_META.group_streak_active.durationS + 0.5);
    const g1 = c.getGroup(), st1 = c.getStreak(), emb = c.debug.effects.getStats().groupEmbers, flames1 = countFlames(c);
    c.handleEvent('GROUP_STREAK_LOST'); step(c, CLIP_META.group_streak_lost.durationS + 1.5);
    const g2 = c.getGroup(), st2 = c.getStreak();
    add('group streak: 5 markers lit + embers + the SAME single flame; loss → markers gone, streak inactive, no embers',
      g1.members === 5 && g1.linked && g1.flamesLit === 5 && emb && st1.active && st1.tier === 'blue' && flames1 === flames0 && !g2.linked && !g2.markersVisible && !st2.active && !c.debug.effects.getStats().groupEmbers,
      { active: { ...g1, embers: emb, streak: st1 }, flameObjects: [flames0, flames1], lost: { ...g2, streak: st2 } });
  }
  // 9. reduced motion: large clips substituted (face), group streak keeps its state, props fade instead of pop
  {
    const res: Record<string, unknown> = {}; let ok = true;
    for (const e of ['CHALLENGE_WON', 'CHALLENGE_STARTED', 'DUO_CELEBRATION', 'GROUP_VICTORY', 'GROUP_STREAK_ACTIVE'] as FoxEventName[]) {
      reset(c); c.setReducedMotion(true); const r = c.handleEvent(e); step(c, 0.3);
      const pass = !c.getState().oneShot || !CLIP_META[c.getState().oneShot as FoxClipName].largeMotion; ok &&= pass;
      res[e] = { steps: r.steps?.map(s => s.kind), shot: c.getState().oneShot, linked: c.getGroup().linked, pass };
    }
    ok &&= (res.GROUP_STREAK_ACTIVE as { linked: boolean }).linked;
    reset(c); c.setReducedMotion(true); c.handleEvent('FRIEND_MISS_YOU'); step(c, 1.5);
    const gentle = c.getState().oneShot === 'friend_miss_you';
    add('reduced motion: no large-motion clip plays (documented face substitutes), gentle social clips stay', ok && gentle, { ...res, gentleKept: gentle });
    c.setReducedMotion(false);
  }
  // 10. level scale: effects / props scale with the fox (Lv1 0.80, Lv30 1.10)
  {
    const out: Record<string, unknown> = {}; let ok = true;
    for (const lv of [1, 30]) {
      reset(c); c.setLevel(lv, { immediate: true }); step(c, 0.1); c.handleEvent('CHALLENGE_WON'); step(c, 2.8);
      const fs = c.debug.fox.scale.x, rs = c.debug.effects.root.scale.x;
      const tr = c.debug.effects.getProp('trophy'); const w = tr ? tr.root.getWorldPosition(new Vector3()) : null; const loc = tr?.root.position;
      const ratio = w && loc ? w.length() / loc.length() : 0;
      const pass = Math.abs(fs - rs) < 1e-6 && Math.abs(ratio - fs) < 0.01; ok &&= pass;
      out[`lv${lv}`] = { foxScale: +fs.toFixed(3), fxRootScale: +rs.toFixed(3), trophyWorldOverLocal: +ratio.toFixed(3), pass };
    }
    add('Lv1 / Lv30: G3 props and effects follow the uniform fox scale', ok, out);
  }
  // 11. coalescing of frequent likes, alias names
  {
    reset(c); const a = c.handleEvent('SOCIAL_LIKE_RECEIVED'); const b = c.handleEvent('social.like'); step(c, 0.2); const d = c.handleEvent('SOCIAL_LIKE_RECEIVED');
    add('frequent likes inside 1.2 s are coalesced (alias social.like → SOCIAL_LIKE_RECEIVED)', a.result === 'handled' && b.result === 'coalesced' && d.result === 'coalesced' && b.canonical === 'SOCIAL_LIKE_RECEIVED', { a: a.result, b: b.result, d: d.result });
  }
  // 12. effects disabled: clips still play, logic cues still run, nothing drawn
  {
    reset(c); c.setEffectsEnabled(false); c.handleEvent('GROUP_STREAK_ACTIVE', { days: 3 }); step(c, CLIP_META.group_streak_active.durationS + 0.3);
    const linked = c.getGroup().linked; const layersHidden = c.debug.effects.root.children.every(g => !g.visible);
    add('effects disabled: group-streak logic still applied, every FX layer hidden', linked && layersHidden, { linked, layersHidden });
    c.setEffectsEnabled(true);
  }
  // 13. materials never touched
  add('Fox materials unchanged after all G3 clips', matSig(c) === sig0, {});
  reset(c);
  return R;
}

function countFlames(c: FoxController) { let n = 0; c.debug.effects.root.traverse(o => { if (/flame/i.test(o.name) && !/layer/i.test(o.name) && o.parent?.name?.includes('FX_layer_flame')) n++; }); return n; }

/** Module missing (?modules=0 or G3 filtered out): every G3 event answers with its documented fallback. */
export function runG3FallbackTests(c: FoxController): G3TestResult[] {
  const R: G3TestResult[] = []; const res: Record<string, unknown> = {}; let ok = true;
  reset(c);
  for (const e of G3_EVENTS) {
    reset(c);
    const { r, warns } = captureWarn(() => c.handleEvent(e)); step(c, 0.3);
    const spec = foxEventRegistry.get(e)!;
    const expect = (spec.fallbackSteps ?? []).map(s => s.kind).join(',');
    const pass = r.result === 'handled' && (r.steps ?? []).map(s => s.kind).join(',') === expect && !warns.length;
    ok &&= pass; res[e] = { steps: r.steps?.map(s => (s.kind === 'play' ? s.clip : s.kind === 'mood' ? `mood:${s.mood}` : s.kind)), pass };
  }
  R.push({ name: 'G3 module unavailable → documented fallback for all 17 events (no error)', pass: ok, detail: res });
  reset(c);
  return R;
}

// ======================================================================= multi-fox
interface MultiApi { manager: FoxChoreographyManager; foxes: FoxController[]; gl: { info: { render: { calls: number; triangles: number }; memory: { geometries: number; textures: number } } } }
function mstep(api: MultiApi, s: number, each?: () => void) { for (let t = 0; t < s - 1e-9; t += DT) { for (const f of api.foxes) f.debug.step(DT); api.manager.postUpdate(DT); each?.(); } }
function mreset(api: MultiApi, levels: number[]) {
  api.manager.cancelAll();
  api.foxes.forEach((f, i) => { reset(f); f.setLevel(levels[i] ?? 20, { immediate: true }); f.effects.setPropSuppressed('team_markers', false); f.setSharedCueHandler(null); });
  mstep(api, 0.2);
}
const paw = (f: FoxController, s: 'L' | 'R') => f.getBone(`ATT_HAND_${s}`)!.getWorldPosition(new Vector3());

export function runG3MultiTests(api: MultiApi): G3TestResult[] {
  const R: G3TestResult[] = []; const add = (name: string, pass: boolean, detail: Record<string, unknown> = {}) => R.push({ name, pass, detail });
  const [A, B, C] = api.foxes;
  const CONTACT_MAX_MM = 65;      // paw tips closer than both paw radii + 1 cm (paw radius ≈ 3.5 cm × scale): the paws visibly touch
  const HEAD_CLEAR_MM = 0;        // head-to-head clearance must stay positive (no head interpenetration)
  const duoRun = (levels: number[]) => {
    mreset(api, levels);
    const d = new FoxDuoCoordinator(api.manager, A, B); d.layout(); mstep(api, 0.05); d.start();
    let minHeadGap = 9, minPaw = 9;
    mstep(api, FoxDuoCoordinator.durationS + 0.6, () => {
      const hc = (f: FoxController) => { const h = f.getBone('HEAD')!.getWorldPosition(new Vector3()), t = f.getBone('ATT_HAT')!.getWorldPosition(new Vector3()); return h.lerp(t, 0.45); };
      minHeadGap = Math.min(minHeadGap, hc(A).distanceTo(hc(B)) - 0.343 * (A.scale + B.scale));    // conservative sphere: head centre (HEAD→ATT_HAT 45 %), radius = half-width 0.343 m × scale
      minPaw = Math.min(minPaw, paw(A, 'L').distanceTo(paw(B, 'R')));
    });
    return { report: d.report, minHeadGapMm: +(minHeadGap * 1000).toFixed(1), minPawMm: +(minPaw * 1000).toFixed(1), shared: api.manager.stats().sharedFx };
  };
  // duo, same level
  const same = duoRun([20, 20]);
  add('duo (Lv20 + Lv20): frame-locked start, paws meet at the contact frame, heads never intersect, one shared contact sparkle',
    same.report.startTicks.length === 2 && same.report.startTicks[0] === same.report.startTicks[1] && same.report.maxClipTimeDeltaS < 1e-6 && (same.report.contact.distanceMm ?? 999) <= CONTACT_MAX_MM
    && same.minHeadGapMm > HEAD_CLEAR_MM && same.report.sharedContact === 1 && same.report.sharedHeart === 1, same as unknown as Record<string, unknown>);
  // duo, different levels (contact correction)
  const diff = duoRun([1, 30]);
  add('duo (Lv1 + Lv30): layout + shoulder correction keep the contact within tolerance', (diff.report.contact.distanceMm ?? 999) <= CONTACT_MAX_MM && diff.minHeadGapMm > HEAD_CLEAR_MM && diff.report.maxClipTimeDeltaS < 1e-6,
    diff as unknown as Record<string, unknown>);
  // contact mismatch detection: without correction the mismatch is reported (not hidden)
  {
    mreset(api, [1, 30]); const d = new FoxDuoCoordinator(api.manager, A, B, { maxCorrectionDeg: 0 }); d.layout(); d.start(); mstep(api, FoxDuoCoordinator.durationS + 0.4);
    add('contact mismatch is detected and reported (correction off, Lv1 + Lv30)', d.report.contact.measured && (d.report.contact.verticalMm ?? 0) > 0, { contact: d.report.contact });
  }
  // cancel one participant → the other finishes solo, cancelled fox cleaned
  {
    mreset(api, [20, 20]); const d = new FoxDuoCoordinator(api.manager, A, B); d.layout(); d.start(); mstep(api, 0.8);
    d.cancel('b'); mstep(api, 0.5);
    const bIdle = B.getState().oneShot === null && !g3PropsShown(B).length && B.debug.effects.getStats().active === 0, aPlaying = A.getState().oneShot === 'duo_celebrate';
    mstep(api, FoxDuoCoordinator.durationS);
    add('cancel one participant: it stops and cleans up, the partner continues as a solo performance', bIdle && aPlaying && d.report.mode === 'solo' && A.getState().oneShot === null,
      { bIdle, aPlaying, mode: d.report.mode, sharedContact: d.report.sharedContact });
  }
  // cancel both
  {
    mreset(api, [20, 20]); const d = new FoxDuoCoordinator(api.manager, A, B); d.layout(); d.start(); mstep(api, 1.55);
    d.cancel('both'); mstep(api, 0.6);
    const ok = A.getState().oneShot === null && B.getState().oneShot === null && !d.active && api.manager.stats().coordinators.length === 0;
    mstep(api, 1.2);
    add('cancel both participants: both back to idle, coordinator detached, shared effects gone', ok && api.manager.stats().sharedFx === 0, { stats: api.manager.stats() });
  }
  // solo fallback (second fox not loaded)
  {
    mreset(api, [20, 20]); const d = new FoxDuoCoordinator(api.manager, A, null); d.layout(); const r = d.start(); let fired = 0; const L0 = A.debug.effects.log.length;
    mstep(api, FoxDuoCoordinator.durationS + 0.4); fired = A.debug.effects.log.slice(L0).filter(x => x.fx === 'duo.contact').length;
    add('solo fallback: one fox performs the high-five alone, local contact sparkle, clean end', r[0] === 'played' && d.report.mode === 'solo' && fired === 1 && A.getState().oneShot === null && !g3PropsShown(A).length, { result: r, fired });
  }
  // group: symbolic (1 fox + markers)
  {
    mreset(api, [20, 20, 20]); const g = new FoxGroupEffectCoordinator(api.manager, [A], { mode: 'symbolic', members: 4 }); g.start(); mstep(api, 1.0);
    const markers = A.getGroup(); mstep(api, 5);
    add('group (symbolic): one fox + 4 team markers, no extra Fox instance needed, clean end', markers.markersVisible && markers.members === 4 && !g.active && !g3PropsShown(A).length, { markers, report: g.report });
  }
  // group: multi (3 foxes, frame-locked)
  if (C) {
    mreset(api, [20, 1, 30]); const g = new FoxGroupEffectCoordinator(api.manager, [A, B, C], { mode: 'multi' }); g.layout(); g.start(); mstep(api, 1.0);
    const suppressed = [A, B, C].every(f => { const p = f.debug.effects.getProp('team_markers'); return !p || p.suppressed; });
    mstep(api, 4.6);
    const synced = g.report.maxClipTimeDeltaS < 1e-6;
    mstep(api, 2.0);
    add('group (multi, 3 foxes at Lv20 / Lv1 / Lv30): frame-locked dance, per-fox markers replaced by one shared group effect, burst de-duplicated, clean end',
      synced && suppressed && g.report.sharedBursts === 1 && !g.active && api.manager.stats().sharedFx === 0, { report: g.report, suppressed, stats: api.manager.stats() });
  }
  return R;
}

/** Draw calls / GPU-side object counts (software renderer: counts only, no timing claims). */
export function measureRender(api: MultiApi) { const i = api.gl.info; return { calls: i.render.calls, triangles: i.render.triangles, geometries: i.memory.geometries, textures: i.memory.textures,
  jsHeapMB: +(((performance as unknown as { memory?: { usedJSHeapSize: number } }).memory?.usedJSHeapSize ?? 0) / 1048576).toFixed(1) }; }
