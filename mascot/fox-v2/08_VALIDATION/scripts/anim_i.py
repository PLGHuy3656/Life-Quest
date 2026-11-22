"""Gate I — Voice Assistant & Task Creation animations (8 clips: 3 looping states + 5 one-shots).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/anim_i.py   (subset: FOX_CLIPS=a,b)
Reads   03_RIG/fox_rig_d1_1.blend  (canonical approved rig — never written; no rig / weight / morph change)
Writes  04_ANIMATIONS/i_voice_assistant/fox_anim_i.blend + anim_spec_i.json

Built on the G2.1 pipeline (anim_g2_1.py is imported, never modified): the same pose envelope,
heel-plant sit drive, per-frame BVH cage collision / stretch resolver against the approved E2 + G1 + G1.1
limits, ground contact solve, and exact clip <-> loop boundary snapping.

Clips (8):
  Looping states (3):
    - voice_listening_loop   (96 f / 4.000 s)  attentive standing listening loop
    - voice_processing       (96 f / 4.000 s)  thoughtful standing processing loop
    - task_notebook_write    (120 f / 5.000 s) seated task-writing loop (reuses G2.1 notebook + pencil)
  One-shots (5):
    - voice_listen_start     (36 f / 1.500 s)  rest -> voice_listening_loop
    - task_suggestion        (66 f / 2.750 s)  rest -> rest (presenting an idea / task suggestion)
    - task_notebook_open     (54 f / 2.250 s)  rest -> task_notebook_write (sits, opens notebook, takes pencil)
    - task_notebook_confirm  (78 f / 3.250 s)  task_notebook_write -> rest (app-triggered TASK_CREATED only!)
    - voice_retry            (60 f / 2.500 s)  rest -> rest (friendly puzzled tilt -> encouraging nod)
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
import anim_g1 as G1  # noqa: E402
import anim_g2_1 as G  # noqa: E402
import anim_check_g2_1 as CK  # noqa: E402

T, clamp = E.T, E.clamp
blink_curve, FPS, Q = A.blink_curve, A.FPS, A.Q
wag, ears_of, face_of, fr = G1.wag, G1.ears_of, G1.face_of, G1.fr
ease, blend, add, per = G.ease, G.blend, G.add, G.per
SIT = G.SIT

MOD_DIR = os.path.join(A.OUT_DIR, 'i_voice_assistant')
OUT = os.path.join(MOD_DIR, 'fox_anim_i.blend')
SPECF = os.path.join(MOD_DIR, 'anim_spec_i.json')

# ------------------------------------------------------------------ Gate I expressions (existing D1.1 morphs only)
EYES, BROWS = ['FOX_Eye_L', 'FOX_Eye_R'], ['FOX_Brow_L', 'FOX_Brow_R']
SMILE = {'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_Smile': {'show': 1}}
A.EXPR.update({
    'attentive': {**{e: {'Wide': 0.25} for e in EYES}, **SMILE},
    'curious': {**{e: {'Wide': 0.35} for e in EYES}, 'FOX_Brow_L': {'Proud': 0.45},
                'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_SmallO': {'show': 1}},
    'hopeful': {**{e: {'Wide': 0.2} for e in EYES}, **{b: {'Sad': 0.3} for b in BROWS}, **SMILE},
    'concerned': {**{e: {'Sad': 0.4} for e in EYES}, **{b: {'Sad': 0.65} for b in BROWS}},
    'gentle': {**{e: {'HalfLid': 0.3} for e in EYES}, **SMILE},
    'thinking': {**{e: {'HalfLid': 0.35} for e in EYES}, 'FOX_Brow_L': {'Sad': 0.25}, 'FOX_Brow_R': {'Proud': 0.35},
                 'FOX_Mouth_Neutral': {'hide': 1}, 'FOX_Mouth_SmallO': {'show': 1}},
})
EXPRESSIONS_ADDED = ['attentive', 'curious', 'hopeful', 'concerned', 'gentle', 'thinking']

# Register Gate I clip <-> loop boundary snapping
G.LOOP_OF.update({
    'voice_listen_start': (None, 'voice_listening_loop'),
    'task_notebook_open': (None, 'task_notebook_write'),
    'task_notebook_confirm': ('task_notebook_write', None),
})


def ears(fwd=0.0, out=0.0, side=0.0, e=0.0, l_fwd=None, r_fwd=None):
    """Ear channels inside the approved E2 envelope."""
    lf = fwd if l_fwd is None else l_fwd
    rf = fwd if r_fwd is None else r_fwd
    return {
        'earL_fwd': clamp(lf - 0.3 * e, -3, 12),
        'earR_fwd': clamp(rf - 0.3 * e, -3, 12),
        'earL_out': clamp(out + 0.8 * e - side, -6, 11),
        'earR_out': clamp(out + 0.8 * e + side, -6, 11),
    }


def tail_wave(P, f, L, amp, cycles=2, lift=4.0):
    for t in range(4):
        P[f'tail_sway{t}'] = clamp(amp * per(f, L, cycles, -0.65 * t), -20, 20)
    P['tail_lift'] = clamp(lift, -10, 10)
    return P


# ================================================================== 1. VOICE LISTENING (loop + start)
def voice_listening_pose(f):
    """Attentive listening loop (1..97, period 96 f = 4.0 s):
    slight forward lean, ears perked forward toward speaker, subtle responsive nods & ear twitches,
    paws gathered gently in front, warm tail sway."""
    L = 96
    br = per(f, L, 2)
    nod1 = T([(1, 0), (18, 0), (24, 1), (30, -0.3), (36, 0), (97, 0)])(f)
    nod2 = T([(1, 0), (62, 0), (68, 0.85), (74, -0.2), (80, 0), (97, 0)])(f)
    twitch = T([(1, 0), (42, 0), (45, 1), (49, 0), (97, 0)])(f)
    sway = per(f, L, 1)
    P = {
        'squash': 0.008 * br,
        'hips_y': 1.2 * sway,
        'spine_x': 4.0 + 1.2 * br,
        'spine_y': 1.5 * sway,
        'head_x': -2.5 + 4.5 * (nod1 + nod2) - 0.8 * br,
        'head_y': 3.5 + 1.0 * sway,
        'head_z': -3.0 + 2.0 * sway,
        'armL_up': 14.0 + 2.0 * br,
        'armR_up': 14.0 + 2.0 * br,
        'armL_x': -24.0,
        'armR_x': -24.0,
        'pawL_x': -26.0,
        'pawR_x': -26.0,
        'flap_out': 2.0 + 1.0 * br,
    }
    P.update(ears(fwd=8.5, out=-2.5, side=-1.5, l_fwd=8.5, r_fwd=10.5 + 1.5 * twitch))
    tail_wave(P, f, L, 11.0, cycles=2, lift=5.0 + 1.5 * br)
    return P


def voice_listening_loop():
    N = 97
    m = G.run_clip(
        'voice_listening_loop', N,
        lambda f, rzv, sqv, e, tl: voice_listening_pose(f),
        lambda f: face_of(attentive=0.9, blink_extra=blink_curve(f, [32, 78])),
        cyclic=True, ground=lambda f: 'contact',
    )
    m['cues'] = []
    m['state_fx'] = ['voice.waves']
    return m


def voice_listen_start():
    """Snappy attentive transition from rest into voice_listening_loop (37 f -> 36 f = 1.500 s):
    ears perk sharply forward, small eager chest lift, head tilts toward the user, settles into
    voice_listening_loop frame 1."""
    N = 37
    perk = T([(1, 0), (5, 0), (11, 1), (18, 0.7), (26, 0), (37, 0)])
    trans = T([(1, 0), (6, 0), (24, 1), (37, 1)])
    target = voice_listening_pose(1)

    def pose(f, rzv, sqv, e, tl):
        p = perk(f)
        w = ease(trans(f))
        intro = {
            'squash': 0.025 * p,
            'spine_x': -2.5 * p,
            'head_x': -6.0 * p,
            'head_y': 4.0 * p,
            'head_z': -5.0 * p,
            'armL_up': 20.0 * p,
            'armR_up': 20.0 * p,
            'armL_x': -18.0 * p,
            'armR_x': -18.0 * p,
            'pawL_x': -22.0 * p,
            'pawR_x': -22.0 * p,
            'tail_lift': 8.0 * p,
        }
        intro.update(ears(fwd=11.5 * p, out=-3.5 * p, e=e))
        for t in range(4):
            intro[f'tail_sway{t}'] = wag(f, 12.0 * p, 12, t)
        P = blend(intro, target, w)
        return P

    m = G.run_clip(
        'voice_listen_start', N, pose,
        lambda f: face_of(
            curious=0.6 * T([(1, 0), (4, 0), (10, 1), (18, 0), (37, 0)])(f),
            attentive=0.9 * ease(T([(1, 0), (12, 0), (24, 1), (37, 1)])(f)),
            blink_extra=blink_curve(f, [20]),
        ),
        ends=('rest', 'loop'), ground=lambda f: 'contact',
    )
    m['cues'] = [
        {'t': fr(5), 'fx': 'voice.ping', 'at': 'head_top', 'duration': 0.75},
        {'t': fr(9), 'fx': 'sparkle.soft', 'at': 'head', 'count': 6},
    ]
    m['end_pose'] = 'voice_listening_loop'
    return m


# ================================================================== 2. VOICE PROCESSING (loop)
def voice_processing_pose(f):
    """Thoughtful processing loop (1..97, period 96 f = 4.0 s):
    standing, right paw raised in a thinking pose near the chin (clear of head cage),
    left paw resting at front, gentle contemplative head sway and alternating ear twitches."""
    L = 96
    br = per(f, L, 2)
    sway = per(f, L, 1)
    ear_l = T([(1, 0), (20, 0), (24, 1), (30, 0), (97, 0)])(f)
    ear_r = T([(1, 0), (62, 0), (66, 1), (72, 0), (97, 0)])(f)
    tap = per(f, L, 4)
    P = {
        'squash': 0.006 * br,
        'hips_y': 1.5 * sway,
        'spine_x': -2.0 + 1.0 * br,
        'spine_y': -2.5 + 2.0 * sway,
        'head_x': -7.0 + 1.5 * br,
        'head_y': -3.5 + 1.5 * sway,
        'head_z': 6.0 * sway,
        'armL_up': -8.0,
        'armL_x': -18.0,
        'pawL_x': -18.0,
        'armR_up': 68.0 + 4.0 * tap,
        'armR_x': 26.0 + 2.0 * br,
        'pawR_x': -46.0 + 4.0 * tap,
        'pawR_y': -8.0,
        'flap_out': 1.5,
    }
    P.update(ears(fwd=3.0, out=3.5, l_fwd=3.0 + 5.0 * ear_l, r_fwd=3.0 + 5.0 * ear_r))
    tail_wave(P, f, L, 7.5, cycles=1, lift=2.0 + 1.0 * br)
    return P


def voice_processing():
    N = 97
    m = G.run_clip(
        'voice_processing', N,
        lambda f, rzv, sqv, e, tl: voice_processing_pose(f),
        lambda f: face_of(thinking=0.85, blink_extra=blink_curve(f, [28, 72])),
        cyclic=True, ground=lambda f: 'contact',
    )
    m['cues'] = []
    m['state_fx'] = ['voice.thinking']
    return m


# ================================================================== 3. TASK SUGGESTION (one-shot)
def task_suggestion():
    """'Aha! Here is a task suggestion!' (67 f -> 66 f = 2.750 s):
    ears perk high on an 'aha' beat, small bright lift, right paw presents outward toward the
    suggestion card with an inviting open gesture, warm proud smile + confirming nod -> rest."""
    N = 67
    aha = T([(1, 0), (6, 0), (12, 1), (20, 0.8), (30, 0), (67, 0)])
    present = T([(1, 0), (14, 0), (22, 1), (46, 1), (58, 0), (67, 0)])
    nod = T([(1, 0), (30, 0), (35, 1), (40, -0.3), (45, 0), (67, 0)])
    lift = T([(1, 0), (10, 0), (14, 0.018), (19, 0), (67, 0)])
    sq = T([(1, 0), (7, 0), (10, 0.04), (14, -0.025), (19, 0.03), (24, 0), (67, 0)])

    def pose(f, rzv, sqv, e, tl):
        a, pr, nd = aha(f), ease(present(f)), nod(f)
        P = {
            'root_z': lift(f),
            'squash': sq(f),
            'spine_x': -3.5 * a - 2.0 * pr,
            'spine_z': -5.0 * pr,
            'head_x': -6.0 * a - 2.0 * pr + 5.5 * nd,
            'head_y': 3.5 * pr,
            'head_z': -4.0 * pr,
            'armL_up': 16.0 * a + 10.0 * pr,
            'armL_x': -16.0 * pr,
            'pawL_x': -18.0 * pr,
            'armR_up': 35.0 * a + 54.0 * pr,
            'armR_x': -24.0 * pr,
            'pawR_x': 12.0 * pr,
            'pawR_y': 10.0 * pr,
            'tail_lift': 9.0 * max(a, pr) + 0.5 * tl,
        }
        P.update(ears(fwd=11.0 * a + 7.5 * pr, out=-3.0 * max(a, pr), e=e))
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, 16.0 * max(a, pr), 11, t)
        return P

    m = G.run_clip(
        'task_suggestion', N, pose,
        lambda f: face_of(
            surprised=0.6 * T([(1, 0), (6, 0), (11, 1), (18, 0), (67, 0)])(f),
            proud=0.85 * T([(1, 0), (18, 0), (24, 1), (46, 1), (56, 0), (67, 0)])(f),
            smile=0.7 * T([(1, 0), (46, 0), (54, 0.8), (62, 0), (67, 0)])(f),
            blink_extra=blink_curve(f, [28, 52]),
        ),
        ends=('rest', 'rest'), ground=lambda f: 'floor' if lift(f) > 1e-4 else 'contact',
    )
    m['cues'] = [
        {'t': fr(12), 'fx': 'voice.idea', 'at': 'head_top', 'duration': 1.1},
        {'t': fr(22), 'fx': 'sparkle.soft', 'at': 'hand_r', 'count': 8},
    ]
    return m


# ================================================================== 4. TASK NOTEBOOK (write loop, open, confirm)
def task_write_pose(f):
    """Seated task-jotting loop (1..121, period 120 f = 5.0 s).
    Reuses exact SIT reference from G2.1 so NotebookProp and PencilProp align identically.
    Rhythm: brisk writing burst -> brief attentive glance up at user -> second writing burst -> tidy check."""
    L = 120
    br = per(f, L, 2)
    write1 = T([(1, 0), (8, 0), (14, 1), (50, 1), (56, 0), (121, 0)])(f)
    glance = T([(1, 0), (56, 0), (64, 1), (76, 1), (82, 0), (121, 0)])(f)
    write2 = T([(1, 0), (80, 0), (86, 1), (110, 1), (116, 0), (121, 0)])(f)
    writing = max(write1, write2)
    scrib = math.sin(2 * math.pi * (f - 1) / 5.0) * writing
    line = math.sin(2 * math.pi * (f - 1) / 30.0) * writing

    P = dict(SIT)
    P.update({
        'squash': 0.006 * br,
        'spine_x': 5.5 - 4.0 * glance + 1.0 * br,
        'hips_y': 0.8 * per(f, L, 1),
        'head_x': 7.5 - 12.0 * glance + 2.5 * writing + 1.0 * scrib,
        'head_z': 4.0 * line - 4.0 * glance,
        'head_y': 2.5 * line + 3.0 * glance,
        'armL_up': -15.0,
        'armL_x': -75.0 + 3.0 * glance,
        'pawL_x': -24.0,
        'armR_up': -14.0 + 6.0 * line + 20.0 * glance,
        'armR_x': -76.0 - 4.0 * writing + 14.0 * glance,
        'pawR_x': -30.0 + 9.0 * scrib - 10.0 * glance,
        'pawR_y': 0.0,
        'earL_fwd': 5.0 + 4.5 * glance + 2.0 * writing,
        'earR_fwd': 5.0 + 5.5 * glance + 2.0 * writing,
        'earL_out': 1.5 - 2.0 * glance,
        'earR_out': 1.5 - 2.0 * glance,
    })
    for t in range(4):
        P[f'tail_sway{t}'] = clamp(9.0 + 6.5 * per(f, L, 2, -0.7 * t), -20, 20)
    return P


def task_notebook_write():
    N = 121
    glance = T([(1, 0), (56, 0), (64, 1), (76, 1), (82, 0), (121, 0)])
    m = G.run_clip(
        'task_notebook_write', N,
        lambda f, rzv, sqv, e, tl: task_write_pose(f),
        lambda f: face_of(
            focus=0.75 * (1 - glance(f)),
            attentive=0.85 * glance(f),
            smile=0.25 * (1 - glance(f)),
            blink_extra=blink_curve(f, [36, 92]),
        ),
        cyclic=True, ground=lambda f: 'contact',
    )
    m['cues'] = []
    m['state_fx'] = ['focus.particles']
    return m


def task_notebook_open():
    """Sits down smoothly, pops in NotebookProp, opens cover, takes PencilProp, ready nod -> task_notebook_write f1.
    55 f -> 54 f = 2.250 s."""
    N = 55
    ready = T([(1, 0), (4, 0), (9, 1), (15, 0.5), (20, 0), (55, 0)])
    sit = T([(1, 0), (14, 0), (30, 1), (55, 1)])
    crouch = T([(1, 0), (10, 0), (14, 0.04), (22, 0.02), (30, 0.03), (34, -0.01), (38, 0), (55, 0)])
    open_ = T([(1, 0), (32, 0), (41, 1), (55, 1)])
    nod = T([(1, 0), (44, 0), (47, 5.5), (50, -1.5), (55, 0)])
    target = task_write_pose(1)

    def pose(f, rzv, sqv, e, tl):
        n, s, o = ready(f), ease(sit(f)), open_(f)
        stand = {
            'head_x': -5.0 * n,
            'head_y': 3.5 * n,
            'spine_x': -2.0 * n,
            'armL_up': 16.0 * n,
            'armR_up': 16.0 * n,
            'pawL_x': -18.0 * n,
            'pawR_x': -18.0 * n,
            'tail_lift': 6.0 * n + 0.5 * tl,
        }
        stand.update(ears_of(e, 9.0 * n))
        for t in range(4):
            stand[f'tail_sway{t}'] = wag(f, 13.0 * n, 12, t)
        P = blend(stand, target, s)
        P = add(P, {'armL_up': 10.0 * math.sin(math.pi * o), 'armR_up': 10.0 * math.sin(math.pi * o), 'head_x': nod(f)})
        if s < 1:
            P['spine_x'] = P.get('spine_x', 0) + 10.0 * math.sin(math.pi * s)
        P['squash'] = crouch(f)
        return P

    m = G.run_clip(
        'task_notebook_open', N, pose,
        lambda f: face_of(
            attentive=0.8 * (1 - ease(T([(1, 0), (34, 0), (46, 1), (55, 1)])(f))),
            focus=0.6 * ease(T([(1, 0), (36, 0), (48, 1), (55, 1)])(f)),
            blink_extra=blink_curve(f, [26]),
        ),
        ends=('rest', 'loop'), ground=lambda f: 'contact',
    )
    m['cues'] = [
        {'t': fr(8), 'fx': 'prop.show', 'prop': 'notebook', 'mode': 'pop'},
        {'t': fr(34), 'fx': 'prop.phase', 'prop': 'notebook', 'phase': 'open'},
        {'t': fr(36), 'fx': 'prop.show', 'prop': 'pencil', 'mode': 'pop'},
        {'t': fr(41), 'fx': 'sparkle.soft', 'at': 'notebook', 'count': 6},
    ]
    m['end_pose'] = 'task_notebook_write'
    m['props_end'] = ['notebook', 'pencil']
    return m


def task_notebook_confirm():
    """Application-triggered ONLY (TASK_CREATED). Starts on task_notebook_write f1 (79 f -> 78 f = 3.250 s):
    crisp checkmark flourish with pencil (voice.check + sparkle), closes notebook, hides pencil,
    stands up smoothly, hides notebook, celebratory proud bounce -> rest."""
    N = 79
    check_ = T([(1, 0), (5, 0), (11, 1), (17, 0.3), (22, 0), (79, 0)])
    clap = T([(1, 0), (20, 0), (24, 1), (28, 0.25), (34, 0), (79, 0)])
    standup = T([(1, 0), (36, 0), (50, 1), (79, 1)])
    proud = T([(1, 0), (48, 0), (55, 1), (67, 1), (75, 0), (79, 0)])
    bounce = T([(1, 0), (54, 0), (58, 0.03), (62, 0), (79, 0)])
    sq = T([(1, 0), (50, 0), (53, 0.035), (57, -0.02), (61, 0.03), (65, 0), (79, 0)])
    src = task_write_pose(1)

    def pose(f, rzv, sqv, e, tl):
        ck, cl, u, pr = check_(f), clap(f), ease(standup(f)), proud(f)
        P = add(src, {
            'armR_up': 36.0 * ck,
            'armR_x': 18.0 * ck,
            'pawR_x': 28.0 * ck,
            'head_x': -8.0 * ck + 4.0 * cl,
            'head_y': 4.0 * ck,
            'armL_up': 8.0 * cl,
            'pawL_x': 12.0 * cl,
        })
        stand = {
            'spine_x': -4.5 * pr,
            'head_x': -5.5 * pr,
            'armL_up': 22.0 * pr,
            'armR_up': 22.0 * pr,
            'armL_x': -14.0 * pr,
            'armR_x': -14.0 * pr,
            'tail_lift': 10.0 * pr + 0.5 * tl,
        }
        stand.update(ears_of(e, 9.0 * pr))
        for t in range(4):
            stand[f'tail_sway{t}'] = wag(f, 18.0 * pr, 11, t)
        P = blend(P, stand, u)
        P['spine_x'] = P.get('spine_x', 0) + 15.0 * math.sin(math.pi * u)
        P['armL_x'] = P.get('armL_x', 0) + 18.0 * math.sin(math.pi * u)
        P['armR_x'] = P.get('armR_x', 0) + 18.0 * math.sin(math.pi * u)
        P['root_z'] = bounce(f)
        P['squash'] = sq(f)
        return P

    m = G.run_clip(
        'task_notebook_confirm', N, pose,
        lambda f: face_of(
            focus=0.5 * (1 - check_(f)) * (f < 12),
            happy=T([(1, 0), (14, 0), (20, 1), (42, 1), (48, 0), (79, 0)])(f),
            proud=proud(f),
            blink_extra=blink_curve(f, [46]),
        ),
        ends=('loop', 'rest'), ground=lambda f: 'contact' if f <= 53 else ('floor' if bounce(f) > 1e-4 else 'contact'),
    )
    m['cues'] = [
        {'t': fr(10), 'fx': 'voice.check', 'at': 'notebook', 'duration': 1.1},
        {'t': fr(11), 'fx': 'sparkle.soft', 'at': 'hand_r', 'count': 6},
        {'t': fr(24), 'fx': 'prop.phase', 'prop': 'notebook', 'phase': 'close'},
        {'t': fr(26), 'fx': 'burst.stars', 'at': 'notebook', 'count': 10},
        {'t': fr(29), 'fx': 'prop.hide', 'prop': 'pencil', 'mode': 'poof'},
        {'t': fr(46), 'fx': 'prop.hide', 'prop': 'notebook', 'mode': 'poof'},
        {'t': fr(56), 'fx': 'sparkle', 'at': 'head', 'count': 10},
    ]
    m['start_pose'] = 'task_notebook_write'
    m['props_start'] = ['notebook', 'pencil']
    return m


# ================================================================== 5. VOICE RETRY (one-shot)
def voice_retry():
    """Friendly, encouraging retry reaction (61 f -> 60 f = 2.500 s):
    gentle puzzled head tilt (asymmetric ears), right paw lifts near ear in a 'come again?' beat,
    then straightens with an encouraging nod and hopeful warm smile -> rest."""
    N = 61
    tilt = T([(1, 0), (6, 0), (14, 1), (32, 1), (40, 0), (61, 0)])
    nod = T([(1, 0), (38, 0), (43, 1), (48, -0.3), (53, 0), (61, 0)])
    encourage = T([(1, 0), (36, 0), (42, 1), (52, 1), (58, 0), (61, 0)])

    def pose(f, rzv, sqv, e, tl):
        ti, nd, en = ease(tilt(f)), nod(f), ease(encourage(f))
        P = {
            'squash': 0.015 * ti - 0.01 * nd,
            'spine_x': 3.0 * ti - 2.0 * en,
            'spine_y': 3.0 * ti,
            'head_x': -2.0 * ti + 6.0 * nd - 2.0 * en,
            'head_y': 4.5 * ti,
            'head_z': 7.5 * ti,
            'armL_up': 10.0 * ti + 12.0 * en,
            'armL_x': -14.0 * ti - 10.0 * en,
            'pawL_x': -18.0 * ti,
            'armR_up': 48.0 * ti + 16.0 * en,
            'armR_x': 12.0 * ti - 14.0 * en,
            'pawR_x': -32.0 * ti - 16.0 * en,
            'tail_lift': -2.0 * ti + 6.0 * en + 0.5 * tl,
        }
        P.update(ears(fwd=2.0 * ti + 7.5 * en, out=4.0 * ti - 2.0 * en, side=4.0 * ti, l_fwd=9.0 * ti + 7.5 * en, r_fwd=-1.5 * ti + 7.5 * en, e=e))
        for t in range(4):
            P[f'tail_sway{t}'] = wag(f, 7.0 * ti + 14.0 * en, 13, t)
        return P

    m = G.run_clip(
        'voice_retry', N, pose,
        lambda f: face_of(
            curious=0.8 * T([(1, 0), (6, 0), (14, 1), (32, 1), (38, 0), (61, 0)])(f),
            hopeful=0.9 * T([(1, 0), (36, 0), (42, 1), (54, 1), (60, 0), (61, 0)])(f),
            blink_extra=blink_curve(f, [24, 48]),
        ),
        ends=('rest', 'rest'), ground=lambda f: 'contact',
    )
    m['cues'] = [
        {'t': fr(10), 'fx': 'voice.retry_cue', 'at': 'head_top', 'duration': 1.1},
        {'t': fr(42), 'fx': 'sparkle.soft', 'at': 'head', 'count': 6},
    ]
    return m


# ================================================================== registry
CATEGORIES = {
    'voice_assistant': [
        'voice_listen_start',
        'voice_listening_loop',
        'voice_processing',
        'task_suggestion',
        'task_notebook_open',
        'task_notebook_write',
        'task_notebook_confirm',
        'voice_retry',
    ],
}
BUILDERS = {n: globals()[n] for c in CATEGORIES.values() for n in c}
ROLES = {
    'voice_listening_loop': ('state loop: voice listening (base clip)', 0.5, 0.6),
    'voice_processing': ('state loop: voice processing (base clip)', 1.0, 1.0),
    'task_notebook_write': ('state loop: voice task notebook writing (base clip)', 0.8, 0.6),
}
LARGE_MOTION = {'task_notebook_open', 'task_notebook_confirm'}
STATE_OF = {
    'voice_listening_loop': 'voice_listening',
    'voice_processing': 'voice_processing',
    'task_notebook_write': 'task_writing',
}


def measure_anchors():
    rig = G.O_['FOX_RIG']
    sc = bpy.context.scene
    M = rig.matrix_world

    def at(action, f, bone, tail=False):
        rig.animation_data.action = bpy.data.actions[action]
        sc.frame_set(f)
        pb = rig.pose.bones[bone]
        v = M @ (pb.tail if tail else pb.head)
        return [round(v.x, 4), round(v.z, 4), round(-v.y, 4)]

    a = {}
    if 'task_notebook_write' in bpy.data.actions:
        pl = at('task_notebook_write', 1, 'ATT_HAND_L', True)
        pr = at('task_notebook_write', 1, 'ATT_HAND_R', True)
        a['notebook_voice'] = {
            'pos': [round((pl[i] + pr[i]) / 2, 4) for i in range(3)],
            'frame': 'fox root',
            'from': 'task_notebook_write f1 paws midpoint',
            'paw_l': pl,
            'paw_r': pr,
        }
    if 'voice_listening_loop' in bpy.data.actions:
        a['voice_head'] = {
            'pos': at('voice_listening_loop', 1, 'ATT_HAT', False),
            'frame': 'fox root',
            'from': 'voice_listening_loop f1 ATT_HAT',
        }
    return a


def main():
    only = [s for s in os.environ.get('FOX_CLIPS', '').split(',') if s]
    partial = bool(only) and os.path.exists(OUT) and os.path.exists(SPECF)
    bpy.ops.wm.open_mainfile(filepath=OUT if partial else A.SRC)
    if partial:
        G.LOOP_F1_FAC.update(json.load(open(SPECF)).get('loop_f1_factors', {}))
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

    order = [n for c in CATEGORIES.values() for n in c]
    order = [n for n in order if n in STATE_OF] + [n for n in order if n not in STATE_OF]  # loops first!
    built = {}
    for n in order:
        if only and n not in only:
            continue
        built[n] = BUILDERS[n]()

    clips = {}
    for cat, names in CATEGORIES.items():
        for n in names:
            if n not in built:
                continue
            m = built[n]
            role, hc, fc = ROLES.get(n, ('one-shot', 1.0, 1.0))
            m.setdefault('start_pose', 'rest' if not m['loop'] else 'loop')
            m.setdefault('end_pose', 'rest' if not m['loop'] else 'loop')
            clips[n] = dict(
                m, category=cat, role=role, head_control=hc, face_control=fc,
                large_motion=n in LARGE_MOTION, state=STATE_OF.get(n),
            )
            print(f'  {n:24s} {m["frames"]:4d} f  {m["duration_s"]:.3f} s  loop={m["loop"]}  ground={len(G.GROUND_LOG.get(n, []))}', flush=True)

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

    bpy.context.scene['fox_gate'] = 'Gate I — Voice Assistant & Task Creation'
    os.makedirs(MOD_DIR, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)

    spec = {
        'asset': 'LifeQuest Fox V2',
        'gate': 'I',
        'module': 'i_voice_assistant',
        'module_version': 'i',
        'fps': FPS,
        'source_rig': '03_RIG/fox_rig_d1_1.blend',
        'base_animation_set': '06_EXPORTS/glb/fox_v2_anim_e2.glb (E2 core clips, unchanged)',
        'pipeline': 'anim_g2_1.py (imported, unchanged): pose envelope, sit drive, resolver vs approved E2 + G1 + G1.1 limits, ground solve, loop boundary snap',
        'requires_modules': [],
        'resolver': G.RESOLVE_LOG,
        'resolver_limits': G.LIMITS,
        'loop_f1_factors': {k: v for k, v in G.LOOP_F1_FAC.items() if k in STATE_OF},
        'categories': CATEGORIES,
        'clips': clips,
        'prop_anchors': anchors,
        'ground_contact': {n: {'frames_corrected': len(v), 'max_abs_dz_m': max([abs(d) for _, d in v] or [0])} for n, v in G.GROUND_LOG.items()},
        'expressions_added': EXPRESSIONS_ADDED,
        'cue_note': 'cues are runtime VFX / prop timeline entries (seconds from clip start); NotebookProp and PencilProp are reused from G2.1. task_notebook_confirm is only ever triggered by application TASK_CREATED.',
    }
    if partial:
        old = json.load(open(SPECF))
        old['clips'].update(spec['clips'])
        old['resolver'].update(spec['resolver'])
        old['prop_anchors'].update(spec['prop_anchors'])
        spec = old
    json.dump(spec, open(SPECF, 'w'), indent=2)
    print('anchors', json.dumps(anchors))
    print('saved', OUT)


if __name__ == '__main__':
    main()
