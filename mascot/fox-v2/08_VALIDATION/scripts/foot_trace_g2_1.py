"""Gate G2.1 — world-space foot contact trace (runtime cage) for the grounded transitions, G2 vs G2.1.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/foot_trace_g2_1.py
Per frame and foot: mean world position of the sole vertices (the lowest 4 mm of each leg mesh at rest), their
lowest height, and whether the sole is in ground contact (lowest sole vertex within 1.5 mm of the floor, the same
rule as anim_check). Slide = horizontal travel of the contact sole between two consecutive contact frames —
measured in world space every frame, not inferred from clip endpoints.
Writes 08_VALIDATION/runtime_g2_1/foot_trace_g2_1.json and 04_ANIMATIONS/g2_1_deformation_polish/closeups/foot_trace_<clip>.png
"""
import json, math, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
import bpy  # noqa: E402
import anim_check_g2 as C  # noqa: E402  (set_clip / ev_verts only)
import matplotlib; matplotlib.use('Agg'); import matplotlib.pyplot as plt  # noqa: E402

BLENDS = {'G2': os.path.join(ROOT, '04_ANIMATIONS', 'g2_daily_life', 'fox_anim_g2.blend'),
          'G2.1': os.path.join(ROOT, '04_ANIMATIONS', 'g2_1_deformation_polish', 'fox_anim_g2_1.blend')}
CLIPS = ['study_start', 'study_complete', 'sleep_enter', 'sleep_wake', 'wake_start', 'sports_complete']
OUT = os.path.join(ROOT, '08_VALIDATION', 'runtime_g2_1', 'foot_trace_g2_1.json')
PNG = os.path.join(ROOT, '04_ANIMATIONS', 'g2_1_deformation_polish', 'closeups')


def trace(path):
    bpy.ops.wm.open_mainfile(filepath=path)
    O = bpy.data.objects; sc = bpy.context.scene; rig = O['FOX_RIG']
    for o in O:
        for m in o.modifiers:
            if m.type == 'SUBSURF': m.show_viewport = False
    rig.animation_data.action = None
    for pb in rig.pose.bones: pb.matrix_basis.identity()
    sc.frame_set(1)
    rest = {s: C.ev_verts(O[f'FOX_Leg_{s}'])[0] for s in 'LR'}
    z0 = {s: min(p.z for p in rest[s]) for s in 'LR'}
    idx = {s: [i for i, p in enumerate(rest[s]) if p.z < z0[s] + 0.004] for s in 'LR'}
    res = {}
    for clip in CLIPS:
        if clip not in bpy.data.actions: continue
        C.set_clip(O, clip); act = bpy.data.actions[clip]; n = int(act.frame_range[1])
        rows = []
        for f in range(1, n + 1):
            sc.frame_set(f); row = {'f': f}
            hips_z = (rig.matrix_world @ rig.pose.bones['HIPS'].head).z
            for s in 'LR':
                v = C.ev_verts(O[f'FOX_Leg_{s}'])[0]; pts = [v[i] for i in idx[s]]
                lowv = [p for p in pts if p.z < z0[s] + 0.0015]
                row[s] = {'x': sum(p.x for p in pts) / len(pts), 'y': sum(p.y for p in pts) / len(pts), 'zmin': min(p.z for p in pts) - z0[s],
                          'contact': bool(lowv), 'cx': sum(p.x for p in lowv) / len(lowv) if lowv else None, 'cy': sum(p.y for p in lowv) / len(lowv) if lowv else None}
            row['standing'] = hips_z >= 0.11
            rows.append(row)
        slides = {s: [] for s in 'LR'}
        for a, b in zip(rows, rows[1:]):
            for s in 'LR':
                if a[s]['contact'] and b[s]['contact']:
                    slides[s].append((b['f'], math.hypot(b[s]['x'] - a[s]['x'], b[s]['y'] - a[s]['y']) * 1000))
        res[clip] = {'rows': rows, 'max_slide_mm_per_frame': {s: max([d for _, d in slides[s]] or [0]) for s in 'LR'},
                     'max_slide_standing_mm_per_frame': {s: max([d for f, d in slides[s] if rows[f - 1]['standing']] or [0]) for s in 'LR'},
                     'worst_frame': {s: max(slides[s], key=lambda x: x[1])[0] if slides[s] else None for s in 'LR'}}
    return res


def main():
    data = {g: trace(p) for g, p in BLENDS.items() if os.path.exists(p)}
    os.makedirs(os.path.dirname(OUT), exist_ok=True); os.makedirs(PNG, exist_ok=True)
    json.dump({g: {c: {k: v for k, v in d.items() if k != 'rows'} | {'rows': [{'f': r['f'], 'standing': r['standing'], **{s: {k: (round(v, 5) if isinstance(v, float) else v) for k, v in r[s].items()} for s in 'LR'}} for r in d['rows']]}
                   for c, d in cl.items()} for g, cl in data.items()}, open(OUT, 'w'), indent=0)
    for clip in CLIPS:
        fig, axs = plt.subplots(1, 2, figsize=(11, 3.4), sharey=True)
        for ax, g in zip(axs, data):
            if clip not in data[g]: continue
            rows = data[g][clip]['rows']; F = [r['f'] for r in rows]
            for s, col in (('L', '#168C78'), ('R', '#F26B3A')):
                ax.plot(F, [r[s]['y'] * 1000 for r in rows], color=col, lw=1.6, label=f'sole {s} world y (mm)')
                ax.scatter([r['f'] for r in rows if r[s]['contact']], [r[s]['y'] * 1000 for r in rows if r[s]['contact']], s=7, color=col)
            st = [r['f'] for r in rows if r['standing']]
            m = data[g][clip]['max_slide_standing_mm_per_frame']
            ax.set_title(f'{g} · {clip} · max slide while standing L {m["L"]:.2f} / R {m["R"]:.2f} mm/f', fontsize=9)
            ax.set_xlabel('frame (dots = sole in ground contact)'); ax.grid(alpha=0.3)
        axs[0].set_ylabel('sole world y (mm, + = back)'); axs[0].legend(fontsize=7)
        fig.tight_layout(); fig.savefig(os.path.join(PNG, f'foot_trace_{clip}.png'), dpi=110); plt.close(fig)
    for g in data:
        print(g, {c: d['max_slide_standing_mm_per_frame'] for c, d in data[g].items()})


if __name__ == '__main__':
    main()
