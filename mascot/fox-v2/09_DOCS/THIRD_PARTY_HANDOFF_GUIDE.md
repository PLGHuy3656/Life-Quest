# Fox V2 — third-party handoff guide

For a developer or artist who receives `LifeQuest_Fox_V2_GateH1.zip` and has no access to Claude. Everything below was
done on a clean extraction (see `ASSET_PORTABILITY_REPORT.md`).

> The root `README.md` describes the project at Gate G1. Its status line and folder table are out of date: it was not
> rewritten, because approved files are only changed with approval. **Use this guide as the entry point.**

## 1. Requirements

| Task | Needs |
|---|---|
| Open / edit the model, rig, animations | **Blender 5.3 or newer** (no add-ons) |
| Inspect the GLBs | any glTF 2.0 viewer (tested: Babylon.js 9.37, Blender's glTF importer) |
| Run the web mascot | **Node.js 20+** (tested 22.23) with npm 10, plus a modern browser with WebGL2 |
| Re-run the validation scripts | Python 3.10+; Playwright + Chrome for the browser suites; `bpy` 5.3 or Blender for the Blender scripts |

Nothing calls a Claude / Anthropic service, analytics, or a CDN. The only network use is `npm ci`, which fetches the
open-source dependencies from the npm registry once.

## 2. Verify the package

```
unzip LifeQuest_Fox_V2_GateH1.zip && cd LifeQuest_Fox_V2
sha256sum -c 09_DOCS/GATE_H1_SHA256SUMS.txt        # 1,603 files, all "OK"  (Windows: Git Bash, or Get-FileHash)
```

## 3. What is where (the working set)

| What | File |
|---|---|
| Master model (modelling source, no rig) | `02_MODEL/fox_master.blend` (+ `02_MODEL/modules/*.blend`) |
| **Canonical rig + model** (28 bones, 14 face-morph meshes) | `03_RIG/fox_rig_d1_1.blend` |
| Core clips (idle, walk, run, wave, happy, head_pet, tail_touch) | `04_ANIMATIONS/fox_anim_e2.blend` |
| Quest / reward / streak clips (9) | `04_ANIMATIONS/g1_1_cinematic_polish/fox_anim_g1_1.blend` |
| Daily-life clips (16) | `04_ANIMATIONS/g2_1_deformation_polish/fox_anim_g2_1.blend` |
| Challenge / social clips (17 + mirror) | `04_ANIMATIONS/g3_challenge_social/fox_anim_g3.blend` |
| Cosmetic prototypes | `05_COSMETICS/h1_prototypes/fox_cosmetics_h1.blend` + `cosmetic_catalog_h1.json` |
| Base GLB (model + skeleton + morphs + 7 clips) | `06_EXPORTS/glb/fox_v2_anim_e2.glb` |
| Animation modules (animation only, no body) | `06_EXPORTS/glb/modules/fox_v2_{g1_1,g2_1,g3}_*.anim.glb` |
| Cosmetic GLBs | `06_EXPORTS/glb/cosmetics/*.glb` |
| Web runtime (React + three.js) | `07_WEB_PREVIEW/companion_sandbox_h1/` |
| Contracts | `09_DOCS/FOX_RUNTIME_CONTRACT_V2.md`, `FOX_G2_EVENT_CONTRACT.md`, `FOX_G3_EVENT_CONTRACT.md`, `FOX_H1_COSMETIC_CONTRACT.md`, `COMPANION_INTEGRATION_GUIDE.md` |
| Known limitations | `09_DOCS/KNOWN_LIMITATIONS_GATE_*.md` (latest: H1) |

The following are history (rollback copies). Do not edit them:
- `02_MODEL/checkpoints/` and `03_RIG/checkpoints/`;
- `03_RIG/fox_rig_prototype.blend` and `04_ANIMATIONS/fox_anim_e1.blend`;
- `04_ANIMATIONS/g1_quest_reward_streak/` and `04_ANIMATIONS/g2_daily_life/`;
- the module GLBs without the `_1` suffix (`fox_v2_g1_*`, `fox_v2_g2_*`).

## 4. Blender: open, play, edit

1. Open the file for the clip you want, e.g. `fox_anim_g3.blend`. There are no add-ons to enable and no missing files.
2. Select `FOX_RIG`. In the *Action Editor* (Dope Sheet → Action Editor), pick the clip (e.g. `challenge_win`) and play.
   - For face expressions, also open the *Shape Key Editor* on a face mesh. The face tracks are in the same action
     (slotted action, one slot per face mesh).
3. Edit keys as usual and save.
   - Bone and mesh names are a contract: the runtime binds by name. **Do not rename bones, shape keys or `FOX_*`
     meshes.**
   - The proportions and the rest pose are canonical.
4. To move a clip into another file, use *File → Append → Action*. Every file uses the same `FOX_RIG`.
5. To check a file is self-contained, run
   `blender -b --factory-startup --python 08_VALIDATION/scripts/portability_blender_check.py -- . report.json`.

## 5. Export GLBs again (after editing)

The exports were made by the pipeline scripts in `08_VALIDATION/scripts/`; each gate's `BUILD_*.md` gives the commands:
- base clips: `export_glb_e2`;
- modules: `export_glb_g1_1.py`, `export_glb_g2_1.py`, `export_glb_g3.py`;
- cosmetics: `cosmetics_h1.py`.

They are plain Blender Python. From the package root, run them with `blender -b --python <script>`, or with `python`
plus the `bpy` module.

Manual export from the Blender UI also works:
- *File → Export → glTF 2.0*, **GLB**, armature + skinning + shape keys + animation;
- *no* "deform bones only", because the socket bones `ATT_*` are needed by the runtime.

After either kind of export, check the result with the validator (§6) and run the browser suites (§7).

## 6. Inspect the GLBs without the Fox runtime

```
cd 08_VALIDATION/portability/viewer && npm ci            # Babylon.js, its loaders, Khronos glTF-Validator (local copies)
node validate.js ../../.. validator.json                 # glTF-Validator over all current GLBs
cd ../../.. && python -m http.server 8000                # serve the package root
#   open http://localhost:8000/08_VALIDATION/portability/viewer/babylon_test.html
#   (or headless: python 08_VALIDATION/portability/viewer/run_babylon.py 8000 out/ <chrome.exe>)
```

The page does three things with the GLBs, all with Babylon only:
- loads the base GLB and binds the three modules by node name (the documented module procedure);
- puts the cosmetics on the Fox skeleton;
- compares every clip with the Blender ground truth.

In Blender itself, run `08_VALIDATION/scripts/portability_gltf_reimport.py`.

## 7. Run the web mascot

```
cd 07_WEB_PREVIEW/companion_sandbox_h1
npm ci                      # 89 packages from package-lock.json (react 18.3, three 0.170, @react-three/fiber 8.17, vite 5.4, typescript 5.6, @fontsource/plus-jakarta-sans)
npm run build               # copies the GLBs / specs from 06_EXPORTS, 04_ANIMATIONS and 05_COSMETICS into public/, type-checks, builds dist/
npx vite preview --port 4173   # or: npm run dev   or serve dist/ with any static server
```

`npm run build` must run from inside the extracted package: `scripts/copy-assets.mjs` reads `../../06_EXPORTS` and the
other source folders. The prebuilt `dist/` in the zip is byte-identical to a fresh build, so serving it directly also
works.

Pages:

| URL | What it shows |
|---|---|
| `#/` | sample dashboard host |
| `#/companion` | settings |
| `#/lab` | Gate F controls |
| `#/g1` | quest / reward / streak lab |
| `#/g2` | daily-life lab |
| `#/g3` | challenge / social lab (single + multi-fox) |
| `#/h1` | cosmetics lab (slots, presets, clips, level, cameras) |

`?modules=0` loads the base clips only.

Use from code (TypeScript): see `COMPANION_INTEGRATION_GUIDE.md`. Minimal:

```ts
import { FoxController, ANIMATION_MODULES } from './mascot';
const fox = await FoxController.create({ modelUrl: '/models/fox_v2_anim_e2.glb', modules: ANIMATION_MODULES, level: 12 });
fox.handleEvent('QUEST_COMPLETED');        // typed events (see the event contracts)
await fox.setOutfit('student');            // cosmetics
```

## 8. Re-run the tests (optional)

The tests are plain Python + Playwright against a static server; ports and commands are in each `BUILD_*.md`.

- **Cosmetics suite (28 checks):** `08_VALIDATION/scripts/browser_h1_test.py`.
- **Regressions of every earlier gate:** `regress_h1.py`.
- **Offline smoke test:** `portability_runtime_smoke.py <port> <out>`. It blocks every host except 127.0.0.1, then plays
  core + module clips, VFX, daily states and cosmetics.

The suites use SwiftShader by default (no GPU). Remove the `--use-angle=swiftshader` flags to run on a real GPU.

## 9. Licences and third-party content

- Runtime dependencies are open source: React (MIT), three.js (MIT), @react-three/fiber (MIT), Vite (MIT),
  TypeScript (Apache-2.0), Plus Jakarta Sans via @fontsource (SIL OFL 1.1).
- The test-only viewer uses Babylon.js (Apache-2.0) and the Khronos glTF-Validator (Apache-2.0).
- The Fox model, rig, animations, textures-free materials and cosmetics are original project assets. There are no
  third-party meshes or images.
