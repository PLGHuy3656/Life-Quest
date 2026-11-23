import os, sys
S='/home/claude/g2/work/LifeQuest_Fox_V2/08_VALIDATION/scripts'; sys.path.insert(0,S)
import bpy, anim_e1 as A
c=float(os.environ.get('C','0.5')); step=0.25; amax=50
bpy.ops.wm.open_mainfile(filepath=A.SRC)
O=bpy.data.objects; R=A.Rig(O['FOX_RIG']); sc=bpy.context.scene
for o in O:
    for m in o.modifiers:
        if m.type=='SUBSURF': m.show_viewport=False
k=A.Keyer('probe',O); angs=[i*step for i in range(int(amax/step)+1)]
for i,a in enumerate(angs): A.body_pose(k,R,i+1,{'leg_x':-a,'foot_x':c*a}); k.face(i+1,{})
k.finish(1,len(angs),False)
def verts(n):
    dg=bpy.context.evaluated_depsgraph_get(); e=O[n].evaluated_get(dg); m=e.to_mesh(); v=[(e.matrix_world@x.co).copy() for x in m.vertices]; e.to_mesh_clear(); return v
prev=None; ry=0.0; out=[]
for i,a in enumerate(angs):
    sc.frame_set(i+1); v=verts('FOX_Leg_L'); zm=min(p.z for p in v)
    con={j for j,p in enumerate(v) if p.z<zm+0.0015}
    if prev:
        pv,pc=prev; com=con&pc
        if com: ry += -sum(v[j].y-pv[j].y for j in com)/len(com)
    prev=(v,con)
    if abs(a-round(a))<1e-6: out.append((int(a),round(ry,5)))
print(out)
