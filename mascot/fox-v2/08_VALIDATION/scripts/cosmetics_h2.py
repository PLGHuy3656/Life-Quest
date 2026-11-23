"""Gate H2 — cosmetic outfit library: the new items for six themed outfits, on the approved H1 slot / skin contract.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/cosmetics_h2.py
Reads   03_RIG/fox_rig_d1_1.blend (never written); helper functions from cosmetics_h1.py (imported, unchanged)
Writes  05_COSMETICS/h2_outfits/fox_cosmetics_h2.blend, 05_COSMETICS/h2_outfits/cosmetic_catalog_h2.json,
        06_EXPORTS/glb/cosmetics/<item>.glb (12 new items; the H1 GLBs are reused untouched by Student / Sports / Explorer)

Same binding as H1: one skinned mesh per item on the canonical armature. Rigid items: one weight on the socket's deform
bone. Wearables (jersey, gi, áo dài, capelet, sneakers): offset copies of the Fox cage with the Fox's own weights, cut
under the (default / scroll) shoulder straps and V-necked under the scarf flap, so the red scarf stays the Fox's own.
Every head item stays in front of / between the ears (ear inner edge x ≈ 0.05, ears from y ≈ -0.04 backwards).
"""
import json
import math
import os
import sys

import bpy  # noqa: E402
import bmesh  # noqa: E402
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cosmetics_h1 as C  # noqa: E402  (helpers: cage, material, srgb, new_obj, finish_rigid, tube, torus, disk, rounded_box, ray_head, inside)

ROOT = C.ROOT
OUT_DIR = os.path.join(ROOT, '05_COSMETICS', 'h2_outfits')
GLB_DIR = C.GLB_DIR
srgb, mat = C.srgb, C.material


# ------------------------------------------------------------------ generic builders
def crown(bm, H, mats, lift=lambda u: 0.006 + 0.020 * (1 - u ** 2.2), ymax=-0.085, zmin=0.738, band_rings=1, NPHI=64, NR=12):
    """Cap crown from the head surface (H1 student-cap method): polar ray grid around a forward-tilted axis, footprint in
    front of the ears (y < ymax) and above the brows (z > zmin). Returns (C, AX, top point, top normal, rim points)."""
    Cc = Vector((0, -0.02, 0.62)); AX = Vector((0, -0.25, 1)).normalized()
    U = Vector((1, 0, 0)); W_ = AX.cross(U).normalized()
    ok = lambda q: q is not None and q.y < ymax and q.z > zmin
    amax = []
    for i in range(NPHI):
        ph = 2 * math.pi * i / NPHI; lo, hi = 0.0, 1.4
        for _ in range(22):
            mid = (lo + hi) / 2
            d = math.cos(mid) * AX + math.sin(mid) * (math.cos(ph) * U + math.sin(ph) * W_)
            lo, hi = (mid, hi) if ok(C.ray_head(H, Cc, d)[0]) else (lo, mid)
        amax.append(lo)
    amax = [sum(amax[(i + k) % NPHI] for k in (-2, -1, 0, 1, 2)) / 5 for i in range(NPHI)]
    go, gi, rim = [], [], []
    for r in range(NR + 1):
        ro, ri = [], []
        for i in range(NPHI if r else 1):
            ph = 2 * math.pi * i / NPHI; al = amax[i] * r / NR
            d = math.cos(al) * AX + math.sin(al) * (math.cos(ph) * U + math.sin(ph) * W_)
            q, qn = C.ray_head(H, Cc, d)
            ro.append(bm.verts.new(q + lift(r / NR) * qn)); ri.append(bm.verts.new(q + 0.003 * qn))
            if r == NR:
                rim.append((q, qn))
        go.append(ro); gi.append(ri)
    for G_, flip in ((go, False), (gi, True)):
        for i in range(NPHI):
            j = (i + 1) % NPHI
            f = (G_[0][0], G_[1][i], G_[1][j]); bm.faces.new(tuple(reversed(f)) if flip else f).material_index = mats[0]
            for r in range(1, NR):
                q = (G_[r][i], G_[r + 1][i], G_[r + 1][j], G_[r][j])
                bm.faces.new(tuple(reversed(q)) if flip else q).material_index = mats[1] if r >= NR - band_rings else mats[0]
    for i in range(NPHI):
        j = (i + 1) % NPHI
        bm.faces.new((go[NR][j], go[NR][i], gi[NR][i], gi[NR][j])).material_index = mats[1]
    top, tn = C.ray_head(H, Cc, AX)
    return Cc, AX, top + lift(0) * tn, tn, rim


def brim(bm, H, mi, x0=-0.135, x1=0.135, z=0.745, length=lambda x: 0.012 + 0.062 * math.sqrt(max(0.0, 1 - (x / 0.15) ** 2)), droop=0.17, n=15):
    """Front brim (H1 cap method): inner edge on the head at the crown's front base, extended forward."""
    inner, outer = [], []
    for k in range(n):
        x = x0 + (x1 - x0) * k / (n - 1)
        p, nn = C.ray_head(H, Vector((x, 0.0, z)), Vector((0, -1, 0.02)))
        L = length(x)
        inner.append(p + 0.004 * nn); outer.append(p + 0.004 * nn + Vector((0, -L, -droop * L)))
    t = Vector((0, 0, 0.004))
    top = [bm.verts.new(v + t) for v in inner], [bm.verts.new(v + t) for v in outer]
    bot = [bm.verts.new(v - t) for v in inner], [bm.verts.new(v - t) for v in outer]
    for k in range(n - 1):
        bm.faces.new((top[0][k], top[0][k + 1], top[1][k + 1], top[1][k])).material_index = mi
        bm.faces.new((bot[1][k], bot[1][k + 1], bot[0][k + 1], bot[0][k])).material_index = mi
        bm.faces.new((top[1][k], top[1][k + 1], bot[1][k + 1], bot[1][k])).material_index = mi
    for s in (0, n - 1):
        bm.faces.new((top[0][s], top[1][s], bot[1][s], bot[0][s])).material_index = mi


def band(bm, H, mat_fn, zf=0.715, zb=0.52, W=0.012, off_out=0.0075, off_in=0.0015, SEG=72):
    """Head band in a tilted plane (H1 headband method: each edge row ray-cast separately). mat_fn(k, row) → index.
    Returns the outer mid-line points per segment (for attachments) and the plane normal."""
    yf, yb = -0.26, 0.30
    slope = (zf - zb) / (yb - yf)
    n = Vector((0, slope, 1)).normalized()
    c = Vector((0, 0.02, zf - (0.02 - yf) * slope))
    u = Vector((1, 0, 0)); v = n.cross(u).normalized()
    rows, mid = [], []
    for off in (W, -W, 0.0):
        ro, ri = [], []
        for k in range(SEG):
            a = 2 * math.pi * k / SEG
            p, hn = C.ray_head(H, c + off * n, math.cos(a) * u + math.sin(a) * v)
            ro.append(p + off_out * hn); ri.append(p + off_in * hn)
            if off == 0.0:
                mid.append((p + off_out * hn, hn))
        if off != 0.0:
            rows.append((ro, ri))
    R = [[bm.verts.new(p) for p in rows[0][0]], [bm.verts.new(p) for p in rows[1][0]], [bm.verts.new(p) for p in rows[1][1]], [bm.verts.new(p) for p in rows[0][1]]]
    for k in range(SEG):
        k1 = (k + 1) % SEG
        for r in range(4):
            A_, B_ = R[r], R[(r + 1) % 4]
            bm.faces.new((A_[k], A_[k1], B_[k1], B_[k])).material_index = mat_fn(k, r)
    return mid, n


def garment(name, zlo, zhi, mats, mat_of, vneck=(0.052, 0.05), sleeve_r=0.07, sleeve_zmax=0.335, offset=0.005, thick=0.003, cut_straps=True,
            keep_extra=None):
    """Offset copy of the Fox body (+ optional sleeves from the arm cage) with the Fox's own weights (H1 jacket method).
    mat_of(rest_point, part) → material index ('body' | 'sleeve'); keep_extra(p) can veto more body points."""
    straps = []
    if cut_straps:
        for s in ('L', 'R'):
            v, p, _ = C.cage(f'FOX_Backpack_Strap_{s}')
            straps.append(BVHTree.FromPolygons(v, p))
    bv, bp, _ = C.cage('FOX_Body')
    BODY = BVHTree.FromPolygons(bv, bp)
    vn = lambda p: p.y < -0.05 and abs(p.x) < vneck[0] + max(0.0, (p.z - 0.24) / 0.11) * vneck[1]
    srcs = [('FOX_Body', lambda p: zlo < p.z < zhi and not vn(p) and (keep_extra is None or keep_extra(p)))]
    if sleeve_r > 0:
        srcs += [('FOX_Arm_L', None), ('FOX_Arm_R', None)]
    parts = []
    for src, keep_fn in srcs:
        ob = C.O[src].copy(); ob.data = C.O[src].data.copy(); ob.name = f'tmp_{name}_{src}'
        bpy.context.scene.collection.objects.link(ob)
        for m in list(ob.modifiers):
            if m.type != 'ARMATURE':
                ob.modifiers.remove(m)
        v, p, n = C.cage(src)
        bm = bmesh.new(); bm.from_mesh(ob.data); bm.verts.ensure_lookup_table()
        if src.startswith('FOX_Arm'):
            sh = C.O['FOX_RIG'].data.bones['ARM_' + src[-1]].head_local
            keep = [((v[i] - sh).length < sleeve_r and v[i].z < sleeve_zmax and not C.inside(BODY, v[i] + (offset + 0.004) * n[i])) for i in range(len(v))]
        else:
            keep = [keep_fn(v[i]) for i in range(len(v))]
        for i, vert in enumerate(bm.verts):
            vert.co = v[i] + offset * n[i]
        bm.faces.ensure_lookup_table()
        kill = []
        part = 'sleeve' if src.startswith('FOX_Arm') else 'body'
        for f in bm.faces:
            if not all(keep[x.index] for x in f.verts):
                kill.append(f); continue
            c = sum((v[x.index] for x in f.verts), Vector()) / len(f.verts)
            if part == 'body' and any(T.find_nearest(c)[3] < 0.012 for T in straps):
                kill.append(f); continue
            f.material_index = mat_of(c, part)
        bmesh.ops.delete(bm, geom=kill, context='FACES')
        bmesh.ops.delete(bm, geom=[x for x in bm.verts if not x.link_faces], context='VERTS')
        ext = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
        for x in [g for g in ext['geom'] if isinstance(g, bmesh.types.BMVert)]:
            x.co = x.co + thick * x.normal
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bm.to_mesh(ob.data); bm.free()
        ob.data.materials.clear()
        for m in mats:
            ob.data.materials.append(m)
        ob.parent = None; ob.matrix_world = Matrix.Identity(4)
        parts.append(ob)
    bpy.ops.object.select_all(action='DESELECT')
    for ob in parts:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    g = parts[0]; g.name = f'COS_{name}'
    for poly in g.data.polygons:
        poly.use_smooth = True
    g.parent = C.O['FOX_RIG']
    for m in g.modifiers:
        if m.type == 'ARMATURE':
            m.object = C.O['FOX_RIG']
    return g


def strap_copy(bm_target_obj, colour_mat, name):
    """Default shoulder-strap geometry re-coloured, joined into a rigid BACK item (same path as the default straps, so the
    garments' strap cut-outs fit)."""
    for s in ('L', 'R'):
        v, p, _ = C.cage(f'FOX_Backpack_Strap_{s}')
        sb = bmesh.new(); vs = [sb.verts.new(x) for x in v]
        for f in p:
            try:
                sb.faces.new([vs[i] for i in f])
            except ValueError:
                pass
        tmp = C.new_obj(f'tmp_{name}_strap_{s}', sb, [colour_mat])
        bpy.ops.object.select_all(action='DESELECT')
        bm_target_obj.select_set(True); tmp.select_set(True); bpy.context.view_layer.objects.active = bm_target_obj
        bpy.ops.object.join()
    idx = list(bm_target_obj.data.materials).index(colour_mat)
    for poly in bm_target_obj.data.polygons:
        if bm_target_obj.material_slots[poly.material_index].material is None:
            poly.material_index = idx


def star(bm, center, normal, r_out, r_in, depth, mi, points=5):
    a = normal.cross(Vector((0, 0, 1)))
    if a.length < 1e-4:
        a = normal.cross(Vector((1, 0, 0)))
    a.normalize(); b = normal.cross(a).normalized()
    ring = []
    for k in range(points * 2):
        ang = math.pi / 2 + math.pi * k / points
        r = r_out if k % 2 == 0 else r_in
        ring.append(center + r * (math.cos(ang) * a + math.sin(ang) * b))
    front = [bm.verts.new(p + normal * depth / 2) for p in ring]; back = [bm.verts.new(p - normal * depth / 2) for p in ring]
    cf = bm.verts.new(center + normal * depth / 2); cb = bm.verts.new(center - normal * depth / 2)
    for k in range(len(ring)):
        k1 = (k + 1) % len(ring)
        bm.faces.new((cf, front[k], front[k1])).material_index = mi
        bm.faces.new((cb, back[k1], back[k])).material_index = mi
        bm.faces.new((front[k], back[k], back[k1], front[k1])).material_index = mi


def held_axis():
    tip = C.O['FOX_RIG'].data.bones['ATT_HAND_R'].head_local
    return tip, Vector((-0.25, -0.75, 0.62)).normalized()


# ------------------------------------------------------------------ items
def sports_jersey():
    m = [mat('jersey_blue', srgb('#1F6FD1'), 0.75), mat('jersey_white', srgb('#F7F7F7'), 0.75), mat('jersey_gold', srgb('#F6C85F'), 0.6)]
    def mo(c, part):
        if c.z < 0.185:
            return 1                                     # white hem band
        if abs(c.x) > 0.115 and c.y > -0.06:
            return 1                                     # white side panels
        if 0.255 < c.z < 0.275:
            return 2                                     # gold chest stripe
        return 0
    return garment('sports_jersey', 0.15, 0.352, m, mo, sleeve_r=0.0)


def sports_sneakers():
    parts = []
    m = [mat('sneaker_white', srgb('#FAFAFA'), 0.55), mat('sneaker_sole', srgb('#1F6FD1'), 0.65), mat('sneaker_stripe', srgb('#F26B3A'), 0.6)]
    for s in ('L', 'R'):
        src = f'FOX_Leg_{s}'
        ob = C.O[src].copy(); ob.data = C.O[src].data.copy(); ob.name = f'tmp_sneak_{s}'
        bpy.context.scene.collection.objects.link(ob)
        for md in list(ob.modifiers):
            if md.type != 'ARMATURE':
                ob.modifiers.remove(md)
        v, p, n = C.cage(src)
        bm = bmesh.new(); bm.from_mesh(ob.data); bm.verts.ensure_lookup_table()
        for i, vert in enumerate(bm.verts):
            off = n[i] * 0.0045
            if off.z < 0:
                off.z = 0.0                               # never below the floor
            vert.co = v[i] + off
        bm.faces.ensure_lookup_table()
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if not all(v[x.index].z < 0.062 for x in f.verts)], context='FACES')
        bmesh.ops.delete(bm, geom=[x for x in bm.verts if not x.link_faces], context='VERTS')
        for f in bm.faces:
            zc = sum(q.co.z for q in f.verts) / len(f.verts)
            f.material_index = 1 if zc < 0.013 else (2 if 0.028 < zc < 0.036 else 0)
        bm.to_mesh(ob.data); bm.free()
        ob.data.materials.clear()
        for mm in m:
            ob.data.materials.append(mm)
        ob.parent = None; ob.matrix_world = Matrix.Identity(4)
        parts.append(ob)
    bpy.ops.object.select_all(action='DESELECT')
    for ob in parts:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = parts[0]
    bpy.ops.object.join()
    sh = parts[0]; sh.name = 'COS_sports_sneakers'; sh.parent = C.O['FOX_RIG']
    return sh


def explorer_hat(H):
    bm = bmesh.new()
    crown(bm, H, (0, 1), lift=lambda u: 0.008 + 0.034 * (1 - u ** 2.0) ** 0.8, band_rings=2)
    brim(bm, H, 2, x0=-0.175, x1=0.175, z=0.742, length=lambda x: 0.03 + 0.045 * math.sqrt(max(0.0, 1 - (x / 0.19) ** 2)), droop=0.32, n=19)
    tp, tn = C.ray_head(H, Vector((0, -0.02, 0.62)), Vector((0, -1, 0.35)))
    star(bm, tp + 0.012 * tn + Vector((0, -0.004, 0.012)), Vector((0, -1, 0.25)).normalized(), 0.016, 0.008, 0.004, 3, 8)   # compass rose badge
    ob = C.new_obj('COS_explorer_hat', bm, [mat('safari_khaki', srgb('#D8C08A'), 0.85), mat('safari_band', srgb('#5E7A3A'), 0.8),
                                             mat('safari_brim', srgb('#C9AE74'), 0.85), mat('safari_badge', srgb('#E0A93B'), 0.35, 0.6)])
    C.finish_rigid(ob, 'ATT_HAT')
    return ob


def mage_hat(H):
    bm = bmesh.new()
    _, _, top, tn, _ = crown(bm, H, (0, 1), lift=lambda u: 0.007 + 0.018 * (1 - u ** 2.2), band_rings=2)
    # tall cone from the crown top, leaning back and bending: stays between / in front of the ears (y < -0.05 below z 1.0)
    base = top - 0.002 * tn                               # cone base inside the crown shell, not into the head
    # floppy tip folded back, rising only 7 cm: a 0.35 m cone left the H1 harness frame at Lv30 (idle −78 px), a 12.5 cm one
    # still at the level_up / challenge_win jump apex (−28 px)
    pts = [base + Vector((0, 0.0, 0)), base + Vector((0, 0.012, 0.032)), base + Vector((0, 0.036, 0.055)), base + Vector((0, 0.07, 0.068)), base + Vector((0, 0.11, 0.07))]
    radii = [0.068, 0.05, 0.032, 0.017, 0.006]
    seg = 20; rings = []
    for i, (p, r) in enumerate(zip(pts, radii)):
        t = (pts[min(4, i + 1)] - pts[max(0, i - 1)]).normalized()
        a = t.cross(Vector((1, 0, 0))).normalized(); b = t.cross(a).normalized()
        rings.append([bm.verts.new(p + r * (math.cos(2 * math.pi * k / seg) * b + math.sin(2 * math.pi * k / seg) * a)) for k in range(seg)])
    for i in range(len(rings) - 1):
        for k in range(seg):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % seg], rings[i + 1][(k + 1) % seg], rings[i + 1][k])).material_index = 0
    for ring in rings:                                    # the low, folded cone must not dip into the head dome behind the crown
        for v in ring:
            if C.inside(H, v.co):
                loc, nn, _, _ = H.find_nearest(v.co)
                v.co = loc + 0.004 * nn
    tipv = bm.verts.new(pts[-1] + (pts[-1] - pts[-2]).normalized() * 0.01)
    for k in range(seg):
        bm.faces.new((rings[-1][k], rings[-1][(k + 1) % seg], tipv)).material_index = 0
    C.torus(bm, pts[0] + Vector((0, 0.002, 0.018)), (pts[1] - pts[0]).normalized(), 0.067, 0.009, 1, 40, 8)   # gold band at the cone base
    star(bm, pts[1] + Vector((0, -0.05, -0.005)), Vector((0, -1, 0.35)).normalized(), 0.022, 0.01, 0.006, 2)
    star(bm, pts[2] + Vector((0.025, -0.022, 0.0)), Vector((0.6, -1, 0.3)).normalized(), 0.011, 0.005, 0.004, 2)
    ob = C.new_obj('COS_mage_hat', bm, [mat('mage_violet', srgb('#4B2E83'), 0.6), mat('mage_gold', srgb('#F2C14E'), 0.35, 0.7), mat('mage_star', srgb('#FFE680'), 0.3, emit=(srgb('#FFE680'), 0.4))])
    C.finish_rigid(ob, 'ATT_HAT')
    return ob


def mage_capelet():
    m = [mat('cape_violet', srgb('#5B3A9C'), 0.7), mat('cape_gold', srgb('#F2C14E'), 0.4, 0.6), mat('cape_lining', srgb('#2E1B57'), 0.8)]
    def mo(c, part):
        if (c.y > 0.03 and c.z < 0.24) or (c.y <= 0.03 and c.z < 0.285):
            return 1                                      # gold hem
        return 0
    # shoulders + upper back, deeper at the back (down to z 0.235) — skinned like the body; offset 12 mm so it layers
    # over any BODY item (≤ 8 mm); V-neck at the front keeps the scarf flap free
    keep = lambda p: (p.z > 0.215 if p.y > 0.03 else p.z > 0.262)
    g = garment('mage_capelet', 0.2, 0.352, m, mo, vneck=(0.07, 0.06), sleeve_r=0.0, offset=0.012, thick=0.003, keep_extra=keep)
    bm = bmesh.new()                                      # star clasp on the left shoulder (rigid on SPINE would drift: added skinned via join below)
    star(bm, Vector((0.12, -0.11, 0.345)), Vector((0.4, -1, 0.35)).normalized(), 0.018, 0.008, 0.005, 0)
    cl = C.new_obj('tmp_clasp', bm, [m[1]])
    vg = cl.vertex_groups.new(name='SPINE'); vg.add(list(range(len(cl.data.vertices))), 1.0, 'REPLACE')
    bpy.ops.object.select_all(action='DESELECT')
    g.select_set(True); cl.select_set(True); bpy.context.view_layer.objects.active = g
    bpy.ops.object.join()
    return g


def mage_wand():
    bm = bmesh.new()
    tip, d = held_axis()
    a = tip + Vector((0.004, -0.004, -0.006)) - 0.03 * d
    b = a + 0.095 * d                                     # magnifier length: a longer wand reached the head in alarm_success / challenge_start
    C.tube(bm, [a, a.lerp(b, 0.5), b], 0.0065, 0, 8)
    C.torus(bm, a + 0.035 * d, d, 0.0075, 0.0025, 1, 16, 6)
    star(bm, b + 0.026 * d, Vector((0.35, -0.55, -0.75)).normalized() * -1, 0.032, 0.014, 0.009, 2)
    ob = C.new_obj('COS_mage_wand', bm, [mat('wand_wood', srgb('#5A3A22'), 0.6), mat('wand_gold', srgb('#F2C14E'), 0.3, 0.7),
                                          mat('wand_star', srgb('#FFE680'), 0.3, emit=(srgb('#FFE680'), 0.6))])
    C.finish_rigid(ob, 'ATT_HAND_R')
    return ob


def ninja_headband(H):
    bm = bmesh.new()
    mid, n = band(bm, H, lambda k, r: 0, zf=0.705, W=0.014)
    # forehead plate (metal) on the outer face at the front
    p, hn = mid[54]                                       # segment pointing to -y (front) for SEG=72: angle 270°
    for kk in range(len(mid)):
        if mid[kk][0].y < p.y:
            p, hn = mid[kk]
    t = Vector((1, 0, 0)); up = hn.cross(t).normalized()
    g = bmesh.ops.create_cube(bm, size=1.0)
    for v in g['verts']:
        v.co = p + hn * 0.004 + t * v.co.x * 0.075 + up * v.co.y * 0.03 + hn * v.co.z * 0.006
    for f in {f for v in g['verts'] for f in v.link_faces}:
        f.material_index = 1
    # knot + two tails at the back, hanging down / outwards (rigid on HEAD)
    q, qn = max(mid, key=lambda m: m[0].y)
    C.tube(bm, [q + qn * 0.008 + Vector((0, 0, -0.01)), q + qn * 0.012 + Vector((0, 0, 0.012))], 0.013, 0, 8)
    for sx in (1, -1):
        p0 = q + qn * 0.012
        C.tube(bm, [p0, p0 + Vector((0.02 * sx, 0.025, -0.035)), p0 + Vector((0.045 * sx, 0.04, -0.07)), p0 + Vector((0.06 * sx, 0.048, -0.1))], 0.007, 0, 6)
    ob = C.new_obj('COS_ninja_headband', bm, [mat('ninja_navy', srgb('#1D2433'), 0.8), mat('ninja_steel', srgb('#AEB8C4'), 0.3, 0.8)])
    C.finish_rigid(ob, 'HEAD')
    return ob


def ninja_gi():
    m = [mat('gi_charcoal', srgb('#2B2F3A'), 0.85), mat('gi_belt', srgb('#E0533A'), 0.7), mat('gi_trim', srgb('#565C6B'), 0.8)]
    def mo(c, part):
        if part == 'sleeve':
            return 0
        if 0.168 < c.z < 0.198:
            return 1                                      # obi belt
        if c.y < -0.05 and abs(abs(c.x) - (0.052 + max(0.0, (c.z - 0.24) / 0.11) * 0.06)) < 0.012:
            return 2                                      # crossed lapel trim along the V
        return 0
    return garment('ninja_gi', 0.15, 0.352, m, mo, vneck=(0.052, 0.06), sleeve_r=0.08)


def ninja_scroll():
    bm = bmesh.new()
    a, b = Vector((-0.1, 0.172, 0.268)), Vector((0.135, 0.172, 0.31))   # below the scarf roll (z ≥ 0.342), shifted away from the tail (−x)
    d = (b - a).normalized()
    C.tube(bm, [a, a.lerp(b, 0.5), b], 0.031, 0, 16)
    for e, s in ((a, -1), (b, 1)):                        # wooden end knobs
        C.tube(bm, [e, e + d * s * 0.018], 0.036, 1, 16)
    C.torus(bm, a.lerp(b, 0.5), d, 0.034, 0.004, 2, 24, 6)  # red cord
    ob = C.new_obj('COS_ninja_scroll', bm, [mat('scroll_paper', srgb('#EDE2C4'), 0.85), mat('scroll_wood', srgb('#6B4423'), 0.6), mat('scroll_cord', srgb('#C8372D'), 0.7),
                                             mat('scroll_strap', srgb('#2B2F3A'), 0.8)])
    strap_copy(ob, ob.data.materials[3], 'ninja_scroll')
    C.finish_rigid(ob, 'ATT_BACKPACK')
    return ob


def tet_khan_dong(H):
    bm = bmesh.new()
    crown(bm, H, (0, 0), lift=lambda u: 0.012 + 0.006 * (1 - u ** 2), band_rings=0)
    # thick wrapped band (khăn đóng folds): alternating red / gold diagonal stripes, 2.4 cm off the head
    mid, n = band(bm, H, lambda k, r: 1 if (k // 3) % 2 else 0, zf=0.725, zb=0.50, W=0.02, off_out=0.017, off_in=0.002)   # side top edge stays below the ear roots (z 0.628)
    ob = C.new_obj('COS_tet_khan_dong', bm, [mat('khan_red', srgb('#C1121F'), 0.55), mat('khan_gold', srgb('#E9B949'), 0.35, 0.5)])
    C.finish_rigid(ob, 'ATT_HAT')
    return ob


def tet_ao_dai():
    m = [mat('aodai_red', srgb('#C1121F'), 0.45), mat('aodai_gold', srgb('#E9B949'), 0.35, 0.5), mat('aodai_flower', srgb('#F7D774'), 0.4, 0.3)]
    def mo(c, part):
        if part == 'sleeve':
            return 1 if (c - C.O['FOX_RIG'].data.bones['ARM_' + ('L' if c.x > 0 else 'R')].head_local).length > 0.058 else 0   # gold cuff
        if c.z < 0.17:
            return 1                                      # gold hem
        if c.y < -0.04 and abs(abs(c.x) - (0.052 + max(0.0, (c.z - 0.24) / 0.11) * 0.05)) < 0.01:
            return 1                                      # gold placket along the opening
        if c.y > 0.0 and (int(c.z * 60) + int((c.x + 1) * 60)) % 7 == 0:
            return 2                                      # scattered blossom pattern on the back
        return 0
    return garment('tet_ao_dai', 0.14, 0.352, m, mo, sleeve_r=0.075, sleeve_zmax=0.345)   # 0.095 sleeves: 8.0 mm at the armpit in level_up / sleep_enter


def tet_lixi():
    bm = bmesh.new()
    tip, d = held_axis()
    c = tip + 0.058 * d                                   # held by its lower end: the envelope sticks out of the paw along d
    b = d
    n = Vector((0.35, -0.55, -0.75)).normalized() * -1
    n = (n - b * n.dot(b)).normalized(); a = b.cross(n).normalized()
    g = bmesh.ops.create_cube(bm, size=1.0)
    for v in g['verts']:
        v.co = c + a * v.co.x * 0.055 + b * v.co.y * 0.085 + n * v.co.z * 0.006
    for f in {f for v in g['verts'] for f in v.link_faces}:
        f.material_index = 0
    star(bm, c + n * 0.0045 + b * 0.012, n, 0.014, 0.0065, 0.002, 1, 5)
    ob = C.new_obj('COS_tet_lixi', bm, [mat('lixi_red', srgb('#D0021B'), 0.45), mat('lixi_gold', srgb('#F2C14E'), 0.3, 0.7)])
    C.finish_rigid(ob, 'ATT_HAND_R')
    return ob


ITEMS = [  # id, slot, name, hides, outfit, note
    ('sports_jersey', 'BODY', 'Sports jersey', [], 'sports', 'skinned with the body weights; sleeveless; V-neck; strap cut-outs'),
    ('sports_sneakers', 'FEET', 'Sports sneakers', [], 'sports', 'skinned with the leg weights; soles never below the floor'),
    ('explorer_hat', 'HEAD', 'Safari hat', ['FOX_Tuft'], 'explorer', 'rigid on ATT_HAT (HEAD); domed crown in front of the ears, side brim'),
    ('mage_hat', 'HEAD', 'Mage hat', ['FOX_Tuft'], 'mage', 'rigid on ATT_HAT (HEAD); pointed cone between the ears with a floppy tip folded back (low, stays in frame at Lv30)'),
    ('mage_capelet', 'BACK', 'Mage capelet', ['FOX_Backpack'], 'mage', 'skinned with the body weights, 12 mm off the body (layers over BODY items); replaces the backpack'),
    ('mage_wand', 'HAND_RIGHT', 'Star wand', [], 'mage', 'rigid on ATT_HAND_R (PAW_R); hand-busy rules apply'),
    ('ninja_headband', 'HEAD', 'Ninja headband', [], 'ninja', 'rigid on HEAD; steel plate, knot tails at the back'),
    ('ninja_gi', 'BODY', 'Ninja gi', [], 'ninja', 'skinned with the body / arm weights; obi belt; lapel trim'),
    ('ninja_scroll', 'BACK', 'Ninja scroll', ['FOX_Backpack'], 'ninja', 'rigid on ATT_BACKPACK (SPINE); default strap path re-coloured; replaces the backpack'),
    ('tet_khan_dong', 'HEAD', 'Khăn đóng (Tết)', ['FOX_Tuft'], 'tet', 'rigid on ATT_HAT (HEAD); crown + wrapped band'),
    ('tet_ao_dai', 'BODY', 'Áo dài top (Tết)', [], 'tet', 'skinned with the body / arm weights; 3/4 sleeves, gold trim'),
    ('tet_lixi', 'HAND_RIGHT', 'Lì xì envelope', [], 'tet', 'rigid on ATT_HAND_R (PAW_R); hand-busy rules apply'),
]


def main():
    bpy.ops.wm.open_mainfile(filepath=C.SRC)
    C.O = bpy.data.objects
    subs = [m for o in C.O for m in o.modifiers if m.type == 'SUBSURF' and m.show_viewport]
    for m in subs:
        m.show_viewport = False
    rig = C.O['FOX_RIG']
    rig.animation_data_create(); rig.animation_data.action = None
    for pb in rig.pose.bones:
        pb.matrix_basis.identity()
    bpy.context.view_layer.update()
    Hv, Hp, Hn = C.cage('FOX_Head')
    H = BVHTree.FromPolygons(Hv, Hp)
    built = {'sports_jersey': sports_jersey(), 'sports_sneakers': sports_sneakers(), 'explorer_hat': explorer_hat(H), 'mage_hat': mage_hat(H),
             'mage_capelet': mage_capelet(), 'mage_wand': mage_wand(), 'ninja_headband': ninja_headband(H), 'ninja_gi': ninja_gi(),
             'ninja_scroll': ninja_scroll(), 'tet_khan_dong': tet_khan_dong(H), 'tet_ao_dai': tet_ao_dai(), 'tet_lixi': tet_lixi()}
    os.makedirs(GLB_DIR, exist_ok=True); os.makedirs(OUT_DIR, exist_ok=True)
    cat = {'asset': 'LifeQuest Fox V2', 'gate': 'H2', 'kind': 'cosmetic outfit library (new items; Student / Sports / Explorer also use H1 items)',
           'source_rig': '03_RIG/fox_rig_d1_1.blend', 'binding': 'same as H1: one skinned mesh per item on the canonical armature', 'items': {}}
    for iid, slot, name, hides, outfit, note in ITEMS:
        ob = built[iid]
        ob.name = f'COS_{iid}'; ob.data.name = f'COS_{iid}'
        path = C.export_item(ob, iid)
        me = ob.data
        groups = sorted({ob.vertex_groups[g.group].name for v in me.vertices for g in v.groups if g.weight > 0.01})
        ws = [v.co for v in me.vertices]
        lo = [min(p[i] for p in ws) for i in range(3)]; hi = [max(p[i] for p in ws) for i in range(3)]
        cat['items'][iid] = {'slot': slot, 'name': name, 'file': f'cosmetics/{iid}.glb', 'socket': C.SOCKET_OF.get(f'COS_{iid}'), 'bytes': os.path.getsize(path),
                             'hides': hides, 'bones': groups, 'triangles': sum(len(p.vertices) - 2 for p in me.polygons), 'vertices': len(me.vertices),
                             'materials': [m.name for m in me.materials], 'outfit': outfit, 'fixture': False,
                             'rest_bounds_threejs': {'min': [round(lo[0], 4), round(lo[2], 4), round(-hi[1], 4)], 'max': [round(hi[0], 4), round(hi[2], 4), round(-lo[1], 4)]},
                             'note': note}
        print(f'  {iid:18s} {slot:10s} tris {cat["items"][iid]["triangles"]:5d}  bones {groups[:6]}{"…" if len(groups) > 6 else ""}  {cat["items"][iid]["bytes"]} B', flush=True)
    for m in subs:
        m.show_viewport = True
    bpy.context.scene['fox_gate'] = 'H2 cosmetic outfit library'
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(OUT_DIR, 'fox_cosmetics_h2.blend'), compress=True)
    json.dump(cat, open(os.path.join(OUT_DIR, 'cosmetic_catalog_h2.json'), 'w'), indent=2)
    print('saved')


if __name__ == '__main__':
    main()
