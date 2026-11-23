"""Probe candidate poses on the canonical rig: paw / head positions (three.js frame) and resolver violations."""
import sys, os, json
sys.path.insert(0, '/home/claude/g2/work/LifeQuest_Fox_V2/08_VALIDATION/scripts')
os.chdir('/home/claude/g2/work/LifeQuest_Fox_V2')
import bpy
import anim_e1 as A
import anim_g2_1 as G
bpy.ops.wm.open_mainfile(filepath=A.SRC)
G.O_ = bpy.data.objects; G.R_ = A.Rig(G.O_['FOX_RIG'])
for o in G.O_:
    for m in o.modifiers:
        if m.type == 'SUBSURF': m.show_viewport = False
rig = G.O_['FOX_RIG']; M = rig.matrix_world
def tj(v): v = M @ v; return [round(v.x, 3), round(v.z, 3), round(-v.y, 3)]
import anim_check_g2_1 as CK
def legraw():
    R0 = G._rest_cage()['snap']; cur = CK.snapshot(G.O_); out = {}
    for nm in ('FOX_Leg_L', 'FOX_Leg_R'):
        v0, v1 = R0['v'][nm], cur['v'][nm]
        raw = [abs((v1[a] - v1[b]).length / max(1e-9, (v0[a] - v0[b]).length) - 1) for a, b in R0['e'][nm]]
        out[nm[-1]] = round(G._p99(raw), 3)
    return out
import numpy as np
def hx():
    dg = bpy.context.evaluated_depsgraph_get(); out = {}
    for nm in ('FOX_Head', 'FOX_Ear_L', 'FOX_Body'):
        e = G.O_[nm].evaluated_get(dg); m = e.to_mesh(); n = len(m.vertices); co = np.empty(n * 3, np.float32); m.vertices.foreach_get('co', co); co = co.reshape(-1, 3)
        M_ = np.array(e.matrix_world); w = co @ M_[:3, :3].T + M_[:3, 3]; out[nm] = round(float(w[:, 0].max()), 4); e.to_mesh_clear()
    return out
POSES = json.loads(sys.argv[1])
k = A.Keyer('probe', G.O_)
for i, P in enumerate(POSES):
    G.key_pose(k, G.R_, i + 1, dict(P))
k.finish(1, len(POSES), cyclic=False)
rig.animation_data.action = k.act
for i, P in enumerate(POSES):
    bpy.context.scene.frame_set(i + 1)
    pb = rig.pose.bones
    out = {'pawL': tj(pb['ATT_HAND_L'].tail), 'pawR': tj(pb['ATT_HAND_R'].tail), 'shL': tj(pb['ARM_L'].head), 'shR': tj(pb['ARM_R'].head),
           'head': tj(pb['HEAD'].head), 'headTop': tj(pb['ATT_HAT'].head), 'chest': tj(pb['SPINE'].tail), 'zmin': round(G.body_min_z(), 4),
           'viol': G.frame_violations(i + 1), 'legraw': legraw(), 'tipL': tj(pb['ATT_HAND_L'].head), 'headMaxX': hx()}
    print('P%d' % i, json.dumps(out))
