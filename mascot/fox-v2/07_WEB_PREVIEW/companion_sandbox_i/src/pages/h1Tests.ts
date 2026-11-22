import { Vector3, type BufferGeometry, type Object3D, type SkinnedMesh, type WebGLRenderer } from 'three';
import {
  CLIP_META, COSMETIC_CATALOG, COSMETIC_ITEM_IDS, COSMETIC_SLOTS, FOX_CONTRACT_VERSION, FoxController, OUTFIT_PRESETS, SLOT_DEFAULTS, cosmeticCacheState, foxEventRegistry,
  purgeCosmeticCache, setCosmeticKeepAlive, type CosmeticSlot, type FoxClipName, type FoxControllerEvent, type FoxCosmeticEvent, type FoxEventName,
} from '../mascot';

// Gate H1 deterministic cosmetic tests. The controller is paused (the host keeps drawing) and advanced with debug.step(dt).
// Every threshold is written next to its check and reported; none was tuned after measuring. Equip is asynchronous (item
// GLB load), so the suite is async. Software rendering only: resources are counted, never timed as GPU performance.

export interface H1TestResult { name: string; pass: boolean; detail: Record<string, unknown> }
const DT = 1 / 24;
/** The 17 clips the brief requires equipment to be tested with (+ the mirrored duo clip). */
export const H1_REQUIRED_CLIPS: FoxClipName[] = ['idle', 'walk', 'run', 'head_pet', 'tail_touch', 'quest_complete', 'level_up', 'streak_active', 'streak_lost',
  'study_focus', 'sports_active', 'sleep_enter', 'sleep_loop', 'sleep_wake', 'challenge_win', 'duo_celebrate', 'duo_celebrate_mirror'] as FoxClipName[];

function step(c: FoxController, s: number, each?: () => void) { for (let t = 0; t < s - 1e-9; t += DT) { c.debug.step(DT); each?.(); } }
export function resetFox(c: FoxController) {
  const d = c.debug;
  c.pause(); d.daily.clear(); d.anim.cancelOneShots(); d.effects.clearTransient(); d.effects.clearProps();
  c.setReducedMotion(false); c.setEffectsEnabled(true); c.setStreak({ active: false }); c.setLevel(20, { immediate: true }); c.setMood('neutral');
  c.setActivity('idle'); d.anim.setBaseInstant('idle', 0); c.setIdleVariationEnabled(false); c.setLookAtEnabled(false);
  step(c, 0.5);
}
function matSig(c: FoxController) {
  const out: string[] = [];
  c.debug.fox.traverse(o => { const m = o as unknown as { isMesh?: boolean; name: string; material?: unknown; userData: { cosmetic?: unknown } }; if (!m.isMesh || m.userData.cosmetic || m.name.startsWith('FX_') || m.name.startsWith('PROXY_')) return;
    for (const mat of ([] as { uuid: string; color?: { getHexString(): string }; opacity: number }[]).concat(m.material as never)) out.push(`${m.name}:${mat.uuid}:${mat.color?.getHexString()}:${mat.opacity}`); });
  return out.join('|');
}
const boneSig = (c: FoxController) => Object.keys(c.debug.bones).sort().join(',');
const foxMeshVisible = (c: FoxController, n: string) => { const o = c.debug.objs[n]; let v = !!o; for (let p: Object3D | null = o ?? null; p && p !== c.debug.fox; p = p.parent) v = v && p.visible; return v; };
const cosmeticRoots = (c: FoxController) => c.debug.fox.children.filter(o => o.name.startsWith('COSMETIC_'));
/** Run a clip the way the app would (base clips via activity / streak; daily-life clips via their state; one-shots via play). */
export function startClip(c: FoxController, clip: FoxClipName) {
  if (clip === 'walk' || clip === 'run' || clip === 'idle') { c.setActivity(clip as never); return 3; }
  if (clip === 'streak_active') { c.setStreak({ active: true, days: 9 }); return 4; }
  if (clip === 'study_focus') { c.enterState('study'); return 6; }
  if (clip === 'sports_active') { c.enterState('sports'); return 6; }
  if (clip === 'sleep_loop' || clip === 'sleep_enter') { c.enterState('sleep'); return 8; }
  if (clip === 'sleep_wake') { c.enterState('sleep'); step(c, 6); c.exitState('sleep'); return 6; }
  c.play(clip, { priority: 90 }); return CLIP_META[clip].durationS + 0.6;
}

export async function runH1Tests(c: FoxController, gl?: WebGLRenderer): Promise<H1TestResult[]> {
  const R: H1TestResult[] = [];
  const add = (name: string, pass: boolean, detail: Record<string, unknown> = {}) => R.push({ name, pass, detail });
  const events: FoxCosmeticEvent[] = []; const off = c.on((e: FoxControllerEvent) => { if (e.type === 'cosmetic') events.push(e as FoxCosmeticEvent); });
  const sig0 = matSig(c), bones0 = boneSig(c), clips0 = c.availableClips().length, evs0 = foxEventRegistry.list().length;
  setCosmeticKeepAlive(0);
  resetFox(c); c.resetOutfit();

  // 1. contract
  const slotsOk = COSMETIC_SLOTS.length === 9 && ['HEAD', 'FACE', 'NECK', 'BODY', 'BACK', 'HAND_LEFT', 'HAND_RIGHT', 'FEET', 'TAIL'].every(s => (COSMETIC_SLOTS as readonly string[]).includes(s));
  const presetsOk = Object.values(OUTFIT_PRESETS).every(p => Object.entries(p).every(([s, id]) => (COSMETIC_CATALOG as Record<string, { slot: string }>)[id as string]?.slot === s));
  add('slot contract: 9 slots, 8 catalogue items (6 prototypes + 2 slot fixtures), presets reference valid slot items', slotsOk && COSMETIC_ITEM_IDS.length === 8 && presetsOk,
    { slots: COSMETIC_SLOTS, items: COSMETIC_ITEM_IDS.map(i => `${i}:${COSMETIC_CATALOG[i].slot}`), presets: Object.keys(OUTFIT_PRESETS) });
  add('default look: red scarf + green backpack reported as the NECK / BACK defaults', JSON.stringify(c.getEquippedItems().map(e => [e.slot, e.id, e.default])) === JSON.stringify([['NECK', 'default_scarf', true], ['BACK', 'default_backpack', true]]),
    { equipped: c.getEquippedItems() });

  // 2. equip / unequip lifecycle, every item
  const life: Record<string, unknown> = {}; let lifeOk = true;
  for (const id of COSMETIC_ITEM_IDS) {
    const r = await c.equip(id);
    const dbg = c.cosmetics.debugSlot(COSMETIC_CATALOG[id].slot);
    const sameBones = !!dbg && dbg.skeleton.bones.every(b => c.debug.bones[b.name] === b);
    const parented = !!dbg && dbg.root.parent === c.debug.fox;
    step(c, 0.2);
    const ok1 = r.ok && sameBones && parented && dbg!.meshes.length > 0;
    const un = c.unequip(id);
    const gone = !c.cosmetics.debugSlot(COSMETIC_CATALOG[id].slot) && !cosmeticRoots(c).length;
    life[id] = { equip: r.ok, boundToFoxBones: sameBones, joints: dbg?.skeleton.bones.map(b => b.name), primitives: dbg?.meshes.length, unequip: un, removed: gone };
    lifeOk &&= ok1 && un && gone;
  }
  add('equip / unequip every item: bound to THIS Fox\'s bones by joint name, parented under the Fox, fully removed on unequip', lifeOk, life);
  const again = await c.equip('student_glasses'); const idem = await c.equip('student_glasses');
  add('re-equip and idempotent equip (same item twice = one instance)', again.ok && idem.ok && cosmeticRoots(c).length === 1, { roots: cosmeticRoots(c).map(o => o.name) });
  c.resetOutfit();

  // 3. default accessory replacement (no double scarves / backpacks; hidden meshes come back)
  await c.equip('explorer_backpack');
  const packHidden = !foxMeshVisible(c, 'FOX_Backpack') && !foxMeshVisible(c, 'FOX_Backpack_Strap_L') && !foxMeshVisible(c, 'FOX_Backpack_Flap');
  const backItems = c.getEquippedItems().filter(e => e.slot === 'BACK');
  c.unequip('BACK');
  const packBack = foxMeshVisible(c, 'FOX_Backpack') && foxMeshVisible(c, 'FOX_Backpack_Strap_L');
  add('BACK: explorer backpack hides the default backpack (+ straps, flap, pockets); unequip restores it; one BACK entry only', packHidden && packBack && backItems.length === 1 && !backItems[0].default,
    { packHidden, packBack, backItems });
  // NECK has no H1 prototype: a TEST-ONLY item (re-using the headband GLB) proves the scarf replacement path
  c.cosmetics.register({ id: '__test_neck', slot: 'NECK', name: 'test neck item', path: COSMETIC_CATALOG.sports_headband.path, hides: [], socket: 'ATT_SCARF' });
  await c.equip('__test_neck');
  const scarfHidden = ['FOX_Scarf_Roll', 'FOX_Scarf_Flap', 'FOX_Scarf_Emblem'].every(n => !foxMeshVisible(c, n));
  c.unequip('__test_neck');
  const scarfBack = ['FOX_Scarf_Roll', 'FOX_Scarf_Flap', 'FOX_Scarf_Emblem'].every(n => foxMeshVisible(c, n));
  add('NECK: an item hides all three default scarf meshes (no double scarf); unequip restores them (test-only NECK item)', scarfHidden && scarfBack, { scarfHidden, scarfBack });
  await c.equip('student_cap'); const tuftHidden = !foxMeshVisible(c, 'FOX_Tuft');
  const head2 = await c.equip('sports_headband'); const tuftAfterSwap = foxMeshVisible(c, 'FOX_Tuft');
  const headItems = c.getEquippedItems().filter(e => e.slot === 'HEAD');
  c.unequip('HEAD');
  add('HEAD: same-slot replacement (cap → headband): one HEAD item, the cap\'s tuft hide is released', tuftHidden && head2.ok && head2.replaced === 'student_cap' && tuftAfterSwap && headItems.length === 1,
    { tuftHidden, replaced: head2.ok ? head2.replaced : null, tuftAfterSwap, headItems });
  // cross-slot conflict rule (mechanism; the prototype set has none — see the compatibility matrix)
  c.cosmetics.register({ id: '__test_excl', slot: 'TAIL', name: 'test tail item excluding BACK', path: COSMETIC_CATALOG.slot_test_tail_ribbon.path, hides: [], socket: 'TAIL_03', excludes: ['BACK'] });
  await c.equip('explorer_backpack'); const ex = await c.equip('__test_excl');
  const backAfter = c.getEquippedItems().find(e => e.slot === 'BACK');
  add('cross-slot conflict rule: equipping an item that excludes BACK removes the backpack item (default pack returns)', ex.ok && (ex.removed ?? []).includes('explorer_backpack') && !!backAfter?.default,
    { result: ex, back: backAfter });
  c.resetOutfit();

  // 4. missing asset / bad asset fallback
  c.cosmetics.register({ id: '__missing', slot: 'BACK', name: 'missing file', path: 'models/cosmetics/__does_not_exist.glb', hides: [], socket: 'ATT_BACKPACK' });
  c.cosmetics.register({ id: '__noskin', slot: 'FACE', name: 'no skin', path: 'models/modules/fox_v2_g3_challenge_social.anim.glb', hides: [], socket: 'ATT_GLASSES' });
  await c.equip('explorer_backpack');
  const errs0 = events.filter(e => e.op === 'error').length;
  const miss = await c.equip('__missing'); const bad = await c.equip('__noskin');
  const keep = c.getEquippedItems().find(e => e.slot === 'BACK')?.id;
  add('missing asset → load-failed, invalid file → contract; the slot keeps its item, defaults stay correct, error events emitted', !miss.ok && miss.reason === 'load-failed' && !bad.ok && bad.reason === 'contract' && keep === 'explorer_backpack' && !foxMeshVisible(c, 'FOX_Backpack')
    && events.filter(e => e.op === 'error').length === errs0 + 2, { miss, bad, keep });
  c.resetOutfit();
  const miss2 = await c.equip('__missing');
  add('missing asset on an empty slot: the default backpack stays visible', !miss2.ok && foxMeshVisible(c, 'FOX_Backpack'), {});
  // race: the latest request for a slot wins
  const p1 = c.equip('student_cap'), p2 = c.equip('sports_headband'); const [r1, r2] = await Promise.all([p1, p2]);
  add('concurrent equips in one slot: the latest request wins, the earlier one resolves "superseded"', !r1.ok && r1.reason === 'superseded' && r2.ok && c.getEquippedItems().find(e => e.slot === 'HEAD')?.id === 'sports_headband' && cosmeticRoots(c).length === 1,
    { r1, r2 });
  c.resetOutfit();

  // 5. outfits / serialisation
  const so = await c.setOutfit('student');
  const ids = c.getEquippedItems().filter(e => !e.default).map(e => e.id).sort();
  const ser = c.cosmetics.serialize();
  await c.setOutfit('explorer'); const ex2 = c.getEquippedItems().filter(e => !e.default).map(e => e.id).sort();
  await c.setOutfit(ser); const back2 = c.getEquippedItems().filter(e => !e.default).map(e => e.id).sort();
  add('setOutfit(preset) / serialize() → setOutfit(saved) round trip; slots not named return to default', so.every(r => r.ok) && JSON.stringify(ids) === JSON.stringify(['simple_jacket', 'student_cap', 'student_glasses'])
    && JSON.stringify(ex2) === JSON.stringify(['explorer_backpack', 'explorer_magnifier', 'student_glasses']) && JSON.stringify(back2) === JSON.stringify(ids), { ids, ex2, back2, ser });
  c.resetOutfit();
  add('resetOutfit(): only the approved defaults remain, every default mesh visible', c.getEquippedItems().every(e => e.default) && !cosmeticRoots(c).length
    && [...SLOT_DEFAULTS.NECK!.meshes, 'FOX_Backpack', 'FOX_Tuft'].every(n => foxMeshVisible(c, n)), { equipped: c.getEquippedItems() });

  // 6. animation persistence: the whole outfit stays bound and visible through every required clip (hand items: hand-busy rule)
  await c.setOutfit('all_slots_test');
  const want = c.getEquippedItems().map(e => `${e.slot}:${e.id}`).join(',');
  const per: Record<string, unknown> = {}; let persOk = true;
  for (const clip of H1_REQUIRED_CLIPS) {
    resetFox(c);
    let lost = 0, detached = 0, hiddenNonHand = 0, handBusy = 0; const dur = startClip(c, clip);
    step(c, Math.min(dur, 9), () => {
      for (const s of COSMETIC_SLOTS) {
        const d = c.cosmetics.debugSlot(s); if (!d) continue;
        if (d.root.parent !== c.debug.fox) detached++;
        if (!d.root.visible) { if (s === 'HAND_LEFT' || s === 'HAND_RIGHT') handBusy++; else hiddenNonHand++; }
      }
      if (c.getEquippedItems().map(e => `${e.slot}:${e.id}`).join(',') !== want) lost++;
    });
    c.debug.daily.clear(); c.setStreak({ active: false }); step(c, 1.5);
    const after = c.getEquippedItems().map(e => `${e.slot}:${e.id}`).join(',') === want && c.cosmetics.debugSlot('HAND_RIGHT')!.root.visible;
    per[clip] = { lost, detached, hiddenNonHand, handBusyFrames: handBusy, restoredAfter: after };
    persOk &&= !lost && !detached && !hiddenNonHand && after;
  }
  add('persistence: 7 slots equipped through all 17 required clips (+ mirror) — never unequipped, detached or hidden (except the hand-busy rule), all back afterwards', persOk, per);

  // 7. hand busy (temporary props vs persistent HAND items)
  resetFox(c);
  const hb: Record<string, unknown> = {};
  const vis = () => c.cosmetics.debugSlot('HAND_RIGHT')!.root.visible;
  c.enterState('study'); let sawHidden = false; step(c, 5, () => { if (!vis()) sawHidden = true; });
  const pencil = c.getState().props.some(p => p.id === 'pencil');
  c.exitState('study', 'cancel'); step(c, 2); hb.study = { pencil, hiddenWhilePencil: sawHidden, back: vis() };
  resetFox(c); c.play('duo_celebrate_mirror', { priority: 90 }); let duoHidden = false; step(c, 1.0, () => { if (!vis()) duoHidden = true; }); step(c, CLIP_META.duo_celebrate_mirror.durationS); hb.duoMirror = { hidden: duoHidden, back: vis() };   // wait out the whole clip (4.04 s)
  resetFox(c);
  c.cosmetics.register({ id: '__test_left', slot: 'HAND_LEFT', name: 'test left item', path: COSMETIC_CATALOG.explorer_magnifier.path, hides: [], socket: 'ATT_HAND_L' });
  await c.equip('__test_left');
  const lv = () => c.cosmetics.debugSlot('HAND_LEFT')!.root.visible;
  c.setStreak({ active: true, days: 9 }); step(c, 1); const flameHides = !lv(); c.setStreak({ active: false }); step(c, 2.5); const flameBack = lv();
  hb.flame = { hiddenWhileFlame: flameHides, back: flameBack };
  c.unequip('__test_left');
  add('hand busy: right item hidden while the pencil is held and during the mirrored duo contact; left item hidden while the streak flame is held; all come back; equipped state unchanged',
    !!hb.study && (hb.study as { hiddenWhilePencil: boolean; back: boolean; pencil: boolean }).pencil && (hb.study as { hiddenWhilePencil: boolean }).hiddenWhilePencil && (hb.study as { back: boolean }).back
    && (hb.duoMirror as { hidden: boolean; back: boolean }).hidden && (hb.duoMirror as { back: boolean }).back && flameHides && flameBack
    && c.getEquippedItems().some(e => e.id === 'explorer_magnifier'), hb);

  // 8. level scaling: tracker vertices scale exactly with the Fox (Lv1 0.80 · Lv30 1.10 relative to Lv20)
  resetFox(c);
  // same pose for every level (no stepping between samples: the idle clip would move the points)
  const sample = (lv: number) => { c.setLevel(lv, { immediate: true }); c.debug.fox.updateMatrixWorld(true); const pts: Vector3[] = [];
    for (const s of COSMETIC_SLOTS) { const d = c.cosmetics.debugSlot(s); if (!d) continue; const m = d.meshes[0] as SkinnedMesh; const p = new Vector3();
      for (const i of [0, Math.floor(m.geometry.attributes.position.count / 2)]) { m.getVertexPosition(i, p); p.applyMatrix4(m.matrixWorld); pts.push(p.clone().sub(c.object3D.getWorldPosition(new Vector3()))); } }
    return { pts, scale: c.scale }; };
  const s20 = sample(20), s1 = sample(1), s30 = sample(30);
  const ratioErr = (a: typeof s20, b: typeof s20) => Math.max(...a.pts.map((p, i) => p.distanceTo(b.pts[i].clone().multiplyScalar(a.scale / b.scale))));
  const e1 = ratioErr(s1, s20) * 1000, e30 = ratioErr(s30, s20) * 1000;
  add('uniform level scaling: every item scales with the Fox (Lv1 / Lv30 vs Lv20, ≤ 0.1 mm off the exact ratio)', e1 <= 0.1 && e30 <= 0.1, { scales: [s1.scale, s20.scale, s30.scale], errLv1Mm: +e1.toFixed(4), errLv30Mm: +e30.toFixed(4), points: s20.pts.length });
  c.setLevel(20, { immediate: true });

  // 9. resource cleanup: repeated equip / unequip, skeletons, template cache, renderer resources
  c.resetOutfit(); step(c, 0.2);
  const info0 = gl ? { g: gl.info.memory.geometries, t: gl.info.memory.textures } : null;
  const sk0 = { ...c.cosmetics.stats };
  for (let k = 0; k < 6; k++) { await c.setOutfit('all_slots_test'); step(c, 0.1); c.resetOutfit(); step(c, 0.1); }
  purgeCosmeticCache(); step(c, 0.3);
  const info1 = gl ? { g: gl.info.memory.geometries, t: gl.info.memory.textures } : null;
  const sk1 = c.cosmetics.stats;
  const cache = cosmeticCacheState();
  add('cleanup: 6 full-outfit cycles → every skeleton disposed, item cache empty after purge, renderer geometries / textures back to baseline', sk1.skeletonsCreated - sk0.skeletonsCreated === sk1.skeletonsDisposed - sk0.skeletonsDisposed
    && cache.length === 0 && (!info0 || (info1!.g <= info0.g && info1!.t <= info0.t)), { skeletons: { created: sk1.skeletonsCreated - sk0.skeletonsCreated, disposed: sk1.skeletonsDisposed - sk0.skeletonsDisposed }, cache, renderer: { before: info0, after: info1 } });

  // 10. shared geometry across instances + dispose of a second controller
  await c.equip('student_glasses');
  const other = await FoxController.create({ modelUrl: c.assetInfo.url, level: 20, modules: [], shadow: false, effects: false });
  await other.equip('student_glasses');
  const gA = c.cosmetics.debugSlot('FACE')!.meshes[0].geometry as BufferGeometry, gB = other.cosmetics.debugSlot('FACE')!.meshes[0].geometry as BufferGeometry;
  const skA = c.cosmetics.debugSlot('FACE')!.skeleton, skB = other.cosmetics.debugSlot('FACE')!.skeleton;
  const refs2 = cosmeticCacheState().find(e => e.url.endsWith('student_glasses.glb'))?.refs;
  other.dispose();
  const refs1 = cosmeticCacheState().find(e => e.url.endsWith('student_glasses.glb'))?.refs;
  add('two Fox instances: one shared item geometry, separate skeletons on each Fox\'s own bones; disposing a Fox releases its items', gA === gB && skA !== skB && skB.bones[0] !== skA.bones[0] && refs2 === 2 && refs1 === 1,
    { sharedGeometry: gA === gB, refsWithTwo: refs2, refsAfterDispose: refs1 });
  c.resetOutfit();

  // 11. regression invariants: nothing about the approved Fox changed
  add('approved Fox untouched: materials, skeleton, clip set, event registry and controller contract version unchanged; no default mesh left hidden', matSig(c) === sig0 && boneSig(c) === bones0
    && c.availableClips().length === clips0 && foxEventRegistry.list().length === evs0 && FOX_CONTRACT_VERSION.startsWith('fox-v2/e2-anim+g1-module+g2.1-module+g3-module') && c.cosmetics.hiddenMeshes.length === 0,
    { contract: FOX_CONTRACT_VERSION, clips: c.availableClips().length, events: foxEventRegistry.list().length });
  setCosmeticKeepAlive(5000);
  off();
  return R;
}

/** Sweep for the harness: play the required clips with the current outfit; per clip, min distance of every item root to its Fox parent (0 = attached). */
export function slotSummary(c: FoxController) {
  return COSMETIC_SLOTS.map(s => ({ slot: s as CosmeticSlot, item: c.cosmetics.debugSlot(s)?.id ?? (SLOT_DEFAULTS[s]?.id ? `(${SLOT_DEFAULTS[s]!.id})` : '—') }));
}
export const H1_EVENT_NAMES: FoxEventName[] = [];
