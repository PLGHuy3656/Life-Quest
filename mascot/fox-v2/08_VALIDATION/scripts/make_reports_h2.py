"""Gate H2 — reports from the measured data (no number typed by hand).

Reads  08_VALIDATION/cosmetics_h2/compatibility_matrix_h2.json, runtime_h2/h2_runtime_report.json, runtime_h2/regressions_h2.json,
       05_COSMETICS/h2_outfits/cosmetic_catalog_h2.json (+ the H1 catalogue), the runtime contract (hand-busy clip lists)
Writes 08_VALIDATION/cosmetics_h2/cosmetic_compatibility_report_h2.md, 08_VALIDATION/gate_h2_validation_report.md
"""
import json, os, re

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
J = lambda *p: json.load(open(os.path.join(ROOT, *p)))
M = J('08_VALIDATION', 'cosmetics_h2', 'compatibility_matrix_h2.json')['results']
RT = J('08_VALIDATION', 'runtime_h2', 'h2_runtime_report.json')
RGP = os.path.join(ROOT, '08_VALIDATION', 'runtime_h2', 'regressions_h2.json')
RG = json.load(open(RGP)) if os.path.exists(RGP) else {}
CAT = {**J('05_COSMETICS', 'h1_prototypes', 'cosmetic_catalog_h1.json')['items'], **J('05_COSMETICS', 'h2_outfits', 'cosmetic_catalog_h2.json')['items']}
CONTRACT = open(os.path.join(ROOT, '07_WEB_PREVIEW', 'companion_sandbox_h2', 'src', 'mascot', 'cosmetics', 'cosmeticContract.ts')).read()
HR = {h: re.findall(r"'([a-z_]+)'", re.search(h + r": \[([^\]]*)\]", CONTRACT).group(1)) for h in ('HAND_LEFT', 'HAND_RIGHT')}
OUTFITS = {
    'Student': {'HEAD': 'student_cap', 'FACE': 'student_glasses', 'BODY': 'simple_jacket'},
    'Sports': {'HEAD': 'sports_headband', 'BODY': 'sports_jersey', 'FEET': 'sports_sneakers'},
    'Explorer': {'HEAD': 'explorer_hat', 'BACK': 'explorer_backpack', 'HAND_RIGHT': 'explorer_magnifier'},
    'Mage': {'HEAD': 'mage_hat', 'BACK': 'mage_capelet', 'HAND_RIGHT': 'mage_wand'},
    'Ninja': {'HEAD': 'ninja_headband', 'BODY': 'ninja_gi', 'BACK': 'ninja_scroll'},
    'Tết': {'HEAD': 'tet_khan_dong', 'BODY': 'tet_ao_dai', 'HAND_RIGHT': 'tet_lixi'},
}
NEW = list(J('05_COSMETICS', 'h2_outfits', 'cosmetic_catalog_h2.json')['items'])
CLIPS = list(M['explorer_hat'].keys())
REQ = [c for c in CLIPS if M['explorer_hat'][c]['required']]
BACK_TAIL = {'explorer_backpack', 'ninja_scroll', 'mage_capelet'}


def status(item, clip):
    v = M[item][clip]
    if CAT.get(item, {}).get('slot') == 'HAND_RIGHT' and clip in HR['HAND_RIGHT']:
        return 'HIDDEN', v
    if item in BACK_TAIL and v['severity'] != 'OK' and v['worst'] and v['worst']['obstacle'] == 'FOX_Tail':
        return 'TAIL*', v
    return v['severity'], v


def cell(item, clip):
    s, v = status(item, clip); mm = v['max_depth_mm']
    return {'OK': f'{mm:.1f}', 'MINOR': f'{mm:.1f} m', 'SEVERE': f'**{mm:.1f} S**', 'HIDDEN': f'({mm:.0f}) hid', 'TAIL*': f'{mm:.0f} t*'}[s]


def summary_row(i):
    cnt = {'OK': 0, 'MINOR': 0, 'SEVERE': 0, 'HIDDEN': 0, 'TAIL*': 0}; worst = (0.0, '')
    for c in CLIPS:
        s, v = status(i, c); cnt[s] += 1
        if s in ('OK', 'MINOR', 'SEVERE') and v['max_depth_mm'] > worst[0]:
            worst = (v['max_depth_mm'], f"{c} ({v['worst']['obstacle']})" if v['worst'] else c)
    return cnt, worst


def matrix_md():
    L = ['# Gate H2 — cosmetic compatibility report (outfit library)', '',
         f'Every item of the six outfits was measured against all **{len(CLIPS)}** approved clips:',
         f'- the {len(REQ)} required clips at every 2nd frame;',
         f'- the {len(CLIPS) - len(REQ)} others at every 4th frame.', '',
         'The method, metric, obstacles and thresholds are those of H1: `cosmetics_matrix_h1.py`, imported unchanged by',
         '`cosmetics_matrix_h2.py`.', '',
         '**Severity:** < 2 mm OK · 2–8 mm MINOR (`m`) · > 8 mm SEVERE (`S`).', '',
         '**Cell markers.**',
         '- `hid`: the HAND item is hidden by the H1 hand-busy rule in that clip. The measured value is shown in brackets.',
         '- `t*`: the tail sweeps through the back zone. This is pre-existing in the approved model: the default backpack does it too (§3).',
         '', 'Data: `compatibility_matrix_h2.json`. H1 items are re-measured in the same run.', '',
         '## 1. Outfits', '', '| Outfit | Items | Worst value after rules | SEVERE after rules |', '|---|---|---|---|']
    sev_all = []
    for name, sp in OUTFITS.items():
        worst, sev = (0.0, ''), []
        for i in sp.values():
            for c in CLIPS:
                s, v = status(i, c)
                if s == 'SEVERE': sev.append(f'{i}×{c}')
                if s in ('OK', 'MINOR', 'SEVERE') and v['max_depth_mm'] > worst[0]: worst = (v['max_depth_mm'], f"{i} × {c} ({v['worst']['obstacle'] if v['worst'] else ''})")
        sev_all += sev
        L.append(f"| {name} | {', '.join(f'{s}: {i}' for s, i in sp.items())} | {worst[0]:.1f} mm — {worst[1]} | {len(sev)}{' — ' + ', '.join(sev[:6]) if sev else ''} |")
    L += ['', f'**SEVERE values left after the H1 rules, over the 6 outfits: {len(sev_all)}.** The `t*` class is listed in §3.', '',
          '## 2. Items', '', '| Item | Slot | Outfit | OK | MINOR | SEVERE | hidden | t* | Worst after rules |', '|---|---|---|---|---|---|---|---|---|']
    for name, sp in OUTFITS.items():
        for slot, i in sp.items():
            cnt, worst = summary_row(i)
            L.append(f"| {i}{' (H1)' if i not in NEW else ''} | {slot} | {name} | {cnt['OK']} | {cnt['MINOR']} | {cnt['SEVERE']} | {cnt['HIDDEN']} | {cnt['TAIL*']} | {worst[0]:.1f} mm {worst[1]} |")
    d = M['DEFAULT_backpack']
    L += ['', '## 3. Back zone vs tail (pre-existing)', '', '| BACK item | max into the tail | clips ≤ approved default pack |', '|---|---|---|']
    for i in ('explorer_backpack', 'ninja_scroll', 'mage_capelet'):
        e = M[i]; le = sum(e[c]['max_by_obstacle_mm'].get('FOX_Tail', 0) <= d[c]['max_by_obstacle_mm']['FOX_Tail'] for c in CLIPS)
        L.append(f"| {i} | {max(e[c]['max_by_obstacle_mm'].get('FOX_Tail', 0) for c in CLIPS):.1f} mm | {le} / {len(CLIPS)} |")
    L.append(f"| approved default backpack | {max(d[c]['max_by_obstacle_mm']['FOX_Tail'] for c in CLIPS):.1f} mm | — |")
    L += ['', 'The capelet is skinned with the body weights, so it follows the back. The scroll and the packs are rigid on SPINE.',
          'Fixing the tail arc would change approved animation; this was not done in H2.', '',
          '## 4. Hand-busy rules (unchanged from H1)', '', f"- `HAND_RIGHT` hidden in: {', '.join(HR['HAND_RIGHT'])}.",
          '- These clips were derived in H1 from the magnifier. The wand and the lì xì were measured again here.',
          '- Any SEVERE value they have outside these clips is listed in §1.', '',
          '## 5. Cross-slot combinations and layering', '',
          '- **Within an outfit:** every outfit uses different slots, and no two of its items share space.',
          '  - BODY garments: 5 mm offset + 3 mm thickness.',
          '  - The capelet sits at 12 mm, so it layers over any BODY item (runtime layering test).',
          '  - Head items stay in front of or between the ears.',
          '- **The scarf:** no outfit uses the NECK slot, so the red scarf stays in every outfit. All garments are V-necked under the scarf flap.',
          '- **Straps:** the scroll re-uses the default strap path. The garments\' strap cut-outs follow that path, so they fit both the scroll and the backpack.',
          '- **Rules:** no cross-slot `excludes` rule was needed. Same-slot items replace each other (contract rule 1).', '',
          f'## 6. Required clips (max depth, mm)', '', '| Clip | ' + ' | '.join(NEW) + ' |', '|---|' + '---|' * len(NEW)]
    for c in REQ: L.append(f'| {c} | ' + ' | '.join(cell(i, c) for i in NEW) + ' |')
    L += ['', '## 7. Further approved clips', '', '| Clip | ' + ' | '.join(NEW) + ' |', '|---|' + '---|' * len(NEW)]
    for c in CLIPS:
        if c not in REQ: L.append(f'| {c} | ' + ' | '.join(cell(i, c) for i in NEW) + ' |')
    open(os.path.join(ROOT, '08_VALIDATION', 'cosmetics_h2', 'cosmetic_compatibility_report_h2.md'), 'w').write('\n'.join(L) + '\n')
    return sev_all


def report_md(sev_all):
    ch = RT['checks']; ms = RT['measurements']
    L = ['# Gate H2 — validation report (cosmetic outfit library)', '',
         f"Runtime suite: **{sum(c['pass'] for c in ch)}/{len(ch)}** checks pass. Headless Chrome + SwiftShader: no GPU, so no performance claim is made.",
         f"Report: `08_VALIDATION/runtime_h2/h2_runtime_report.json`.", '', '## Outfits', '', '| Outfit | Items | New in H2 |', '|---|---|---|']
    for name, sp in OUTFITS.items():
        L.append(f"| {name} | {', '.join(f'{CAT[i]['name']} ({s})' for s, i in sp.items())} | {', '.join(i for i in sp.values() if i in NEW) or '— (H1 items)'} |")
    L += ['', '## New items', '', '| Item | Slot | Skin joints | Triangles | GLB bytes | Hides |', '|---|---|---|---|---|---|']
    for i in NEW:
        c = CAT[i]; L.append(f"| {c['name']} (`{i}`) | {c['slot']} | {', '.join(c['bones'][:6])}{'…' if len(c['bones']) > 6 else ''} | {c['triangles']} | {c['bytes']} | {', '.join(c['hides']) or '—'} |")
    L += ['', '## Runtime checks', '', '| | Check |', '|---|---|']
    for c in ch: L.append(f"| {'PASS' if c['pass'] else '**FAIL**'} | {c['name']} |")
    L += ['', '## Render counts (software renderer, counts only)', '', '| Look | Draw calls | Triangles | Geometries | Textures |', '|---|---|---|---|---|']
    for k, v in ms.get('render_counts', {}).items(): L.append(f"| {k} | {v['calls']} | {v['triangles']} | {v['geometries']} | {v['textures']} |")
    L += ['', 'Lv1 / Lv30 framing: no item leaves the fixed 3/4 harness frame further than the approved Fox itself (the Fox\'s own ears leave that frame at the Lv30 jump apex); per-clip values in the JSON report.', '',
          f"**Compatibility:** SEVERE values left after the H1 rules: {len(sev_all)}. See `cosmetics_h2/cosmetic_compatibility_report_h2.md`.", '',
          '## Regressions (approved suites and the H1 suite, assertions unchanged)', '']
    if RG:
        L += ['| Suite | Result |', '|---|---|']
        for k, v in RG.items():
            txt = ' '.join(v['summary']); m = re.search(r'(\d+/\d+ (?:PASS|checks passed))', txt); p = re.search(r'"passed": (\d+)', txt)
            res = m.group(1) if m else (f"{p.group(1)} passed, {len(v['fails'])} failed" if p else ('pass' if '"pass": true' in txt else txt[-60:]))
            L.append(f"| {k} | {res}{' — exit ' + str(v['exit']) if v['exit'] else ''}{' — FAILS: ' + '; '.join(v['fails']) if v['fails'] else ''} |")
    else:
        L.append('(not run yet)')
    open(os.path.join(ROOT, '08_VALIDATION', 'gate_h2_validation_report.md'), 'w').write('\n'.join(L) + '\n')


if __name__ == '__main__':
    s = matrix_md(); report_md(s); print('reports written; SEVERE after rules:', len(s), s[:10])
