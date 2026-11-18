"""Gate G1 — Quest, Reward & Streak animation module.

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/anim_g1.py
Reads   03_RIG/fox_rig_d1_1.blend   (canonical approved rig — never written)
Writes  04_ANIMATIONS/g1_quest_reward_streak/fox_anim_g1.blend   (canonical rig + the 9 G1 actions only)
        04_ANIMATIONS/g1_quest_reward_streak/anim_spec_g1.json   (clip contract + effect cues for the runtime)

Same skeleton, same morph-target contract and the same keying pipeline as the approved E2 clips
(anim_e1.Keyer / body_pose, damped-spring follow-through from anim_e2). The E2 core clips are not
re-authored or written. Body-pose limits kept from the E1/E2 QA: tail raise ≤ 10° over the back,
wag ≤ ±20°, head roll on the neck, body squash −9 %…+10 %, root yaw only while airborne, scarf flap
never swings into the chest, ear spread ≤ 18°.

Clips (24 fps). One-shots start and end on the exact rest pose (clean return to the base layer).
  quest      quest_start · quest_complete · quest_failed
  rewards    receive_xp · level_up · achievement_unlock
  streak     streak_active (base loop, does not own head or face) · streak_lost · streak_cheer
Every visual effect (streak flame, lightning, char overlay, confetti, XP orbs, props…) is a
RUNTIME effect triggered by the cues in the spec — nothing is baked into the Fox mesh or material.
"""
import json
import math
import os
import sys

import bpy

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import anim_e1 as A  # noqa: E402
import anim_e2 as E  # noqa: E402

Q, T, clamp, follow, fade_ends, secondary = A.Q, E.T, E.clamp, E.follow, E.fade_ends, E.secondary
blink_curve, smoothstep, FPS = A.blink_curve, A.smoothstep, A.FPS
MOD_DIR = os.path.join(A.OUT_DIR, 'g1_quest_reward_streak')
OUT = os.path.join(MOD_DIR, 'fox_anim_g1.blend')


def fr(f):
    """frame (1-based) → seconds from clip start"""
    return round((f - 1) / FPS, 4)


def wag(f, amp, per, t, phase0=0.0, lag=0.75):
    return clamp(amp * math.sin(2 * math.pi * (f - 1) / per - lag * t + phase0) * (1 + 0.2 * t), -20, 20)


def ears_of(e, extra_fwd=0.0, extra_out=0.0, side=0.0):
    # same envelope as the approved E2 reactions (spread ≤ 11°, never pulled back past −3°)
    return {'earL_out': clamp(0.8 * e + extra_out - side, -6, 11), 'earR_out': clamp(0.8 * e + extra_out + side, -6, 11),
            'earL_fwd': clamp(extra_fwd - 0.3 * e, -3, 12), 'earR_fwd': clamp(extra_fwd - 0.3 * e, -3, 12)}


def face_of(**w):
    return {k: v for k, v in w.items() if v > 1e-4 or k == 'blink_extra'}


def run_clip(name, N, pose_fn, face_fn, rz=None, sq=None, cyclic=False):
    k = A.Keyer(name, O_)
    rzv = [rz(f) if rz else 0.0 for f in range(1, N + 1)]
    sqv = [sq(f) if sq else 0.0 for f in range(1, N + 1)]
    ears, tail = secondary(rzv, sqv, N) if not cyclic else ([0.0] * N, [0.0] * N)
    for f in range(1, N + 1):
        i = f - 1
        P = pose_fn(f, rzv[i], sqv[i], ears[i], tail[i])
        A.body_pose(k, R_, f, P)
        k.face(f, face_fn(f))
    k.finish(1, N, cyclic=cyclic)
    return {'loop': cyclic, 'frames': N - 1, 'duration_s': round((N - 1) / FPS, 4)}


# =========================================================================== QUEST
def quest_start():
    """'Let's go!' — crouch and gather, hop with a fist pump (a small flag appears in the raised paw),
    hold the determined pose, a confident nod, settle."""
    N = 60
    rz = T([(1, 0), (9, 0), (13, 0.042), (17, 0), (60, 0)])
    sq = T([(1, 0), (5, 0.035), (9, 0.075), (11, -0.055), (13, -0.02), (17, 0.07), (19, -0.02), (22, 0.01), (25, 0), (39, 0.02), (42, -0.01), (45, 0), (60, 0)])
    armR = T([(1, 0), (8, -8), (13, 96), (17, 84), (22, 90), (36, 88), (46, 30), (54, 0), (60, 0)])
    armRx = T([(1, 0), (8, -14), (13, 28), (22, 24), (36, 24), (46, 10), (54, 0), (60, 0)])
    armL = T([(1, 0), (8, 6), (13, 22), (36, 20), (48, 4), (56, 0), (60, 0)])
    armLx = T([(1, 0), (8, 10), (13, 34), (36, 30), (48, 8), (56, 0), (60, 0)])
    head_x = T([(1, 0), (8, 7), (13, -8), (18, -4), (34, -3), (38, 6), (42, -1), (46, 0), (60, 0)])   # the nod at f38
    head_z = T([(1, 0), (10, 0), (14, 6), (34, 5), (48, 0), (60, 0)])
    lean = T([(1, 0), (8, 3), (13, -3), (34, -2), (46, 0), (60, 0)])
    leg = T([(1, 0), (10, 0), (13, 6), (16, 0), (60, 0)])
    proud = T([(1, 0), (6, 0), (11, 1), (44, 1), (50, 0), (60, 0)])
    smile = T([(1, 0), (44, 0), (48, 0.8), (55, 0), (60, 0)])
    perk = T([(1, 0), (6, -4), (12, 10), (36, 8), (50, 0), (60, 0)])

    def pose(f, rzv, sqv, e, tl):
        P = {'root_z': rzv, 'squash': sqv, 'armR_up': armR(f), 'armR_x': armRx(f), 'pawR_x': -0.25 * armR(f),
             'armL_up': armL(f), 'armL_x': armLx(f), 'pawL_x': -0.6 * armLx(f), 'head_x': head_x(f), 'head_z': head_z(f),
             'hips_y': -0.8 * lean(f), 'spine_x': lean(f), 'leg_x': leg(f), 'foot_x': -0.6 * leg(f),
             'tail_lift': clamp(8 * proud(f) + 0.5 * tl, 0, 10), 'flap_out': 2 * proud(f) + 25 * max(0.0, -sqv)}
        P.update(ears_of(e, perk(f)))
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, 9 * proud(f), 14, t)
        return P
    m = run_clip('quest_start', N, pose, lambda f: face_of(proud=proud(f), smile=smile(f), blink_extra=blink_curve(f, [29])), rz, sq)
    m['cues'] = [{'t': fr(11), 'fx': 'prop.flag', 'socket': 'ATT_HAND_R', 'until': fr(47)},
                 {'t': fr(12), 'fx': 'burst.exclaim', 'duration': 1.2},
                 {'t': fr(13), 'fx': 'sparkle', 'at': 'hand_r', 'count': 10}]
    return m


def quest_complete():
    """Big celebration — realise, deep crouch, a high jump with both arms up (confetti + a star ring at
    the apex), a bouncy landing, a second little hop with arm pumps, happy sway, settle."""
    N = 80
    rz = T([(1, 0), (10, 0), (15, 0.105), (20, 0), (27, 0), (31, 0.042), (35, 0), (80, 0)])
    # squash is kept small while the arms are up: ARM_* / NECK ignore HIPS scale in Blender (inherit_scale NONE) but glTF has
    # no shear, so large non-uniform squash under rotated children shifts their tips in three.js (gltf_pose_fidelity_g1.py)
    sq = T([(1, 0), (3, -0.02), (6, 0.04), (10, 0.095), (12, -0.085), (15, -0.03), (19, -0.015), (20, 0.045), (22, 0.012), (24, -0.02),
            (27, 0.03), (29, -0.02), (31, -0.005), (35, 0.035), (38, -0.01), (41, 0.005), (44, 0), (80, 0)])
    arms = T([(1, 0), (4, 10), (10, -10), (14, 112), (19, 104), (22, 92), (26, 78), (31, 108), (36, 84), (44, 96), (56, 40), (70, 0), (80, 0)])
    armx = T([(1, 0), (10, -6), (14, 14), (36, 12), (56, 6), (70, 0), (80, 0)])
    head_x = T([(1, 0), (3, -5), (10, 8), (14, -10), (20, 4), (23, -3), (31, -7), (36, 2), (44, -3), (60, 0), (80, 0)])
    sway = T([(1, 0), (44, 0), (48, 1), (53, -1), (58, 0.8), (63, -0.5), (68, 0), (80, 0)])
    leg = T([(1, 0), (11, 0), (15, 10), (19, 0), (28, 0), (31, 5), (34, 0), (80, 0)])
    wide = T([(1, 0), (2, 1), (6, 1), (9, 0), (80, 0)])
    excited = T([(1, 0), (8, 0), (12, 1), (40, 1), (45, 0), (80, 0)])
    happy = T([(1, 0), (40, 0), (45, 1), (66, 1), (71, 0), (80, 0)])
    smile = T([(1, 0), (66, 0), (70, 1), (76, 0), (80, 0)])
    wagamp = T([(1, 0), (10, 6), (14, 20), (66, 20), (74, 0), (80, 0)])

    def pose(f, rzv, sqv, e, tl):
        joy = max(excited(f), happy(f))
        P = {'root_z': rzv, 'squash': sqv, 'armL_up': arms(f), 'armR_up': arms(f), 'armL_x': armx(f), 'armR_x': armx(f),
             'pawL_x': -0.3 * arms(f), 'pawR_x': -0.3 * arms(f), 'head_x': head_x(f), 'head_y': 4.5 * sway(f), 'head_z': 3 * sway(f),
             'hips_y': -3.5 * sway(f), 'spine_y': 1.5 * sway(f), 'leg_x': leg(f), 'foot_x': -0.6 * leg(f),
             'tail_lift': clamp(9 * joy + 0.5 * tl, 0, 10), 'flap_out': 3 * joy + 30 * max(0.0, -sqv)}
        P.update(ears_of(clamp(e, -8, 12), 6 * joy + 6 * wide(f), 2 * joy, 2 * sway(f)))
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, wagamp(f), 8, t)
        return P
    m = run_clip('quest_complete', N, pose, lambda f: face_of(surprised=wide(f), excited=excited(f), happy=happy(f), smile=smile(f)), rz, sq)
    m['cues'] = [{'t': fr(14), 'fx': 'burst.star_ring', 'duration': 0.9},
                 {'t': fr(15), 'fx': 'confetti', 'count': 70, 'duration': 2.4},
                 {'t': fr(31), 'fx': 'sparkle', 'at': 'head', 'count': 14}]
    return m


def quest_failed():
    """Disappointment with recovery — a small 'huh?', the realisation slump (head drops, ears droop,
    tail low), a deflating sigh, a slow head shake, then a breath in, a determined nod and back to
    neutral: the fox is sad but not defeated. A little rain cloud hovers during the slump."""
    N = 88
    # the slump squash is held while the neck is pitched down: kept low for glTF fidelity (see quest_complete note)
    sq = T([(1, 0), (3, -0.02), (6, 0), (12, 0.01), (18, 0.02), (24, 0.014), (28, -0.012), (38, 0.025), (46, 0.02), (62, 0.018),
            (68, -0.015), (72, -0.01), (76, 0.005), (80, 0), (88, 0)])
    slump = T([(1, 0), (6, 0), (16, 1), (62, 1), (72, 0.15), (80, 0), (88, 0)])
    head_up = T([(1, 0), (3, -5), (6, -4), (10, 0), (88, 0)])
    shake = T([(1, 0), (42, 0), (45, 1), (49, -1), (53, 0.9), (57, -0.6), (61, 0), (88, 0)])
    nod = T([(1, 0), (66, 0), (70, -5), (73, 5), (77, 0), (88, 0)])
    look = T([(1, 0), (10, 0), (18, 1), (40, 1), (60, 0.6), (70, 0), (88, 0)])
    wide = T([(1, 0), (2, 0.7), (6, 0.7), (10, 0), (88, 0)])
    sad = T([(1, 0), (8, 0), (16, 1), (64, 1), (70, 0), (88, 0)])
    proud = T([(1, 0), (66, 0), (71, 0.6), (80, 0.6), (86, 0), (88, 0)])
    sigh_blink = [34, 40]
    tail_env = T([(1, 0), (4, 1), (80, 1), (88, 0)])

    def pose(f, rzv, sqv, e, tl):
        s = slump(f)
        P = {'squash': sqv, 'head_x': 14 * s + head_up(f) + nod(f), 'head_z': 10 * shake(f) + 7 * look(f), 'head_y': -3 * look(f) * s,
             'spine_x': 5 * s, 'hips_x': -1.5 * s, 'armL_x': 10 * s, 'armR_x': 10 * s, 'armL_up': 2 * s, 'armR_up': 2 * s,
             'pawL_x': 8 * s, 'pawR_x': 8 * s, 'tail_lift': 3 * proud(f) / 0.6,
             'earL_out': clamp(11 * s + 2 * wide(f), -6, 11), 'earR_out': clamp(11 * s + 2 * wide(f), -6, 11),
             'earL_fwd': clamp(-3 * s + 8 * wide(f) + 5 * proud(f), -3, 12), 'earR_fwd': clamp(-3 * s + 8 * wide(f) + 5 * proud(f), -3, 12)}
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, 4 * (1 - s) * tail_env(f), 30, t)
        return P
    m = run_clip('quest_failed', N, pose, lambda f: face_of(surprised=wide(f), sad=sad(f), proud=proud(f), blink_extra=blink_curve(f, sigh_blink, close=3, hold=2, open_=4)), None, sq)
    m['cues'] = [{'t': fr(12), 'fx': 'cloud.rain', 'at': 'head', 'until': fr(62)},
                 {'t': fr(36), 'fx': 'puff.sigh', 'at': 'mouth'}]
    return m


# =========================================================================== REWARDS
def receive_xp():
    """XP orbs stream in from the upper right: the fox notices, opens its paws to catch them, absorbs
    them (a glow pulse + squash), a happy little hop, pats its chest, settles."""
    N = 54
    rz = T([(1, 0), (19, 0), (23, 0.026), (27, 0), (54, 0)])
    sq = T([(1, 0), (5, -0.015), (16, 0), (18, 0.055), (20, -0.03), (23, -0.01), (27, 0.045), (30, -0.01), (33, 0), (54, 0)])
    look = T([(1, 0), (4, 1), (14, 0.9), (17, 0), (54, 0)])
    open_ = T([(1, 0), (5, 0), (11, 1), (17, 1), (20, 0.2), (24, 0), (54, 0)])
    pat = T([(1, 0), (24, 0), (29, 1), (38, 1), (46, 0), (54, 0)])
    pat_tap = T([(1, 0), (30, 0), (32, 1), (34, 0), (36, 1), (38, 0), (54, 0)])
    wide = T([(1, 0), (3, 0.7), (9, 0.6), (13, 0), (54, 0)])
    happy = T([(1, 0), (14, 0), (18, 1), (30, 1), (34, 0), (54, 0)])
    smile = T([(1, 0), (30, 0), (34, 1), (46, 1), (51, 0), (54, 0)])
    perk = T([(1, 0), (4, 9), (14, 7), (24, 6), (44, 3), (52, 0), (54, 0)])

    def pose(f, rzv, sqv, e, tl):
        o, p = open_(f), pat(f)
        P = {'root_z': rzv, 'squash': sqv, 'head_x': -9 * look(f) + 2 * p, 'head_z': 12 * look(f), 'head_y': 3 * look(f),
             'armL_up': 34 * o + 10 * p, 'armR_up': 34 * o + 10 * p, 'armL_x': 30 * o + 36 * p + 4 * pat_tap(f), 'armR_x': 30 * o + 30 * p,
             'pawL_x': -12 * o - 22 * p, 'pawR_x': -12 * o - 18 * p, 'spine_x': -2 * o,
             'tail_lift': clamp(7 * max(happy(f), smile(f)) + 0.5 * tl, 0, 10), 'flap_out': 2 * happy(f) + 25 * max(0.0, -sqv)}
        P.update(ears_of(clamp(e, -8, 12), perk(f)))
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, 16 * max(happy(f), smile(f)), 8, t)
        return P
    m = run_clip('receive_xp', N, pose, lambda f: face_of(surprised=wide(f), happy=happy(f), smile=smile(f)), rz, sq)
    m['cues'] = [{'t': fr(4), 'fx': 'xp.orbs', 'count': 14, 'travel': 0.55, 'to': 'chest'},
                 {'t': fr(17), 'fx': 'glow.absorb', 'at': 'chest', 'duration': 0.5},
                 {'t': fr(18), 'fx': 'text.plus_xp', 'duration': 1.3}]
    return m


def level_up():
    """Charge → launch → a full spin in the air → power landing → victory pose → settle.
    The runtime applies the new level scale at the apex cue (the fox grows mid-air)."""
    N = 100
    rz = T([(1, 0), (15, 0), (23, 0.135), (31, 0), (37, 0), (100, 0)])
    yaw = T([(1, 0), (16, 0), (30, 360), (100, 360)])                       # only while airborne (f16–30)
    sq = T([(1, 0), (6, 0.03), (12, 0.08), (15, 0.09), (17, -0.09), (21, -0.035), (27, -0.02), (31, 0.10), (33, 0.03), (35, -0.04),
            (38, 0.03), (41, -0.01), (44, 0), (60, 0), (63, 0.02), (66, 0), (100, 0)])
    charge = T([(1, 0), (4, 0.3), (14, 1), (16, 0), (100, 0)])
    arms = T([(1, 0), (14, 8), (18, 96), (24, 104), (30, 92), (33, 70), (37, 116), (42, 108), (48, 116), (58, 106), (70, 34), (82, 20), (92, 0), (100, 0)])
    armx = T([(1, 0), (14, 26), (18, 6), (30, 8), (37, 12), (58, 12), (70, -6), (82, -8), (92, 0), (100, 0)])
    paw = T([(1, 0), (14, -30), (18, -10), (58, -14), (70, 28), (82, 30), (92, 0), (100, 0)])        # fists → hands on hips
    head_x = T([(1, 0), (14, 7), (18, -10), (24, -6), (31, 5), (34, -2), (38, -7), (58, -5), (66, 4), (70, 0), (78, -2), (100, 0)])
    lean = T([(1, 0), (14, 3), (20, -2), (38, -4), (60, -3), (80, -2), (92, 0), (100, 0)])
    leg = T([(1, 0), (16, 0), (22, 11), (29, 4), (31, 0), (100, 0)])
    proud_ = T([(1, 0), (2, 0), (8, 0.7), (15, 0.7), (17, 0), (38, 0), (44, 1), (88, 1), (94, 0), (100, 0)])
    excited = T([(1, 0), (15, 0), (18, 1), (38, 1), (44, 0), (100, 0)])
    perk = T([(1, 0), (10, -5), (16, -5), (19, 10), (60, 9), (90, 0), (100, 0)])
    wagamp = T([(1, 0), (34, 0), (40, 18), (84, 16), (94, 0), (100, 0)])

    def pose(f, rzv, sqv, e, tl):
        c = charge(f)
        tremble = 0.006 * math.sin(f * 2.6) * c                            # contained energy
        P = {'root_z': rzv, 'root_yaw': yaw(f), 'squash': sqv + tremble, 'armL_up': arms(f), 'armR_up': arms(f), 'armL_x': armx(f), 'armR_x': armx(f),
             'pawL_x': paw(f), 'pawR_x': paw(f), 'head_x': head_x(f), 'spine_x': lean(f), 'leg_x': leg(f), 'foot_x': -0.6 * leg(f),
             'tail_lift': clamp(10 * max(proud_(f) * (f > 30), excited(f)) + 0.4 * tl, 0, 10), 'flap_out': 4 * excited(f) + 30 * max(0.0, -sqv)}
        P.update(ears_of(clamp(e, -8, 12), perk(f)))
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, wagamp(f), 10, t)
        return P
    m = run_clip('level_up', N, pose, lambda f: face_of(proud=proud_(f), excited=excited(f), blink_extra=blink_curve(f, [72])), rz, sq)
    m['cues'] = [{'t': fr(1), 'fx': 'aura.charge', 'until': fr(16)},
                 {'t': fr(16), 'fx': 'beam.level', 'duration': 1.1},
                 {'t': fr(23), 'fx': 'level.apply'},
                 {'t': fr(23), 'fx': 'text.level_up', 'duration': 2.0},
                 {'t': fr(31), 'fx': 'ring.shockwave', 'duration': 0.7},
                 {'t': fr(37), 'fx': 'sparkle', 'at': 'head', 'count': 18}]
    return m


def achievement_unlock():
    """A medal rises in front of the fox: notice (wide eyes, ears forward), a gasp, reach and take it
    with both paws, lift it high with a proud hop (star burst), hold, lower, the medal flies off."""
    N = 86
    rz = T([(1, 0), (34, 0), (38, 0.03), (42, 0), (86, 0)])
    sq = T([(1, 0), (8, 0), (11, -0.035), (15, 0.01), (20, 0.03), (24, 0), (34, 0.04), (36, -0.03), (38, -0.01), (42, 0.045), (45, -0.01),
            (48, 0), (86, 0)])
    look = T([(1, 0), (4, 1), (20, 1), (28, 0), (86, 0)])
    gasp = T([(1, 0), (8, 0), (11, 1), (17, 0.5), (22, 0), (86, 0)])
    reach = T([(1, 0), (16, 0), (24, 1), (30, 1), (36, 0), (86, 0)])
    lift = T([(1, 0), (28, 0), (36, 1), (66, 1), (76, 0), (86, 0)])
    sway = T([(1, 0), (46, 0), (50, 1), (55, -1), (60, 0.7), (65, 0), (86, 0)])
    wide = T([(1, 0), (3, 1), (18, 1), (24, 0), (86, 0)])
    proud_ = T([(1, 0), (24, 0), (32, 1), (70, 1), (76, 0), (86, 0)])
    smile = T([(1, 0), (70, 0), (74, 1), (82, 0), (86, 0)])
    perk = T([(1, 0), (4, 11), (24, 9), (40, 8), (74, 2), (84, 0), (86, 0)])

    def pose(f, rzv, sqv, e, tl):
        rc, lf = reach(f), lift(f)
        P = {'root_z': rzv, 'squash': sqv, 'head_x': 7 * look(f) - 4 * gasp(f) - 9 * lf, 'head_y': 3 * sway(f), 'head_z': 3 * sway(f),
             'armL_up': 18 * gasp(f) + 14 * rc + 104 * lf, 'armR_up': 18 * gasp(f) + 14 * rc + 104 * lf,
             'armL_x': 34 * gasp(f) + 56 * rc + 30 * lf, 'armR_x': 34 * gasp(f) + 56 * rc + 30 * lf,
             'pawL_x': -16 * rc - 26 * lf, 'pawR_x': -16 * rc - 26 * lf, 'pawL_y': 10 * rc, 'pawR_y': -10 * rc,
             'spine_x': 3 * look(f) - 3 * lf, 'hips_y': -2.5 * sway(f),
             'tail_lift': clamp(9 * proud_(f) + 0.5 * tl, 0, 10), 'flap_out': 3 * proud_(f) + 25 * max(0.0, -sqv)}
        P.update(ears_of(clamp(e, -8, 12), perk(f)))
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, 15 * proud_(f) + 6 * wide(f), 9, t)
        return P
    m = run_clip('achievement_unlock', N, pose, lambda f: face_of(surprised=wide(f), proud=proud_(f), smile=smile(f), blink_extra=blink_curve(f, [56])), rz, sq)
    m['cues'] = [{'t': fr(1), 'fx': 'prop.medal', 'follow': [[fr(1), 'front_rise'], [fr(22), 'paws'], [fr(72), 'fly_away']], 'until': fr(80)},
                 {'t': fr(36), 'fx': 'burst.stars', 'at': 'paws', 'count': 12, 'duration': 1.0},
                 {'t': fr(38), 'fx': 'sparkle', 'at': 'paws', 'count': 16}]
    return m


# =========================================================================== STREAK
def streak_active():
    """Base loop while a streak is alive (4 s, seamless). Confident and warm: chest slightly out,
    a lively breath, a slow weight shift, tail held higher with a slow wave, ears perked. It does not
    own the head (look-at and petting work) nor the face (moods work); the flame is a runtime effect."""
    N = 97                                             # frame 97 == frame 1
    L = N - 1
    def per(f, p, ph=0.0):
        return math.sin(2 * math.pi * (f - 1) / p + ph)
    def pose(f, rzv, sqv, e, tl):
        breath = per(f, L / 3)                         # 3 breaths per loop
        shift = per(f, L)                              # one slow weight shift
        bob = per(f, L / 6, 0.6)
        P = {'squash': 0.012 * breath + 0.004 * bob, 'spine_x': -2.0 + 0.6 * breath, 'hips_y': 2.0 * shift, 'spine_y': -1.0 * shift,
             'head_x': -1.5 - 0.8 * breath, 'head_y': -1.2 * shift, 'head_z': 2.0 * per(f, L / 2, 1.2),
             'armL_up': 6 + 1.5 * breath, 'armR_up': 6 + 1.5 * breath, 'armL_x': 3, 'armR_x': 3,
             'earL_fwd': 5 + 1.5 * per(f, L / 2, 0.4), 'earR_fwd': 5 + 1.5 * per(f, L / 2, 0.9),
             'earL_out': 1.5 * per(f, L, 0.3) + 1, 'earR_out': -1.5 * per(f, L, 0.3) + 1,
             'tail_lift': 7 + 1.5 * per(f, L / 2), 'flap_out': 1.5 + 0.8 * (1 + breath)}
        for t in range(4):
            P[f'tail_sway{t}'] = clamp(9 * per(f, L / 2, -0.7 * t) * (1 + 0.15 * t) + 4 * per(f, L / 4, -0.9 * t), -20, 20)
        return P
    m = run_clip('streak_active', N, pose, lambda f: face_of(blink_extra=blink_curve(f, [22, 63, 68])), cyclic=True)
    m['cues'] = [{'t': 0.0, 'fx': 'flame.loop', 'note': 'the streak flame is a persistent runtime state (setStreak), shown while the streak is active'}]
    return m


def streak_lost():
    """The flame flickers — the fox looks at it, worried — a lightning bolt hits: a stiff electrified
    jolt, fur charred for a moment, the flame goes out in smoke; a dizzy wobble, two little coughs,
    sadness, then a big dog-shake that knocks the soot off and back to neutral."""
    N = 100
    jolt = T([(1, 0), (12, 0), (13, 1), (20, 0.8), (24, 0), (100, 0)])
    look = T([(1, 0), (4, 1), (12, 1), (14, 0.4), (40, 0.4), (50, 1), (68, 1), (72, 0), (100, 0)])
    dizzy = T([(1, 0), (22, 0), (26, 1), (34, 1), (38, 0), (100, 0)])
    sad = T([(1, 0), (40, 0), (48, 1), (70, 1), (76, 0), (100, 0)])
    slump = T([(1, 0), (42, 0), (50, 1), (68, 1), (74, 0), (100, 0)])
    shake = T([(1, 0), (73, 0), (75, 1), (86, 1), (89, 0), (100, 0)])
    worry = T([(1, 0), (3, 0.6), (12, 0.6), (13, 0), (100, 0)])
    wide = T([(1, 0), (12, 0), (13, 1), (24, 1), (27, 0), (100, 0)])
    sleepy = T([(1, 0), (24, 0), (27, 0.65), (35, 0.65), (38, 0), (100, 0)])
    proud = T([(1, 0), (86, 0), (90, 0.5), (96, 0), (100, 0)])
    cough = T([(1, 0), (38, 0), (40, 1), (42, 0), (44, 0), (46, 1), (48, 0), (100, 0)])
    tail_up = T([(1, 0), (24, 0), (30, 2), (88, 2), (96, 0), (100, 0)])
    base_sq = T([(1, 0), (12, 0), (13, -0.08), (24, -0.04), (28, 0), (50, 0.05), (68, 0.05), (74, 0), (100, 0)])

    def pose(f, rzv, sqv, e, tl):
        j, sh = jolt(f), shake(f)
        buzz = (1 if f % 2 else -1) * j * (1 if 13 <= f <= 23 else 0)          # electrified vibration (decays with the jolt)
        wob = math.sin(2 * math.pi * (f - 26) / 9) * dizzy(f)
        dog = math.sin(2 * math.pi * (f - 75) / 4) * sh                         # fast dog-shake
        s = slump(f)
        P = {'squash': base_sq(f) + 0.025 * buzz + 0.05 * cough(f) * 0.6, 'head_x': -6 * look(f) * (1 - j) - 4 * j + 10 * s + 6 * cough(f) - 3 * worry(f),
             'head_z': 10 * look(f) * (1 - j) + 6 * wob, 'head_y': 4 * buzz + 5 * wob + 5 * dog,
             'hips_y': 6 * dog + 2 * wob, 'spine_y': -4 * dog, 'spine_x': 4 * s,
             'armL_up': 40 * j + 4 * dog, 'armR_up': 40 * j - 4 * dog, 'armL_x': 8 * s - 6 * j, 'armR_x': 8 * s - 6 * j, 'pawL_x': 30 * j, 'pawR_x': 30 * j,
             'earL_fwd': clamp(12 * j + 5 * worry(f) - 3 * s, -3, 12), 'earR_fwd': clamp(12 * j + 5 * worry(f) - 3 * s, -3, 12),
             'earL_out': clamp(-6 * j + 10 * s + 2 * dizzy(f) + 4 * dog, -6, 11), 'earR_out': clamp(-6 * j + 10 * s + 2 * dizzy(f) - 4 * dog, -6, 11),
             'tail_lift': clamp(10 * j + tail_up(f) * (1 - s), 0, 10), 'flap_out': 4 * j + 3 * abs(dog)}
        for t in range(4):
            P[f'tail_sway{t}'] = clamp(2 * buzz * (t + 1) + 12 * dog * (1 + 0.2 * t) * math.cos(0.8 * t), -20, 20)
        return P
    m = run_clip('streak_lost', N, pose, lambda f: face_of(sad=max(sad(f), 0.5 * worry(f)), surprised=wide(f), sleepy=sleepy(f), proud=proud(f),
                                                         blink_extra=blink_curve(f, [56, 91])), None, None)
    m['cues'] = [{'t': fr(1), 'fx': 'flame.flicker', 'until': fr(12)},
                 {'t': fr(12), 'fx': 'lightning', 'target': 'flame', 'duration': 0.35},
                 {'t': fr(13), 'fx': 'char.on', 'fade': 0.12},
                 {'t': fr(14), 'fx': 'flame.extinguish', 'duration': 0.5},
                 {'t': fr(15), 'fx': 'smoke', 'at': 'flame', 'count': 8, 'duration': 1.6},
                 {'t': fr(40), 'fx': 'puff.cough', 'at': 'mouth'},
                 {'t': fr(46), 'fx': 'puff.cough', 'at': 'mouth'},
                 {'t': fr(75), 'fx': 'char.off', 'fade': 0.6},
                 {'t': fr(75), 'fx': 'soot.shake', 'count': 18, 'duration': 0.9},
                 {'t': fr(100), 'fx': 'streak.end', 'note': 'runtime marks the streak inactive (flame stays out)'}]
    return m


def streak_cheer():
    """Streak milestone: gather, 'yes! yes!' alternating fist pumps, then both arms up with a hop while
    the flame flares in its tier colour, happy wag, settle."""
    N = 74
    rz = T([(1, 0), (21, 0), (25, 0.038), (29, 0), (74, 0)])
    sq = T([(1, 0), (5, 0.04), (8, 0.065), (10, -0.02), (13, 0.02), (16, -0.015), (19, 0.03), (21, 0.05), (23, -0.06), (25, -0.02),
            (29, 0.075), (32, -0.02), (35, 0.01), (38, 0), (74, 0)])
    armR = T([(1, 0), (8, 6), (12, 94), (15, 40), (18, 36), (24, 104), (40, 98), (54, 30), (66, 0), (74, 0)])
    armL = T([(1, 0), (8, 6), (12, 28), (15, 36), (18, 94), (21, 40), (24, 104), (40, 98), (54, 30), (66, 0), (74, 0)])
    armx = T([(1, 0), (8, 26), (12, 18), (24, 12), (40, 12), (54, 6), (66, 0), (74, 0)])
    head_x = T([(1, 0), (8, 6), (12, -6), (15, 2), (18, -6), (21, 2), (25, -9), (30, 3), (34, -2), (44, 0), (74, 0)])
    head_y = T([(1, 0), (10, 0), (12, -3), (15, 0), (18, 3), (21, 0), (74, 0)])
    leg = T([(1, 0), (22, 0), (25, 6), (28, 0), (74, 0)])
    excited = T([(1, 0), (6, 0), (11, 1), (44, 1), (49, 0), (74, 0)])
    happy = T([(1, 0), (44, 0), (48, 1), (62, 1), (67, 0), (74, 0)])
    wagamp = T([(1, 0), (8, 8), (12, 20), (60, 20), (68, 0), (74, 0)])

    def pose(f, rzv, sqv, e, tl):
        joy = max(excited(f), happy(f))
        P = {'root_z': rzv, 'squash': sqv, 'armR_up': armR(f), 'armL_up': armL(f), 'armR_x': armx(f), 'armL_x': armx(f),
             'pawR_x': -0.3 * armR(f), 'pawL_x': -0.3 * armL(f), 'head_x': head_x(f), 'head_y': head_y(f), 'leg_x': leg(f), 'foot_x': -0.6 * leg(f),
             'hips_y': 1.5 * head_y(f), 'tail_lift': clamp(9 * joy + 0.5 * tl, 0, 10), 'flap_out': 3 * joy + 30 * max(0.0, -sqv)}
        P.update(ears_of(clamp(e, -8, 12), 7 * joy))
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, wagamp(f), 8, t)
        return P
    m = run_clip('streak_cheer', N, pose, lambda f: face_of(excited=excited(f), happy=happy(f)), rz, sq)
    m['cues'] = [{'t': fr(6), 'fx': 'flame.flare', 'duration': 1.6},
                 {'t': fr(24), 'fx': 'ring.tier', 'duration': 0.8},
                 {'t': fr(25), 'fx': 'sparkle', 'at': 'flame', 'count': 16}]
    return m


CATEGORIES = {'quest': ['quest_start', 'quest_complete', 'quest_failed'],
              'rewards': ['receive_xp', 'level_up', 'achievement_unlock'],
              'streak': ['streak_active', 'streak_lost', 'streak_cheer']}
ROLES = {'streak_active': ('base loop while a streak is alive (replaces idle as the base clip)', 0.0, 0.0)}
BUILDERS = {'quest_start': quest_start, 'quest_complete': quest_complete, 'quest_failed': quest_failed, 'receive_xp': receive_xp,
            'level_up': level_up, 'achievement_unlock': achievement_unlock, 'streak_active': streak_active, 'streak_lost': streak_lost,
            'streak_cheer': streak_cheer}
LARGE_MOTION = {'quest_start', 'quest_complete', 'level_up', 'streak_lost', 'streak_cheer', 'achievement_unlock'}

STREAK_TIERS = {
    'orange': {'days': [3, 6], 'core': '#FFD25E', 'mid': '#FF8A1F', 'edge': '#E8480F'},
    'blue': {'days': [7, 13], 'core': '#B8E4FF', 'mid': '#3EA2FF', 'edge': '#1A4FC4'},
    'purple': {'days': [14, 29], 'core': '#E2C7FF', 'mid': '#9A5CFF', 'edge': '#5224B5'},
    'crimson': {'days': [30, None], 'core': '#FFBFD8', 'mid': '#F2427F', 'edge': '#8E0E33'},
}


def main():
    global O_, R_
    bpy.ops.wm.open_mainfile(filepath=A.SRC)
    O_ = bpy.data.objects
    R_ = A.Rig(O_['FOX_RIG'])
    clips = {}
    for cat, names in CATEGORIES.items():
        for n in names:
            m = BUILDERS[n]()
            role, hc, fc = ROLES.get(n, ('one-shot', 1.0, 1.0))
            clips[n] = dict(m, category=cat, role=role, head_control=hc, face_control=fc, large_motion=n in LARGE_MOTION)
            print(f'  {n:19s} {m["frames"]:4d} f  {m["duration_s"]:.3f} s  loop={m["loop"]}', flush=True)
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
    bpy.context.scene['fox_gate'] = 'G1 quest, reward & streak module'
    os.makedirs(MOD_DIR, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
    spec = {
        'asset': 'LifeQuest Fox V2', 'gate': 'G1', 'module': 'g1_quest_reward_streak', 'fps': FPS,
        'source_rig': '03_RIG/fox_rig_d1_1.blend', 'base_animation_set': '06_EXPORTS/glb/fox_v2_anim_e2.glb (E2 core clips, unchanged)',
        'categories': CATEGORIES, 'clips': clips, 'streak_tiers': STREAK_TIERS,
        'cue_note': 'cues are runtime effect triggers (seconds from clip start). Effects live in the runtime '
                    '(FoxEffectsManager); none is baked into the Fox mesh, material or skeleton.',
        'head_control_note': 'as E1/E2: 1 = clip owns the head (look-at suppressed); streak_active = 0 so look-at keeps working',
        'face_control_note': 'as E1/E2: 1 = clip drives the facial morphs; streak_active = 0 so moods keep working',
    }
    json.dump(spec, open(os.path.join(MOD_DIR, 'anim_spec_g1.json'), 'w'), indent=2)
    print('saved', OUT)


if __name__ == '__main__':
    main()
