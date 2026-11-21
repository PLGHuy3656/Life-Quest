> **Update — Gate C correction r4 (2026-11-16):** validation re-run, **35/35 pass**
> (height 0.990 m, nothing below ground, base cage 55,345 tris vs 55,341 in r3).
> Silhouette IoU r4: front 0.76 · 3/4 0.66 · side 0.83 · back 0.85 (coarse guide only).
> Current visual review: `../GATE_C_R4_CHANGES.md`; comparison `01_DESIGN/comparisons/fox_reference_vs_model_r4.png`.

> **Update — Gate C correction r3 (2026-11-16):** validation re-run, **35/35 pass**.
> Silhouette IoU r3: front 0.78 · 3/4 0.67 · side 0.84 · back 0.86 (coarse guide only).
> Tail = option C (character's right), wider upper ears, orange base `#FF8D2E`.
> Current visual review: `../GATE_C_R3_CHANGES.md`.

> **Update — Gate C correction r2 (2026-11-16):** technical validation re-run, **35/35 pass**
> (new: brow shape keys, Frown/Smile mouths, nothing below ground). Silhouette IoU r2:
> front 0.88 · 3/4 0.70 · side 0.82 · back 0.77. The r1 review below is kept for history;
> the current visual review and open tail decision are in `../GATE_C_CORRECTIONS.md`.

# LifeQuest Fox V2 — Validation Report

Scope: **Gates A, B, C**. Gates D (rig), E (animation), F (GLB + web viewer)
are **not started**, as the brief requires stopping for visual approval.
Date: 2026-11-16 · Blender 5.3.0 (bpy module) · Cycles CPU.

## 1. Automated technical checks — 33/33 pass

Command: `python 08_VALIDATION/scripts/validate_model.py` → `validation_results.json`

| Area | Result |
|---|---|
| Gate A files exist, JSON valid | ✅ |
| 8 module `.blend` files open and contain geometry | ✅ head 2 · face 15 · ears 4 · body 1 · arms_legs 4 · tail 1 · scarf 3 · backpack 8 objects |
| `fox_master.blend` opens, collection tree matches the brief | ✅ |
| Preview lighting separate from geometry | ✅ |
| Materials assigned, indices valid, no missing textures | ✅ (textureless asset) |
| Clean transforms (rot 0 / scale 1), every mesh under `FOX_ROOT` | ✅ |
| No broken object references | ✅ |
| Closed parts have outward normals | ✅ |
| Face decals sit on head surface (no clipping / floating) | ✅ eyes 2–8 mm, blush 1.5 mm, mouth 2 mm |
| Ears independent objects with base pivots | ✅ |
| Backpack detachable hierarchy | ✅ |
| Eye shape keys + expression swap meshes | ✅ Blink, Wide, Sad, HalfLid |
| Total height | ✅ 0.989 m (target 1.00 ± 3 %) |
| Base cage ≤ 60k tris | ✅ 51,241 tris (407,421 with live subdivision — source quality, **not** the web budget) |

Not applicable yet (Gates D–F): GLB export, skeleton hierarchy, animation
names, interaction zones, level-scale runtime test, viewer loading, browser
console errors.

## 2. Silhouette comparison (coarse guide only)

`python 08_VALIDATION/scripts/make_comparison.py` → `silhouette_metrics.json`

| View | IoU vs reference | Height ratio | Note |
|---|---|---|---|
| Front | 0.77 | 0.98 | tail mirrored **by decision** (see §4) |
| 3/4 | 0.68 | 0.97 | reference angle estimated, alignment approximate |
| Side | 0.86 | 0.96 | |
| Back | 0.84 | 1.00 | |

The reference is an illustrated sheet with perspective, so IoU is not a
pass/fail criterion. It is used to find shape errors, not to approve the model.

## 3. Manual visual review (Claude, against `fox_reference_vs_model.png`)

| # | Criterion | Verdict | Notes |
|---|---|---|---|
| 1 | Head silhouette | ✅ close | wide mochi dome + cheek-fluff ridge read from front and back |
| 2 | Ear proportions | ⚠️ close, not exact | size and position match; reference ears are slightly more cupped/rounded at the tip and lean outward a bit more; inner cream reads a touch brighter |
| 3 | Eye placement | ✅ | measured positions, sitting just above the cream arch as in the reference |
| 4 | Muzzle construction | ✅ | cream ellipse mask and soft forward bulge; nose/mouth match |
| 5 | Body-to-head ratio | ✅ | 1.04 : 1 |
| 6 | Tail silhouette | ⚠️ | size/curl match the back and side views; on the **opposite side** from the reference front view (decided, §4) |
| 7 | Scarf shape | ✅ | roll + bandana triangle + flame emblem |
| 8 | Backpack placement | ⚠️ | correct height and size; in the back view the tail overlaps the pack more than in the reference; colour question open (§4) |
| 9 | Primary colours | ✅ front / ⚠️ side & back | sampled front: cream `#EFD5BE` vs ref `#F7D9BA`, belly `#FCE1C8` vs `#FBDFC2`, orange `#FF9A57` vs `#FE9942`. Side and back renders are darker than the reference (lighting, not material) |
| 10 | Overall personality | ✅ | reads as the same cute LifeQuest fox; no redesign |

**Visual approval is NOT claimed.** The character identity is recognisably the
same, but the ⚠️ items need your decision before rigging.

## 4. Open decisions for you (Gate C)

1. **Tail side:** keep on the character's right (back-view authority), or
   follow the front view (left)? One-line change in `build_tail`.
2. **Backpack green:** palette `#4CAF6E` (current) or the olive `#688E52` /
   `#6A9A55` that every rendered reference view shows?
3. **Ears:** accept, or push further towards rounder, more cupped tips?
4. Anything else in the comparison sheet that breaks identity for you.

## 5. Known limitations

* The reference turnaround is not orthographic; measurements are ±8 mm and some values are estimates (tagged in `proportions.json`).
* Facial controls are prepared (shape keys + swap meshes) but not driven by a rig yet; brows are flat strokes (Sad brow tilt to be added with the rig).
* Subdivision is live in the source. The web LOD (subdivision level at export, target triangle count) is a Gate F decision; face decals are fitted to the level-2 head surface, so a lower export level needs a decal re-fit (the build script supports this).
* Review lighting is a single fixed rig; side/back renders come out darker than the reference.
* `.blend` files are not byte-identical across machines; the build is reproducible structurally (same objects, names, vertex counts) — verify with `validate_model.py`.
