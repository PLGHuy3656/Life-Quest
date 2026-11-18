"""Build 01_DESIGN/comparisons/fox_reference_vs_model.png and silhouette metrics.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/make_comparison.py [output_name.png]
Needs Pillow + numpy. Reads the reference turnaround sheets in 00_REFERENCE and
the renders + masks written by render_turnaround.py.
"""
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
REF = os.path.join(ROOT, '00_REFERENCE')
BG = (253, 246, 241)
VIEWS = ['front', '34', 'side', 'back']
LABEL = {'front': 'Front', '34': '3/4', 'side': 'Side', 'back': 'Back'}
# (sheet, column, horizontal shift that centres the character in the 724 px crop)
REF_CROPS = {
    'front': ('supplementary/fox_v2_turnaround_front_34_side.png', 0, 362 - 455),
    '34': ('supplementary/fox_v2_turnaround_front_34_side.png', 1, 362 - 360),
    'side': ('supplementary/fox_v2_turnaround_front_34_side.png', 2, 362 - 232),
    'back': ('supplementary/fox_v2_turnaround_back_views.png', 0, 362 - 450),
}


def font(size, bold=False):
    for p in ['/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf' % ('-Bold' if bold else ''),
              'C:/Windows/Fonts/arial%s.ttf' % ('bd' if bold else '')]:
        if os.path.exists(p):
            return ImageFont.truetype(p, size)
    return ImageFont.load_default()


def ref_crop(view):
    sheet, col, dx = REF_CROPS[view]
    im = Image.open(os.path.join(REF, sheet)).convert('RGB').crop((col * 724, 0, col * 724 + 724, 724))
    out = Image.new('RGB', (724, 724), BG)
    out.paste(im, (dx, 0))
    return out


def ref_mask(img):
    a = np.asarray(img).astype(int)
    d = np.abs(a - np.array(BG)).sum(-1)
    m = d > 24
    m[684:] = False  # ground shadow band
    return m


def main():
    rend = {v: Image.open(os.path.join(ROOT, '01_DESIGN', 'turnaround', f'fox_{v}.png')).convert('RGB') for v in VIEWS}
    masks = {v: np.asarray(Image.open(os.path.join(ROOT, '08_VALIDATION', 'masks', f'mask_{v}.png'))) > 127 for v in VIEWS}
    refs = {v: ref_crop(v) for v in VIEWS}
    metrics = {}
    overlays = {}
    for v in VIEWS:
        mr, mo = ref_mask(refs[v]), masks[v].copy()
        mo[684:] = False
        inter, union = (mr & mo).sum(), (mr | mo).sum()
        ys_r, ys_o = np.where(mr.any(1))[0], np.where(mo.any(1))[0]
        xs_r, xs_o = np.where(mr.any(0))[0], np.where(mo.any(0))[0]
        metrics[v] = {
            'silhouette_iou': round(float(inter / union), 3),
            'ref_bbox_px': [int(xs_r.min()), int(ys_r.min()), int(xs_r.max()), int(ys_r.max())],
            'model_bbox_px': [int(xs_o.min()), int(ys_o.min()), int(xs_o.max()), int(ys_o.max())],
            'height_ratio_model_over_ref': round(float((ys_o.max() - ys_o.min()) / (ys_r.max() - ys_r.min())), 3),
        }
        img = np.full((724, 724, 3), 255, np.uint8)
        img[mr & ~mo] = (226, 74, 74)
        img[mo & ~mr] = (52, 152, 219)
        img[mr & mo] = (205, 205, 205)
        overlays[v] = Image.fromarray(img)

    cell, pad, head_h, lab_w = 400, 16, 120, 190
    W = lab_w + len(VIEWS) * (cell + pad) + pad
    H = head_h + 3 * (cell + pad) + 150
    sheet = Image.new('RGB', (W, H), BG)
    d = ImageDraw.Draw(sheet)
    d.text((pad, 18), 'LifeQuest Fox V2 — Reference vs 3D model (Gate C, correction r4)', fill=(60, 40, 30), font=font(34, True))
    d.text((pad, 64), 'Row 1: canonical reference turnaround   Row 2: Blender render (orthographic, Cycles, same framing)   '
                      'Row 3: silhouette overlay  grey = both, red = reference only, blue = model only',
           fill=(90, 70, 60), font=font(17))
    rows = [('Reference', refs), ('3D model', rend), ('Overlay', overlays)]
    for r, (name, imgs) in enumerate(rows):
        y = head_h + r * (cell + pad)
        d.text((pad, y + cell // 2 - 14), name, fill=(60, 40, 30), font=font(26, True))
        for c, v in enumerate(VIEWS):
            x = lab_w + pad + c * (cell + pad)
            sheet.paste(imgs[v].resize((cell, cell), Image.LANCZOS), (x, y))
            if r == 0:
                d.text((x + 8, y + 6), LABEL[v], fill=(60, 40, 30), font=font(22, True))
            if r == 2:
                d.text((x + 8, y + cell - 30), f"IoU {metrics[v]['silhouette_iou']:.2f}", fill=(60, 40, 30), font=font(20, True))
    note_y = head_h + 3 * (cell + pad) + 8
    notes = [
        'Gate C r4. Tail orientation C (character\'s right) — matches hero illustration, 3/4 and back; the front turnaround mirrors it (reference inconsistency).',
        'The reference turnaround is an illustrated perspective sheet whose views disagree on tail side; IoU is a coarse guide, never an approval metric.',
        'Lighting rig rotates with the camera, so all four views share identical lighting. Reference 3/4 angle estimated at ~30-38 deg.',
    ]
    for i, t in enumerate(notes):
        d.text((pad, note_y + i * 26), '• ' + t, fill=(90, 70, 60), font=font(16))
    name = sys.argv[1] if len(sys.argv) > 1 else 'fox_reference_vs_model.png'
    out = os.path.join(ROOT, '01_DESIGN', 'comparisons', name)
    os.makedirs(os.path.dirname(out), exist_ok=True)
    sheet.save(out)
    json.dump(metrics, open(os.path.join(ROOT, '08_VALIDATION', 'silhouette_metrics.json'), 'w'), indent=2)
    print(out)
    print(json.dumps(metrics, indent=1))


if __name__ == '__main__':
    main()
