import { Mesh, MeshBasicMaterial, Object3D, SkinnedMesh } from 'three';

// Temporary "charred" look after the lightning strike. It does NOT modify the Fox: each fur mesh
// gets an overlay child that SHARES the Fox geometry (and skeleton, for skinned parts) but has its
// own dark, patchy, semi-transparent material drawn on top (polygon offset). Removing the overlay
// restores the original look exactly — the Fox materials are never touched.

const FUR = new Set(['FOX_Body', 'FOX_Head', 'FOX_Arm_L', 'FOX_Arm_R', 'FOX_Leg_L', 'FOX_Leg_R', 'FOX_Ear_L', 'FOX_Ear_R', 'FOX_Tail']);

export class CharOverlay {
  private overlays: Mesh[] = [];
  private mat: MeshBasicMaterial;
  private opacity = 0; private target = 0; private rate = 8;
  visible = true;

  constructor(fox: Object3D) {
    this.mat = new MeshBasicMaterial({ color: 0x3a2a22, transparent: true, opacity: 0, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 });
    this.mat.name = 'FX_char_overlay';
    // patchy soot: value noise on the (skinned) local position — no texture, no UV dependence
    this.mat.onBeforeCompile = sh => {
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vCharP;')
        .replace('#include <skinning_vertex>', '#include <skinning_vertex>\nvCharP = transformed;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
varying vec3 vCharP;
float chH(vec3 p){ return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
float chN(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
  return mix(mix(mix(chH(i),chH(i+vec3(1,0,0)),f.x), mix(chH(i+vec3(0,1,0)),chH(i+vec3(1,1,0)),f.x), f.y),
             mix(mix(chH(i+vec3(0,0,1)),chH(i+vec3(1,0,1)),f.x), mix(chH(i+vec3(0,1,1)),chH(i+vec3(1,1,1)),f.x), f.y), f.z); }`)
        .replace('#include <opaque_fragment>', `float chn = 0.65 * chN(vCharP * 11.0) + 0.35 * chN(vCharP * 29.0);
diffuseColor.a *= mix(0.72, 1.0, smoothstep(0.3, 0.75, chn));
diffuseColor.rgb *= mix(1.15, 0.85, chn);
#include <opaque_fragment>`);
    };
    this.mat.customProgramCacheKey = () => 'fox-char-overlay-v1';
    const targets: Mesh[] = [];
    fox.traverse(o => {
      const m = o as Mesh;
      if (!m.isMesh || m.name.startsWith('PROXY_') || m.name.startsWith('FX_')) return;
      if (!(FUR.has(m.name) || (m.parent && FUR.has(m.parent.name)))) return;
      if (m.geometry.morphAttributes.position) return;            // face parts are excluded (eyes stay clean)
      targets.push(m);
    });
    for (const m of targets) {
      let ov: Mesh;
      if ((m as SkinnedMesh).isSkinnedMesh) {
        const sm = m as SkinnedMesh, s = new SkinnedMesh(sm.geometry, this.mat);
        s.bind(sm.skeleton, sm.bindMatrix);
        ov = s;
      } else ov = new Mesh(m.geometry, this.mat);
      ov.name = 'FX_char_' + m.name; ov.frustumCulled = false; ov.raycast = () => {};   // never pickable ov.renderOrder = 5; ov.visible = false;
      m.add(ov);                                                    // identity local transform → same world matrix
      this.overlays.push(ov);
    }
  }

  /** G1.1: optional strength (0..1, default 1 = the G1 look) — streak_lost uses a lighter, brief soot. */
  fadeIn(seconds = 0.12, strength = 1) { this.target = 0.78 * Math.max(0, Math.min(1, strength)); this.rate = 1 / Math.max(0.01, seconds); }
  fadeOut(seconds = 0.6) { this.target = 0; this.rate = 1 / Math.max(0.01, seconds); }
  get active() { return this.opacity > 0.001 || this.target > 0; }
  get value() { return this.opacity; }
  get meshCount() { return this.overlays.length; }

  update(dt: number) {
    const d = this.rate * dt * 0.85;
    this.opacity = this.target > this.opacity ? Math.min(this.target, this.opacity + d) : Math.max(this.target, this.opacity - d);
    this.mat.opacity = this.opacity;
    const show = this.visible && this.opacity > 0.001;
    for (const o of this.overlays) o.visible = show;
  }

  dispose() {
    for (const o of this.overlays) o.removeFromParent();          // shared geometry stays with the Fox
    this.overlays = [];
    this.mat.dispose();
  }
}
