"""Gate G3 — challenge, duo / group and private-social clips (17 clips + 1 mirrored duo variant).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/anim_g3.py      (subset: FOX_CLIPS=a,b)
Reads   03_RIG/fox_rig_d1_1.blend  (canonical approved rig — never written; no rig / weight / morph change)
Writes  04_ANIMATIONS/g3_challenge_social/fox_anim_g3.blend + anim_spec_g3.json

Built on the G2.1 pipeline (anim_g2_1.py is imported, never modified): the same pose envelope, the heel-plant
sit drive for any crouch, the per-frame resolver against the APPROVED E2 + G1 + G1.1 thresholds and the ground
solve on the runtime cage. G3 adds one rule on top: the RAW leg stretch (hidden top ring included) is a resolver
limit as well, so no G3 clip relies on the G2.1 hidden-edge exceptions — crouches stay shallow (|leg_x| <= 28 deg).

Every effect named in a cue is a runtime effect / prop owned by the effects manager (fxLibraryG3.ts): never part
of the Fox mesh, skeleton, materials or cosmetics. Countdown values, teammates, friend relations, photos and
comment text are application data; the clips only carry the timing.
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
import anim_g1 as G1  # noqa: E402  (helpers only)
import anim_g2_1 as G  # noqa: E402  (G2.1 pipeline: envelope, sit drive, resolver, ground solve)
import anim_check_g2_1 as CK  # noqa: E402

T, clamp = E.T, E.clamp
blink_curve, FPS, Q = A.blink_curve, A.FPS, A.Q
wag, face_of, fr = G1.wag, G1.face_of, G1.fr
ease, blend, add = G.ease, G.blend, G.add
MOD_DIR = os.path.join(A.OUT_DIR, 'g3_challenge_social')
OUT = os.path.join(MOD_DIR, 'fox_anim_g3.blend')
SPECF = os.path.join(MOD_DIR, 'anim_spec_g3.json')

# ------------------------------------------------------------------ G3 expressions (existing morphs only)
EYES, BROWS = ['FOX_Eye_L', 'FOX_Eye_R'], ['FOX_Brow_L', 'FOX_Brow_R']
SMILE = {'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_Smile': {'show': 1}}
A.EXPR.update({
    'worried': {**{e: {'Sad': 0.7, 'Wide': 0.25} for e in EYES}, **{b: {'Sad': 0.9} for b in BROWS},
                'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_SmallO': {'show': 1}},
    'concerned': {**{e: {'Sad': 0.45} for e in EYES}, **{b: {'Sad': 0.7} for b in BROWS}},
    'gentle': {**{e: {'HalfLid': 0.35} for e in EYES}, **SMILE},
    'cheeky': {'FOX_Eye_L': {'HalfLid': 0.45, 'Proud': 0.3}, 'FOX_Eye_R': {'Proud': 0.55}, **{b: {'Proud': 0.6} for b in BROWS}, **SMILE},
    'hopeful': {**{e: {'Wide': 0.2} for e in EYES}, **{b: {'Sad': 0.35} for b in BROWS}, **SMILE},
    'curious': {**{e: {'Wide': 0.35} for e in EYES}, 'FOX_Brow_L': {'Proud': 0.45}, 'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_SmallO': {'show': 1}},
})
EXPRESSIONS_ADDED = ['worried', 'concerned', 'gentle', 'cheeky', 'hopeful', 'curious']

# ------------------------------------------------------------------ G3 resolver addition: RAW leg stretch
G.GROUPS['legs'] = ('leg_x', 'legL_x', 'legR_x', 'leg_out', 'foot_x', 'footL_x', 'footR_x')
G.LIMITS['stretch.FOX_Leg'] = 0.74          # approved 0.766 (E2 / G1 / G1.1), small margin — hidden ring INCLUDED
_fv_g21 = G.frame_violations


def frame_violations_g3(f):
    bad = _fv_g21(f)                          # frame already set by the G2.1 measurement
    rest = G._rest_cage()['snap']
    cur = CK.snapshot(G.O_)
    worst = 0.0
    for nm in ('FOX_Leg_L', 'FOX_Leg_R'):
        v0, v1 = rest['v'][nm], cur['v'][nm]
        raw = [abs((v1[a] - v1[b]).length / max(1e-9, (v0[a] - v0[b]).length) - 1) for a, b in rest['e'][nm]]
        worst = max(worst, G._p99(raw))
    r = worst / G.LIMITS['stretch.FOX_Leg']
    if r > 1.0:
        bad['legs'] = max(bad.get('legs', 0.0), r)
    return bad


G.frame_violations = frame_violations_g3


# ------------------------------------------------------------------ helpers
def ears(fwd=0.0, out=0.0, side=0.0, e=0.0, l_fwd=None, r_fwd=None):
    """Ear channels inside the approved E2 envelope (fwd -3..12 = perk, out -6..11 = droop / airplane)."""
    lf = fwd if l_fwd is None else l_fwd
    rf = fwd if r_fwd is None else r_fwd
    return {'earL_fwd': clamp(lf - 0.3 * e, -3, 12), 'earR_fwd': clamp(rf - 0.3 * e, -3, 12),
            'earL_out': clamp(out + 0.8 * e - side, -6, 11), 'earR_out': clamp(out + 0.8 * e + side, -6, 11)}


def tail(P, f, amp, per=12, lift=None, tl=0.0):
    for t in range(4):
        P[f'tail_sway{t}'] = wag(f, amp, per, t)
    if lift is not None:
        P['tail_lift'] = clamp(lift + 0.5 * tl, -10, 10)
    return P


MIRROR_NEG = ('head_z', 'head_y', 'spine_y', 'spine_z', 'hips_y', 'hips_z', 'root_yaw', 'root_roll', 'flap_y', 'root_x',
              'tail_sway0', 'tail_sway1', 'tail_sway2', 'tail_sway3', 'pawL_y', 'pawR_y')


def mirror(P):
    """Left <-> right mirror of a pose dict (used for the duo variant whose partner stands on the fox's right)."""
    out = {}
    for k_, v in P.items():
        if k_.startswith(('armL', 'armR', 'pawL', 'pawR', 'earL', 'earR', 'legL', 'legR', 'footL', 'footR')):
            head, rest = k_[:k_.index('_')], k_[k_.index('_'):]
            head = head[:-1] + ('R' if head[-1] == 'L' else 'L')
            out[head + rest] = v
        else:
            out[k_] = v
    for k_ in MIRROR_NEG:
        if k_ in out:
            out[k_] = -out[k_]
    return out


def grounded(rz):
    return lambda f: 'floor' if (rz is not None and rz(f) > 1e-4) else 'contact'


def bounce(f, f0, f1, h):
    """Smooth hop: root height 0 at f0 / f1, h at the middle (parabola)."""
    if f <= f0 or f >= f1:
        return 0.0
    u = (f - f0) / (f1 - f0)
    return 4 * h * u * (1 - u)


# ================================================================== PART A — CHALLENGE
def challenge_invite():
    """Curiosity -> playful confidence -> invitation. A challenge symbol arrives at the fox's left: one ear rises,
    then the other; the fox looks at it, leans in, lifts its left paw and the token forms above the paw inside an
    orange energy ring, then presents it to the viewer (outward pulse), tail up, cheeky smile."""
    N = 73
    look = T([(1, 0), (5, 0), (11, 1), (30, 1), (36, 0), (73, 0)])
    lean = T([(1, 0), (12, 0), (22, 1), (34, 1), (40, 0.4), (60, 0.4), (66, 0), (73, 0)])
    paw = T([(1, 0), (14, 0), (26, 1), (34, 1), (40, 1.0), (58, 1.0), (66, 0), (73, 0)])
    present = T([(1, 0), (32, 0), (38, 1), (56, 1), (64, 0), (73, 0)])
    perk_l = T([(1, 0), (3, 0), (6, 1), (60, 1), (68, 0), (73, 0)])
    perk_r = T([(1, 0), (8, 0), (11, 1), (60, 1), (68, 0), (73, 0)])
    tilt = T([(1, 0), (42, 0), (48, 1), (58, 1), (64, 0), (73, 0)])
    sq = T([(1, 0), (36, 0), (39, 0.04), (42, -0.015), (45, 0), (73, 0)])

    def pose(f, rzv, sqv, e, tl):
        lk, ln, pw, pr = look(f), lean(f), paw(f), present(f)
        P = {'head_z': 22 * lk, 'head_x': 5 * lk * (1 - pr) - 4 * pr, 'head_y': 3 * lk + 4 * tilt(f),
             'spine_x': 7 * ln, 'hips_x': 3 * ln, 'spine_z': 6 * lk * (1 - pr),
             'armL_up': 100 * pw + 5 * pr, 'armL_x': 40 * pw + 16 * pr, 'pawL_x': -40 * pw - 10 * pr,
             'armR_up': 8 * pw, 'armR_x': -6 * pr}
        P.update(ears(l_fwd=11 * perk_l(f), r_fwd=11 * perk_r(f), out=-2 * pr, e=e))
        return tail(P, f, 6 + 10 * pr, 12, lift=3 + 7 * pr, tl=tl)
    face = lambda f: face_of(surprised=0.5 * T([(1, 0), (3, 0), (7, 1), (14, 0.3), (20, 0), (73, 0)])(f),
                             curious=T([(1, 0), (8, 0), (14, 1), (26, 1), (32, 0), (73, 0)])(f),
                             cheeky=T([(1, 0), (30, 0), (36, 1), (62, 1), (68, 0), (73, 0)])(f),
                             blink_extra=blink_curve(f, [24, 52]))
    m = G.run_clip('challenge_invite', N, pose, face, sq=sq, ground=grounded(None))
    m['cues'] = [{'t': fr(5), 'fx': 'prop.show', 'prop': 'challenge_token', 'mode': 'pop', 'note': 'challenge symbol arrives at the fox\'s left'},
                 {'t': fr(16), 'fx': 'prop.phase', 'prop': 'challenge_token', 'phase': 'paw', 'note': 'glides above the raised left paw'},
                 {'t': fr(18), 'fx': 'ring.paw', 'at': 'hand_l', 'until': fr(42)},
                 {'t': fr(26), 'fx': 'sparkle.soft', 'at': 'hand_l', 'count': 8},
                 {'t': fr(36), 'fx': 'prop.phase', 'prop': 'challenge_token', 'phase': 'present'},
                 {'t': fr(39), 'fx': 'pulse.out', 'at': 'challenge_token', 'duration': 0.55, 'note': 'presentation beat'},
                 {'t': fr(40), 'fx': 'sparkle', 'at': 'challenge_token', 'count': 10},
                 {'t': fr(64), 'fx': 'prop.hide', 'prop': 'challenge_token', 'mode': 'fade'}]
    m['props_end'] = []
    return m


def challenge_accept():
    """Surprise -> determination -> readiness: eyes widen, both paws clench in front of the chest (two energy streaks
    converge into them), a confident stomp-step, ears straight up, one decisive nod, a short ready aura."""
    N = 61
    wide = T([(1, 0), (2, 0), (6, 1), (12, 1), (16, 0), (61, 0)])
    clench = T([(1, 0), (8, 0), (16, 1), (46, 1), (54, 0), (61, 0)])
    step = T([(1, 0), (21, 0), (25, 1), (30, 0), (61, 0)])
    nod = T([(1, 0), (33, 0), (36, 1), (39, -0.35), (42, 0), (61, 0)])
    lean = T([(1, 0), (18, 0), (28, 1), (48, 1), (55, 0), (61, 0)])
    sq = T([(1, 0), (2, -0.03), (6, -0.02), (10, 0), (14, 0.03), (19, 0.04), (21, -0.02), (29, -0.01), (31, 0.05), (34, 0.0), (37, 0.02), (41, 0), (61, 0)])
    rz = lambda f: bounce(f, 20, 31, 0.03)          # step-hop: the stepping leg moves only while airborne

    def pose(f, rzv, sqv, e, tl):
        w, c, s, n, ln = wide(f), clench(f), step(f), nod(f), lean(f)
        P = {'armL_up': 26 * c, 'armL_x': -46 * c, 'pawL_x': -55 * c, 'armR_up': 26 * c, 'armR_x': -46 * c, 'pawR_x': -55 * c,
             'head_x': -4 * w + 4 * c + 8 * n, 'spine_x': 4 * ln - 3 * w, 'hips_x': 2 * ln,
             'legR_x': -22 * s, 'footR_x': 11 * s, 'legL_x': 0.0, 'footL_x': 0.0, 'spine_y': 1.5 * s}
        P.update(ears(fwd=12 * max(w, c), e=e))
        return tail(P, f, 4 + 8 * c, 14, lift=2 + 7 * c, tl=tl)
    face = lambda f: face_of(surprised=wide(f), determined=T([(1, 0), (12, 0), (18, 1), (50, 1), (56, 0), (61, 0)])(f),
                             smile=T([(1, 0), (48, 0), (52, 0.7), (58, 0), (61, 0)])(f), blink_extra=blink_curve(f, [44]))
    m = G.run_clip('challenge_accept', N, pose, face, rz=rz, sq=sq, ground=grounded(rz))
    m['cues'] = [{'t': fr(4), 'fx': 'prop.show', 'prop': 'challenge_token', 'mode': 'pop'},
                 {'t': fr(5), 'fx': 'prop.phase', 'prop': 'challenge_token', 'phase': 'flash', 'note': 'challenge symbol flashes'},
                 {'t': fr(10), 'fx': 'streaks.converge', 'at': 'paws', 'duration': 0.45, 'note': 'two energy streaks converge into the clenched paws'},
                 {'t': fr(31), 'fx': 'dust.small', 'at': 'feet', 'count': 5},
                 {'t': fr(36), 'fx': 'aura.ready', 'until': fr(54)},
                 {'t': fr(48), 'fx': 'prop.hide', 'prop': 'challenge_token', 'mode': 'burst'}]
    return m


def challenge_start():
    """Anticipation -> preparation -> launch: lowers its centre of gravity (shallow crouch, tail out for balance),
    glances at the opponent, holds a competitive stance through three abstract countdown pulses (driven by the
    runtime / application, never by the clip), then a short forward-leaning hop and lands facing the target."""
    N = 85
    crouch = T([(1, 0), (6, 0), (16, 1), (46, 1), (48, 0.6), (58, 0.9), (68, 0.4), (78, 0), (85, 0)])
    glance = T([(1, 0), (8, 0), (13, 1), (20, 1), (25, 0), (85, 0)])
    fists = T([(1, 0), (6, 0), (16, 1), (60, 1), (72, 0), (85, 0)])
    lunge = T([(1, 0), (44, 0), (48, 1), (56, 1), (62, 0.3), (72, 0), (85, 0)])
    legs = T([(1, 0), (6, 0), (16, 1), (44, 1), (48, 0), (56, 0), (59, 0.7), (68, 0.3), (78, 0), (85, 0)])
    rz = lambda f: bounce(f, 48, 56, 0.05)
    sq = T([(1, 0), (6, 0), (14, 0.05), (44, 0.05), (47, 0.08), (49, -0.05), (53, -0.02), (56, 0.07), (59, 0.0), (62, 0.02), (66, 0), (85, 0)])

    def pose(f, rzv, sqv, e, tl):
        c, g, fi, lu = crouch(f), glance(f), fists(f), lunge(f)
        bob = 0.012 * math.sin(2 * math.pi * (f - 16) / 12) * (1 if 18 <= f <= 44 else 0)
        P = {'leg_x': -24 * legs(f), 'squash': bob, 'spine_x': 7 * c + 5 * lu, 'hips_x': 2 * c, 'head_x': -3 * c - 3 * lu, 'head_z': -18 * g,
             'armL_up': 22 * fi + 30 * lu, 'armL_x': -30 * fi + 10 * lu, 'pawL_x': -45 * fi, 'armR_up': 22 * fi + 30 * lu, 'armR_x': -30 * fi + 10 * lu, 'pawR_x': -45 * fi}
        P.update(ears(fwd=10 * fi, out=-2 * c, e=e))
        P = tail(P, f, 5 * (1 - c) + 2, 16, lift=6 * c + 4 * lu, tl=tl)
        return P
    face = lambda f: face_of(focus=T([(1, 0), (4, 0), (12, 1), (44, 1), (48, 0), (85, 0)])(f), determined=T([(1, 0), (20, 0), (30, 0.8), (46, 1), (72, 1), (80, 0), (85, 0)])(f),
                             excited=T([(1, 0), (46, 0), (49, 1), (58, 1), (64, 0), (85, 0)])(f), blink_extra=blink_curve(f, [30, 66]))
    m = G.run_clip('challenge_start', N, pose, face, rz=rz, sq=sq, ground=grounded(rz))
    m['cues'] = [{'t': fr(16), 'fx': 'countdown.begin', 'note': 'countdown prop appears; the displayed value is application data (setChallengeCountdown) — '
                                                               'without data it shows abstract pulses'},
                 {'t': fr(20), 'fx': 'countdown.pulse', 'step': 3}, {'t': fr(20), 'fx': 'ring.ground', 'duration': 0.6},
                 {'t': fr(32), 'fx': 'countdown.pulse', 'step': 2}, {'t': fr(32), 'fx': 'ring.ground', 'duration': 0.6},
                 {'t': fr(44), 'fx': 'countdown.pulse', 'step': 1}, {'t': fr(44), 'fx': 'ring.ground', 'duration': 0.6},
                 {'t': fr(48), 'fx': 'flash.start', 'duration': 0.4}, {'t': fr(48), 'fx': 'speed.lines', 'duration': 0.5},
                 {'t': fr(49), 'fx': 'countdown.end'},
                 {'t': fr(56), 'fx': 'dust.small', 'at': 'feet', 'count': 6}]
    return m


def challenge_win():
    """Realisation -> excitement -> triumph (bigger than quest_complete): surprised, both paws up, crouch, a big jump
    with a full celebratory turn, soft landing, then proudly presents a floating golden trophy — starburst,
    confetti, victory aura and an animated trophy highlight."""
    N = 109
    surprise = T([(1, 0), (2, 0), (6, 1), (12, 1), (16, 0), (109, 0)])
    arms_up = T([(1, 0), (10, 0), (16, 1), (40, 1), (46, 0.2), (109, 0)])
    crouch = T([(1, 0), (14, 0), (20, 1), (22, 0), (37, 0), (40, 0.7), (44, 0), (109, 0)])
    present = T([(1, 0), (44, 0), (52, 1), (90, 1), (100, 0), (109, 0)])
    rz = lambda f: bounce(f, 22, 38, 0.12)
    spin = T([(1, 0), (23, 0), (37, 360), (109, 360)])
    sq = T([(1, 0), (2, -0.035), (6, -0.02), (10, 0), (16, 0.03), (20, 0.09), (22, -0.06), (26, -0.02), (36, -0.02), (38, 0.09), (41, 0.02), (44, -0.01), (47, 0),
            (54, 0.02), (58, 0), (109, 0)])

    def pose(f, rzv, sqv, e, tl):
        s, a, c, pr = surprise(f), arms_up(f), crouch(f), present(f)
        P = {'root_yaw': spin(f) if f < 100 else 0.0, 'leg_x': -12 * c, 'spine_x': 5 * c - 3 * s - 6 * pr, 'head_x': -5 * s - 5 * pr + 4 * c,
             'armL_up': 118 * a + 108 * pr, 'armL_x': 22 * a + 36 * pr, 'pawL_x': -20 * a - 40 * pr,
             'armR_up': 118 * a + 24 * pr, 'armR_x': 22 * a - 10 * pr, 'pawR_x': -20 * a,
             'head_z': 14 * pr, 'head_y': 3 * pr, 'spine_z': 5 * pr}
        P.update(ears(fwd=12 * max(s, a, pr), e=e))
        return tail(P, f, 10 + 10 * max(a, pr), 10, lift=4 + 6 * max(a, pr), tl=tl)
    face = lambda f: face_of(surprised=surprise(f), excited=T([(1, 0), (12, 0), (18, 1), (44, 1), (50, 0), (109, 0)])(f), happy=T([(1, 0), (26, 0), (30, 1), (40, 1), (44, 0), (109, 0)])(f),
                             proud=T([(1, 0), (46, 0), (52, 1), (96, 1), (102, 0), (109, 0)])(f), blink_extra=blink_curve(f, [70]))
    m = G.run_clip('challenge_win', N, pose, face, rz=rz, sq=sq, ground=grounded(rz))
    m['cues'] = [{'t': fr(3), 'fx': 'burst.exclaim', 'duration': 0.7},
                 {'t': fr(22), 'fx': 'ring.shockwave', 'duration': 0.6},
                 {'t': fr(30), 'fx': 'confetti', 'count': 80, 'duration': 2.6},
                 {'t': fr(38), 'fx': 'dust.small', 'at': 'feet', 'count': 6},
                 {'t': fr(46), 'fx': 'prop.show', 'prop': 'trophy', 'mode': 'pop'},
                 {'t': fr(48), 'fx': 'starburst.gold', 'at': 'trophy', 'duration': 0.9},
                 {'t': fr(48), 'fx': 'aura.victory', 'until': fr(100)},
                 {'t': fr(52), 'fx': 'confetti', 'count': 60, 'duration': 2.4},
                 {'t': fr(62), 'fx': 'prop.phase', 'prop': 'trophy', 'phase': 'shine'},
                 {'t': fr(84), 'fx': 'prop.phase', 'prop': 'trophy', 'phase': 'shine'},
                 {'t': fr(98), 'fx': 'prop.hide', 'prop': 'trophy', 'mode': 'fade'}]
    return m


def challenge_lose():
    """Disappointment -> resilience -> encouragement (never punishing): ears droop, looks down, tail lowers, a brief
    crouch as the challenge emblem fades (tiny dust), looks back at the viewer, straightens up with a determined
    face and a small fist — a gentle motivation spark."""
    N = 97
    droop = T([(1, 0), (4, 0), (14, 1), (44, 1), (56, 0.4), (66, 0), (97, 0)])
    crouch = T([(1, 0), (14, 0), (24, 1), (36, 1), (50, 0), (97, 0)])
    look_up = T([(1, 0), (38, 0), (48, 1), (97, 1)])
    rise = T([(1, 0), (52, 0), (62, 1), (82, 1), (90, 0), (97, 0)])
    fist = T([(1, 0), (60, 0), (66, 1), (78, 1), (86, 0), (97, 0)])
    sq = T([(1, 0), (6, 0), (14, 0.01), (24, 0.018), (36, 0.018), (50, 0), (60, -0.015), (64, 0.01), (68, 0), (97, 0)])

    def pose(f, rzv, sqv, e, tl):
        d, c, lu, r, fi = droop(f), crouch(f), look_up(f), rise(f), fist(f)
        P = {'head_x': 9 * d * (1 - 0.8 * lu) - 3 * r, 'spine_x': 6 * d - 4 * r + 2 * c, 'leg_x': -22 * c, 'hips_x': 2 * c,
             'armL_up': -2 * d + 6 * r, 'armR_up': -2 * d + 36 * fi, 'armR_x': -48 * fi, 'pawR_x': -50 * fi, 'head_y': -2 * d * (1 - lu)}
        P.update(ears(fwd=-3 * d + 10 * r, out=9 * d * (1 - r), e=e))
        return tail(P, f, 3 + 6 * r, 16, lift=-8 * d + 6 * r, tl=tl)
    face = lambda f: face_of(sad=T([(1, 0), (4, 0), (12, 0.85), (40, 0.85), (50, 0.4), (58, 0), (97, 0)])(f), hopeful=T([(1, 0), (42, 0), (50, 0.8), (58, 0), (97, 0)])(f),
                             determined=T([(1, 0), (54, 0), (60, 1), (84, 1), (90, 0), (97, 0)])(f), smile=T([(1, 0), (80, 0), (86, 0.8), (94, 0), (97, 0)])(f),
                             blink_extra=blink_curve(f, [30, 72]))
    m = G.run_clip('challenge_lose', N, pose, face, sq=sq, ground=grounded(None))
    m['cues'] = [{'t': fr(1), 'fx': 'prop.show', 'prop': 'challenge_token', 'mode': 'fade'},
                 {'t': fr(6), 'fx': 'prop.phase', 'prop': 'challenge_token', 'phase': 'fade_out', 'note': 'the challenge emblem dims and fades'},
                 {'t': fr(26), 'fx': 'dust.small', 'at': 'feet', 'count': 4},
                 {'t': fr(36), 'fx': 'prop.hide', 'prop': 'challenge_token', 'mode': 'fade'},
                 {'t': fr(66), 'fx': 'spark.motivation', 'at': 'hand_r', 'duration': 0.8}]
    return m


def challenge_draw():
    """Confusion -> realisation -> sportsmanship: looks to one emblem, then the other (both equally bright), tilts
    its head, a small shrug, the equal sign appears between them, smiles and offers a friendly paw."""
    N = 85
    look = T([(1, 0), (4, 0), (9, 1), (13, 1), (18, -1), (23, -1), (27, 0), (85, 0)])
    tilt = T([(1, 0), (24, 0), (30, 1), (40, 1), (46, 0), (85, 0)])
    shrug = T([(1, 0), (32, 0), (38, 1), (44, 1), (50, 0), (85, 0)])
    offer = T([(1, 0), (54, 0), (62, 1), (74, 1), (80, 0), (85, 0)])
    nod = T([(1, 0), (64, 0), (67, 1), (71, 0), (85, 0)])
    sq = T([(1, 0), (32, 0), (37, -0.025), (42, -0.02), (47, 0.015), (52, 0), (85, 0)])

    def pose(f, rzv, sqv, e, tl):
        lk, t_, sh, of = look(f), tilt(f), shrug(f), offer(f)
        P = {'head_z': 22 * lk, 'head_y': 4.5 * t_ - 2 * sh, 'head_x': -2 * t_ + 5 * nod(f), 'spine_z': 6 * lk,
             'armL_up': 42 * sh, 'armL_x': 22 * sh, 'pawL_x': -50 * sh, 'armR_up': 42 * sh + 68 * of, 'armR_x': 22 * sh + 50 * of, 'pawR_x': -50 * sh - 30 * of,
             'spine_x': 4 * of, 'spine_y': -2 * of}
        P.update(ears(fwd=6 * (1 - sh) * abs(lk) + 4 * of, side=6 * lk, out=3 * t_, e=e))
        return tail(P, f, 5 + 5 * of, 14, lift=3 + 3 * of, tl=tl)
    face = lambda f: face_of(curious=T([(1, 0), (4, 0), (10, 1), (40, 1), (46, 0), (85, 0)])(f), smile=T([(1, 0), (44, 0), (50, 1), (78, 1), (84, 0), (85, 0)])(f),
                             blink_extra=blink_curve(f, [28, 60]))
    m = G.run_clip('challenge_draw', N, pose, face, sq=sq, ground=grounded(None))
    m['cues'] = [{'t': fr(3), 'fx': 'prop.show', 'prop': 'equal_emblem', 'mode': 'pop', 'note': 'two equally bright emblems, left and right'},
                 {'t': fr(44), 'fx': 'prop.phase', 'prop': 'equal_emblem', 'phase': 'equal', 'note': 'the equal sign appears between them'},
                 {'t': fr(46), 'fx': 'sparks.symmetric', 'duration': 0.8},
                 {'t': fr(64), 'fx': 'sparkle.soft', 'at': 'hand_r', 'count': 6},
                 {'t': fr(76), 'fx': 'prop.hide', 'prop': 'equal_emblem', 'mode': 'fade'}]
    return m


# ================================================================== PART B — DUO / GROUP
DUO_CONTACT_F = 36


def duo_pose_fn(side):
    """side = +1: the partner stands on the fox's LEFT (the fox is on the viewer's left), left-paw high-five;
    side = -1: mirrored (partner on the fox's right).
    Geometry (measured with g3_probe on the runtime cage): the paw reaches ~0.30 m from the fox's axis while the head is
    ~0.34 m wide, so two upright foxes cannot touch paws without their heads intersecting. The contact is therefore made
    in the air: both foxes hop TOWARD each other (root 0.12 m sideways), their bodies arc OUTWARD (root roll 12 deg, the head
    edge moves 0.14 m away) and the low reaching paw meets the partner's paw at the apex; they rebound to their start spots
    and land (feet never slide: every sideways move happens while airborne)."""
    look = T([(1, 0), (3, 0), (10, 1), (54, 1), (66, 0), (97, 0)])
    raise_ = T([(1, 0), (12, 0), (24, 1), (36, 1), (41, 0.6), (97, 0.6)])
    cheer = T([(1, 0), (37, 0), (42, 1), (56, 1), (66, 0), (97, 0)])
    rest_out = T([(1, 1), (60, 1), (76, 0), (97, 0)])
    hop_x = T([(1, 0), (29, 0), (36, 0.12), (43, 0), (97, 0)])          # sideways move toward the partner, airborne only
    roll = T([(1, 0), (29, 0), (36, -12.0), (43, 0), (97, 0)])           # body arcs away from the partner at the contact
    reach = T([(1, 0), (12, 0), (24, 70), (30, 70), (36, 50), (41, 60), (97, 60)])

    def pose(f, rzv, sqv, e, tl):
        lk, ra, ch, ro = look(f), raise_(f), cheer(f), rest_out(f)
        P = {'head_z': 24 * lk, 'head_x': -3 * lk, 'head_y': -3 * lk, 'spine_z': 6 * lk, 'root_x': hop_x(f), 'root_roll': roll(f),
             'armL_up': (reach(f) * ra + 40 * ch) * ro, 'armL_x': 0.0, 'pawL_x': -10 * ra * ro, 'pawL_y': 12 * ra * ro,
             'armR_up': 10 * ra * ro + 92 * ch * ro, 'armR_x': 20 * ch * ro, 'pawR_x': -20 * ch * ro}
        P.update(ears(fwd=10 * max(lk, ch), side=4 * lk, out=-3 * lk, e=e))   # partner-side ear never tilts out
        P = tail(P, f, 8 + 12 * ch, 10, lift=4 + 6 * ch, tl=tl)
        return P if side > 0 else mirror(P)
    return pose


def _duo(name, side):
    N = 97
    rz = lambda f: bounce(f, 28, 44, 0.07) + bounce(f, 48, 54, 0.03)
    sq = T([(1, 0), (22, 0), (26, 0.04), (28, 0.06), (30, -0.04), (34, -0.02), (36, 0.03), (39, -0.01), (43, -0.01), (44, 0.06), (46, 0.0), (48, 0.03), (50, -0.02),
            (54, 0.04), (57, 0), (97, 0)])
    face = lambda f: face_of(smile=T([(1, 0), (4, 0), (10, 1), (34, 1), (37, 0), (97, 0)])(f), happy=T([(1, 0), (35, 0), (38, 1), (56, 1), (62, 0), (97, 0)])(f),
                             excited=T([(1, 0), (24, 0), (30, 0.6), (35, 0.0), (97, 0)])(f), proud=T([(1, 0), (60, 0), (66, 0.7), (84, 0.7), (90, 0), (97, 0)])(f),
                             blink_extra=blink_curve(f, [20, 74]))
    m = G.run_clip(name, N, duo_pose_fn(side), face, rz=rz, sq=sq, ground=grounded(rz))
    hand = 'hand_l' if side > 0 else 'hand_r'
    m['cues'] = [{'t': fr(DUO_CONTACT_F), 'fx': 'duo.contact', 'at': hand, 'note': 'high-five contact (mid-air): the duo coordinator puts one shared sparkle '
                                                                                  'at the midpoint of both paws; solo = at this fox\'s paw'},
                 {'t': fr(DUO_CONTACT_F + 1), 'fx': 'burst.stars', 'at': hand, 'count': 8},
                 {'t': fr(46), 'fx': 'burst.heart', 'at': 'duo_center', 'note': 'shared heart / starburst above the pair (solo: above the fox)'},
                 {'t': fr(46), 'fx': 'confetti', 'count': 36, 'duration': 1.8}]
    m['contact'] = {'frame': DUO_CONTACT_F, 't': fr(DUO_CONTACT_F), 'socket': 'ATT_HAND_L' if side > 0 else 'ATT_HAND_R',
                    'partner_side': 'left' if side > 0 else 'right', 'window': [fr(DUO_CONTACT_F - 4), fr(DUO_CONTACT_F + 3)],
                    'note': 'mid-air contact: root 0.12 m toward the partner + 12 deg outward roll at the apex (heads stay clear)'}
    return m


def duo_celebrate():
    """Coordinated two-fox celebration: look at each other, raise matching paws, hop toward each other and HIGH-FIVE in
    the air (contact at f36, bodies arcing apart), rebound to the start spot, a joyful bounce, turn back to the viewer,
    recover. Partner on the fox's left (left paw). Works solo (an air high-five to the side)."""
    return _duo('duo_celebrate', +1)


def duo_celebrate_mirror():
    """Mirrored duo_celebrate (partner on the fox's right, right paw) — same timing, same contact frame."""
    return _duo('duo_celebrate_mirror', -1)


def group_victory():
    """Notices the team's success, both paws up, a 120 bpm group dance (hip sway, alternating paw pumps, small hops on
    beats 2 and 4, head bob), a collective jump at the climax and a triumphant pose. Team emblems orbit (symbolic
    teammates — works with one fox); several foxes can play it in sync."""
    N = 121
    notice = T([(1, 0), (3, 0), (8, 1), (14, 1), (18, 0), (121, 0)])
    up = T([(1, 0), (10, 0), (18, 1), (24, 0.6), (98, 0.6), (102, 1), (112, 1), (118, 0), (121, 0)])
    dance = T([(1, 0), (18, 0), (24, 1), (92, 1), (98, 0), (121, 0)])
    triumph = T([(1, 0), (100, 0), (104, 1), (114, 1), (119, 0), (121, 0)])
    BEAT = 12

    def rz(f):
        h = 0.0
        for b in range(4):                       # small hops on beats 2 and 4 of each bar
            f0 = 24 + BEAT * (2 * b + 1)
            if f0 + 6 <= 92:
                h += bounce(f, f0, f0 + 6, 0.022)
        return h + bounce(f, 96, 104, 0.07)
    sq = lambda f: (0.035 * max(0.0, math.cos(2 * math.pi * (f - 24) / BEAT)) ** 3 * dance(f) + T([(1, 0), (92, 0), (95, 0.045), (97, -0.025), (103, 0.04), (106, 0), (121, 0)])(f))

    def pose(f, rzv, sqv, e, tl):
        n, u, d, tr = notice(f), up(f), dance(f), triumph(f)
        ph = 2 * math.pi * (f - 24) / (2 * BEAT)
        sway = math.sin(ph) * d
        alt = math.sin(ph)
        P = {'head_z': 15 * math.sin(2 * math.pi * (f - 3) / 11) * n + 8 * sway, 'head_x': 4 * math.sin(2 * math.pi * (f - 24) / BEAT) * d - 5 * tr, 'head_y': 3 * sway,
             'hips_y': 2 * sway, 'spine_y': -2 * sway, 'spine_z': 10 * sway, 'spine_x': -5 * tr,
             'armL_up': 110 * u + 30 * d * alt, 'armL_x': 20 * u + 10 * d, 'pawL_x': -25 * u,
             'armR_up': 110 * u - 30 * d * alt, 'armR_x': 20 * u + 10 * d, 'pawR_x': -25 * u}
        P.update(ears(fwd=12 * max(n, u, d), side=3 * sway, e=e))
        for t in range(4):
            P[f'tail_sway{t}'] = clamp(9 * math.sin(ph - 0.7 * t) * d * (1 + 0.15 * t) + wag(f, 8 * (1 - d), 10, t), -20, 20)
        P['tail_lift'] = clamp(4 + 2.5 * max(u, tr) + 0.4 * tl, -10, 10)
        return P
    face = lambda f: face_of(surprised=notice(f) * 0.6, excited=T([(1, 0), (10, 0), (16, 1), (60, 1), (64, 0.0), (121, 0)])(f), happy=T([(1, 0), (58, 0), (64, 1), (98, 1), (102, 0), (121, 0)])(f),
                             proud=triumph(f), blink_extra=blink_curve(f, [50, 86]))
    m = G.run_clip('group_victory', N, pose, face, rz=rz, sq=sq, ground=grounded(rz))
    m['cues'] = [{'t': fr(8), 'fx': 'prop.show', 'prop': 'team_markers', 'mode': 'pop', 'note': 'symbolic teammates (count / colours = application data, setGroup)'},
                 {'t': fr(18), 'fx': 'aura.team', 'until': fr(112)},
                 {'t': fr(20), 'fx': 'team.orbit', 'until': fr(104), 'note': 'team emblems orbit the fox in time with the beat'},
                 {'t': fr(24), 'fx': 'confetti.multi', 'count': 60, 'duration': 2.4}]
    for b in range(6):
        m['cues'].append({'t': fr(24 + BEAT * b), 'fx': 'beat', 'note': 'dance beat (synchronisation marker for group playback)'})
    m['cues'] += [{'t': fr(100), 'fx': 'burst.team', 'duration': 0.9, 'note': 'collective burst at the climax'},
                  {'t': fr(100), 'fx': 'confetti.multi', 'count': 90, 'duration': 2.6},
                  {'t': fr(112), 'fx': 'prop.hide', 'prop': 'team_markers', 'mode': 'fade'}]
    m['beat_s'] = round(BEAT / FPS, 4)
    return m


def team_encourage():
    """Notices a teammate struggling (looks to the fox's right, concerned), paw over the heart (warm light), a
    reassuring nod, extends a paw toward the teammate (gentle connection line, heart particles), supportive smile."""
    N = 85
    look = T([(1, 0), (4, 0), (12, 1), (40, 1), (48, 0.5), (85, 0.5)])
    heart = T([(1, 0), (20, 0), (30, 1), (44, 1), (50, 0), (85, 0)])
    nod = T([(1, 0), (40, 0), (44, 1), (48, -0.2), (52, 0), (85, 0)])
    reach = T([(1, 0), (48, 0), (58, 1), (72, 1), (79, 0), (85, 0)])
    sq = T([(1, 0), (26, 0), (30, -0.015), (36, 0), (85, 0)])

    def pose(f, rzv, sqv, e, tl):
        lk, h, rc = look(f), heart(f), reach(f)
        P = {'head_z': -18 * lk, 'head_y': -4 * lk * (1 - rc), 'head_x': 3 * lk + 6 * nod(f) - 2 * rc, 'spine_z': -6 * lk,
             'armL_up': 85 * h, 'armL_x': 40 * h, 'pawL_x': -50 * h,
             'armR_up': 70 * rc, 'armR_x': 55 * rc, 'pawR_x': -35 * rc, 'spine_x': 5 * rc, 'spine_y': -3 * rc}
        P.update(ears(fwd=5 * lk + 6 * rc, out=4 * h * (1 - rc), e=e))
        return tail(P, f, 4 + 5 * rc, 16, lift=2 + 4 * rc, tl=tl)
    face = lambda f: face_of(concerned=T([(1, 0), (6, 0), (14, 1), (40, 1), (48, 0), (85, 0)])(f), gentle=T([(1, 0), (42, 0), (50, 1), (85, 1)])(f) * T([(1, 1), (78, 1), (85, 0)])(f),
                             blink_extra=blink_curve(f, [34, 66]))
    m = G.run_clip('team_encourage', N, pose, face, sq=sq, ground=grounded(None))
    m['cues'] = [{'t': fr(28), 'fx': 'glow.warm', 'at': 'chest', 'until': fr(52)},
                 {'t': fr(54), 'fx': 'link.line', 'at': 'hand_r', 'to': 'teammate', 'until': fr(78), 'note': 'gentle connection line toward the teammate (marker or second fox)'},
                 {'t': fr(56), 'fx': 'hearts.float', 'at': 'hand_r', 'count': 5}]
    return m


def group_streak_active():
    """Group streak activation: raises the flame paw (the G1.1 streak flame, held on ATT_HAND_L), looks to the
    teammates, the flame flares brighter as team ember arcs link in, a small synchronised double bounce with a fist,
    then hands over to the persistent streak state (streak_active base loop + linked embers)."""
    N = 85
    raise_ = T([(1, 0), (4, 0), (14, 1), (56, 1), (68, 0), (85, 0)])
    look_flame = T([(1, 0), (6, 0), (14, 1), (20, 1), (26, 0), (85, 0)])
    look_team = T([(1, 0), (20, 0), (26, -1), (32, -1), (38, 1), (44, 1), (50, 0), (85, 0)])
    pump = T([(1, 0), (34, 0), (38, 1), (54, 1), (62, 0), (85, 0)])
    rz = lambda f: bounce(f, 36, 42, 0.025) + bounce(f, 48, 54, 0.025)
    sq = T([(1, 0), (34, 0), (36, 0.04), (38, -0.02), (42, 0.04), (45, 0), (48, 0.04), (50, -0.02), (54, 0.04), (57, 0), (85, 0)])

    def pose(f, rzv, sqv, e, tl):
        r, lf, lt, p = raise_(f), look_flame(f), look_team(f), pump(f)
        P = {'armL_up': 100 * r, 'armL_x': 30 * r, 'pawL_x': -30 * r, 'head_z': 18 * lf + 16 * lt, 'head_x': 5 * lf - 3 * abs(lt), 'spine_z': 6 * lt,
             'armR_up': 34 * p, 'armR_x': -42 * p, 'pawR_x': -50 * p, 'spine_x': -3 * r}
        P.update(ears(fwd=10 * max(r, p), e=e))
        return tail(P, f, 8 + 8 * p, 12, lift=5 + 4 * r, tl=tl)
    face = lambda f: face_of(proud=T([(1, 0), (6, 0), (14, 1), (34, 1), (38, 0), (85, 0)])(f), excited=T([(1, 0), (34, 0), (37, 1), (56, 1), (62, 0), (85, 0)])(f),
                             smile=T([(1, 0), (58, 0), (64, 1), (80, 0.5), (85, 0)])(f), blink_extra=blink_curve(f, [24, 70]))
    m = G.run_clip('group_streak_active', N, pose, face, rz=rz, sq=sq, ground=grounded(rz))
    m['cues'] = [{'t': 0.0, 'fx': 'flame.loop', 'note': 'the existing G1.1 streak flame (one flame, held on ATT_HAND_L) — never duplicated'},
                 {'t': fr(12), 'fx': 'prop.show', 'prop': 'team_markers', 'mode': 'pop'},
                 {'t': fr(28), 'fx': 'flame.flare', 'duration': 1.1, 'scale': 1.6},
                 {'t': fr(29), 'fx': 'group.link.on', 'note': 'persistent team-linked ember arcs (state, owned by the group streak — not by this clip)'},
                 {'t': fr(30), 'fx': 'ring.tier', 'duration': 0.6},
                 {'t': fr(38), 'fx': 'sparkle.soft', 'at': 'flame', 'count': 6},
                 {'t': fr(50), 'fx': 'sparkle.soft', 'at': 'flame', 'count': 6}]
    return m


def group_streak_lost():
    """Group streak lost (established G1 streak-loss style, no lightning): the flame destabilises (linked flames
    flicker), the fox looks worried and hunches over the flame paw with the other paw as a windbreak — the linked
    flames fade one by one, the connection ring breaks, the flame goes out in soft smoke; ears and tail droop, it
    looks to the teammates, disappointed but not crushed."""
    N = 109
    notice = T([(1, 0), (3, 0), (10, 1), (40, 1), (48, 0), (109, 0)])
    protect = T([(1, 0), (14, 0), (24, 1), (42, 1), (50, 0.2), (60, 0), (109, 0)])
    droop = T([(1, 0), (44, 0), (56, 1), (92, 1), (100, 0), (109, 0)])
    team = T([(1, 0), (64, 0), (72, -1), (80, -1), (88, 1), (94, 1), (100, 0), (109, 0)])
    sq = T([(1, 0), (14, 0), (24, 0.015), (42, 0.015), (46, -0.012), (50, 0.0), (56, 0.01), (92, 0.01), (100, 0), (109, 0)])

    def pose(f, rzv, sqv, e, tl):
        n, p, d, tm = notice(f), protect(f), droop(f), team(f)
        P = {'armL_up': 70 * n + 15 * p - 50 * d * (1 - n), 'armL_x': 20 * n + 30 * p, 'pawL_x': -30 * n - 20 * p,
             'armR_up': 80 * p, 'armR_x': 48 * p, 'pawR_x': -40 * p,
             'head_z': 18 * n * (1 - 0.3 * p) + 14 * tm, 'head_x': 6 * n + 3 * p + 7 * d * (1 - 0.6 * abs(tm)), 'spine_x': 8 * p + 4 * d, 'spine_z': 5 * n,
             'head_y': -2 * d}
        P['armL_up'] = max(P['armL_up'], 0.0)
        P.update(ears(fwd=4 * n - 3 * d, out=2 * p + 8 * d, e=e))
        return tail(P, f, 3 + 3 * n * (1 - d), 16, lift=4 * n - 8 * d, tl=tl)
    face = lambda f: face_of(worried=T([(1, 0), (4, 0), (10, 1), (44, 1), (50, 0), (109, 0)])(f), surprised=T([(1, 0), (44, 0), (46, 0.6), (52, 0), (109, 0)])(f),
                             sad=T([(1, 0), (48, 0), (56, 0.75), (94, 0.75), (102, 0), (109, 0)])(f), hopeful=T([(1, 0), (96, 0), (102, 0.5), (109, 0)])(f),
                             blink_extra=blink_curve(f, [60, 84]))
    m = G.run_clip('group_streak_lost', N, pose, face, sq=sq, ground=grounded(None))
    m['cues'] = [{'t': fr(1), 'fx': 'flame.flicker', 'until': fr(44)},
                 {'t': fr(4), 'fx': 'prop.show', 'prop': 'team_markers', 'mode': 'fade'},
                 {'t': fr(24), 'fx': 'group.flames.fade', 'stagger': 0.25, 'note': 'the small linked flames fade one by one'},
                 {'t': fr(44), 'fx': 'flame.extinguish', 'duration': 0.5},
                 {'t': fr(45), 'fx': 'smoke', 'at': 'flame', 'count': 8, 'duration': 1.6},
                 {'t': fr(46), 'fx': 'group.ring.break', 'duration': 0.9, 'note': 'the group connection ring breaks apart'},
                 {'t': fr(46), 'fx': 'group.link.off'},
                 {'t': fr(60), 'fx': 'embers.fade', 'at': 'flame', 'count': 6, 'duration': 1.4},
                 {'t': fr(100), 'fx': 'prop.hide', 'prop': 'team_markers', 'mode': 'fade'},
                 {'t': fr(108), 'fx': 'streak.end', 'note': 'runtime marks the (group) streak inactive — the flame stays out'}]
    return m


# ================================================================== PART C — PRIVATE SOCIAL
def friend_greet():
    """Recognises an incoming social interaction: ears up, turns toward the notification (the fox's left, where
    LifeQuest shows it), an enthusiastic three-beat wave with the near paw, a warm smile back to the viewer."""
    N = 61
    perk = T([(1, 0), (2, 0), (5, 1), (52, 1), (58, 0), (61, 0)])
    turn = T([(1, 0), (5, 0), (12, 1), (38, 1), (46, 0), (61, 0)])
    wave_on = T([(1, 0), (12, 0), (20, 1), (42, 1), (50, 0), (61, 0)])
    sq = T([(1, 0), (3, -0.02), (7, 0.01), (10, 0), (20, 0), (24, 0.02), (28, 0), (32, 0.02), (36, 0), (61, 0)])

    def pose(f, rzv, sqv, e, tl):
        p, t_, w = perk(f), turn(f), wave_on(f)
        osc = math.sin(2 * math.pi * (f - 20) / 8) * w
        P = {'head_z': 22 * t_, 'head_x': -4 * t_, 'head_y': 3 * t_ + 2 * osc, 'spine_z': 7 * t_, 'hips_z': 3 * t_,
             'armL_up': 106 * w, 'armL_x': 20 * w + 9 * osc, 'pawL_x': -20 * w + 24 * osc}
        P.update(ears(fwd=12 * p, e=e))
        return tail(P, f, 6 + 12 * w, 9, lift=4 + 5 * w, tl=tl)
    face = lambda f: face_of(surprised=T([(1, 0), (2, 0), (5, 0.7), (10, 0), (61, 0)])(f), happy=T([(1, 0), (10, 0), (16, 1), (40, 1), (46, 0), (61, 0)])(f),
                             smile=T([(1, 0), (40, 0), (46, 1), (56, 1), (61, 0)])(f), blink_extra=blink_curve(f, [48]))
    m = G.run_clip('friend_greet', N, pose, face, sq=sq, ground=grounded(None))
    m['cues'] = [{'t': fr(4), 'fx': 'sparkle.greet', 'at': 'notify', 'count': 6, 'note': 'small greeting sparkle at the notification side'},
                 {'t': fr(30), 'fx': 'pulse.heart', 'at': 'notify', 'duration': 0.6}]
    return m


def photo_reaction():
    """A blank Polaroid-style frame floats in at the fox's left: notices it, looks, tilts its head, a delighted
    little hop, raises the left paw next to the frame (light shine across it, small hearts). No user photo in the
    GLB: the frame is a runtime prop whose picture is application data."""
    N = 73
    look = T([(1, 0), (5, 0), (13, 1), (60, 1), (66, 0), (73, 0)])
    tilt = T([(1, 0), (16, 0), (22, 1), (28, 1), (32, 0), (73, 0)])
    paw = T([(1, 0), (34, 0), (44, 1), (56, 1), (64, 0), (73, 0)])
    rz = lambda f: bounce(f, 29, 35, 0.03)
    sq = T([(1, 0), (26, 0), (28, 0.04), (30, -0.02), (35, 0.04), (38, 0), (73, 0)])

    def pose(f, rzv, sqv, e, tl):
        lk, t_, pw = look(f), tilt(f), paw(f)
        P = {'head_z': 24 * lk, 'head_x': -3 * lk, 'head_y': 4.5 * t_ + 2 * pw, 'spine_z': 7 * lk,
             'armL_up': 108 * pw, 'armL_x': 36 * pw, 'pawL_x': -30 * pw, 'pawL_y': 15 * pw}
        P.update(ears(fwd=10 * lk, side=-3 * t_, e=e))
        return tail(P, f, 6 + 10 * pw, 11, lift=3 + 5 * pw, tl=tl)
    face = lambda f: face_of(curious=T([(1, 0), (6, 0), (12, 1), (26, 1), (29, 0), (73, 0)])(f), surprised=T([(1, 0), (27, 0), (29, 0.8), (32, 0), (73, 0)])(f),
                             happy=T([(1, 0), (30, 0), (34, 1), (44, 1), (48, 0), (73, 0)])(f), smile=T([(1, 0), (44, 0), (48, 1), (64, 1), (70, 0), (73, 0)])(f),
                             blink_extra=blink_curve(f, [20, 58]))
    m = G.run_clip('photo_reaction', N, pose, face, rz=rz, sq=sq, ground=grounded(rz))
    m['cues'] = [{'t': fr(3), 'fx': 'prop.show', 'prop': 'photo_frame', 'mode': 'pop', 'note': 'blank reusable frame; the picture is application data'},
                 {'t': fr(40), 'fx': 'prop.phase', 'prop': 'photo_frame', 'phase': 'shine'},
                 {'t': fr(42), 'fx': 'hearts.float', 'at': 'photo_frame', 'count': 4},
                 {'t': fr(46), 'fx': 'sparkle.soft', 'at': 'photo_frame', 'count': 5},
                 {'t': fr(62), 'fx': 'prop.hide', 'prop': 'photo_frame', 'mode': 'fade'}]
    return m


def receive_like():
    """Short and frequent: a heart pops up at the fox's right, it reaches for it, the heart pops into little hearts,
    a happy playful bounce."""
    N = 49
    look = T([(1, 0), (3, 0), (9, 1), (24, 1), (30, 0), (49, 0)])
    reach = T([(1, 0), (8, 0), (17, 1), (22, 1), (30, 0), (49, 0)])
    rz = lambda f: bounce(f, 24, 31, 0.03)
    sq = T([(1, 0), (21, 0), (23, 0.04), (25, -0.02), (31, 0.035), (34, 0), (49, 0)])

    def pose(f, rzv, sqv, e, tl):
        lk, r = look(f), reach(f)
        P = {'head_z': -20 * lk, 'head_x': -4 * lk, 'head_y': -2 * lk, 'spine_z': -6 * lk,
             'armR_up': 112 * r, 'armR_x': 38 * r, 'pawR_x': -30 * r}
        P.update(ears(fwd=11 * lk, e=e))
        return tail(P, f, 6 + 12 * T([(1, 0), (20, 0), (24, 1), (40, 1), (46, 0), (49, 0)])(f), 9, lift=4, tl=tl)
    face = lambda f: face_of(surprised=T([(1, 0), (2, 0), (5, 0.6), (10, 0), (49, 0)])(f), happy=T([(1, 0), (19, 0), (22, 1), (36, 1), (42, 0), (49, 0)])(f),
                             smile=T([(1, 0), (36, 0), (40, 1), (49, 0)])(f))
    m = G.run_clip('receive_like', N, pose, face, rz=rz, sq=sq, ground=grounded(rz))
    m['cues'] = [{'t': fr(2), 'fx': 'prop.show', 'prop': 'heart', 'mode': 'pop'},
                 {'t': fr(10), 'fx': 'prop.phase', 'prop': 'heart', 'phase': 'to_paw'},
                 {'t': fr(20), 'fx': 'prop.hide', 'prop': 'heart', 'mode': 'burst', 'note': 'heart pop'},
                 {'t': fr(20), 'fx': 'hearts.float', 'at': 'hand_r', 'count': 3}]
    return m


def receive_comment():
    """A chat bubble with typing dots appears at the fox's left (no text ever): curious look, leans in, nods with a
    smile as the dots finish (highlight), gestures toward the bubble."""
    N = 61
    look = T([(1, 0), (3, 0), (11, 1), (50, 1), (56, 0), (61, 0)])
    lean = T([(1, 0), (12, 0), (22, 1), (34, 1), (42, 0.3), (50, 0), (61, 0)])
    nod = lambda f: (math.sin(2 * math.pi * (f - 28) / 6) if 28 <= f <= 40 else 0.0)
    gest = T([(1, 0), (36, 0), (44, 1), (50, 1), (57, 0), (61, 0)])

    def pose(f, rzv, sqv, e, tl):
        lk, ln, g = look(f), lean(f), gest(f)
        P = {'head_z': 20 * lk, 'head_y': 3 * lk, 'head_x': -2 * ln + 3.5 * nod(f), 'spine_x': 5 * ln, 'spine_z': 6 * lk, 'hips_x': 2 * ln,
             'armL_up': 95 * g, 'armL_x': 40 * g, 'pawL_x': -40 * g}
        P.update(ears(fwd=8 * lk, side=-2 * lk, e=e))
        return tail(P, f, 5 + 6 * g, 12, lift=3 + 3 * g, tl=tl)
    face = lambda f: face_of(curious=T([(1, 0), (3, 0), (10, 1), (26, 1), (30, 0), (61, 0)])(f), smile=T([(1, 0), (26, 0), (32, 1), (54, 1), (60, 0), (61, 0)])(f),
                             blink_extra=blink_curve(f, [22]))
    m = G.run_clip('receive_comment', N, pose, face, ground=grounded(None))
    m['cues'] = [{'t': fr(2), 'fx': 'prop.show', 'prop': 'chat_bubble', 'mode': 'pop', 'note': 'no comment text in 3D; text stays in the application UI'},
                 {'t': fr(3), 'fx': 'prop.phase', 'prop': 'chat_bubble', 'phase': 'typing'},
                 {'t': fr(30), 'fx': 'prop.phase', 'prop': 'chat_bubble', 'phase': 'done'},
                 {'t': fr(32), 'fx': 'highlight', 'at': 'chat_bubble', 'duration': 0.6},
                 {'t': fr(52), 'fx': 'prop.hide', 'prop': 'chat_bubble', 'mode': 'fade'}]
    return m


def friend_support():
    """Quieter and closer than team_encourage: a concerned look straight at the viewer, the paw slowly to the chest
    (soft heart glow), a gentle reassuring palm-up gesture, one slow comforting nod, a gentle smile, outward pulse."""
    N = 85
    concern = T([(1, 0), (4, 0), (16, 1), (48, 1), (58, 0.3), (85, 0.3)])
    chest = T([(1, 0), (12, 0), (28, 1), (40, 1), (48, 0.2), (85, 0)])
    reach = T([(1, 0), (34, 0), (48, 1), (62, 1), (72, 0), (85, 0)])
    nod = T([(1, 0), (50, 0), (56, 1), (62, 0), (85, 0)])
    sq = T([(1, 0), (20, 0), (28, -0.01), (36, 0), (85, 0)])

    def pose(f, rzv, sqv, e, tl):
        c, ch, r = concern(f), chest(f), reach(f)
        P = {'head_x': 4 * c + 5 * nod(f), 'head_y': -3 * c, 'head_z': 0.0,
             'armL_up': 80 * ch, 'armL_x': 38 * ch, 'pawL_x': -50 * ch,
             'armR_up': 55 * r, 'armR_x': 45 * r, 'pawR_x': -30 * r, 'spine_x': 4 * r + 2 * c}
        P.update(ears(fwd=2 * r, out=5 * c, e=e))
        return tail(P, f, 3 + 2 * r, 20, lift=1 + 2 * r, tl=tl)
    face = lambda f: face_of(concerned=T([(1, 0), (4, 0), (16, 0.9), (46, 0.9), (56, 0.2), (85, 0)])(f), gentle=T([(1, 0), (50, 0), (60, 1), (80, 1), (85, 0)])(f),
                             blink_extra=blink_curve(f, [24, 44, 70]))
    m = G.run_clip('friend_support', N, pose, face, sq=sq, ground=grounded(None))
    m['cues'] = [{'t': fr(22), 'fx': 'glow.warm', 'at': 'chest', 'until': fr(60), 'note': 'soft heart glow'},
                 {'t': fr(40), 'fx': 'hearts.float', 'at': 'hand_r', 'count': 3, 'note': 'warm particles (fewer, slower than team_encourage)'},
                 {'t': fr(62), 'fx': 'pulse.gentle', 'at': 'chest', 'duration': 0.9}]
    return m


def friend_miss_you():
    """Looks around for someone, ears droop a little, finds a small friend icon, holds it close to the chest for a
    moment (it glows, a heart floats up), the icon fades with a returning sparkle; a hopeful smile and a small wave."""
    N = 85
    search = T([(1, 0), (3, 0), (8, 1), (12, 1), (16, -1), (20, -1), (24, 0), (85, 0)])
    droop = T([(1, 0), (18, 0), (26, 1), (52, 1), (60, 0), (85, 0)])
    hold = T([(1, 0), (28, 0), (36, 1), (50, 1), (56, 0), (85, 0)])
    wave_on = T([(1, 0), (58, 0), (64, 1), (74, 1), (80, 0), (85, 0)])

    def pose(f, rzv, sqv, e, tl):
        s, d, h, w = search(f), droop(f), hold(f), wave_on(f)
        osc = math.sin(2 * math.pi * (f - 64) / 8) * w
        P = {'head_z': 18 * s, 'head_x': 2 * d + 7 * h, 'head_y': 2 * s, 'spine_z': 5 * s, 'spine_x': 3 * h,
             'armL_up': 80 * h, 'armL_x': 45 * h, 'pawL_x': -45 * h,
             'armR_up': 80 * h + 100 * w, 'armR_x': 45 * h + 18 * w + 8 * osc, 'pawR_x': -45 * h - 15 * w + 22 * osc}
        P.update(ears(fwd=6 * abs(s) - 2 * d + 8 * w, out=7 * d, side=4 * s, e=e))
        return tail(P, f, 3 + 6 * w, 16, lift=-4 * d + 4 * w, tl=tl)
    face = lambda f: face_of(curious=T([(1, 0), (2, 0), (6, 0.8), (22, 0.8), (26, 0), (85, 0)])(f), concerned=T([(1, 0), (20, 0), (26, 0.6), (34, 0.6), (38, 0), (85, 0)])(f),
                             gentle=T([(1, 0), (34, 0), (40, 1), (52, 1), (58, 0), (85, 0)])(f), hopeful=T([(1, 0), (54, 0), (60, 1), (78, 1), (84, 0), (85, 0)])(f),
                             blink_extra=blink_curve(f, [42, 70]))
    m = G.run_clip('friend_miss_you', N, pose, face, ground=grounded(None))
    m['cues'] = [{'t': fr(24), 'fx': 'prop.show', 'prop': 'friend_icon', 'mode': 'fade', 'note': 'generic friend symbol (never a user avatar)'},
                 {'t': fr(30), 'fx': 'prop.phase', 'prop': 'friend_icon', 'phase': 'hold'},
                 {'t': fr(38), 'fx': 'prop.phase', 'prop': 'friend_icon', 'phase': 'glow'},
                 {'t': fr(44), 'fx': 'hearts.float', 'at': 'friend_icon', 'count': 2},
                 {'t': fr(54), 'fx': 'prop.hide', 'prop': 'friend_icon', 'mode': 'fade'},
                 {'t': fr(58), 'fx': 'sparkle.return', 'at': 'chest', 'count': 6}]
    return m


# ================================================================== registry
CATEGORIES = {
    'challenge': ['challenge_invite', 'challenge_accept', 'challenge_start', 'challenge_win', 'challenge_lose', 'challenge_draw'],
    'duo_group': ['duo_celebrate', 'duo_celebrate_mirror', 'group_victory', 'team_encourage', 'group_streak_active', 'group_streak_lost'],
    'social': ['friend_greet', 'photo_reaction', 'receive_like', 'receive_comment', 'friend_support', 'friend_miss_you'],
}
BUILDERS = {n: globals()[n] for c in CATEGORIES.values() for n in c}
LARGE_MOTION = {'challenge_start', 'challenge_win', 'duo_celebrate', 'duo_celebrate_mirror', 'group_victory', 'group_streak_active'}
EVENT_OF = {'challenge_invite': 'CHALLENGE_INVITED', 'challenge_accept': 'CHALLENGE_ACCEPTED', 'challenge_start': 'CHALLENGE_STARTED',
            'challenge_win': 'CHALLENGE_WON', 'challenge_lose': 'CHALLENGE_LOST', 'challenge_draw': 'CHALLENGE_DRAW',
            'duo_celebrate': 'DUO_CELEBRATION', 'duo_celebrate_mirror': 'DUO_CELEBRATION', 'group_victory': 'GROUP_VICTORY',
            'team_encourage': 'TEAM_ENCOURAGEMENT', 'group_streak_active': 'GROUP_STREAK_ACTIVE', 'group_streak_lost': 'GROUP_STREAK_LOST',
            'friend_greet': 'FRIEND_GREETING', 'photo_reaction': 'PHOTO_REACTION', 'receive_like': 'SOCIAL_LIKE_RECEIVED',
            'receive_comment': 'SOCIAL_COMMENT_RECEIVED', 'friend_support': 'FRIEND_SUPPORT', 'friend_miss_you': 'FRIEND_MISS_YOU'}
VARIANT_OF = {'duo_celebrate_mirror': 'duo_celebrate'}
ANCHOR_FRAMES = {   # prop / VFX anchors measured on the posed rig (fx-root local = Fox local at level scale 1)
    'challenge_token_paw': ('challenge_invite', 30, 'ATT_HAND_L'),
    'challenge_token_present': ('challenge_invite', 44, 'ATT_HAND_L'),
    'trophy_paw': ('challenge_win', 64, 'ATT_HAND_L'),
    'photo_paw': ('photo_reaction', 48, 'ATT_HAND_L'),
    'heart_paw': ('receive_like', 19, 'ATT_HAND_R'),
    'chat_paw': ('receive_comment', 46, 'ATT_HAND_L'),
    'friend_icon_l': ('friend_miss_you', 42, 'ATT_HAND_L'),
    'friend_icon_r': ('friend_miss_you', 42, 'ATT_HAND_R'),
    'duo_contact_l': ('duo_celebrate', DUO_CONTACT_F, 'ATT_HAND_L'),
    'duo_contact_r': ('duo_celebrate_mirror', DUO_CONTACT_F, 'ATT_HAND_R'),
    'streak_flame_raised': ('group_streak_active', 30, 'ATT_HAND_L'),
    'encourage_reach': ('team_encourage', 64, 'ATT_HAND_R'),
}


def measure_anchors():
    rig = G.O_['FOX_RIG']
    sc = bpy.context.scene
    M = rig.matrix_world
    out = {}
    for key, (action, f, bone) in ANCHOR_FRAMES.items():
        if action not in bpy.data.actions:
            continue
        rig.animation_data.action = bpy.data.actions[action]
        sc.frame_set(f)
        v = M @ rig.pose.bones[bone].tail
        out[key] = {'pos': [round(v.x, 4), round(v.z, 4), round(-v.y, 4)], 'from': f'{action} f{f} {bone} tip', 'frame': 'fox root (three.js: +x fox left, +z front)'}
    return out


def main():
    only = [s for s in os.environ.get('FOX_CLIPS', '').split(',') if s]
    partial = bool(only) and os.path.exists(OUT) and os.path.exists(SPECF)
    bpy.ops.wm.open_mainfile(filepath=OUT if partial else A.SRC)
    if partial:
        for n in only:
            if n in bpy.data.actions:
                bpy.data.actions.remove(bpy.data.actions[n])
    G.O_ = bpy.data.objects
    G.R_ = A.Rig(G.O_['FOX_RIG'])
    G._BODY = None
    G._REST = None
    subs = [m for o in G.O_ for m in o.modifiers if m.type == 'SUBSURF' and m.show_viewport]
    for m in subs:
        m.show_viewport = False
    clips = {}
    for cat, names in CATEGORIES.items():
        for n in names:
            if only and n not in only:
                continue
            m = BUILDERS[n]()
            m.setdefault('start_pose', 'rest')
            m.setdefault('end_pose', 'rest')
            clips[n] = dict(m, category=cat, role='variant of ' + VARIANT_OF[n] if n in VARIANT_OF else 'one-shot', head_control=1.0, face_control=1.0,
                            large_motion=n in LARGE_MOTION, event=EVENT_OF[n])
            print(f'  {n:24s} {m["frames"]:4d} f  {m["duration_s"]:.3f} s  ground={len(G.GROUND_LOG.get(n, []))}', flush=True)
    anchors = measure_anchors()
    rig = G.O_['FOX_RIG']
    rig.animation_data.action = None
    for n in A.FACE_PARTS:
        ad = G.O_[n].data.shape_keys.animation_data
        if ad:
            ad.action = None
        for kb in G.O_[n].data.shape_keys.key_blocks[1:]:
            kb.value = 0.0
    for pb in rig.pose.bones:
        pb.matrix_basis.identity()
    for m in subs:
        m.show_viewport = True
    bpy.context.scene['fox_gate'] = 'G3 challenge, duo / group & private social'
    os.makedirs(MOD_DIR, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
    spec = {
        'asset': 'LifeQuest Fox V2', 'gate': 'G3', 'module': 'g3_challenge_social', 'module_version': 'g3', 'fps': FPS,
        'source_rig': '03_RIG/fox_rig_d1_1.blend', 'base_animation_set': '06_EXPORTS/glb/fox_v2_anim_e2.glb (E2 core clips, unchanged)',
        'pipeline': 'anim_g2_1.py (imported, unchanged): pose envelope, sit drive, resolver vs approved E2 + G1 + G1.1 limits, ground solve; '
                    'G3 adds the RAW leg stretch (hidden ring included) as a resolver limit',
        'requires_modules': ['g1_quest_reward_streak (optional: the group streak clips use its flame / streak_active loop when present)'],
        'resolver': G.RESOLVE_LOG, 'resolver_limits': G.LIMITS,
        'categories': CATEGORIES, 'clips': clips, 'prop_anchors': anchors,
        'ground_contact': {n: {'frames_corrected': len(v), 'max_abs_dz_m': max([abs(d) for _, d in v] or [0])} for n, v in G.GROUND_LOG.items()},
        'expressions_added': EXPRESSIONS_ADDED,
        'cue_note': 'cues are runtime VFX / prop timeline entries (seconds from clip start); props are FX_PROP_* objects owned by the effects '
                    'manager, never part of the Fox mesh, skeleton, materials or cosmetics. Countdown values, teammates, photos and comment '
                    'text are application data.',
        'duo_note': 'duo_celebrate (partner on the fox\'s left) and duo_celebrate_mirror (partner on the fox\'s right) share timing and '
                    'contact frame; FoxDuoCoordinator positions both foxes from prop_anchors.duo_contact_* so the paws meet.',
    }
    if partial:
        old = json.load(open(SPECF))
        old['clips'].update(spec['clips']); old['resolver'].update(spec['resolver']); old['prop_anchors'].update(spec['prop_anchors'])
        for n, v in spec['ground_contact'].items():
            old['ground_contact'][n] = v
        spec = old
    json.dump(spec, open(SPECF, 'w'), indent=2)
    print('anchors', json.dumps(anchors))
    print('saved', OUT)


if __name__ == '__main__':
    main()
