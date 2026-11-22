# Gate H1 — validation report (modular cosmetics and equipment)

Runtime suite: **28/28** checks pass. Headless Chrome + SwiftShader: no GPU, so no frame-rate or GPU-performance claim is made.
Report: `08_VALIDATION/runtime_h1/h1_runtime_report.json` (2026-11-19 17:24:41 → 2026-11-19 17:29:50).

## Deliverables

- Slot contract: `09_DOCS/FOX_H1_COSMETIC_CONTRACT.md`, `src/mascot/cosmetics/cosmeticContract.ts`
- Runtime manager: `src/mascot/cosmetics/FoxCosmeticManager.ts`, plus the controller API (`equip` / `unequip` / `setOutfit` / `resetOutfit` / `getEquippedItems`)
- Prototype assets: `05_COSMETICS/h1_prototypes/` (blend + catalogue), `06_EXPORTS/glb/cosmetics/*.glb` (8 GLBs: 6 prototypes + 2 slot fixtures)
- Harness: `#/h1` in `07_WEB_PREVIEW/companion_sandbox_h1`
- Matrix: `08_VALIDATION/cosmetics_h1/compatibility_matrix_h1.md`
- Contact sheets and videos: `08_VALIDATION/runtime_h1/`

## Items

| Item | Slot | Socket | Skin joints | Triangles | GLB bytes | Hides |
|---|---|---|---|---|---|---|
| Student glasses | FACE | ATT_GLASSES | HEAD | 1740 | 60492 | — |
| Student cap | HEAD | ATT_HAT | HEAD | 3328 | 111668 | FOX_Tuft |
| Sports headband | HEAD | HEAD | HEAD | 576 | 26900 | — |
| Explorer backpack | BACK | ATT_BACKPACK | SPINE | 4452 | 137436 | FOX_Backpack |
| Simple jacket | BODY | — | ARM_L, ARM_R, HIPS, NECK, PAW_L, PAW_R, SPINE | 3204 | 98896 | — |
| Explorer magnifier | HAND_RIGHT | ATT_HAND_R | PAW_R | 650 | 29956 | — |
| Slot test: sneakers | FEET | — | FOOT_L, FOOT_R | 1088 | 40684 | — |
| Slot test: tail ribbon | TAIL | TAIL_03 | TAIL_03 | 580 | 25056 | — |

The canonical Fox is not rebuilt, redesigned or modified:
- The rig blend is read-only, and no skeleton node, morph target or proportion changes.
- The red scarf and green backpack stay the default equipped items. Items hide them; they are never edited.

## Runtime checks

| | Check |
|---|---|
| PASS | Every item GLB binds to the E2 Fox by joint name (joints = this Fox's own bone objects); the Fox gains no mesh, bone or clip |
| PASS | Attachment (runtime): every rigid item point stays fixed in its carrier bone frame through all 137 sampled poses (≤ 0.01 mm) — no detachment, no drift; head items share the exact transform of the approved rigid FOX_Head |
| PASS | Attachment vs Blender: 34 tracker vertices with Fox surface under them (≤ 30 mm) × 17 required clips (137 poses): each deviates from Blender by at most 1.0 mm more than the approved Fox surface right under it |
| PASS | Held item (magnifier, rigid on PAW_R): Blender deviation of every tracker ≤ the approved Fox surface's own max deviation in the same poses (18.3 mm) |
| PASS | Other item points with no Fox surface within 30 mm (pack corner, ribbon loops): Blender deviation ≤ 6.0 mm (bone-fidelity tolerance) |
| PASS | [harness] slot contract: 9 slots, 8 catalogue items (6 prototypes + 2 slot fixtures), presets reference valid slot items |
| PASS | [harness] default look: red scarf + green backpack reported as the NECK / BACK defaults |
| PASS | [harness] equip / unequip every item: bound to THIS Fox's bones by joint name, parented under the Fox, fully removed on unequip |
| PASS | [harness] re-equip and idempotent equip (same item twice = one instance) |
| PASS | [harness] BACK: explorer backpack hides the default backpack (+ straps, flap, pockets); unequip restores it; one BACK entry only |
| PASS | [harness] NECK: an item hides all three default scarf meshes (no double scarf); unequip restores them (test-only NECK item) |
| PASS | [harness] HEAD: same-slot replacement (cap → headband): one HEAD item, the cap's tuft hide is released |
| PASS | [harness] cross-slot conflict rule: equipping an item that excludes BACK removes the backpack item (default pack returns) |
| PASS | [harness] missing asset → load-failed, invalid file → contract; the slot keeps its item, defaults stay correct, error events emitted |
| PASS | [harness] missing asset on an empty slot: the default backpack stays visible |
| PASS | [harness] concurrent equips in one slot: the latest request wins, the earlier one resolves "superseded" |
| PASS | [harness] setOutfit(preset) / serialize() → setOutfit(saved) round trip; slots not named return to default |
| PASS | [harness] resetOutfit(): only the approved defaults remain, every default mesh visible |
| PASS | [harness] persistence: 7 slots equipped through all 17 required clips (+ mirror) — never unequipped, detached or hidden (except the hand-busy rule), all back afterwards |
| PASS | [harness] hand busy: right item hidden while the pencil is held and during the mirrored duo contact; left item hidden while the streak flame is held; all come back; equipped state unchanged |
| PASS | [harness] uniform level scaling: every item scales with the Fox (Lv1 / Lv30 vs Lv20, ≤ 0.1 mm off the exact ratio) |
| PASS | [harness] cleanup: 6 full-outfit cycles → every skeleton disposed, item cache empty after purge, renderer geometries / textures back to baseline |
| PASS | [harness] two Fox instances: one shared item geometry, separate skeletons on each Fox's own bones; disposing a Fox releases its items |
| PASS | [harness] approved Fox untouched: materials, skeleton, clip set, event registry and controller contract version unchanged; no default mesh left hidden |
| PASS | Lv1 and Lv30 with the full test outfit: every item vertex stays inside the canvas through the 17 required clips (+ mirror), fixed 3/4 camera |
| PASS | GPU resource cleanup: 8 outfit cycles while rendering → renderer geometries / textures / programs back to the default-look baseline, item cache empty |
| PASS | Render counts measured: default look vs outfits (draw calls / triangles / geometries — software renderer, no timing claim) |
| PASS | no page errors / unexpected 404s (only the intentional missing-asset test file, and the static server's missing favicon.ico, matched by count) |

## Key measurements

**Attachment.** Rigid item points stay fixed in their bone frame through all sampled poses (0.000 mm). Head items share the exact
transform of the approved rigid `FOX_Head`. Against Blender, every item point that has Fox surface under it deviates by at most 1 mm more
than that surface does. Some points deviate up to 19.8 mm in absolute terms (`streak_lost`, cap crown). That is the approved Fox head's own
deviation at that distance: glTF stores TRS per joint, so the shear of non-uniform squash is lost. It is not a cosmetic defect.
Far-point values: `{"student_cap#2": 16.556, "student_cap#3": 16.29, "student_cap#4": 19.759, "student_glasses#1": 13.519, "student_glasses#5": 13.479}`.

**Level scaling.** Lv1 = 0.80 and Lv30 = 1.10. Items match the exact scale ratio (0.000 mm error). Every item vertex stays inside the canvas
through the required clips: minimum margin 119.2 px at Lv1 and 8.1 px at Lv30.

**Resources.** After 8 outfit cycles while rendering, renderer geometries / textures / programs were {'geometries': 53, 'textures': 34, 'programs': 9} before and {'geometries': 53, 'textures': 34, 'programs': 9} after; the item cache is empty.

**Render counts** (software renderer, counts only):
- default look: 48 draw calls, 73842 triangles, 53 geometries, 34 textures
- student: 55 draw calls, 80358 triangles, 60 geometries, 37 textures
- all_slots_test (7 items): 56 draw calls, 83134 triangles, 68 geometries, 41 textures

**Compatibility.** SEVERE values left after the hand-busy rule: 0. Backpack × tail is pre-existing:
- explorer pack max 46.9 mm, against 82.8 mm for the approved default pack;
- the explorer pack is at or below the default pack in 48/50 clips.

## Regressions (approved suites, assertions unchanged)

| Suite | Result |
|---|---|
| e2 | 29 passed, 0 failed |
| f_fallback | 35/35 PASS |
| f_g1 | 35/35 PASS |
| g1_1 | 23/23 PASS |
| flame_g1_1 | pass |
| g2_1 | 41/41 PASS |
| g3 | 34/34 PASS |

## GPU performance

Not measured. No GPU is available in this environment, and software rendering is not used as a performance claim.
The cost of an outfit is given as draw calls, triangles, geometries and textures above.
