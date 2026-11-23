"""Gate G3 — asset manifest: every file added by G3 (path, bytes, SHA-256, role), from the G2.1 baseline difference.

Usage (from LifeQuest_Fox_V2/): python 08_VALIDATION/scripts/make_manifest_g3.py <baseline_sha256_list>
Writes 09_DOCS/G3_ASSET_MANIFEST.md
"""
import hashlib, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
base = {l.split(None, 1)[1].strip()[2:] for l in open(sys.argv[1]) if l.strip()}
ROLE = [('04_ANIMATIONS/g3_challenge_social/fox_anim_g3.blend', 'authoring blend (canonical rig + 18 G3 actions)'),
        ('04_ANIMATIONS/g3_challenge_social/anim_spec_g3.json', 'clip contract: events, cues, contact data, prop anchors, resolver log'),
        ('04_ANIMATIONS/g3_challenge_social/anim_metrics_g3.json', 'deformation metrics (runtime cage)'),
        ('04_ANIMATIONS/g3_challenge_social/previews/', 'runtime preview video'), ('04_ANIMATIONS/g3_challenge_social/renders/', 'runtime key-frame sheet'),
        ('04_ANIMATIONS/g3_challenge_social/tests/', 'duo / group test evidence'),
        ('06_EXPORTS/glb/modules/fox_v2_g3_challenge_social.anim.glb', 'G3 animation-only GLB module (binds to the E2 Fox)'),
        ('06_EXPORTS/glb/modules/', 'module manifest / reference poses / glTF FK poses'),
        ('07_WEB_PREVIEW/companion_sandbox_g3/src/mascot/choreography/', 'multi-mascot choreography layer'),
        ('07_WEB_PREVIEW/companion_sandbox_g3/src/mascot/effects/fxLibraryG3.ts', 'reusable G3 props and VFX'),
        ('07_WEB_PREVIEW/companion_sandbox_g3/src/mascot/FoxEventMap.ts', 'typed event registry (17 G3 events)'),
        ('07_WEB_PREVIEW/companion_sandbox_g3/src/pages/', 'technical harness (#/g3) and in-page tests'),
        ('07_WEB_PREVIEW/companion_sandbox_g3/dist/', 'built sandbox'), ('07_WEB_PREVIEW/companion_sandbox_g3/', 'G3 sandbox source'),
        ('08_VALIDATION/runtime_g3/', 'validation output'), ('08_VALIDATION/scripts/', 'G3 pipeline / QA script'),
        ('08_VALIDATION/', 'report'), ('09_DOCS/', 'documentation')]
rows = []
for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in ('node_modules', '__pycache__')]
    for f in fn:
        rel = os.path.relpath(os.path.join(dp, f), ROOT).replace(os.sep, '/')
        if rel in base or rel.endswith('G3_ASSET_MANIFEST.md') or rel.endswith('GATE_G3_SHA256SUMS.txt') or rel == '09_DOCS/CLEANUP_LOG.md':
            continue
        b = open(os.path.join(ROOT, rel), 'rb').read()
        role = next((r for p, r in ROLE if rel.startswith(p)), '')
        rows.append((rel, len(b), hashlib.sha256(b).hexdigest(), role))
rows.sort()
key = [r for r in rows if not r[0].startswith('07_WEB_PREVIEW/companion_sandbox_g3/dist/') and not r[0].startswith('08_VALIDATION/runtime_g3/regress_')]
L = ['# Gate G3 — asset manifest', '', f'Files added by Gate G3: **{len(rows)}** (difference from the verified G2.1 baseline of CP-G2; no baseline file is modified).',
     'Built sandbox files (`companion_sandbox_g3/dist/`) and redirected regression outputs (`runtime_g3/regress_*`) are counted but listed only in',
     '`09_DOCS/GATE_G3_SHA256SUMS.txt`.', '', '| File | Bytes | SHA-256 (first 16) | Role |', '|---|---|---|---|']
L += [f'| `{r[0]}` | {r[1]} | `{r[2][:16]}` | {r[3]} |' for r in key]
open(os.path.join(ROOT, '09_DOCS', 'G3_ASSET_MANIFEST.md'), 'w').write('\n'.join(L) + '\n')
print(len(rows), 'files,', len(key), 'listed')
