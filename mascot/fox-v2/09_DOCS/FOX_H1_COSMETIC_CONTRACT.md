# Fox V2 — Gate H1 cosmetic slot contract

Contract version: `fox-v2/h1-cosmetics-1` (`COSMETIC_CONTRACT_VERSION`). The controller / animation / event contract is
unchanged: `FOX_CONTRACT_VERSION` stays `fox-v2/e2-anim+g1-module+g2.1-module+g3-module/f-runtime-4`.

Source: `07_WEB_PREVIEW/companion_sandbox_h1/src/mascot/cosmetics/cosmeticContract.ts` (types and data) and
`FoxCosmeticManager.ts` (runtime).

## 1. Two kinds of attachments

| | Persistent user cosmetics (H1) | Temporary animation props (G1–G3) |
|---|---|---|
| Owner | `FoxCosmeticManager` (one per Fox) | `FoxEffectsManager` + the clip spec cues |
| Lifetime | Until unequipped. Survives every clip, state, event, mood and level change | One clip / state (`FX_PROP_*`), removed by the clip |
| Examples | glasses, cap, headband, jacket, backpacks, held accessories | pencil, flag, streak flame, medal, trophy, notebook, pillow |
| Geometry | Skinned mesh on the Fox skeleton (bound by joint name) | Objects under a socket or in the fx root |
| Conflict | Slot rules (below) | Wins over HAND items while shown ("hand busy") |

The two never share code paths. A temporary prop never changes what is equipped; it only hides a HAND item for its own
duration (see §5).

## 2. Slots

| Slot | Socket (attach point) | Skin | Default accessory | Typical items |
|---|---|---|---|---|
| `HEAD` | `ATT_HAT` | rigid, `HEAD` | — | hats, caps, headbands |
| `FACE` | `ATT_GLASSES` | rigid, `HEAD` | — | glasses, face accessories |
| `NECK` | `ATT_SCARF` | skinned `NECK` + `SPINE` | red scarf (`FOX_Scarf_Roll`, `_Flap`, `_Emblem`) | scarves, necklaces |
| `BODY` | `SPINE` | skinned with the body / arm weights | — | clothing, armour |
| `BACK` | `ATT_BACKPACK` | rigid, `SPINE` | green backpack (`FOX_Backpack` + children) | backpacks, capes |
| `HAND_LEFT` | `ATT_HAND_L` | rigid, `PAW_L` | — | held accessories |
| `HAND_RIGHT` | `ATT_HAND_R` | rigid, `PAW_R` | — | held accessories |
| `FEET` | `FOOT_L` + `FOOT_R` | skinned with the leg weights | — | shoes |
| `TAIL` | `TAIL_03` | rigid, `TAIL_03` | — | tail decorations |

The sockets (`ATT_*`) are non-deform bones. No approved clip keys them (checked in every animation blend), so each one is
a rigid child of the deform bone listed under "Skin". A skin can only use deform bones, so a rigid item is weighted
100 % to the socket's deform parent. That gives exactly the same rigid motion as the socket. The catalogue still records
the socket as the item's attach point.

## 3. Item binding

- **Asset.** One GLB per item: the canonical armature plus one skinned mesh. glTF may split it into one primitive per
  material. Every item is built from the canonical rig (`03_RIG/fox_rig_d1_1.blend`, read-only) by
  `08_VALIDATION/scripts/cosmetics_h1.py`.
- **Runtime binding.** The item's armature is discarded. A `Skeleton` is built from **this Fox's own bone objects**,
  looked up by joint name, using the item's inverse bind matrices. The meshes are new `SkinnedMesh` objects on the
  **shared** item geometry and materials. They are added under the Fox root, the same space as the Fox's own skins.
- **What follows from this.**
  - An item cannot detach: rigid points stay fixed in their bone frame, measured at 0.000 mm over 139 poses.
  - Items follow the uniform level scale exactly.
  - Items need no per-clip code.
  - Two Foxes share one copy of each item's geometry.
- **Contract check at load.** The file must contain at least one skinned mesh, all on one skeleton, and every joint name
  must exist on the Fox. Otherwise the result is `{ ok: false, reason: 'contract' }`.

## 4. API (typed)

```ts
fox.equip('student_glasses');          // Promise<CosmeticResult>  — replaces the slot's item, hides the slot default
fox.unequip('student_glasses');        // boolean — by item id or by slot ('FACE'); the slot default returns
fox.setOutfit('student');              // Promise<CosmeticResult[]> — preset id or { HEAD: 'student_cap', … }; unnamed slots → default
fox.resetOutfit();                     // the approved default look (scarf + backpack)
fox.getEquippedItems();                // EquippedItem[] { slot, id, default, visibility: 'visible' | 'hidden-hand-busy' | 'loading' }
fox.cosmetics.serialize();             // OutfitSpec to persist; restore with setOutfit(spec)
new FoxController({ …, outfit: 'student' })   // initial outfit (async; failures keep the default)
```

`CosmeticResult` is one of:

- `{ ok: true, slot, id, replaced?, removed? }`
- `{ ok: false, id, slot?, reason }`, where `reason` is one of:
  - `unknown-item`
  - `load-failed` (network / HTTP / parse)
  - `contract`
  - `superseded` (a later request for the same slot won)
  - `disposed`

Controller events are of type `'cosmetic'`, with `op` set to one of:

- `equip` / `unequip` (with `slot`, `id` and `replaced`)
- `error` (with `reason` and `detail`)
- `hand-busy` (with `busy` and `cause`, e.g. `prop:FX_PROP_pencil` or `clip:sleep_enter`)

## 5. Conflict and visibility rules

1. **Same slot is exclusive.** Equipping replaces the current item. If two equips are in flight for one slot, the
   latest wins and the earlier resolves `superseded`.
2. **Defaults are replaced, never doubled.** A NECK item hides all three default scarf meshes. A BACK item hides the
   default backpack together with its straps, flap, pockets and buckle. Unequipping restores them.
3. **Item `hides`.** An item may hide other approved meshes while worn. The student cap hides `FOX_Tuft`. Hides are
   reference-counted per mesh and released when the item goes.
4. **Cross-slot `excludes`.** An item may exclude item ids or whole slots. Equipping it removes the conflicting item
   (the newly equipped item wins), and `result.removed` lists what was removed. The H1 prototype set has no cross-slot
   conflict (every pair was measured; see the compatibility matrix). The mechanism is tested with a test-only item.
5. **Hand busy (temporary props win over HAND items, for that time only).** A HAND item is hidden while:
   - a non-cosmetic object is visible under that paw's socket or paw bone (pencil, flag);
   - for the left paw, the streak flame is held;
   - the current clip is listed in `HAND_BUSY_CLIPS`. These are the clips where the paw makes contact, derived from the
     compatibility matrix with a mirrored left-paw test fixture:
     - sleep enter / loop / wake;
     - the duo high-five contact paw;
     - and, measured, the clips where the paw goes to the head or body (see the matrix).

   The equipped state does not change. The item reappears by itself.
6. **Missing or invalid asset.** The slot keeps whatever it had (the default accessory stays visible), an `error` event
   is emitted, and the promise resolves with `ok: false`. Nothing throws.

## 6. Documented incompatible combinations

`INCOMPATIBLE` in the contract file lists them (same slot, default vs item, HAND item vs temporary paw props, HAND items
in the paw-contact clips). Clip-level findings, such as the tail passing through the backpack zone, are in
`08_VALIDATION/cosmetics_h1/compatibility_matrix_h1.md`.

## 7. Cleanup

- **Unequip:** removes the item's root from the Fox, disposes the item skeleton (its bone texture), and drops one
  reference on the shared item template.
- **Template:** the parsed GLB stays cached for a keep-alive (default 5 s, `setCosmeticKeepAlive`) and is then
  disposed (geometries, materials, textures, template skeletons).
- **Controller `dispose()`:** unequips everything.
- **Render bindings:** `FoxRenderBinding.collect()` is re-run on every equip, so each renderer's listeners on the
  shared item resources are released with the canvas.

## 8. Adding a library item (later gates)

1. Build it on the canonical armature. Weight it to the deform bone of its socket (rigid), or keep the Fox weights of
   the region it covers (wearables).
2. Export one GLB with the armature (no animations, no morphs).
3. Add a catalogue entry (`slot`, `path`, `hides`, optional `excludes`).
4. Run the compatibility matrix against all approved clips. Add `HAND_BUSY_CLIPS` entries or `excludes` from the data,
   not by eye.
