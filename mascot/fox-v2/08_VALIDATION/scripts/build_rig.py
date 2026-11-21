"""Gate D1 — build the interactive rig prototype.

Usage (from LifeQuest_Fox_V2/):
    python 08_VALIDATION/scripts/build_rig.py
Reads   02_MODEL/fox_master.blend      (never modified)
Writes  03_RIG/fox_rig_prototype.blend, 03_RIG/skeleton_spec.json,
        03_RIG/attachment_points.json

Rig strategy (simple, web-friendly, chibi-safe):
* rigid bone-parenting for parts that must never deform: the head (with
  tuft, eyes, nose, mouths, blush, brows) on HEAD, the backpack hierarchy on
  SPINE;
* smooth skin (Armature modifier + procedural weights) for body, arms, legs,
  ears, tail and scarf;
* FACE control bone with custom properties that drive the eye/brow shape keys
  and the expression swap meshes;
* non-deforming ATT_* bones for future cosmetics.
"""
import json
import math
import os
import sys

import bpy
from mathutils import Vector, Matrix, Quaternion

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT_DIR = os.path.abspath(os.path.join(HERE, '..', '..'))
sys.path.insert(0, HERE)
import foxlib as fl  # noqa: E402

MASTER = os.path.join(ROOT_DIR, '02_MODEL', 'fox_master.blend')
OUT = os.path.join(ROOT_DIR, '03_RIG', 'fox_rig_prototype.blend')

# Tail spine — identical to build_modules.build_tail (Gate C r4); checked
# against FOX_Tail's origin below.
TAIL_SPINE = [(-0.02, 0.07, 0.15), (-0.07, 0.18, 0.115), (-0.14, 0.265, 0.13), (-0.205, 0.325, 0.205),
              (-0.245, 0.345, 0.30), (-0.258, 0.337, 0.39), (-0.252, 0.322, 0.44), (-0.240, 0.308, 0.47)]


def smoothstep(e0, e1, x):
    if e1 == e0:
        return 1.0 if x >= e1 else 0.0
    t = min(1.0, max(0.0, (x - e0) / (e1 - e0)))
    return t * t * (3 - 2 * t)


# --------------------------------------------------------------- geometry
def world_verts(obj):
    mw = obj.matrix_world
    return [mw @ v.co for v in obj.data.vertices]


def farthest(obj, origin):
    vs = world_verts(obj)
    return max(vs, key=lambda p: (p - origin).length)


def spine_samples():
    pts = [fl.catmull_rom(TAIL_SPINE, k / 400) for k in range(401)]
    acc = [0.0]
    for a, b in zip(pts, pts[1:]):
        acc.append(acc[-1] + (b - a).length)
    return pts, acc


def tail_points(body_bvh, n_bones=4):
    """Tail chain starts where the spine leaves the body surface (pivot at the
    visible root, not buried inside the rump) and ends at the tip."""
    pts, acc = spine_samples()
    k0 = next(k for k, p in enumerate(pts) if signed_dist(body_bvh, p) > 0.0)
    s0, total = acc[k0], acc[-1]
    out = []
    for i in range(n_bones + 1):
        s = s0 + (total - s0) * i / n_bones
        j = min(range(len(acc)), key=lambda k: abs(acc[k] - s))
        out.append(pts[j].copy())
    return out


def signed_dist(tree, p):
    loc, n, _, _ = tree.find_nearest(Vector(p))
    return (Vector(p) - loc).dot(n)


def exit_point(tree, start, direction, step=0.002, max_len=0.5):
    d = direction.normalized()
    s = 0.0
    while s < max_len:
        p = start + d * s
        if signed_dist(tree, p) > 0.0:
            return p, s
        s += step
    return start, 0.0


# ------------------------------------------------------------------ chain
def chain_weights(p, pts, names, blends):
    """Arc-length parameter of p projected on polyline pts, then smooth
    partition of unity across consecutive segments (one name per segment).
    blends[j] = half-width (m) of the blend at joint j (between seg j, j+1)."""
    best = (1e9, 0.0)
    acc = 0.0
    seg_starts = []
    for a, b in zip(pts, pts[1:]):
        seg_starts.append(acc)
        ab = b - a
        L = ab.length
        u = 0.0 if L == 0 else max(0.0, min(1.0, (p - a).dot(ab) / (L * L)))
        d = (p - (a + ab * u)).length
        if d < best[0]:
            best = (d, acc + u * L)
        acc += L
    s = best[1]
    joints = seg_starts[1:]
    f = [smoothstep(j - b, j + b, s) for j, b in zip(joints, blends)]
    w = {}
    for i, n in enumerate(names):
        lo = 1.0 if i == 0 else f[i - 1]
        hi = f[i] if i < len(f) else 0.0
        w[n] = w.get(n, 0.0) + max(0.0, lo - hi)
    return w


def assign(obj, fn):
    for v, p in zip(obj.data.vertices, world_verts(obj)):
        w = fn(p)
        tot = sum(w.values()) or 1.0
        for name, val in w.items():
            if val <= 1e-4:
                continue
            g = obj.vertex_groups.get(name) or obj.vertex_groups.new(name=name)
            g.add([v.index], val / tot, 'REPLACE')


# ------------------------------------------------------------------ build
def build():
    bpy.ops.wm.open_mainfile(filepath=MASTER)
    scene = bpy.context.scene
    O = bpy.data.objects
    froot = O['FOX_ROOT']
    assert (O['FOX_Tail'].matrix_world.translation - Vector(TAIL_SPINE[0])).length < 1e-4, 'tail spine out of sync'

    # ---------------- reference points from the model itself
    head_bvh = fl.bvh_for(O['FOX_Head'])
    body_bvh = fl.bvh_for(O['FOX_Body'])
    ear = {}
    for s in ('L', 'R'):
        base = O[f'FOX_Ear_{s}'].matrix_world.translation.copy()
        tip = farthest(O[f'FOX_Ear_{s}'], base)
        ex, s_exit = exit_point(head_bvh, base, tip - base)
        # pivot where the ear leaves the skull -> the base bends instead of sliding
        ear[s] = (ex, ex + (tip - ex) * 0.5, tip, base, s_exit)
    arm = {}
    for s, sx in (('L', 1), ('R', -1)):
        sh = O[f'FOX_Arm_{s}'].matrix_world.translation.copy()
        end = farthest(O[f'FOX_Arm_{s}'], sh)
        p0 = Vector((sx * 0.095, 0.0, 0.365))
        ex, _ = exit_point(body_bvh, p0, end - p0)
        elbow = Vector((sx * 0.215, -0.012, 0.245))
        arm[s] = (p0, ex, elbow, end)       # shoulder pivot at the body surface
    tp = tail_points(body_bvh, 4)

    # ---------------- armature
    adata = bpy.data.armatures.new('FOX_RIG')
    adata.display_type = 'OCTAHEDRAL'
    rig = bpy.data.objects.new('FOX_RIG', adata)
    bpy.data.collections['RIG'].objects.link(rig)
    rig.parent = froot
    bpy.context.view_layer.objects.active = rig
    rig.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = adata.edit_bones
    spec = []

    def bone(name, head, tail, parent=None, deform=True, connect=False, inherit_scale='FULL', role=''):
        b = eb.new(name)
        b.head, b.tail = Vector(head), Vector(tail)
        b.roll = 0.0
        if parent:
            b.parent = eb[parent]
            b.use_connect = connect
        b.use_deform = deform
        b.inherit_scale = inherit_scale
        spec.append({'name': name, 'parent': parent, 'deform': deform,
                     'head': [round(x, 4) for x in head], 'tail': [round(x, 4) for x in tail],
                     'inherit_scale': inherit_scale, 'role': role})
        return b

    bone('ROOT', (0, 0, 0), (0, 0.18, 0), deform=False, role='global placement + uniform level scale')
    bone('HIPS', (0, 0, 0.13), (0, 0, 0.24), 'ROOT', role='body control; squash & stretch = scale')
    bone('SPINE', (0, 0, 0.24), (0, 0, 0.37), 'HIPS', connect=True, role='upper torso; backpack + scarf anchor')
    bone('NECK', (0, 0, 0.37), (0, 0, 0.43), 'SPINE', connect=True, inherit_scale='NONE',
         role='neck; ignores body squash so the head never distorts')
    bone('HEAD', (0, 0, 0.43), (0, 0, 0.86), 'NECK', connect=True, role='rigid head incl. face')
    for s in ('L', 'R'):
        b0, mid, tip, _, _ = ear[s]
        bone(f'EAR_{s}_01', b0, mid, 'HEAD', role='ear base rotation (pivot at skull exit)')
        bone(f'EAR_{s}_02', mid, tip, f'EAR_{s}_01', connect=True, role='ear tip bend')
    for s in ('L', 'R'):
        _, sh, el, end = arm[s]
        bone(f'ARM_{s}', sh, el, 'SPINE', inherit_scale='NONE', role='upper arm (pivot at body surface)')
        bone(f'PAW_{s}', el, end, f'ARM_{s}', connect=True, role='forearm + paw (wave)')
    for s, sx in (('L', 1), ('R', -1)):
        x = sx * 0.093
        bone(f'LEG_{s}', (x, 0, 0.19), (x, -0.005, 0.07), 'ROOT', role='leg (planted on ROOT)')
        bone(f'FOOT_{s}', (x, -0.005, 0.07), (x, -0.10, 0.03), f'LEG_{s}', connect=True, role='foot')
    for i in range(4):
        bone(f'TAIL_0{i + 1}', tp[i], tp[i + 1], 'HIPS' if i == 0 else f'TAIL_0{i}', connect=i > 0,
             inherit_scale='NONE' if i == 0 else 'FULL', role='tail chain')
    bone('SCARF_FLAP', (0, -0.152, 0.405), (0, -0.168, 0.262), 'SPINE', role='scarf bandana secondary motion')
    bone('FACE', (0, -0.38, 0.62), (0, -0.38, 0.70), 'HEAD', deform=False,
         role='facial control: custom properties drive shape keys + swap meshes')
    att = {
        'ATT_HAT': ((0, 0.02, 0.84), (0, 0.02, 0.94), 'HEAD'),
        'ATT_GLASSES': ((0, -0.31, 0.611), (0, -0.37, 0.611), 'HEAD'),
        'ATT_SCARF': ((0, 0.0, 0.395), (0, 0.0, 0.45), 'NECK'),
        'ATT_BACKPACK': ((0, 0.20, 0.245), (0, 0.28, 0.245), 'SPINE'),
        'ATT_HAND_L': (tuple(arm['L'][3]), tuple(arm['L'][3] + Vector((0, 0, -0.05))), 'PAW_L'),
        'ATT_HAND_R': (tuple(arm['R'][3]), tuple(arm['R'][3] + Vector((0, 0, -0.05))), 'PAW_R'),
    }
    for n, (h, t, par) in att.items():
        bone(n, h, t, par, deform=False, role='cosmetic attachment socket')
    bpy.ops.object.mode_set(mode='OBJECT')
    bpy.context.view_layer.update()

    # ---------------- rigid parts: bone parenting with exact inverse
    def bone_parent(obj, bname):
        mw = obj.matrix_world.copy()
        pb = rig.pose.bones[bname]
        obj.parent = rig
        obj.parent_type = 'BONE'
        obj.parent_bone = bname
        bmat = rig.matrix_world @ pb.bone.matrix_local @ Matrix.Translation((0, pb.bone.length, 0))
        obj.matrix_basis = Matrix.Identity(4)
        obj.matrix_parent_inverse = bmat.inverted() @ mw
        bpy.context.view_layer.update()
        assert (obj.matrix_world.translation - mw.translation).length < 1e-5, obj.name

    bone_parent(O['FOX_Head'], 'HEAD')          # tuft + face objects follow via existing hierarchy
    bone_parent(O['FOX_Backpack'], 'SPINE')     # flap, buckle, pockets, straps follow

    # ---------------- skinned parts
    def skin(obj):
        mw = obj.matrix_world.copy()
        obj.parent = rig
        obj.parent_type = 'OBJECT'
        obj.matrix_parent_inverse = rig.matrix_world.inverted()
        obj.matrix_world = mw
        m = obj.modifiers.new('Armature', 'ARMATURE')
        m.object = rig
        m.use_vertex_groups = True
        obj.modifiers.move(len(obj.modifiers) - 1, 0)   # deform before solidify/subdivision
        return obj

    body = skin(O['FOX_Body'])
    # upper torso (hidden under the scarf/head) follows NECK so the scarf roll
    # and the body cross-section turn together
    assign(body, lambda p: chain_weights(p, [Vector((0, 0, 0.0)), Vector((0, 0, 0.24)), Vector((0, 0, 0.365)), Vector((0, 0, 0.50))],
                                         ['HIPS', 'SPINE', 'NECK'], [0.05, 0.035]))
    for s in ('L', 'R'):
        p0, sh, el, end = arm[s]
        a = skin(O[f'FOX_Arm_{s}'])
        assign(a, lambda p, p0=p0, sh=sh, el=el, end=end, s=s:
               chain_weights(p, [p0, sh, el, end], ['SPINE', f'ARM_{s}', f'PAW_{s}'], [0.04, 0.035]))
        lg = skin(O[f'FOX_Leg_{s}'])
        assign(lg, lambda p, s=s: {'HIPS': smoothstep(0.15, 0.185, p.z),
                                   f'LEG_{s}': smoothstep(0.055, 0.085, p.z) - smoothstep(0.15, 0.185, p.z),
                                   f'FOOT_{s}': 1 - smoothstep(0.055, 0.085, p.z)})
        ex, mid, tip, base, s_exit = ear[s]
        for nm in (f'FOX_Ear_{s}', f'FOX_EarInner_{s}'):
            e = skin(O[nm])
            assign(e, lambda p, base=base, ex=ex, mid=mid, tip=tip, s=s:
                   chain_weights(p, [base, ex, mid, tip], ['HEAD', f'EAR_{s}_01', f'EAR_{s}_02'], [0.03, 0.075]))  # wide mid blend = smooth tip bend
    tail = skin(O['FOX_Tail'])
    assign(tail, lambda p: chain_weights(p, [Vector(TAIL_SPINE[0])] + tp,
                                         ['HIPS', 'TAIL_01', 'TAIL_02', 'TAIL_03', 'TAIL_04'],
                                         [0.035, 0.05, 0.05, 0.045]))
    roll = skin(O['FOX_Scarf_Roll'])
    assign(roll, lambda p: {'NECK': 0.75, 'SPINE': 0.25})
    for nm in ('FOX_Scarf_Flap', 'FOX_Scarf_Emblem'):
        o = skin(O[nm])
        assign(o, lambda p: {'SCARF_FLAP': 1 - smoothstep(0.37, 0.405, p.z),
                             'NECK': 0.75 * smoothstep(0.37, 0.405, p.z),
                             'SPINE': 0.25 * smoothstep(0.37, 0.405, p.z)})

    # ---------------- facial controls (custom props on FACE -> drivers)
    face = rig.pose.bones['FACE']
    props = {
        'eye_blink': 0.0, 'eye_wide': 0.0, 'eye_sad': 0.0, 'eye_halflid': 0.0, 'eye_proud': 0.0,
        'brow_sad': 0.0, 'brow_proud': 0.0,
        'eyes_mode': 0,      # 0 open, 1 closed-happy (^ ^), 2 closed-sleepy
        'mouth_mode': 0,     # 0 neutral, 1 open (+tongue), 2 small o, 3 frown, 4 smile
        'brows_visible': 0,  # 0 hidden, 1 shown
    }
    for k, v in props.items():
        face[k] = v
        ui = face.id_properties_ui(k)
        if isinstance(v, float):
            ui.update(min=0.0, max=1.0, soft_min=0.0, soft_max=1.0)
        else:
            ui.update(min=0, max={'eyes_mode': 2, 'mouth_mode': 4, 'brows_visible': 1}[k])

    def drive(id_block, path, expr, var_props, index=-1):
        fc = id_block.driver_add(path, index) if index >= 0 else id_block.driver_add(path)
        d = fc.driver
        d.type = 'SCRIPTED'
        for vname, prop in var_props:
            var = d.variables.new()
            var.name = vname
            var.type = 'SINGLE_PROP'
            var.targets[0].id = rig
            var.targets[0].data_path = f'pose.bones["FACE"]["{prop}"]'
        d.expression = expr
        return fc

    for s in ('L', 'R'):
        kb = O[f'FOX_Eye_{s}'].data.shape_keys
        for key, prop in (('Blink', 'eye_blink'), ('Wide', 'eye_wide'), ('Sad', 'eye_sad'),
                          ('HalfLid', 'eye_halflid'), ('Proud', 'eye_proud')):
            drive(kb, f'key_blocks["{key}"].value', 'v', [('v', prop)])
        bk = O[f'FOX_Brow_{s}'].data.shape_keys
        for key, prop in (('Sad', 'brow_sad'), ('Proud', 'brow_proud')):
            drive(bk, f'key_blocks["{key}"].value', 'v', [('v', prop)])
    vis = {
        'FOX_Eye_L': 'm != 0', 'FOX_Eye_R': 'm != 0',
        'FOX_EyeClosedHappy_L': 'm != 1', 'FOX_EyeClosedHappy_R': 'm != 1',
        'FOX_EyeClosedSleepy_L': 'm != 2', 'FOX_EyeClosedSleepy_R': 'm != 2',
    }
    for n, expr in vis.items():
        for path in ('hide_render', 'hide_viewport'):
            drive(O[n], path, expr, [('m', 'eyes_mode')])
    mouths = {'FOX_Mouth_Neutral': 0, 'FOX_Mouth_Open': 1, 'FOX_Mouth_Tongue': 1, 'FOX_Mouth_SmallO': 2,
              'FOX_Mouth_Frown': 3, 'FOX_Mouth_Smile': 4}
    for n, idx in mouths.items():
        for path in ('hide_render', 'hide_viewport'):
            drive(O[n], path, f'm != {idx}', [('m', 'mouth_mode')])
    for n in ('FOX_Brow_L', 'FOX_Brow_R'):
        for path in ('hide_render', 'hide_viewport'):
            drive(O[n], path, 'b < 1', [('b', 'brows_visible')])

    for pb in rig.pose.bones:
        pb.rotation_mode = 'QUATERNION'
    adata.pose_position = 'POSE'
    scene['fox_gate'] = 'D1 rig prototype'
    bpy.context.view_layer.update()
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)

    # ---------------- specs
    skinned = {o.name: sorted(g.name for g in o.vertex_groups) for o in bpy.data.objects
               if o.type == 'MESH' and any(m.type == 'ARMATURE' for m in o.modifiers)}
    rigid = {'HEAD': ['FOX_Head (+ FOX_Tuft and all GEO_FACE objects via hierarchy)'],
             'SPINE': ['FOX_Backpack (+ flap, buckle, pockets, straps via hierarchy)']}
    json.dump({
        'asset': 'LifeQuest Fox V2', 'gate': 'D1 rig prototype', 'armature': 'FOX_RIG',
        'units': 'metres, Z-up, faces -Y (glTF export converts to Y-up / +Z forward)',
        'bone_count': len(spec), 'deform_bones': sum(1 for b in spec if b['deform']),
        'naming': 'UPPER_SNAKE, side suffix _L/_R (character side), chain index _01.._04, non-deforming sockets ATT_*',
        'bones': spec,
        'skinned_meshes': skinned,
        'rigid_bone_parenting': rigid,
        'facial_controls': {'bone': 'FACE', 'properties': props,
                            'drives': 'FOX_Eye_* shape keys (Blink, Wide, Sad, HalfLid, Proud), FOX_Brow_* shape keys (Sad, Proud), visibility of eye/mouth/brow swap meshes'},
        'level_scale': 'scale FOX_ROOT uniformly (rig + all geometry inherit); see 01_DESIGN/proportions.json level_scale',
    }, open(os.path.join(ROOT_DIR, '03_RIG', 'skeleton_spec.json'), 'w'), indent=2)
    json.dump({
        'asset': 'LifeQuest Fox V2', 'gate': 'D1',
        'note': 'Sockets are non-deforming bones; attach a cosmetic by parenting it to the bone (Blender) or to the exported glTF node of the same name (Three.js). Socket +Y = bone direction.',
        'sockets': {n: {'parent_bone': par, 'head': [round(x, 4) for x in h], 'tail': [round(x, 4) for x in t],
                        'use': {'ATT_HAT': 'hats, headbands', 'ATT_GLASSES': 'glasses, masks', 'ATT_SCARF': 'scarf variants (replace FOX_Scarf_*)',
                                'ATT_BACKPACK': 'backpack variants (replace FOX_Backpack hierarchy)', 'ATT_HAND_L': 'handheld props (left paw)',
                                'ATT_HAND_R': 'handheld props (right paw)'}[n]}
                    for n, (h, t, par) in att.items()},
        'existing_attached_items': {'FOX_Backpack': 'bone-parented to SPINE (detachable: clear parent or swap)',
                                    'FOX_Scarf_*': 'skinned to NECK/SPINE/SCARF_FLAP'},
    }, open(os.path.join(ROOT_DIR, '03_RIG', 'attachment_points.json'), 'w'), indent=2)
    print('saved', OUT, len(spec), 'bones')


if __name__ == '__main__':
    build()
