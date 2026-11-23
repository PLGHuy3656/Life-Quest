"""Gate I — Final Production Packaging & Integrity Verification.

Builds LifeQuest_Fox_V2_GateI_Final.zip with all approved E2–H2 + Gate I production assets,
generates 09_DOCS/GATE_I_FINAL_SHA256SUMS.txt and 09_DOCS/GATE_I_FINAL_MANIFEST.md,
then extracts the archive to a clean temp folder and verifies 100% of SHA-256 checksums.
"""
import hashlib
import os
import shutil
import tempfile
import zipfile

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
PARENT = os.path.dirname(ROOT)
ZIP_PATH = os.path.join(PARENT, 'LifeQuest_Fox_V2_GateI_Final.zip')
DOCS = os.path.join(ROOT, '09_DOCS')


def sha256(path):
    h = hashlib.sha256()
    with open(path, 'rb') as f:
        for chunk in iter(lambda: f.read(1 << 20), b''):
            h.update(chunk)
    return h.hexdigest()


EXACT_FILES = [
    'README.md',
    '02_MODEL/fox_master.blend',
    '03_RIG/fox_rig_d1_1.blend',
    '03_RIG/skeleton_spec.json',
    '03_RIG/attachment_points.json',
    '03_RIG/face_morph_map.json',
    '04_ANIMATIONS/fox_anim_e2.blend',
    '04_ANIMATIONS/anim_spec_e2.json',
    '04_ANIMATIONS/idle_variation_e2.json',
    '04_ANIMATIONS/g1_1_cinematic_polish/fox_anim_g1_1.blend',
    '04_ANIMATIONS/g1_1_cinematic_polish/anim_spec_g1_1.json',
    '04_ANIMATIONS/g2_1_deformation_polish/fox_anim_g2_1.blend',
    '04_ANIMATIONS/g2_1_deformation_polish/anim_spec_g2_1.json',
    '04_ANIMATIONS/g3_challenge_social/fox_anim_g3.blend',
    '04_ANIMATIONS/g3_challenge_social/anim_spec_g3.json',
    '05_COSMETICS/h1_prototypes/fox_cosmetics_h1.blend',
    '05_COSMETICS/h1_prototypes/cosmetic_catalog_h1.json',
    '05_COSMETICS/h2_outfits/fox_cosmetics_h2.blend',
    '05_COSMETICS/h2_outfits/cosmetic_catalog_h2.json',
    '06_EXPORTS/glb/fox_v2_anim_e2.glb',
    '08_VALIDATION/cosmetics_h2/cosmetic_compatibility_report_h2.md',
    '08_VALIDATION/gate_f_runtime_report.md',
    '08_VALIDATION/gate_g1_1_runtime_report.md',
    '08_VALIDATION/gate_g2_1_runtime_report.md',
    '08_VALIDATION/gate_g3_runtime_report.md',
    '08_VALIDATION/gate_h1_validation_report.md',
    '08_VALIDATION/gate_h2_validation_report.md',
    '08_VALIDATION/gate_i_validation_report.md',
]

DIR_TREES = [
    '04_ANIMATIONS/i_voice_assistant',
    '06_EXPORTS/glb/cosmetics',
    '07_WEB_PREVIEW/companion_sandbox_i',
    '08_VALIDATION/runtime_i',
    '08_VALIDATION/scripts',
    '09_DOCS',
]

ACTIVE_MODULE_PREFIXES = (
    'fox_v2_g1_1_',
    'fox_v2_g2_1_',
    'fox_v2_g3_',
    'fox_v2_i_',
)


def collect_files():
    rels = set()
    for rel in EXACT_FILES:
        full = os.path.join(ROOT, rel)
        if os.path.isfile(full):
            rels.add(rel)
        else:
            raise FileNotFoundError(f'Missing required production file: {rel}')

    mod_dir = os.path.join(ROOT, '06_EXPORTS', 'glb', 'modules')
    for fn in sorted(os.listdir(mod_dir)):
        if fn.startswith(ACTIVE_MODULE_PREFIXES) and os.path.isfile(os.path.join(mod_dir, fn)):
            rels.add(f'06_EXPORTS/glb/modules/{fn}')

    for tree in DIR_TREES:
        base = os.path.join(ROOT, tree)
        for dp, dns, fns in os.walk(base):
            dns[:] = [d for d in sorted(dns) if d not in ('node_modules', '__pycache__', '.git') and not d.startswith('regress_')]
            for fn in sorted(fns):
                full = os.path.join(dp, fn)
                rel = os.path.relpath(full, ROOT).replace('\\', '/')
                if rel in ('09_DOCS/GATE_I_FINAL_SHA256SUMS.txt', '09_DOCS/GATE_I_FINAL_MANIFEST.md'):
                    continue
                rels.add(rel)

    return sorted(rels)


def main():
    rels = collect_files()
    entries = [(rel, os.path.getsize(os.path.join(ROOT, rel)), sha256(os.path.join(ROOT, rel))) for rel in rels]

    sums_rel = '09_DOCS/GATE_I_FINAL_SHA256SUMS.txt'
    sums_path = os.path.join(ROOT, sums_rel)
    with open(sums_path, 'w', encoding='utf-8') as f:
        for rel, _, h in entries:
            f.write(f'{h}  {rel}\n')

    # Category counts for manifest
    cats = {}
    for rel, sz, _ in entries:
        top = rel.split('/')[0]
        c, b = cats.get(top, (0, 0))
        cats[top] = (c + 1, b + sz)

    manifest_rel = '09_DOCS/GATE_I_FINAL_MANIFEST.md'
    manifest_path = os.path.join(ROOT, manifest_rel)
    lines = [
        '# LifeQuest Fox V2 — Gate I Final Production Manifest',
        '',
        f'Total hashed production files: **{len(entries)}** (plus this manifest and `GATE_I_FINAL_SHA256SUMS.txt`).',
        'Archive: `LifeQuest_Fox_V2_GateI_Final.zip`',
        '',
        '## Summary by Folder',
        '',
        '| Folder | Files | Total Bytes |',
        '|---|---:|---:|',
    ]
    for k in sorted(cats):
        c, b = cats[k]
        lines.append(f'| `{k}` | {c} | {b:,} |')
    lines.extend([
        '',
        '## Key Production Assets',
        '',
        '- **Model & Canonical Rig:** `02_MODEL/fox_master.blend`, `03_RIG/fox_rig_d1_1.blend` (+ skeleton/attachment/morph specs)',
        '- **Animation Sources (58 clips total):** `fox_anim_e2.blend` (7), `fox_anim_g1_1.blend` (9), `fox_anim_g2_1.blend` (16), `fox_anim_g3.blend` (18), `fox_anim_i.blend` (8)',
        '- **Exported GLBs:** `fox_v2_anim_e2.glb`, `fox_v2_g1_1_quest_reward_streak.anim.glb`, `fox_v2_g2_1_daily_life.anim.glb`, `fox_v2_g3_challenge_social.anim.glb`, `fox_v2_i_voice_assistant.anim.glb`, plus 20 H1+H2 cosmetic GLBs',
        '- **Runtime SDK & Built Harness:** `07_WEB_PREVIEW/companion_sandbox_i/` (React 18 + Three.js r170, `dist/` prebuilt, `node_modules/` excluded)',
        '- **Previews & Validation:** `04_ANIMATIONS/i_voice_assistant/previews/fox_i_voice_to_task_sequence.mp4`, `renders/fox_i_voice_contact_sheet.png`, `08_VALIDATION/gate_i_validation_report.md`, `08_VALIDATION/runtime_i/`',
        '- **Contracts & Docs:** `09_DOCS/FOX_RUNTIME_CONTRACT_V2.md`, `FOX_G2_EVENT_CONTRACT.md`, `FOX_G3_EVENT_CONTRACT.md`, `FOX_H1_COSMETIC_CONTRACT.md`, `FOX_H2_OUTFIT_LIBRARY.md`, `FOX_I_VOICE_EVENT_CONTRACT.md`, `COMPANION_INTEGRATION_GUIDE.md`, `THIRD_PARTY_HANDOFF_GUIDE.md`, `KNOWN_LIMITATIONS_GATE_I.md`',
        '',
        'Full SHA-256 verification list: `09_DOCS/GATE_I_FINAL_SHA256SUMS.txt`.',
    ])
    with open(manifest_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')

    all_to_zip = rels + [sums_rel, manifest_rel]
    with zipfile.ZipFile(ZIP_PATH, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as zf:
        for rel in all_to_zip:
            zf.write(os.path.join(ROOT, rel), 'LifeQuest_Fox_V2/' + rel)

    zip_bytes = os.path.getsize(ZIP_PATH)
    zip_sha = sha256(ZIP_PATH)
    print(f'PACKAGED: {ZIP_PATH}')
    print(f'ZIP_BYTES: {zip_bytes}')
    print(f'ZIP_SHA256: {zip_sha}')
    print(f'TOTAL_FILES: {len(all_to_zip)} ({len(entries)} hashed + 2 manifest/checksums)')

    # Clean extraction + 100% SHA-256 verification
    tmp = tempfile.mkdtemp(prefix='fox_i_verify_')
    try:
        with zipfile.ZipFile(ZIP_PATH, 'r') as zf:
            zf.extractall(tmp)
        ext_root = os.path.join(tmp, 'LifeQuest_Fox_V2')
        ok_count = 0
        mismatches = []
        with open(os.path.join(ext_root, sums_rel), encoding='utf-8') as f:
            for line in f:
                line = line.strip()
                if not line:
                    continue
                expected_h, rel = line.split('  ', 1)
                p = os.path.join(ext_root, rel)
                if not os.path.isfile(p):
                    mismatches.append((rel, 'MISSING'))
                    continue
                got_h = sha256(p)
                if got_h != expected_h:
                    mismatches.append((rel, f'{got_h} != {expected_h}'))
                else:
                    ok_count += 1
        print(f'VERIFY_EXTRACT: {ok_count}/{len(entries)} OK, mismatches={len(mismatches)}')
        if mismatches:
            raise SystemExit(f'Checksum verification FAILED: {mismatches[:5]}')
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == '__main__':
    main()
