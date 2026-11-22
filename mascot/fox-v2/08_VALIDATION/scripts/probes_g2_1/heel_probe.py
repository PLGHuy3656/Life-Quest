import os, sys, json
S='/home/claude/g2/work/LifeQuest_Fox_V2/08_VALIDATION/scripts'; sys.path.insert(0,S)
import bpy, anim_e1 as A
c=float(os.environ.get('C','0.5'))
bpy.ops.wm.open_mainfile(filepath=A.SRC)
O=bpy.data.objects; R=A.Rig(O['FOX_RIG']); sc=bpy.context.scene
for o in O:
    for m in o.modifiers:
        if m.type=='SUBSURF': m.show_viewport=False
k=A.Keyer('probe',O); angs=list(range(0,61,5))
for i,a in enumerate(angs): A.body_pose(k,R,i+1,{'leg_x':-a,'foot_x':c*a}); k.face(i+1,{})
k.finish(1,len(angs),False)
def verts(n):
    dg=bpy.context.evaluated_depsgraph_get(); e=O[n].evaluated_get(dg); m=e.to_mesh(); v=[e.matrix_world@x.co for x in m.vertices]; e.to_mesh_clear(); return v
sc.frame_set(1); r=verts('FOX_Leg_L'); z0=min(p.z for p in r); idx=[i for i,p in enumerate(r) if p.z<z0+0.004]
for i,a in enumerate(angs):
    sc.frame_set(i+1); v=verts('FOX_Leg_L'); pts=[v[j] for j in idx]; zm=min(p.z for p in pts)
    low=[p for p in pts if p.z<zm+0.0015]
    print(a, round(sum(p.y for p in low)/len(low),4), round(zm,4), len(low), 'rear', round(max(p.y for p in pts),4))
