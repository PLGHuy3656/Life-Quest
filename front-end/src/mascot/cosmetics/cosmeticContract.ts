// Gate H1 — cosmetic slot contract (persistent user cosmetics) for the approved Fox V2.
//
// Persistent cosmetics are what the user wears; they survive every animation change, level change, mood, state and event.
// Temporary animation props (FX_PROP_* — pencil, flag, medal, streak flame, trophy …) belong to the effects manager and a
// clip; they are never cosmetics and never touch this contract. When a temporary prop needs a paw, the HAND slot item of
// that paw is hidden for that time and comes back by itself ("hand busy", see HAND_BUSY_RULES) — the equipped state does
// not change.
//
// Every cosmetic is a glTF skin on the canonical Fox skeleton (bound by joint NAME at runtime): rigid accessories have one
// joint (the deform bone that rigidly carries their socket), wearables reuse the Fox's own weights. So an item cannot detach,
// it follows the uniform level scale, and it needs no per-clip code.

import catalogJson from './cosmetic_catalog_h1.json';
import catalogH2Json from './cosmetic_catalog_h2.json';

export const COSMETIC_CONTRACT_VERSION = 'fox-v2/h1-cosmetics-1+h2-library-1';

export const COSMETIC_SLOTS = ['HEAD', 'FACE', 'NECK', 'BODY', 'BACK', 'HAND_LEFT', 'HAND_RIGHT', 'FEET', 'TAIL'] as const;
export type CosmeticSlot = (typeof COSMETIC_SLOTS)[number];

/** Attachment point of each slot. Sockets (ATT_*) are non-deform bones, never keyed by any approved clip, rigid children of `deformBone`. */
export const SLOT_ATTACH: Record<CosmeticSlot, { socket: string; deformBone: string; kind: 'rigid' | 'skinned'; note: string }> = {
  HEAD: { socket: 'ATT_HAT', deformBone: 'HEAD', kind: 'rigid', note: 'hats, caps, headbands (headbands may weight HEAD directly)' },
  FACE: { socket: 'ATT_GLASSES', deformBone: 'HEAD', kind: 'rigid', note: 'glasses, face accessories' },
  NECK: { socket: 'ATT_SCARF', deformBone: 'NECK', kind: 'skinned', note: 'scarves / necklaces — skinned NECK + SPINE like the default scarf' },
  BODY: { socket: 'SPINE', deformBone: 'SPINE', kind: 'skinned', note: 'clothing / armour — the Fox body + arm weights' },
  BACK: { socket: 'ATT_BACKPACK', deformBone: 'SPINE', kind: 'rigid', note: 'backpacks, capes' },
  HAND_LEFT: { socket: 'ATT_HAND_L', deformBone: 'PAW_L', kind: 'rigid', note: 'held accessories (left paw)' },
  HAND_RIGHT: { socket: 'ATT_HAND_R', deformBone: 'PAW_R', kind: 'rigid', note: 'held accessories (right paw)' },
  FEET: { socket: 'FOOT_L+FOOT_R', deformBone: 'FOOT_L+FOOT_R', kind: 'skinned', note: 'shoes — the leg weights' },
  TAIL: { socket: 'TAIL_03', deformBone: 'TAIL_03', kind: 'rigid', note: 'tail decorations' },
};

/** Default accessories of the approved model: visible while the slot holds no item; a slot item hides them (no doubles). */
export const SLOT_DEFAULTS: Partial<Record<CosmeticSlot, { id: string; meshes: readonly string[] }>> = {
  NECK: { id: 'default_scarf', meshes: ['FOX_Scarf_Roll', 'FOX_Scarf_Flap', 'FOX_Scarf_Emblem'] },
  BACK: { id: 'default_backpack', meshes: ['FOX_Backpack'] },            // its children (flap, pockets, buckle, straps) hide with it
};

export const COSMETIC_ITEM_IDS = ['student_glasses', 'student_cap', 'sports_headband', 'explorer_backpack', 'simple_jacket', 'explorer_magnifier',
  'slot_test_sneakers', 'slot_test_tail_ribbon'] as const;
/** Gate H2 outfit-library items (the H1 ids above are unchanged). */
export const LIBRARY_ITEM_IDS = ['sports_jersey', 'sports_sneakers', 'explorer_hat', 'mage_hat', 'mage_capelet', 'mage_wand', 'ninja_headband', 'ninja_gi',
  'ninja_scroll', 'tet_khan_dong', 'tet_ao_dai', 'tet_lixi'] as const;
export type CosmeticItemId = (typeof COSMETIC_ITEM_IDS)[number] | (typeof LIBRARY_ITEM_IDS)[number];

export interface CosmeticItemDef {
  id: string;
  slot: CosmeticSlot;
  name: string;
  /** Path relative to the app base URL. */
  path: string;
  /** Approved-model meshes this item replaces while equipped (e.g. the hair tuft under a cap). Slot defaults are hidden automatically. */
  hides: readonly string[];
  socket: string | null;
  /** Item ids or slots that cannot be worn together with this item (cross-slot conflict rule). Equipping wins: the other item is removed. */
  excludes?: readonly string[];
  /** Technical slot-test fixture — not cosmetic library content. */
  fixture?: boolean;
  triangles?: number;
  bytes?: number;
}

type CatalogJson = { items: Record<string, { slot: CosmeticSlot; name: string; file: string; hides: string[]; socket: string | null; fixture: boolean; triangles: number; bytes: number }> };
const CAT = { ...(catalogJson as unknown as CatalogJson).items, ...(catalogH2Json as unknown as CatalogJson).items };

/** H1 prototype set (+ two slot-test fixtures) and the H2 library items. Generated from the Blender build catalogues. */
export const COSMETIC_CATALOG: Record<CosmeticItemId, CosmeticItemDef> = Object.fromEntries([...COSMETIC_ITEM_IDS, ...LIBRARY_ITEM_IDS].map(id => {
  const c = CAT[id];
  return [id, { id, slot: c.slot, name: c.name, path: `models/${c.file}`, hides: c.hides.filter(m => !Object.values(SLOT_DEFAULTS).some(d => d!.meshes.includes(m))), socket: c.socket, fixture: c.fixture, triangles: c.triangles, bytes: c.bytes }];
})) as unknown as Record<CosmeticItemId, CosmeticItemDef>;

/** Outfit presets. A slot missing from a preset is left on its default (scarf / backpack) or empty. */
export const OUTFIT_PRESETS = {
  default: {},
  student: { FACE: 'student_glasses', HEAD: 'student_cap', BODY: 'simple_jacket' },
  sports: { HEAD: 'sports_headband', FEET: 'slot_test_sneakers' },
  explorer: { BACK: 'explorer_backpack', HAND_RIGHT: 'explorer_magnifier', FACE: 'student_glasses' },
  all_slots_test: { HEAD: 'student_cap', FACE: 'student_glasses', BODY: 'simple_jacket', BACK: 'explorer_backpack', HAND_RIGHT: 'explorer_magnifier', FEET: 'slot_test_sneakers', TAIL: 'slot_test_tail_ribbon' },
  // Gate H2 outfit library (the H1 presets above are kept unchanged for compatibility)
  outfit_student: { HEAD: 'student_cap', FACE: 'student_glasses', BODY: 'simple_jacket' },
  outfit_sports: { HEAD: 'sports_headband', BODY: 'sports_jersey', FEET: 'sports_sneakers' },
  outfit_explorer: { HEAD: 'explorer_hat', BACK: 'explorer_backpack', HAND_RIGHT: 'explorer_magnifier' },
  outfit_mage: { HEAD: 'mage_hat', BACK: 'mage_capelet', HAND_RIGHT: 'mage_wand' },
  outfit_ninja: { HEAD: 'ninja_headband', BODY: 'ninja_gi', BACK: 'ninja_scroll' },
  outfit_tet: { HEAD: 'tet_khan_dong', BODY: 'tet_ao_dai', HAND_RIGHT: 'tet_lixi' },
} as const satisfies Record<string, Partial<Record<CosmeticSlot, CosmeticItemId>>>;
export type OutfitPresetId = keyof typeof OUTFIT_PRESETS;

/** Gate H2 outfit library: display data for the six themed outfits (slot maps are in OUTFIT_PRESETS). Every outfit keeps
 *  the Fox's own red scarf (no NECK item) and leaves the face, body proportions and tail uncovered. */
export const OUTFIT_LIBRARY = {
  outfit_student: { name: 'Student', theme: 'school', palette: ['#24406B', '#1E7F8C', '#F26B3A'], keepsDefault: ['scarf', 'backpack'] },
  outfit_sports: { name: 'Sports', theme: 'athletics', palette: ['#168C78', '#1F6FD1', '#FAFAFA'], keepsDefault: ['scarf', 'backpack'] },
  outfit_explorer: { name: 'Explorer', theme: 'adventure', palette: ['#D8C08A', '#5E7A3A', '#C89B5E'], keepsDefault: ['scarf'] },
  outfit_mage: { name: 'Mage', theme: 'magic', palette: ['#4B2E83', '#5B3A9C', '#F2C14E'], keepsDefault: ['scarf'] },
  outfit_ninja: { name: 'Ninja', theme: 'stealth', palette: ['#1D2433', '#2B2F3A', '#E0533A'], keepsDefault: ['scarf'] },
  outfit_tet: { name: 'Tết', theme: 'Lunar New Year (Vietnam)', palette: ['#C1121F', '#E9B949', '#D0021B'], keepsDefault: ['scarf', 'backpack'] },
} as const satisfies Partial<Record<OutfitPresetId, { name: string; theme: string; palette: readonly string[]; keepsDefault: readonly string[] }>>;
export type OutfitId = keyof typeof OUTFIT_LIBRARY;
export const OUTFIT_IDS = Object.keys(OUTFIT_LIBRARY) as OutfitId[];
export type OutfitSpec = Partial<Record<CosmeticSlot, string | null>>;

/**
 * Hand-busy rules (temporary props win over persistent HAND items, for that time only):
 *  * socket props — any non-cosmetic object parented under the hand socket / paw bone (pencil, flag on ATT_HAND_R / _L);
 *  * the streak flame is held on ATT_HAND_L while the streak is active;
 *  * clips where the paw is used for contact (measured in the H1 compatibility matrix): the item is hidden for the clip.
 */
export const HAND_BUSY_CLIPS: Record<'HAND_LEFT' | 'HAND_RIGHT', readonly string[]> = {
  // From the H1 compatibility matrix (SEVERE = held item > 8 mm into the Fox): right = the magnifier, left = the same item
  // mirrored onto PAW_L (matrix-only fixture). The paw goes to the face / chest (wake_start rub, sports_start / _complete
  // wipe, study_complete stretch) or under the head (sleep). sleep_loop / sleep_wake are added for both paws so the item
  // does not pop in and out inside one sleep. The duo high-five contact paw (duo_celebrate = left, mirror = right) meets
  // the partner's paw (a design rule: a single-fox matrix cannot measure the partner).
  HAND_LEFT: ['sleep_enter', 'sleep_loop', 'sleep_wake', 'sports_start', 'study_complete', 'wake_start', 'duo_celebrate'],
  HAND_RIGHT: ['sleep_enter', 'sleep_loop', 'sleep_wake', 'sports_start', 'sports_complete', 'study_complete', 'wake_start', 'duo_celebrate_mirror'],
};

/**
 * Documented incompatible combinations. Same-slot items are always exclusive (equipping replaces). Cross-slot rules use
 * `excludes` on an item def. The H1 prototype set has no cross-slot conflict (all pairs measured — see
 * 08_VALIDATION/cosmetics_h1/compatibility_matrix_h1.md); these are the structural rules the runtime enforces.
 */
export const INCOMPATIBLE: readonly { a: string; b: string; rule: string }[] = [
  { a: 'student_cap', b: 'sports_headband', rule: 'same slot (HEAD): exclusive — equipping one removes the other' },
  { a: 'explorer_backpack', b: 'default_backpack', rule: 'BACK item hides the default backpack (never two packs)' },
  { a: 'HAND_RIGHT item', b: 'temporary right-paw prop (pencil, flag)', rule: 'hand busy: the HAND item is hidden while the prop is shown' },
  { a: 'HAND_LEFT item', b: 'streak flame / left-paw flag', rule: 'hand busy: the HAND item is hidden while the flame / prop is shown' },
  { a: 'HAND items', b: 'sleep_enter / _loop / _wake, sports_start, sports_complete (right), study_complete, wake_start, duo high-five contact paw', rule: 'hidden for the clip (paw contact, measured)' },
  { a: 'BACK items', b: 'tail sweep (all clips)', rule: 'pre-existing in the approved model: the tail passes through the backpack zone (default pack included) — documented, not a slot conflict' },
  { a: 'mage_capelet (BACK, 12 mm)', b: 'any BODY item (≤ 8 mm)', rule: 'compatible: the capelet layers over the garment (H2 layering test)' },
  { a: 'ninja_scroll straps', b: 'BODY garments', rule: 'compatible: the scroll uses the default strap path, which the garments\' strap cut-outs follow' },
];

export type CosmeticVisibility = 'visible' | 'hidden-hand-busy' | 'loading';
export interface EquippedItem { slot: CosmeticSlot; id: string; default: boolean; visibility: CosmeticVisibility; fixture?: boolean }
export type CosmeticResult =
  | { ok: true; slot: CosmeticSlot; id: string; replaced?: string | null; removed?: string[] }
  | { ok: false; id: string; slot?: CosmeticSlot; reason: 'unknown-item' | 'load-failed' | 'contract' | 'disposed' | 'superseded'; detail?: string };

export const isCosmeticSlot = (s: string): s is CosmeticSlot => (COSMETIC_SLOTS as readonly string[]).includes(s);
