import os, sys, json
S='/home/claude/g2/work/LifeQuest_Fox_V2/08_VALIDATION/scripts'; sys.path.insert(0,S)
import bpy, anim_e1 as A, anim_check_g2 as C
from mathutils.bvhtree import BVHTree
Q=A.Q
POSES=json.loads(os.environ['POSES'])
bpy.ops.wm.open_mainfile(filepath=A.SRC)
O=bpy.data.objects; R=A.Rig(O['FOX_RIG']); rig=O['FOX_RIG']; sc=bpy.context.scene
for o in O:
    for m in o.modifiers:
        if m.type=='SUBSURF': m.show_viewport=False
k=A.Keyer('probe',O)
def key(f,P):
    A.body_pose(k,R,f,P)
    k.basis(f,'ROOT',q=R.lq('ROOT',Q(x=P.get('root_pitch',0),y=P.get('root_roll',0),z=P.get('root_yaw',0))),loc=R.lloc('ROOT',(P.get('root_x',0),P.get('root_y',0),P.get('root_zf',0))))
    if 'legL_x' in P or 'legR_x' in P:
        for s,sg in (('L',1),('R',-1)):
            k.basis(f,f'LEG_{s}',q=R.lq(f'LEG_{s}',Q(x=P.get(f'leg{s}_x',P.get('leg_x',0)),y=-sg*P.get('leg_out',0))))
            k.basis(f,f'FOOT_{s}',q=R.lq(f'FOOT_{s}',Q(x=P.get(f'foot{s}_x',P.get('foot_x',0)))))
    k.face(f,{})
key(1,{})
for i,P in enumerate(POSES): key(i+2,P)
k.finish(1,len(POSES)+1,cyclic=False)
sc.frame_set(1); rest=C.snapshot(O)
MESH=os.environ.get('MESHES','FOX_Leg_L,FOX_Body,FOX_Arm_L,FOX_Arm_R').split(',')
for i,P in enumerate(POSES):
    sc.frame_set(i+2); cur=C.snapshot(O); B=cur['FOX_Body']
    zs=min(p.z for n in C.SKINNED if n!='FOX_Tail' for p in cur['v'][n]); tz=min(p.z for p in cur['v']['FOX_Tail'])
    out={}
    for nm in MESH:
        v0,v1=rest['v'][nm],cur['v'][nm]; d=[];dv=[]
        for a,b in rest['e'][nm]:
            s=abs((v1[a]-v1[b]).length/max(1e-9,(v0[a]-v0[b]).length)-1); d.append(s)
            if nm!='FOX_Body' and (C.sd(B,v1[a])>0.001 or C.sd(B,v1[b])>0.001): dv.append(s)
            elif nm=='FOX_Body': dv.append(s)
        d.sort(); dv.sort()
        out[nm]=(round(d[int(.99*(len(d)-1))],3), round(dv[int(.99*(len(dv)-1))],3) if dv else 0, round(dv[-1],3) if dv else 0)
    print('P%d'%i, 'zmin %.4f tail %.4f'%(zs,tz), out, flush=True)
