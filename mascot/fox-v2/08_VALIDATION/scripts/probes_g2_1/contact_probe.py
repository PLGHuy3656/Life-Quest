import os, sys, json
S='/home/claude/g2/work/LifeQuest_Fox_V2/08_VALIDATION/scripts'; sys.path.insert(0,S)
os.environ.setdefault('FOX_SPEC','/home/claude/g2/work/LifeQuest_Fox_V2/04_ANIMATIONS/g2_daily_life/anim_spec_g2.json')
import bpy, anim_e1 as A, anim_check_g2_1 as C
Q=A.Q
POSES=json.loads(os.environ['POSES'])
bpy.ops.wm.open_mainfile(filepath=A.SRC)
O=bpy.data.objects; R=A.Rig(O['FOX_RIG']); sc=bpy.context.scene
for o in O:
    for m in o.modifiers:
        if m.type=='SUBSURF': m.show_viewport=False
k=A.Keyer('probe',O)
def key(f,P):
    A.body_pose(k,R,f,P)
    k.basis(f,'ROOT',q=R.lq('ROOT',Q(x=P.get('root_pitch',0),y=P.get('root_roll',0),z=P.get('root_yaw',0))),loc=R.lloc('ROOT',(P.get('root_x',0),P.get('root_y',0),P.get('root_zf',0))))
    k.face(f,{})
key(1,{})
for i,P in enumerate(POSES): key(i+2,P)
k.finish(1,len(POSES)+1,False)
sc.frame_set(1); rest=C.snapshot(O); B,H=rest['FOX_Body'],rest['FOX_Head']
armc={n:[C.sd(H,p)<-0.001 or C.sd(B,p)<0 for p in rest['v'][n]] for n in ('FOX_Arm_L','FOX_Arm_R')}
sch=[C.sd(H,p)<-0.001 for p in rest['v']['FOX_Scarf_Roll']]
def p99(nm,cur):
    v0,v1=rest['v'][nm],cur['v'][nm]; d=sorted(abs((v1[a]-v1[b]).length/max(1e-9,(v0[a]-v0[b]).length)-1) for a,b in rest['e'][nm]); return round(d[int(.99*(len(d)-1))],3)
for i,P in enumerate(POSES):
    sc.frame_set(i+2); cur=C.snapshot(O); Hc=cur['FOX_Head']
    o=[]
    for s in 'LR':
        nm=f'FOX_Arm_{s}'; da=[C.sd(Hc,p) for p,w in zip(cur['v'][nm],armc[nm]) if not w]
        o.append(f"{s}: head {-min([0]+da)*1000:.1f}mm n{sum(d<-0.002 for d in da)} str {p99(nm,cur)}")
    dh=[C.sd(Hc,p) for p,w in zip(cur['v']['FOX_Scarf_Roll'],sch) if not w]
    print(f"P{i}", ' | '.join(o), f"| scarf {-min([0]+dh)*1000:.1f}mm n{sum(d<-0.002 for d in dh)} | body {p99('FOX_Body',cur)} flap {p99('FOX_Scarf_Flap',cur)} roll {p99('FOX_Scarf_Roll',cur)}", flush=True)
