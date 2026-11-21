"""Gate E2 — character motion polish.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/anim_e2.py
Reads   03_RIG/fox_rig_d1_1.blend          (approved D1.1 rig — never written)
Writes  04_ANIMATIONS/fox_anim_e2.blend     (same model / skeleton / morph contract, polished clips)
        04_ANIMATIONS/anim_spec_e2.json     (clip contract — same 7 runtime names as E1)
The approved E1 files (anim_e1.py, fox_anim_e1.blend, fox_v2_anim_e1.glb, …) are not touched.

What changes versus E1 (see 04_ANIMATIONS/animation_report_e2.md):
* idle: 6 s, irregular rhythm (3 breaths, a curious head tilt, two ear twitches, a tail-wag burst,
  blinks at uneven intervals) + runtime variation layer (idle_variation_e2.json)
* happy / wave / head_pet / tail_touch: re-timed with clearer anticipation → action → overshoot →
  settle, squash & stretch within the canonical silhouette, ears and tail driven by damped springs
  from the body motion (follow-through), richer facial timing
* walk / run: identical solved foot planting (same gait solver and parameters, same speed), more
  weight (contact squash, take-off stretch on the run, delayed head and body overlap), tail that
  follows the hip roll with a delay down the chain, scarf flap driven by the body motion
Limits kept from the E1 QA: tail raise ≤ 10° over the back, wag ≤ ±20° (graded), head roll ≤ 5°
(on the neck), reaction arm raise ≤ 45°, ear spread ≤ 20°, body squash −8 %…+10 %, root yaw
only while airborne, scarf flap never swings into the chest.
"""
import json
import math
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import anim_e1 as A  # noqa: E402  (helpers, rig, gait solver; E1 outputs are not written)

Q, track, spring, d2, smoothstep, blink_curve = A.Q, A.track, A.spring, A.d2, A.smoothstep, A.blink_curve
FPS, TAILS = A.FPS, A.TAILS
OUT = os.path.join(A.OUT_DIR, 'fox_anim_e2.blend')


def T(keys):
    return lambda f: track(keys, f)


def clamp(v, a, b):
    return max(a, min(b, v))


def follow(signal, k=150.0, d=13.0, gain=1.0, periodic=False):
    """Follow-through: a damped spring driven by the (negative) acceleration of a signal."""
    acc = d2(signal, periodic=periodic)
    return spring([-gain * a for a in acc], k=k, d=d, periodic=periodic)


def fade_ends(vals, n_in=3, n_out=6):
    """Force a secondary-motion curve to exactly 0 at both ends of a one-shot (clean blending)."""
    N = len(vals)
    return [v * smoothstep(0, n_in, i) * (1 - smoothstep(N - 1 - n_out, N - 1, i)) for i, v in enumerate(vals)]


# ------------------------------------------------------------------ locomotion (same solved feet)
WALK_STYLE = dict(lean=4.0, spine_lean=1.5, bob_pitch=1.2, twist=6.0, spine_counter=0.7, counter_roll=0.30,
                  squash=0.035, stretch=0.0, head_stab=0.5, nod=1.6, nod_lag=2, arm_k=0.95, arm_lag=0.05, arm_out=7.0,
                  paw_bend=4.0, paw_lag=2, ear_gain=1.0, ear_base=0.0, ear_fwd=2.0, tail_follow=2.6, tail_base=3.0,
                  tail_lag=2, tail_lift=3.0, tail_bounce=3.5, flap_gain=0.8, flap_out=2.0, flap_side=1.3,
                  expr='neutral', blinks=[29], smile=0.0)
RUN_STYLE = dict(lean=10.0, spine_lean=3.0, bob_pitch=2.2, twist=7.5, spine_counter=0.7, counter_roll=0.25,
                 squash=0.06, stretch=0.035, head_stab=0.55, nod=2.6, nod_lag=1, arm_k=1.3, arm_lag=0.04, arm_out=12.0,
                 paw_bend=30.0, paw_lag=1, ear_gain=1.25, ear_base=4.0, ear_fwd=-2.0, tail_follow=3.2, tail_base=6.0,
                 tail_lag=1, tail_lift=8.0, tail_bounce=5.0, flap_gain=1.6, flap_out=6.0, flap_side=1.6,
                 expr='excited', blinks=[21], smile=0.0)


def locomotion(name, O, R, sole, cfg, s):
    g = A.Gait(R, sole, name, **cfg)
    sols, tgs = g.run(cycles=2)
    Tc, N = g.T, len(sols)
    k = A.Keyer(name, O)
    zr = [x[1] for x in sols]
    roll = [x[2] for x in sols]
    zacc = d2(zr, periodic=True)
    ear_out = spring([-a * s['ear_gain'] for a in zacc], k=160, d=12, periodic=True)
    flap = spring([a * s['flap_gain'] for a in zacc], k=140, d=10, periodic=True)
    head_lag = spring([-a * 0.9 for a in zacc], k=170, d=14, periodic=True)          # head keeps moving after impact
    tail_bob = spring([-a * 0.8 for a in zacc], k=120, d=10, periodic=True)
    sq_curve = [max(0.0, -a) for a in zacc]                                           # landing compression
    st_curve = [max(0.0, a) for a in zacc]                                            # take-off stretch
    for i in range(N + 1):
        f = i + 1
        j = i % N
        x, tg = sols[j], tgs[j]
        P2 = 2 * math.pi * ((j / Tc) % 1.0)
        k.basis(f, 'ROOT', q=R.lq('ROOT', Q(y=x[2])), loc=R.lloc('ROOT', (x[0], 0, x[1])))
        fb = g.foot_bases(x, tg)
        for sd in 'LR':
            k.basis(f, f'LEG_{sd}', q=fb[sd][0])
            k.basis(f, f'FOOT_{sd}', q=fb[sd][1])
        lean = s['lean']
        bob = -s['bob_pitch'] * math.cos(2 * P2)
        twist = s['twist'] * math.sin(P2)
        sq = clamp(s['squash'] * sq_curve[j] / 22 - s['stretch'] * st_curve[j] / 22, -0.05, 0.08)
        k.basis(f, 'HIPS', q=R.lq('HIPS', Q(x=lean + bob, z=twist, y=-s['counter_roll'] * x[2])),
                scale=(1 + 0.5 * sq, 1 - sq, 1 + 0.5 * sq))
        k.basis(f, 'SPINE', q=R.lq('SPINE', Q(z=-s['spine_counter'] * twist, x=s['spine_lean'])))
        hr = -s['head_stab'] * x[2]
        jn = (j - s['nod_lag']) % N
        nod = s['nod'] * math.cos(2 * 2 * math.pi * ((jn / Tc) % 1.0) - 0.6) + clamp(head_lag[j], -3.0, 3.0)
        k.basis(f, 'NECK', q=R.lq('NECK', Q(x=-0.8 * (lean + s['spine_lean']) + 0.5 * bob + 0.8 * nod, y=hr, z=-0.12 * twist)))
        k.basis(f, 'HEAD', q=R.lq('HEAD', Q(x=0.2 * nod, z=-0.12 * twist)))
        jl = (j - int(round(s['arm_lag'] * Tc))) % N
        aL, aR = -s['arm_k'] * sols[jl][3], -s['arm_k'] * sols[jl][4]
        jp = (jl - s['paw_lag']) % N
        pL, pR = -s['arm_k'] * sols[jp][3], -s['arm_k'] * sols[jp][4]
        k.basis(f, 'ARM_L', q=R.lq('ARM_L', Q(x=aL, y=-s['arm_out'])))
        k.basis(f, 'ARM_R', q=R.lq('ARM_R', Q(x=aR, y=s['arm_out'])))
        k.basis(f, 'PAW_L', q=R.lq('PAW_L', Q(x=0.4 * pL - s['paw_bend'])))
        k.basis(f, 'PAW_R', q=R.lq('PAW_R', Q(x=0.4 * pR - s['paw_bend'])))
        eo = clamp(ear_out[j], -6.0, 14.0)
        side = 0.8 * roll[(j - 2) % N]                                                # ears drift with the weight shift
        k.basis(f, 'EAR_L_01', q=R.lq('EAR_L_01', Q(y=eo + s['ear_base'] + side, x=s['ear_fwd'])))
        k.basis(f, 'EAR_R_01', q=R.lq('EAR_R_01', Q(y=-eo - s['ear_base'] + side, x=s['ear_fwd'])))
        k.basis(f, 'EAR_L_02', q=R.lq('EAR_L_02', Q(y=0.6 * eo + 0.5 * side)))
        k.basis(f, 'EAR_R_02', q=R.lq('EAR_R_02', Q(y=-0.6 * eo + 0.5 * side)))
        # tail: follows the hip roll with an increasing delay down the chain (follow-through)
        for t, tb in enumerate(TAILS):
            jt = (j - s['tail_lag'] * (t + 1)) % N
            sway = clamp(-s['tail_follow'] * roll[jt] * (1 + 0.25 * t) + s['tail_base'] * math.sin(P2 - 0.5 * t), -20, 20)
            w = 0.35 if t == 0 else 0.22
            lift = s['tail_lift'] + s['tail_bounce'] * (0.5 + 0.5 * math.cos(2 * P2 - 0.8 * t)) + clamp(tail_bob[jt], -3, 3)
            k.basis(f, tb, q=R.lq(tb, Q(y=w * sway, x=w * clamp(lift, 0.0, 10.0))))
        fl = flap[j]
        k.basis(f, 'SCARF_FLAP', q=R.lq('SCARF_FLAP', Q(x=-abs(s['flap_out']) - max(0.0, fl),
                                                      y=clamp(-s['flap_side'] * roll[(j - 2) % N], -8, 8))))
        blink = blink_curve(f, s['blinks'])
        face = {s['expr']: 1.0} if s['expr'] != 'neutral' else {}
        face['blink_extra'] = blink
        k.face(f, face)
    k.finish(1, N + 1, cyclic=True)
    return k.act, {'loop': True, 'frames': N, 'duration_s': N / FPS, 'cycles': 2, 'cycle_frames': Tc,
                   'speed_mps': round(g.v, 4), 'stride_m': g.S, 'contact_fraction': g.c}


# ------------------------------------------------------------------ idle
def make_idle(O, R):
    N = 144                                   # 6 s, irregular inner rhythm
    k = A.Keyer('idle', O)
    tilt = T([(1, 0), (52, 0), (62, 5.0), (66, 4.0), (84, 4.2), (96, -0.8), (102, 0), (145, 0)])       # curious head tilt
    tilt_yaw = T([(1, 0), (50, 0), (60, 7), (86, 6), (98, -1), (106, 0), (145, 0)])
    settle = T([(1, 0), (96, 0), (99, 0.014), (103, -0.006), (107, 0), (145, 0)])                     # tiny settle after the tilt
    twitchL = T([(1, 0), (34, 0), (36, 1), (39, -0.3), (42, 0), (145, 0)])
    flickR = T([(1, 0), (114, 0), (116, 1), (118, 0.15), (120, 1), (124, -0.25), (128, 0), (145, 0)])  # double flick
    wag_burst = T([(1, 0.35), (100, 0.35), (106, 1), (124, 1), (132, 0.35), (145, 0.35)])
    for f in range(1, N + 2):
        p = (f - 1) / N
        br = math.sin(2 * math.pi * 3 * p)                                   # 3 breaths
        br2 = math.sin(2 * math.pi * 3 * p - 0.7)                            # shoulders lag the chest a little
        shift = math.sin(2 * math.pi * p) * 1.2 + 0.4 * math.sin(2 * math.pi * 2 * p + 0.5) * math.sin(math.pi * p) ** 2
        wag_ph = 2 * math.pi * 5 * p                                         # 5 wag cycles, amplitude varies
        P = {'squash': -0.011 * br, 'hips_y': shift, 'spine_y': -0.5 * shift, 'spine_x': 0.6 * br2,
             'head_y': tilt(f) + 0.4 * shift, 'head_z': tilt_yaw(f) + 2.5 * math.sin(2 * math.pi * 2 * p) * math.sin(math.pi * p) ** 2,
             'head_x': -0.8 * br2 - 0.15 * tilt(f), 'root_z': 0.0,
             'armL_up': 1.5 * (0.5 + 0.5 * br2), 'armR_up': 1.5 * (0.5 + 0.5 * br2), 'pawL_x': -1.5 * br2, 'pawR_x': -1.5 * br2,
             'earL_out': 2.5 * math.sin(2 * math.pi * 3 * p - 1.0) + 9 * twitchL(f) + 1.5 * tilt(f) / 5,
             'earL_fwd': 5 * twitchL(f) + 2 * tilt(f) / 5,
             'earR_out': 2.5 * math.sin(2 * math.pi * 3 * p - 1.0) + 12 * flickR(f) - 1.5 * tilt(f) / 5,
             'earR_fwd': 9 * flickR(f) + 2 * tilt(f) / 5,
             'tail_lift': 2.0 + 1.5 * br, 'flap_y': 1.2 * shift}
        P['squash'] += settle(f)
        for t in range(4):
            P[f'tail_sway{t}'] = clamp(16 * wag_burst(f) * math.sin(wag_ph - 0.7 * t) * (1 + 0.2 * t), -20, 20)
        A.body_pose(k, R, f, P)
        k.face(f, {'blink_extra': blink_curve(f, [27, 81, 126, 132])})
    k.finish(1, N + 1, cyclic=True)
    return k.act, {'loop': True, 'frames': N, 'duration_s': N / FPS}


# ------------------------------------------------------------------ one-shots
def secondary(root_z, squash, n, ear_gain=900.0, tail_gain=700.0):
    """Ears / tail follow-through from the vertical body motion of a one-shot (exactly 0 at both ends)."""
    y = [root_z[i] - 0.08 * squash[i] for i in range(n)]
    ears = fade_ends(follow(y, k=150, d=11, gain=ear_gain))
    tail = fade_ends(follow(y, k=110, d=9, gain=tail_gain))
    return ears, tail


def make_happy(O, R):
    N = 62
    k = A.Keyer('happy', O)
    root_z = T([(1, 0), (8, 0), (14, 0.072), (21, 0), (25, 0), (30, 0.036), (35, 0), (62, 0)])
    squash = T([(1, 0), (4, 0.03), (8, 0.095), (10, -0.075), (14, -0.03), (19, -0.02), (21, 0.10), (23, 0.03), (24, -0.035),
                (26, 0.05), (28, -0.04), (30, -0.01), (34, 0.06), (37, -0.015), (40, 0), (62, 0)])
    arms = T([(1, 0), (8, -10), (12, 44), (18, 26), (23, 18), (28, 38), (34, 22), (46, 16), (56, 0), (62, 0)])
    head_x = T([(1, 0), (8, 8), (12, -9), (19, 3), (22, 5), (28, -6), (35, 2), (40, 0), (62, 0)])
    sway = T([(1, 0), (36, 0), (39, 1), (43, -1), (47, 0.9), (51, -0.6), (55, 0.2), (59, 0), (62, 0)])
    leg = T([(1, 0), (9, 0), (13, 8), (19, 0), (26, 0), (30, 5), (34, 0), (62, 0)])
    wag_amp = T([(1, 0), (8, 8), (12, 20), (50, 20), (58, 0), (62, 0)])
    happy = T([(1, 0), (4, 0), (8, 1), (50, 1), (55, 0), (62, 0)])
    smile = T([(1, 0), (50, 0), (54, 1), (58, 0), (62, 0)])
    rz = [root_z(f) for f in range(1, N + 1)]
    sqv = [squash(f) for f in range(1, N + 1)]
    ears, tail_fx = secondary(rz, sqv, N)
    for f in range(1, N + 1):
        i = f - 1
        e = clamp(ears[i], -8, 12)
        P = {'root_z': rz[i], 'squash': sqv[i], 'armL_up': arms(f), 'armR_up': arms(f), 'armL_x': 0.15 * arms(f),
             'armR_x': 0.15 * arms(f), 'pawL_x': -0.35 * arms(f), 'pawR_x': -0.35 * arms(f),
             'head_x': head_x(f), 'head_y': 4.5 * sway(f), 'head_z': 3 * sway(f), 'hips_y': -3.5 * sway(f), 'spine_y': 1.5 * sway(f),
             'earL_out': clamp(0.8 * e + 2 * happy(f) - 2 * sway(f), -6, 11), 'earR_out': clamp(0.8 * e + 2 * happy(f) + 2 * sway(f), -6, 11),
             'earL_fwd': clamp(4 * happy(f) - 0.4 * e, -3, 12), 'earR_fwd': clamp(4 * happy(f) - 0.4 * e, -3, 12),
             'leg_x': leg(f), 'foot_x': -0.6 * leg(f), 'tail_lift': clamp(7 * happy(f) + 0.5 * tail_fx[i], 0, 10),
             'flap_out': 3 * happy(f) + 30 * max(0.0, -sqv[i])}
        for t in range(4):
            P[f'tail_sway{t}'] = clamp(wag_amp(f) * math.sin(2 * math.pi * (f - 1) / 8.5 - 0.75 * t) * (1 + 0.2 * t), -20, 20)
        A.body_pose(k, R, f, P)
        k.face(f, {'happy': happy(f), 'smile': smile(f)})
    k.finish(1, N, cyclic=False)
    return k.act, {'loop': False, 'frames': N - 1, 'duration_s': (N - 1) / FPS}


def make_wave(O, R):
    N = 68
    k = A.Keyer('wave', O)
    up = T([(1, 0), (5, -4), (9, -10), (17, 114), (21, 102), (26, 105), (46, 105), (50, 109), (60, 0), (68, 0)])
    arm_fwd = T([(1, 0), (9, -6), (17, 44), (22, 36), (46, 38), (52, 28), (61, 0), (68, 0)])
    wave_amp = T([(1, 0), (20, 0), (24, 21), (44, 21), (48, 0), (68, 0)])
    paw_bias = T([(1, 0), (15, 0), (17, -16), (22, 15), (26, 10), (46, 10), (50, -8), (55, 15), (61, -5), (68, 0)])
    lean = T([(1, 0), (6, 2.8), (9, 3), (17, -5), (21, -4), (46, -4), (58, 1.2), (64, 0), (68, 0)])
    shoulder = T([(1, 0), (9, 0), (17, 2.5), (46, 2.0), (56, 0), (68, 0)])
    head_y = T([(1, 0), (9, -2), (19, 5), (46, 4.5), (57, -1.2), (64, 0), (68, 0)])
    head_z = T([(1, 0), (17, 8), (46, 6.5), (60, 0), (68, 0)])
    bounce = T([(1, 0), (7, 0.035), (11, -0.02), (15, 0), (68, 0)])                    # little dip before the raise
    smile = T([(1, 0), (6, 0), (11, 1), (55, 1), (61, 0), (68, 0)])
    ear_perk = T([(1, 0), (10, 0), (16, 7), (46, 6), (56, 0), (68, 0)])
    for f in range(1, N + 1):
        w = wave_amp(f) * math.sin(2 * math.pi * (f - 22) / 8)
        ph = math.sin(2 * math.pi * (f - 22) / 16) * (wave_amp(f) / 21)
        rhythm = 0.012 * math.sin(2 * math.pi * (f - 22) / 8 - 1.0) * (wave_amp(f) / 21)   # body bobs with the waves
        P = {'armL_up': up(f) + 0.12 * w, 'armL_x': arm_fwd(f), 'pawL_y': paw_bias(f) + w,
             'armR_up': -0.06 * up(f) + 3 * shoulder(f) / 2.5, 'hips_y': lean(f), 'spine_y': 0.6 * lean(f) - shoulder(f),
             'squash': bounce(f) + rhythm, 'head_y': head_y(f) + 1.2 * ph, 'head_z': head_z(f), 'head_x': -2.2 * smile(f) + 1.4 * ph,
             'earL_fwd': ear_perk(f), 'earR_fwd': ear_perk(f), 'earL_out': 2.5 * ph * smile(f), 'earR_out': -2.5 * ph * smile(f),
             'tail_lift': 5 * smile(f)}
        for t in range(4):
            P[f'tail_sway{t}'] = clamp(13 * smile(f) * math.sin(2 * math.pi * (f - 1) / 16 - 0.6 * t) * (1 + 0.2 * t), -20, 20)
        A.body_pose(k, R, f, P)
        k.face(f, {'smile': smile(f), 'blink_extra': blink_curve(f, [33, 38])})          # happy double blink mid-wave
    k.finish(1, N, cyclic=False)
    return k.act, {'loop': False, 'frames': N - 1, 'duration_s': (N - 1) / FPS}


def make_head_pet(O, R):
    """Affectionate: a little flinch, eyes melt shut, the head pushes up into the hand and nuzzles
    slowly, the body relaxes, the tail wag builds up, ears pop back with a happy bounce at the end."""
    N = 76
    k = A.Keyer('head_pet', O)
    flinch = T([(1, 0), (3, 1), (6, 0.3), (9, 0), (76, 0)])
    lean = T([(1, 0), (6, 0), (14, 1), (54, 1), (62, 0), (76, 0)])
    melt = T([(1, 0), (10, 0), (18, 0.035), (54, 0.035), (60, -0.03), (63, 0.04), (66, -0.015), (70, 0), (76, 0)])
    ear_out = T([(1, 0), (4, 12), (10, 18), (54, 18), (59, -7), (63, 5), (67, -2), (71, 0), (76, 0)])
    ear_fwd = T([(1, 0), (4, 4), (54, 4), (59, -3), (63, 2), (68, 0), (76, 0)])
    wag_amp = T([(1, 0), (10, 8), (30, 14), (50, 20), (60, 14), (68, 0), (76, 0)])
    wag_per = T([(1, 12), (30, 10), (54, 8), (76, 8)])
    happy = T([(1, 0), (3, 0), (10, 1), (54, 1), (59, 0), (76, 0)])
    smile = T([(1, 0), (54, 0), (58, 1), (68, 1), (73, 0), (76, 0)])
    arms = T([(1, 0), (8, 8), (54, 8), (62, 0), (76, 0)])
    hop = T([(1, 0), (59, 0), (62, 0.018), (65, 0), (76, 0)])
    phase = 0.0
    for f in range(1, N + 1):
        phase += 2 * math.pi / wag_per(f)
        nuzzle = math.sin(2 * math.pi * (f - 14) / 20) * lean(f)
        purr = 0.006 * math.sin(2 * math.pi * (f - 14) / 6) * lean(f)
        P = {'head_x': 5 * flinch(f) - 6 * lean(f) + 1.5 * nuzzle, 'head_y': 3.5 * lean(f) + 1.5 * nuzzle, 'head_z': 6 * lean(f) + 6 * nuzzle,
             'hips_y': 1.8 * nuzzle, 'spine_y': 0.8 * nuzzle, 'hips_x': -2 * lean(f), 'squash': 0.04 * flinch(f) + melt(f) + purr,
             'root_z': hop(f),
             'earL_out': ear_out(f) + 2 * nuzzle, 'earR_out': ear_out(f) - 2 * nuzzle, 'earL_fwd': ear_fwd(f), 'earR_fwd': ear_fwd(f),
             'armL_up': arms(f), 'armR_up': arms(f), 'pawL_x': -9 * lean(f), 'pawR_x': -9 * lean(f),
             'tail_lift': 7 * max(happy(f), smile(f))}
        for t in range(4):
            P[f'tail_sway{t}'] = clamp(wag_amp(f) * math.sin(phase - 0.7 * t) * (1 + 0.2 * t), -20, 20)
        A.body_pose(k, R, f, P)
        k.face(f, {'happy': happy(f), 'smile': smile(f), 'blink_extra': 0.9 * flinch(f)})
    k.finish(1, N, cyclic=False)
    return k.act, {'loop': False, 'frames': N - 1, 'duration_s': (N - 1) / FPS}


def make_tail_touch(O, R):
    """Surprised, then playful: a 2-frame 'take' and a startled jump that turns toward the tail
    (only while airborne), a curious look back, then a hop BACK to face the viewer so the playful
    part (happy face, crouch-wiggle, fast wag, little bounces) reads from the front and 3/4 views."""
    N = 70
    k = A.Keyer('tail_touch', O)
    root_z = T([(1, 0), (4, 0), (10, 0.066), (15, 0), (25, 0), (29, 0.052), (34, 0), (70, 0)])
    root_yaw = T([(1, 0), (6, 0), (13, -28), (26, -28), (32, 0), (70, 0)])          # turns only while airborne
    squash = T([(1, 0), (3, 0.065), (5, -0.085), (9, -0.03), (15, 0.082), (17, 0.02), (18, -0.02), (20, 0), (23, 0),
                (25, 0.06), (27, -0.06), (31, -0.02), (34, 0.075), (36, 0), (38, 0.045), (41, -0.03), (44, 0.045), (47, -0.025),
                (50, 0.03), (53, 0), (70, 0)])
    look = T([(1, 0), (7, 0), (15, -1), (25, -1), (31, 0), (70, 0)])
    head_x = T([(1, 0), (3, -7), (9, -2), (17, 8), (24, 8), (28, -3), (34, 0), (52, -2), (58, 0), (70, 0)])
    head_y = T([(1, 0), (16, 0), (20, -4.5), (24, -3), (34, 0), (37, 4.5), (41, -4.5), (45, 4), (49, -3), (53, 0), (70, 0)])
    wiggle = T([(1, 0), (35, 0), (38, 1), (42, -1), (46, 0.9), (50, -0.6), (53, 0), (70, 0)])
    tail_jerk = T([(1, 0), (3, 0), (5, 1), (12, 0.55), (24, 0), (70, 0)])
    wag_amp = T([(1, 0), (26, 0), (32, 20), (52, 20), (60, 6), (66, 0), (70, 0)])
    ear_fwd = T([(1, 0), (3, 0), (5, 12), (13, 6), (24, 9), (34, 7), (52, 5), (62, 0), (70, 0)])
    arms = T([(1, 0), (3, 0), (6, 38), (12, 16), (16, 8), (25, 10), (29, 32), (35, 12), (52, 10), (60, 0), (70, 0)])
    leg = T([(1, 0), (5, 0), (9, 8), (14, 0), (26, 0), (29, 6), (33, 0), (70, 0)])
    wide = T([(1, 0), (2, 0), (4, 1), (21, 1), (26, 0), (70, 0)])
    happy = T([(1, 0), (25, 0), (29, 1), (54, 1), (59, 0), (70, 0)])
    smile = T([(1, 0), (54, 0), (58, 1), (65, 1), (69, 0), (70, 0)])
    rz = [root_z(f) for f in range(1, N + 1)]
    sqv = [squash(f) for f in range(1, N + 1)]
    ears, tail_fx = secondary(rz, sqv, N)
    for f in range(1, N + 1):
        i = f - 1
        e = clamp(ears[i], -8, 12)
        P = {'root_z': rz[i], 'root_yaw': root_yaw(f), 'squash': sqv[i],
             'hips_z': 10 * look(f), 'head_z': 30 * look(f) + 4 * wiggle(f), 'head_x': head_x(f), 'head_y': head_y(f) + 3 * look(f),
             'hips_y': 3.5 * wiggle(f), 'spine_y': -1.5 * wiggle(f),
             'earL_out': clamp(0.8 * e - 3 * wiggle(f), -6, 12), 'earR_out': clamp(0.8 * e + 3 * wiggle(f), -6, 12),
             'earL_fwd': clamp(ear_fwd(f) - 0.3 * e, -3, 12), 'earR_fwd': clamp(ear_fwd(f) - 0.3 * e, -3, 12),
             'armL_up': arms(f), 'armR_up': arms(f), 'pawL_x': -0.4 * arms(f), 'pawR_x': -0.4 * arms(f),
             'leg_x': leg(f), 'foot_x': -0.6 * leg(f),
             'tail_lift': clamp(10 * tail_jerk(f) + 6 * happy(f) * (1 - tail_jerk(f)) + 0.4 * tail_fx[i], 0, 10),
             'flap_out': 3 * wide(f) + 25 * max(0.0, -sqv[i])}
        for t in range(4):
            P[f'tail_sway{t}'] = clamp(-22 * tail_jerk(f) * (1 - 0.15 * t)
                                       + wag_amp(f) * math.sin(2 * math.pi * (f - 30) / 8.5 - 0.75 * t) * (1 + 0.2 * t), -22, 20)
        A.body_pose(k, R, f, P)
        face = {}
        if wide(f) > 0:
            face['surprised'] = wide(f)
        if happy(f) > 0:
            face['happy'] = happy(f)
        if smile(f) > 0:
            face['smile'] = smile(f)
        face['blink_extra'] = blink_curve(f, [22])
        k.face(f, face)
    k.finish(1, N, cyclic=False)
    return k.act, {'loop': False, 'frames': N - 1, 'duration_s': (N - 1) / FPS}


def main():
    bpy.ops.wm.open_mainfile(filepath=A.SRC)
    O = bpy.data.objects
    R = A.Rig(O['FOX_RIG'])
    sole = A.sole_points(O)
    e1 = json.load(open(os.path.join(A.OUT_DIR, 'anim_spec_e1.json')))
    clips = {}
    builders = [('idle', lambda: make_idle(O, R)),
                ('walk', lambda: locomotion('walk', O, R, sole, A.WALK, WALK_STYLE)),
                ('run', lambda: locomotion('run', O, R, sole, A.RUN, RUN_STYLE)),
                ('happy', lambda: make_happy(O, R)), ('wave', lambda: make_wave(O, R)),
                ('head_pet', lambda: make_head_pet(O, R)), ('tail_touch', lambda: make_tail_touch(O, R))]
    for name, fn in builders:
        _, m = fn()
        keep = {k_: v for k_, v in e1['clips'][name].items() if k_ in ('role', 'head_control', 'face_control')}
        clips[name] = dict(m, **keep)
    rig = O['FOX_RIG']
    rig.animation_data.action = None
    for n in A.FACE_PARTS:
        ad = O[n].data.shape_keys.animation_data
        if ad:
            ad.action = None
        for kb in O[n].data.shape_keys.key_blocks[1:]:
            kb.value = 0.0
    for pb in rig.pose.bones:
        pb.matrix_basis.identity()
    bpy.context.scene['fox_gate'] = 'E2 character motion polish'
    bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
    spec = dict(e1, gate='E2', clips=clips, idle_variation='04_ANIMATIONS/idle_variation_e2.json')
    spec['interaction']['look_at_cursor'] = ('procedural (runtime): input low-pass + dead zone, yaw NECK 45 % / HEAD 55 %, '
                                             'pitch NECK 85 % / HEAD 15 %, yaw ±40°, pitch −15…+20°, critically damped, '
                                             'eyes lead, gentle return to neutral when the pointer rests or leaves')
    json.dump(spec, open(os.path.join(A.OUT_DIR, 'anim_spec_e2.json'), 'w'), indent=2)
    print('saved', OUT)
    for n, c in clips.items():
        print(f'  {n:11s} {c["frames"]:4d} f  loop={c["loop"]}  speed={c.get("speed_mps", "-")}')


if __name__ == '__main__':
    main()
