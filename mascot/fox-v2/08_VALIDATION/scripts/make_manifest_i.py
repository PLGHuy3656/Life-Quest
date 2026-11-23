"""Gate I — generate 09_DOCS/I_ASSET_MANIFEST.md and 09_DOCS/GATE_I_SHA256SUMS.txt.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/make_manifest_i.py
"""
import hashlib
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
DOCS = os.path.join(ROOT, '09_DOCS')

INCLUDE_PREFIXES = (
    '04_ANIMATIONS/i_voice_assistant/',
    '06_EXPORTS/glb/modules/fox_v2_i_',
    '07_WEB_PREVIEW/companion_sandbox_i/',
    '08_VALIDATION/runtime_i/',
    '08_VALIDATION/scripts/anim_i.py',
    '08_VALIDATION/scripts/export_glb_i.py',
    '08_VALIDATION/scripts/gltf_pose_fidelity_i.py',
    '08_VALIDATION/scripts/cosmetics_matrix_i.py',
    '08_VALIDATION/scripts/browser_i_test.py',
    '08_VALIDATION/scripts/capture_i_previews.py',
    '08_VALIDATION/scripts/regress_i.py',
    '08_VALIDATION/scripts/make_manifest_i.py',
    '08_VALIDATION/gate_i_validation_report.md',
    '09_DOCS/FOX_I_VOICE_EVENT_CONTRACT.md',
    '09_DOCS/BUILD_I.md',
)

SKIP_PARTS = ('node_modules', '/regress_', '\\regress_', '__pycache__')


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


def main():
    files = []
    for dirpath, dirnames, filenames in os.walk(ROOT):
        dirnames[:] = [d for d in sorted(dirnames) if d not in ('node_modules', '__pycache__', '.git')]
        for fn in sorted(filenames):
            full = os.path.join(dirpath, fn)
            rel = os.path.relpath(full, ROOT).replace('\\', '/')
            if any(rel.startswith(p) for p in INCLUDE_PREFIXES) and not any(s in rel for s in SKIP_PARTS):
                files.append((rel, os.path.getsize(full), sha256(full)))

    sums_path = os.path.join(DOCS, 'GATE_I_SHA256SUMS.txt')
    with open(sums_path, 'w', encoding='utf-8') as f:
        for rel, _, h in files:
            f.write(f'{h}  {rel}\n')

    manifest_path = os.path.join(DOCS, 'I_ASSET_MANIFEST.md')
    lines = [
        '# Gate I — Asset Manifest (Voice Assistant Animations + Production Finalization)',
        '',
        f'Files added by Gate I (excluding `node_modules` and redirected regression outputs): **{len(files)}**.',
        'Full checksums: `09_DOCS/GATE_I_SHA256SUMS.txt`.',
        '',
        '| File | Bytes | SHA-256 (first 16) |',
        '|---|---|---|',
    ]
    for rel, sz, h in files:
        if '/dist/' in rel:
            continue
        lines.append(f'| `{rel}` | {sz} | `{h[:16]}` |')
    with open(manifest_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    print(f'Wrote {manifest_path} and {sums_path} ({len(files)} files)')


if __name__ == '__main__':
    main()
