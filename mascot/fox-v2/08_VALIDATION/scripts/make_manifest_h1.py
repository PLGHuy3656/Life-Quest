"""Gate H1 — asset manifest: every file added by H1 (path, bytes, SHA-256, role), from the G3 baseline difference.

Usage (from LifeQuest_Fox_V2/): python 08_VALIDATION/scripts/make_manifest_h1.py <baseline_sha256_list>
Writes 09_DOCS/H1_ASSET_MANIFEST.md
"""
import hashlib, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
base = {l.split(None, 1)[1].strip()[2:] for l in open(sys.argv[1]) if l.strip()}
ROLE = [('05_COSMETICS/h1_prototypes/fox_cosmetics_h1.blend', 'authoring blend (canonical rig + the 8 skinned cosmetic meshes; the rig is not modified)'),
        ('05_COSMETICS/h1_prototypes/cosmetic_catalog_h1.json', 'build catalogue: slot, socket, skin joints, hidden defaults, bounds, triangle counts'),
        ('06_EXPORTS/glb/cosmetics/cosmetic_reference_h1.json', 'Blender ground truth for the runtime attachment test'),
        ('06_EXPORTS/glb/cosmetics/', 'cosmetic item GLB (one skinned mesh on the canonical armature)'),
        ('07_WEB_PREVIEW/companion_sandbox_h1/src/mascot/cosmetics/', 'cosmetic slot contract + runtime manager'),
        ('07_WEB_PREVIEW/companion_sandbox_h1/src/pages/', 'technical harness (#/h1) and in-page tests'),
        ('07_WEB_PREVIEW/companion_sandbox_h1/dist/', 'built sandbox'), ('07_WEB_PREVIEW/companion_sandbox_h1/', 'H1 sandbox source'),
        ('08_VALIDATION/cosmetics_h1/', 'cosmetic × animation compatibility matrix (Blender)'),
        ('08_VALIDATION/runtime_h1/', 'validation output'), ('08_VALIDATION/scripts/', 'H1 pipeline / QA script'),
        ('08_VALIDATION/', 'report'), ('09_DOCS/', 'documentation')]
rows = []
for dp, dn, fn in os.walk(ROOT):
    dn[:] = [d for d in dn if d not in ('node_modules', '__pycache__')]
    for f in fn:
        rel = os.path.relpath(os.path.join(dp, f), ROOT).replace(os.sep, '/')
        if rel in base or rel.endswith('H1_ASSET_MANIFEST.md') or rel.endswith('GATE_H1_SHA256SUMS.txt') or rel == '09_DOCS/CLEANUP_LOG.md':
            continue
        b = open(os.path.join(ROOT, rel), 'rb').read()
        role = next((r for p, r in ROLE if rel.startswith(p)), '')
        rows.append((rel, len(b), hashlib.sha256(b).hexdigest(), role))
rows.sort()
key = [r for r in rows if not r[0].startswith('07_WEB_PREVIEW/companion_sandbox_h1/dist/') and not r[0].startswith('08_VALIDATION/runtime_h1/regress_')]
L = ['# Gate H1 — asset manifest', '', f'Files added by Gate H1: **{len(rows)}** (difference from the verified G3 package baseline; no baseline file is modified).',
     'Built sandbox files (`companion_sandbox_h1/dist/`) and redirected regression outputs (`runtime_h1/regress_*`) are counted but listed only in',
     '`09_DOCS/GATE_H1_SHA256SUMS.txt`.', '', '| File | Bytes | SHA-256 (first 16) | Role |', '|---|---|---|---|']
L += [f'| `{r[0]}` | {r[1]} | `{r[2][:16]}` | {r[3]} |' for r in key]
open(os.path.join(ROOT, '09_DOCS', 'H1_ASSET_MANIFEST.md'), 'w').write('\n'.join(L) + '\n')
print(len(rows), 'files,', len(key), 'listed')
