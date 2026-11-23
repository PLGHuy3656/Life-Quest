import os, sys, json
S='/home/claude/g2/work/LifeQuest_Fox_V2/08_VALIDATION/scripts'; sys.path.insert(0,S)
import bpy, anim_e1 as A
Q=A.Q
POSES=json.loads(os.environ['POSES'])
bpy.ops.wm.open_mainfile(filepath=A.SRC)
O=bpy.data.objects; R=A.Rig(O['FOX_RIG']); sc=bpy.context.scene
for o in O:
    for m in o.modifiers:
        if m.type=='SUBSURF': m.show_viewport=False
k=A.Keyer('probe',O)
A.body_pose(k,R,1,{}); k.face(1,{})
for i,P in enumerate(POSES): A.body_pose(k,R,i+2,P); k.face(i+2,{})
k.finish(1,len(POSES)+1,False)
def verts(n):
    dg=bpy.context.evaluated_depsgraph_get(); e=O[n].evaluated_get(dg); m=e.to_mesh(); v=[e.matrix_world@x.co for x in m.vertices]; e.to_mesh_clear(); return v
sc.frame_set(1); r={s:verts(f'FOX_Leg_{s}') for s in 'LR'}
idx={s:[i for i,p in enumerate(r[s]) if p.z<min(q.z for q in r[s])+0.004] for s in 'LR'}
import statistics as st
def sole(f):
    sc.frame_set(f); out=[]
    for s in 'LR':
        v=verts(f'FOX_Leg_{s}'); pts=[v[i] for i in idx[s]]
        out.append((st.mean(p.x for p in pts),st.mean(p.y for p in pts),min(p.z for p in pts),max(p.z for p in pts)))
    return out
b=sole(1); print('rest',[tuple(round(x,4) for x in t) for t in b])
for i,P in enumerate(POSES):
    s=sole(i+2); print(P,[ (round(a[0]-c[0],4),round(a[1]-c[1],4),round(a[2],4),round(a[3]-a[2],4)) for a,c in zip(s,b)])
