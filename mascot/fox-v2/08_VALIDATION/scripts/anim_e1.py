"""Gate E1 — interactive animation prototype clips.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/anim_e1.py
Reads   03_RIG/fox_rig_d1_1.blend          (approved D1.1 rig, never written)
Writes  04_ANIMATIONS/fox_anim_e1.blend     (same model/skeleton/morphs + E1 actions)
        04_ANIMATIONS/anim_spec_e1.json     (clip contract for the runtime)

Clips (24 fps, one slotted action each: armature + morph-target weights)
  loops     idle (5 s) · walk (2 gait cycles) · run (2 gait cycles)
  one-shots happy · wave · head_pet · tail_touch   (start and end on the exact rest pose)
`look_at_cursor` is procedural in the runtime (see the viewer) and has no clip.

Locomotion is SOLVED, not hand-keyed: the rig has no knees and no IK, so every
frame a small least-squares solve finds root height/side shift, waddle roll and
leg swing angles that keep the planted foot exactly fixed relative to the ground
(the clip is in place; the runtime moves the character at `speed_mps`).  Feet stay
flat while planted, roll over the toe before lift-off, and the swing foot clears
the ground through hip roll (weight shift onto the planted leg).
Secondary motion (ears, tail, scarf flap) is either phase-lagged periodic motion
(loops — guaranteed seamless) or a damped spring driven by the body motion.
The facial system is the D1.1 morph-target contract, unchanged; expressions are
combinations of the existing morphs only.
"""
import json
import math
import os
import sys

import bpy
import numpy as np
from mathutils import Matrix, Quaternion, Vector

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from rig_d1_1 import EXPRESSIONS, VISIBLE_PARTS, SWAP_PARTS, EYES, TAILS  # noqa: E402

ROOT_DIR = os.path.abspath(os.path.join(HERE, '..', '..'))
SRC = os.path.join(ROOT_DIR, '03_RIG', 'fox_rig_d1_1.blend')
OUT_DIR = os.path.join(ROOT_DIR, '04_ANIMATIONS')
OUT = os.path.join(OUT_DIR, 'fox_anim_e1.blend')
FPS = 24
FACE_PARTS = VISIBLE_PARTS + SWAP_PARTS

# E1 expression set = D1.1 expressions + two combinations of EXISTING morphs
EXPR = dict(EXPRESSIONS)
EXPR['smile'] = {'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_Smile': {'show': 1}}
EXPR['excited'] = {'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_Open': {'show': 1}, 'FOX_Mouth_Tongue': {'show': 1}}


# ------------------------------------------------------------------ math helpers
def Q(x=0.0, y=0.0, z=0.0):
    """Rotation in armature axes (degrees): yaw Z ∘ pitch X ∘ roll/side Y."""
    return (Quaternion((0, 0, 1), math.radians(z)) @ Quaternion((1, 0, 0), math.radians(x))
            @ Quaternion((0, 1, 0), math.radians(y)))


def smoothstep(a, b, x):
    t = min(1.0, max(0.0, (x - a) / (b - a))) if b != a else float(x >= a)
    return t * t * (3 - 2 * t)


def smoother(t):
    t = min(1.0, max(0.0, t))
    return t * t * t * (t * (6 * t - 15) + 10)


def hermite(p0, p1, m0, m1, s):
    s2, s3 = s * s, s * s * s
    return (2 * s3 - 3 * s2 + 1) * p0 + (s3 - 2 * s2 + s) * m0 + (-2 * s3 + 3 * s2) * p1 + (s3 - s2) * m1


def track(keys, f):
    """Key-pose curve: keys = [(frame, value), ...]; eased (smootherstep) between
    keys with Catmull-Rom style blending for continuous velocity."""
    if f <= keys[0][0]:
        return keys[0][1]
    if f >= keys[-1][0]:
        return keys[-1][1]
    for i in range(len(keys) - 1):
        (f0, v0), (f1, v1) = keys[i], keys[i + 1]
        if f0 <= f <= f1:
            s = (f - f0) / (f1 - f0)
            # tangents (finite difference, zero at holds/extremes -> no overshoot unless keyed)
            def tan(j):
                if j <= 0 or j >= len(keys) - 1:
                    return 0.0
                (a, va), (b, vb), (c, vc) = keys[j - 1], keys[j], keys[j + 1]
                if (vb - va) * (vc - vb) <= 0:
                    return 0.0
                return 0.5 * ((vb - va) / (b - a) + (vc - vb) / (c - b))
            return hermite(v0, v1, tan(i) * (f1 - f0), tan(i + 1) * (f1 - f0), s)
    return keys[-1][1]


def spring(drive, k=120.0, d=11.0, periodic=False, sub=8):
    """Damped spring x'' = -k x - d x' + drive (per-frame drive samples)."""
    dt = 1.0 / FPS / sub
    x = v = 0.0
    out = []
    reps = 4 if periodic else 1
    for r in range(reps):
        out = []
        for a in drive:
            for _ in range(sub):
                v += (-k * x - d * v + a) * dt
                x += v * dt
            out.append(x)
    return out


def d2(vals, periodic=False):
    n = len(vals)
    res = []
    for i in range(n):
        if periodic:
            a, b, c = vals[(i - 1) % n], vals[i], vals[(i + 1) % n]
        else:
            a, b, c = vals[max(0, i - 1)], vals[i], vals[min(n - 1, i + 1)]
        res.append((a - 2 * b + c) * FPS * FPS)
    return res


# ------------------------------------------------------------------ rig helpers
class Rig:
    def __init__(self, rig):
        self.rig = rig
        self.rest = {b.name: b.matrix_local.copy() for b in rig.data.bones}
        self.R = {n: m.to_quaternion() for n, m in self.rest.items()}

    def lq(self, b, Qa):
        """Armature-axis rotation (relative to the posed parent) -> bone-local basis quaternion."""
        R = self.R[b]
        return R.inverted() @ Qa @ R

    def lloc(self, b, v):
        return self.R[b].inverted() @ Vector(v)

    # forward kinematics of ROOT -> LEG -> FOOT (pure rotations + ROOT translation)
    def leg_chain(self, root_loc, root_Q, leg, leg_Q, foot_world_R):
        rr, rl, rf = self.rest['ROOT'], self.rest[f'LEG_{leg}'], self.rest[f'FOOT_{leg}']
        Mroot = rr @ Matrix.Translation(self.lloc('ROOT', root_loc)) @ self.lq('ROOT', root_Q).to_matrix().to_4x4()
        Mleg = Mroot @ (rr.inverted() @ rl) @ self.lq(f'LEG_{leg}', leg_Q).to_matrix().to_4x4()
        rel = (rl.inverted() @ rf).to_quaternion()
        qb = (Mleg.to_quaternion() @ rel).inverted() @ foot_world_R @ rf.to_quaternion()
        Mfoot = Mleg @ (rl.inverted() @ rf) @ qb.to_matrix().to_4x4()
        return Mfoot, qb

    def foot_point(self, Mfoot, leg, p_rest):
        return Mfoot @ self.rest[f'FOOT_{leg}'].inverted() @ Vector(p_rest)


class Keyer:
    """One slotted action: armature + every facial shape-key datablock."""

    def __init__(self, name, O):
        self.O = O
        self.rig = O['FOX_RIG']
        self.act = bpy.data.actions.new(name)
        self.act.use_fake_user = True
        self.rig.animation_data_create()
        self.rig.animation_data.action = self.act
        self.prevq = {}
        for n in FACE_PARTS:
            kd = O[n].data.shape_keys
            kd.animation_data_create()
            kd.animation_data.action = self.act

    def basis(self, f, b, q=None, loc=None, scale=None):
        pb = self.rig.pose.bones[b]
        if q is not None:
            q = q.normalized()
            p = self.prevq.get(b)
            if p is not None and p.dot(q) < 0:
                q = -q
            self.prevq[b] = q
            pb.rotation_mode = 'QUATERNION'
            pb.rotation_quaternion = q
            pb.keyframe_insert('rotation_quaternion', frame=f, group=b)
        if loc is not None:
            pb.location = loc
            pb.keyframe_insert('location', frame=f, group=b)
        if scale is not None:
            pb.scale = scale
            pb.keyframe_insert('scale', frame=f, group=b)

    def face(self, f, weights):
        """weights: {expression_name: w} (+ optional 'blink': w)."""
        blink = weights.get('blink_extra', 0.0)
        for n in FACE_PARTS:
            for kb in self.O[n].data.shape_keys.key_blocks[1:]:
                v = sum(w * EXPR[e].get(n, {}).get(kb.name, 0.0) for e, w in weights.items() if e in EXPR)
                if kb.name == 'Blink' and n in EYES:
                    v = v + blink * (1 - min(1.0, sum(w * EXPR[e].get(n, {}).get('hide', 0.0)
                                                      for e, w in weights.items() if e in EXPR)))
                kb.value = min(1.0, max(0.0, v))
                kb.keyframe_insert('value', frame=f)

    def finish(self, start, end, cyclic):
        for fc in self._fcurves():
            for kp in fc.keyframe_points:
                kp.interpolation = 'LINEAR'
        self.act.frame_range = (start, end)
        self.act.use_frame_range = True
        self.act.use_cyclic = cyclic

    def _fcurves(self):
        from bpy_extras.anim_utils import action_get_channelbag_for_slot
        for slot in self.act.slots:
            cb = action_get_channelbag_for_slot(self.act, slot)
            if cb:
                yield from cb.fcurves


def blink_curve(f, centers, close=2, hold=1, open_=3):
    """0..1 blink weight for blinks centred on the given frames."""
    w = 0.0
    for c in centers:
        a, b, e = c - close, c + hold, c + hold + open_
        if a <= f <= c:
            w = max(w, smoothstep(a, c, f))
        elif c < f <= b:
            w = 1.0
        elif b < f <= e:
            w = max(w, 1 - smoothstep(b, e, f))
    return w


# ------------------------------------------------------------------ locomotion
class Gait:
    """Solves a periodic in-place gait.  Angles in DEGREES.
    Unknowns per frame x = [root x, root z, root roll, leg swing L, leg swing R,
    extra heel lift L, extra heel lift R].  Planted feet keep their world pose
    (flat, or rolling over the toe: the heel lift of a rear planted foot is solved
    so double support needs no hip roll); the swing foot follows a Hermite path
    that leaves and lands with zero ground-relative velocity and clears the ground
    through hip roll (weight shift onto the planted leg) and a little abduction."""

    def __init__(self, rig, sole, name, T, c, S, lift, roll0, toe_roll, toe_start, abduct, flight_lift=0.0, y_off=0.0, free_heel=True, heel=0.0, heel_end=0.3, toe_return=0.6, min_clear=0.0035):
        self.r, self.sole, self.name = rig, sole, name
        self.T, self.c, self.S, self.lift = T, c, S, lift
        self.roll0, self.toe_roll, self.toe_start, self.abduct, self.flight_lift = roll0, toe_roll, toe_start, abduct, flight_lift
        self.y_off = y_off
        self.free_heel = free_heel
        self.heel, self.heel_end = heel, heel_end
        self.toe_return, self.min_clear = toe_return, min_clear
        self.v = S / (c * T / FPS)                       # m/s (ground speed the runtime moves the character at)
        self.ankle = {s: rig.rest[f'FOOT_{s}'].translation.copy() for s in 'LR'}
        self.phi_lift = {s: toe_roll for s in 'LR'}

    def foot_target(self, s, u):
        """Foot pose: dy = ground translation, phi = pitch (+ heel up over the toe,
        − toe up over the heel).  Heel strike → flat → toe-off while planted."""
        S, c = self.S, self.c
        if u < c:
            dy = -S / 2 + S * u / c + self.y_off
            a = smoothstep(self.toe_start, 1.0, u / c)
            h = 1 - smoothstep(0.0, self.heel_end, u / c)
            phi = self.toe_roll * a - self.heel * h
            return {'planted': True, 'dy': dy, 'phi': phi, 'free': self.free_heel and (a > 0 or h > 0), 'sw': None}
        sw = (u - c) / (1 - c)
        m = S * (1 - c) / c
        dy = hermite(S / 2, -S / 2, m, m, sw) + self.y_off
        phi = self.phi_lift[s] * (1 - smoothstep(0.0, self.toe_return, sw)) - self.heel * smoothstep(0.45, 1.0, sw)
        return {'planted': False, 'dy': dy, 'phi': phi, 'free': False, 'sw': sw}

    def foot_world(self, s, tg, extra):
        phi = tg['phi'] + (extra if tg['free'] else 0.0)
        Rf = Quaternion((1, 0, 0), math.radians(phi))
        piv = self.sole[s]['toe'] if phi >= 0 else self.sole[s]['heelp']
        t_piv = Vector((piv.x, piv.y + tg['dy'], piv.z))
        return Rf, t_piv + Rf @ (self.ankle[s] - piv), phi

    def leg_Q(self, s, th, roll, sw):
        out = -1 if s == 'L' else 1                    # outward abduction sign about Y
        beta = -roll + (out * self.abduct * math.sin(math.pi * sw) ** 2 if sw is not None else 0.0)
        return Q(y=beta) @ Q(x=th)

    def chain(self, x, s, tg):
        Rf, ankle_t, phi = self.foot_world(s, tg, x[5] if s == 'L' else x[6])
        root_loc, root_Q = Vector((x[0], 0, x[1])), Q(y=x[2])
        lq = self.leg_Q(s, x[3] if s == 'L' else x[4], x[2], tg['sw'])
        Mf, qb = self.r.leg_chain(root_loc, root_Q, s, lq, Rf)
        return Mf, qb, lq, ankle_t, phi

    def residual(self, x, tgs, prior, pw):
        res = []
        for s in 'LR':
            tg = tgs[s]
            Mf, _, _, ankle_t, phi = self.chain(x, s, tg)
            ank = self.r.foot_point(Mf, s, self.ankle[s])
            if tg['planted']:
                res += [1000 * (ank.x - ankle_t.x), 1000 * (ank.y - ankle_t.y), 1000 * (ank.z - ankle_t.z)]
                if tg['free']:
                    e = x[5] if s == 'L' else x[6]
                    res += [0.25 * e, 20.0 * max(0.0, abs(e) - 9.0)]
            else:
                res += [600 * (ank.y - ankle_t.y)]
                zmin = min(self.r.foot_point(Mf, s, p).z for p in self.sole[s]['pts'])
                # clearance curve + a minimum mid-swing margin (the runtime cage sole sits ~2 mm below the render surface)
                win = smoothstep(0.08, 0.2, tg['sw']) * (1 - smoothstep(0.8, 0.92, tg['sw']))
                dz = zmin - self.sole[s]['z0'] - max(self.lift * math.sin(math.pi * tg['sw']) ** 2, self.min_clear * win)
                # rising half: only a minimum clearance; descending half: follow the curve so the foot sets down smoothly
                res += [400 * min(0.0, dz), 60 * max(0.0, dz) * smoothstep(0.45, 0.75, tg['sw'])]
            if not tg['free']:
                res += [10.0 * (x[5] if s == 'L' else x[6])]
        res += [w * (x[i] - prior[i]) for i, w in pw.items()]
        return np.array(res)

    def solve(self, x0, tgs, prior, pw, it=30):
        x = np.array(x0, dtype=float)
        for _ in range(it):
            r = self.residual(x, tgs, prior, pw)
            J = np.zeros((len(r), 7))
            for j in range(7):
                e = 1e-3 if j >= 2 else 1e-6
                xp = x.copy()
                xp[j] += e
                J[:, j] = (self.residual(xp, tgs, prior, pw) - r) / e
            dx = np.linalg.lstsq(J.T @ J + 1e-8 * np.eye(7), -J.T @ r, rcond=None)[0]
            x += dx
            if np.abs(dx).max() < 1e-8:
                break
        return x

    def roll_style(self, p):
        # weight over the planted foot: + while L is planted alone (R swings), − for the opposite
        return self.roll0 * math.sin(2 * math.pi * (p - (self.c - 0.5) / 2 - 0.0))

    def run(self, cycles=2):
        T = self.T
        N = T * cycles
        tg_all = [{'L': self.foot_target('L', (i / T) % 1.0), 'R': self.foot_target('R', (i / T + 0.5) % 1.0)} for i in range(N)]
        x = np.zeros(7)
        sols = [None] * N
        roll_prior = [self.roll_style((i / T) % 1.0) for i in range(N)]
        z_prior = [0.0] * N
        roll_w, z_w = 0.6, 0.0
        for rep in range(6):
            for i in range(N):
                p = (i / T) % 1.0
                tgs = {'L': self.foot_target('L', p), 'R': self.foot_target('R', (p + 0.5) % 1.0)}
                tg_all[i] = tgs
                prior = np.array([0.0, z_prior[i], roll_prior[i], 0, 0, 0, 0])
                pw = {0: 10.0, 1: z_w, 2: roll_w}
                if not (tgs['L']['planted'] or tgs['R']['planted']):
                    continue
                x = self.solve(x if sols[i] is None else sols[i], tgs, prior, pw)
                sols[i] = x.copy()
            # smooth the roll (low-pass, periodic) and use it as the next prior: the weight
            # shift then flows continuously through heel strike instead of popping
            if rep >= 1 and all(v is not None for v in sols):
                def lowpass(vals, h):
                    F = np.fft.rfft(np.array(vals))
                    F[h * cycles + 1:] = 0
                    return list(np.fft.irfft(F, n=N))
                roll_prior = lowpass([sv[2] for sv in sols], 2)
                z_prior = lowpass([sv[1] for sv in sols], 2)
                roll_w, z_w = 2.0, 400.0
            # heel lift reached at lift-off feeds the swing foot orientation
            for s in 'LR':
                last = [i for i in range(N) if tg_all[i][s]['planted'] and
                        not tg_all[(i + 1) % N][s]['planted']]
                if last:
                    i = last[0]
                    self.phi_lift[s] = self.chain(sols[i], s, tg_all[i][s])[4]
        # flight frames: bridge root x/z/roll with Hermite curves between contact solutions
        flight = [i for i in range(N) if sols[i] is None]
        groups = []
        for i in flight:
            if groups and i == groups[-1][-1] + 1:
                groups[-1].append(i)
            else:
                groups.append([i])
        for g in groups:
            a, b = (g[0] - 1) % N, (g[-1] + 1) % N
            n = len(g) + 1
            prior_list = []
            for k_, i in enumerate(g, 1):
                s_ = k_ / n
                pr = np.zeros(7)
                for j in (0, 1, 2):
                    va = sols[a][j] - sols[(a - 1) % N][j]
                    vb = sols[(b + 1) % N][j] - sols[b][j]
                    if j == 1:            # take-off rising, landing descending (impact absorbed by squash)
                        va, vb = max(va, 0.0), min(vb, 0.0)
                    pr[j] = hermite(sols[a][j], sols[b][j], va * n, vb * n, s_)
                pr[1] += self.flight_lift * math.sin(math.pi * s_)
                prior_list.append((i, pr))
            for i, pr in prior_list:
                sols[i] = self.solve(sols[a], tg_all[i], pr, {0: 2000.0, 1: 3000.0, 2: 60.0})
        self.max_planted_err_mm = 0.0
        for i in range(N):
            for s in 'LR':
                tg = tg_all[i][s]
                if tg['planted']:
                    Mf, _, _, ankle_t, _ = self.chain(sols[i], s, tg)
                    self.max_planted_err_mm = max(self.max_planted_err_mm,
                                                  (self.r.foot_point(Mf, s, self.ankle[s]) - ankle_t).length * 1000)
        return sols, tg_all

    def foot_bases(self, x, tg):
        out = {}
        for s in 'LR':
            Mf, qb, lq, _, _ = self.chain(x, s, tg[s])
            out[s] = (self.r.lq(f'LEG_{s}', lq), qb)
        return out


def sole_points(O):
    dg = bpy.context.evaluated_depsgraph_get()
    res = {}
    for s in 'LR':
        o = O[f'FOX_Leg_{s}']
        ev = o.evaluated_get(dg)
        me = ev.to_mesh()
        vs = [o.matrix_world @ v.co for v in me.vertices]
        ev.to_mesh_clear()
        z0 = min(v.z for v in vs)
        sole = [v for v in vs if v.z < z0 + 0.004]
        toe = min(sole, key=lambda v: v.y)
        heel = max(sole, key=lambda v: v.y)
        xs = [v.x for v in sole]
        cx = sum(xs) / len(xs)
        pts = [toe, heel] + [min(sole, key=lambda v: abs(v.x - X) + abs(v.y - Y))
                             for X in (min(xs), max(xs), cx) for Y in (toe.y + 0.01, (toe.y + heel.y) / 2, heel.y - 0.006)]
        res[s] = {'z0': z0, 'toe': Vector((toe.x, toe.y, z0)), 'heel': heel, 'heelp': Vector((heel.x, heel.y, z0)),
                  'pts': [p.copy() for p in pts]}
    return res


def locomotion(name, O, R, sole, cfg, style):
    g = Gait(R, sole, name, **cfg)
    sols, tgs = g.run(cycles=2)
    T, N = g.T, len(sols)
    k = Keyer(name, O)
    zr = [s[1] for s in sols]
    zacc = d2(zr, periodic=True)
    roll = [s[2] for s in sols]
    rollacc = d2(roll, periodic=True)
    ear_out = spring([-a * style['ear_gain'] for a in zacc], k=160, d=12, periodic=True)
    flap = spring([a * style['flap_gain'] for a in zacc], k=140, d=10, periodic=True)
    for i in range(N + 1):
        f = i + 1
        j = i % N
        x, tg = sols[j], tgs[j]
        p = (j / T) % 1.0
        P2 = 2 * math.pi * p
        k.basis(f, 'ROOT', q=R.lq('ROOT', Q(y=x[2])), loc=R.lloc('ROOT', (x[0], 0, x[1])))
        fb = g.foot_bases(x, tg)
        for s in 'LR':
            k.basis(f, f'LEG_{s}', q=fb[s][0])
            k.basis(f, f'FOOT_{s}', q=fb[s][1])
        lean = style['lean']
        bob = -style['bob_pitch'] * math.cos(2 * P2)
        twist = style['twist'] * math.sin(P2)                      # hip yaw follows the swing leg
        k.basis(f, 'HIPS', q=R.lq('HIPS', Q(x=lean + bob, z=twist, y=-style['counter_roll'] * x[2])),
                scale=(1 + style['squash'] * max(0.0, -zacc[j]) / 40, 1 - style['squash'] * max(0.0, -zacc[j]) / 20,
                       1 + style['squash'] * max(0.0, -zacc[j]) / 40))
        k.basis(f, 'SPINE', q=R.lq('SPINE', Q(z=-0.6 * twist, x=style['spine_lean'])))
        hr = -style['head_stab'] * x[2]
        nod = style['nod'] * math.cos(2 * P2 - 0.6)
        k.basis(f, 'NECK', q=R.lq('NECK', Q(x=-0.8 * (lean + style['spine_lean']) + 0.5 * bob + 0.8 * nod, y=hr, z=-0.1 * twist)))
        k.basis(f, 'HEAD', q=R.lq('HEAD', Q(x=0.2 * nod, z=-0.1 * twist)))
        # arms swing opposite to the same-side leg, lagged; slightly out from the body
        lag = style['arm_lag']
        jl = (j - int(round(lag * T))) % N
        aL, aR = -style['arm_k'] * sols[jl][3], -style['arm_k'] * sols[jl][4]
        k.basis(f, 'ARM_L', q=R.lq('ARM_L', Q(x=aL, y=-style['arm_out'])))
        k.basis(f, 'ARM_R', q=R.lq('ARM_R', Q(x=aR, y=style['arm_out'])))
        k.basis(f, 'PAW_L', q=R.lq('PAW_L', Q(x=0.35 * aL - style['paw_bend'])))
        k.basis(f, 'PAW_R', q=R.lq('PAW_R', Q(x=0.35 * aR - style['paw_bend'])))
        eo = max(-6.0, min(14.0, ear_out[j]))
        k.basis(f, 'EAR_L_01', q=R.lq('EAR_L_01', Q(y=eo + style['ear_base'], x=style['ear_fwd'])))
        k.basis(f, 'EAR_R_01', q=R.lq('EAR_R_01', Q(y=-eo - style['ear_base'], x=style['ear_fwd'])))
        k.basis(f, 'EAR_L_02', q=R.lq('EAR_L_02', Q(y=0.6 * eo)))
        k.basis(f, 'EAR_R_02', q=R.lq('EAR_R_02', Q(y=-0.6 * eo)))
        for t, tb in enumerate(TAILS):
            ph = P2 - style['tail_lag'] * t
            sway = style['tail_sway'] * math.sin(ph) * (0.35 if t == 0 else 0.22)
            lift = style['tail_lift'] * (0.35 if t == 0 else 0.22) + style['tail_bounce'] * (0.5 + 0.5 * math.cos(2 * ph)) * (0.22 if t else 0.1)
            k.basis(f, tb, q=R.lq(tb, Q(y=sway, x=lift)))
        fl = flap[j]
        k.basis(f, 'SCARF_FLAP', q=R.lq('SCARF_FLAP', Q(x=-abs(style['flap_out']) - max(0.0, fl), y=style['flap_sway'] * math.sin(P2 - 1.2))))
        # face
        blink = blink_curve(f, style['blinks'])
        k.face(f, {style['expr']: 1.0, 'blink_extra': blink} if style['expr'] != 'neutral' else {'blink_extra': blink})
    k.finish(1, N + 1, cyclic=True)
    meta = {'loop': True, 'frames': N, 'duration_s': N / FPS, 'cycles': 2, 'cycle_frames': T, 'speed_mps': round(g.v, 4),
            'stride_m': g.S, 'contact_fraction': g.c}
    return k.act, meta


WALK = dict(T=20, c=0.60, S=0.11, lift=0.013, roll0=3.5, toe_roll=12.0, toe_start=0.6, abduct=6.0, heel=12.0, heel_end=0.3)
RUN = dict(T=14, c=0.30, S=0.085, lift=0.008, roll0=2.5, toe_roll=24.0, toe_start=0.30, abduct=14.0, flight_lift=0.022, free_heel=False, toe_return=0.3)
WALK_STYLE = dict(lean=3.0, spine_lean=1.5, bob_pitch=1.0, twist=5.0, counter_roll=0.35, squash=0.02, head_stab=0.45, nod=1.5,
                  arm_k=0.9, arm_lag=0.04, arm_out=7.0, paw_bend=4.0, ear_gain=0.9, ear_base=0.0, ear_fwd=2.0,
                  tail_sway=14.0, tail_lag=0.55, tail_lift=3.0, tail_bounce=3.0, flap_gain=0.6, flap_out=2.0, flap_sway=4.0,
                  expr='neutral', blinks=[27])
RUN_STYLE = dict(lean=9.0, spine_lean=3.0, bob_pitch=2.0, twist=7.0, counter_roll=0.3, squash=0.045, head_stab=0.5, nod=2.5,
                 arm_k=1.25, arm_lag=0.03, arm_out=12.0, paw_bend=28.0, ear_gain=1.1, ear_base=4.0, ear_fwd=-3.0,
                 tail_sway=20.0, tail_lag=0.7, tail_lift=7.0, tail_bounce=4.0, flap_gain=1.4, flap_out=6.0, flap_sway=6.0,
                 expr='excited', blinks=[21])


# ------------------------------------------------------------------ idle + one-shots
def rest_all(k, R, f, skip=()):
    for b in ('ROOT', 'HIPS', 'SPINE', 'NECK', 'HEAD', 'ARM_L', 'ARM_R', 'PAW_L', 'PAW_R', 'LEG_L', 'LEG_R', 'FOOT_L', 'FOOT_R',
              'EAR_L_01', 'EAR_L_02', 'EAR_R_01', 'EAR_R_02', 'SCARF_FLAP', *TAILS):
        if b not in skip:
            k.basis(f, b, q=Quaternion(), loc=Vector() if b == 'ROOT' else None, scale=(1, 1, 1) if b == 'HIPS' else None)


def body_pose(k, R, f, P):
    """P: dict of channels in degrees / metres; missing = 0."""
    g = lambda n: P.get(n, 0.0)  # noqa: E731
    k.basis(f, 'ROOT', q=R.lq('ROOT', Q(z=g('root_yaw'))), loc=R.lloc('ROOT', (0, 0, max(0.0, g('root_z')))))
    sq = g('squash')                                   # >0 squash, <0 stretch
    k.basis(f, 'HIPS', q=R.lq('HIPS', Q(x=g('hips_x'), y=g('hips_y'), z=g('hips_z'))),
            scale=(1 + 0.5 * sq, 1 - sq, 1 + 0.5 * sq))
    k.basis(f, 'SPINE', q=R.lq('SPINE', Q(x=g('spine_x'), y=g('spine_y'), z=g('spine_z'))))
    # pitch / roll go to the NECK (the scarf top follows the neck weights) so the rigid head
    # never sinks into the scarf roll; yaw is shared 45 / 55 as tested in D1.1
    k.basis(f, 'NECK', q=R.lq('NECK', Q(x=0.85 * g('head_x'), y=0.9 * g('head_y'), z=0.45 * g('head_z'))))
    k.basis(f, 'HEAD', q=R.lq('HEAD', Q(x=0.15 * g('head_x'), y=0.1 * g('head_y'), z=0.55 * g('head_z'))))
    k.basis(f, 'ARM_L', q=R.lq('ARM_L', Q(x=g('armL_x'), y=-g('armL_up'))))
    k.basis(f, 'ARM_R', q=R.lq('ARM_R', Q(x=g('armR_x'), y=g('armR_up'))))
    k.basis(f, 'PAW_L', q=R.lq('PAW_L', Q(x=g('pawL_x'), y=g('pawL_y'))))
    k.basis(f, 'PAW_R', q=R.lq('PAW_R', Q(x=g('pawR_x'), y=g('pawR_y'))))
    for s, sg in (('L', 1), ('R', -1)):
        k.basis(f, f'LEG_{s}', q=R.lq(f'LEG_{s}', Q(x=g('leg_x'), y=-sg * g('leg_out'))))
        k.basis(f, f'FOOT_{s}', q=R.lq(f'FOOT_{s}', Q(x=g('foot_x'))))
        k.basis(f, f'EAR_{s}_01', q=R.lq(f'EAR_{s}_01', Q(x=g(f'ear{s}_fwd'), y=sg * g(f'ear{s}_out'))))
        k.basis(f, f'EAR_{s}_02', q=R.lq(f'EAR_{s}_02', Q(x=0.4 * g(f'ear{s}_fwd'), y=sg * 0.5 * g(f'ear{s}_out'))))
    for t, tb in enumerate(TAILS):
        w = 0.35 if t == 0 else 0.22
        k.basis(f, tb, q=R.lq(tb, Q(y=w * g(f'tail_sway{t}') if f'tail_sway{t}' in P else w * g('tail_sway'),
                                    x=w * min(10.0, g('tail_lift')))))
    k.basis(f, 'SCARF_FLAP', q=R.lq('SCARF_FLAP', Q(x=-abs(g('flap_out')), y=g('flap_y'))))


def lagged(fn, f, lag):
    return fn(f - lag)


def make_idle(O, R):
    N = 120
    k = Keyer('idle', O)
    for f in range(1, N + 2):
        p = (f - 1) / N
        br = math.sin(2 * math.pi * 2 * p)                       # 2 breaths
        drift = math.sin(2 * math.pi * p)
        drift2 = math.sin(2 * math.pi * 2 * p + 0.8) * math.sin(math.pi * p) ** 2
        wag = lambda t: math.sin(2 * math.pi * 3 * p - 0.6 * t)  # noqa: E731  3 gentle wags
        flick = track([(76, 0), (79, 1), (83, -0.25), (88, 0)], f)            # right ear flick
        twitch = track([(38, 0), (40, 1), (44, 0)], f)                         # left ear twitch
        P = {'squash': -0.012 * br, 'hips_y': 1.4 * drift, 'spine_y': -0.6 * drift,
             'head_z': 6 * math.sin(2 * math.pi * p) * math.sin(math.pi * p), 'head_y': -2.5 * drift2 - 0.6 * drift,
             'head_x': -1.5 * br * 0.5 + 1.2 * drift2,
             'armL_up': 2 * (0.5 + 0.5 * br) - 1.0, 'armR_up': 2 * (0.5 + 0.5 * br) - 1.0, 'pawL_x': -2 * br, 'pawR_x': -2 * br,
             'earL_out': 3 * math.sin(2 * math.pi * 2 * p - 0.9) + 8 * twitch, 'earL_fwd': 4 * twitch,
             'earR_out': 3 * math.sin(2 * math.pi * 2 * p - 0.9) + 14 * flick, 'earR_fwd': 10 * flick,
             'tail_lift': 2 * br, 'flap_y': 1.5 * drift}
        for t in range(4):
            P[f'tail_sway{t}'] = 11 * wag(t) * (1 + 0.2 * t)
        body_pose(k, R, f, P)
        k.face(f, {'blink_extra': blink_curve(f, [31, 95, 101])})
    k.finish(1, N + 1, cyclic=True)
    return k.act, {'loop': True, 'frames': N, 'duration_s': N / FPS}


def make_happy(O, R):
    N = 56
    k = Keyer('happy', O)
    T = lambda keys: (lambda f: track(keys, f))  # noqa: E731
    root_z = T([(1, 0), (6, 0), (12, 0.062), (18, 0), (22, 0), (27, 0.034), (32, 0), (56, 0)])
    squash = T([(1, 0), (5, 0.07), (8, -0.06), (12, -0.02), (17, -0.01), (19, 0.08), (22, 0.02), (24, -0.04), (27, 0), (31, 0.05),
                (35, 0), (56, 0)])
    arms = T([(1, 0), (5, -6), (11, 44), (17, 22), (24, 38), (32, 20), (44, 16), (52, 0), (56, 0)])
    head_x = T([(1, 0), (5, 6), (11, -9), (18, 3), (25, -6), (32, 0), (56, 0)])
    head_y = T([(1, 0), (30, 0), (34, 4.5), (38, -4.5), (42, 4), (46, -2), (52, 0), (56, 0)])
    hips_y = T([(1, 0), (30, 0), (34, -4), (38, 4), (42, -3), (46, 2), (52, 0), (56, 0)])
    ears = T([(1, 0), (5, 4), (11, -10), (18, 6), (25, -6), (32, 2), (44, 0), (56, 0)])
    ear_fwd = T([(1, 0), (6, 0), (11, 8), (20, 4), (44, 3), (54, 0), (56, 0)])
    leg = T([(1, 0), (7, 0), (11, 7), (16, 0), (23, 0), (27, 4), (31, 0), (56, 0)])
    wag_amp = T([(1, 0), (8, 20), (44, 20), (54, 0), (56, 0)])
    expr = T([(1, 0), (4, 0), (8, 1), (44, 1), (50, 0), (56, 0)])
    for f in range(1, N + 1):
        P = {'root_z': root_z(f), 'squash': squash(f), 'armL_up': arms(f), 'armR_up': arms(f), 'pawL_x': -0.3 * arms(f),
             'pawR_x': -0.3 * arms(f), 'head_x': head_x(f), 'head_y': head_y(f), 'hips_y': hips_y(f), 'spine_y': -0.5 * hips_y(f),
             'earL_out': ears(f), 'earR_out': ears(f), 'earL_fwd': ear_fwd(f), 'earR_fwd': ear_fwd(f), 'leg_x': leg(f),
             'foot_x': -0.6 * leg(f), 'tail_lift': 8 * expr(f), 'flap_out': 4 * max(0.0, -squash(f)) * 20}
        for t in range(4):
            P[f'tail_sway{t}'] = wag_amp(f) * math.sin(2 * math.pi * (f - 1) / 9 - 0.7 * t) * (1 + 0.2 * t)
        body_pose(k, R, f, P)
        e = expr(f)
        k.face(f, {'happy': e} if e > 0 else {})
    k.finish(1, N, cyclic=False)
    return k.act, {'loop': False, 'frames': N - 1, 'duration_s': (N - 1) / FPS}


def make_wave(O, R):
    """Left paw (the side the default web camera sees).  The chibi arm is short and
    the head overhangs the shoulders, so the wave happens forward-out from the
    shoulder, under the cheek, where it reads from front and 3/4 views."""
    N = 64
    k = Keyer('wave', O)
    T = lambda keys: (lambda f: track(keys, f))  # noqa: E731
    up = T([(1, 0), (6, -8), (15, 112), (20, 103), (25, 105), (44, 105), (48, 108), (57, 0), (64, 0)])
    arm_fwd = T([(1, 0), (6, -4), (15, 42), (21, 36), (44, 38), (50, 30), (58, 0), (64, 0)])
    wave_amp = T([(1, 0), (18, 0), (22, 20), (42, 20), (46, 0), (64, 0)])
    paw_bias = T([(1, 0), (13, 0), (15, -14), (20, 16), (24, 10), (44, 10), (48, -6), (53, 14), (59, -4), (64, 0)])
    lean = T([(1, 0), (6, 2), (16, -4.5), (44, -4), (56, 1), (62, 0), (64, 0)])
    head_y = T([(1, 0), (8, -1.5), (18, 4.5), (44, 4), (55, -1), (62, 0), (64, 0)])
    head_z = T([(1, 0), (16, 7), (44, 6), (58, 0), (64, 0)])
    smile = T([(1, 0), (6, 0), (11, 1), (52, 1), (58, 0), (64, 0)])
    for f in range(1, N + 1):
        w = wave_amp(f) * math.sin(2 * math.pi * (f - 20) / 8)
        ph = math.sin(2 * math.pi * (f - 20) / 16) * (wave_amp(f) / 20)
        P = {'armL_up': up(f) + 0.12 * w, 'armL_x': arm_fwd(f), 'pawL_y': paw_bias(f) + w, 'pawL_x': 0.0,
             'armR_up': -0.06 * up(f), 'armR_x': 0.0, 'hips_y': lean(f), 'spine_y': 0.6 * lean(f),
             'head_y': head_y(f) + 1.5 * ph, 'head_z': head_z(f), 'head_x': -2 * smile(f) + 1.2 * ph,
             'earL_fwd': 5 * smile(f), 'earR_fwd': 5 * smile(f), 'earL_out': 2 * ph * smile(f), 'earR_out': -2 * ph * smile(f)}
        for t in range(4):
            P[f'tail_sway{t}'] = 12 * smile(f) * math.sin(2 * math.pi * (f - 1) / 20 - 0.6 * t)
        body_pose(k, R, f, P)
        k.face(f, {'smile': smile(f), 'blink_extra': blink_curve(f, [34])})
    k.finish(1, N, cyclic=False)
    return k.act, {'loop': False, 'frames': N - 1, 'duration_s': (N - 1) / FPS}


def make_head_pet(O, R):
    N = 68
    k = Keyer('head_pet', O)
    T = lambda keys: (lambda f: track(keys, f))  # noqa: E731
    head_x = T([(1, 0), (5, 6), (12, 3), (50, 2), (56, -3), (62, 1), (68, 0)])
    lean_in = T([(1, 0), (5, 0), (12, 1), (50, 1), (58, 0), (68, 0)])
    ear_out = T([(1, 0), (4, 16), (10, 19), (50, 19), (55, -6), (59, 4), (63, -1.5), (68, 0)])
    ear_fwd = T([(1, 0), (4, 6), (50, 6), (55, -4), (60, 0), (68, 0)])
    squash = T([(1, 0), (5, 0.05), (10, 0.02), (50, 0.02), (55, -0.03), (60, 0.01), (68, 0)])
    wag_amp = T([(1, 0), (10, 20), (50, 20), (60, 0), (68, 0)])
    happy = T([(1, 0), (3, 0), (8, 1), (50, 1), (56, 0), (68, 0)])
    arms = T([(1, 0), (6, 10), (50, 10), (58, 0), (68, 0)])
    for f in range(1, N + 1):
        nuzzle = math.sin(2 * math.pi * (f - 12) / 18) * lean_in(f)
        P = {'head_x': head_x(f), 'head_y': 3 * lean_in(f) + 2.5 * nuzzle, 'head_z': 7 * lean_in(f) + 6 * nuzzle,
             'hips_y': 2.5 * nuzzle, 'spine_y': 1.0 * nuzzle, 'squash': squash(f) + 0.012 * math.sin(2 * math.pi * (f - 12) / 9) * lean_in(f),
             'earL_out': ear_out(f) + 2 * nuzzle, 'earR_out': ear_out(f) - 2 * nuzzle, 'earL_fwd': ear_fwd(f), 'earR_fwd': ear_fwd(f),
             'armL_up': arms(f), 'armR_up': arms(f), 'pawL_x': -8 * lean_in(f), 'pawR_x': -8 * lean_in(f), 'tail_lift': 7 * happy(f)}
        for t in range(4):
            P[f'tail_sway{t}'] = wag_amp(f) * math.sin(2 * math.pi * (f - 1) / 10 - 0.7 * t) * (1 + 0.2 * t)
        body_pose(k, R, f, P)
        k.face(f, {'happy': happy(f)})
    k.finish(1, N, cyclic=False)
    return k.act, {'loop': False, 'frames': N - 1, 'duration_s': (N - 1) / FPS}


def make_tail_touch(O, R):
    N = 66
    k = Keyer('tail_touch', O)
    T = lambda keys: (lambda f: track(keys, f))  # noqa: E731
    root_z = T([(1, 0), (3, 0), (8, 0.055), (14, 0), (40, 0), (45, 0.045), (51, 0), (66, 0)])
    root_yaw = T([(1, 0), (5, 0), (12, -26), (42, -26), (49, 0), (66, 0)])     # only changes while airborne
    squash = T([(1, 0), (3, 0.04), (6, -0.07), (10, -0.02), (14, 0.08), (17, 0), (28, 0), (31, 0.04), (34, -0.03), (37, 0.03),
                (40, 0.05), (43, -0.05), (50, 0.07), (54, 0), (66, 0)])
    look = T([(1, 0), (6, 0), (14, -1), (40, -1), (48, 0), (66, 0)])
    head_x = T([(1, 0), (4, -6), (10, -2), (16, 8), (26, 8), (32, 2), (40, 0), (66, 0)])
    head_y = T([(1, 0), (14, 0), (18, -4.5), (24, -3), (30, 4), (36, -3), (40, 0), (66, 0)])
    tail_jerk = T([(1, 0), (3, 0), (6, 1), (12, 0.5), (22, 0), (66, 0)])
    wag_amp = T([(1, 0), (20, 0), (26, 20), (40, 20), (52, 6), (60, 0), (66, 0)])
    ears = T([(1, 0), (3, 0), (5, -8), (9, 6), (14, 0), (66, 0)])
    ear_fwd = T([(1, 0), (4, 12), (12, 6), (30, 8), (48, 4), (60, 0), (66, 0)])
    arms = T([(1, 0), (3, 0), (6, 36), (12, 16), (16, 8), (40, 10), (45, 30), (52, 0), (66, 0)])
    leg = T([(1, 0), (4, 0), (8, 8), (13, 0), (42, 0), (45, 6), (50, 0), (66, 0)])
    wide = T([(1, 0), (3, 0), (5, 1), (19, 1), (24, 0), (66, 0)])
    happy = T([(1, 0), (19, 0), (24, 1), (52, 1), (58, 0), (66, 0)])
    for f in range(1, N + 1):
        P = {'root_z': root_z(f), 'root_yaw': root_yaw(f), 'squash': squash(f),
             'hips_z': 10 * look(f), 'head_z': 30 * look(f), 'head_x': head_x(f), 'head_y': head_y(f) + 3 * look(f),
             'earL_out': ears(f), 'earR_out': ears(f), 'earL_fwd': ear_fwd(f), 'earR_fwd': ear_fwd(f),
             'armL_up': arms(f), 'armR_up': arms(f), 'pawL_x': -0.4 * arms(f), 'pawR_x': -0.4 * arms(f),
             'leg_x': leg(f), 'foot_x': -0.6 * leg(f), 'tail_lift': 10 * tail_jerk(f) + 6 * happy(f) * (1 - tail_jerk(f)),
             'flap_out': 3 * wide(f)}
        for t in range(4):
            P[f'tail_sway{t}'] = (-22 * tail_jerk(f) * (1 - 0.15 * t) +
                                  wag_amp(f) * math.sin(2 * math.pi * (f - 20) / 9 - 0.7 * t) * (1 + 0.2 * t))
        body_pose(k, R, f, P)
        w, h = wide(f), happy(f)
        face = {}
        if w > 0:
            face['surprised'] = w
        if h > 0:
            face['happy'] = h
        k.face(f, face)
    k.finish(1, N, cyclic=False)
    return k.act, {'loop': False, 'frames': N - 1, 'duration_s': (N - 1) / FPS}


def main():
    bpy.ops.wm.open_mainfile(filepath=SRC)
    O = bpy.data.objects
    R = Rig(O['FOX_RIG'])
    sole = sole_points(O)
    clips = {}
    a, m = make_idle(O, R)
    clips['idle'] = dict(m, role='base loop', head_control=0.0, face_control=0.0)
    a, m = locomotion('walk', O, R, sole, WALK, WALK_STYLE)
    clips['walk'] = dict(m, role='base loop (in place; move the character at speed_mps × level scale)', head_control=0.5, face_control=0.0)
    a, m = locomotion('run', O, R, sole, RUN, RUN_STYLE)
    clips['run'] = dict(m, role='base loop (in place; move the character at speed_mps × level scale)', head_control=0.6, face_control=1.0)
    a, m = make_happy(O, R)
    clips['happy'] = dict(m, role='one-shot reaction', head_control=1.0, face_control=1.0)
    a, m = make_wave(O, R)
    clips['wave'] = dict(m, role='one-shot gesture', head_control=1.0, face_control=1.0)
    a, m = make_head_pet(O, R)
    clips['head_pet'] = dict(m, role='interaction reaction (click / stroke on the head)', head_control=1.0, face_control=1.0)
    a, m = make_tail_touch(O, R)
    clips['tail_touch'] = dict(m, role='interaction reaction (click on the tail)', head_control=1.0, face_control=1.0)

    rig = O['FOX_RIG']
    rig.animation_data.action = None
    for n in FACE_PARTS:
        ad = O[n].data.shape_keys.animation_data
        if ad:
            ad.action = None
        for kb in O[n].data.shape_keys.key_blocks[1:]:
            kb.value = 0.0
    for pb in rig.pose.bones:
        pb.matrix_basis.identity()
    bpy.context.scene['fox_gate'] = 'E1 interactive animation prototype'
    os.makedirs(OUT_DIR, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
    spec = {
        'asset': 'LifeQuest Fox V2', 'gate': 'E1', 'fps': FPS, 'source_rig': '03_RIG/fox_rig_d1_1.blend',
        'clips': clips,
        'head_control_note': 'head_control = how much the clip owns the head (1 = look_at_cursor fully suppressed, 0 = free). '
                             'Runtime look-at weight = 1 - Σ(action weight × head_control).',
        'face_control_note': 'face_control = 1 means the clip drives the facial morphs; manual expression overrides are suspended.',
        'expressions': {k: v for k, v in EXPR.items()},
        'expressions_note': 'smile and excited are combinations of existing D1.1 morph targets; the morph contract is unchanged.',
        'interaction': {'look_at_cursor': 'procedural (runtime): yaw NECK 45 % / HEAD 55 %, pitch NECK 85 % / HEAD 15 %, yaw ±40°, pitch −15…+20°, exponential damping, eyes lead',
                        'head_pet': 'click or stroke on the HEAD proxy', 'tail_touch': 'click on the TAIL proxy'},
    }
    json.dump(spec, open(os.path.join(OUT_DIR, 'anim_spec_e1.json'), 'w'), indent=2)
    print('saved', OUT)
    for n, c in clips.items():
        print(f'  {n:11s} {c["frames"]:4d} f  loop={c["loop"]}  speed={c.get("speed_mps", "-")}')


if __name__ == '__main__':
    main()
