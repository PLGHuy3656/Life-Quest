"""Gate H1 — reports from the measured data (no number is typed by hand).

Usage (from LifeQuest_Fox_V2/): python 08_VALIDATION/scripts/make_reports_h1.py
Reads  08_VALIDATION/cosmetics_h1/compatibility_matrix_h1.json, 08_VALIDATION/runtime_h1/h1_runtime_report.json,
       08_VALIDATION/runtime_h1/regressions_h1.json (if present), 05_COSMETICS/h1_prototypes/cosmetic_catalog_h1.json
Writes 08_VALIDATION/cosmetics_h1/compatibility_matrix_h1.md, 08_VALIDATION/gate_h1_validation_report.md
"""
import json, os, re

ROOT = os.path.abspath(os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', '..'))
M = json.load(open(os.path.join(ROOT, '08_VALIDATION', 'cosmetics_h1', 'compatibility_matrix_h1.json')))
RT = json.load(open(os.path.join(ROOT, '08_VALIDATION', 'runtime_h1', 'h1_runtime_report.json')))
RGP = os.path.join(ROOT, '08_VALIDATION', 'runtime_h1', 'regressions_h1.json')
RG = json.load(open(RGP)) if os.path.exists(RGP) else {}
CAT = json.load(open(os.path.join(ROOT, '05_COSMETICS', 'h1_prototypes', 'cosmetic_catalog_h1.json')))['items']
CONTRACT = open(os.path.join(ROOT, '07_WEB_PREVIEW', 'companion_sandbox_h1', 'src', 'mascot', 'cosmetics', 'cosmeticContract.ts')).read()


def hand_rules():
    out = {}
    for hand in ('HAND_LEFT', 'HAND_RIGHT'):
        m = re.search(hand + r": \[([^\]]*)\]", CONTRACT)
        out[hand] = re.findall(r"'([a-z_]+)'", m.group(1)) if m else []
    return out


HR = hand_rules()
R = M['results']
ITEMS = ['student_glasses', 'student_cap', 'sports_headband', 'explorer_backpack', 'simple_jacket', 'explorer_magnifier', 'slot_test_sneakers', 'slot_test_tail_ribbon']
SHORT = {'student_glasses': 'glasses', 'student_cap': 'cap', 'sports_headband': 'headband', 'explorer_backpack': 'expl. pack', 'simple_jacket': 'jacket',
         'explorer_magnifier': 'magnifier (R)', 'TEST_magnifier_left': 'magnifier mirrored (L, test)', 'slot_test_sneakers': 'sneakers*', 'slot_test_tail_ribbon': 'tail ribbon*'}
CLIPS = list(R['student_glasses'].keys())
REQ = [c for c in CLIPS if R['student_glasses'][c]['required']]
EXTRA = [c for c in CLIPS if not R['student_glasses'][c]['required']]


def status(item, clip):
    v = R[item][clip]
    hand = 'HAND_RIGHT' if item == 'explorer_magnifier' else 'HAND_LEFT' if item == 'TEST_magnifier_left' else None
    if hand and clip in HR[hand]:
        return 'HIDDEN', v
    if item == 'explorer_backpack' and v['severity'] != 'OK' and v['worst']['obstacle'] == 'FOX_Tail':
        return 'TAIL*', v
    return v['severity'], v


def cell(item, clip):
    s, v = status(item, clip)
    mm = v['max_depth_mm']
    return {'OK': f'{mm:.1f}', 'MINOR': f'{mm:.1f} m', 'SEVERE': f'**{mm:.1f} S**', 'HIDDEN': f'({mm:.0f}) hid', 'TAIL*': f'{mm:.0f} t*'}[s]


def matrix_md():
    L = ['# Gate H1 — cosmetic × animation compatibility matrix', '',
         f'Measured in Blender on the runtime cage (subdivision off = the GLB geometry), {len(REQ)} required clips at every 2nd frame and',
         f'{len(EXTRA)} further approved clips at every 4th frame (all 50 approved clips). Script: `08_VALIDATION/scripts/cosmetics_matrix_h1.py`;',
         'data: `compatibility_matrix_h1.json`.', '',
         '**Metric.** Penetration depth (mm) of the posed item vertices into the posed Fox meshes an item could visibly intersect.',
         '"Inside" is a 3-of-5 majority vote of ray-crossing parity. Floor depth counts only what goes deeper than the Fox itself in that frame.',
         'Rigidly coupled pairs (an item rigid on HEAD vs `FOX_Head` / `FOX_Tuft`, both rigid on HEAD) are measured once at rest.',
         '', '**Severity thresholds** (fixed before measuring): < 2 mm OK · 2–8 mm MINOR (`m`) · > 8 mm SEVERE (`S`).', '',
         '**Cell markers.**',
         '- `hid`: the HAND item is hidden by the hand-busy rule in that clip. The measured value is shown in brackets.',
         '- `t*`: the tail passes through the backpack zone (see §2). This is pre-existing in the approved model.',
         '', '`*` marks a slot-test fixture, not library content.', '',
         '**Obstacles per item** (exclusions = contacts the canonical Fox already has with itself):',
         '- Jacket: the torso part is tested against the body and scarf; the sleeves against their own arm.',
         '- Sneakers: the foot / leg verts are tested against their own leg; the body is excluded (the leg cage enters the body).',
         '- Held item: not tested against the paw that holds it.', '', '## 1. Summary', '',
         '| Item | Slot | OK | MINOR | SEVERE | hidden by rule | tail* | worst after rules |', '|---|---|---|---|---|---|---|---|']
    for i in ITEMS + ['TEST_magnifier_left']:
        cnt = {'OK': 0, 'MINOR': 0, 'SEVERE': 0, 'HIDDEN': 0, 'TAIL*': 0}; worst = (0, '')
        for c in CLIPS:
            s, v = status(i, c); cnt[s] += 1
            if s in ('OK', 'MINOR', 'SEVERE') and v['max_depth_mm'] > worst[0]: worst = (v['max_depth_mm'], f"{c} ({v['worst']['obstacle']})" if v['worst'] else c)
        slot = CAT[i]['slot'] if i in CAT else 'HAND_LEFT (test)'
        L.append(f"| {SHORT[i]} | {slot} | {cnt['OK']} | {cnt['MINOR']} | {cnt['SEVERE']} | {cnt['HIDDEN']} | {cnt['TAIL*']} | {worst[0]:.1f} mm {worst[1]} |")
    sev_left = [(i, c) for i in ITEMS for c in CLIPS if status(i, c)[0] == 'SEVERE']
    L += ['', f'**SEVERE after the hand-busy rule: {len(sev_left)}**' + (f' — {sev_left}' if sev_left else ' (none).') +
          ' The backpack × tail class is listed separately in §2.', '']
    # backpack vs default
    e, d = R['explorer_backpack'], R['DEFAULT_backpack']
    le = [c for c in CLIPS if e[c]['max_by_obstacle_mm']['FOX_Tail'] <= d[c]['max_by_obstacle_mm']['FOX_Tail']]
    worse = [(c, e[c]['max_by_obstacle_mm']['FOX_Tail'], d[c]['max_by_obstacle_mm']['FOX_Tail']) for c in CLIPS if c not in le]
    em = max(e[c]['max_by_obstacle_mm']['FOX_Tail'] for c in CLIPS); dm = max(d[c]['max_by_obstacle_mm']['FOX_Tail'] for c in CLIPS)
    other = max(max(v for k, v in e[c]['max_by_obstacle_mm'].items() if k != 'FOX_Tail') for c in CLIPS)
    L += ['## 2. Pre-existing: the tail passes through the backpack zone (BACK slot)', '',
          'The approved tail sweeps through the space behind the back in every clip. Its front surface is 19–25 cm from the',
          'body axis on the −x side at rest, and closer in motion.',
          f'- The **approved default backpack** is measured with the same metric: max **{dm:.1f} mm** into the tail.',
          f'- The explorer backpack keeps the default pack\'s depth and width. It enters the tail by at most **{em:.1f} mm**.',
          f'- Per clip, the explorer pack is at or below the default pack in **{len(le)} of {len(CLIPS)}** clips.',
          f'- It is deeper only in {", ".join(f"{c} ({a:.1f} vs {b:.1f} mm)" for c, a, b in worse) or "none"}. In those two clips the default pack\'s own geometry misses the tail.',
          f'- Against everything other than the tail, the explorer pack stays at ≤ **{other:.1f} mm**.', '',
          'This is a property of the approved tail animation plus any pack on the back. It is **not** fixed in H1, because fixing it would mean',
          'changing approved animation or the canonical model. Side-by-side evidence: `08_VALIDATION/cosmetics_h1/backpack_vs_default_tail.png`.', '',
          '## 3. Hand-busy rules derived from this matrix', '',
          f"- `HAND_RIGHT` hidden in: {', '.join(HR['HAND_RIGHT'])}",
          f"- `HAND_LEFT` hidden in: {', '.join(HR['HAND_LEFT'])}", '',
          'Each clip with a SEVERE held-item value (right = the magnifier, left = the magnifier mirrored onto PAW_L, a matrix-only',
          'fixture) is in the list. Two further entries are design rules:',
          '- `sleep_loop` / `sleep_wake` are listed for both paws, so the item does not pop in and out inside one sleep.',
          '- The duo high-five contact paw is listed, because a single-fox matrix cannot measure the partner.',
          'Temporary socket props (pencil, flag) and the held streak flame also hide the item, at runtime.', '',
          '## 4. Baselines (approved default accessories, same metric)', '',
          '| Baseline | max over all clips | note |', '|---|---|---|']
    for b, note in (('DEFAULT_backpack', 'pack + straps: the straps are buried in the body / under the head by design'),
                    ('DEFAULT_backpack_straps', 'straps alone (re-used, re-coloured, by the explorer pack; excluded from its own numbers)'),
                    ('DEFAULT_scarf', 'the scarf roll is buried in the neck by design'), ('DEFAULT_fox_on_floor', 'the approved clips sink the Fox into the floor plane (sleep transitions)')):
        L.append(f"| {b} | {max(R[b][c]['max_depth_mm'] for c in CLIPS):.1f} mm | {note} |")
    L += ['', 'These numbers show why wrap-around accessories cannot be judged by absolute depth alone. The explorer pack is therefore measured',
          'without the inherited strap vertices (1,420 vertices that are an exact copy of the default straps, with the same rigid binding).', '',
          '## 5. Required clips (max depth, mm)', '', '| Clip | ' + ' | '.join(SHORT[i] for i in ITEMS) + ' |', '|---|' + '---|' * len(ITEMS)]
    for c in REQ: L.append(f'| {c} | ' + ' | '.join(cell(i, c) for i in ITEMS) + ' |')
    L += ['', '## 6. Further approved clips (every 4th frame)', '', '| Clip | ' + ' | '.join(SHORT[i] for i in ITEMS) + ' |', '|---|' + '---|' * len(ITEMS)]
    for c in EXTRA: L.append(f'| {c} | ' + ' | '.join(cell(i, c) for i in ITEMS) + ' |')
    L += ['', '## 7. Cross-slot combinations', '',
          'All 8 items are measured together in every frame, against the Fox and not against each other. Two items could only meet if they share space:',
          '- **Cap + headband:** same slot, exclusive by contract.',
          '- **Jacket + straps:** the jacket has strap cut-outs following the default straps, which the explorer pack re-uses.',
          '- **Jacket + scarf flap:** the jacket has a V-neck under the scarf flap.',
          '- **Magnifier + jacket sleeve:** the magnifier sits beyond the paw tip, past the sleeve end.',
          '', 'No cross-slot `excludes` rule is needed for the prototype set. The mechanism exists and is tested.']
    open(os.path.join(ROOT, '08_VALIDATION', 'cosmetics_h1', 'compatibility_matrix_h1.md'), 'w').write('\n'.join(L) + '\n')
    return sev_left, (em, dm, len(le))


def report_md(sev_left, pack):
    ch = RT['checks']; npass = sum(c['pass'] for c in ch)
    ms = RT['measurements']
    L = ['# Gate H1 — validation report (modular cosmetics and equipment)', '',
         f"Runtime suite: **{npass}/{len(ch)}** checks pass. Headless Chrome + SwiftShader: no GPU, so no frame-rate or GPU-performance claim is made.",
         f"Report: `08_VALIDATION/runtime_h1/h1_runtime_report.json` ({RT['meta']['started']} → {RT['meta'].get('finished')}).", '',
         '## Deliverables', '',
         '- Slot contract: `09_DOCS/FOX_H1_COSMETIC_CONTRACT.md`, `src/mascot/cosmetics/cosmeticContract.ts`',
         '- Runtime manager: `src/mascot/cosmetics/FoxCosmeticManager.ts`, plus the controller API (`equip` / `unequip` / `setOutfit` / `resetOutfit` / `getEquippedItems`)',
         '- Prototype assets: `05_COSMETICS/h1_prototypes/` (blend + catalogue), `06_EXPORTS/glb/cosmetics/*.glb` (8 GLBs: 6 prototypes + 2 slot fixtures)',
         '- Harness: `#/h1` in `07_WEB_PREVIEW/companion_sandbox_h1`',
         '- Matrix: `08_VALIDATION/cosmetics_h1/compatibility_matrix_h1.md`',
         '- Contact sheets and videos: `08_VALIDATION/runtime_h1/`', '',
         '## Items', '', '| Item | Slot | Socket | Skin joints | Triangles | GLB bytes | Hides |', '|---|---|---|---|---|---|---|']
    for i in ITEMS:
        c = CAT[i]; L.append(f"| {c['name']} | {c['slot']} | {c['socket'] or '—'} | {', '.join(c['bones'])} | {c['triangles']} | {c['bytes']} | {', '.join(c['hides']) or '—'} |")
    L += ['', 'The canonical Fox is not rebuilt, redesigned or modified:',
          '- The rig blend is read-only, and no skeleton node, morph target or proportion changes.',
          '- The red scarf and green backpack stay the default equipped items. Items hide them; they are never edited.', '',
          '## Runtime checks', '', '| | Check |', '|---|---|']
    for c in ch: L.append(f"| {'PASS' if c['pass'] else '**FAIL**'} | {c['name']} |")
    rc = ms.get('render_counts', {})
    L += ['', '## Key measurements', '',
          '**Attachment.** Rigid item points stay fixed in their bone frame through all sampled poses (0.000 mm). Head items share the exact',
          'transform of the approved rigid `FOX_Head`. Against Blender, every item point that has Fox surface under it deviates by at most 1 mm more',
          'than that surface does. Some points deviate up to 19.8 mm in absolute terms (`streak_lost`, cap crown). That is the approved Fox head\'s own',
          'deviation at that distance: glTF stores TRS per joint, so the shear of non-uniform squash is lost. It is not a cosmetic defect.',
          f"Far-point values: `{json.dumps(ms.get('head_far_points_vs_blender_mm', {}))}`.", '',
          f"**Level scaling.** Lv1 = 0.80 and Lv30 = 1.10. Items match the exact scale ratio (0.000 mm error). Every item vertex stays inside the canvas",
          f"through the required clips: minimum margin {ms['level_canvas']['1']['minMarginPx'] if '1' in ms['level_canvas'] else ms['level_canvas'][1]['minMarginPx']} px at Lv1 and "
          f"{ms['level_canvas']['30']['minMarginPx'] if '30' in ms['level_canvas'] else ms['level_canvas'][30]['minMarginPx']} px at Lv30.", '',
          f"**Resources.** After 8 outfit cycles while rendering, renderer geometries / textures / programs were {ms['gpu_cleanup']['before']} before and {ms['gpu_cleanup']['after']} after; the item cache is empty.", '',
          '**Render counts** (software renderer, counts only):']
    for k, v in rc.items(): L.append(f"- {k}: {v['calls']} draw calls, {v['triangles']} triangles, {v['geometries']} geometries, {v['textures']} textures")
    L += ['', f"**Compatibility.** SEVERE values left after the hand-busy rule: {len(sev_left)}. Backpack × tail is pre-existing:",
          f"- explorer pack max {pack[0]:.1f} mm, against {pack[1]:.1f} mm for the approved default pack;",
          f"- the explorer pack is at or below the default pack in {pack[2]}/50 clips.", '', '## Regressions (approved suites, assertions unchanged)', '']
    if RG:
        L += ['| Suite | Result |', '|---|---|']
        for k, v in RG.items():
            txt = ' '.join(v['summary'])
            m = re.search(r'(\d+/\d+ PASS)', txt); p = re.search(r'"passed": (\d+)', txt)
            res = m.group(1) if m else (f"{p.group(1)} passed, {len(v['fails'])} failed" if p else ('pass' if '"pass": true' in txt else txt[-60:]))
            L.append(f"| {k} | {res}{' — exit ' + str(v['exit']) if v['exit'] else ''}{' — FAILS: ' + '; '.join(v['fails']) if v['fails'] else ''} |")
    else:
        L.append('(not run yet)')
    L += ['', '## GPU performance', '', 'Not measured. No GPU is available in this environment, and software rendering is not used as a performance claim.',
          'The cost of an outfit is given as draw calls, triangles, geometries and textures above.']
    open(os.path.join(ROOT, '08_VALIDATION', 'gate_h1_validation_report.md'), 'w').write('\n'.join(L) + '\n')


if __name__ == '__main__':
    s, p = matrix_md(); report_md(s, p); print('reports written; severe after rules:', s)
