"""Gate H1 — prototype cosmetic / equipment assets for the approved Fox V2 (no change to the canonical Fox).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/cosmetics_h1.py
Reads   03_RIG/fox_rig_d1_1.blend   (canonical rig + model — never written)
Writes  05_COSMETICS/h1_prototypes/fox_cosmetics_h1.blend              (canonical rig + the cosmetic meshes, for review)
        06_EXPORTS/glb/cosmetics/<item>.glb                             (one GLB per item: canonical armature + one skinned mesh)
        05_COSMETICS/h1_prototypes/cosmetic_catalog_h1.json             (slot contract data per item)

Every cosmetic is a SKINNED mesh on the canonical armature, so one runtime path binds them all to the live Fox
skeleton by bone name:
  * rigid accessories carry a single weight (1.0) on the deform bone that rigidly carries their socket (ATT_GLASSES /
    ATT_HAT -> HEAD, ATT_BACKPACK -> SPINE, ATT_HAND_R -> PAW_R; TAIL_03 for the tail fixture) — they move exactly with that bone, cannot detach and follow the uniform level scale;
  * wearables (jacket, slot-test sneakers) are offset copies of the Fox's own cage geometry and keep ITS vertex weights,
    so they deform with the body through every clip.
Shapes are measured on the runtime cage (subdivision off = the geometry in the approved E2 GLB): the cap sits in front
of the ears, the headband runs in a tilted plane below the ear roots, the glasses sit in front of the eyes, the jacket
leaves cut-outs under the (rigid) default backpack straps.
"""
import json
import math
import os
import sys

import bpy  # noqa: E402  (bpy first: it registers bmesh / mathutils)
import bmesh  # noqa: E402
import numpy as np
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(ROOT, '03_RIG', 'fox_rig_d1_1.blend')
COS_DIR = os.path.join(ROOT, '05_COSMETICS', 'h1_prototypes')
GLB_DIR = os.path.join(ROOT, '06_EXPORTS', 'glb', 'cosmetics')
OUT_BLEND = os.path.join(COS_DIR, 'fox_cosmetics_h1.blend')

O = None


def cage(name):
    """Evaluated runtime-cage vertices / polygons / vertex normals of a Fox mesh at rest (world = armature space)."""
    dg = bpy.context.evaluated_depsgraph_get()
    e = O[name].evaluated_get(dg)
    m = e.to_mesh()
    M = e.matrix_world.copy()
    N3 = M.to_3x3().inverted().transposed()
    v = [M @ x.co for x in m.vertices]
    n = [(N3 @ x.normal).normalized() for x in m.vertices]
    p = [tuple(f.vertices) for f in m.polygons]
    e.to_mesh_clear()
    return v, p, n


def material(name, color, rough=0.55, metal=0.0, alpha=1.0, emit=None):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1.0)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if alpha < 1.0:
        b.inputs['Alpha'].default_value = alpha
        m.blend_method = 'BLEND' if hasattr(m, 'blend_method') else None
        try:
            m.surface_render_method = 'BLENDED'
        except Exception:
            pass
    if emit:
        b.inputs['Emission Color'].default_value = (*emit[0], 1.0)
        b.inputs['Emission Strength'].default_value = emit[1]
    return m


def srgb(h):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c)


def new_obj(name, bm, mats):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    for m in mats:
        me.materials.append(m)
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    for p in me.polygons:
        p.use_smooth = True
    return ob


SOCKET_OF = {}


def deform_bone(name):
    """Socket bones (ATT_*) are non-deform and never keyed in any approved clip (verified by cosmetics_h1 QA): they are
    rigid children of a deform bone. A skin may only use deform bones (Blender's Armature modifier ignores the others),
    so a rigid item is weighted to the socket's deform parent — the identical rigid motion — and the socket is recorded
    in the catalog as the item's attachment point."""
    b = O['FOX_RIG'].data.bones[name]
    while not b.use_deform:
        b = b.parent
    return b.name


def finish_rigid(ob, socket):
    """Single-bone skin (rigid attachment): every vertex 1.0 on the socket's deform bone."""
    bone = deform_bone(socket)
    SOCKET_OF[ob.name] = socket
    g = ob.vertex_groups.new(name=bone)
    g.add(list(range(len(ob.data.vertices))), 1.0, 'REPLACE')
    attach(ob)


def attach(ob):
    ob.parent = O['FOX_RIG']
    md = ob.modifiers.new('Armature', 'ARMATURE')
    md.object = O['FOX_RIG']


def tube(bm, pts, r, mat_index=0, seg=8, closed=False):
    """Swept circle along a polyline (frames by parallel transport)."""
    rings = []
    up = Vector((0, 0, 1))
    n = len(pts)
    for i, p in enumerate(pts):
        t = (pts[min(n - 1, i + 1)] - pts[max(0, i - 1)]).normalized() if not closed else (pts[(i + 1) % n] - pts[i - 1]).normalized()
        a = t.cross(up)
        if a.length < 1e-4:
            a = t.cross(Vector((1, 0, 0)))
        a.normalize()
        b = t.cross(a).normalized()
        rings.append([bm.verts.new(p + r * (math.cos(2 * math.pi * k / seg) * a + math.sin(2 * math.pi * k / seg) * b)) for k in range(seg)])
    last = n if closed else n - 1
    for i in range(last):
        r0, r1 = rings[i], rings[(i + 1) % n]
        for k in range(seg):
            f = bm.faces.new((r0[k], r0[(k + 1) % seg], r1[(k + 1) % seg], r1[k]))
            f.material_index = mat_index
    if not closed:
        for rr, rev in ((rings[0], True), (rings[-1], False)):
            f = bm.faces.new(list(reversed(rr)) if rev else rr)
            f.material_index = mat_index


def torus(bm, center, axis, R, r, mat_index=0, seg=40, sides=8):
    axis = axis.normalized()
    a = axis.cross(Vector((0, 0, 1)))
    if a.length < 1e-4:
        a = axis.cross(Vector((1, 0, 0)))
    a.normalize()
    b = axis.cross(a)
    pts = [center + R * (math.cos(2 * math.pi * k / seg) * a + math.sin(2 * math.pi * k / seg) * b) for k in range(seg)]
    tube(bm, pts, r, mat_index, sides, closed=True)
    return pts


def disk(bm, center, axis, R, mat_index=0, seg=40):
    axis = axis.normalized()
    a = axis.cross(Vector((0, 0, 1)))
    if a.length < 1e-4:
        a = axis.cross(Vector((1, 0, 0)))
    a.normalize()
    b = axis.cross(a)
    vs = [bm.verts.new(center + R * (math.cos(2 * math.pi * k / seg) * a + math.sin(2 * math.pi * k / seg) * b)) for k in range(seg)]
    f = bm.faces.new(vs)
    f.material_index = mat_index


def rounded_box(bm, lo, hi, mat_index=0, bevel=0.025):
    g = bmesh.ops.create_cube(bm, size=1.0)
    vs = g['verts']
    c = (Vector(lo) + Vector(hi)) / 2
    s = Vector(hi) - Vector(lo)
    for v in vs:
        v.co = Vector((c.x + v.co.x * s.x, c.y + v.co.y * s.y, c.z + v.co.z * s.z))
    edges = list({e for v in vs for e in v.link_edges})
    bmesh.ops.bevel(bm, geom=edges + vs, offset=bevel, segments=4, affect='EDGES', profile=0.5)
    for f in bm.faces:                       # tag = 'already assigned'; new (untagged) faces get this box's material
        if not f.tag:
            f.material_index = mat_index
            f.tag = True


def inside(T, p):
    loc, nrm, _, _ = T.find_nearest(p)
    return loc is not None and (p - loc).dot(nrm) < 0


def ray_head(H, origin, direction):
    hit = H.ray_cast(origin, direction.normalized(), 2.0)
    return hit[0], hit[1]


# ================================================================== items
def student_glasses(H):
    """Round student glasses in front of the eyes; bridge over the nose top; temples hugging the head sides."""
    bm = bmesh.new()
    frame, lens = 0, 1
    for sx in (1, -1):
        cx, cz = 0.107 * sx, 0.613
        hp, hn = ray_head(H, Vector((cx, 0.0, cz)), Vector((0, -1, 0)))
        yr = min(hp.y, -0.289) - 0.011                     # 1.1 cm in front of the eye surface
        nrm = Vector((hn.x * 0.6, -1, 0)).normalized()     # rim plane follows the face curvature a little
        ctr = Vector((cx, yr, cz))
        torus(bm, ctr, nrm, 0.052, 0.0058, frame, 44, 8)
        disk(bm, ctr + 0.001 * nrm, nrm, 0.049, lens, 36)
        # temple: from the outer rim edge back along the head surface (4 mm off), ending toward the ear line
        pts = []
        for k in range(7):
            ang = math.radians(-62 + 10 * k) if sx > 0 else math.radians(180 + 62 - 10 * k)
            d = Vector((math.cos(ang), math.sin(ang), 0)) if sx > 0 else Vector((math.cos(ang), math.sin(ang), 0))
            p, n = ray_head(H, Vector((0, 0.02, cz + 0.01)), d)
            pts.append(p + 0.005 * n)
        start = ctr + 0.052 * Vector((sx, 0.25, 0)).normalized()
        tube(bm, [start] + pts[1:], 0.0042, frame, 6)
    # bridge: arc over the nose top
    a = Vector((0.056, -0.302, 0.627)); b = Vector((-0.056, -0.302, 0.627))
    pts = [a.lerp(b, u) + Vector((0, -0.012 * math.sin(math.pi * u), 0.012 * math.sin(math.pi * u))) for u in [i / 8 for i in range(9)]]
    tube(bm, pts, 0.0045, frame, 6)
    ob = new_obj('COS_student_glasses', bm, [material('glasses_frame', srgb('#16324A'), 0.35), material('glasses_lens', srgb('#CFEFFF'), 0.08, alpha=0.28)])
    finish_rigid(ob, 'ATT_GLASSES')
    return ob


def student_cap(H, Hv, Hp, Hn):
    """School cap on the front of the head top, in front of the ears (their front edge is at y ≈ −0.04): crown = the
    head surface patch offset 7 mm with 4 mm thickness, a forward brim, a button and a band. Hides the hair tuft."""
    bm = bmesh.new()
    # crown: polar grid of rays from inside the head around a forward-tilted crown axis; the footprint edge per angle is
    # the widest ray whose hit stays in front of the ears (y < -0.085) and above the brow line (z > 0.738) -> smooth rim
    C = Vector((0, -0.02, 0.62))
    AX = Vector((0, -0.25, 1)).normalized()
    U = Vector((1, 0, 0)); W_ = AX.cross(U).normalized()
    ok = lambda q: q is not None and q.y < -0.085 and q.z > 0.738
    NPHI, NR = 64, 12
    amax = []
    for i in range(NPHI):
        ph = 2 * math.pi * i / NPHI
        lo, hi = 0.0, 1.4
        for _ in range(22):
            mid = (lo + hi) / 2
            d = math.cos(mid) * AX + math.sin(mid) * (math.cos(ph) * U + math.sin(ph) * W_)
            if ok(ray_head(H, C, d)[0]):
                lo = mid
            else:
                hi = mid
        amax.append(lo)
    amax = [sum(amax[(i + k) % NPHI] for k in (-2, -1, 0, 1, 2)) / 5 for i in range(NPHI)]   # soften the outline
    grid_o, grid_i = [], []
    for r in range(NR + 1):
        ro, ri = [], []
        for i in range(NPHI if r else 1):
            ph = 2 * math.pi * i / NPHI
            al = amax[i] * r / NR
            d = math.cos(al) * AX + math.sin(al) * (math.cos(ph) * U + math.sin(ph) * W_)
            q, qn = ray_head(H, C, d)
            lift = 0.006 + 0.020 * (1 - (r / NR) ** 2.2)                      # soft crown volume, thin at the rim
            ro.append(bm.verts.new(q + lift * qn)); ri.append(bm.verts.new(q + 0.003 * qn))
        grid_o.append(ro); grid_i.append(ri)
    for G_, flip in ((grid_o, False), (grid_i, True)):
        for i in range(NPHI):
            j = (i + 1) % NPHI
            f = (G_[0][0], G_[1][i], G_[1][j])
            bm.faces.new(tuple(reversed(f)) if flip else f).material_index = 0
            for r in range(1, NR):
                q = (G_[r][i], G_[r + 1][i], G_[r + 1][j], G_[r][j])
                f2 = bm.faces.new(tuple(reversed(q)) if flip else q)
                f2.material_index = 1 if r >= NR - 1 else 0          # band colour on the last ring
    for i in range(NPHI):
        j = (i + 1) % NPHI
        bm.faces.new((grid_o[NR][j], grid_o[NR][i], grid_i[NR][i], grid_i[NR][j])).material_index = 1
    # brim: inner edge on the head surface at the crown's front base, extended forward and slightly down
    inner, outer_e = [], []
    for k in range(15):
        x = -0.135 + 0.27 * k / 14
        p, n = ray_head(H, Vector((x, 0.0, 0.745)), Vector((0, -1, 0.02)))
        L = 0.012 + 0.062 * math.sqrt(max(0.0, 1 - (x / 0.15) ** 2))
        inner.append(p + 0.004 * n)
        outer_e.append(p + 0.004 * n + Vector((0, -L, -0.012 * L / 0.07)))
    t = Vector((0, 0, 0.004))
    top = [bm.verts.new(v + t) for v in inner], [bm.verts.new(v + t) for v in outer_e]
    bot = [bm.verts.new(v - t) for v in inner], [bm.verts.new(v - t) for v in outer_e]
    for k in range(14):
        for (A, B, flip) in ((top, None, False), (bot, None, True)):
            q = (A[0][k], A[0][k + 1], A[1][k + 1], A[1][k])
            f = bm.faces.new(tuple(reversed(q)) if flip else q); f.material_index = 2
        f = bm.faces.new((top[1][k], top[1][k + 1], bot[1][k + 1], bot[1][k])); f.material_index = 2
    for side in (0, 14):
        try:
            f = bm.faces.new((top[0][side], top[1][side], bot[1][side], bot[0][side])); f.material_index = 2
        except ValueError:
            pass
    # button on the crown top
    tp, tn = ray_head(H, C, AX)
    g = bmesh.ops.create_uvsphere(bm, u_segments=12, v_segments=8, radius=0.012)
    for v in g['verts']:
        v.co = v.co + tp + 0.027 * tn
    for f in {f for v in g['verts'] for f in v.link_faces}:
        f.material_index = 3
    ob = new_obj('COS_student_cap', bm, [material('cap_crown', srgb('#24406B'), 0.7), material('cap_band', srgb('#F26B3A'), 0.6),
                                         material('cap_brim', srgb('#1B2F50'), 0.6), material('cap_button', srgb('#F6C85F'), 0.4)])
    finish_rigid(ob, 'ATT_HAT')
    return ob


def sports_headband(H):
    """Headband in a tilted plane: across the forehead under the hair tuft (centre z 0.715; eyes end at z 0.662) and low at the back (z 0.52),
    passing >= 3 cm under the ear roots at the sides. 24 mm wide; each edge row is ray-cast onto the head separately,
    so the inner face stays 1.5 mm off the surface across the whole width (no edge sinking into the curved head)."""
    bm = bmesh.new()
    zf, zb, yf, yb = 0.715, 0.52, -0.26, 0.30
    slope = (zf - zb) / (yb - yf)
    n = Vector((0, slope, 1)).normalized()
    c = Vector((0, 0.02, zf - (0.02 - yf) * slope))
    u = Vector((1, 0, 0)); v = n.cross(u).normalized()
    SEG, W = 72, 0.012
    rows = []
    for off in (W, -W):
        ro, ri = [], []
        for k in range(SEG):
            a = 2 * math.pi * k / SEG
            p, hn = ray_head(H, c + off * n, math.cos(a) * u + math.sin(a) * v)
            ro.append(p + 0.0075 * hn); ri.append(p + 0.0015 * hn)
        rows.append((ro, ri))
    R = [[bm.verts.new(p) for p in rows[0][0]], [bm.verts.new(p) for p in rows[1][0]],
         [bm.verts.new(p) for p in rows[1][1]], [bm.verts.new(p) for p in rows[0][1]]]
    for k in range(SEG):
        k1 = (k + 1) % SEG
        for r in range(4):
            A_, B_ = R[r], R[(r + 1) % 4]
            f = bm.faces.new((A_[k], A_[k1], B_[k1], B_[k]))
            f.material_index = 1 if r == 0 and (k % 18) < 2 else 0          # four white stripe marks
    ob = new_obj('COS_sports_headband', bm, [material('band_teal', srgb('#168C78'), 0.8), material('band_white', srgb('#FFFFFF'), 0.8)])
    finish_rigid(ob, 'HEAD')
    return ob


def explorer_backpack():
    """Bigger explorer pack (tan canvas, flap, side bottle pocket, lash straps, compass badge) on the SPINE like the
    default backpack (which it replaces); shoulder straps = the default strap geometry re-coloured (same path)."""
    bm = bmesh.new()
    # envelope kept inside the default backpack's depth and width (back face y <= 0.22, |x| <= 0.12 + bottle side): the tail's front surface comes to
    # y 0.19-0.25 behind the pack's -x half (measured on the rest cage). The pack is taller/wider-looking instead.
    rounded_box(bm, (-0.12, 0.125, 0.165), (0.12, 0.208, 0.35), 0, 0.03)
    rounded_box(bm, (-0.113, 0.19, 0.278), (0.113, 0.217, 0.355), 1, 0.014)      # flap (top = default pack top: the scarf roll is above)
    rounded_box(bm, (0.117, 0.14, 0.19), (0.153, 0.2, 0.29), 2, 0.012)           # side pocket (bottle)
    for v in bmesh.ops.create_cone(bm, cap_ends=True, segments=12, radius1=0.015, radius2=0.015, depth=0.07)['verts']:
        v.co = Vector((v.co.x + 0.135, v.co.y + 0.17, v.co.z + 0.31))
    for f in bm.faces:
        if not f.tag:
            f.material_index = 4; f.tag = True
    for x in (-0.06, 0.06):                                                        # lash straps
        rounded_box(bm, (x - 0.011, 0.203, 0.175), (x + 0.011, 0.214, 0.285), 3, 0.004)
    g = bmesh.ops.create_cone(bm, cap_ends=True, segments=20, radius1=0.022, radius2=0.022, depth=0.006)
    R = Matrix.Rotation(math.pi / 2, 4, 'X')
    for v in g['verts']:
        v.co = R @ v.co + Vector((0.02, 0.22, 0.318))
    for f in bm.faces:
        if not f.tag:
            f.material_index = 5; f.tag = True
    mats = [material('pack_canvas', srgb('#C89B5E'), 0.85), material('pack_flap', srgb('#8C6239'), 0.75), material('pack_pocket', srgb('#6E7B4A'), 0.8),
            material('pack_strap', srgb('#5A3D25'), 0.7), material('pack_bottle', srgb('#3EA2FF'), 0.3), material('pack_badge', srgb('#F6C85F'), 0.35, 0.6)]
    ob = new_obj('COS_explorer_backpack', bm, mats)
    # straps: default strap geometry (rigid on SPINE in the canonical model) re-coloured
    for s in ('L', 'R'):
        v, p, _ = cage(f'FOX_Backpack_Strap_{s}')
        sb = bmesh.new()
        vs = [sb.verts.new(x) for x in v]
        for f in p:
            try:
                sb.faces.new([vs[i] for i in f])
            except ValueError:
                pass
        tmp = new_obj(f'tmp_strap_{s}', sb, [mats[3]])
        bpy.ops.object.select_all(action='DESELECT')
        ob.select_set(True); tmp.select_set(True); bpy.context.view_layer.objects.active = ob
        tmp.data.materials.clear(); tmp.data.materials.append(mats[3])
        bpy.ops.object.join()
    # material index of the joined strap faces → strap material slot
    for poly in ob.data.polygons:
        if ob.material_slots[poly.material_index].material is None:
            poly.material_index = 3
    finish_rigid(ob, 'ATT_BACKPACK')
    return ob


def simple_jacket():
    """Open-front jacket = the Fox body cage between hips and scarf, offset 5 mm (+3 mm thickness), with the body's own
    weights; short sleeves from the upper arm cage; cut-outs under the default backpack straps so the straps read on top."""
    straps = []
    for s in ('L', 'R'):
        v, p, _ = cage(f'FOX_Backpack_Strap_{s}')
        straps.append(BVHTree.FromPolygons(v, p))
    bv, bp, _ = cage('FOX_Body')
    BODY = BVHTree.FromPolygons(bv, bp)
    parts = []
    # open front + V-neck: the default scarf flap hangs over the chest and swings onto it (SCARF_FLAP bone); the jacket
    # leaves the strip under it open (|x| < 0.052, widening to 0.10 above z 0.28)
    vneck = lambda p: p.y < -0.05 and abs(p.x) < 0.052 + max(0.0, (p.z - 0.24) / 0.11) * 0.05
    for src, keep_fn in (('FOX_Body', lambda p: 0.15 < p.z < 0.352 and not vneck(p)),
                         ('FOX_Arm_L', None), ('FOX_Arm_R', None)):
        ob = O[src].copy(); ob.data = O[src].data.copy(); ob.name = f'tmp_jacket_{src}'
        bpy.context.scene.collection.objects.link(ob)
        for m in list(ob.modifiers):
            if m.type != 'ARMATURE':
                ob.modifiers.remove(m)
        v, p, n = cage(src)
        bm = bmesh.new(); bm.from_mesh(ob.data); bm.verts.ensure_lookup_table()
        if src.startswith('FOX_Arm'):
            # short sleeve = the upper-arm part that is OUTSIDE the body (the arm cage continues hidden inside the torso
            # up to z 0.41; an offset copy of that hidden part would poke out beside the neck)
            sh = O['FOX_RIG'].data.bones['ARM_' + src[-1]].head_local
            keep = [((v[i] - sh).length < 0.07 and v[i].z < 0.335 and not inside(BODY, v[i] + 0.009 * n[i])) for i in range(len(v))]
        else:
            keep = [keep_fn(v[i]) for i in range(len(v))]
        for i, vert in enumerate(bm.verts):
            vert.co = v[i] + 0.005 * n[i]
        bm.faces.ensure_lookup_table()
        kill = []
        for f in bm.faces:
            if not all(keep[x.index] for x in f.verts):
                kill.append(f); continue
            c = sum((v[x.index] for x in f.verts), Vector()) / len(f.verts)
            if src == 'FOX_Body' and any(T.find_nearest(c)[3] < 0.012 for T in straps):
                kill.append(f)                                           # strap cut-out
        bmesh.ops.delete(bm, geom=kill, context='FACES')
        bmesh.ops.delete(bm, geom=[x for x in bm.verts if not x.link_faces], context='VERTS')
        ext = bmesh.ops.extrude_face_region(bm, geom=list(bm.faces))
        nv = [g for g in ext['geom'] if isinstance(g, bmesh.types.BMVert)]
        for x in nv:
            x.co = x.co + 0.003 * x.normal
        bmesh.ops.recalc_face_normals(bm, faces=list(bm.faces))
        bm.to_mesh(ob.data); bm.free()
        ob.data.materials.clear()
        ob.parent = None
        ob.matrix_world = Matrix.Identity(4)                         # vertices are already in armature (world) space
        parts.append(ob)
    jac = parts[0]
    bpy.ops.object.select_all(action='DESELECT')
    for ob in parts:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = jac
    bpy.ops.object.join()
    jac.name = 'COS_simple_jacket'
    jac.data.materials.append(material('jacket_teal', srgb('#1E7F8C'), 0.8))
    for poly in jac.data.polygons:
        poly.use_smooth = True
        poly.material_index = 0
    jac.parent = O['FOX_RIG']
    for m in jac.modifiers:
        if m.type == 'ARMATURE':
            m.object = O['FOX_RIG']
    return jac


def explorer_magnifier():
    """Handheld magnifying glass in the right paw (socket ATT_HAND_R): handle through the paw tip, lens forward-up."""
    bm = bmesh.new()
    tip = O['FOX_RIG'].data.bones['ATT_HAND_R'].head_local
    d = Vector((-0.25, -0.75, 0.62)).normalized()
    a = tip + Vector((0.004, -0.004, -0.006)) - 0.03 * d
    b = a + 0.095 * d
    tube(bm, [a, a.lerp(b, 0.5), b], 0.0075, 0, 8)
    ctr = b + 0.045 * d
    torus(bm, ctr, Vector((0.35, -0.55, -0.75)), 0.038, 0.006, 1, 36, 8)
    disk(bm, ctr, Vector((0.35, -0.55, -0.75)), 0.036, 2, 32)
    ob = new_obj('COS_explorer_magnifier', bm, [material('mag_handle', srgb('#7A4B2A'), 0.6), material('mag_rim', srgb('#C9A13B'), 0.3, 0.7),
                                                 material('mag_lens', srgb('#DDF3FF'), 0.05, alpha=0.3)])
    finish_rigid(ob, 'ATT_HAND_R')
    return ob


def slot_test_sneakers():
    """FEET slot test fixture: shoe shells = leg cage below the ankle, offset 4 mm upward/outward (soles not lowered),
    the legs' own weights (FOOT / LEG)."""
    parts = []
    for s in ('L', 'R'):
        src = f'FOX_Leg_{s}'
        ob = O[src].copy(); ob.data = O[src].data.copy(); ob.name = f'tmp_shoe_{s}'
        bpy.context.scene.collection.objects.link(ob)
        for m in list(ob.modifiers):
            if m.type != 'ARMATURE':
                ob.modifiers.remove(m)
        v, p, n = cage(src)
        bm = bmesh.new(); bm.from_mesh(ob.data); bm.verts.ensure_lookup_table()
        for i, vert in enumerate(bm.verts):
            off = n[i] * 0.004
            if off.z < 0:
                off.z = 0.0                                        # never push the sole below the floor
            vert.co = v[i] + off
        bm.faces.ensure_lookup_table()
        bmesh.ops.delete(bm, geom=[f for f in bm.faces if not all(v[x.index].z < 0.058 for x in f.verts)], context='FACES')
        bmesh.ops.delete(bm, geom=[x for x in bm.verts if not x.link_faces], context='VERTS')
        for f in bm.faces:
            f.material_index = 1 if sum(v_.co.z for v_ in f.verts) / len(f.verts) < 0.012 else 0
        bm.to_mesh(ob.data); bm.free()
        ob.data.materials.clear()
        ob.parent = None
        ob.matrix_world = Matrix.Identity(4)                         # vertices are already in armature (world) space
        parts.append(ob)
    sh = parts[0]
    bpy.ops.object.select_all(action='DESELECT')
    for ob in parts:
        ob.select_set(True)
    bpy.context.view_layer.objects.active = sh
    bpy.ops.object.join()
    sh.name = 'COS_slot_test_sneakers'
    sh.data.materials.append(material('shoe_white', srgb('#F4F4F4'), 0.6))
    sh.data.materials.append(material('shoe_sole', srgb('#F26B3A'), 0.7))
    sh.parent = O['FOX_RIG']
    return sh


def slot_test_tail_ribbon():
    """TAIL slot test fixture: a bow on the upper surface of the tail at the middle of TAIL_03 (rigid on TAIL_03), 4 mm
    off the fur. (A ring around the whole tail was tried first: the fluffy tail is 27 cm thick there, the ring went
    35-40 mm deeper into the floor than the Fox itself in the sleep transitions.)"""
    tv, tp, tn = cage('FOX_Tail')
    T = BVHTree.FromPolygons(tv, tp)
    bone = O['FOX_RIG'].data.bones['TAIL_03']
    h, t = bone.head_local, bone.tail_local
    axis = (t - h).normalized()
    c = h.lerp(t, 0.5)
    a = axis.cross(Vector((0, 0, 1))).normalized(); up = a.cross(axis).normalized()
    if up.z < 0:
        up = -up
    hit, hn = T.ray_cast(c + up * 0.4, -up, 1.0)[:2]
    top = hit + 0.004 * hn
    bm = bmesh.new()
    for sgn in (1, -1):                                             # two loops of the bow, lying on the fur
        torus(bm, top + hn * 0.021 + sgn * 0.024 * a, hn.cross(a).normalized(), 0.017, 0.006, 0, 20, 6)
    g = bmesh.ops.create_uvsphere(bm, u_segments=10, v_segments=6, radius=0.011)
    for v in g['verts']:
        v.co = v.co + top + hn * 0.015
    ob = new_obj('COS_slot_test_tail_ribbon', bm, [material('ribbon_pink', srgb('#FF7AA8'), 0.6)])
    finish_rigid(ob, 'TAIL_03')
    return ob


# ================================================================== catalog (slot contract data)
ITEMS = [
    # id, builder, slot, display name, hides default meshes, notes
    ('student_glasses', 'FACE', 'Student glasses', [], 'rigid on ATT_GLASSES'),
    ('student_cap', 'HEAD', 'Student cap', ['FOX_Tuft'], 'rigid on ATT_HAT; sits in front of the ears; hides the hair tuft'),
    ('sports_headband', 'HEAD', 'Sports headband', [], 'rigid on HEAD; tilted plane under the ear roots'),
    ('explorer_backpack', 'BACK', 'Explorer backpack', ['FOX_Backpack'], 'rigid on SPINE; replaces the default backpack (and its straps)'),
    ('simple_jacket', 'BODY', 'Simple jacket', [], 'skinned with the body / arm weights; strap cut-outs'),
    ('explorer_magnifier', 'HAND_RIGHT', 'Explorer magnifier', [], 'rigid on ATT_HAND_R; hidden while the right paw holds a temporary animation prop'),
    ('slot_test_sneakers', 'FEET', 'Slot test: sneakers', [], 'TECHNICAL FIXTURE (not library content): skinned with the leg weights'),
    ('slot_test_tail_ribbon', 'TAIL', 'Slot test: tail ribbon', [], 'TECHNICAL FIXTURE (not library content): rigid on TAIL_03'),
]


def export_item(ob, iid):
    bpy.ops.object.select_all(action='DESELECT')
    O['FOX_RIG'].select_set(True); ob.select_set(True)
    bpy.context.view_layer.objects.active = O['FOX_RIG']
    path = os.path.join(GLB_DIR, f'{iid}.glb')
    bpy.ops.export_scene.gltf(filepath=path, export_format='GLB', use_selection=True, export_apply=False, export_yup=True, export_texcoords=False,
                              export_normals=True, export_materials='EXPORT', export_skins=True, export_def_bones=False, export_morph=False,
                              export_animations=False, export_lights=False, export_cameras=False, export_extras=True)
    return path


def main():
    global O
    bpy.ops.wm.open_mainfile(filepath=SRC)
    O = bpy.data.objects
    subs = [m for o in O for m in o.modifiers if m.type == 'SUBSURF' and m.show_viewport]
    for m in subs:
        m.show_viewport = False                                     # runtime cage
    rig = O['FOX_RIG']
    rig.animation_data_create(); rig.animation_data.action = None
    for pb in rig.pose.bones:
        pb.matrix_basis.identity()
    bpy.context.view_layer.update()
    Hv, Hp, Hn = cage('FOX_Head')
    H = BVHTree.FromPolygons(Hv, Hp)
    built = {
        'student_glasses': student_glasses(H), 'student_cap': student_cap(H, Hv, Hp, Hn), 'sports_headband': sports_headband(H),
        'explorer_backpack': explorer_backpack(), 'simple_jacket': simple_jacket(), 'explorer_magnifier': explorer_magnifier(),
        'slot_test_sneakers': slot_test_sneakers(), 'slot_test_tail_ribbon': slot_test_tail_ribbon(),
    }
    os.makedirs(GLB_DIR, exist_ok=True); os.makedirs(COS_DIR, exist_ok=True)
    cat = {'asset': 'LifeQuest Fox V2', 'gate': 'H1', 'kind': 'cosmetic prototypes (technical validation set)', 'source_rig': '03_RIG/fox_rig_d1_1.blend',
           'binding': 'every item = one skinned mesh on the canonical armature (glTF skin); rigid items carry one weight (1.0) on the deform bone that rigidly carries their socket (sockets are non-deform, never keyed)',
           'items': {}}
    for iid, slot, name, hides, note in ITEMS:
        ob = built[iid]
        ob.name = f'COS_{iid}'; ob.data.name = f'COS_{iid}'   # node + mesh named after the item (never FOX_*)
        path = export_item(ob, iid)
        me = ob.data
        groups = sorted({ob.vertex_groups[g.group].name for v in me.vertices for g in v.groups if g.weight > 0.01})
        ws = [v.co for v in me.vertices]
        lo = [min(p[i] for p in ws) for i in range(3)]; hi = [max(p[i] for p in ws) for i in range(3)]
        cat['items'][iid] = {'slot': slot, 'name': name, 'file': f'cosmetics/{iid}.glb', 'socket': SOCKET_OF.get(f'COS_{iid}'), 'bytes': os.path.getsize(path), 'hides': hides,
                             'bones': groups, 'triangles': sum(len(p.vertices) - 2 for p in me.polygons), 'vertices': len(me.vertices),
                             'materials': [m.name for m in me.materials],
                             'rest_bounds_threejs': {'min': [round(lo[0], 4), round(lo[2], 4), round(-hi[1], 4)], 'max': [round(hi[0], 4), round(hi[2], 4), round(-lo[1], 4)]},
                             'fixture': iid.startswith('slot_test'), 'note': note}
        print(f'  {iid:24s} {slot:10s} tris {cat["items"][iid]["triangles"]:5d}  bones {groups}  {cat["items"][iid]["bytes"]} B', flush=True)
    for m in subs:
        m.show_viewport = True
    bpy.context.scene['fox_gate'] = 'H1 cosmetic prototypes'
    bpy.ops.wm.save_as_mainfile(filepath=OUT_BLEND, compress=True)
    json.dump(cat, open(os.path.join(COS_DIR, 'cosmetic_catalog_h1.json'), 'w'), indent=2)
    print('saved', OUT_BLEND)


if __name__ == '__main__':
    main()
