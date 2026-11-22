# LifeQuest Fox V2 — Gate I Final Production Manifest

Total hashed production files: **405** (plus this manifest and `GATE_I_FINAL_SHA256SUMS.txt`).
Archive: `LifeQuest_Fox_V2_GateI_Final.zip`

## Summary by Folder

| Folder | Files | Total Bytes |
|---|---:|---:|
| `02_MODEL` | 1 | 853,411 |
| `03_RIG` | 4 | 1,003,181 |
| `04_ANIMATIONS` | 13 | 9,775,052 |
| `05_COSMETICS` | 4 | 2,611,753 |
| `06_EXPORTS` | 39 | 12,419,617 |
| `07_WEB_PREVIEW` | 162 | 26,725,050 |
| `08_VALIDATION` | 139 | 1,913,748 |
| `09_DOCS` | 42 | 1,277,905 |
| `README.md` | 1 | 7,863 |

## Key Production Assets

- **Model & Canonical Rig:** `02_MODEL/fox_master.blend`, `03_RIG/fox_rig_d1_1.blend` (+ skeleton/attachment/morph specs)
- **Animation Sources (58 clips total):** `fox_anim_e2.blend` (7), `fox_anim_g1_1.blend` (9), `fox_anim_g2_1.blend` (16), `fox_anim_g3.blend` (18), `fox_anim_i.blend` (8)
- **Exported GLBs:** `fox_v2_anim_e2.glb`, `fox_v2_g1_1_quest_reward_streak.anim.glb`, `fox_v2_g2_1_daily_life.anim.glb`, `fox_v2_g3_challenge_social.anim.glb`, `fox_v2_i_voice_assistant.anim.glb`, plus 20 H1+H2 cosmetic GLBs
- **Runtime SDK & Built Harness:** `07_WEB_PREVIEW/companion_sandbox_i/` (React 18 + Three.js r170, `dist/` prebuilt, `node_modules/` excluded)
- **Previews & Validation:** `04_ANIMATIONS/i_voice_assistant/previews/fox_i_voice_to_task_sequence.mp4`, `renders/fox_i_voice_contact_sheet.png`, `08_VALIDATION/gate_i_validation_report.md`, `08_VALIDATION/runtime_i/`
- **Contracts & Docs:** `09_DOCS/FOX_RUNTIME_CONTRACT_V2.md`, `FOX_G2_EVENT_CONTRACT.md`, `FOX_G3_EVENT_CONTRACT.md`, `FOX_H1_COSMETIC_CONTRACT.md`, `FOX_H2_OUTFIT_LIBRARY.md`, `FOX_I_VOICE_EVENT_CONTRACT.md`, `COMPANION_INTEGRATION_GUIDE.md`, `THIRD_PARTY_HANDOFF_GUIDE.md`, `KNOWN_LIMITATIONS_GATE_I.md`

Full SHA-256 verification list: `09_DOCS/GATE_I_FINAL_SHA256SUMS.txt`.
