"""Gate H2 — asset manifest: every file added or changed since the H1 package (path, bytes, SHA-256, role).

Usage (from LifeQuest_Fox_V2/): python 08_VALIDATION/scripts/make_manifest_h2.py <baseline_sha256_list>
Writes 09_DOCS/H2_ASSET_MANIFEST.md
"""
import hashlib, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
base = {l.split(None, 1)[1].strip()[2:]: l.split()[0] for l in open(sys.argv[1]) if l.strip()}   # path → sha256 of the H1 package
ROLE = [('05_COSMETICS/h2_outfits/fox_cosmetics_h2.blend', 'authoring blend (canonical rig + the 12 new skinned items; the rig is not modified)'),
        ('05_COSMETICS/h2_outfits/cosmetic_catalog_h2.json', 'build catalogue of the 12 new items'),
        ('06_EXPORTS/glb/cosmetics/cosmetic_reference_h2.json', 'Blender ground truth for the runtime attachment test'),
        ('06_EXPORTS/glb/cosmetics/', 'cosmetic item GLB (one skinned mesh on the canonical armature)'),
        ('07_WEB_PREVIEW/companion_sandbox_h2/src/mascot/cosmetics/', 'cosmetic contract (+ outfit library) and runtime manager'),
        ('07_WEB_PREVIEW/companion_sandbox_h2/src/pages/', 'technical harness (#/h1 with outfit presets) and in-page tests'),
        ('07_WEB_PREVIEW/companion_sandbox_h2/dist/', 'built sandbox'), ('07_WEB_PREVIEW/companion_sandbox_h2/', 'H2 sandbox source'),
        ('08_VALIDATION/cosmetics_h2/', 'cosmetic compatibility (Blender)'), ('08_VALIDATION/runtime_h2/', 'validation output'),
        ('08_VALIDATION/portability/', 'portability assessment evidence (accepted with H1)'), ('08_VALIDATION/scripts/', 'pipeline / QA script'),
        ('08_VALIDATION/', 'report'), ('09_DOCS/', 'documentation'), ('README.md', 'root README (rewritten for H1 / H2)')]
rows = []
for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in ('node_modules', '__pycache__')]
    for f in fn:
        rel = os.path.relpath(os.path.join(dp, f), ROOT).replace(os.sep, '/')
        if rel.endswith('H2_ASSET_MANIFEST.md') or rel.endswith('GATE_H2_SHA256SUMS.txt') or rel == '09_DOCS/CLEANUP_LOG.md':
            continue
        b = open(os.path.join(ROOT, rel), 'rb').read()
        if base.get(rel) == hashlib.sha256(b).hexdigest():
            continue                                      # unchanged H1 file
        role = next((r for p, r in ROLE if rel.startswith(p)), '') + (' — CHANGED (was in the H1 package)' if rel in base else '')
        rows.append((rel, len(b), hashlib.sha256(b).hexdigest(), role))
rows.sort()
key = [r for r in rows if not r[0].startswith('07_WEB_PREVIEW/companion_sandbox_h2/dist/') and not r[0].startswith('08_VALIDATION/runtime_h2/regress_')]
L = ['# Gate H2 — asset manifest', '', f'Files added or changed by Gate H2: **{len(rows)}** (difference from the verified H1 package; changed baseline files are marked).',
     'Built sandbox files (`companion_sandbox_h2/dist/`) and redirected regression outputs (`runtime_h2/regress_*`) are counted but listed only in',
     '`09_DOCS/GATE_H2_SHA256SUMS.txt`.', '', '| File | Bytes | SHA-256 (first 16) | Role |', '|---|---|---|---|']
L += [f'| `{r[0]}` | {r[1]} | `{r[2][:16]}` | {r[3]} |' for r in key]
open(os.path.join(ROOT, '09_DOCS', 'H2_ASSET_MANIFEST.md'), 'w').write('\n'.join(L) + '\n')
print(len(rows), 'files,', len(key), 'listed')
