"""Gate G1.1 — cinematic animation polish of the nine G1 clips (Quest, Rewards, Streak).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/anim_g1_1.py
Reads   03_RIG/fox_rig_d1_1.blend   (canonical approved rig — never written)
Writes  04_ANIMATIONS/g1_1_cinematic_polish/fox_anim_g1_1.blend   (canonical rig + the 9 G1.1 actions)
        04_ANIMATIONS/g1_1_cinematic_polish/anim_spec_g1_1.json   (clip contract + data-driven VFX timeline)
Gate G1 files (anim_g1.py, fox_anim_g1.blend, anim_spec_g1.json, the G1 module GLB) are not touched.

Same skeleton, morph targets, sockets and keying pipeline as E2 / G1 (anim_e1.Keyer / body_pose,
anim_e2 spring follow-through, anim_g1 helpers). Same clip names and roles, so the G1.1 module is a
drop-in replacement of the G1 module. E2 limits kept: tail raise ≤ 10°, wag ≤ ±20°, ear spread ≤ 11°,
ears forward ≥ −3°, head pitch / roll mostly on the NECK, root yaw only while airborne. Squash is kept
small while arms are raised (glTF has no shear, see KNOWN_LIMITATIONS_GATE_G1 #1).

What changes against G1 (acting):
  * the streak flame is HELD: streak_active keeps the left paw raised in a palm-up "holding" pose
    (HOLD); the runtime attaches the flame to ATT_HAND_L. streak_cheer and streak_lost start from the
    streak_active pose (streak_cheer also ends on it), so the flame never pops when a streak clip
    fades in over the streak base loop.
  * every clip has a readable anticipation → action → follow-through → recovery, with holds on the
    story beats (e.g. streak_lost: notice → cloud → look up → strike → jolt → empty paw → recover).
  * effect cues are placed on the acting beats (apex, catch, strike, pointing), see `cues`.
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
import anim_g1 as G  # noqa: E402  (helpers only: wag, ears_of, face_of, run_clip, fr; G1 outputs are not written)

T, clamp = E.T, E.clamp
blink_curve, FPS = A.blink_curve, A.FPS
wag, ears_of, face_of, fr = G.wag, G.ears_of, G.face_of, G.fr
MOD_DIR = os.path.join(A.OUT_DIR, 'g1_1_cinematic_polish')
OUT = os.path.join(MOD_DIR, 'fox_anim_g1_1.blend')

# Flame-holding pose of the left paw (palm up at chest height, in front of the shoulder). The runtime
# flame sits on ATT_HAND_L (child of PAW_L), so it follows this paw in every clip.
HOLD = {'armL_up': 74.0, 'armL_x': 40.0, 'pawL_x': -40.0}


def run_clip(name, N, pose_fn, face_fn, rz=None, sq=None, cyclic=False):
    G.O_, G.R_ = O_, R_
    return G.run_clip(name, N, pose_fn, face_fn, rz, sq, cyclic)


def ease(x):
    x = min(1.0, max(0.0, x))
    return x * x * (3 - 2 * x)


def sa_pose(f):
    """streak_active pose at loop frame f (1..97). Also the start pose of streak_cheer / streak_lost."""
    L = 96
    def per(p, ph=0.0):
        return math.sin(2 * math.pi * (f - 1) / p + ph)
    breath, shift, bob = per(L / 3), per(L), per(L / 6, 0.6)
    P = {'squash': 0.010 * breath + 0.003 * bob, 'spine_x': -2.0 + 0.6 * breath, 'hips_y': 1.6 * shift, 'spine_y': -0.8 * shift,
         'head_x': -1.5 - 0.6 * breath, 'head_y': -1.0 * shift, 'head_z': 2.5 + 1.5 * per(L / 2, 1.2),
         'armL_up': HOLD['armL_up'] + 2.5 * breath + 1.5 * per(L / 2, 0.5), 'armL_x': HOLD['armL_x'] + 2.0 * per(L / 2, 1.4),
         'pawL_x': HOLD['pawL_x'] + 3.0 * breath, 'pawL_y': 2.0 * per(L, 0.9),
         'armR_up': 6 + 1.5 * breath, 'armR_x': 3,
         'earL_fwd': 5 + 1.5 * per(L / 2, 0.4), 'earR_fwd': 5 + 1.5 * per(L / 2, 0.9),
         'earL_out': 1.5 * per(L, 0.3) + 1, 'earR_out': -1.5 * per(L, 0.3) + 1,
         'tail_lift': 7 + 1.5 * per(L / 2), 'flap_out': 1.5 + 0.8 * (1 + breath)}
    for t in range(4):
        P[f'tail_sway{t}'] = clamp(9 * per(L / 2, -0.7 * t) * (1 + 0.15 * t) + 4 * per(L / 4, -0.9 * t), -20, 20)
    return P


def blend(P0, P1, w):
    keys = set(P0) | set(P1)
    return {k: (1 - w) * P0.get(k, 0.0) + w * P1.get(k, 0.0) for k in keys}


# =========================================================================== QUEST
def quest_start():
    """Curiosity → confidence. A quest symbol pops up at the fox's upper right; the fox notices it,
    tilts its head and leans in (curious), then straightens up proudly and POINTS at it with the right
    paw ("that one — let's go!"); the symbol flares and flies off along the pointing line; a confident
    nod, settle."""
    N = 68
    rz = T([(1, 0), (24, 0), (27, 0.022), (30, 0), (68, 0)])
    sq = T([(1, 0), (6, -0.015), (12, 0.02), (20, 0.025), (24, 0.04), (26, -0.03), (28, -0.01), (30, 0.03), (33, 0), (68, 0)])
    curious = T([(1, 0), (5, 0), (11, 1), (21, 1), (25, 0), (68, 0)])
    point = T([(1, 0), (25, 0), (31, 1), (46, 1), (55, 0), (68, 0)])
    nod = T([(1, 0), (46, 0), (49, 6), (52, -2), (55, 0), (68, 0)])
    hip = T([(1, 0), (26, 0), (32, 1), (50, 1), (58, 0), (68, 0)])
    wide = T([(1, 0), (4, 0), (7, 0.8), (13, 0.6), (18, 0), (68, 0)])
    proud = T([(1, 0), (22, 0), (27, 1), (52, 1), (58, 0), (68, 0)])
    smile = T([(1, 0), (50, 0), (54, 0.9), (63, 0), (68, 0)])
    perk = T([(1, 0), (5, 0), (8, 11), (22, 10), (30, 8), (54, 6), (64, 0), (68, 0)])
    wagamp = T([(1, 0), (24, 3), (30, 12), (54, 12), (64, 0), (68, 0)])

    def pose(f, rzv, sqv, e, tl):
        c, p, h = curious(f), point(f), hip(f)
        P = {'root_z': rzv, 'squash': sqv,
             # curiosity: look up-right at the symbol (fox's right = −head_z), tilt, lean in
             'head_x': -9 * c - 4 * p + nod(f), 'head_z': -14 * c - 5 * p, 'head_y': 3 * c,
             'spine_x': 4 * c - 3 * p, 'hips_y': 1.5 * c, 'spine_y': -2 * c - 2 * p,
             # pointing: right arm forward-up, straight paw; left paw on the hip
             'armR_up': 14 * c + 94 * p, 'armR_x': 10 * c + 22 * p, 'pawR_x': -6 * c + 6 * p, 'pawR_y': -8 * p,
             'armL_up': 22 * h, 'armL_x': 4 * c - 14 * h, 'pawL_x': 30 * h,
             'tail_lift': clamp(3 * c + 9 * proud(f) + 0.5 * tl, 0, 10), 'flap_out': 2 * proud(f) + 25 * max(0.0, -sqv)}
        P.update(ears_of(e, perk(f), 0, -2.5 * c))
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, wagamp(f), 12, t)
        return P
    m = run_clip('quest_start', N, pose, lambda f: face_of(surprised=wide(f), proud=proud(f), smile=smile(f),
                                                          blink_extra=blink_curve(f, [16, 40])), rz, sq)
    m['cues'] = [{'t': fr(4), 'fx': 'quest.symbol', 'follow': [[fr(4), 'appear'], [fr(31), 'activate'], [fr(40), 'fly']], 'until': fr(50)},
                 {'t': fr(31), 'fx': 'energy.accent', 'at': 'hand_r', 'count': 10},
                 {'t': fr(32), 'fx': 'sparkle', 'at': 'quest_symbol', 'count': 10}]
    return m


def quest_complete():
    """Anticipation (realise → deep crouch, arms back), a celebratory jump with a hang at the apex
    (both arms up; confetti, stars and a radial burst exactly at the apex), a soft landing that rolls
    through the squash, a happy bounce and sway, settle."""
    N = 84
    rz = T([(1, 0), (14, 0), (18, 0.088), (20, 0.112), (22, 0.118), (24, 0.11), (28, 0), (36, 0), (39, 0.026), (42, 0), (84, 0)])
    # squash kept small while the arms are up (glTF fidelity); the landing is soft: 4-frame roll-through
    sq = T([(1, 0), (3, -0.02), (7, 0.03), (13, 0.085), (15, -0.07), (18, -0.03), (22, -0.012), (27, -0.01), (28, 0.035), (30, 0.045),
            (32, 0.018), (34, -0.012), (36, 0.02), (39, -0.008), (42, 0.02), (45, 0), (84, 0)])
    arms = T([(1, 0), (4, 12), (8, -4), (13, -18), (17, 96), (24, 98), (28, 82), (31, 72), (35, 70), (39, 92), (44, 84), (52, 60), (66, 18), (76, 0), (84, 0)])
    armx = T([(1, 0), (13, -12), (17, 12), (28, 12), (44, 10), (60, 6), (76, 0), (84, 0)])
    head_x = T([(1, 0), (3, -6), (8, 2), (13, 9), (17, -9), (22, -11), (28, 3), (31, 0), (39, -6), (44, 1), (60, -2), (76, 0), (84, 0)])
    sway = T([(1, 0), (44, 0), (49, 1), (55, -1), (61, 0.8), (67, -0.4), (72, 0), (84, 0)])
    leg = T([(1, 0), (14, 0), (18, 9), (24, 9), (28, 0), (37, 0), (39, 4), (42, 0), (84, 0)])
    wide = T([(1, 0), (2, 1), (7, 1), (10, 0), (84, 0)])
    excited = T([(1, 0), (8, 0), (12, 1), (44, 1), (49, 0), (84, 0)])
    happy = T([(1, 0), (44, 0), (49, 1), (70, 1), (75, 0), (84, 0)])
    smile = T([(1, 0), (70, 0), (74, 1), (80, 0), (84, 0)])
    wagamp = T([(1, 0), (12, 6), (17, 20), (70, 20), (78, 0), (84, 0)])

    def pose(f, rzv, sqv, e, tl):
        joy = max(excited(f), happy(f))
        P = {'root_z': rzv, 'squash': sqv, 'armL_up': arms(f), 'armR_up': arms(f), 'armL_x': armx(f), 'armR_x': armx(f),
             'pawL_x': -0.3 * max(0.0, arms(f)), 'pawR_x': -0.3 * max(0.0, arms(f)), 'head_x': head_x(f), 'head_y': 4.5 * sway(f), 'head_z': 3 * sway(f),
             'hips_y': -3.5 * sway(f), 'spine_y': 1.5 * sway(f), 'spine_x': 3 * ease((f - 6) / 7) * (f < 15), 'leg_x': leg(f), 'foot_x': -0.6 * leg(f),
             'tail_lift': clamp(9 * joy + 0.5 * tl, 0, 10), 'flap_out': 3 * joy + 30 * max(0.0, -sqv)}
        P.update(ears_of(clamp(e, -8, 12), 6 * joy + 6 * wide(f), 2 * joy, 2 * sway(f)))
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, wagamp(f), 8, t)
        return P
    m = run_clip('quest_complete', N, pose, lambda f: face_of(surprised=wide(f), excited=excited(f), happy=happy(f), smile=smile(f)), rz, sq)
    apex = fr(22)
    m['cues'] = [{'t': apex, 'fx': 'burst.radial', 'at': 'chest', 'duration': 0.7},
                 {'t': apex, 'fx': 'burst.star_ring', 'duration': 0.9},
                 {'t': apex, 'fx': 'confetti', 'count': 60, 'duration': 2.4},
                 {'t': fr(39), 'fx': 'sparkle', 'at': 'head', 'count': 12}]
    return m


def quest_failed():
    """Disappointed, never humiliated: a small "huh?", the droop (head lowers, ears and tail droop
    naturally, shoulders slump) with a tiny grey cloud that fades on its own and a sigh; then the fox
    lifts its head, looks at the user with a soft supportive smile and an encouraging little fist
    ("next time!"), settle."""
    N = 92
    sq = T([(1, 0), (3, -0.015), (7, 0), (14, 0.012), (22, 0.02), (34, 0.018), (38, -0.01), (42, 0.02), (56, 0.018), (62, -0.012),
            (66, -0.006), (72, 0.008), (78, 0), (92, 0)])
    droop = T([(1, 0), (8, 0), (20, 1), (54, 1), (66, 0.1), (74, 0), (92, 0)])
    huh = T([(1, 0), (3, 1), (8, 1), (11, 0), (92, 0)])
    look_paw = T([(1, 0), (16, 0), (24, 1), (36, 1), (46, 0.4), (54, 0), (92, 0)])
    lift = T([(1, 0), (54, 0), (62, 1), (82, 1), (88, 0), (92, 0)])
    fist = T([(1, 0), (62, 0), (68, 1), (78, 1), (86, 0), (92, 0)])
    nod = T([(1, 0), (68, 0), (71, 5), (74, -2), (77, 0), (92, 0)])
    sad = T([(1, 0), (8, 0), (18, 1), (56, 1), (62, 0), (92, 0)])
    smile = T([(1, 0), (58, 0), (64, 0.9), (82, 0.9), (88, 0), (92, 0)])
    proud = T([(1, 0), (64, 0), (69, 0.35), (80, 0.35), (86, 0), (92, 0)])
    tail_env = T([(1, 0), (6, 1), (84, 1), (92, 0)])

    def pose(f, rzv, sqv, e, tl):
        d, lp, li, fs = droop(f), look_paw(f), lift(f), fist(f)
        P = {'squash': sqv, 'head_x': -5 * huh(f) + 10 * d + 3 * lp - 3 * li + nod(f), 'head_z': 6 * lp, 'head_y': 2 * lp * d - 3 * li,
             'spine_x': 5 * d - 1.5 * li, 'hips_x': -1.5 * d, 'armL_x': 10 * d, 'armR_x': 10 * d + 34 * fs, 'armL_up': 2 * d, 'armR_up': 2 * d + 26 * fs,
             'pawL_x': 8 * d, 'pawR_x': 8 * d - 42 * fs, 'tail_lift': clamp(4 * li + 2 * huh(f), 0, 10),
             'earL_out': clamp(11 * d + 2 * huh(f) - 1 * li, -6, 11), 'earR_out': clamp(11 * d + 2 * huh(f) - 1 * li, -6, 11),
             'earL_fwd': clamp(-3 * d + 8 * huh(f) + 6 * li, -3, 12), 'earR_fwd': clamp(-3 * d + 8 * huh(f) + 6 * li, -3, 12),
             'flap_out': 1.5 * li}
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, (5 * (1 - d) + 5 * li) * tail_env(f), 22 if li > 0.2 else 30, t)
        return P
    m = run_clip('quest_failed', N, pose, lambda f: face_of(surprised=0.7 * huh(f), sad=sad(f), smile=smile(f), proud=proud(f),
                                                           blink_extra=blink_curve(f, [36, 58], close=3, hold=2, open_=4)), None, sq)
    m['cues'] = [{'t': fr(14), 'fx': 'cloud.small', 'at': 'head', 'until': fr(48)},
                 {'t': fr(37), 'fx': 'puff.sigh', 'at': 'mouth'},
                 {'t': fr(68), 'fx': 'sparkle.soft', 'at': 'hand_r', 'count': 6}]
    return m


# =========================================================================== REWARDS
def receive_xp():
    """XP orbs swoop in along curved paths from the fox's upper left; the fox spots them and follows
    the stream with its eyes and head (yaw / pitch synchronised with the orb timeline), opens its
    paws, the energy converges on the chest — an absorption pulse (squash, eyes shut) — then the tail
    reacts a beat later with an excited wag, a little hop and a pat on the chest, settle."""
    N = 66
    rz = T([(1, 0), (33, 0), (36, 0.03), (40, 0), (66, 0)])
    sq = T([(1, 0), (4, -0.015), (12, 0), (24, 0.01), (27, 0.055), (29, -0.02), (31, 0.0), (33, 0.03), (35, -0.03), (37, -0.01), (40, 0.045),
            (43, -0.008), (46, 0), (66, 0)])
    # head follows the orb stream: orbs start upper-left (fox's left = +head_z, up = −head_x), arc in, end at the chest
    yaw = T([(1, 0), (3, 4), (7, 18), (12, 20), (17, 14), (21, 6), (26, 0), (66, 0)])
    pitch = T([(1, 0), (3, -3), (7, -11), (12, -12), (17, -6), (21, 3), (25, 9), (28, 5), (34, -2), (44, 0), (66, 0)])
    open_ = T([(1, 0), (6, 0), (13, 1), (25, 1), (28, 0.3), (32, 0), (66, 0)])
    pat = T([(1, 0), (40, 0), (45, 1), (54, 1), (60, 0), (66, 0)])
    tap = T([(1, 0), (46, 0), (48, 1), (50, 0), (52, 1), (54, 0), (66, 0)])
    wide = T([(1, 0), (3, 0.8), (10, 0.6), (16, 0), (66, 0)])
    absorb = T([(1, 0), (25, 0), (27, 1), (31, 1), (34, 0), (66, 0)])          # eyes shut on the pulse
    happy = T([(1, 0), (14, 0), (19, 0.6), (26, 0.6), (31, 1), (46, 1), (50, 0), (66, 0)])
    smile = T([(1, 0), (46, 0), (50, 1), (60, 1), (64, 0), (66, 0)])
    perk = T([(1, 0), (3, 10), (16, 8), (26, 4), (34, 9), (56, 3), (64, 0), (66, 0)])
    wagamp = T([(1, 0), (31, 0), (34, 8), (37, 20), (54, 18), (62, 0), (66, 0)])   # delayed tail excitement
    tailup = T([(1, 0), (30, 0), (35, 10), (56, 9), (64, 0), (66, 0)])

    def pose(f, rzv, sqv, e, tl):
        o, p = open_(f), pat(f)
        P = {'root_z': rzv, 'squash': sqv, 'head_x': pitch(f) + 2 * p, 'head_z': yaw(f), 'head_y': 0.25 * yaw(f),
             'spine_y': 0.12 * yaw(f), 'spine_x': -2 * o + 2 * absorb(f),
             'armL_up': 34 * o + 10 * p, 'armR_up': 34 * o + 10 * p, 'armL_x': 32 * o + 36 * p + 4 * tap(f), 'armR_x': 32 * o + 30 * p,
             'pawL_x': -16 * o - 22 * p, 'pawR_x': -16 * o - 18 * p,
             'tail_lift': clamp(tailup(f) + 0.5 * tl, 0, 10), 'flap_out': 2 * happy(f) + 25 * max(0.0, -sqv)}
        P.update(ears_of(clamp(e, -8, 12), perk(f)))
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, wagamp(f), 7, t)
        return P
    m = run_clip('receive_xp', N, pose, lambda f: face_of(surprised=wide(f), happy=max(happy(f), absorb(f)), smile=smile(f)), rz, sq)
    m['cues'] = [{'t': fr(2), 'fx': 'xp.stream', 'count': 9, 'travel': 0.95, 'stagger': 0.32, 'to': 'chest', 'from': 'upper_left'},
                 {'t': fr(26), 'fx': 'pulse.absorb', 'at': 'chest', 'duration': 0.55},
                 {'t': fr(28), 'fx': 'text.plus_xp', 'duration': 1.3},
                 {'t': fr(36), 'fx': 'sparkle', 'at': 'tail', 'count': 8}]
    return m


def level_up():
    """More dramatic: a long charge (deep crouch, fists, trembling that grows, energy ring spinning
    faster at the feet), a held breath of stillness, then launch — light ribbons rise, a 360° spin in
    the air only, the climax burst at the apex (the runtime applies the new level there; the clip
    itself never scales the fox), a natural landing that rolls through the squash, recovery, and the
    victory pose (hands on hips, chest out)."""
    N = 116
    # the spin happens on the way up (f31–40), so the climax at the apex (f41) faces the user
    take_off, land, apex = 30, 52, 41
    rz = T([(1, 0), (take_off, 0), (35, 0.09), (apex, 0.14), (47, 0.09), (land, 0), (70, 0), (73, 0.02), (76, 0), (116, 0)])
    yaw = T([(1, 0), (take_off + 1, 0), (apex - 1, 360), (116, 360)])
    # crouch squash kept ≤ 0.075 while the neck pitches down (glTF has no shear: ear tips drift otherwise)
    sq = T([(1, 0), (6, 0.025), (16, 0.055), (24, 0.07), (28, 0.075), (30, -0.09), (34, -0.04), (48, -0.02), (52, 0.08), (54, 0.06), (56, 0.0),
            (58, -0.02), (61, 0.015), (64, 0), (71, 0.02), (73, -0.01), (76, 0.01), (79, 0), (116, 0)])
    charge = T([(1, 0), (6, 0.3), (24, 1), (29, 1), (30, 0), (116, 0)])
    still = T([(1, 0), (22, 0), (24, 1), (29, 1), (30, 0), (116, 0)])          # the held breath before the launch
    arms = T([(1, 0), (10, 6), (24, 10), (29, 10), (33, 70), (38, 92), (apex, 104), (46, 96), (52, 50), (56, 36), (62, 62), (66, 30), (76, 24), (102, 22), (110, 0), (116, 0)])
    armx = T([(1, 0), (10, 28), (29, 30), (33, 10), (46, 10), (52, 20), (58, 10), (66, -8), (102, -8), (110, 0), (116, 0)])
    paw = T([(1, 0), (10, -32), (29, -36), (33, -10), (52, -6), (62, -10), (68, 28), (102, 28), (110, 0), (116, 0)])   # fists → hands on hips
    head_x = T([(1, 0), (10, 6), (24, 7), (29, 7), (33, -6), (apex, -10), (47, -4), (50, 2), (53, 6), (57, -2), (62, -5), (68, 2), (74, -4), (102, -3), (110, 0), (116, 0)])
    lean = T([(1, 0), (12, 3), (29, 3), (34, -2), (53, 3), (58, -1), (68, -4), (102, -3), (110, 0), (116, 0)])
    leg = T([(1, 0), (take_off, 0), (36, 11), (48, 6), (land, 0), (116, 0)])
    proud_ = T([(1, 0), (2, 0), (10, 0.8), (29, 0.8), (31, 0), (64, 0), (70, 1), (104, 1), (110, 0), (116, 0)])
    excited = T([(1, 0), (29, 0), (32, 1), (60, 1), (66, 0), (116, 0)])
    perk = T([(1, 0), (10, -3), (29, -3), (32, 11), (64, 9), (104, 0), (116, 0)])
    earout = T([(1, 0), (8, 4), (29, 6), (31, 0), (116, 0)])
    wagamp = T([(1, 0), (56, 0), (64, 18), (100, 16), (110, 0), (116, 0)])

    def pose(f, rzv, sqv, e, tl):
        c, s = charge(f), still(f)
        tremble = 0.007 * math.sin(f * 2.7) * c * (1 - 0.8 * s) * min(1.0, f / 18)   # grows, then freezes in the held breath
        P = {'root_z': rzv, 'root_yaw': yaw(f), 'squash': sqv + tremble, 'armL_up': arms(f), 'armR_up': arms(f), 'armL_x': armx(f), 'armR_x': armx(f),
             'pawL_x': paw(f), 'pawR_x': paw(f), 'head_x': head_x(f) + 40 * tremble, 'spine_x': lean(f), 'leg_x': leg(f), 'foot_x': -0.6 * leg(f),
             'tail_lift': clamp(10 * max(proud_(f) * (f > land), excited(f)) + 0.4 * tl, 0, 10), 'flap_out': 4 * excited(f) + 30 * max(0.0, -sqv)}
        P.update(ears_of(clamp(e, -8, 12), perk(f), earout(f)))
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, wagamp(f), 10, t) + clamp(60 * tremble, -2, 2)
        return P
    m = run_clip('level_up', N, pose, lambda f: face_of(proud=proud_(f), excited=excited(f), blink_extra=blink_curve(f, [88])), rz, sq)
    m['cues'] = [{'t': fr(1), 'fx': 'ring.energy', 'at': 'feet', 'until': fr(31)},
                 {'t': fr(4), 'fx': 'aura.charge', 'until': fr(29)},
                 {'t': fr(30), 'fx': 'ribbons.rise', 'duration': 1.2},
                 {'t': fr(apex), 'fx': 'flash.climax', 'at': 'chest', 'duration': 0.6},
                 {'t': fr(apex), 'fx': 'level.apply'},
                 {'t': fr(apex), 'fx': 'text.level_up', 'duration': 2.0},
                 {'t': fr(land), 'fx': 'ring.shockwave', 'duration': 0.7},
                 {'t': fr(64), 'fx': 'sparkle', 'at': 'head', 'count': 14}]
    return m


def achievement_unlock():
    """A badge materialises in front of the fox (sparks converge, it pops in with a glint). The fox
    notices it (pulls back, eyes wide, ears up), leans in, reaches and takes it, then PRESENTS it to
    the user at face height (proud) while a focused shine sweeps across it, hugs it happily, and the
    badge dissolves into sparkles. No jump: distinct from quest_complete."""
    N = 96
    rz = T([(1, 0), (52, 0), (55, 0.018), (58, 0), (96, 0)])
    sq = T([(1, 0), (6, 0), (9, -0.03), (14, 0.01), (22, 0.02), (32, 0.03), (35, -0.01), (40, 0), (50, 0.02), (53, -0.02), (55, -0.006), (58, 0.025),
            (61, 0), (68, 0.012), (78, 0.012), (84, 0), (96, 0)])
    notice = T([(1, 0), (6, 0), (9, 1), (14, 1), (18, 0), (96, 0)])
    lean = T([(1, 0), (14, 0), (22, 1), (32, 1), (36, 0), (96, 0)])
    reach = T([(1, 0), (20, 0), (30, 1), (33, 1), (38, 0), (96, 0)])
    hold = T([(1, 0), (32, 0), (37, 1), (42, 1), (44, 0), (96, 0)])              # brings it to the chest
    present = T([(1, 0), (41, 0), (48, 1), (64, 1), (69, 0), (96, 0)])
    hug = T([(1, 0), (66, 0), (71, 1), (80, 1), (86, 0), (96, 0)])
    sway = T([(1, 0), (70, 0), (73, 1), (77, -1), (81, 0.6), (85, 0), (96, 0)])
    wide = T([(1, 0), (7, 1), (20, 1), (26, 0), (96, 0)])
    curious = T([(1, 0), (16, 0), (22, 0.4), (30, 0.4), (34, 0), (96, 0)])
    proud_ = T([(1, 0), (36, 0), (44, 1), (68, 1), (72, 0), (96, 0)])
    happy = T([(1, 0), (68, 0), (72, 1), (82, 1), (88, 0), (96, 0)])
    perk = T([(1, 0), (7, 12), (24, 10), (44, 9), (66, 6), (88, 2), (94, 0), (96, 0)])

    def pose(f, rzv, sqv, e, tl):
        n, ln, rc, hd, pr, hg = notice(f), lean(f), reach(f), hold(f), present(f), hug(f)
        arm_up = 10 * n + 18 * rc + 14 * hd + 30 * pr + 12 * hg
        arm_x = -6 * n + 62 * rc + 40 * hd + 66 * pr + 44 * hg
        P = {'root_z': rzv, 'squash': sqv, 'head_x': -6 * n + 8 * ln + 6 * hd - 4 * pr + 7 * hg, 'head_y': 4 * curious(f) + 3 * sway(f) + 2 * pr,
             'head_z': 3 * sway(f), 'spine_x': -4 * n + 5 * ln - 3 * pr + 3 * hg, 'hips_y': -2.5 * sway(f),
             'armL_up': arm_up, 'armR_up': arm_up, 'armL_x': arm_x, 'armR_x': arm_x,
             'pawL_x': -18 * rc - 20 * hd - 30 * pr - 26 * hg, 'pawR_x': -18 * rc - 20 * hd - 30 * pr - 26 * hg,
             'pawL_y': 12 * (rc + pr), 'pawR_y': -12 * (rc + pr),
             'tail_lift': clamp(9 * max(proud_(f), happy(f)) + 0.5 * tl, 0, 10), 'flap_out': 3 * proud_(f) + 25 * max(0.0, -sqv)}
        P.update(ears_of(clamp(e, -8, 12), perk(f)))
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, 15 * max(proud_(f), happy(f)) + 5 * wide(f), 9, t)
        return P
    m = run_clip('achievement_unlock', N, pose, lambda f: face_of(surprised=wide(f), proud=proud_(f), happy=happy(f),
                                                                 blink_extra=blink_curve(f, [58])), rz, sq)
    m['cues'] = [{'t': fr(1), 'fx': 'badge', 'follow': [[fr(1), 'materialize'], [fr(31), 'paws'], [fr(42), 'present'], [fr(66), 'chest'], [fr(84), 'dissolve']],
                  'until': fr(92)},
                 {'t': fr(50), 'fx': 'badge.shine', 'duration': 0.7},
                 {'t': fr(52), 'fx': 'burst.stars', 'at': 'badge', 'count': 10, 'duration': 1.0},
                 {'t': fr(84), 'fx': 'sparkle', 'at': 'badge', 'count': 14}]
    return m


# =========================================================================== STREAK
def streak_active():
    """Base loop while a streak is alive (4 s, seamless). The fox HOLDS the flame on its raised left
    paw (palm up) — proud and warm: chest out, lively breath, slow weight shift, the flame paw bobbing
    gently, tail high. Owns neither the head nor the face (look-at, petting and moods keep working)."""
    N = 97
    m = run_clip('streak_active', N, lambda f, rzv, sqv, e, tl: sa_pose(f),
                 lambda f: face_of(blink_extra=blink_curve(f, [22, 63, 68])), cyclic=True)
    m['cues'] = [{'t': 0.0, 'fx': 'flame.loop', 'note': 'persistent runtime flame (setStreak) attached to ATT_HAND_L'}]
    return m


def streak_cheer():
    """Milestone celebration with the flame: tuck the flame in (anticipation), thrust it forward to the
    user (the flame grows — same flame, no duplicate), two right-paw fist pumps on the beat with
    little hops, a big hop at the apex (tier ring), proud pose, then the flame paw comes back to the
    holding pose as the flame settles to its tier size. Starts and ends on the streak_active pose."""
    N = 86
    rz = T([(1, 0), (20, 0), (23, 0.03), (26, 0), (28, 0), (31, 0.03), (34, 0), (36, 0), (41, 0.062), (46, 0), (86, 0)])
    sq = T([(1, 0), (5, 0.04), (8, 0.06), (11, -0.04), (14, 0.0), (19, 0.02), (21, -0.03), (24, 0.0), (26, 0.04), (29, -0.03), (32, 0.0), (34, 0.04),
            (36, 0.05), (38, -0.05), (42, -0.015), (46, 0.06), (49, -0.01), (52, 0), (86, 0)])
    w_in = T([(1, 0), (3, 1), (86, 1)])                                      # leave the streak_active pose
    w_out = T([(1, 0), (68, 0), (84, 1), (86, 1)])                           # back to it
    torch = T([(1, 0), (6, -0.4), (9, -0.5), (13, 1), (44, 1), (52, 0.75), (66, 0.6), (84, 0), (86, 0)])   # flame paw up high
    pumpR = T([(1, 0), (14, 0), (19, 1), (23, 0.25), (27, 1), (31, 0.25), (36, 0.4), (40, 1), (50, 0.9), (60, 0.2), (72, 0), (86, 0)])
    head_x = T([(1, 0), (6, 6), (12, -7), (19, -3), (23, 2), (27, -4), (31, 2), (37, 4), (41, -9), (47, 2), (52, -4), (70, -2), (84, 0), (86, 0)])
    head_z = T([(1, 0), (9, 0), (13, 8), (24, 4), (44, 3), (60, 2), (84, 0), (86, 0)])   # glances at the flame, then at the user
    leg = T([(1, 0), (37, 0), (41, 6), (45, 0), (86, 0)])
    excited = T([(1, 0), (5, 0), (10, 1), (48, 1), (53, 0), (86, 0)])
    proud = T([(1, 0), (48, 0), (53, 1), (72, 1), (80, 0), (86, 0)])
    wagamp = T([(1, 0), (8, 8), (12, 20), (68, 20), (80, 6), (86, 0)])

    def pose(f, rzv, sqv, e, tl):
        joy = max(excited(f), proud(f))
        tc, pr = torch(f), pumpR(f)
        act = {'root_z': rzv, 'squash': sqv,
               # the flame paw is thrust forward to the user ("look at my streak!") — clear of the face in every view
               'armL_up': HOLD['armL_up'] - 10 * tc, 'armL_x': HOLD['armL_x'] + 30 * tc, 'pawL_x': HOLD['pawL_x'] + 18 * max(0.0, tc),
               'armR_up': 6 + 100 * pr, 'armR_x': 3 + 18 * pr, 'pawR_x': -32 * pr,
               'head_x': head_x(f), 'head_z': head_z(f), 'head_y': 3 * max(0.0, tc), 'spine_x': -2 - 2 * joy, 'spine_y': -1.5 * max(0.0, tc),
               'leg_x': leg(f), 'foot_x': -0.6 * leg(f), 'tail_lift': clamp(9 * joy + 0.5 * tl, 0, 10), 'flap_out': 3 * joy + 30 * max(0.0, -sqv)}
        act.update(ears_of(clamp(e, -8, 12), 7 * joy))
        for t in range(4):
            act[f'tail_sway{t}'] = wag(f, wagamp(f), 8, t)
        P = blend(sa_pose(1), act, w_in(f))
        return blend(P, sa_pose(1), w_out(f))
    m = run_clip('streak_cheer', N, pose, lambda f: face_of(excited=excited(f), proud=proud(f), blink_extra=blink_curve(f, [60])), rz, sq)
    m['cues'] = [{'t': fr(12), 'fx': 'flame.flare', 'duration': 2.4, 'scale': 1.7},
                 {'t': fr(41), 'fx': 'ring.tier', 'duration': 0.8},
                 {'t': fr(41), 'fx': 'sparkle', 'at': 'flame', 'count': 14}]
    m['start_pose'] = m['end_pose'] = 'streak_active'
    return m


def streak_lost():
    """The ten beats of the brief, cartoon only:
    1 flame sputters irregularly · 2 the fox notices (looks at the paw, worried) · 3 a storm cloud
    forms above · 4 looks up, ears tense · 5 a stylised lightning bolt strikes the flame · 6 jolt: eyes
    wide, body compresses · 7 the flame goes out at once · 8 a brief puff of soot and smoke · 9 the fox
    looks at its empty paw · 10 disappointed, then a slow recovery to neutral.
    Starts on the streak_active pose (flame in the paw), ends on the rest pose (streak over)."""
    N = 124
    strike = 37
    w_in = T([(1, 0), (3, 1), (124, 1)])
    w_end = T([(1, 0), (112, 0), (124, 1)])
    hold_arm = T([(1, 1), (strike, 1), (strike + 2, 0.9), (52, 0.95), (64, 0.8), (76, 0.25), (88, 0), (124, 0)])    # flame paw stays up, then lowers
    notice = T([(1, 0), (5, 0), (10, 1), (18, 1), (22, 0), (124, 0)])
    up = T([(1, 0), (19, 0), (25, 0.8), (strike, 0.8), (strike + 1, 0.25), (46, 0), (124, 0)])
    tense = T([(1, 0), (20, 0), (24, 1), (strike, 1), (strike + 2, 0), (124, 0)])
    jolt = T([(1, 0), (strike - 1, 0), (strike, 1), (42, 0.85), (47, 0.2), (50, 0), (124, 0)])
    look_paw = T([(1, 0), (48, 0), (55, 1), (70, 1), (76, 0.3), (82, 0), (124, 0)])
    slump = T([(1, 0), (66, 0), (76, 1), (96, 1), (106, 0.2), (112, 0), (124, 0)])
    recover = T([(1, 0), (98, 0), (104, 1), (112, 1), (118, 0), (124, 0)])
    nod = T([(1, 0), (104, 0), (107, 5), (110, -2), (113, 0), (124, 0)])
    worry = T([(1, 0), (6, 0), (11, 0.6), (strike, 0.7), (strike + 1, 0), (124, 0)])
    wide = T([(1, 0), (strike - 1, 0), (strike, 1), (48, 1), (52, 0), (124, 0)])
    sad = T([(1, 0), (56, 0), (64, 0.7), (72, 1), (100, 1), (106, 0), (124, 0)])
    proud = T([(1, 0), (102, 0), (106, 0.45), (114, 0.45), (120, 0), (124, 0)])
    base_sq = T([(1, 0), (strike - 1, 0), (strike, 0.08), (39, 0.05), (42, 0.06), (46, 0.02), (50, 0), (76, 0.025), (96, 0.025), (104, -0.01), (110, 0), (124, 0)])
    tail_up = T([(1, 0), (24, 4), (strike, 6), (124, 0)])

    def pose(f, rzv, sqv, e, tl):
        j, n, u, ts, lp, s, rc = jolt(f), notice(f), up(f), tense(f), look_paw(f), slump(f), recover(f)
        buzz = (1 if f % 2 else -1) * j * (1 if strike <= f <= strike + 9 else 0)       # electrified shiver, decays
        h = hold_arm(f)
        act = {'squash': base_sq(f) + 0.02 * buzz,
               # notice: look down-left at the flame paw; up: look at the cloud; then at the empty paw
               'head_x': 6 * n - 12 * u + 7 * lp * (1 - 0.5 * s) + 9 * s - 3 * worry(f) - 2 * rc + nod(f), 'head_z': 12 * n + 9 * u + 14 * lp + 3 * buzz,
               'head_y': 4 * n + 3 * buzz + 4 * lp,
               'spine_x': 2 * n - 3 * u + 4 * s + 2 * lp, 'hips_x': -1.5 * s, 'spine_y': -1.5 * n,
               'armL_up': HOLD['armL_up'] * h + 14 * j + 2 * s, 'armL_x': HOLD['armL_x'] * h + 8 * lp * h + 8 * s, 'pawL_x': HOLD['pawL_x'] * h + 12 * j + 8 * s,
               'pawL_y': 2 * (1 - h),
               'armR_up': 6 * (1 - s) + 34 * j + 2 * s, 'armR_x': 3 * (1 - s) - 6 * j + 8 * s + 4 * ts, 'pawR_x': 24 * j + 8 * s,
               'earL_fwd': clamp(5 * n + 12 * j - 3 * ts - 3 * s + 6 * rc, -3, 12), 'earR_fwd': clamp(5 * n + 12 * j - 3 * ts - 3 * s + 6 * rc, -3, 12),
               'earL_out': clamp(8 * ts - 5 * j + 11 * s + 2 * buzz, -6, 11), 'earR_out': clamp(8 * ts - 5 * j + 11 * s - 2 * buzz, -6, 11),
               'tail_lift': clamp(tail_up(f) * (1 - s) + 10 * j, 0, 10), 'flap_out': 4 * j}
        for t in range(4):
            act[f'tail_sway{t}'] = clamp(2 * buzz * (t + 1) + (1 - s) * (1 - j) * 6 * math.sin(2 * math.pi * f / 28 - 0.8 * t) * (f < 30), -20, 20)
        return blend(blend(sa_pose(1), act, w_in(f)), {}, w_end(f))      # last frames: exact rest pose (streak over)
    m = run_clip('streak_lost', N, pose, lambda f: face_of(sad=max(sad(f), worry(f)), surprised=wide(f), proud=proud(f),
                                                          blink_extra=blink_curve(f, [60, 88])), None, None)
    m['cues'] = [{'t': fr(1), 'fx': 'flame.sputter', 'until': fr(strike)},
                 {'t': fr(16), 'fx': 'cloud.storm', 'at': 'flame', 'until': fr(60)},
                 {'t': fr(strike), 'fx': 'lightning.strike', 'target': 'flame', 'duration': 0.4},
                 {'t': fr(strike), 'fx': 'flame.snuff'},
                 {'t': fr(strike + 1), 'fx': 'char.on', 'fade': 0.08, 'strength': 0.32},
                 {'t': fr(strike + 1), 'fx': 'soot.burst', 'at': 'flame', 'count': 14},
                 {'t': fr(strike + 2), 'fx': 'smoke', 'at': 'flame', 'count': 7, 'duration': 1.4},
                 {'t': fr(56), 'fx': 'char.off', 'fade': 0.6},
                 {'t': fr(82), 'fx': 'puff.sigh', 'at': 'mouth'},
                 {'t': fr(N), 'fx': 'streak.end', 'note': 'runtime marks the streak inactive (flame stays out)'}]
    m['start_pose'] = 'streak_active'
    return m


CATEGORIES = G.CATEGORIES
BUILDERS = {'quest_start': quest_start, 'quest_complete': quest_complete, 'quest_failed': quest_failed, 'receive_xp': receive_xp,
            'level_up': level_up, 'achievement_unlock': achievement_unlock, 'streak_active': streak_active, 'streak_lost': streak_lost,
            'streak_cheer': streak_cheer}
ROLES = G.ROLES
LARGE_MOTION = G.LARGE_MOTION


def main():
    global O_, R_
    only = [s for s in os.environ.get('FOX_CLIPS', '').split(',') if s]
    bpy.ops.wm.open_mainfile(filepath=A.SRC)
    O_ = bpy.data.objects
    R_ = A.Rig(O_['FOX_RIG'])
    clips = {}
    for cat, names in CATEGORIES.items():
        for n in names:
            if only and n not in only:
                continue
            m = BUILDERS[n]()
            role, hc, fc = ROLES.get(n, ('one-shot', 1.0, 1.0))
            m.setdefault('start_pose', 'rest' if not m['loop'] else 'loop')
            m.setdefault('end_pose', 'rest' if not m['loop'] else 'loop')
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
    bpy.context.scene['fox_gate'] = 'G1.1 cinematic animation & VFX polish'
    os.makedirs(MOD_DIR, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
    spec = {
        'asset': 'LifeQuest Fox V2', 'gate': 'G1.1', 'module': 'g1_quest_reward_streak', 'module_version': 'g1.1', 'fps': FPS,
        'source_rig': '03_RIG/fox_rig_d1_1.blend', 'base_animation_set': '06_EXPORTS/glb/fox_v2_anim_e2.glb (E2 core clips, unchanged)',
        'supersedes': '04_ANIMATIONS/g1_quest_reward_streak/anim_spec_g1.json (G1, kept unchanged)',
        'categories': CATEGORIES, 'clips': clips, 'streak_tiers': G.STREAK_TIERS,
        'flame_hold': {'socket': 'ATT_HAND_L', 'paw_pose_deg': HOLD,
                       'note': 'streak_active holds the left paw palm-up; the runtime attaches the flame to ATT_HAND_L with a bone-local palm offset'},
        'cue_note': 'cues are runtime VFX timeline entries (seconds from clip start); nothing is baked into the Fox mesh, material or skeleton.',
        'pose_note': 'start_pose / end_pose: rest = the idle rest pose; streak_active = frame 1 of the streak_active loop (streak clips play over that base)',
        'head_control_note': G.__dict__.get('HEAD_NOTE', 'as E1/E2: 1 = clip owns the head; streak_active = 0 so look-at keeps working'),
        'face_control_note': 'as E1/E2: 1 = clip drives the facial morphs; streak_active = 0 so moods keep working',
    }
    if not only:
        json.dump(spec, open(os.path.join(MOD_DIR, 'anim_spec_g1_1.json'), 'w'), indent=2)
    print('saved', OUT)


if __name__ == '__main__':
    main()
