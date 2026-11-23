import { Vector3, type SkinnedMesh, type Object3D } from 'three';
import {
  COSMETIC_CATALOG, COSMETIC_SLOTS, LIBRARY_ITEM_IDS, OUTFIT_IDS, OUTFIT_LIBRARY, OUTFIT_PRESETS, SLOT_DEFAULTS, cosmeticCacheState, purgeCosmeticCache,
  setCosmeticKeepAlive, type FoxController, type OutfitId,
} from '../mascot';
import { H1_REQUIRED_CLIPS, resetFox, startClip, type H1TestResult } from './h1Tests';

// Gate H2 deterministic outfit-library tests (same conventions as h1Tests: paused controller, debug.step, thresholds written
// next to each check and reported, none tuned after measuring).

const DT = 1 / 24;
const step = (c: FoxController, s: number, each?: () => void) => { for (let t = 0; t < s - 1e-9; t += DT) { c.debug.step(DT); each?.(); } };
const visible = (c: FoxController, n: string) => { const o = c.debug.objs[n]; let v = !!o; for (let p: Object3D | null = o ?? null; p && p !== c.debug.fox; p = p.parent) v = v && p.visible; return v; };
const roots = (c: FoxController) => c.debug.fox.children.filter(o => o.name.startsWith('COSMETIC_'));
const spec = (o: OutfitId) => OUTFIT_PRESETS[o] as Record<string, string>;
/** Approved meshes an outfit must hide: slot defaults it replaces + item `hides`. */
function expectedHidden(o: OutfitId) {
  const out = new Set<string>();
  for (const [slot, id] of Object.entries(spec(o))) {
    for (const m of SLOT_DEFAULTS[slot as keyof typeof SLOT_DEFAULTS]?.meshes ?? []) out.add(m);
    for (const m of (COSMETIC_CATALOG as Record<string, { hides: readonly string[] }>)[id].hides) out.add(m);
  }
  return [...out].sort();
}

export async function runH2Tests(c: FoxController): Promise<H1TestResult[]> {
  const R: H1TestResult[] = [];
  const add = (name: string, pass: boolean, detail: Record<string, unknown> = {}) => R.push({ name, pass, detail });
  setCosmeticKeepAlive(0); resetFox(c); c.resetOutfit();

  // 1. library definition
  const defOk = OUTFIT_IDS.length === 6 && OUTFIT_IDS.every(o => Object.entries(spec(o)).every(([s, id]) => (COSMETIC_CATALOG as Record<string, { slot: string }>)[id]?.slot === s))
    && OUTFIT_IDS.every(o => !('NECK' in spec(o))) && new Set(OUTFIT_IDS.map(o => JSON.stringify(spec(o)))).size === 6;
  add('outfit library: 6 outfits (Student, Sports, Explorer, Mage, Ninja, Tết), every item in its declared slot, none replaces the scarf (NECK), all distinct', defOk,
    { outfits: Object.fromEntries(OUTFIT_IDS.map(o => [OUTFIT_LIBRARY[o].name, spec(o)])) });

  // 2. each outfit: equips, hides exactly the replaced defaults, keeps the scarf
  const per: Record<string, unknown> = {}; let ok2 = true;
  for (const o of OUTFIT_IDS) {
    const res = await c.setOutfit(o); step(c, 0.2);
    const eq = Object.fromEntries(c.getEquippedItems().filter(e => !e.default).map(e => [e.slot, e.id]));
    const hid = [...c.cosmetics.hiddenMeshes].sort(); const want = expectedHidden(o);
    const scarf = SLOT_DEFAULTS.NECK!.meshes.every(n => visible(c, n));
    const pack = visible(c, 'FOX_Backpack');
    const good = res.every(r => r.ok) && JSON.stringify(eq) === JSON.stringify(Object.fromEntries(Object.entries(spec(o)).sort((a, b) => COSMETIC_SLOTS.indexOf(a[0] as never) - COSMETIC_SLOTS.indexOf(b[0] as never))))
      && JSON.stringify(hid) === JSON.stringify(want) && scarf && pack === !('BACK' in spec(o)) && roots(c).length === Object.keys(spec(o)).length;
    per[o] = { equipped: eq, hidden: hid, expectedHidden: want, scarfVisible: scarf, defaultPackVisible: pack, roots: roots(c).length };
    ok2 &&= good;
  }
  add('each outfit equips fully; exactly the replaced defaults are hidden (no double pack, tuft only under hats), the red scarf always stays', ok2, per);

  // 3. switching between every ordered pair of outfits leaves nothing behind
  let leftovers = 0; const pairs: string[] = [];
  for (const a of OUTFIT_IDS) for (const b of OUTFIT_IDS) {
    if (a === b) continue;
    await c.setOutfit(a); await c.setOutfit(b);
    const n = roots(c).length, hid = [...c.cosmetics.hiddenMeshes].sort();
    if (n !== Object.keys(spec(b)).length || JSON.stringify(hid) !== JSON.stringify(expectedHidden(b))) { leftovers++; pairs.push(`${a}→${b}`); }
  }
  c.resetOutfit();
  add('outfit switching: all 30 ordered pairs → only the new outfit\'s items and hides remain', leftovers === 0, { failures: pairs });

  // 4. every new item: equip / unequip lifecycle, bound to this Fox's bones
  const life: Record<string, unknown> = {}; let ok4 = true;
  for (const id of LIBRARY_ITEM_IDS) {
    const r = await c.equip(id); const d = c.cosmetics.debugSlot(COSMETIC_CATALOG[id].slot);
    const bound = !!d && d.skeleton.bones.every(b => c.debug.bones[b.name] === b);
    const un = c.unequip(id); const gone = !roots(c).length;
    life[id] = { equip: r.ok, bound, primitives: d?.meshes.length, unequip: un, removed: gone }; ok4 &&= r.ok && bound && un && gone;
  }
  add('12 new library items: equip → bound to the Fox\'s own bones → unequip removes them', ok4, life);

  // 5. animation persistence: every outfit through the 17 required clips (+ mirror)
  const pers: Record<string, unknown> = {}; let ok5 = true;
  for (const o of OUTFIT_IDS) {
    await c.setOutfit(o); const want = c.getEquippedItems().map(e => `${e.slot}:${e.id}`).join(',');
    let bad = 0, detached = 0, hiddenNonHand = 0, handHidden = 0;
    for (const clip of H1_REQUIRED_CLIPS) {
      resetFox(c); const dur = startClip(c, clip);
      step(c, Math.min(dur, 6), () => {
        for (const s of COSMETIC_SLOTS) { const d = c.cosmetics.debugSlot(s); if (!d) continue; if (d.root.parent !== c.debug.fox) detached++;
          if (!d.root.visible) { if (s.startsWith('HAND')) handHidden++; else hiddenNonHand++; } }
        if (c.getEquippedItems().map(e => `${e.slot}:${e.id}`).join(',') !== want) bad++;
      });
      c.debug.daily.clear(); c.setStreak({ active: false }); step(c, 1.2);
    }
    const back = c.getEquippedItems().map(e => `${e.slot}:${e.id}`).join(',') === want && roots(c).every(r => r.visible);
    pers[o] = { lostFrames: bad, detached, hiddenNonHand, handBusyFrames: handHidden, allBackAfter: back }; ok5 &&= !bad && !detached && !hiddenNonHand && back;
  }
  add('persistence: each outfit stays equipped, attached and visible through the 17 required clips (+ mirror); hand items only hidden by the hand-busy rule', ok5, pers);

  // 6. level scaling: every outfit scales exactly with the Fox (same pose, ≤ 0.1 mm off the exact ratio)
  const lv: Record<string, unknown> = {}; let ok6 = true;
  resetFox(c);
  for (const o of OUTFIT_IDS) {
    await c.setOutfit(o);
    const sample = (L: number) => { c.setLevel(L, { immediate: true }); c.debug.fox.updateMatrixWorld(true); const pts: Vector3[] = [];
      for (const s of COSMETIC_SLOTS) { const d = c.cosmetics.debugSlot(s); if (!d) continue; const m = d.meshes[0] as SkinnedMesh; const p = new Vector3();
        for (const i of [0, Math.floor(m.geometry.attributes.position.count / 2)]) { m.getVertexPosition(i, p); p.applyMatrix4(m.matrixWorld); pts.push(p.clone().sub(c.object3D.getWorldPosition(new Vector3()))); } }
      return { pts, scale: c.scale }; };
    const a = sample(20), b = sample(1), d = sample(30);
    const err = (x: typeof a) => Math.max(...x.pts.map((p, i) => p.distanceTo(a.pts[i].clone().multiplyScalar(x.scale / a.scale)))) * 1000;
    lv[o] = { lv1Mm: +err(b).toFixed(4), lv30Mm: +err(d).toFixed(4) }; ok6 &&= err(b) <= 0.1 && err(d) <= 0.1;
  }
  c.setLevel(20, { immediate: true });
  add('level scaling: all 6 outfits at Lv1 / Lv30 match the exact scale ratio (≤ 0.1 mm)', ok6, lv);

  // 7. layering across outfits: capelet (BACK, 12 mm) over each BODY item (≤ 8 mm) equips, the capelet hides the default pack
  const layer: Record<string, unknown> = {}; let ok7 = true;
  for (const body of ['simple_jacket', 'sports_jersey', 'ninja_gi', 'tet_ao_dai']) {
    c.resetOutfit(); const r1 = await c.equip(body), r2 = await c.equip('mage_capelet');
    const okk = r1.ok && r2.ok && !visible(c, 'FOX_Backpack') && roots(c).length === 2; layer[body] = okk; ok7 &&= okk;
  }
  c.resetOutfit();
  add('cross-slot layering: the mage capelet layers over every BODY item (no exclusion needed), default pack hidden', ok7, layer);

  // 8. hand busy for the new held items (pencil during study)
  const hb: Record<string, unknown> = {}; let ok8 = true;
  for (const id of ['mage_wand', 'tet_lixi']) {
    resetFox(c); c.resetOutfit(); await c.equip(id);
    const vis = () => c.cosmetics.debugSlot('HAND_RIGHT')!.root.visible;
    c.enterState('study'); let hid = false; step(c, 5, () => { if (!vis()) hid = true; });
    c.exitState('study', 'cancel'); step(c, 2);
    hb[id] = { hiddenWhilePencil: hid, back: vis() }; ok8 &&= hid && vis();
  }
  c.resetOutfit();
  add('hand busy: wand and lì xì hide while the pencil is held and come back', ok8, hb);

  // 9. cleanup over outfit cycles
  const s0 = { ...c.cosmetics.stats };
  for (let k = 0; k < 2; k++) for (const o of OUTFIT_IDS) { await c.setOutfit(o); step(c, 0.05); }
  c.resetOutfit(); purgeCosmeticCache(); step(c, 0.1);
  const s1 = c.cosmetics.stats, cache = cosmeticCacheState();
  add('cleanup: 12 outfit changes → every item skeleton disposed, cache empty after purge, no approved mesh left hidden',
    s1.skeletonsCreated - s0.skeletonsCreated === s1.skeletonsDisposed - s0.skeletonsDisposed && cache.length === 0 && c.cosmetics.hiddenMeshes.length === 0,
    { created: s1.skeletonsCreated - s0.skeletonsCreated, disposed: s1.skeletonsDisposed - s0.skeletonsDisposed, cache });
  setCosmeticKeepAlive(5000);
  return R;
}
