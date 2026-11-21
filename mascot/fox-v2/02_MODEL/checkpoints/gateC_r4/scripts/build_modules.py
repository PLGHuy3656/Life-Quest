"""Build all eight LifeQuest Fox V2 geometry modules.

Usage (from project root LifeQuest_Fox_V2/):
    blender -b --factory-startup -P 08_VALIDATION/scripts/build_modules.py
    # or, with the pip 'bpy' module:
    python 08_VALIDATION/scripts/build_modules.py

Writes 02_MODEL/modules/{head,face,ears,body,arms_legs,tail,scarf,backpack}.blend
Every value below is derived from 01_DESIGN/proportions.json (see comments).
"""
import json
import math
import os
import sys

import bpy
from mathutils import Vector, Matrix

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import foxlib as fl  # noqa: E402

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
P = json.load(open(os.path.join(ROOT, '01_DESIGN', 'proportions.json')))
M = json.load(open(os.path.join(ROOT, '01_DESIGN', 'materials.json')))['materials']
MODULE_DIR = os.path.join(ROOT, '02_MODEL', 'modules')
os.makedirs(MODULE_DIR, exist_ok=True)

MODULES = ['HEAD', 'FACE', 'EARS', 'BODY', 'LIMBS', 'TAIL', 'SCARF', 'BACKPACK']
MODULE_FILES = {'HEAD': 'head', 'FACE': 'face', 'EARS': 'ears', 'BODY': 'body',
                'LIMBS': 'arms_legs', 'TAIL': 'tail', 'SCARF': 'scarf',
                'BACKPACK': 'backpack'}


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.unit_settings.system = 'METRIC'
    sc.unit_settings.scale_length = 1.0


def mats():
    def mk(key, **kw):
        d = M[key]
        return fl.make_material(key, d['model_hex'], roughness=d.get('roughness', 0.55),
                                sheen=d.get('sheen', 0.0), coat=d.get('coat', 0.0), **kw)
    return {k: mk(k) for k in M}


def rounded_radius(R, t, start=0.0, end=0.15):
    """Multiply radius profile by spherical caps at the ends."""
    r = R(t)
    if start and t < start:
        r *= math.sqrt(max(0.0, 1 - ((start - t) / start) ** 2))
    if end and t > 1 - end:
        r *= math.sqrt(max(0.0, 1 - ((t - (1 - end)) / end) ** 2))
    return r


def hide(obj):
    obj.hide_render = True
    obj.hide_viewport = True
    obj.hide_set(True)


# =========================================================== MODULE 01 HEAD
def build_head(MT, col):
    # rows: z, half_width (front), half_depth (side), y_centre
    # widths follow proportions.json head.width_profile_front with the
    # cheek-fluff ridge added by the deform below; depth from side view 0.59 m
    # Gate C r2: rounder, softer mochi head — chin tapers in a smooth arc
    # instead of a flat wide slab; lower-cheek volume comes from the cheek
    # deform below, not from extra width.
    # Gate C r4: lower half is a true ellipse (no shoulder at z 0.45-0.50),
    # slightly deeper chin -> soft, rounded lower edge instead of a flat slab
    lower = []
    ZB, ZE, AMAX, BMAX = 0.389, 0.575, 0.320, 0.301
    for k in range(10):
        u = 1 - k / 10.0                 # 1 at the chin pole, 0 at the equator
        z = ZE - (ZE - ZB) * u
        f = math.sqrt(max(0.0, 1 - u ** 1.75))  # <2: tapers sooner -> rounder chin
        lower.append((z, AMAX * f, BMAX * f, 0.012 + 0.003 * (1 - u)))
    table = lower + [
        (0.590, 0.320, 0.301, 0.015),
        (0.635, 0.311, 0.297, 0.016),
        (0.680, 0.293, 0.286, 0.018),
        (0.725, 0.268, 0.266, 0.021),
        (0.765, 0.236, 0.240, 0.024),
        (0.800, 0.192, 0.200, 0.027),
        (0.824, 0.138, 0.148, 0.029),
        (0.838, 0.072, 0.080, 0.03),
        (0.842, 0.00, 0.00, 0.03),
    ]

    def deform(p):
        x, y, z = p
        a = fl.interp_table([(r[0], r[1]) for r in table], z)[0] or 1e-6
        side = min(1.0, abs(x) / a)
        # softer, broader cheek-fluff ridge (r1 was a sharp wing)
        ridge = 0.024 * math.exp(-((z - 0.565) / 0.045) ** 2) * side ** 3
        x += math.copysign(ridge, x)
        z -= 0.006 * math.exp(-((z - 0.565) / 0.04) ** 2) * side ** 3
        if y < 0.015:
            # r4: ONE continuous lower-face swell spanning both cheeks and the
            # muzzle (r2/r3 used three separate bumps that read as a stuck-on
            # muzzle). Cheeks get a soft sideways puff; the muzzle is only a
            # gentle crest inside the same volume.
            y -= 0.021 * math.exp(-(x / 0.215) ** 2 - ((z - 0.503) / 0.068) ** 2)
            for cx in (-0.17, 0.17):
                g = math.exp(-((x - cx) / 0.12) ** 2 - ((z - 0.49) / 0.07) ** 2)
                x += 0.007 * g * (1 if cx > 0 else -1)
            y -= 0.007 * math.exp(-(x / 0.10) ** 2 - ((z - 0.535) / 0.05) ** 2)
        return Vector((x, y, z))

    head = fl.loft_profile('FOX_Head', table, segments=96, rings=72, front_scale=1.0,
                           deform=deform, collection=col)
    fm = P['face_mask_cream']
    cz, hw, hh = fm['ellipse_centre_z']['value'], fm['ellipse_half_width']['value'], fm['ellipse_half_height']['value']

    def field(p):
        f1 = 1.0 - (p.x / hw) ** 2 - (max(0.0, p.z - cz) / hh) ** 2
        f2 = (0.0 - p.y) / 0.06
        f3 = (p.z - 0.405) / 0.01
        return min(f1, f2, f3)
    fl.split_by_values(head, [MT['MAT_Fox_Orange'], MT['MAT_Fox_Cream']], fl.values_from_positions(head, field))
    fl.set_origin(head, (0, 0.015, 0.62))
    fl.add_subsurf(head, 2, 2)  # decals are projected onto this exact surface

    # --- hair tuft: three forward-curling lobes on the top front of the crown
    lobes = [
        # x, spine, max radius — asymmetric forward curl lying on the forehead
        (0.0, [(-0.01, 0.04, 0.785), (0.0, -0.04, 0.855), (0.03, -0.11, 0.868), (0.068, -0.148, 0.845), (0.085, -0.152, 0.815)], 0.042),
        (-0.04, [(-0.03, 0.0, 0.785), (-0.05, -0.07, 0.845), (-0.075, -0.118, 0.835), (-0.085, -0.13, 0.808)], 0.031),
        (0.02, [(0.0, 0.07, 0.795), (0.01, 0.02, 0.862), (0.035, -0.03, 0.878), (0.055, -0.05, 0.862)], 0.028),
    ]
    tufts = []
    for i, (x, spine, rmax) in enumerate(lobes):
        R = lambda t, rmax=rmax: rmax * (0.70 + 0.30 * math.sin(math.pi * min(1, t * 1.1)))
        o, _ = fl.sweep(f'FOX_Tuft_{i}', spine, lambda t, R=R: (rounded_radius(R, t, 0.0, 0.35) * 1.25, rounded_radius(R, t, 0.0, 0.35) * 0.8),
                        segments=16, rings=20, up_hint=(1, 0, 0), collection=col)
        tufts.append(o)
    # join lobes into one object
    bpy.ops.object.select_all(action='DESELECT')
    for o in tufts:
        o.select_set(True)
    bpy.context.view_layer.objects.active = tufts[0]
    bpy.ops.object.join()
    tuft = tufts[0]
    tuft.name = tuft.data.name = 'FOX_Tuft'
    tuft.data.materials.append(MT['MAT_Fox_Orange'])
    fl.set_origin(tuft, (0, -0.02, 0.86))
    fl.add_subsurf(tuft, 1, 2)
    fl.parent_keep(tuft, head)
    return head


# =========================================================== MODULE 02 FACE
def build_face(MT, col, head):
    bvh = fl.bvh_for(head)
    to_w = lambda u, v: Vector((u, -2.0, v))
    ray = (0, 1, 0)
    e = P['eyes']
    ex, ez = e['centre_x_abs']['value'], e['centre_z']['value']
    erx, erz = e['width']['value'] / 2, e['height']['value'] / 2
    objs = {}

    def reproject_key(obj, name, fn, offset, dome, cx, cz, rx, rz):
        """Shape key: map each vertex (u=x, v=z) through fn and re-project."""
        if obj.data.shape_keys is None:
            obj.shape_key_add(name='Basis')
        sk = obj.shape_key_add(name=name, from_mix=False)
        sk.value = 0.0
        sk.slider_min, sk.slider_max = 0.0, 1.0
        for i, v in enumerate(obj.data.vertices):
            u, w = v.co.x + obj.location.x, v.co.z + obj.location.z
            rr = min(1.0, math.hypot((u - cx) / rx, (w - cz) / rz))
            u2, w2 = fn(u, w)
            hit, nrm = fl.project(bvh, to_w(u2, w2), ray)
            if hit is None:
                continue
            d = dome * math.sqrt(max(0.0, 1 - rr * rr)) * (abs(w2 - cz) / max(abs(w - cz), 1e-6) if name == 'Blink' else 1.0)
            sk.data[i].co = hit + nrm * (offset + min(d, dome)) - obj.location
        return sk

    for side, sx in (('L', 1), ('R', -1)):
        cx = sx * ex
        eye = fl.decal(f'FOX_Eye_{side}', fl.ellipse(cx, ez, erx, erz, 40), [], to_w, bvh, ray,
                       offset=0.002, dome=0.006, cuts=3, collection=col)
        eye.data.materials.append(MT['MAT_Eye'])
        fl.set_origin(eye, (cx, -0.30, ez))
        # expression shape keys (driven later by the rig / web controller)
        reproject_key(eye, 'Blink', lambda u, w, cx=cx: (u, ez - 0.004 + (w - ez) * 0.07 - 0.010 * (1 - ((u - cx) / erx) ** 2)),
                      0.002, 0.006, cx, ez, erx, erz)
        reproject_key(eye, 'Wide', lambda u, w, cx=cx: (cx + (u - cx) * 1.12, ez + 0.004 + (w - ez) * 1.12),
                      0.002, 0.006, cx, ez, erx, erz)
        # Sad (r2): upper lid slopes down to the OUTER corner (inner corner
        # stays high) -> worried "puppy" eye; eye slightly smaller and lower
        def sad(u, w, cx=cx, sx=sx):
            outer = max(-1.0, min(1.0, sx * (u - cx) / erx))
            u2, w2 = cx + (u - cx) * 0.95, ez - 0.004 + (w - ez) * 0.95
            lid = ez + erz * (0.42 - 0.50 * outer)
            return u2, min(w2, lid)
        reproject_key(eye, 'Sad', sad, 0.002, 0.006, cx, ez, erx, erz)
        reproject_key(eye, 'HalfLid', lambda u, w, cx=cx: (u, min(w, ez + 0.006) if w > ez else w),
                      0.002, 0.006, cx, ez, erx, erz)

        # Proud (r2): calm, satisfied half-lid. Upper lid lowered to a gentle
        # near-level line (tiny lift outward); the round lower half of the
        # eye is kept, so it reads content/confident rather than angry.
        def proud(u, w, cx=cx, sx=sx):
            outer = max(-1.0, min(1.0, sx * (u - cx) / erx))
            lid = ez + erz * (0.10 + 0.02 * outer + 0.10 * (1 - outer * outer))
            u2, w2 = cx + (u - cx) * 1.02, ez + 0.002 + (w - ez) * 0.96
            return u2, min(w2, lid)
        reproject_key(eye, 'Proud', proud, 0.002, 0.006, cx, ez, erx, erz)
        objs[f'eye_{side}'] = eye

        # closed-eye arcs for Happy / Proud (^) and Sleepy (u)
        arc_up = [(cx + erx * 1.25 * s, ez - 0.012 + 0.030 * math.cos(s * math.pi / 2)) for s in [k / 8 - 1 for k in range(17)]]
        arc_dn = [(cx + erx * 1.2 * s, ez - 0.008 - 0.020 * math.cos(s * math.pi / 2)) for s in [k / 8 - 1 for k in range(17)]]
        for nm, arc in (('Happy', arc_up), ('Sleepy', arc_dn)):
            o = fl.decal(f'FOX_EyeClosed{nm}_{side}', fl.stroke_polygon(arc, 0.011), [], to_w, bvh, ray,
                         offset=0.0014, cuts=1, collection=col)
            o.data.materials.append(MT['MAT_Eye'])
            fl.set_origin(o, (cx, -0.30, ez))
            hide(o)
        # eyebrows (hidden in neutral; shape keys Sad / Proud)
        bz = ez + 0.080
        brow = [(cx + sx * 0.030 * s, bz + 0.005 * math.cos(s * math.pi / 2)) for s in [k / 6 - 1 for k in range(13)]]
        o = fl.decal(f'FOX_Brow_{side}', fl.stroke_polygon(brow, 0.011), [], to_w, bvh, ray,
                     offset=0.0016, cuts=1, collection=col)
        o.data.materials.append(MT['MAT_Face_Detail'])
        fl.set_origin(o, (cx, -0.30, bz))

        def inner_f(u, cx=cx, sx=sx):          # +1 at the inner (nose-side) end
            return max(-1.0, min(1.0, -sx * (u - cx) / 0.030))
        # Sad: inner ends lifted steeply, outer ends dropped -> clear worry
        reproject_key(o, 'Sad', lambda u, w: (u - sx * 0.004, w + 0.002 + 0.020 * inner_f(u)),
                      0.0016, 0.0, cx, bz, 0.04, 0.02)
        # Proud: raised, arched, outer tips up a touch -> confident
        reproject_key(o, 'Proud', lambda u, w: (u, w + 0.012 + 0.007 * (1 - inner_f(u) ** 2) - 0.002 * inner_f(u)),
                      0.0016, 0.0, cx, bz, 0.04, 0.02)
        hide(o)

        # cheek blush
        b = P['cheek_blush']
        bx = sx * b['centre_x_abs']['value']
        bl = fl.decal(f'FOX_Blush_{side}', fl.ellipse(bx, b['centre_z']['value'], b['width']['value'] / 2,
                                                      b['height']['value'] / 2 * 1.05, 32),
                      [], to_w, bvh, ray, offset=0.0015, cuts=2, collection=col)
        bl.data.materials.append(MT['MAT_Cheek_Blush'])
        fl.set_origin(bl, (bx, -0.28, b['centre_z']['value']))

    # nose: small rounded ellipsoid sitting on the muzzle
    n = P['nose']
    hit, nrm = fl.project(bvh, to_w(0, n['centre_z']['value']), ray)
    nose = fl.loft_profile('FOX_Nose', [
        (-1.0, 0, 0, 0), (-0.7, 0.72, 0.72, 0), (0.0, 1.0, 1.0, 0), (0.7, 0.72, 0.72, 0), (1.0, 0, 0, 0)],
        segments=24, rings=14, collection=col)
    nose.data.transform(Matrix.Diagonal((n['width']['value'] / 2, 0.014, n['height']['value'] / 2 * 1.15, 1)))
    nose.location = hit + nrm * 0.004
    nose.data.materials.append(MT['MAT_Face_Detail'])
    fl.add_subsurf(nose, 1, 2)

    # mouths: neutral 'w' visible; open + small-o variants hidden
    mz, mw = P['mouth']['centre_z']['value'], P['mouth']['width']['value']
    w_line = [(mw / 2 * s, mz + 0.006 - 0.014 * math.sin(math.pi * abs(s))) for s in [k / 16 - 1 for k in range(33)]]
    mn = fl.decal('FOX_Mouth_Neutral', fl.stroke_polygon(w_line, 0.0085), [], to_w, bvh, ray,
                  offset=0.002, cuts=1, collection=col)
    mn.data.materials.append(MT['MAT_Face_Detail'])
    fl.set_origin(mn, (0, -0.30, mz))

    d_shape = [(0.036 * math.cos(a), mz + 0.004 - 0.042 * max(0.0, math.sin(a)) if math.sin(a) > 0 else mz + 0.004 + 0.002 * math.sin(a))
               for a in [math.pi * k / 24 for k in range(49)]]
    d_shape = [(x, y) for x, y in d_shape]
    mo = fl.decal('FOX_Mouth_Open', [(0.036 * math.cos(a), mz + 0.006 - 0.044 * math.sin(a)) for a in [math.pi * k / 24 for k in range(25)]],
                  [], to_w, bvh, ray, offset=0.0013, cuts=2, collection=col)
    mo.data.materials.append(MT['MAT_Mouth_Inside'])
    fl.set_origin(mo, (0, -0.30, mz))
    tg = fl.decal('FOX_Mouth_Tongue', fl.ellipse(0, mz - 0.026, 0.022, 0.012, 24), [], to_w, bvh, ray,
                  offset=0.0018, cuts=1, collection=col)
    tg.data.materials.append(MT['MAT_Tongue'])
    fl.set_origin(tg, (0, -0.30, mz - 0.026))
    fl.parent_keep(tg, mo)
    ms = fl.decal('FOX_Mouth_SmallO', fl.ellipse(0, mz - 0.008, 0.014, 0.018, 24), [], to_w, bvh, ray,
                  offset=0.0013, cuts=1, collection=col)
    ms.data.materials.append(MT['MAT_Mouth_Inside'])
    fl.set_origin(ms, (0, -0.30, mz))
    # r2: sad frown (small inverted arc) and proud closed smile (wide omega
    # with lifted corners)
    frown = [(0.026 * s, mz - 0.012 + 0.011 * math.cos(s * math.pi / 2)) for s in [k / 12 - 1 for k in range(25)]]
    mf = fl.decal('FOX_Mouth_Frown', fl.stroke_polygon(frown, 0.0085), [], to_w, bvh, ray,
                  offset=0.002, cuts=1, collection=col)
    mf.data.materials.append(MT['MAT_Face_Detail'])
    fl.set_origin(mf, (0, -0.30, mz))
    smile = [(0.060 * s, mz + 0.004 - 0.013 * math.sin(math.pi * abs(s)) + 0.014 * abs(s) ** 6)
             for s in [k / 18 - 1 for k in range(37)]]
    msm = fl.decal('FOX_Mouth_Smile', fl.stroke_polygon(smile, 0.0085), [], to_w, bvh, ray,
                   offset=0.002, cuts=1, collection=col)
    msm.data.materials.append(MT['MAT_Face_Detail'])
    fl.set_origin(msm, (0, -0.30, mz))
    for o in (mo, tg, ms, mf, msm):
        hide(o)
    for o in col.objects:
        if o.parent is None:
            fl.parent_keep(o, head)


# =========================================================== MODULE 03 EARS
def build_ears(MT, col):
    """Gate C r2: rounder dome tips, deeper cup, puffier inner ear, relaxed
    outward orientation (tilt 12 deg, yaw 10 deg; r1 was 16/16)."""
    ears = P['ears']
    H, W, D = 0.350, 0.150, 0.125
    tilt = math.radians(ears['outward_tilt_deg']['value'] - 3)  # relaxed lean
    yaw = math.radians(8)

    T_CAP, R_TIP, D_TIP = 0.84, 0.058, 0.056

    def cap(t):
        return math.sqrt(max(0.0, 1 - ((t - T_CAP) / (1 - T_CAP)) ** 2))

    def width(t):
        # triangular taper (slightly convex sides) ending in a round dome tip
        if t <= T_CAP:
            base_round = 0.78 + 0.22 * math.sin(min(1.0, t / 0.22) * math.pi / 2)  # buried base tucks in
            # r3: exponent 0.85 -> 0.68 keeps the ear broader through its upper half
            return (R_TIP + (W - R_TIP) * (1 - t / T_CAP) ** 0.68) * base_round
        return R_TIP * cap(t)

    def depth(t):
        if t <= T_CAP:
            return D_TIP + (D - D_TIP) * (1 - t / T_CAP) ** 0.9
        return D_TIP * cap(t) + 0.002

    def front_y(c, d):
        # U-shaped bowl: side walls/rim forward, centre recessed — read as a
        # rolled, cupped ear from the front, thick from the side
        return -d * (0.06 + 0.86 * min(1.0, abs(c) / 0.78) ** 2.6)  # |c|>0.78 = rounded rim lip

    def outer_ring(t, n=48):
        w, d = width(t) + 0.004, depth(t)
        ring = []
        for i in range(n):
            th = 2 * math.pi * i / n
            c, s = math.cos(th), math.sin(th)
            if s >= 0:
                # r4: fuller back in the upper ear (no blade look in 3/4/side)
                y, xs = d * s * (0.75 + 0.30 * t), 1.0
            else:
                ramp = min(1.0, abs(s) * 2.2) ** 0.7       # rounded side wall
                y = front_y(c, d) * ramp
                xs = 1.0 + 0.10 * math.sin(math.pi * ramp)  # wall bulges out a little
            # r4: ear arcs gently backward toward the tip (side/3/4 curvature)
            ring.append(Vector((w * c * xs, y + 0.032 * t * t, t * H)))
        return ring

    def inner_ring(t, n=32):
        # cream lining that hugs the inside of the bowl (thin crescent shell)
        w, d = width(t), depth(t)
        half = n // 2
        front, back = [], []
        for k in range(half + 1):
            c = -0.74 + 1.48 * k / half
            yf = front_y(c, d)
            front.append(Vector((w * c, yf - 0.0035 + 0.032 * t * t, t * H)))
            back.append(Vector((w * c, yf + 0.0035 + 0.032 * t * t, t * H)))
        return front + list(reversed(back))[1:-1]

    for side, sx in (('L', 1), ('R', -1)):
        ts = [k / 36 for k in range(0, 31)] + [0.84 + 0.16 * math.sin(math.pi / 2 * k / 8) for k in range(1, 8)]
        ear = fl.mesh_from_rings(f'FOX_Ear_{side}', [outer_ring(t) for t in ts],
                                 Vector((0, 0, -0.01)), Vector((0, 0.032, H)), col)
        tt = [0.09 + 0.83 * k / 24 for k in range(1, 24)]
        inner = fl.mesh_from_rings(f'FOX_EarInner_{side}', [inner_ring(t) for t in tt],
                                   Vector((0, front_y(0, depth(0.09)), 0.07 * H)),
                                   Vector((0, front_y(0, depth(0.92)) + 0.032 * 0.94 ** 2, 0.94 * H)), col)
        base = Vector((sx * 0.180, 0.085, 0.655))
        mtx = (Matrix.Translation(base) @ Matrix.Rotation(sx * yaw, 4, 'Z')
               @ Matrix.Rotation(sx * tilt, 4, 'Y') @ Matrix.Rotation(math.radians(-12), 4, 'X'))
        for o in (ear, inner):
            o.data.transform(mtx)
        ear.data.materials.append(MT['MAT_Fox_Orange'])
        inner.data.materials.append(MT['MAT_Fox_Cream'])
        fl.set_origin(ear, base)
        fl.set_origin(inner, base)
        fl.add_subsurf(ear, 1, 2)
        fl.add_subsurf(inner, 1, 2)
        fl.parent_keep(inner, ear)


# =========================================================== MODULE 04 BODY
def build_body(MT, col):
    table = [
        (0.045, 0, 0, 0.0),
        (0.055, 0.13, 0.105, 0.0),
        (0.090, 0.178, 0.132, 0.0),
        (0.140, 0.190, 0.140, 0.0),
        (0.200, 0.188, 0.140, 0.0),
        (0.260, 0.181, 0.136, 0.0),
        (0.320, 0.166, 0.128, 0.0),
        (0.380, 0.148, 0.118, 0.005),
        (0.440, 0.128, 0.108, 0.01),
        (0.470, 0, 0, 0.01),
    ]
    def deform(p):
        # Gate C r2: soft shoulder pads where the arms emerge, so the arm reads
        # as growing out of the torso instead of being stuck on
        x, y, z = p
        for sx in (-1, 1):
            g = math.exp(-(((x - sx * 0.15) / 0.07) ** 2) - ((y / 0.09) ** 2) - (((z - 0.335) / 0.06) ** 2))
            x += sx * 0.014 * g
            z += 0.004 * g
        return Vector((x, y, z))
    body = fl.loft_profile('FOX_Body', table, segments=56, rings=40, front_scale=1.04, deform=deform, collection=col)
    bp = P['body']['belly_patch']

    def field(p):
        f1 = 1.0 - (p.x / bp['half_width']) ** 2 - ((p.z - bp['centre_z']) / bp['half_height']) ** 2
        return min(f1, (-0.03 - p.y) / 0.05)
    fl.split_by_values(body, [MT['MAT_Fox_Orange'], MT['MAT_Fox_Cream']], fl.values_from_positions(body, field))
    fl.set_origin(body, (0, 0, 0.12))
    fl.add_subsurf(body, 2, 2)
    return body


# =========================================================== MODULE 05 LIMBS
def build_limbs(MT, col):
    a = P['arms']
    leg = P['legs']
    for side, sx in (('L', 1), ('R', -1)):
        spine = [(sx * 0.095, 0.0, 0.365), (sx * 0.150, -0.004, 0.330), (sx * 0.190, -0.009, 0.285),
                 (sx * 0.218, -0.013, 0.240), (sx * 0.236, -0.016, 0.200), (sx * 0.243, -0.017, 0.166)]
        # thick at the shoulder (blends into the shoulder pad), slim forearm, round paw
        R = lambda t: 0.046 + 0.016 * math.exp(-(t / 0.22) ** 2) + 0.010 * math.exp(-((t - 0.82) / 0.13) ** 2)
        arm, params = fl.sweep(f'FOX_Arm_{side}', spine, lambda t: rounded_radius(R, t, 0.0, 0.20),
                               segments=24, rings=30, up_hint=(0, -1, 0), collection=col)

        vals = [(params[i][0] - 0.62) for i in range(len(arm.data.vertices))]
        fl.split_by_values(arm, [MT['MAT_Fox_Orange'], MT['MAT_Fox_Brown']], vals)
        fl.set_origin(arm, (sx * 0.150, -0.004, 0.330))
        fl.add_subsurf(arm, 1, 2)

        lx = sx * leg['centre_x_abs']['value']
        table = [
            (0.000, 0, 0, -0.016),
            (0.006, 0.050, 0.070, -0.018),
            (0.018, 0.073, 0.098, -0.020),
            (0.038, 0.079, 0.106, -0.020),
            (0.058, 0.075, 0.097, -0.014),
            (0.074, 0.066, 0.076, -0.004),
            (0.090, 0.064, 0.067, 0.0),
            (0.120, 0.072, 0.073, 0.0),
            (0.160, 0.080, 0.078, 0.0),
            (0.205, 0, 0, 0.0),
        ]
        lg = fl.loft_profile(f'FOX_Leg_{side}', table, segments=32, rings=26, collection=col, x_center=lx)
        fl.split_by_values(lg, [MT['MAT_Fox_Orange'], MT['MAT_Fox_Brown']],
                           fl.values_from_positions(lg, lambda p: leg['foot_height']['value'] + 0.002 - p.z))
        fl.set_origin(lg, (lx, 0.0, 0.13))
        fl.add_subsurf(lg, 1, 2)


# =========================================================== MODULE 06 TAIL
def build_tail(MT, col):
    # Gate C r3 (user decision, option C): tail curls toward the character's
    # RIGHT (-X), the r1 orientation that matches the hero illustration, the
    # 3/4 view and the back view. One mesh, one attachment, identical in every
    # camera. Shape refinements from r2 kept: slim base behind the backpack,
    # full fluffy outer half, everything above the ground plane.
    # mid-section pushed outboard so the backpack stays visible from the back
    # bbox target from the back view: x -0.37..-0.03 (r3b reached -0.43)
    # r4: smoother curve — gradual sweep out, then the tip curls softly up and
    # back in over the body (fluffy "comma" shape); orientation C unchanged
    spine = [(-0.02, 0.07, 0.15), (-0.07, 0.18, 0.115), (-0.14, 0.265, 0.13), (-0.205, 0.325, 0.205),
             (-0.245, 0.345, 0.30), (-0.258, 0.337, 0.39), (-0.252, 0.322, 0.44), (-0.240, 0.308, 0.47)]
    # slim where it passes behind the backpack, full and fluffy toward the tip
    R = lambda t: 0.035 + 0.117 * math.sin(math.pi * min(1.0, t / 0.98) ** 1.35) ** 0.75
    tail, params = fl.sweep('FOX_Tail', spine, lambda t: rounded_radius(R, t, 0.0, 0.34),
                            segments=64, rings=64, up_hint=(1, 0, 0), collection=col)

    def tip_value(t, th):
        zig = abs(((th * 5 / (2 * math.pi)) % 1.0) - 0.5) * 2  # triangle wave 0..1
        return t - (0.64 + 0.075 * zig)
    fl.split_by_values(tail, [MT['MAT_Fox_Orange'], MT['MAT_Fox_Cream']],
                       [tip_value(*params[i]) for i in range(len(tail.data.vertices))], lo=0.05, hi=0.95)
    fl.set_origin(tail, spine[0])
    fl.add_subsurf(tail, 1, 2)


# =========================================================== MODULE 07 SCARF
def build_scarf(MT, col, body):
    s = P['scarf']
    cz = s['neck_ring_centre_z']['value']
    rings = []
    n_phi = 72
    for k in range(n_phi + 1):
        phi = 2 * math.pi * (k % n_phi) / n_phi
        ax, by = 0.158, 0.132
        c = Vector((ax * math.sin(phi), -by * math.cos(phi), cz + 0.012 * math.cos(phi)))
        out = Vector((math.sin(phi) / ax, -math.cos(phi) / by, 0)).normalized()
        r = 0.033 * (1 + 0.10 * math.sin(7 * phi + 0.5))
        ring = []
        for i in range(20):
            th = 2 * math.pi * i / 20
            ring.append(c + out * math.cos(th) * r + Vector((0, 0, 1)) * math.sin(th) * r * 1.15)
        rings.append(ring)
    roll = fl.mesh_from_rings('FOX_Scarf_Roll', rings, None, None, col)
    roll.data.materials.append(MT['MAT_Scarf_Red'])
    fl.set_origin(roll, (0, 0, cz))
    fl.add_subsurf(roll, 1, 2)

    bvh = fl.bvh_for_many([body, roll])
    top, pt, hw = 0.418, s['front_flap_point_z']['value'], s['front_flap_half_width']['value'] - 0.01
    outline = []
    for k in range(13):      # top edge
        u = -hw + 2 * hw * k / 12
        outline.append((u, top))
    for k in range(1, 15):   # right side curving to rounded point
        f = k / 14
        u = hw * (1 - f) ** 1.05 * (1 + 0.10 * math.sin(math.pi * f))
        outline.append((max(u, 0.012 * (1 - f) + 0.0), top - (top - pt) * f))
    for k in range(1, 6):    # rounded tip
        a = math.pi * k / 6
        outline.append((0.012 * math.cos(a), pt - 0.006 * math.sin(a)))
    for k in range(14, 0, -1):
        f = k / 14
        u = hw * (1 - f) ** 1.05 * (1 + 0.10 * math.sin(math.pi * f))
        outline.append((-max(u, 0.012 * (1 - f)), top - (top - pt) * f))
    outline = outline[:-1] if outline[-1] == outline[0] else outline
    flap = fl.decal('FOX_Scarf_Flap', outline, [], lambda u, v: Vector((u, -2.0, v)), bvh, (0, 1, 0),
                    offset=0.016, cuts=3, collection=col)
    flap.data.materials.append(MT['MAT_Scarf_Red'])
    sol = flap.modifiers.new('Solidify', 'SOLIDIFY')
    sol.thickness = 0.010
    sol.offset = -1
    fl.set_origin(flap, (0, -0.15, 0.34))
    fl.add_subsurf(flap, 1, 2)

    # flame emblem
    ez = s['emblem_centre_z']['value']
    sw, sh = s['emblem_size']['value']
    outer = [(0.0, -0.55), (0.30, -0.50), (0.47, -0.32), (0.52, -0.06), (0.44, 0.18), (0.30, 0.36),
             (0.27, 0.20), (0.17, 0.28), (0.12, 0.50), (0.02, 0.70), (-0.10, 0.52), (-0.22, 0.40),
             (-0.33, 0.50), (-0.40, 0.30), (-0.50, 0.04), (-0.48, -0.30), (-0.30, -0.50)]
    hole = [(0.0, -0.42), (0.15, -0.36), (0.21, -0.18), (0.12, 0.02), (0.03, 0.16), (-0.08, 0.02),
            (-0.19, -0.16), (-0.15, -0.36)]
    sc = lambda pts: [(x * sw, ez + y * sh / 1.25) for x, y in pts]
    fbvh = fl.bvh_for(flap)
    emb = fl.decal('FOX_Scarf_Emblem', sc(outer), [list(reversed(sc(hole)))],
                   lambda u, v: Vector((u, -2.0, v)), fbvh, (0, 1, 0), offset=0.0015, cuts=2, collection=col)
    emb.data.materials.append(MT['MAT_Scarf_Emblem'])
    fl.set_origin(emb, (0, -0.17, ez))
    for o in (flap, emb):
        fl.parent_keep(o, roll)


# ======================================================== MODULE 08 BACKPACK
def build_backpack(MT, col, body):
    bvh = fl.bvh_for(body)
    hit, _ = fl.project(bvh, (0, 2, 0.245), (0, -1, 0))
    yb = hit.y
    w, h, d = 0.235, 0.20, 0.088
    yc = yb + d / 2 - 0.012
    zc = 0.245
    pack = fl.rounded_box('FOX_Backpack', (w, d, h), bevel=0.030, segments=4, collection=col, center=(0, yc, zc))
    pack.data.materials.append(MT['MAT_Backpack_Green'])
    flap = fl.rounded_box('FOX_Backpack_Flap', (w + 0.012, d + 0.012, 0.11), bevel=0.028, segments=4,
                          collection=col, center=(0, yc + 0.004, zc + h / 2 - 0.045))
    flap.data.materials.append(MT['MAT_Backpack_Green'])
    yback = yc + (d + 0.012) / 2 + 0.004
    bz = zc + h / 2 - 0.10
    buckle = fl.rounded_box('FOX_Backpack_Buckle', (0.044, 0.012, 0.038), bevel=0.006, segments=2,
                            collection=col, center=(0, yback, bz))
    buckle.data.materials.append(MT['MAT_Backpack_Buckle'])
    hole = fl.rounded_box('FOX_Backpack_BuckleHole', (0.022, 0.010, 0.018), bevel=0.003, segments=2,
                          collection=col, center=(0, yback + 0.003, bz))
    hole.data.materials.append(MT['MAT_Backpack_Green'])
    pockets = []
    for sx in (1, -1):
        p = fl.rounded_box(f'FOX_Backpack_Pocket_{"L" if sx > 0 else "R"}', (0.030, 0.060, 0.075), bevel=0.012,
                           segments=3, collection=col, center=(sx * (w / 2 + 0.006), yc + 0.004, zc - 0.035))
        p.data.materials.append(MT['MAT_Backpack_Green'])
        pockets.append(p)

    def snap(p, lift=0.009):
        p = Vector(p)
        c = Vector((0, 0, min(p.z, 0.36)))
        dirv = (p - c)
        hitp, nrm = fl.project(bvh, c, dirv)
        return hitp + dirv.normalized() * lift if hitp is not None else p

    straps = []
    for side, sx in (('L', 1), ('R', -1)):
        raw = [(sx * 0.065, yb + 0.01, 0.335), (sx * 0.10, 0.10, 0.39), (sx * 0.125, 0.02, 0.425),
               (sx * 0.135, -0.07, 0.40), (sx * 0.140, -0.12, 0.335), (sx * 0.146, -0.125, 0.255),
               (sx * 0.165, -0.085, 0.200), (sx * 0.178, 0.02, 0.180), (sx * 0.14, 0.11, 0.168),
               (sx * 0.085, yb + 0.01, 0.165)]
        path = [raw[0]] + [tuple(snap(p)) for p in raw[1:-1]] + [raw[-1]]
        st, _ = fl.sweep(f'FOX_Backpack_Strap_{side}', path, lambda t: (0.0055, 0.015), segments=12, rings=60,
                         normal_fn=lambda p, t: (p.x, p.y, max(0.0, p.z - 0.37) * 4), collection=col)
        st.data.materials.append(MT['MAT_Backpack_Green'])
        straps.append(st)
    fl.set_origin(pack, (0, yc, zc))
    for o in [flap, buckle, hole] + pockets + straps:
        fl.set_origin(o, (0, yc, zc))
        fl.parent_keep(o, pack)
    for o in [pack, flap] + pockets:
        fl.add_subsurf(o, 1, 1)


# ================================================================= driver
def build_all():
    reset_scene()
    MT = mats()
    cols = {m: fl.get_collection('GEO_' + m) for m in MODULES}
    head = build_head(MT, cols['HEAD'])
    build_face(MT, cols['FACE'], head)
    build_ears(MT, cols['EARS'])
    body = build_body(MT, cols['BODY'])
    build_limbs(MT, cols['LIMBS'])
    build_tail(MT, cols['TAIL'])
    build_scarf(MT, cols['SCARF'], body)
    build_backpack(MT, cols['BACKPACK'], body)
    return cols


def save_modules():
    build_all()
    tmp = os.path.join(MODULE_DIR, '_all_modules_tmp.blend')
    bpy.ops.wm.save_as_mainfile(filepath=tmp, compress=False)
    for m in MODULES:
        bpy.ops.wm.open_mainfile(filepath=tmp)
        for other in MODULES:
            if other == m:
                continue
            col = bpy.data.collections['GEO_' + other]
            for o in list(col.all_objects):
                bpy.data.objects.remove(o, do_unlink=True)
            bpy.data.collections.remove(col)
        bpy.ops.outliner.orphans_purge(do_recursive=True)
        bpy.context.scene['fox_module'] = m
        bpy.context.scene['fox_version'] = P['_meta']['version']
        out = os.path.join(MODULE_DIR, MODULE_FILES[m] + '.blend')
        bpy.ops.wm.save_as_mainfile(filepath=out, compress=True)
        print('saved', out, len(bpy.data.objects), 'objects')
    os.remove(tmp)
    for f in os.listdir(MODULE_DIR):
        if f.endswith('.blend1'):
            os.remove(os.path.join(MODULE_DIR, f))


if __name__ == '__main__':
    save_modules()
