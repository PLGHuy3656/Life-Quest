# LifeQuest Fox V2 — 3D mascot

Fox V2 is the chibi fox companion of LifeQuest. This folder (`mascot/fox-v2/`) holds everything needed to work on it:
- the Blender sources (model, rig, animation, cosmetics);
- the glTF exports;
- a browser runtime SDK (React 18 + three.js r170) with technical test harnesses;
- the validation evidence for every gate.

It contains no LifeQuest application screens.

## Status

| Gate | What | State |
|---|---|---|
| A – C r4 | reference, design, modelling baseline | accepted (C r4 conditionally) |
| D1.1 | rig: 28 bones, 14 face-morph meshes, sockets | approved |
| E2 | core animation, 7 clips (base GLB) | approved |
| F | runtime foundation (controller, events, interactions, fallback) | approved |
| G1.1 | quest / reward / streak module, 9 clips | accepted |
| G2.1 | daily-life module (study, sports, sleep, alarm, cooldown), 16 clips | accepted (CP-G2) |
| G3 | challenge / duo / group / social module, 17 clips + mirror | accepted as the animation prototype |
| H1 | modular cosmetics: 9 slots, runtime manager, 6 prototypes + 2 fixtures | delivered; portability assessment accepted as supporting evidence |
| H2 | cosmetic outfit library: Student, Sports, Explorer, Mage, Ninja, Tết | delivered, awaiting visual approval |

Not started: Gate I and the LifeQuest frontend.

## Where things are

| Need | Path |
|---|---|
| Canonical model + rig (edit here) | `03_RIG/fox_rig_d1_1.blend` (rollback: `03_RIG/checkpoints/gateD1_1_approved/`) |
| Modelling source (no rig) | `02_MODEL/fox_master.blend`, `02_MODEL/modules/*.blend` |
| Rig specs | `03_RIG/skeleton_spec.json`, `attachment_points.json`, `face_morph_map.json` |
| Core clips (idle, walk, run, wave, happy, head_pet, tail_touch) | `04_ANIMATIONS/fox_anim_e2.blend` |
| G1.1 / G2.1 / G3 clips | `04_ANIMATIONS/g1_1_cinematic_polish/`, `g2_1_deformation_polish/`, `g3_challenge_social/` (blend + spec + previews) |
| Cosmetics | H1: `05_COSMETICS/h1_prototypes/` · H2 outfit items: `05_COSMETICS/h2_outfits/fox_cosmetics_h2.blend`, `cosmetic_catalog_h2.json` |
| Base GLB: model, skeleton, morphs, 7 clips | `06_EXPORTS/glb/fox_v2_anim_e2.glb` |
| Animation modules (animation-only GLBs, bound by node name) | `06_EXPORTS/glb/modules/fox_v2_g1_1_*.anim.glb`, `fox_v2_g2_1_*`, `fox_v2_g3_*` |
| Cosmetic GLBs (skins on the Fox skeleton) | `06_EXPORTS/glb/cosmetics/*.glb` |
| Runtime SDK + harnesses (current) | `07_WEB_PREVIEW/companion_sandbox_h2/` (`src/mascot/` = SDK; H1 sandbox kept unchanged) |
| Pipeline / QA scripts | `08_VALIDATION/scripts/` |
| Contracts, build notes, limitations | `09_DOCS/` |

The following are history (rollback copies). Do not edit them:
- the `checkpoints/` folders;
- `fox_rig_prototype.blend` and `fox_anim_e1.blend`;
- `04_ANIMATIONS/g1_quest_reward_streak/` and `g2_daily_life/`;
- the module GLBs without the `_1` suffix;
- the older sandboxes (`companion_sandbox`, `_g1_1`, `_g2`, `_g2_1`, `_g3`, `_h1`).

## Animation set (50 clips)

- **Core E2 (7):** in the base GLB.
- **G1.1 (9):** quest_start / complete / failed, receive_xp, level_up, achievement_unlock, streak_active / cheer / lost.
- **G2.1 (16):** study, sports, sleep, wake, alarm and cooldown sequences.
- **G3 (18):** challenge invite / accept / start / win / lose / draw, duo_celebrate (+ mirror), group streak / victory, friend and social reactions.

Modules contain no body: they are bound to the base model by node name (`09_DOCS/FOX_RUNTIME_CONTRACT_V2.md` §10).
Events and clip contracts:
- `FOX_RUNTIME_CONTRACT_V2.md`
- `FOX_G2_EVENT_CONTRACT.md`
- `FOX_G3_EVENT_CONTRACT.md`

## Cosmetics (H1)

- **Slots:** `HEAD`, `FACE`, `NECK`, `BODY`, `BACK`, `HAND_LEFT`, `HAND_RIGHT`, `FEET`, `TAIL`.
- **Binding:** every item is a skin on the Fox skeleton, bound by joint name. It cannot detach, and it scales with the level.
- **Defaults:** the red scarf and green backpack are the defaults. A NECK / BACK item hides them; there are never two scarves or two packs.
- **Hand items:** they hide while a temporary animation prop needs the paw (pencil, flag, streak flame) and in paw-contact clips.

API:
```ts
fox.equip('student_glasses'); fox.unequip('FACE'); await fox.setOutfit('student'); fox.resetOutfit(); fox.getEquippedItems();
```
Contract: `09_DOCS/FOX_H1_COSMETIC_CONTRACT.md`. Compatibility matrix: `08_VALIDATION/cosmetics_h1/compatibility_matrix_h1.md`.

## Outfit library (H2)

There are six outfits, one call each: `await fox.setOutfit('outfit_mage')`. The ids are `outfit_student`, `outfit_sports`,
`outfit_explorer`, `outfit_mage`, `outfit_ninja` and `outfit_tet`.
- **Items:** 12 new items, plus the H1 items reused by Student, Sports and Explorer.
- **Identity:** every outfit keeps the red scarf, the face, the proportions and the tail.
- **Mixing:** items can still be mixed slot by slot.

Configuration and slot definitions: `09_DOCS/FOX_H2_OUTFIT_LIBRARY.md`.
Compatibility: `08_VALIDATION/cosmetics_h2/cosmetic_compatibility_report_h2.md`.
Validation: `08_VALIDATION/gate_h2_validation_report.md`.

## Quick start

Blender (5.3 or newer, no add-ons): open `04_ANIMATIONS/g3_challenge_social/fox_anim_g3.blend`, select `FOX_RIG`, pick a
clip in the Action Editor and play. Bone, shape-key and `FOX_*` mesh names are a contract: do not rename them.

Web runtime (Node 20+; tested with 22):
```
cd 07_WEB_PREVIEW/companion_sandbox_h2
npm ci && npm run build          # copies the GLBs into public/, type-checks, builds dist/
npx vite preview --port 4173     # harness pages: #/lab #/g1 #/g2 #/g3 #/h1 (cosmetics + outfit presets)  (?modules=0 = base clips only)
```
The build must run inside this folder tree, because it reads `../../06_EXPORTS` and the other source folders. The
shipped `dist/` is byte-identical to a fresh build.

Integration in an app: `09_DOCS/COMPANION_INTEGRATION_GUIDE.md`. Full hand-off: **`09_DOCS/THIRD_PARTY_HANDOFF_GUIDE.md`**.

## Validation and documents

| Topic | Document |
|---|---|
| Portability (Blender / GLB / runtime, two machines, offline) | `09_DOCS/ASSET_PORTABILITY_REPORT.md`, `BLENDER_OPEN_TEST.md`, `GLB_COMPATIBILITY_REPORT.md` |
| Latest runtime validation | `08_VALIDATION/gate_h2_validation_report.md`, `gate_h1_validation_report.md`; earlier: `gate_g3_runtime_report.md`, `gate_g2_1_runtime_report.md`, `gate_g1_1_runtime_report.md`, `gate_f_runtime_report.md` |
| Build commands per gate | `09_DOCS/BUILD*.md` |
| Package integrity | `09_DOCS/GATE_*_SHA256SUMS.txt`, `*_ASSET_MANIFEST.md`, `CLEANUP_LOG.md` |
| Model / rig reports | `08_VALIDATION/validation_report.md`, `03_RIG/deformation_test_report_d1_1.md` |
| Previous README (Gate G1) | `09_DOCS/README_HISTORY_GATE_G1.md` |

## Known limitations (summary)

- **Tested environments only.**
  - Blender 5.3 (bpy) on Linux.
  - The runtime in headless Chrome with software rendering (SwiftShader), on Linux.
  - A second machine (the Windows PC, through a Linux shell).

  **Not tested:** native Windows Blender, a native Windows browser, macOS, any real GPU (no GPU performance figures),
  and Unity / Unreal / Godot.
- **glTF cannot store shear.** Bones that do not inherit scale, under a squashing parent, deviate from Blender in glTF.
  The worst sampled case is `tail_touch` in the approved E2 GLB: 8.69 mm at the left ear tip (frame 15). Module clips
  are within 5.2 mm. Every glTF viewer shows the same deviation.
- **Backpack zone.** The tail passes through the backpack zone in every clip. The approved default pack does this too.
- **Clip storage.** Clips are spread over four animation blends; there is no single file with all 50.
- **Harness framing.** The fixed 3/4 camera of the `#/h1` harness cuts off the Fox's own ears at the Lv30 jump apex.
- **Mage hat.** It is kept low (floppy tip below the ear tips) so it stays in frame.
- **Per-gate details:** `09_DOCS/KNOWN_LIMITATIONS_GATE_*.md` (latest: H2).
