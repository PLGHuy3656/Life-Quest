"""Gate G2 — daily life: study, sports, wake / alarm, sleep and cooldown (15 clips + 1 variant).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/anim_g2.py
Reads   03_RIG/fox_rig_d1_1.blend   (canonical approved rig — never written)
Writes  04_ANIMATIONS/g2_daily_life/fox_anim_g2.blend   (canonical rig + the G2 actions)
        04_ANIMATIONS/g2_daily_life/anim_spec_g2.json   (clip registry, state contract, prop anchors, VFX cues)
No E1/E2/F/G1/G1.1 file is touched.

Same skeleton, morph targets, sockets and keying pipeline as E2 / G1 / G1.1 (anim_e1.Keyer / body_pose,
anim_e2 spring follow-through, anim_g1 helpers). New in G2:
  * full ROOT transform (pitch / roll / x / y / signed z) for sitting and lying; per-leg LEG/FOOT keys for
    jogging and pushing up;
  * a GROUND pass: after keying, every frame flagged 'contact' is re-keyed so the lowest point of the
    body (tail excluded) touches z = 0 exactly; frames flagged 'floor' are only lifted if they would sink;
  * prop anchors are MEASURED on the posed rig (paws in study_focus, the right paw at the alarm slap, the
    head in sleep_loop) and written to the spec, so runtime props sit where the acting needs them;
  * per-eye and sleep expressions made of the existing D1.1 morphs only (yawn, one-eye peek, wink, drowsy,
    focus, pant).
E2 limits kept: tail raise ≤ 10°, wag ≤ ±20°, ear spread ≤ 11°, ears forward ≥ −3°, head pitch / roll on
the NECK, squash small while the neck pitches or arms are raised (no shear in glTF).
"""
import json
import math
import os
import sys

import bpy
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import anim_e1 as A  # noqa: E402
import anim_e2 as E  # noqa: E402
import anim_g1 as G  # noqa: E402  (helpers only)

T, clamp = E.T, E.clamp
blink_curve, FPS, Q = A.blink_curve, A.FPS, A.Q
wag, ears_of, face_of, fr = G.wag, G.ears_of, G.face_of, G.fr
MOD_DIR = os.path.join(A.OUT_DIR, 'g2_daily_life')
OUT = os.path.join(MOD_DIR, 'fox_anim_g2.blend')

# ------------------------------------------------------------------ G2 expressions (existing morphs only)
EYES, BROWS = ['FOX_Eye_L', 'FOX_Eye_R'], ['FOX_Brow_L', 'FOX_Brow_R']
A.EXPR.update({
    # asleep: both eyes closed (sleepy arcs), calm mouth
    'asleep': {**{e: {'hide': 1} for e in EYES}, 'FOX_EyeClosedSleepy_L': {'show': 1}, 'FOX_EyeClosedSleepy_R': {'show': 1}},
    # yawn: eyes squeezed (sleepy arcs) + open mouth
    'yawn': {**{e: {'hide': 1} for e in EYES}, 'FOX_EyeClosedSleepy_L': {'show': 1}, 'FOX_EyeClosedSleepy_R': {'show': 1},
             'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_Open': {'show': 1}},
    # one-eye peek: the fox's left eye half open, the right still closed
    'peek_l': {'FOX_Eye_L': {'HalfLid': 0.55}, 'FOX_Eye_R': {'hide': 1}, 'FOX_EyeClosedSleepy_R': {'show': 1}},
    # wink (right eye closed happy) + smile
    'wink_r': {'FOX_Eye_R': {'hide': 1}, 'FOX_EyeClosedHappy_R': {'show': 1}, 'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_Smile': {'show': 1}},
    'drowsy': {**{e: {'HalfLid': 1} for e in EYES}},
    'focus': {**{e: {'HalfLid': 0.35} for e in EYES}, **{b: {'Sad': 0.25} for b in BROWS}},
    'determined': {**{e: {'HalfLid': 0.25, 'Proud': 0.4} for e in EYES}, **{b: {'Proud': 0.8} for b in BROWS}},
    'pant': {**{e: {'HalfLid': 0.4} for e in EYES}, 'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_Open': {'show': 1}, 'FOX_Mouth_Tongue': {'show': 1}},
    'talk_o': {'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_SmallO': {'show': 1}},
})

# ------------------------------------------------------------------ reference poses
SIT = {'leg_x': -85.0, 'foot_x': 20.0, 'root_zf': -0.044, 'hips_x': 4.0, 'spine_x': -2.0, 'tail_lift': 10.0}
# lying on the right side, face to the viewer (no forward curl: with the body on its side a forward pitch would turn the face
# away); hips bent sideways so the tail rests along the floor instead of cutting into it
LIE = {'root_roll': -70.0, 'root_x': 0.51, 'root_zf': 0.347, 'hips_y': -30.0, 'leg_x': -60.0,
       'armL_x': -45.0, 'armR_x': -45.0, 'armL_up': -15.0, 'armR_up': -15.0, 'head_x': -12.0, 'head_y': 8.0, 'tail_lift': 10.0,
       'tail_sway0': 20.0, 'tail_sway1': 20.0, 'tail_sway2': 20.0, 'tail_sway3': 20.0}
ROOT_KEYS = ('root_pitch', 'root_roll', 'root_x', 'root_y', 'root_zf')
LEG_KEYS = ('legL_x', 'legR_x', 'footL_x', 'footR_x')


def ease(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def blend(P0, P1, w):
    keys = set(P0) | set(P1)
    return {k: (1 - w) * P0.get(k, 0.0) + w * P1.get(k, 0.0) for k in keys}


def add(P, D, w=1.0):
    out = dict(P)
    for k, v in D.items():
        out[k] = out.get(k, 0.0) + w * v
    return out


def per(f, L, n=1.0, ph=0.0):
    return math.sin(2 * math.pi * n * (f - 1) / L + ph)


# ------------------------------------------------------------------ keying with full root / per-leg control
def key_pose(k, R, f, P):
    A.body_pose(k, R, f, P)
    if any(n in P for n in ROOT_KEYS) or P.get('root_z', 0) != 0:
        g = lambda n: P.get(n, 0.0)  # noqa: E731
        k.basis(f, 'ROOT', q=R.lq('ROOT', Q(x=g('root_pitch'), y=g('root_roll'), z=g('root_yaw'))),
                loc=R.lloc('ROOT', (g('root_x'), g('root_y'), g('root_zf') + max(0.0, g('root_z')))))
    if any(n in P for n in LEG_KEYS):
        for s, sg in (('L', 1), ('R', -1)):
            lx = P.get(f'leg{s}_x', P.get('leg_x', 0.0))
            k.basis(f, f'LEG_{s}', q=R.lq(f'LEG_{s}', Q(x=lx, y=-sg * P.get('leg_out', 0.0))))
            k.basis(f, f'FOOT_{s}', q=R.lq(f'FOOT_{s}', Q(x=P.get(f'foot{s}_x', P.get('foot_x', 0.0)))))


GROUND_LOG = {}


def run_clip(name, N, pose_fn, face_fn, rz=None, sq=None, cyclic=False, ground=None, ends=('rest', 'rest')):
    """ground(f) -> None | 'contact' | 'floor'  (see module doc).
    ends: ('rest' | 'loop', 'rest' | 'loop') — at a 'rest' end the body pose is ramped onto the exact rest pose
    over the first 5 / last 8 frames (secondary tail / ear sway included), so clips start / end on the pose
    the idle loop blends with."""
    k = A.Keyer(name, O_)
    inn = T([(1, 0), (6, 1), (N, 1)]) if ends[0] == 'rest' and not cyclic else (lambda f: 1.0)
    out = T([(1, 1), (N - 8, 1), (N, 0)]) if ends[1] == 'rest' and not cyclic else (lambda f: 1.0)
    rzv = [rz(f) if rz else 0.0 for f in range(1, N + 1)]
    sqv = [sq(f) if sq else 0.0 for f in range(1, N + 1)]
    ears, tail = E.secondary(rzv, sqv, N) if not cyclic else ([0.0] * N, [0.0] * N)
    poses = []
    for f in range(1, N + 1):
        i = f - 1
        P = pose_fn(f, rzv[i], sqv[i], ears[i], tail[i])
        P.setdefault('root_z', rzv[i])
        P.setdefault('squash', sqv[i])
        w = min(inn(f), out(f))
        if w < 1:
            P = {kk: vv * ease(w) for kk, vv in P.items()}
        key_pose(k, R_, f, P)
        k.face(f, face_fn(f))
        poses.append(P)
    k.finish(1, N, cyclic=cyclic)
    if ground:
        ground_pass(name, k, poses, ground, N)
    return {'loop': cyclic, 'frames': N - 1, 'duration_s': round((N - 1) / FPS, 4)}


_BODY = None


def _body_meshes():
    global _BODY
    if _BODY is None:
        _BODY = [o for o in O_ if o.type == 'MESH' and o.visible_get() and 'Tail' not in o.name]
    return _BODY


def body_min_z():
    dg = bpy.context.evaluated_depsgraph_get()
    zmin = 9.0
    for o in _body_meshes():
        e = o.evaluated_get(dg)
        m = e.to_mesh()
        n = len(m.vertices)
        co = np.empty(n * 3, np.float32)
        m.vertices.foreach_get('co', co)
        co = co.reshape(-1, 3)
        M = np.array(e.matrix_world)
        z = co @ M[2, :3] + M[2, 3]
        zmin = min(zmin, float(z.min()))
        e.to_mesh_clear()
    return zmin


def ground_pass(name, k, poses, gfn, N):
    """Measured on the runtime cage (subdivision off) = the geometry exported to the GLB."""
    rig = O_['FOX_RIG']
    rig.animation_data.action = k.act
    sc = bpy.context.scene
    log = []
    for f in range(1, N + 1):
        mode = gfn(f)
        if not mode:
            continue
        sc.frame_set(f)
        z = body_min_z()
        dz = -z if mode == 'contact' else max(0.0, -z)
        if abs(dz) < 1e-5:
            continue
        P = poses[f - 1]
        P['root_zf'] = P.get('root_zf', 0.0) + dz
        g = lambda n: P.get(n, 0.0)  # noqa: E731
        k.basis(f, 'ROOT', q=R_.lq('ROOT', Q(x=g('root_pitch'), y=g('root_roll'), z=g('root_yaw'))),
                loc=R_.lloc('ROOT', (g('root_x'), g('root_y'), g('root_zf') + max(0.0, g('root_z')))))
        log.append((f, round(dz, 4)))
    for fc in k._fcurves():
        for kp in fc.keyframe_points:
            kp.interpolation = 'LINEAR'
    GROUND_LOG[name] = log


def sit_ground(f0, f1):
    """contact while seated / lying (f0..f1), floor elsewhere."""
    return lambda f: 'contact' if f0 <= f <= f1 else 'floor'


# ================================================================== STUDY
def study_pose(f):
    """study_focus at loop frame f (1..169): seated, notebook on the lap between the paws, pencil in the
    right paw. Beats: read (scan the page) → write (small quick strokes) → think (pencil to the chin,
    look up, ear twitch) → 'aha' (ears perk) → write again → read."""
    L = 168
    br = per(f, L, 3)
    write = T([(1, 0), (20, 0), (26, 1), (70, 1), (76, 0), (112, 0), (118, 1), (150, 1), (156, 0), (169, 0)])(f)
    think = T([(1, 0), (76, 0), (84, 1), (104, 1), (110, 0), (169, 0)])(f)
    aha = T([(1, 0), (102, 0), (105, 1), (112, 0.6), (120, 0), (169, 0)])(f)
    scan = T([(1, 0), (6, -1), (14, 1), (20, 0.6), (156, 0.6), (162, -0.6), (169, 0)])(f)
    scrib = math.sin(2 * math.pi * (f - 1) / 6.0) * write            # quick strokes (6 f per stroke)
    line = math.sin(2 * math.pi * (f - 1) / 42.0) * write             # paw travels along the line
    P = dict(SIT)
    P.update({'squash': 0.006 * br, 'spine_x': 6 - 6 * think + 1.0 * br, 'hips_y': 0.8 * per(f, L, 1),
              'head_x': 7 - 18 * think + 3 * write - 3 * aha + 1.2 * scrib, 'head_z': 7 * scan * (1 - write) + 4 * line - 9 * think,
              'head_y': -5 * think + 2 * line,
              'armL_up': -15, 'armL_x': -75 + 4 * think, 'pawL_x': -24,
              'armR_up': -14 + 6 * line + 114 * think, 'armR_x': -76 - 4 * write + 116 * think, 'pawR_x': -30 + 8 * scrib - 30 * think,
              'pawR_y': -6 * think,
              'earL_fwd': 4 + 6 * aha + 2 * write, 'earR_fwd': 4 + 6 * aha + 2 * write + 5 * T([(1, 0), (88, 0), (90, 1), (94, 0), (169, 0)])(f),
              'earL_out': 2 + 3 * think - 2 * aha, 'earR_out': 2 + 3 * think - 2 * aha})
    for t in range(4):
        P[f'tail_sway{t}'] = clamp(8 + 6 * per(f, L, 2, -0.7 * t), -20, 20)
    return P


def study_focus():
    N = 169

    def pose(f, rzv, sqv, e, tl):
        return study_pose(f)
    think = T([(1, 0), (76, 0), (84, 1), (104, 1), (110, 0), (169, 0)])
    write = T([(1, 0), (20, 0), (26, 1), (70, 1), (76, 0), (112, 0), (118, 1), (150, 1), (156, 0), (169, 0)])
    aha = T([(1, 0), (102, 0), (105, 1), (114, 0), (169, 0)])
    m = run_clip('study_focus', N, pose, lambda f: face_of(focus=0.7 * write(f) + 0.3, talk_o=0.6 * think(f), smile=aha(f),
                                                          blink_extra=blink_curve(f, [40, 96, 140])), cyclic=True, ground=lambda f: 'contact')
    m['cues'] = []
    m['state_fx'] = ['focus.particles']
    return m


def study_start():
    """Notices the study task (ears perk, a little 'oh!'), the notebook pops in front, a small hop of
    excitement, then the fox sits down cross-legged (crouch → drop → settle bounce), opens the notebook
    with both paws, takes the pencil, a ready nod; ends exactly on study_focus frame 1."""
    N = 60
    notice = T([(1, 0), (4, 0), (9, 1), (16, 1), (22, 0), (60, 0)])
    hop = T([(1, 0), (14, 0), (17, 0.03), (20, 0), (60, 0)])
    sit = T([(1, 0), (22, 0), (36, 1), (60, 1)])
    crouch = T([(1, 0), (12, 0), (14, 0.05), (17, -0.03), (20, 0.04), (24, 0.02), (36, 0.03), (39, -0.01), (42, 0), (60, 0)])
    open_ = T([(1, 0), (38, 0), (46, 1), (60, 1)])
    nod = T([(1, 0), (50, 0), (53, 6), (56, -2), (60, 0)])
    target = study_pose(1)

    def pose(f, rzv, sqv, e, tl):
        n, s, o = notice(f), ease(sit(f)), open_(f)
        stand = {'head_x': -6 * n, 'head_z': -8 * n, 'head_y': 4 * n, 'spine_x': -3 * n, 'armL_up': 18 * n, 'armR_up': 18 * n,
                 'pawL_x': -20 * n, 'pawR_x': -20 * n, 'tail_lift': 6 * n + 0.5 * tl}
        stand.update(ears_of(e, 10 * n))
        for t in range(4):
            stand[f'tail_sway{t}'] = wag(f, 14 * n, 12, t)
        P = blend(stand, target, s)
        # opening the notebook: paws spread a little then come back onto the page
        P = add(P, {'armL_up': 10 * math.sin(math.pi * o), 'armR_up': 10 * math.sin(math.pi * o), 'head_x': nod(f)})
        if s < 1:
            P['spine_x'] = P.get('spine_x', 0) + 10 * math.sin(math.pi * s)       # leans forward while sitting down
        P['root_z'] = hop(f)
        P['squash'] = crouch(f)
        return P
    m = run_clip('study_start', N, pose, lambda f: face_of(surprised=0.7 * notice(f), smile=T([(1, 0), (14, 0), (18, 1), (40, 1), (48, 0), (60, 0)])(f),
                                                          focus=0.3 * open_(f), blink_extra=blink_curve(f, [30])),
                 ends=('rest', 'loop'), ground=lambda f: 'contact' if f >= 26 else 'floor')
    m['cues'] = [{'t': fr(5), 'fx': 'burst.exclaim', 'duration': 0.6},
                 {'t': fr(10), 'fx': 'prop.show', 'prop': 'notebook', 'mode': 'pop'},
                 {'t': fr(40), 'fx': 'prop.phase', 'prop': 'notebook', 'phase': 'open'},
                 {'t': fr(42), 'fx': 'prop.show', 'prop': 'pencil', 'mode': 'pop'},
                 {'t': fr(46), 'fx': 'sparkle.soft', 'at': 'notebook', 'count': 6}]
    m['end_pose'] = 'study_focus'
    m['props_end'] = ['notebook', 'pencil']
    return m


def study_complete():
    """A last decisive stroke (pencil flourish up), satisfied look at the page, CLAP the notebook shut
    (sparkle), a seated stretch with both arms up, then up on its feet (lean forward, push), proud
    chest-out, the notebook tucked away (poof) and a small happy bounce → rest."""
    N = 88
    flourish = T([(1, 0), (6, 0), (10, 1), (16, 0.2), (22, 0), (88, 0)])
    look = T([(1, 0), (12, 0), (18, 1), (24, 0.4), (30, 0), (88, 0)])
    clap = T([(1, 0), (22, 0), (26, 1), (30, 0.3), (36, 0), (88, 0)])
    stretch = T([(1, 0), (32, 0), (40, 1), (48, 1), (54, 0), (88, 0)])
    standup = T([(1, 0), (50, 0), (64, 1), (88, 1)])
    proud = T([(1, 0), (62, 0), (68, 1), (78, 1), (84, 0), (88, 0)])
    bounce = T([(1, 0), (68, 0), (71, 0.025), (74, 0), (88, 0)])
    sq = T([(1, 0), (64, 0), (66, 0.03), (68, 0), (70, 0.03), (73, -0.015), (76, 0), (88, 0)])
    src = study_pose(1)

    def pose(f, rzv, sqv, e, tl):
        fl, lk, c, st, u, p = flourish(f), look(f), clap(f), stretch(f), ease(standup(f)), proud(f)
        P = add(src, {'armR_up': 40 * fl, 'armR_x': 20 * fl, 'pawR_x': 30 * fl, 'head_x': -10 * fl - 4 * lk + 4 * c, 'head_y': 6 * lk,
                      'armL_up': 6 * c, 'armR_up_': 0, 'pawL_x': 10 * c,
                      'spine_x': -8 * st, 'head_x_': 0})
        P = blend(P, add(P, {'head_x': -12, 'spine_x': -4}), st)
        for kk, vv in {'armL_up': 150, 'armR_up': 150, 'armL_x': 0, 'armR_x': 0, 'pawL_x': 20, 'pawR_x': 20}.items():
            P[kk] = (1 - st) * P.get(kk, 0) + st * vv
        stand = {'spine_x': -4 * p, 'head_x': -6 * p, 'armL_up': 16 * p, 'armR_up': 16 * p, 'armL_x': -12 * p, 'armR_x': -12 * p,
                 'tail_lift': 10 * p + 0.5 * tl}
        stand.update(ears_of(e, 8 * p))
        for t in range(4):
            stand[f'tail_sway{t}'] = wag(f, 16 * p, 12, t)
        P = blend(P, stand, u)
        P['spine_x'] = P.get('spine_x', 0) + 16 * math.sin(math.pi * u)            # lean forward to get up
        P['armL_x'] = P.get('armL_x', 0) + 20 * math.sin(math.pi * u)
        P['armR_x'] = P.get('armR_x', 0) + 20 * math.sin(math.pi * u)
        P['root_z'] = bounce(f)
        P['squash'] = sq(f)
        P.pop('armR_up_', None)
        P.pop('head_x_', None)
        return P
    m = run_clip('study_complete', N, pose, lambda f: face_of(focus=0.6 * (1 - look(f)) * (f < 14), happy=T([(1, 0), (24, 0), (28, 1), (46, 1), (52, 0), (88, 0)])(f),
                                                             proud=proud(f), smile=T([(1, 0), (12, 0), (16, 1), (24, 0), (52, 0), (56, 1), (62, 0), (80, 0), (84, 0.8), (88, 0)])(f),
                                                             blink_extra=blink_curve(f, [58])),
                 ends=('loop', 'rest'), ground=lambda f: 'contact' if f <= 54 else 'floor')
    m['cues'] = [{'t': fr(9), 'fx': 'sparkle.soft', 'at': 'hand_r', 'count': 5},
                 {'t': fr(25), 'fx': 'prop.phase', 'prop': 'notebook', 'phase': 'close'},
                 {'t': fr(26), 'fx': 'burst.stars', 'at': 'notebook', 'count': 10},
                 {'t': fr(30), 'fx': 'prop.hide', 'prop': 'pencil', 'mode': 'poof'},
                 {'t': fr(58), 'fx': 'prop.hide', 'prop': 'notebook', 'mode': 'poof'},
                 {'t': fr(69), 'fx': 'sparkle', 'at': 'head', 'count': 10}]
    m['start_pose'] = 'study_focus'
    m['props_start'] = ['notebook', 'pencil']
    return m


# ================================================================== SPORTS
JOG_P = 16          # frames per full stride cycle (2 steps) → 3 steps / s


def jog_pose(f, amp=1.0):
    L = 96
    p = 2 * math.pi * (f - 1) / JOG_P
    s = math.sin(p)
    knee = 38 + 12 * math.sin(math.pi * (f - 1) / L) ** 2 * amp          # knees higher mid-loop, periodic
    lift_l, lift_r = max(0.0, s), max(0.0, -s)
    P = {'root_z': 0.02 * (1 - abs(s)) ** 2, 'squash': 0.03 * abs(s) ** 2 - 0.012 * (1 - abs(s)),
         'legL_x': -knee * lift_l, 'legR_x': -knee * lift_r, 'footL_x': 18 * lift_l, 'footR_x': 18 * lift_r,
         'leg_x': 0.0, 'foot_x': 0.0,
         'armL_x': -34 * s, 'armR_x': 34 * s, 'armL_up': 16, 'armR_up': 16, 'pawL_x': -45, 'pawR_x': -45,
         'spine_z': 6 * s, 'hips_z': -4 * s, 'spine_x': 4, 'hips_y': 2 * s,
         'head_x': -2 + 2 * math.cos(2 * p), 'head_z': -3 * s, 'head_y': 1.5 * s,
         'earL_fwd': 4 + 3 * math.cos(2 * p - 1.0), 'earR_fwd': 4 + 3 * math.cos(2 * p - 1.0),
         'earL_out': 2 + 2 * math.cos(2 * p - 1.2), 'earR_out': 2 + 2 * math.cos(2 * p - 1.2),
         'tail_lift': 6 + 2 * math.cos(2 * p - 1.4), 'flap_out': 3 + 3 * abs(math.cos(p - 0.8))}
    for t in range(4):
        P[f'tail_sway{t}'] = wag(f, 9, JOG_P, t)
    return P


def sports_active():
    N = 97
    m = run_clip('sports_active', N, lambda f, rzv, sqv, e, tl: jog_pose(f),
                 lambda f: face_of(determined=0.8, smile=0.25 + 0.25 * per(f, 96, 1), pant=0.35 * max(0.0, per(f, 96, 1, 2.2)),
                                   blink_extra=blink_curve(f, [30, 78])), cyclic=True, ground=lambda f: 'floor')
    m['cues'] = []
    m['state_fx'] = ['sweat.drops']
    m['speed_mps'] = 0.0
    return m


def sports_start():
    """Gets ready: a big overhead arm stretch, a side bend each way, rolls the shoulders, punches a paw
    into the other palm (determined brows), two springy warm-up hops and drops into the jog — ends
    exactly on sports_active frame 1."""
    N = 64
    stretch = T([(1, 0), (4, 0), (12, 1), (20, 1), (24, 0), (64, 0)])
    bend = T([(1, 0), (14, 0), (20, 1), (26, -1), (32, 0), (64, 0)])
    punch = T([(1, 0), (30, 0), (34, 1), (40, 1), (44, 0), (64, 0)])
    hops = T([(1, 0), (42, 0), (45, 0.035), (48, 0), (51, 0.035), (54, 0), (64, 0)])
    sq = T([(1, 0), (3, 0.03), (8, -0.02), (22, 0), (33, 0.03), (35, -0.01), (40, 0), (42, 0.04), (44, -0.02), (47, 0), (48, 0.04),
            (50, -0.02), (53, 0), (54, 0.03), (57, 0), (64, 0)])
    into = T([(1, 0), (52, 0), (64, 1)])
    target = jog_pose(1)

    def pose(f, rzv, sqv, e, tl):
        st, b, pu = stretch(f), bend(f), punch(f)
        P = {'armL_up': 122 * st, 'armR_up': 122 * st, 'armL_x': -10 * st, 'armR_x': -10 * st, 'pawL_x': 20 * st, 'pawR_x': 20 * st,
             'spine_x': -6 * st, 'head_x': -10 * st, 'hips_y': 10 * b, 'spine_y': 12 * b, 'head_y': 8 * b,
             'armR_x_': 0}
        # fist into the palm in front of the chest
        P = add(P, {'armL_x': 42 * pu, 'armL_up': 96 * pu, 'pawL_x': -50 * pu, 'armR_x': 42 * pu, 'armR_up': 100 * pu, 'pawR_x': -65 * pu,
                    'head_x': 6 * pu, 'spine_x': 3 * pu})
        P.update(ears_of(e, 6 * st + 8 * pu))
        P['tail_lift'] = clamp(4 + 4 * pu + 0.5 * tl, 0, 10)
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, 10, 14, t)
        P.pop('armR_x_', None)
        P = blend(P, target, ease(into(f)))
        P['root_z'] = hops(f) + into(f) * target['root_z']
        P['squash'] = sq(f) * (1 - into(f)) + into(f) * target['squash']
        return P
    m = run_clip('sports_start', N, pose, lambda f: face_of(happy=0.6 * stretch(f), determined=T([(1, 0), (26, 0), (32, 1), (64, 0.8)])(f),
                                                           smile=T([(1, 0), (40, 0), (44, 1), (64, 0.25)])(f), blink_extra=blink_curve(f, [28])),
                 ends=('rest', 'loop'), ground=lambda f: 'floor')
    m['cues'] = [{'t': fr(12), 'fx': 'sparkle.soft', 'at': 'head_top', 'count': 6},
                 {'t': fr(34), 'fx': 'energy.accent', 'at': 'paws', 'count': 10},
                 {'t': fr(45), 'fx': 'dust.step', 'at': 'feet', 'count': 6},
                 {'t': fr(51), 'fx': 'dust.step', 'at': 'feet', 'count': 6}]
    m['end_pose'] = 'sports_active'
    return m


def sports_complete():
    """Slows from the jog (two heavier steps), stops — hands on the knees, panting (fast breaths), wipes
    the forehead with the right paw (sweat flick), straightens up, flexes the right arm proudly and
    gives a thumbs-up wink → rest."""
    N = 92
    jog = T([(1, 1), (14, 1), (22, 0), (92, 0)])
    knees = T([(1, 0), (16, 0), (24, 1), (46, 1), (52, 0), (92, 0)])
    wipe = T([(1, 0), (40, 0), (46, 1), (50, 1), (54, 0.2), (58, 0), (92, 0)])
    wipe_sweep = T([(1, 0), (44, -1), (50, 1), (58, 1), (92, 1)])
    flex = T([(1, 0), (56, 0), (62, 1), (78, 1), (86, 0), (92, 0)])
    sq = T([(1, 0), (56, 0), (60, 0.03), (63, -0.01), (66, 0), (92, 0)])

    def pose(f, rzv, sqv, e, tl):
        j = jog(f)
        slow = 1 + 0.6 * (1 - j)                                                    # strides get longer as it slows
        J = jog_pose(1 + (f - 1) / slow) if j > 0 else jog_pose(1)
        kn, w, fl = knees(f), wipe(f), flex(f)
        pant = math.sin(2 * math.pi * f / 7.0) * kn
        P = {'spine_x': 14 * kn + 1.5 * pant, 'hips_x': 8 * kn, 'head_x': -8 * kn - 1.5 * pant - 6 * w, 'squash': 0.012 * pant,
             'armL_x': -45 * kn, 'armR_x': -45 * kn * (1 - w), 'armL_up': -14 * kn, 'armR_up': -14 * kn * (1 - w), 'pawL_x': 10 * kn,
             # wipe: right paw sweeps across the forehead
             'armR_up_w': 0}
        P = add(P, {'armR_up': 135 * w, 'armR_x': 60 * w, 'pawR_x': -50 * w, 'head_z': -6 * w * wipe_sweep(f), 'head_y': 5 * w})
        # flex: right arm up and bent, left paw on the hip, chest out
        P = add(P, {'armR_up': 85 * fl, 'armR_x': 10 * fl, 'pawR_x': -70 * fl, 'armL_up': 22 * fl, 'armL_x': -14 * fl, 'pawL_x': 30 * fl,
                    'spine_x': -5 * fl, 'head_z': -14 * fl, 'head_x': -4 * fl, 'tail_lift': 9 * fl})
        P.pop('armR_up_w', None)
        P.update(ears_of(e, 6 * fl, 6 * kn))
        P['tail_lift'] = clamp(P.get('tail_lift', 0) + 0.5 * tl, 0, 10)
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, 4 + 12 * fl, 12, t)
        P = blend(P, J, j)
        if j <= 0:
            P['squash'] = P.get('squash', 0) + sq(f)
        return P
    m = run_clip('sports_complete', N, pose, lambda f: face_of(determined=0.8 * jog(f), pant=knees(f), wink_r=T([(1, 0), (64, 0), (68, 1), (78, 1), (84, 0), (92, 0)])(f),
                                                              proud=0.6 * flex(f), smile=T([(1, 0), (52, 0), (56, 1), (64, 0), (84, 0), (88, 0.7), (92, 0)])(f),
                                                              blink_extra=blink_curve(f, [34])), ends=('loop', 'rest'), ground=lambda f: 'floor')
    m['cues'] = [{'t': fr(24), 'fx': 'sweat.burst', 'at': 'head', 'count': 6},
                 {'t': fr(30), 'fx': 'puff.pant', 'at': 'mouth', 'duration': 0.9},
                 {'t': fr(50), 'fx': 'sweat.flick', 'at': 'hand_r', 'count': 5},
                 {'t': fr(63), 'fx': 'burst.stars', 'at': 'hand_r', 'count': 8},
                 {'t': fr(64), 'fx': 'sparkle', 'at': 'head', 'count': 8}]
    m['start_pose'] = 'sports_active'
    return m


# ================================================================== SLEEP
def lie_pose(f, L=192):
    """sleep_loop at loop frame f (1..193): lying on the right side, head on the pillow, paws tucked,
    tail resting along the floor. Two slow breaths per 8 s, one ear twitch, a dreamy tail-tip flick and a
    tiny smile at the end of the dream beat."""
    br = per(f, L, 2)
    twitch = T([(1, 0), (120, 0), (122, 1), (126, -0.3), (130, 0), (193, 0)])(f)
    flick = T([(1, 0), (60, 0), (66, 1), (72, -0.5), (80, 0), (193, 0)])(f)
    P = dict(LIE)
    P = add(P, {'squash': -0.016 * br, 'spine_x': 1.2 * br, 'head_x': -0.8 * br, 'armL_x': 2 * br, 'pawL_x': -1.5 * br,
                'earL_out': 3 + 1 * br + 8 * twitch, 'earR_out': 3 + 1 * br, 'earL_fwd': 2 + 6 * twitch, 'earR_fwd': 2,
                'flap_out': 1 + 0.6 * br})
    for t in range(4):
        P[f'tail_sway{t}'] = clamp(LIE['tail_sway0'] - (6 * flick * (t / 3.0) + 2 * (1 + br) * (t / 3.0)), -20, 20)
    return P


def sleep_loop():
    N = 193
    m = run_clip('sleep_loop', N, lambda f, rzv, sqv, e, tl: lie_pose(f),
                 lambda f: face_of(asleep=1.0, talk_o=0.35 * (0.5 + 0.5 * per(f, 192, 2, -0.5)),
                                   smile=T([(1, 0), (140, 0), (150, 0.8), (170, 0.8), (182, 0), (193, 0)])(f)),
                 cyclic=True, ground=lambda f: 'contact')
    m['cues'] = []
    m['state_fx'] = ['sleep.z', 'sleep.glow']
    return m


def sleep_enter():
    """Droops (head nods twice, half-closed eyes), a BIG yawn with an overhead stretch, rubs an eye, sits
    down, sways sleepily, the pillow and mat appear, it tips over onto its side onto the pillow, settles,
    tail comes to rest, eyes close → sleep_loop frame 1."""
    N = 112
    nod = T([(1, 0), (6, 0), (10, 1), (13, 0.2), (18, 1.1), (22, 0), (112, 0)])
    yawn = T([(1, 0), (22, 0), (30, 1), (40, 1), (46, 0), (112, 0)])
    rub = T([(1, 0), (44, 0), (48, 1), (56, 1), (60, 0), (112, 0)])
    rubw = math.pi * 2 / 5.0
    sit = T([(1, 0), (54, 0), (66, 1), (112, 1)])
    sway = T([(1, 0), (64, 0), (68, 1), (72, -1), (76, 0.5), (78, 0), (112, 0)])
    lie = T([(1, 0), (78, 0), (96, 1), (112, 1)])
    settle = T([(1, 0), (94, 0), (97, 1), (101, -0.4), (105, 0), (112, 0)])
    target = lie_pose(1)

    def pose(f, rzv, sqv, e, tl):
        n, y, r, s, lv = nod(f), yawn(f), rub(f), ease(sit(f)), lie(f)
        P = {'head_x': 9 * n - 12 * y + 5 * r, 'spine_x': 4 * n - 8 * y, 'squash': -0.015 * y,
             'armL_up': 124 * y + 98 * r, 'armR_up': 124 * y, 'armL_x': -12 * y + 62 * r, 'armR_x': -12 * y, 'pawL_x': 20 * y - 45 * r,
             'pawL_y': 8 * r * math.sin(rubw * f), 'head_z': 6 * r, 'head_y': -4 * r + 3 * n,
             'earL_out': clamp(6 * n + 8 * y, -6, 11), 'earR_out': clamp(6 * n + 8 * y, -6, 11), 'earL_fwd': -2 * n, 'earR_fwd': -2 * n,
             'tail_lift': 2}
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, 5, 30, t)
        P = blend(P, add(SIT, {'head_x': 6 + 4 * sway(f) ** 2, 'head_y': 8 * sway(f), 'spine_y': 5 * sway(f), 'armL_x': -45, 'armR_x': -45,
                               'armL_up': -12, 'armR_up': -12, 'pawL_x': -20, 'pawR_x': -20,
                               'earL_out': 8, 'earR_out': 8, 'tail_sway0': 10, 'tail_sway1': 14, 'tail_sway2': 16, 'tail_sway3': 18}), s)
        w = ease(lv)
        P = blend(P, target, w)
        P['head_x'] = P.get('head_x', 0) + 8 * math.sin(math.pi * w)                  # head lowers while tipping over
        P['head_x'] = P.get('head_x', 0) + 6 * settle(f)
        P['squash'] = P.get('squash', 0) + 0.02 * settle(f)
        return P
    m = run_clip('sleep_enter', N, pose, lambda f: face_of(drowsy=T([(1, 0), (4, 0), (10, 0.8), (22, 0.6), (46, 0.8), (88, 0.9), (98, 0), (112, 0)])(f),
                                                          yawn=yawn(f), asleep=T([(1, 0), (44, 0), (48, 1), (58, 1), (62, 0), (92, 0), (100, 1), (112, 1)])(f),
                                                          talk_o=0.35 * T([(1, 0), (100, 0), (112, 1)])(f),
                                                          blink_extra=blink_curve(f, [16, 72, 84])),
                 ends=('rest', 'loop'), ground=lambda f: 'contact' if f >= 58 else 'floor')
    m['cues'] = [{'t': fr(30), 'fx': 'puff.yawn', 'at': 'mouth', 'duration': 0.9},
                 {'t': fr(66), 'fx': 'prop.show', 'prop': 'sleep_mat', 'mode': 'fade'},
                 {'t': fr(70), 'fx': 'prop.show', 'prop': 'pillow', 'mode': 'pop'},
                 {'t': fr(97), 'fx': 'puff.soft', 'at': 'pillow', 'count': 6},
                 {'t': fr(100), 'fx': 'sleep.z', 'note': 'first Z drifts up; sleep_loop keeps emitting'}]
    m['end_pose'] = 'sleep_loop'
    m['props_end'] = ['pillow', 'sleep_mat']
    return m


def rise_from_lying(f, t0, t_sit, t_stand, extra_sit=None, extra_stand=None):
    """lying → (push up on the left paw) → sitting → (lean forward) → standing. Returns (P, phase)."""
    lv = 1 - ease((f - t0) / float(t_sit - t0)) if f > t0 else 1.0
    up = ease((f - t_sit) / float(t_stand - t_sit)) if f > t_sit else 0.0
    S = add(SIT, extra_sit or {})
    P = blend(S, lie_pose(1), lv)
    push = math.sin(math.pi * (1 - lv)) if 0 < lv < 1 else 0.0
    P = add(P, {'armL_up': -30 * push, 'armL_x': 30 * push, 'spine_x': 6 * push, 'head_x': -6 * push})
    P = blend(P, extra_stand or {}, up)
    P['spine_x'] = P.get('spine_x', 0) + 11 * math.sin(math.pi * up)
    P['armL_x'] = P.get('armL_x', 0) + 22 * math.sin(math.pi * up)
    P['armR_x'] = P.get('armR_x', 0) + 22 * math.sin(math.pi * up)
    return P, lv, up


def sleep_wake():
    """Natural waking: eyes flutter open, a long stretch while still lying (arms reach), rolls up onto
    the left paw into a sit, rubs both eyes, small yawn, gets up on its feet (lean forward → stand), a
    full-body shake from head to tail and a fresh smile → rest."""
    N = 100
    stretch_l = T([(1, 0), (8, 0), (16, 1), (24, 1), (30, 0), (100, 0)])
    rub = T([(1, 0), (48, 0), (52, 1), (60, 1), (64, 0), (100, 0)])
    yawn = T([(1, 0), (58, 0), (62, 1), (68, 1), (71, 0), (100, 0)])
    shake = T([(1, 0), (80, 0), (82, 1), (90, 1), (93, 0), (100, 0)])

    def pose(f, rzv, sqv, e, tl):
        P, lv, up = rise_from_lying(f, 30, 48, 78, extra_sit={'head_x': 6, 'armL_x': -45, 'armR_x': -45, 'armL_up': -12, 'armR_up': -12,
                                                              'tail_sway0': 10, 'tail_sway1': 14, 'tail_sway2': 16, 'tail_sway3': 18},
                                    extra_stand={})
        s, r, y, sh = stretch_l(f), rub(f), yawn(f), shake(f)
        P = add(P, {'armL_up': 40 * s * lv, 'armR_up': 40 * s * lv, 'armL_x': -40 * s * lv, 'armR_x': -40 * s * lv, 'pawL_x': 30 * s, 'pawR_x': 30 * s,
                    'leg_x': -20 * s * lv, 'head_x': -6 * s})
        P = add(P, {'armL_up': 98 * r, 'armR_up': 98 * r, 'armL_x': 62 * r, 'armR_x': 62 * r, 'pawL_x': -50 * r, 'pawR_x': -50 * r,
                    'pawL_y': 10 * r * math.sin(f * 1.3), 'pawR_y': -10 * r * math.sin(f * 1.3), 'head_x': 4 * r})
        P = add(P, {'head_x': -10 * y, 'armL_up': 30 * y, 'armR_up': 30 * y})
        osc = math.sin(2 * math.pi * f / 4.0) * sh
        P = add(P, {'head_y': 6 * osc, 'spine_y': -3 * osc, 'hips_y': 2 * osc, 'earL_out': 6 * abs(osc), 'earR_out': 6 * abs(osc),
                    'flap_y': 6 * osc})
        if up >= 1:
            for t in range(4):
                P[f'tail_sway{t}'] = clamp(16 * math.sin(2 * math.pi * f / 4.0 - 0.9 * t) * T([(1, 0), (84, 0), (88, 1), (96, 0), (100, 0)])(f), -20, 20)
        P['squash'] = P.get('squash', 0) + 0.02 * osc * 0
        return P
    m = run_clip('sleep_wake', N, pose, lambda f: face_of(asleep=T([(1, 1), (6, 1), (10, 0.3), (12, 0.8), (16, 0), (100, 0)])(f),
                                                         drowsy=T([(1, 0), (10, 0.7), (40, 0.5), (60, 0.4), (74, 0), (100, 0)])(f), yawn=yawn(f),
                                                         happy=0.0, smile=T([(1, 0), (74, 0), (78, 1), (100, 0)])(f),
                                                         blink_extra=blink_curve(f, [36, 76])),
                 ends=('loop', 'rest'), ground=lambda f: 'contact' if f <= 64 else 'floor')
    m['cues'] = [{'t': fr(12), 'fx': 'light.morning', 'duration': 3.6},
                 {'t': fr(60), 'fx': 'puff.yawn', 'at': 'mouth', 'duration': 0.6},
                 {'t': fr(70), 'fx': 'prop.hide', 'prop': 'pillow', 'mode': 'fade'},
                 {'t': fr(72), 'fx': 'prop.hide', 'prop': 'sleep_mat', 'mode': 'fade'},
                 {'t': fr(84), 'fx': 'shake.lines', 'at': 'chest', 'duration': 0.4},
                 {'t': fr(90), 'fx': 'sparkle.soft', 'at': 'head', 'count': 6}]
    m['start_pose'] = 'sleep_loop'
    m['props_start'] = ['pillow', 'sleep_mat']
    return m


# ================================================================== WAKE / ALARM
def wake_start():
    """Alarm-driven wake: the clock rings beside the sleeping fox; an ear twitches, ONE eye peeks open at
    the clock... and closes again (snooze tease); second ring — both eyes pop open, it rubs its face with
    a paw, sits up, a big arms-up stretch, stands and greets with an energetic wave and a bright smile → rest."""
    N = 100
    twitch = T([(1, 0), (6, 0), (8, 1), (12, -0.3), (16, 0), (100, 0)])
    peek = T([(1, 0), (14, 0), (18, 1), (28, 1), (32, 0), (100, 0)])
    pop = T([(1, 0), (36, 0), (38, 1), (44, 1), (48, 0), (100, 0)])
    rub = T([(1, 0), (38, 0), (42, 1), (50, 1), (53, 0), (100, 0)])
    stretch = T([(1, 0), (58, 0), (64, 1), (70, 1), (74, 0), (100, 0)])
    wave = T([(1, 0), (80, 0), (84, 1), (94, 1), (98, 0), (100, 0)])
    hop = T([(1, 0), (76, 0), (79, 0.03), (82, 0), (100, 0)])

    def pose(f, rzv, sqv, e, tl):
        P, lv, up = rise_from_lying(f, 44, 58, 78, extra_sit={'armL_x': -40, 'armR_x': -40, 'armL_up': -10, 'armR_up': -10, 'tail_sway0': 10, 'tail_sway1': 14, 'tail_sway2': 16,
                                                              'tail_sway3': 18})
        tw, pk, pp, r, st, wv = twitch(f), peek(f), pop(f), rub(f), stretch(f), wave(f)
        P = add(P, {'earL_out': 9 * tw + 4 * pp, 'earL_fwd': 7 * tw + 6 * pp, 'earR_fwd': 6 * pp, 'head_z': -4 * pk, 'head_x': -4 * pk - 4 * pp})
        P = add(P, {'armR_up': 98 * r, 'armR_x': 62 * r, 'pawR_x': -50 * r, 'pawR_y': 10 * r * math.sin(f * 1.4), 'head_y': 3 * r})
        P = add(P, {'armL_up': 122 * st, 'armR_up': 122 * st, 'armL_x': -14 * st, 'armR_x': -14 * st, 'pawL_x': 20 * st, 'pawR_x': 20 * st,
                    'head_x': -12 * st, 'spine_x': -10 * st})
        osc = math.sin(2 * math.pi * f / 8.0)
        P = add(P, {'armR_up': 120 * wv, 'armR_x': 10 * wv, 'pawR_y': 18 * osc * wv, 'pawR_x': 10 * wv, 'head_y': 5 * wv, 'head_x': -6 * wv,
                    'spine_y': -3 * wv})
        if up > 0.6:
            P.update(ears_of(e, 8 * wv + 4))
            for t in range(4):
                P[f'tail_sway{t}'] = clamp((1 - up) * P.get(f'tail_sway{t}', 0) + up * wag(f, 18 * (0.4 + wv), 12, t), -20, 20)
            P['tail_lift'] = clamp(6 + 4 * wv + 0.5 * tl, 0, 10)
        P['root_z'] = hop(f)
        return P
    m = run_clip('wake_start', N, pose, lambda f: face_of(asleep=T([(1, 1), (14, 1), (16, 0), (30, 0), (32, 1), (36, 1), (37, 0), (100, 0)])(f),
                                                         peek_l=T([(1, 0), (15, 0), (18, 1), (28, 1), (31, 0), (100, 0)])(f),
                                                         surprised=pop(f), drowsy=T([(1, 0), (48, 0), (52, 0.5), (60, 0.3), (66, 0), (100, 0)])(f),
                                                         yawn=T([(1, 0), (60, 0), (64, 1), (69, 1), (72, 0), (100, 0)])(f),
                                                         happy=T([(1, 0), (78, 0), (82, 1), (94, 1), (98, 0), (100, 0)])(f),
                                                         blink_extra=blink_curve(f, [56])),
                 ends=('loop', 'rest'), ground=lambda f: 'contact' if f <= 64 else 'floor')
    m['cues'] = [{'t': fr(1), 'fx': 'prop.show', 'prop': 'alarm_clock', 'mode': 'pop'},
                 {'t': fr(2), 'fx': 'alarm.ring', 'until': fr(14)},
                 {'t': fr(33), 'fx': 'alarm.ring', 'until': fr(44)},
                 {'t': fr(38), 'fx': 'burst.exclaim', 'duration': 0.5},
                 {'t': fr(46), 'fx': 'light.morning', 'duration': 2.4},
                 {'t': fr(52), 'fx': 'prop.hide', 'prop': 'pillow', 'mode': 'fade'},
                 {'t': fr(54), 'fx': 'prop.hide', 'prop': 'sleep_mat', 'mode': 'fade'},
                 {'t': fr(66), 'fx': 'puff.yawn', 'at': 'mouth', 'duration': 0.5},
                 {'t': fr(84), 'fx': 'sparkle', 'at': 'hand_r', 'count': 10},
                 {'t': fr(96), 'fx': 'prop.hide', 'prop': 'alarm_clock', 'mode': 'poof'}]
    m['start_pose'] = 'sleep_loop'
    m['props_start'] = ['pillow', 'sleep_mat']
    return m


def wake_late():
    """Late, but light-hearted: a floating clock appears with racing hands; the fox glances at it, does a
    double take (wide eyes, paws to the cheeks — 'oops!'), then giggles behind its paw, wags a finger
    at the viewer ('tsk tsk, sleepyhead'), winks and gives a thumbs-up — better late than never → rest."""
    N = 88
    glance = T([(1, 0), (4, 0), (8, 1), (11, 0.2), (14, 0), (88, 0)])
    take = T([(1, 0), (14, 0), (17, 1), (30, 1), (34, 0), (88, 0)])
    giggle = T([(1, 0), (32, 0), (36, 1), (48, 1), (52, 0), (88, 0)])
    tsk = T([(1, 0), (50, 0), (54, 1), (68, 1), (72, 0), (88, 0)])
    thumbs = T([(1, 0), (68, 0), (72, 1), (82, 1), (86, 0), (88, 0)])
    hop = T([(1, 0), (14, 0), (16, 0.035), (19, 0), (88, 0)])
    sq = T([(1, 0), (12, 0.04), (14, -0.02), (19, 0.03), (22, 0), (88, 0)])

    def pose(f, rzv, sqv, e, tl):
        g, tk, gg, ts, th = glance(f), take(f), giggle(f), tsk(f), thumbs(f)
        jig = math.sin(2 * math.pi * f / 5.0) * gg
        wiggle = math.sin(2 * math.pi * f / 7.0) * ts
        P = {'head_z': 16 * g + 10 * tk, 'head_x': -10 * g - 6 * tk + 4 * gg, 'head_y': -4 * g,
             # paws to the cheeks
             'armL_up': 100 * tk, 'armR_up': 100 * tk, 'armL_x': 68 * tk, 'armR_x': 68 * tk, 'pawL_x': -55 * tk, 'pawR_x': -55 * tk,
             'spine_x': -4 * tk + 6 * gg}
        # giggle behind the right paw: paw at the mouth, shoulders bob
        P = add(P, {'armR_up': 86 * gg, 'armR_x': 72 * gg, 'pawR_x': -62 * gg, 'squash': 0.018 * jig, 'head_y': 8 * gg + 4 * jig, 'spine_y': 3 * jig, 'spine_x': 4 * gg})
        # finger wag: right arm forward-up, paw wiggles; left paw on the hip
        P = add(P, {'armR_up': 95 * ts, 'armR_x': 55 * ts, 'pawR_y': 24 * wiggle, 'pawR_x': -5 * ts, 'armL_up': 22 * ts, 'armL_x': -14 * ts,
                    'pawL_x': 30 * ts, 'head_y': -8 * ts + 3 * wiggle, 'head_x': 3 * ts})
        P = add(P, {'armR_up': 80 * th, 'armR_x': 40 * th, 'pawR_x': -55 * th, 'head_y': 8 * th, 'head_z': -6 * th, 'spine_y': -3 * th})
        P.update(ears_of(e, 10 * tk + 4 * th, 3 * gg, 4 * ts))
        P['tail_lift'] = clamp(4 * tk + 6 * th + 0.5 * tl, 0, 10)
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, 6 + 12 * (gg + th), 10, t)
        return P
    m = run_clip('wake_late', N, pose, lambda f: face_of(surprised=take(f), happy=giggle(f), smile=0.8 * tsk(f), wink_r=thumbs(f),
                                                        blink_extra=blink_curve(f, [6, 60])), rz=hop, sq=sq, ground=lambda f: 'floor')
    m['cues'] = [{'t': fr(3), 'fx': 'clock.late', 'until': fr(52), 'note': 'floating clock with racing hands (no real time shown)'},
                 {'t': fr(16), 'fx': 'burst.exclaim', 'duration': 0.6},
                 {'t': fr(17), 'fx': 'sweat.burst', 'at': 'head', 'count': 3},
                 {'t': fr(37), 'fx': 'note.giggle', 'at': 'mouth', 'count': 3},
                 {'t': fr(73), 'fx': 'sparkle', 'at': 'hand_r', 'count': 8}]
    return m


def alarm_pose(f, L=48):
    """alarm_ring at loop frame f (1..49): beside the ringing clock (fox's right front), pointing at it
    with the right paw, two urgent bounces per loop, head flicking between the clock and the viewer."""
    p = 2 * math.pi * (f - 1) / L
    b = math.sin(2 * p)
    look = 0.5 + 0.5 * math.cos(p)                                     # 1 = at the clock, 0 = at the viewer
    P = {'root_z': 0.022 * max(0.0, b) ** 1.5, 'squash': -0.03 * max(0.0, b) + 0.04 * max(0.0, -b),
         'armR_up': 40 + 6 * b, 'armR_x': -55 - 4 * b, 'pawR_x': 8, 'pawR_y': -6,
         'armL_up': 40 + 25 * max(0.0, b), 'armL_x': 10, 'pawL_x': -10 + 10 * b,
         'spine_y': 5 * look, 'hips_y': 2 * look, 'spine_x': 2,
         'head_z': -22 * look + 4 * (1 - look), 'head_x': 8 * look - 4 * (1 - look) + 2 * b, 'head_y': 4 * look,
         'earL_fwd': 10 + 2 * b, 'earR_fwd': 10 + 2 * b, 'earL_out': 6 - 3 * b, 'earR_out': 6 - 3 * b,
         'tail_lift': 9 + 1 * b, 'flap_out': 3 + 3 * max(0.0, b)}
    for t in range(4):
        P[f'tail_sway{t}'] = wag(f, 14, L / 4, t)
    return P


def alarm_ring():
    N = 49
    m = run_clip('alarm_ring', N, lambda f, rzv, sqv, e, tl: alarm_pose(f),
                 lambda f: face_of(surprised=0.55 + 0.25 * per(f, 48, 2), blink_extra=blink_curve(f, [36])), cyclic=True, ground=lambda f: 'floor')
    m['cues'] = []
    m['state_fx'] = ['alarm.ring']
    return m


def alarm_success():
    """From the ringing loop: winds up, SLAPS the clock button (squash, clock stops — sparkle), a relieved
    exhale with the paw on the chest, then puffs up proudly and gives a thumbs-up with a hop → rest; the
    clock pops away."""
    N = 88
    hit = 14
    wind = T([(1, 0), (6, 1), (hit - 2, 1), (hit, 0), (88, 0)])          # two-frame strike: snappy, no one-frame pop
    slap = T([(1, 0), (hit - 2, 0), (hit, 1), (20, 1), (26, 0), (88, 0)])
    relief = T([(1, 0), (24, 0), (30, 1), (44, 1), (50, 0), (88, 0)])
    proud = T([(1, 0), (48, 0), (54, 1), (76, 1), (84, 0), (88, 0)])
    hop = T([(1, 0), (56, 0), (59, 0.04), (63, 0), (88, 0)])
    sq = T([(1, 0), (6, -0.02), (hit - 2, -0.02), (hit, 0.06), (17, 0.02), (22, 0), (30, -0.01), (40, 0.01), (50, 0), (55, 0.04), (57, -0.03),
            (61, 0), (63, 0.03), (66, 0), (88, 0)])
    out = T([(1, 0), (3, 1), (88, 1)])
    a1 = alarm_pose(1)

    def pose(f, rzv, sqv, e, tl):
        wd, sl, rl, pr = wind(f), slap(f), relief(f), proud(f)
        P = {'armR_up': 110 * wd + 35 * sl, 'armR_x': 10 * wd - 58 * sl, 'pawR_x': -20 * wd + 25 * sl,
             'spine_y': 6 * wd + 10 * sl, 'hips_y': 2 * wd + 4 * sl, 'spine_x': 4 * sl, 'head_z': -24 * wd - 24 * sl, 'head_x': 7 * wd + 10 * sl,
             'armL_up': 30 * wd + 40 * sl, 'pawL_x': -10}
        P = add(P, {'armL_up': 85 * rl, 'armL_x': 40 * rl, 'pawL_x': -50 * rl, 'head_x': 8 * rl, 'spine_x': 6 * rl, 'head_y': 4 * rl})
        P = add(P, {'armR_up': 80 * pr, 'armR_x': 40 * pr, 'pawR_x': -55 * pr, 'armL_up': 22 * pr, 'armL_x': -14 * pr, 'pawL_x': 30 * pr,
                    'spine_x': -6 * pr, 'head_x': -6 * pr, 'head_y': 6 * pr})
        P.update(ears_of(e, 10 * sl + 6 * pr, 8 * rl))
        P['tail_lift'] = clamp(5 + 5 * pr + 0.5 * tl, 0, 10)
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, 8 + 10 * pr, 12, t)
        return blend(a1, P, out(f))
    m = run_clip('alarm_success', N, pose, lambda f: face_of(surprised=0.6 * wind(f), determined=slap(f), happy=relief(f) * 0.0 + T([(1, 0), (24, 0), (28, 0.0), (88, 0)])(f),
                                                            asleep=0.0, drowsy=0.6 * relief(f), talk_o=0.8 * relief(f), proud=proud(f),
                                                            smile=T([(1, 0), (76, 0), (80, 0.8), (88, 0)])(f), blink_extra=blink_curve(f, [50])),
                 rz=hop, sq=sq, ends=('loop', 'rest'), ground=lambda f: 'floor')
    m['cues'] = [{'t': fr(hit), 'fx': 'alarm.stop', 'note': 'clock button pressed: ringing stops, clock squashes'},
                 {'t': fr(hit), 'fx': 'burst.radial', 'at': 'alarm_clock', 'duration': 0.35},
                 {'t': fr(hit + 1), 'fx': 'sparkle', 'at': 'alarm_clock', 'count': 10},
                 {'t': fr(32), 'fx': 'puff.sigh', 'at': 'mouth'},
                 {'t': fr(57), 'fx': 'burst.stars', 'at': 'hand_r', 'count': 8},
                 {'t': fr(80), 'fx': 'prop.hide', 'prop': 'alarm_clock', 'mode': 'poof'}]
    m['start_pose'] = 'alarm_ring'
    m['props_start'] = ['alarm_clock']
    m['hit_frame'] = hit
    return m


# ================================================================== COOLDOWN
def cooldown_pose(f, L=120):
    """cooldown_wait at loop frame f (1..121): patient. Gentle weight shifts heel-to-toe, hands behind
    the back, glances up at the floating timer (fox's upper left), hums (small O mouth), tail slow sway."""
    br = per(f, L, 2)
    rock = per(f, L, 2, 0.4)
    glance = T([(1, 0), (20, 0), (28, 1), (44, 1), (52, 0), (80, 0), (86, 0.8), (96, 0.8), (102, 0), (121, 0)])(f)
    P = {'squash': 0.008 * br, 'hips_y': 2 * per(f, L, 1), 'spine_y': -1 * per(f, L, 1), 'spine_x': -2 + 2 * rock, 'hips_x': -1.5 * rock,
         'foot_x': 0.0, 'head_z': 18 * glance + 3 * per(f, L, 1), 'head_x': -10 * glance + 1.5 * br, 'head_y': 4 * glance + 2 * per(f, L, 1, 1.0),
         'armL_up': 8, 'armR_up': 8, 'armL_x': 42, 'armR_x': 42, 'pawL_x': 10, 'pawR_x': 10,          # paws behind the back
         'earL_fwd': 3 + 4 * glance, 'earR_fwd': 3 + 4 * glance, 'earL_out': 3 + 2 * per(f, L, 2, 0.9), 'earR_out': 3 + 2 * per(f, L, 2, 0.9),
         'tail_lift': 4 + 1.5 * br}
    for t in range(4):
        P[f'tail_sway{t}'] = clamp(10 * per(f, L, 2, -0.7 * t) * (1 + 0.15 * t), -20, 20)
    return P


def cooldown_wait():
    N = 121
    m = run_clip('cooldown_wait', N, lambda f, rzv, sqv, e, tl: cooldown_pose(f),
                 lambda f: face_of(talk_o=0.5 * T([(1, 0), (56, 0), (60, 1), (74, 1), (78, 0), (121, 0)])(f), smile=0.35,
                                   blink_extra=blink_curve(f, [12, 66, 108])), cyclic=True, ground=lambda f: 'floor')
    m['cues'] = []
    m['state_fx'] = ['timer.watch']
    return m


def cooldown_impatient_pose(f, L=96):
    tap = max(0.0, math.sin(2 * math.pi * (f - 1) / 12.0))          # right foot taps 8× per loop
    glance = T([(1, 0), (16, 0), (22, 1), (36, 1), (42, 0), (64, 0), (70, 1), (80, 1), (86, 0), (97, 0)])(f)
    sigh = T([(1, 0), (44, 0), (50, 1), (58, 0), (97, 0)])(f)
    P = {'squash': 0.006 * per(f, L, 2) + 0.01 * sigh, 'footR_x': -18 * tap, 'legR_x': -6 * tap, 'legL_x': 0, 'footL_x': 0,
         'hips_y': -2, 'spine_y': 1, 'spine_x': 2 + 6 * sigh,
         # arms crossed in front of the chest
         'armL_up': 95, 'armR_up': 98, 'armL_x': 45, 'armR_x': 48, 'pawL_x': -65, 'pawR_x': -68,
         'head_z': 18 * glance - 6 * (1 - glance), 'head_x': -14 * glance + 8 * sigh, 'head_y': 6 * glance - 4 * (1 - glance),
         'earL_out': 6 + 3 * sigh, 'earR_out': 6 + 3 * sigh, 'earL_fwd': 1, 'earR_fwd': 1,
         'tail_lift': 3}
    for t in range(4):
        P[f'tail_sway{t}'] = clamp(16 * math.sin(2 * math.pi * (f - 1) / 24.0 - 0.8 * t), -20, 20)   # impatient flicks
    return P


def cooldown_wait_impatient():
    N = 97
    sigh = T([(1, 0), (44, 0), (50, 1), (58, 0), (97, 0)])
    m = run_clip('cooldown_wait_impatient', N, lambda f, rzv, sqv, e, tl: cooldown_impatient_pose(f),
                 lambda f: face_of(focus=0.6, drowsy=0.3 * sigh(f), talk_o=0.7 * sigh(f), blink_extra=blink_curve(f, [30, 84])),
                 cyclic=True, ground=lambda f: 'floor')
    m['cues'] = []
    m['state_fx'] = ['timer.watch']
    m['variant_of'] = 'cooldown_wait'
    return m


def cooldown_complete():
    """The timer dings: ears shoot up, a surprised-happy 'ready!', fist pump with a hop, the timer bursts
    into sparkles and is gone; settle with a happy wag → rest."""
    N = 64
    perk = T([(1, 0), (2, 0), (5, 1), (14, 1), (20, 0), (64, 0)])
    pump = T([(1, 0), (14, 0), (18, 1), (32, 1), (40, 0), (64, 0)])
    rz = T([(1, 0), (14, 0), (19, 0.06), (24, 0), (64, 0)])
    sq = T([(1, 0), (4, -0.02), (10, 0.02), (14, 0.05), (16, -0.04), (19, -0.01), (23, -0.01), (24, 0.04), (27, 0), (64, 0)])
    out = T([(1, 0), (6, 1), (64, 1)])
    c1 = cooldown_pose(1)

    def pose(f, rzv, sqv, e, tl):
        pk, pu = perk(f), pump(f)
        P = {'head_x': -8 * pk - 4 * pu, 'head_z': 14 * pk * (1 - pu), 'spine_x': -4 * pk - 4 * pu,
             'armR_up': 30 * pk + 120 * pu, 'armR_x': 20 * pk + 0 * pu, 'pawR_x': -50 * pu, 'armL_up': 20 * pk + 90 * pu, 'armL_x': 40 * pu,
             'pawL_x': -40 * pu, 'tail_lift': clamp(8 * pk + 10 * pu + 0.5 * tl, 0, 10)}
        P.update(ears_of(e, 12 * pk + 6 * pu))
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, 8 + 12 * pu, 10, t)
        return blend(c1, P, out(f))
    m = run_clip('cooldown_complete', N, pose, lambda f: face_of(surprised=perk(f) * (1 - pump(f)), excited=pump(f),
                                                                smile=T([(1, 0), (38, 0), (44, 1), (60, 0), (64, 0)])(f), blink_extra=blink_curve(f, [50])),
                 rz=rz, sq=sq, ends=('loop', 'rest'), ground=lambda f: 'floor')
    m['cues'] = [{'t': fr(2), 'fx': 'timer.ding', 'note': 'timer prop flashes / rings visually (no sound)'},
                 {'t': fr(3), 'fx': 'ring.shockwave', 'at': 'timer', 'duration': 0.5},
                 {'t': fr(19), 'fx': 'prop.hide', 'prop': 'timer', 'mode': 'burst'},
                 {'t': fr(19), 'fx': 'sparkle', 'at': 'timer', 'count': 12},
                 {'t': fr(20), 'fx': 'burst.stars', 'at': 'hand_r', 'count': 8}]
    m['start_pose'] = 'cooldown_wait'
    m['props_start'] = ['timer']
    return m


# ================================================================== registry
CATEGORIES = {
    'study': ['study_start', 'study_focus', 'study_complete'],
    'sports': ['sports_start', 'sports_active', 'sports_complete'],
    'wake_alarm': ['wake_start', 'wake_late', 'alarm_ring', 'alarm_success'],
    'sleep': ['sleep_enter', 'sleep_loop', 'sleep_wake'],
    'cooldown': ['cooldown_wait', 'cooldown_wait_impatient', 'cooldown_complete'],
}
BUILDERS = {n: globals()[n] for c in CATEGORIES.values() for n in c}
# role, head_control, face_control (as E1/E2: 1 = the clip owns the head / face; 0.5 = shared with look-at / moods)
ROLES = {
    'study_focus': ('state loop: study (replaces idle as the base clip)', 0.8, 0.5),
    'sports_active': ('state loop: exercise (base clip)', 1.0, 0.9),
    'alarm_ring': ('state loop: alarm (base clip, persists until dismissed)', 1.0, 1.0),
    'sleep_loop': ('state loop: sleep (base clip)', 1.0, 1.0),
    'cooldown_wait': ('state loop: cooldown (base clip)', 0.5, 0.5),
    'cooldown_wait_impatient': ('state loop variant: cooldown after the runtime impatience delay', 0.5, 0.6),
}
LARGE_MOTION = {'study_start', 'study_complete', 'sports_start', 'sports_complete', 'wake_start', 'sleep_enter', 'sleep_wake',
                'alarm_success', 'cooldown_complete', 'sports_active', 'wake_late'}
STATE_OF = {'study_focus': 'study', 'sports_active': 'sports', 'alarm_ring': 'alarm', 'sleep_loop': 'sleep',
            'cooldown_wait': 'cooldown', 'cooldown_wait_impatient': 'cooldown'}


def measure_anchors():
    """Prop anchors measured on the posed rig (three.js frame: x = fox's left, y up, z front)."""
    rig = O_['FOX_RIG']
    sc = bpy.context.scene
    M = rig.matrix_world

    def at(action, f, bone, tail=False):
        rig.animation_data.action = bpy.data.actions[action]
        for n in A.FACE_PARTS:
            ad = O_[n].data.shape_keys.animation_data
            if ad:
                ad.action = bpy.data.actions[action]
        sc.frame_set(f)
        pb = rig.pose.bones[bone]
        v = M @ (pb.tail if tail else pb.head)
        return [round(v.x, 4), round(v.z, 4), round(-v.y, 4)]
    a = {}
    pl, pr = at('study_focus', 1, 'ATT_HAND_L', True), at('study_focus', 1, 'ATT_HAND_R', True)
    a['notebook'] = {'pos': [round((pl[i] + pr[i]) / 2, 4) for i in range(3)], 'frame': 'fox root', 'from': 'study_focus f1 paws midpoint',
                     'paw_l': pl, 'paw_r': pr}
    a['alarm_clock'] = {'paw_at_hit': at('alarm_success', 14, 'ATT_HAND_R', True), 'frame': 'fox root',
                        'from': 'alarm_success hit frame, right paw tip'}
    a['pillow'] = {'head': at('sleep_loop', 1, 'HEAD'), 'head_top': at('sleep_loop', 1, 'HEAD', True), 'frame': 'fox root',
                   'from': 'sleep_loop f1 head bone'}
    a['hips_seated'] = at('study_focus', 1, 'HIPS')
    a['hips_lying'] = at('sleep_loop', 1, 'HIPS')
    return a


def main():
    global O_, R_
    only = [s for s in os.environ.get('FOX_CLIPS', '').split(',') if s]
    bpy.ops.wm.open_mainfile(filepath=A.SRC)
    O_ = bpy.data.objects
    R_ = A.Rig(O_['FOX_RIG'])
    subs = [m for o in O_ for m in o.modifiers if m.type == 'SUBSURF' and m.show_viewport]
    for m in subs:
        m.show_viewport = False          # ground contact on the runtime cage; restored before saving
    clips = {}
    for cat, names in CATEGORIES.items():
        for n in names:
            if only and n not in only:
                continue
            m = BUILDERS[n]()
            role, hc, fc = ROLES.get(n, ('one-shot', 1.0, 1.0))
            m.setdefault('start_pose', 'rest' if not m['loop'] else 'loop')
            m.setdefault('end_pose', 'rest' if not m['loop'] else 'loop')
            clips[n] = dict(m, category=cat, role=role, head_control=hc, face_control=fc, large_motion=n in LARGE_MOTION,
                            state=STATE_OF.get(n))
            print(f'  {n:24s} {m["frames"]:4d} f  {m["duration_s"]:.3f} s  loop={m["loop"]}  ground={len(GROUND_LOG.get(n, []))}', flush=True)
    anchors = measure_anchors() if not only else {}
    rig = O_['FOX_RIG']
    rig.animation_data.action = None
    for n in A.FACE_PARTS:
        ad = O_[n].data.shape_keys.animation_data
        if ad:
            ad.action = None
        for kb in O_[n].data.shape_keys.key_blocks[1:]:
            kb.value = 0.0
    for pb in rig.pose.bones:
        pb.matrix_basis.identity()
    for m in subs:
        m.show_viewport = True
    bpy.context.scene['fox_gate'] = 'G2 daily life'
    os.makedirs(MOD_DIR, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=OUT if not only else OUT.replace('.blend', '_partial.blend'), compress=True)
    spec = {
        'asset': 'LifeQuest Fox V2', 'gate': 'G2', 'module': 'g2_daily_life', 'module_version': 'g2.0', 'fps': FPS,
        'source_rig': '03_RIG/fox_rig_d1_1.blend', 'base_animation_set': '06_EXPORTS/glb/fox_v2_anim_e2.glb (E2 core clips, unchanged)',
        'requires_modules': ['g1_1 (optional — G2 does not depend on it)'],
        'categories': CATEGORIES, 'clips': clips, 'prop_anchors': anchors,
        'ground_contact': {n: {'frames_corrected': len(v), 'max_abs_dz_m': max([abs(d) for _, d in v] or [0])} for n, v in GROUND_LOG.items()},
        'expressions_added': ['asleep', 'yawn', 'peek_l', 'wink_r', 'drowsy', 'focus', 'determined', 'pant', 'talk_o'],
        'cue_note': 'cues are runtime VFX / prop timeline entries (seconds from clip start); props are FX_PROP_* objects owned by the '
                    'effects manager, never part of the Fox mesh, skeleton or cosmetics.',
        'pose_note': 'start_pose / end_pose: rest = idle rest pose; <loop name> = frame 1 of that state loop',
        'head_control_note': '1 = clip owns the head (look-at off); 0.5 = shared with look-at',
        'face_control_note': '1 = clip drives the facial morphs; < 1 = moods blend in',
    }
    if not only:
        json.dump(spec, open(os.path.join(MOD_DIR, 'anim_spec_g2.json'), 'w'), indent=2)
    print('anchors', json.dumps(anchors))
    print('saved', OUT)


if __name__ == '__main__':
    main()
