"""Gate E1 — generate 07_WEB_PREVIEW/fox_interactive_e1.html (Three.js interaction prototype).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/make_anim_viewer_e1.py
Extends the D1.1 rig viewer (rig_test.html stays as the D1.1 record) with:
* animation controller: base loops (idle / walk / run, phase-synced feet) + one-shots with
  smooth weight ramps, all weights managed explicitly (sum = 1)
* pointer interaction through real Three.js raycasting against invisible proxy meshes
  attached to the HEAD and TAIL bones (they follow the animation); the tail proxy is
  occlusion-tested against the real body mesh
* look_at_cursor: procedural NECK/HEAD tracking (clamped, damped) + eye shift; its weight is
  1 − Σ(action weight × head_control), so clips that own the head are never overridden
* expression controls (morph targets), level-scale slider 0.8–1.1, moving floor for
  locomotion, FPS / triangle / draw-call statistics, and window.runChecks() (E1 suite)
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))

mats = json.load(open(os.path.join(ROOT, '01_DESIGN', 'materials.json')))['materials']
palette = {k: v['model_hex'] for k, v in mats.items()}
skel = json.load(open(os.path.join(ROOT, '03_RIG', 'skeleton_spec.json')))
bones = {b['name']: b['parent'] for b in skel['bones'] if b['name'] != 'FACE'}
face = json.load(open(os.path.join(ROOT, '03_RIG', 'face_morph_map.json')))
spec = json.load(open(os.path.join(ROOT, '04_ANIMATIONS', 'anim_spec_e1.json')))

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LifeQuest Fox V2 — interactive animation prototype (Gate E1)</title>
<style>
  :root { --bg:#FDF6F1; --ink:#3c281e; --mut:#7a6355; --line:#ead9cc; --acc:#E8742A; --ok:#2f8a4c; --bad:#c0392b; }
  * { box-sizing: border-box; }
  html, body { margin:0; height:100%; background:var(--bg); color:var(--ink); font:14px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; }
  #app { display:grid; grid-template-columns: 1fr 370px; height:100%; }
  #view { position:relative; min-height:320px; touch-action:none; }
  #view canvas { display:block; width:100%; height:100%; }
  #hud { position:absolute; left:12px; top:10px; font-size:12px; color:var(--mut); line-height:1.5; pointer-events:none; white-space:pre; }
  #hint { position:absolute; left:12px; bottom:10px; font-size:12px; color:var(--mut); pointer-events:none; }
  #tag { position:absolute; padding:2px 8px; border-radius:10px; background:#fff; border:1px solid var(--line); font-size:12px; pointer-events:none; display:none; }
  #drop { position:absolute; inset:0; display:none; align-items:center; justify-content:center; text-align:center; padding:24px; color:var(--mut); }
  aside { border-left:1px solid var(--line); overflow:auto; padding:14px 16px 24px; background:#fffaf6; }
  h1 { font-size:16px; margin:0 0 2px; } .sub { color:var(--mut); font-size:12px; margin-bottom:10px; }
  h2 { font-size:12px; text-transform:uppercase; letter-spacing:.06em; color:var(--mut); margin:16px 0 6px; }
  .row { display:flex; flex-wrap:wrap; gap:6px; align-items:center; }
  button { font:inherit; font-size:13px; border:1px solid var(--line); background:#fff; color:var(--ink); border-radius:8px; padding:5px 10px; cursor:pointer; }
  button:hover { border-color:var(--acc); } button.on { background:var(--acc); border-color:var(--acc); color:#fff; }
  label.chk { font-size:13px; display:flex; gap:6px; align-items:center; margin-right:10px; }
  input[type=range] { width:100%; }
  .bars div { display:flex; align-items:center; gap:6px; font-size:12px; color:var(--mut); }
  .bars span.n { width:80px; } .bars span.b { flex:1; height:6px; background:#f1e3d8; border-radius:3px; overflow:hidden; }
  .bars span.b i { display:block; height:100%; background:var(--acc); width:0; }
  table { width:100%; border-collapse:collapse; font-size:12px; margin-top:8px; }
  td { border-top:1px solid var(--line); padding:4px 2px; vertical-align:top; }
  td.s { width:44px; font-weight:700; } .PASS { color:var(--ok); } .FAIL { color:var(--bad); } .INFO { color:var(--mut); }
  @media (max-width: 820px) { #app { grid-template-columns: 1fr; grid-template-rows: 62vh auto; } aside { border-left:0; border-top:1px solid var(--line); } }
</style>
<script type="importmap">
{ "imports": {
  "three": "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js",
  "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.170.0/examples/jsm/"
} }
</script>
</head>
<body>
<div id="app">
  <div id="view"><div id="hud">loading…</div><div id="tag"></div>
    <div id="hint">Move the pointer: the fox looks at it · click or stroke the head · click the tail · drag elsewhere to orbit</div>
    <div id="drop">Could not fetch the GLB (pages opened as file:// cannot fetch files).<br>
      Drop <b>fox_v2_anim_e1.glb</b> here, or serve the project folder:<br><code>python -m http.server</code> and open <code>/07_WEB_PREVIEW/fox_interactive_e1.html</code>.</div></div>
  <aside>
    <h1>LifeQuest Fox V2 — interactive prototype</h1>
    <div class="sub">Gate E1 · Three.js r170 · <span id="file"></span></div>
    <h2>Base loop</h2><div class="row" id="base"></div>
    <h2>One-shot</h2><div class="row" id="oneshot"></div>
    <h2>Interaction</h2>
    <div class="row"><label class="chk"><input type="checkbox" id="look" checked> look at cursor</label>
      <label class="chk"><input type="checkbox" id="proxies"> show hit proxies</label></div>
    <h2>Expression (morph targets)</h2><div class="row" id="exprs"></div>
    <h2>Level scale <span id="scv">1.00</span></h2><input id="scale" type="range" min="0.8" max="1.1" step="0.01" value="1">
    <div class="row" style="margin-top:6px"><button data-s="0.8">Lv1 0.80</button><button data-s="0.92">Lv10 0.92</button><button data-s="1">Lv20 1.00</button><button data-s="1.1">Lv30+ 1.10</button></div>
    <h2>Mixer weights</h2><div class="bars" id="bars"></div>
    <h2>Runtime checks</h2><button id="checks" style="width:100%">Run checks</button>
    <table id="report"></table>
  </aside>
</div>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const SPEC = __SPEC__;
const EXPECT = { palette: __PALETTE__, bones: __BONES__, face: __FACE__ };
const EXPR = SPEC.expressions;
const BASES = ['idle', 'walk', 'run'];
const ONESHOTS = ['happy', 'wave', 'head_pet', 'tail_touch'];
const LOOK = { yawMax: 40, pitchUp: 20, pitchDown: 15, neck: 0.45, head: 0.55, neckPitch: 0.85, headPitch: 0.15, omega: 7, eyeOmega: 16, eyeX: 0.0035, eyeY: 0.0022 };
const errors = [];
window.addEventListener('error', e => errors.push(String(e.message || e)));
const _ce = console.error.bind(console); console.error = (...a) => { errors.push(a.map(String).join(' ')); _ce(...a); };

// ------------------------------------------------------------------ scene
const view = document.getElementById('view'), hud = document.getElementById('hud'), tag = document.getElementById('tag');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;
view.appendChild(renderer.domElement);
const BG = new THREE.Color('#FDF6F1');
const scene = new THREE.Scene(); scene.background = BG; scene.fog = new THREE.Fog(BG, 2.6, 6.5);
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
camera.position.set(0.9, 0.75, 2.6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.48, 0); controls.enableDamping = true; controls.minDistance = 0.8; controls.maxDistance = 6;
scene.add(new THREE.HemisphereLight(0xfff6ee, 0xe8d6c8, 1.6));
const key = new THREE.DirectionalLight(0xfff1e4, 1.8); key.position.set(-1.5, 2.5, 2.2); scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.8); fill.position.set(2, 1.2, 2); scene.add(fill);
const rim = new THREE.DirectionalLight(0xffe9d6, 1.3); rim.position.set(0.5, 2, -2.4); scene.add(rim);
const back = new THREE.DirectionalLight(0xfff4ea, 0.8); back.position.set(-1.2, 1.0, -2.0); scene.add(back);
// floor: 5 cm checker that scrolls under walk/run at the clip's speed (feet must stay planted on it)
const cv = document.createElement('canvas'); cv.width = cv.height = 64; const cx = cv.getContext('2d');
cx.fillStyle = '#f3e6db'; cx.fillRect(0, 0, 64, 64); cx.fillStyle = '#ead8c9'; cx.fillRect(0, 0, 32, 32); cx.fillRect(32, 32, 32, 32);
const ctex = new THREE.CanvasTexture(cv); ctex.colorSpace = THREE.SRGBColorSpace; ctex.wrapS = ctex.wrapT = THREE.RepeatWrapping;
ctex.repeat.set(80, 80); ctex.anisotropy = 4; ctex.magFilter = THREE.NearestFilter;
const ground = new THREE.Mesh(new THREE.PlaneGeometry(8, 8), new THREE.MeshBasicMaterial({ map: ctex }));
ground.rotation.x = -Math.PI / 2; scene.add(ground);
const blobTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 4, 64, 64, 62); r.addColorStop(0, 'rgba(90,60,40,0.30)'); r.addColorStop(1, 'rgba(90,60,40,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); return new THREE.CanvasTexture(c); })();
const blob = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.6), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false }));
blob.rotation.x = -Math.PI / 2; blob.position.y = 0.002; scene.add(blob);

function resize() { const w = view.clientWidth, h = view.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

// ------------------------------------------------------------------ state
let gltf, root, mixer, meshes = {}, objs = {}, B = {}, actions = {}, proxies = { head: null, tail: [] };
const meshList = n => { const o = objs[n]; if (!o) return []; if (o.isMesh) return [o]; const l = []; o.traverse(c => { if (c.isMesh && c.parent === o) l.push(c); }); return l; };
const st = {
  base: 'idle', baseW: { idle: 1, walk: 0, run: 0 }, phase: 0,
  shot: null, shotW: 0, shotT: 0,
  look: { on: true, w: 1, yaw: 0, pitch: 0, vy: 0, vp: 0, eyeYaw: 0, eyePitch: 0, evy: 0, evp: 0, tYaw: 0, tPitch: 0, hasPointer: false },
  expr: 'neutral', exprW: 0, scale: 1, groundZ: 0,
  pointer: new THREE.Vector2(), pointerIn: false, hover: 'none', hoverW: { head: 0, tail: 0 },
  down: null, manual: false, fps: 0, frames: 0, lastT: performance.now(),
};
const tmpQ = new THREE.Quaternion(), tmpQ2 = new THREE.Quaternion(), tmpV = new THREE.Vector3();
const ray = new THREE.Raycaster();
const smooth = (cur, tgt, rate, dt) => cur + (tgt - cur) * (1 - Math.exp(-rate * dt));

// ------------------------------------------------------------------ animation controller
function setBase(name) { if (!BASES.includes(name)) return; st.base = name; ui(); }
function playOneShot(name) {
  if (!ONESHOTS.includes(name)) return false;
  const a = actions[name];
  if (st.shot === name && st.shotT < a.getClip().duration * 0.7) return false;   // debounce repeated clicks
  if (st.shot && st.shot !== name) { actions[st.shot].stop(); }
  a.reset(); a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; a.setEffectiveTimeScale(1); a.play();
  st.shot = name; st.shotT = 0; ui(); return true;
}
const FADE_IN = 0.2, FADE_OUT = 0.35, BASE_FADE = 0.3;
function updateController(dt) {
  // base loops: weights ramp linearly so a cross-fade always sums to 1
  for (const b of BASES) { const tgt = b === st.base ? 1 : 0; const d = dt / BASE_FADE;
    st.baseW[b] = tgt > st.baseW[b] ? Math.min(tgt, st.baseW[b] + d) : Math.max(tgt, st.baseW[b] - d); }
  const tot = BASES.reduce((s, b) => s + st.baseW[b], 0) || 1;
  // locomotion phase: walk and run share a normalised phase -> feet stay in step during the blend
  const ww = st.baseW.walk / tot, rw = st.baseW.run / tot, loc = ww + rw;
  if (loc > 0) { const dur = (ww * actions.walk.getClip().duration + rw * actions.run.getClip().duration) / loc; st.phase = (st.phase + dt / dur) % 1; }
  actions.walk.time = st.phase * actions.walk.getClip().duration; actions.run.time = st.phase * actions.run.getClip().duration;
  // one-shot ramp
  let sw = 0;
  if (st.shot) { const a = actions[st.shot], D = a.getClip().duration; st.shotT += dt;
    sw = Math.min(1, st.shotT / FADE_IN, Math.max(0, (D - st.shotT) / FADE_OUT));
    if (st.shotT >= D) { a.stop(); st.shot = null; sw = 0; ui(); } }
  st.shotW = sw;
  for (const b of BASES) { const a = actions[b]; a.enabled = true; a.setEffectiveWeight((st.baseW[b] / tot) * (1 - sw));
    if (b !== 'idle') a.setEffectiveTimeScale(0); }
  if (st.shot) actions[st.shot].setEffectiveWeight(sw);
  const speed = (ww * SPEC.clips.walk.speed_mps + rw * SPEC.clips.run.speed_mps) * (1 - sw) * st.scale;
  st.groundZ = (st.groundZ - speed * dt);
  ground.position.z = ((st.groundZ % 0.1) + 0.1) % 0.1 - 0.05;
  st.groundSpeed = speed;
}
function weightOf(name) { return actions[name] && actions[name].isRunning() ? actions[name].getEffectiveWeight() : (BASES.includes(name) ? actions[name].getEffectiveWeight() : 0); }
function control(kind) { let s = 0; for (const n of Object.keys(actions)) s += weightOf(n) * (SPEC.clips[n][kind] || 0); return Math.min(1, s); }

// ------------------------------------------------------------------ procedural layers (after the mixer)
const rootQ = () => root.getWorldQuaternion(new THREE.Quaternion());
function addRootRot(bone, yawDeg, pitchUpDeg) {
  const rq = rootQ(), d = new THREE.Quaternion().setFromEuler(new THREE.Euler(THREE.MathUtils.degToRad(-pitchUpDeg), THREE.MathUtils.degToRad(yawDeg), 0, 'YXZ'));
  const dW = rq.clone().multiply(d).multiply(rq.clone().invert());
  const qW = bone.getWorldQuaternion(new THREE.Quaternion());
  const pW = bone.parent.getWorldQuaternion(new THREE.Quaternion());
  bone.quaternion.copy(pW.invert().multiply(dW.multiply(qW)));
  bone.updateMatrixWorld(true);
}
function lookTarget() {
  const L = st.look; if (!st.pointerIn) { L.tYaw = 0; L.tPitch = 0; return; }
  ray.setFromCamera(st.pointer, camera);
  const head = B.HEAD.getWorldPosition(new THREE.Vector3()).add(new THREE.Vector3(0, 0.18 * st.scale, 0));
  const n = camera.getWorldDirection(new THREE.Vector3());
  const t = n.dot(head.clone().sub(ray.ray.origin)) / n.dot(ray.ray.direction);
  const p = ray.ray.at(Math.max(0.1, t), new THREE.Vector3());
  const d = root.worldToLocal(p.clone()).sub(root.worldToLocal(head.clone()));
  const yaw = THREE.MathUtils.radToDeg(Math.atan2(d.x, d.z)), pitch = THREE.MathUtils.radToDeg(Math.atan2(d.y, Math.hypot(d.x, d.z)));
  L.tYaw = THREE.MathUtils.clamp(yaw, -LOOK.yawMax, LOOK.yawMax);
  L.tPitch = THREE.MathUtils.clamp(pitch, -LOOK.pitchDown, LOOK.pitchUp);
}
function headYawPitch() {   // head direction relative to the upper body (SPINE), degrees
  const qh = B.HEAD.getWorldQuaternion(new THREE.Quaternion()), qs = B.SPINE.getWorldQuaternion(new THREE.Quaternion());
  const f = new THREE.Vector3(0, 0, 1).applyQuaternion(qs.invert().multiply(qh));
  return [THREE.MathUtils.radToDeg(Math.atan2(f.x, f.z)), THREE.MathUtils.radToDeg(Math.atan2(f.y, Math.hypot(f.x, f.z)))];
}
function updateLook(dt) {
  const L = st.look; lookTarget();
  const allowed = L.on && st.pointerIn ? 1 - control('head_control') : 0;   // no pointer -> the clip keeps the head
  L.w = smooth(L.w, allowed, 10, dt);
  // the clip already turns the head a little (idle drift): look-at adds only what is missing,
  // so the TOTAL head yaw/pitch stays within the clamp
  const cy = headYawPitch();
  const crit = (x, v, t, w0) => { const k = w0 * w0, c = 2 * w0; const sub = 4, h = dt / sub;
    for (let i = 0; i < sub; i++) { v += (k * (t - x) - c * v) * h; x += v * h; } return [x, v]; };   // critically damped: no velocity jumps
  [L.yaw, L.vy] = crit(L.yaw, L.vy, THREE.MathUtils.clamp(L.tYaw - cy[0], -LOOK.yawMax - 10, LOOK.yawMax + 10), LOOK.omega);
  [L.pitch, L.vp] = crit(L.pitch, L.vp, L.tPitch - cy[1], LOOK.omega);
  [L.eyeYaw, L.evy] = crit(L.eyeYaw, L.evy, L.tYaw, LOOK.eyeOmega); [L.eyePitch, L.evp] = crit(L.eyePitch, L.evp, L.tPitch, LOOK.eyeOmega);
  const w = L.w;
  const yawAdd = THREE.MathUtils.clamp(cy[0] + L.yaw * w, -LOOK.yawMax, LOOK.yawMax) - cy[0];
  const pitAdd = THREE.MathUtils.clamp(cy[1] + L.pitch * w, -LOOK.pitchDown, LOOK.pitchUp) - cy[1];
  if (w > 1e-4) { addRootRot(B.NECK, yawAdd * LOOK.neck, pitAdd * LOOK.neckPitch); addRootRot(B.HEAD, yawAdd * LOOK.head, pitAdd * LOOK.headPitch); }
  // eyes lead the head: small tangential shift of the eye decals in head space
  for (const s of ['L', 'R']) { const e = meshes['FOX_Eye_' + s]; if (!e) continue; const r = e.userData.rest;
    const ex = THREE.MathUtils.clamp(L.eyeYaw / LOOK.yawMax, -1, 1) * LOOK.eyeX * w, ey = THREE.MathUtils.clamp(L.eyePitch / LOOK.pitchUp, -1, 1) * LOOK.eyeY * w;
    e.position.copy(r.pos).addScaledVector(r.right, ex).addScaledVector(r.up, ey); }
}
function updateHoverLayer(dt) {
  const free = 1 - st.shotW;
  st.hoverW.head = smooth(st.hoverW.head, st.hover === 'head' ? free : 0, 8, dt);
  st.hoverW.tail = smooth(st.hoverW.tail, st.hover === 'tail' ? free : 0, 8, dt);
  const h = st.hoverW.head, t = st.hoverW.tail, now = performance.now() / 1000;
  if (h > 1e-3) for (const s of ['L', 'R']) addLocal(B['EAR_' + s + '_01'], 'x', 9 * h);        // ears perk toward the hand
  if (t > 1e-3) for (let i = 1; i <= 4; i++) addLocal(B['TAIL_0' + i], 'y', 4 * t * Math.sin(now * 11 - i * 0.6) * (i === 1 ? 0.35 : 0.22) * 4);
}
const AX = { x: new THREE.Vector3(1, 0, 0), y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
function addLocal(bone, axisBlender, deg) {
  // rotation about an armature (Blender) axis expressed in the root frame: Blender X -> three X, Blender Y -> three -Z, Blender Z -> three Y
  const a = axisBlender === 'x' ? AX.x : axisBlender === 'y' ? AX.z.clone().negate() : AX.y;
  const rq = rootQ(), dW = new THREE.Quaternion().setFromAxisAngle(a.clone().applyQuaternion(rq), THREE.MathUtils.degToRad(deg));
  const qW = bone.getWorldQuaternion(new THREE.Quaternion()), pW = bone.parent.getWorldQuaternion(new THREE.Quaternion());
  bone.quaternion.copy(pW.invert().multiply(dW.multiply(qW))); bone.updateMatrixWorld(true);
}
function updateFace(dt) {
  st.exprW = smooth(st.exprW, st.expr === 'neutral' ? 0 : 1, 12, dt);
  const w = st.exprW * (1 - control('face_control')); st.faceOverride = w;
  if (w < 1e-4) return;
  const tgt = EXPR[st.expr] || {};
  for (const n of EXPECT.face.default_visible.concat(EXPECT.face.swap_parts)) { const m = meshes[n]; if (!m || !m.morphTargetDictionary) continue;
    for (const [morph, i] of Object.entries(m.morphTargetDictionary)) {
      const t = (tgt[n] && tgt[n][morph]) || 0; m.morphTargetInfluences[i] = m.morphTargetInfluences[i] * (1 - w) + t * w; } }
}

// ------------------------------------------------------------------ picking (raycast on bone-attached proxies + body occlusion)
function pick(ndc) {
  if (!proxies.head) return { target: 'none' };
  ray.setFromCamera(ndc, camera);
  const targets = [proxies.head, ...proxies.tail];
  const hit = ray.intersectObjects(targets, false)[0];
  if (!hit) return { target: 'none' };
  const target = hit.object.userData.target;
  if (target === 'tail') {   // the real body mesh in front of the tail blocks it
    const occ = ray.intersectObject(objs.FOX_Body, true)[0];
    if (occ && occ.distance < hit.distance - 0.01) return { target: 'none', blocked: 'body', point: occ.point };
  }
  return { target, point: hit.point, distance: hit.distance };
}
function visibleTailPoint() {
  const out = []; const T = THREE;
  for (const m of meshList('FOX_Tail')) { const n = m.geometry.attributes.position.count;
    for (let i = 0; i < n; i += 7) { const v = new T.Vector3(); m.getVertexPosition(i, v); v.applyMatrix4(m.matrixWorld);
      const c = v.clone().project(camera); if (Math.abs(c.x) > 0.95 || Math.abs(c.y) > 0.95) continue;
      const r = pick(new T.Vector2(c.x, c.y)); if (r.target === 'tail') out.push({ ndc: [c.x, c.y], d: v.distanceTo(B.HEAD.getWorldPosition(new T.Vector3())) }); } }
  out.sort((a, b) => b.d - a.d);            // farthest from the head = least ambiguous
  return out.length ? { ndc: out[Math.floor(out.length * 0.2)].ndc, count: out.length } : null;
}
function setPointerFromEvent(e) { const r = renderer.domElement.getBoundingClientRect();
  st.pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); st.pointerIn = true; st.pointerPx = [e.clientX - r.left, e.clientY - r.top]; }
const cvs = renderer.domElement;
cvs.addEventListener('pointermove', e => { setPointerFromEvent(e); st.needPick = true;
  if (st.down && st.down.target === 'head') { st.down.stroke += Math.hypot(e.movementX || 0, e.movementY || 0);
    if (st.down.stroke > 40 && !st.down.fired) { st.down.fired = playOneShot('head_pet'); st.lastTrigger = 'head_pet (stroke)'; } } });
cvs.addEventListener('pointerleave', () => { st.pointerIn = false; st.hover = 'none'; tag.style.display = 'none'; cvs.style.cursor = ''; });
cvs.addEventListener('pointerdown', e => { setPointerFromEvent(e); const p = pick(st.pointer);
  if (p.target !== 'none') { controls.enabled = false; st.down = { target: p.target, x: e.clientX, y: e.clientY, stroke: 0, fired: false }; } });
addEventListener('pointerup', e => { if (st.down) { const moved = Math.hypot(e.clientX - st.down.x, e.clientY - st.down.y);
    if (moved < 6 && !st.down.fired) { const n = st.down.target === 'head' ? 'head_pet' : 'tail_touch'; playOneShot(n); st.lastTrigger = n + ' (click)'; }
    st.down = null; controls.enabled = true; } });
function updateHover() {
  if (!st.needPick || !st.pointerIn) return; st.needPick = false;
  const p = pick(st.pointer); st.hover = p.target; st.lastPick = p;
  cvs.style.cursor = p.target === 'head' ? 'grab' : p.target === 'tail' ? 'pointer' : '';
  if (p.target !== 'none') { tag.style.display = 'block'; tag.textContent = p.target === 'head' ? 'pet the head' : 'touch the tail';
    tag.style.left = (st.pointerPx[0] + 14) + 'px'; tag.style.top = (st.pointerPx[1] - 10) + 'px'; } else tag.style.display = 'none';
}

// ------------------------------------------------------------------ main loop
const clock = new THREE.Clock();
// Three's PropertyMixer only writes a property when its mixed value changed since the last write,
// so procedural layers must hand back the mixer's own values before every update
const restoreList = [];
function saveMixerState() { for (const r of restoreList) r.save(); }
// PropertyMixer.apply() writes a property only if accu0 !== accu1; invalidating the previous
// accumulation buffer guarantees every bound property is rewritten from the clips each update
function invalidateMixerCache() { for (const pm of mixer._bindings) { const n = pm.valueSize; pm.buffer.fill(NaN, n, 3 * n); } }
function restoreMixerState() { for (const r of restoreList) r.restore(); }
function step(dt) {
  if (!mixer) return;
  restoreMixerState();
  updateController(dt);
  actions.idle.setEffectiveTimeScale(1);
  invalidateMixerCache();
  mixer.update(dt);
  root.updateMatrixWorld(true);
  saveMixerState();
  updateLook(dt); updateHoverLayer(dt); updateFace(dt); updateHover();
  blob.scale.setScalar(st.scale);
}
renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.1);
  if (!st.manual) step(dt);
  controls.update(); renderer.render(scene, camera);
  st.frames++; const now = performance.now();
  if (now - st.lastT > 500) { st.fps = st.frames * 1000 / (now - st.lastT); st.frames = 0; st.lastT = now; if (gltf) drawStats(); }
});
function drawStats() {
  const i = renderer.info.render;
  hud.textContent = `${st.fps.toFixed(0)} fps · ${i.triangles.toLocaleString()} tris · ${i.calls} draw calls\n` +
    `base ${st.base}${st.shot ? ' + ' + st.shot : ''} · look ${(st.look.w * 100).toFixed(0)} % · hover ${st.hover}` +
    (st.lastTrigger ? `\nlast trigger: ${st.lastTrigger}` : '');
  document.getElementById('bars').innerHTML = Object.keys(actions).map(n => `<div><span class="n">${n}</span><span class="b"><i style="width:${(weightOf(n) * 100).toFixed(0)}%"></i></span></div>`).join('')
    + `<div><span class="n">look_at</span><span class="b"><i style="width:${(st.look.w * 100).toFixed(0)}%"></i></span></div>`;
}

// ------------------------------------------------------------------ UI
function ui() {
  document.querySelectorAll('#base button').forEach(b => b.classList.toggle('on', b.dataset.a === st.base));
  document.querySelectorAll('#oneshot button').forEach(b => b.classList.toggle('on', b.dataset.a === st.shot));
  document.querySelectorAll('#exprs button').forEach(b => b.classList.toggle('on', b.dataset.e === st.expr));
}
function setExpression(n) { if (EXPR[n] || n === 'neutral') st.expr = n; ui(); }
function setScale(s) { st.scale = +s; root.scale.setScalar(st.scale); document.getElementById('scale').value = s; document.getElementById('scv').textContent = (+s).toFixed(2); }
document.getElementById('base').innerHTML = BASES.map(n => `<button data-a="${n}">${n}</button>`).join('');
document.getElementById('base').onclick = e => e.target.dataset.a && setBase(e.target.dataset.a);
document.getElementById('oneshot').innerHTML = ONESHOTS.map(n => `<button data-a="${n}">${n}</button>`).join('');
document.getElementById('oneshot').onclick = e => { if (e.target.dataset.a) { playOneShot(e.target.dataset.a); st.lastTrigger = e.target.dataset.a + ' (button)'; } };
document.getElementById('exprs').innerHTML = ['neutral', ...Object.keys(EXPR).filter(n => n !== 'neutral')].map(n => `<button data-e="${n}">${n}</button>`).join('');
document.getElementById('exprs').onclick = e => e.target.dataset.e && setExpression(e.target.dataset.e);
document.getElementById('look').onchange = e => st.look.on = e.target.checked;
document.getElementById('proxies').onchange = e => { [proxies.head, ...proxies.tail].forEach(p => p && (p.material.visible = e.target.checked)); };
document.getElementById('scale').oninput = e => setScale(+e.target.value);
document.querySelectorAll('[data-s]').forEach(b => b.onclick = () => setScale(+b.dataset.s));

// ------------------------------------------------------------------ load
function buildProxies() {
  root.updateMatrixWorld(true);
  const mat = () => new THREE.MeshBasicMaterial({ color: 0x2f8a4c, wireframe: true, transparent: true, opacity: 0.35, visible: false, depthTest: false });
  // head: sphere around the head mesh (incl. ear bases), attached to HEAD
  const hb = new THREE.Box3().setFromObject(objs.FOX_Head, true), c = hb.getCenter(new THREE.Vector3()), s = hb.getSize(new THREE.Vector3());
  const head = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), mat());
  head.scale.set(0.5 * s.x * 0.95, 0.5 * s.y * 1.05, 0.5 * s.z * 0.95);     // ellipsoid around the head (+ a little height for the ear bases)
  head.position.copy(c); head.userData.target = 'head'; head.name = 'PROXY_head'; head.renderOrder = 10; scene.add(head); B.HEAD.attach(head);
  proxies.head = head;
  // tail: one capsule per tail bone, radius fitted to the tail mesh around the segment
  const pts = [];
  for (const tail of meshList('FOX_Tail')) { const n = tail.geometry.attributes.position.count;
    for (let i = 0; i < n; i += 3) { const v = new THREE.Vector3(); tail.getVertexPosition(i, v); pts.push(v.applyMatrix4(tail.matrixWorld)); } }
  const P = [1, 2, 3, 4].map(i => B['TAIL_0' + i].getWorldPosition(new THREE.Vector3()));
  // extend past the last joint to the farthest tail vertex
  const far = pts.reduce((m, p) => p.distanceTo(P[0]) > m.distanceTo(P[0]) ? p : m, P[3]); P.push(far);
  for (let i = 0; i < 4; i++) {
    const a = P[i], b = P[i + 1], ab = b.clone().sub(a), L = ab.length(), dir = ab.clone().normalize();
    const ds = pts.filter(p => { const t = p.clone().sub(a).dot(dir); return t > -0.02 && t < L + 0.02; })
                  .map(p => p.clone().sub(a).sub(dir.clone().multiplyScalar(p.clone().sub(a).dot(dir))).length()).sort((x, y) => x - y);
    const r = Math.max(0.03, ds.length ? ds[Math.floor(ds.length * 0.85)] : 0.06);
    const cap = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, L), 6, 12), mat());
    cap.position.copy(a.clone().add(b).multiplyScalar(0.5)); cap.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir);
    cap.userData.target = 'tail'; cap.name = 'PROXY_tail_' + (i + 1); cap.renderOrder = 10; scene.add(cap); B['TAIL_0' + (i + 1)].attach(cap);
    proxies.tail.push(cap);
  }
}
function onLoaded(g, label) {
  gltf = g; root = g.scene; scene.add(root);
  document.getElementById('file').textContent = label;
  root.traverse(o => { if (o.name && !(o.name in objs)) objs[o.name] = o; if (o.isMesh) { meshes[o.name] = o; o.frustumCulled = false; } if (o.isBone) B[o.name] = o; });
  root.updateMatrixWorld(true);
  for (const s of ['L', 'R']) { const e = meshes['FOX_Eye_' + s]; if (!e) continue; const p0 = e.getWorldPosition(new THREE.Vector3()), par = e.parent;
    const toLocal = d => par.worldToLocal(p0.clone().add(d)).sub(par.worldToLocal(p0.clone())).divideScalar(d.length());
    e.userData.rest = { pos: e.position.clone(), right: toLocal(new THREE.Vector3(0.001, 0, 0)), up: toLocal(new THREE.Vector3(0, 0.001, 0)) }; }
  mixer = new THREE.AnimationMixer(root);
  for (const clip of g.animations) actions[clip.name] = mixer.clipAction(clip);
  for (const b of BASES) { actions[b].setLoop(THREE.LoopRepeat, Infinity); actions[b].play(); }
  buildProxies();
  for (const n of ['NECK', 'HEAD', 'EAR_L_01', 'EAR_R_01', 'TAIL_01', 'TAIL_02', 'TAIL_03', 'TAIL_04']) { const b = B[n], q = new THREE.Quaternion();
    restoreList.push({ save: () => q.copy(b.quaternion), restore: () => b.quaternion.copy(q) }); }
  for (const n of EXPECT.face.default_visible.concat(EXPECT.face.swap_parts)) { const m = meshes[n]; if (!m || !m.morphTargetInfluences) continue;
    const buf = m.morphTargetInfluences.slice(); restoreList.push({ save: () => buf.splice(0, buf.length, ...m.morphTargetInfluences), restore: () => m.morphTargetInfluences.splice(0, buf.length, ...buf) }); }
  saveMixerState();
  ui(); setExpression('neutral');
  window.__fox = { THREE, gltf, root, mixer, actions, meshes, objs, meshList, visibleTailPoint, bones: B, evalClip: (n, t) => evalClip(n, t), poseDiff: (a, b) => poseDiff(a, b), proxies, st, scene, camera, renderer, controls, ground,
                   setBase, playOneShot, setExpression, setScale, step, pick, control, weightOf, LOOK, SPEC,
                   project: obj => { const v = (obj.isVector3 ? obj.clone() : obj.getWorldPosition(new THREE.Vector3())).project(camera);
                     const r = renderer.domElement.getBoundingClientRect(); return [r.left + (v.x + 1) / 2 * r.width, r.top + (1 - v.y) / 2 * r.height]; } };
  window.__foxReady = true; hud.textContent = 'loaded';
}
const loader = new GLTFLoader();
const url = new URLSearchParams(location.search).get('glb') || '../06_EXPORTS/glb/fox_v2_anim_e1.glb';
loader.load(url, g => onLoaded(g, url.split('/').pop()), undefined, err => {
  errors.push('GLB load failed: ' + err); console.error('GLB load failed', err && err.stack ? err.stack : err); document.getElementById('drop').style.display = 'flex'; hud.textContent = 'GLB not loaded'; });
view.addEventListener('dragover', e => e.preventDefault());
view.addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (!f) return;
  f.arrayBuffer().then(buf => loader.parse(buf, '', g => { document.getElementById('drop').style.display = 'none'; onLoaded(g, f.name); })); });

// ------------------------------------------------------------------ runtime checks (Gate E1)
// pose = per bone: world joint position + world X/Y/Z axes (normalised columns of matrixWorld).
// Axis angles are well defined even under a non-uniformly squashed parent (where decomposing the
// sheared matrix into a quaternion is unstable), and they are what the skinned mesh follows.
function poseOf() { const o = {}; for (const [n, b] of Object.entries(B)) { b.updateWorldMatrix(true, false); const e = b.matrixWorld.elements;
  o[n] = { p: new THREE.Vector3(e[12], e[13], e[14]), x: new THREE.Vector3(e[0], e[1], e[2]).normalize(), y: new THREE.Vector3(e[4], e[5], e[6]).normalize(), z: new THREE.Vector3(e[8], e[9], e[10]).normalize() }; } return o; }
function poseDiff(a, b) { let ang = 0, pos = 0, who = ''; for (const n in a) {
  const d = THREE.MathUtils.radToDeg(Math.max(a[n].x.angleTo(b[n].x), a[n].y.angleTo(b[n].y), a[n].z.angleTo(b[n].z)));
  if (d > ang) { ang = d; who = n; } pos = Math.max(pos, a[n].p.distanceTo(b[n].p)); } return [ang, pos * 1000, who]; }
function evalClip(name, t) {   // pose of a single clip at time t (all other actions weight 0), no procedural layers
  for (const [n, a] of Object.entries(actions)) { a.enabled = true; a.paused = false; if (!a.isScheduled()) a.play();
    a.setEffectiveTimeScale(0); a.setEffectiveWeight(n === name ? 1 : 0); }
  const a = actions[name]; a.setLoop(THREE.LoopRepeat, Infinity); a.time = t;
  invalidateMixerCache(); mixer.update(0); root.updateMatrixWorld(true); saveMixerState(); return poseOf();
}
function resetController() {
  for (const a of Object.values(actions)) { a.stop(); a.setEffectiveTimeScale(1); }
  Object.assign(st, { base: 'idle', shot: null, shotW: 0, shotT: 0, phase: 0, expr: 'neutral', exprW: 0, hover: 'none' });
  st.baseW = { idle: 1, walk: 0, run: 0 }; st.look.yaw = st.look.pitch = st.look.eyeYaw = st.look.eyePitch = 0; st.look.w = 1;
  for (const b of BASES) { actions[b].reset(); actions[b].setLoop(THREE.LoopRepeat, Infinity); actions[b].play(); }
}
window.runChecks = function () {
  const R = []; const add = (name, status, detail) => R.push({ name, status, detail: String(detail ?? '') });
  const T = THREE, wasManual = st.manual; st.manual = true; st.pointerIn = false;
  add('GLB loaded', gltf ? 'PASS' : 'FAIL', gltf ? `${Object.keys(meshes).length} meshes, ${gltf.animations.length} clips` : 'not loaded');
  if (!gltf) return finish(R);
  // clips + durations
  const want = Object.keys(SPEC.clips), have = gltf.animations.map(c => c.name);
  const durBad = want.filter(n => !have.includes(n) || Math.abs(actions[n].getClip().duration - SPEC.clips[n].frames / SPEC.fps) > 1e-3);
  add('7 clips present, durations = spec (starting at t = 0)', !durBad.length ? 'PASS' : 'FAIL',
      want.map(n => `${n} ${actions[n] ? actions[n].getClip().duration.toFixed(3) : '—'} s`).join(', ') + (durBad.length ? ' · bad: ' + durBad : ''));
  // morph contract unchanged
  const mBad = [];
  for (const [n, morphs] of Object.entries(EXPECT.face.morphs)) { const m = meshes[n]; const got = m && m.morphTargetDictionary ? Object.keys(m.morphTargetDictionary) : [];
    if (got.length !== morphs.length || morphs.some(x => !got.includes(x))) mBad.push(n); }
  add('morph-target contract identical to D1.1 (face_morph_map.json)', !mBad.length ? 'PASS' : 'FAIL', mBad.join(', ') || `${Object.keys(EXPECT.face.morphs).length} face meshes, names match`);
  // skeleton
  let skel; root.traverse(o => { if (o.isSkinnedMesh) skel = o.skeleton; });
  const names = skel.bones.map(b => b.name), missing = Object.keys(EXPECT.bones).filter(n => !names.includes(n));
  const badPar = Object.entries(EXPECT.bones).filter(([n, p]) => p && names.includes(n) && B[n].parent.name !== p).map(([n]) => n);
  add('skeleton unchanged (28 joints, hierarchy)', !missing.length && !badPar.length && names.length === 28 ? 'PASS' : 'FAIL', `${names.length} joints; missing [${missing}] wrong parent [${badPar}]`);
  // seamless loops
  const loopRes = [];
  for (const n of ['idle', 'walk', 'run']) { const D = actions[n].getClip().duration; const c = SPEC.clips[n];
    const seam = poseDiff(evalClip(n, 0), evalClip(n, D - 1e-6));
    let per = [0, 0]; if (c.cycle_frames) { const P = c.cycle_frames / SPEC.fps;
      for (let t = 0; t < P; t += 1 / 60) { const d = poseDiff(evalClip(n, t), evalClip(n, t + P)); per = [Math.max(per[0], d[0]), Math.max(per[1], d[1])]; } }
    loopRes.push({ n, seam, per }); }
  add('idle / walk / run loops are seamless (bone axes + joint positions)', loopRes.every(r => r.seam[0] < 0.05 && r.seam[1] < 0.05 && r.per[0] < 0.05) ? 'PASS' : 'FAIL',
      loopRes.map(r => `${r.n}: wrap Δ ${r.seam[0].toFixed(3)}° / ${r.seam[1].toFixed(3)} mm` + (r.n !== 'idle' ? `, cycle periodicity Δ ${r.per[0].toFixed(3)}°` : '')).join(' · '));
  // foot sliding in the browser: floor moves at speed_mps, contact soles must keep their floor position
  const slideRes = [];
  for (const n of ['walk', 'run']) {
    const v = SPEC.clips[n].speed_mps, D = actions[n].getClip().duration, dt = 1 / 120; let worst = 0, samples = 0;
    for (const s of ['L', 'R']) { const legs = meshList('FOX_Leg_' + s);
      const vp = (m, i) => { const p = new T.Vector3(); m.getVertexPosition(i, p); return p.applyMatrix4(m.matrixWorld); };
      evalClip(n, 0); const all = [];
      for (const m of legs) for (let i = 0; i < m.geometry.attributes.position.count; i++) all.push([vp(m, i).y, m, i]);
      all.sort((a, b) => a[0] - b[0]); const idx = all.slice(0, 60).map(x => [x[1], x[2]]);
      let restY = Infinity; for (let t = 0; t < D; t += 1 / 48) { evalClip(n, t); for (const [m, i] of idx) restY = Math.min(restY, vp(m, i).y); }   // floor contact level
      let prev = null;
      for (let t = 0; t <= D; t += dt) { evalClip(n, t); const fl = v * t;
        const cur = idx.map(([m, i]) => vp(m, i));
        const contact = cur.map((p, k) => [k, p]).filter(([, p]) => p.y < restY + 0.001);
        if (prev) for (const [k, p] of contact) { const q = prev.get(k); if (q) { const dz = (p.z + fl) - q[0], dx = p.x - q[1]; worst = Math.max(worst, Math.hypot(dz, dx)); samples++; } }
        prev = new Map(contact.map(([k, p]) => [k, [p.z + fl, p.x]])); } }
    slideRes.push({ n, worst: worst * 1000, samples }); }
  add('no foot sliding in walk/run playback (floor-relative sole drift per 1/120 s)', slideRes.every(r => r.worst < 0.5 && r.samples > 50) ? 'PASS' : 'FAIL',
      slideRes.map(r => `${r.n}: max ${r.worst.toFixed(3)} mm (${r.samples} contact samples)`).join(' · '));
  // transitions: run the controller with fixed steps, check weight sums and pose continuity
  resetController();
  const stepPose = () => { step(1 / 60); return poseOf(); };
  let prevP = stepPose(), maxStepSteady = 0, maxStepTrans = 0, sums = [];
  const sumW = () => Object.keys(actions).reduce((s, n) => s + weightOf(n), 0);
  for (let i = 0; i < 60; i++) { const p = stepPose(); maxStepSteady = Math.max(maxStepSteady, poseDiff(prevP, p)[0]); prevP = p; }
  let steadyInfo = '';
  const sd_ = (label, d) => { if (d[0] > maxStepSteady) { maxStepSteady = d[0]; steadyInfo = `${label}:${d[2]}`; } };
  const tr0 = (label, d) => { if (d[0] > maxStepTrans) { maxStepTrans = d[0]; window.__popInfo = `${label}:${d[2]}`; } };
  setBase('walk'); for (let i = 0; i < 90; i++) { const p = stepPose(); const d = poseDiff(prevP, p); (i < 25 ? tr0('idle→walk', d) : sd_('walk', d)); prevP = p; sums.push(sumW()); }
  setBase('run'); for (let i = 0; i < 90; i++) { const p = stepPose(); const d = poseDiff(prevP, p); (i < 25 ? tr0('walk→run', d) : sd_('run', d)); prevP = p; sums.push(sumW()); }
  let popInfo = '';
  const tr = (label, d) => { if (d[0] > maxStepTrans) { maxStepTrans = d[0]; popInfo = `${label}:${d[2]}`; } };
  setBase('idle'); for (let i = 0; i < 60; i++) { const p = stepPose(); tr('run→idle', poseDiff(prevP, p)); prevP = p; sums.push(sumW()); }
  const shots = {};
  for (const n of ONESHOTS) { playOneShot(n); const D = actions[n].getClip().duration; let peak = 0, ends = false;
    for (let t = 0; t < D + 0.3; t += 1 / 60) { const p = stepPose(); tr(n + '@' + t.toFixed(2), poseDiff(prevP, p)); prevP = p; sums.push(sumW()); peak = Math.max(peak, weightOf(n)); }
    ends = st.shot === null && weightOf('idle') > 0.99; shots[n] = { peak, ends }; }
  const sumOK = sums.every(s => Math.abs(s - 1) < 0.01);
  add('smooth transitions (base cross-fades + one-shots in/out, no pose pops)', sumOK && maxStepTrans <= maxStepSteady * 1.25 + 0.2 && ONESHOTS.every(n => shots[n].peak > 0.99 && shots[n].ends) ? 'PASS' : 'FAIL',
      `weight sums ${Math.min(...sums).toFixed(3)}–${Math.max(...sums).toFixed(3)}; max joint step per 1/60 s: transitions ${maxStepTrans.toFixed(2)}° (${popInfo || window.__popInfo}) vs steady clips ${maxStepSteady.toFixed(2)}° (${steadyInfo}); one-shots return to base: ${ONESHOTS.map(n => n + (shots[n].ends ? ' ✓' : ' ✗')).join(' ')}`);
  // look-at: clamp + damping
  resetController(); for (let i = 0; i < 30; i++) step(1 / 60);
  const headYawRel = () => { const qh = B.HEAD.getWorldQuaternion(new T.Quaternion()), qs = B.SPINE.getWorldQuaternion(new T.Quaternion());
    const f = new T.Vector3(0, 0, 1).applyQuaternion(qs.invert().multiply(qh)); return [T.MathUtils.radToDeg(Math.atan2(f.x, f.z)), T.MathUtils.radToDeg(Math.atan2(f.y, Math.hypot(f.x, f.z)))]; };
  const base0 = headYawRel();
  st.pointerIn = true; st.pointer.set(0.98, 0.05); let yaws = [];
  for (let i = 0; i < 120; i++) { step(1 / 60); yaws.push(headYawRel()[0] - base0[0]); }
  const yawMax = Math.max(...yaws.map(Math.abs)); let maxDY = 0; for (let i = 1; i < yaws.length; i++) maxDY = Math.max(maxDY, Math.abs(yaws[i] - yaws[i - 1]));
  st.pointer.set(0.0, 0.98); let pit = []; for (let i = 0; i < 120; i++) { step(1 / 60); pit.push(headYawRel()[1] - base0[1]); }
  const pitchMax = Math.max(...pit);
  add('look_at_cursor: clamped and damped', yawMax <= LOOK.yawMax + 0.5 && yawMax > 20 && pitchMax <= LOOK.pitchUp + 0.5 && maxDY < 3 ? 'PASS' : 'FAIL',
      `total head yaw reached ${yawMax.toFixed(1)}° (limit ±${LOOK.yawMax}°, clip motion included), pitch up ${pitchMax.toFixed(1)}° (limit ${LOOK.pitchUp}°), largest per-frame change ${maxDY.toFixed(2)}°`);
  // priority: head_pet owns the head -> look-at must not change it
  st.pointer.set(0.98, 0.05); playOneShot('head_pet'); for (let i = 0; i < 70; i++) step(1 / 60);
  const lw = st.look.w, withLook = { HEAD: poseOf().HEAD };
  const t = actions.head_pet.time; const clipOnly = { HEAD: evalClip('head_pet', t).HEAD };
  const prioDiff = poseDiff(withLook, clipOnly)[0];
  add('head tracking never overrides a clip that owns the head', lw < 0.05 && prioDiff < 0.75 ? 'PASS' : 'FAIL',
      `during head_pet (head_control 1): look weight ${lw.toFixed(3)}, HEAD differs from the clip pose by ${prioDiff.toFixed(2)}° with the cursor far right`);
  // picking
  resetController(); st.pointerIn = false; for (let i = 0; i < 5; i++) step(1 / 60);
  const ndc = p => { const v = p.clone().project(camera); return new T.Vector2(v.x, v.y); };
  const hp = pick(ndc(proxies.head.getWorldPosition(new T.Vector3())));
  const vt = visibleTailPoint(); const tp = vt ? pick(new T.Vector2(vt.ndc[0], vt.ndc[1])) : { target: 'none' };
  // a tail point hidden behind the head must resolve to the head (front-most surface wins)
  const hiddenTail = (() => { for (let i = 3; i >= 0; i--) { const r = pick(ndc(proxies.tail[i].getWorldPosition(new T.Vector3()))); if (r.target !== 'tail') return `segment ${i + 1} centre → ${r.target}`; } return 'all segments visible'; })();
  const belly = B.HIPS.getWorldPosition(new T.Vector3()).add(new T.Vector3(0, 0.05 * st.scale, 0.15 * st.scale)), bp = pick(ndc(belly));
  add('raycast picking: head / tail / elsewhere', hp.target === 'head' && tp.target === 'tail' && bp.target === 'none' ? 'PASS' : 'FAIL',
      `head centre → ${hp.target}, visible tail surface (${vt ? vt.count : 0} sampled points) → ${tp.target}, belly → ${bp.target}${bp.blocked ? ' (body occludes tail)' : ''}; occluded tail: ${hiddenTail}`);
  // expressions via morph targets: manual control when free, suspended while a clip owns the face
  resetController(); setExpression('sad'); for (let i = 0; i < 40; i++) step(1 / 60);
  const bs = meshes.FOX_Brow_L.morphTargetInfluences[meshes.FOX_Brow_L.morphTargetDictionary.Sad];
  playOneShot('happy'); for (let i = 0; i < 25; i++) step(1 / 60);
  const bs2 = meshes.FOX_Brow_L.morphTargetInfluences[meshes.FOX_Brow_L.morphTargetDictionary.Sad];
  const hap = meshes.FOX_EyeClosedHappy_L.morphTargetInfluences[meshes.FOX_EyeClosedHappy_L.morphTargetDictionary.show];
  add('expression controls drive the morph targets; clips with face control take over', bs > 0.97 && bs2 < 0.05 && hap > 0.95 ? 'PASS' : 'FAIL',
      `sad brow ${bs.toFixed(2)} on idle; during happy: sad brow ${bs2.toFixed(2)}, happy eyes ${hap.toFixed(2)}`);
  setExpression('neutral');
  // level scale
  resetController(); step(1 / 60);
  const H = s => { setScale(s); step(0); root.updateMatrixWorld(true); return new T.Box3().setFromObject(root, true).getSize(new T.Vector3()).y; };
  const h10 = H(1), h08 = H(0.8), h11 = H(1.1); setScale(1);
  add('level scale 0.8–1.1 (uniform)', Math.abs(h08 / h10 - 0.8) < 0.01 && Math.abs(h11 / h10 - 1.1) < 0.01 ? 'PASS' : 'FAIL', `×0.8 → ${(h08 / h10).toFixed(3)}, ×1.1 → ${(h11 / h10).toFixed(3)} (floor speed scales too)`);
  add('statistics shown (FPS, triangles, draw calls)', /fps/.test(hud.textContent) && /tris/.test(hud.textContent) ? 'PASS' : 'FAIL', hud.textContent.split('\n')[0]);
  add('no browser console errors', errors.length ? 'FAIL' : 'PASS', errors.join(' | ') || 'none');
  resetController(); st.manual = wasManual;
  return finish(R);
};
function finish(R) {
  window.__foxReport = R;
  document.getElementById('report').innerHTML = R.map(r => `<tr><td class="s ${r.status}">${r.status}</td><td><b>${r.name}</b><br><span style="color:#7a6355">${r.detail}</span></td></tr>`).join('');
  return R;
}
document.getElementById('checks').onclick = () => window.runChecks();
</script>
</body>
</html>
"""

out = os.path.join(ROOT, '07_WEB_PREVIEW', 'fox_interactive_e1.html')
html = (HTML.replace('__SPEC__', json.dumps(spec))
            .replace('__PALETTE__', json.dumps(palette))
            .replace('__BONES__', json.dumps(bones))
            .replace('__FACE__', json.dumps({k: face[k] for k in ('expressions', 'default_visible', 'swap_parts', 'morphs')})))
open(out, 'w', encoding='utf-8').write(html)
print(out, len(html), 'bytes')
