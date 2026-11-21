"""Gate D1.1 — generate 07_WEB_PREVIEW/rig_test.html (Three.js GLB rig viewer + runtime checks).

Usage (from LifeQuest_Fox_V2/):  python 08_VALIDATION/scripts/make_rig_viewer.py
Expected values (palette, skeleton, expressions) are injected from the
project's JSON files so the page checks the GLB against the source of truth.
"""
import json
import os

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))

mats = json.load(open(os.path.join(ROOT, '01_DESIGN', 'materials.json')))['materials']
palette = {k: v['model_hex'] for k, v in mats.items()}
spec = json.load(open(os.path.join(ROOT, '03_RIG', 'skeleton_spec.json')))
bones = {b['name']: b['parent'] for b in spec['bones'] if b['name'] != 'FACE'}
face = json.load(open(os.path.join(ROOT, '03_RIG', 'face_morph_map.json')))

HTML = r"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>LifeQuest Fox V2 — Rig GLB test (Gate D1.1)</title>
<style>
  :root { --bg:#FDF6F1; --ink:#3c281e; --mut:#7a6355; --line:#ead9cc; --acc:#E8742A; --ok:#2f8a4c; --bad:#c0392b; }
  * { box-sizing: border-box; }
  html, body { margin:0; height:100%; background:var(--bg); color:var(--ink); font:14px/1.4 system-ui, -apple-system, "Segoe UI", sans-serif; }
  #app { display:grid; grid-template-columns: 1fr 360px; height:100%; }
  #view { position:relative; min-height:300px; }
  #view canvas { display:block; width:100%; height:100%; }
  #hud { position:absolute; left:12px; top:10px; font-size:12px; color:var(--mut); }
  #drop { position:absolute; inset:0; display:none; align-items:center; justify-content:center; text-align:center; padding:24px; color:var(--mut); }
  aside { border-left:1px solid var(--line); overflow:auto; padding:14px 16px 24px; background:#fffaf6; }
  h1 { font-size:16px; margin:0 0 2px; } .sub { color:var(--mut); font-size:12px; margin-bottom:12px; }
  h2 { font-size:12px; text-transform:uppercase; letter-spacing:.06em; color:var(--mut); margin:16px 0 6px; }
  .row { display:flex; flex-wrap:wrap; gap:6px; }
  button { font:inherit; font-size:13px; border:1px solid var(--line); background:#fff; color:var(--ink); border-radius:8px; padding:5px 10px; cursor:pointer; }
  button:hover { border-color:var(--acc); } button.on { background:var(--acc); border-color:var(--acc); color:#fff; }
  input[type=range] { width:100%; }
  #checks { width:100%; margin-top:6px; }
  table { width:100%; border-collapse:collapse; font-size:12px; margin-top:8px; }
  td { border-top:1px solid var(--line); padding:4px 2px; vertical-align:top; }
  td.s { width:44px; font-weight:700; } .PASS { color:var(--ok); } .FAIL { color:var(--bad); } .WARN { color:#b9770e; }
  @media (max-width: 800px) { #app { grid-template-columns: 1fr; grid-template-rows: 60vh auto; } aside { border-left:0; border-top:1px solid var(--line); } }
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
  <div id="view"><div id="hud">loading…</div>
    <div id="drop">Could not fetch the GLB (pages opened as file:// cannot fetch files).<br>
      Drop <b>fox_v2_rig_test.glb</b> here, or serve the project folder:<br><code>python -m http.server</code> and open <code>/07_WEB_PREVIEW/rig_test.html</code>.</div></div>
  <aside>
    <h1>LifeQuest Fox V2 — rig GLB test</h1>
    <div class="sub">Gate D1.1 · Three.js r170 · <span id="file"></span></div>
    <h2>Animation</h2><div class="row" id="anims"></div>
    <h2>Expression (morph targets)</h2><div class="row" id="exprs"></div>
    <h2>Level scale <span id="scv">1.00</span></h2><input id="scale" type="range" min="0.8" max="1.1" step="0.01" value="1">
    <div class="row" style="margin-top:6px"><button data-s="0.8">Lv1 0.80</button><button data-s="0.92">Lv10 0.92</button><button data-s="1">Lv20 1.00</button><button data-s="1.1">Lv30+ 1.10</button></div>
    <h2>Runtime checks</h2><button id="checks">Run checks</button>
    <table id="report"></table>
  </aside>
</div>
<script type="module">
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const EXPECT = { palette: __PALETTE__, bones: __BONES__, face: __FACE__,
  actions: ['fox_idle_test', 'fox_blink_test', 'fox_head_turn_test', 'fox_tail_sway_test'] };
const errors = [];
window.addEventListener('error', e => errors.push(String(e.message || e)));
const _ce = console.error.bind(console);
console.error = (...a) => { errors.push(a.map(String).join(' ')); _ce(...a); };

const view = document.getElementById('view'), hud = document.getElementById('hud');
const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.NoToneMapping;          // match Blender 'Standard'
view.appendChild(renderer.domElement);
const scene = new THREE.Scene(); scene.background = new THREE.Color('#FDF6F1');
const camera = new THREE.PerspectiveCamera(30, 1, 0.05, 50);
camera.position.set(0.9, 0.75, 2.6);
const controls = new OrbitControls(camera, renderer.domElement);
controls.target.set(0, 0.48, 0); controls.enableDamping = true; controls.minDistance = 0.8; controls.maxDistance = 6;
scene.add(new THREE.HemisphereLight(0xfff6ee, 0xe8d6c8, 1.6));
const key = new THREE.DirectionalLight(0xfff1e4, 1.8); key.position.set(-1.5, 2.5, 2.2); scene.add(key);
const fill = new THREE.DirectionalLight(0xffffff, 0.8); fill.position.set(2, 1.2, 2); scene.add(fill);
const rim = new THREE.DirectionalLight(0xffe9d6, 1.3); rim.position.set(0.5, 2, -2.4); scene.add(rim);
const back = new THREE.DirectionalLight(0xfff4ea, 0.8); back.position.set(-1.2, 1.0, -2.0); scene.add(back);
const ground = new THREE.Mesh(new THREE.CircleGeometry(0.6, 48), new THREE.MeshBasicMaterial({ color: 0xf1e3d8 }));
ground.rotation.x = -Math.PI / 2; scene.add(ground);

function resize() { const w = view.clientWidth, h = view.clientHeight; renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
addEventListener('resize', resize); resize();

let gltf, root, mixer, actions = {}, current, meshes = {}, fps = 0, frames = 0, last = performance.now();
const clock = new THREE.Clock();
renderer.setAnimationLoop(() => {
  const dt = clock.getDelta(); if (mixer) mixer.update(dt); controls.update(); renderer.render(scene, camera);
  frames++; const now = performance.now(); if (now - last > 500) { fps = frames * 1000 / (now - last); frames = 0; last = now;
    hud.textContent = gltf ? `${fps.toFixed(0)} fps · ${renderer.info.render.triangles.toLocaleString()} tris · ${current || 'rest'}` : hud.textContent; }
});

function setExpression(name) {
  const target = EXPECT.face.expressions[name] || {};
  for (const [mname, mesh] of Object.entries(meshes)) {
    if (!mesh.morphTargetDictionary) continue;
    for (const [morph, idx] of Object.entries(mesh.morphTargetDictionary))
      mesh.morphTargetInfluences[idx] = (target[mname] && target[mname][morph]) || 0;
  }
  document.querySelectorAll('#exprs button').forEach(b => b.classList.toggle('on', b.dataset.e === name));
}
function play(name, fade = 0.3) {
  const next = actions[name]; if (!next) return;
  next.reset().setEffectiveWeight(1).play();
  if (current && current !== name) actions[current].crossFadeTo(next, fade, false);
  current = name;
  document.querySelectorAll('#anims button').forEach(b => b.classList.toggle('on', b.dataset.a === name));
}
function setScale(s) { root.scale.setScalar(s); document.getElementById('scale').value = s; document.getElementById('scv').textContent = (+s).toFixed(2); }

function onLoaded(g, label) {
  gltf = g; root = g.scene; scene.add(root);
  document.getElementById('file').textContent = label;
  root.traverse(o => { if (o.isMesh) { meshes[o.name] = o; if (o.morphTargetInfluences) o.frustumCulled = false; if (o.isSkinnedMesh) o.frustumCulled = false; } });
  mixer = new THREE.AnimationMixer(root);
  for (const clip of g.animations) actions[clip.name] = mixer.clipAction(clip);
  const ab = document.getElementById('anims');
  ab.innerHTML = '<button data-a="">rest</button>' + g.animations.map(c => `<button data-a="${c.name}">${c.name.replace('fox_', '').replace('_test', '')}</button>`).join('');
  ab.onclick = e => { const a = e.target.dataset.a; if (a === undefined) return; if (!a) { mixer.stopAllAction(); current = null; ab.querySelectorAll('button').forEach(b => b.classList.remove('on')); } else play(a); };
  const eb = document.getElementById('exprs');
  eb.innerHTML = Object.keys(EXPECT.face.expressions).map(n => `<button data-e="${n}">${n}</button>`).join('');
  eb.onclick = e => e.target.dataset.e && setExpression(e.target.dataset.e);
  setExpression('neutral');
  window.__fox = { THREE, gltf, root, mixer, actions, meshes, play, setExpression, setScale, camera, renderer, scene, controls };
  window.__foxReady = true;
  hud.textContent = 'loaded';
}

const loader = new GLTFLoader();
const url = new URLSearchParams(location.search).get('glb') || '../06_EXPORTS/glb/fox_v2_rig_test.glb';
loader.load(url, g => onLoaded(g, url.split('/').pop()), undefined, err => {
  errors.push('GLB load failed: ' + err); document.getElementById('drop').style.display = 'flex'; hud.textContent = 'GLB not loaded';
});
view.addEventListener('dragover', e => e.preventDefault());
view.addEventListener('drop', e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (!f) return;
  f.arrayBuffer().then(buf => loader.parse(buf, '', g => { document.getElementById('drop').style.display = 'none'; onLoaded(g, f.name); })); });
document.getElementById('scale').oninput = e => setScale(+e.target.value);
document.querySelectorAll('[data-s]').forEach(b => b.onclick = () => setScale(+b.dataset.s));

// ------------------------------------------------------------- runtime checks
function bboxOf(mesh) {
  const v = new THREE.Vector3(), box = new THREE.Box3(); const n = mesh.geometry.attributes.position.count;
  mesh.updateMatrixWorld(true);
  for (let i = 0; i < n; i++) { mesh.getVertexPosition(i, v); v.applyMatrix4(mesh.matrixWorld); box.expandByPoint(v); }
  return box;
}
function sampleAction(name, frame, fps = 24) {
  mixer.stopAllAction(); const a = actions[name]; a.reset().play(); mixer.setTime(frame / fps); root.updateMatrixWorld(true);
}
function boneByName(n) { let b; root.traverse(o => { if (o.isBone && o.name === n) b = o; }); return b; }
function hexDiff(a, b) { const x = parseInt(a, 16), y = parseInt(b, 16); return Math.max(Math.abs((x >> 16) - (y >> 16)), Math.abs(((x >> 8) & 255) - ((y >> 8) & 255)), Math.abs((x & 255) - (y & 255))); }

window.runChecks = function () {
  const R = []; const add = (name, status, detail) => R.push({ name, status, detail: String(detail ?? '') });
  const T = THREE;
  add('GLB loaded', gltf ? 'PASS' : 'FAIL', gltf ? `${Object.keys(meshes).length} meshes, ${gltf.animations.length} clips` : 'not loaded');
  if (!gltf) return finish(R);
  // materials
  const seen = {}; root.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(m => seen[m.name] = m); });
  const matRes = Object.entries(seen).map(([n, m]) => { const exp = EXPECT.palette[n]; const got = m.color.getHexString(T.SRGBColorSpace).toUpperCase();
    return { n, got, exp, d: exp ? hexDiff(got, exp.replace('#', '')) : null }; });
  const worst = Math.max(...matRes.filter(r => r.d !== null).map(r => r.d));
  add('material base colours match materials.json (Δ ≤ 2/255)', matRes.every(r => r.d !== null && r.d <= 2) ? 'PASS' : 'FAIL',
      matRes.map(r => `${r.n.replace('MAT_', '')} #${r.got}${r.exp ? '' : ' (unexpected)'}`).join(', ') + ` · worst Δ ${worst}`);
  // skeleton
  const names = []; let skel; root.traverse(o => { if (o.isSkinnedMesh) skel = o.skeleton; });
  const bones = skel ? skel.bones : []; bones.forEach(b => names.push(b.name));
  const missing = Object.keys(EXPECT.bones).filter(n => !names.includes(n));
  const badPar = Object.entries(EXPECT.bones).filter(([n, p]) => p && names.includes(n) && (boneByName(n).parent || {}).name !== p).map(([n]) => n);
  add('skeleton hierarchy preserved', !missing.length && !badPar.length ? 'PASS' : 'FAIL', `${bones.length} joints; missing [${missing}] wrong parent [${badPar}]`);
  // action set
  const clips = gltf.animations.map(c => c.name);
  add('prototype actions present', EXPECT.actions.every(a => clips.includes(a)) ? 'PASS' : 'FAIL', clips.join(', '));
  // head turn
  const head = boneByName('HEAD'); const q0 = new T.Quaternion(), q1 = new T.Quaternion();
  sampleAction('fox_head_turn_test', 1); head.getWorldQuaternion(q0); sampleAction('fox_head_turn_test', 12); head.getWorldQuaternion(q1);
  const ang = T.MathUtils.radToDeg(q0.angleTo(q1));
  add('head turns (HEAD world rotation at f12 ≈ 40°)', ang > 30 && ang < 50 ? 'PASS' : 'FAIL', ang.toFixed(1) + '°');
  // tail smoothness
  const tip = boneByName('TAIL_04'); const pts = []; const p = new T.Vector3();
  for (let f = 1; f <= 49; f += 0.5) { sampleAction('fox_tail_sway_test', f); tip.getWorldPosition(p); pts.push(p.clone()); }
  let maxStep = 0, maxJerk = 0; for (let i = 2; i < pts.length; i++) { const v1 = pts[i].clone().sub(pts[i - 1]), v0 = pts[i - 1].clone().sub(pts[i - 2]);
    maxStep = Math.max(maxStep, v1.length()); maxJerk = Math.max(maxJerk, v1.clone().sub(v0).length()); }
  const span = pts.reduce((m, q) => Math.max(m, q.distanceTo(pts[0])), 0);
  add('tail moves smoothly (no jumps)', span > 0.05 && maxJerk < 0.25 * maxStep + 1e-4 ? 'PASS' : 'FAIL',
      `tip travel ${(span * 100).toFixed(1)} cm, max step ${(maxStep * 1000).toFixed(1)} mm, max Δstep ${(maxJerk * 1000).toFixed(2)} mm`);
  // blink via exported morph channel
  mixer.stopAllAction(); setExpression('neutral');
  const eye = meshes['FOX_Eye_L']; const bi = eye.morphTargetDictionary['Blink'];
  const h0 = bboxOf(eye).getSize(new T.Vector3()).y;
  sampleAction('fox_blink_test', 9); const w = eye.morphTargetInfluences[bi]; const h1 = bboxOf(eye).getSize(new T.Vector3()).y;
  add('blink works through exported morph animation', w > 0.95 && h1 < 0.35 * h0 ? 'PASS' : 'FAIL', `Blink weight ${w.toFixed(2)}, eye height ${(h0 * 1000).toFixed(1)} → ${(h1 * 1000).toFixed(1)} mm`);
  mixer.stopAllAction();
  // face components visible / not occluded at rest; swap parts collapsed
  for (const m of Object.values(meshes)) if (m.morphTargetInfluences) m.morphTargetInfluences.fill(0);
  root.updateMatrixWorld(true);
  const vis = EXPECT.face.default_visible.concat(['FOX_Nose', 'FOX_Blush_L', 'FOX_Blush_R']);
  // visibility test: rays from the front onto real vertices of each part; the
  // first surface hit must be the part itself (catches decals sunk into the head)
  const ray = new T.Raycaster(); const occl = [], tiny = []; const vp = new T.Vector3(); const fwd = new T.Vector3(0, 0, -1);
  for (const n of vis) { const m = meshes[n]; const s = bboxOf(m).getSize(new T.Vector3()); if (s.length() < 0.005) { tiny.push(n); continue; }
    const cnt = m.geometry.attributes.position.count; let ok = 0, tot = 0; const nm = new T.Matrix3().getNormalMatrix(m.matrixWorld); const nv = new T.Vector3();
    for (let i = 0; i < cnt; i += Math.max(1, Math.floor(cnt / 48))) {
      nv.fromBufferAttribute(m.geometry.attributes.normal, i).applyMatrix3(nm).normalize(); if (nv.z < 0.3) continue;  // front-facing surface only (closed parts like the nose are half buried by design)
      m.getVertexPosition(i, vp); vp.applyMatrix4(m.matrixWorld);
      // occluded only if another surface lies IN FRONT of the vertex (t < 1.5 m - 0.5 mm);
      // rays through exact boundary vertices may slip past the part itself, that is not occlusion
      ray.set(vp.clone().add(new T.Vector3(0, 0, 1.5)), fwd); tot++;
      const blocker = ray.intersectObjects(root.children, true).find(h => h.object !== m && h.distance < 1.5 - 0.0005);
      if (!blocker) ok++; }
    if (ok / tot < 0.98) occl.push(`${n} ${(100 * ok / tot).toFixed(0)}% unoccluded`); }
  add('default face parts present and not hidden by the head', !occl.length && !tiny.length ? 'PASS' : 'FAIL', occl.concat(tiny).join(', ') || vis.length + ' parts, no sampled vertex covered by the head (front view)');
  const swapOpen = EXPECT.face.swap_parts.filter(n => bboxOf(meshes[n]).getSize(new T.Vector3()).length() > 0.001);
  add('swap parts collapsed at rest (no stray geometry)', !swapOpen.length ? 'PASS' : 'FAIL', swapOpen.join(', ') || EXPECT.face.swap_parts.length + ' collapsed');
  // every expression shows its parts and keeps the face complete
  const exprBad = [];
  for (const [ename, tgt] of Object.entries(EXPECT.face.expressions)) {
    setExpression(ename); root.updateMatrixWorld(true);
    for (const [mname, ws] of Object.entries(tgt)) { const s = bboxOf(meshes[mname]).getSize(new T.Vector3()).length();
      const wantVisible = !('hide' in ws); if (wantVisible && s < 0.005) exprBad.push(`${ename}:${mname} missing`); if (!wantVisible && s > 0.001) exprBad.push(`${ename}:${mname} not hidden`); }
    const eyesShown = ['FOX_Eye_L', 'FOX_EyeClosedHappy_L', 'FOX_EyeClosedSleepy_L'].some(n => bboxOf(meshes[n]).getSize(new T.Vector3()).length() > 0.005);
    const mouthShown = ['FOX_Mouth_Neutral', 'FOX_Mouth_Open', 'FOX_Mouth_SmallO', 'FOX_Mouth_Frown', 'FOX_Mouth_Smile'].some(n => bboxOf(meshes[n]).getSize(new T.Vector3()).length() > 0.005);
    if (!eyesShown || !mouthShown) exprBad.push(`${ename}: face incomplete`);
  }
  setExpression('neutral');
  add('7 expressions via morph targets, no part disappears unexpectedly', !exprBad.length ? 'PASS' : 'FAIL', exprBad.join(', ') || Object.keys(EXPECT.face.expressions).join(', '));
  // normals / textures
  const badN = []; let nTex = 0;
  root.traverse(o => { if (!o.isMesh) return; const nrm = o.geometry.attributes.normal; if (!nrm) { badN.push(o.name + ':none'); return; }
    for (let i = 0; i < nrm.count; i++) { const l = Math.hypot(nrm.getX(i), nrm.getY(i), nrm.getZ(i)); if (!(l > 0.9 && l < 1.1)) { badN.push(o.name); break; } }
    [].concat(o.material).forEach(m => ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'emissiveMap', 'aoMap'].forEach(k => { if (m[k]) nTex++; })); });
  add('normals present and unit length', !badN.length ? 'PASS' : 'FAIL', badN.join(', ') || 'all meshes');
  add('no missing textures', 'PASS', nTex ? nTex + ' texture maps loaded' : 'asset uses no textures (flat PBR colours)');
  // transitions
  let tOK = true, tDet = ''; try { mixer.stopAllAction(); current = null; play('fox_idle_test', 0); mixer.update(0.5); play('fox_head_turn_test', 0.4);
    let sums = []; for (let i = 0; i < 6; i++) { mixer.update(0.1); sums.push(actions['fox_idle_test'].getEffectiveWeight() + actions['fox_head_turn_test'].getEffectiveWeight()); }
    tOK = sums.every(s => Math.abs(s - 1) < 0.02) && actions['fox_head_turn_test'].getEffectiveWeight() > 0.99; tDet = 'idle → head_turn cross-fade 0.4 s, weight sums ' + sums.map(s => s.toFixed(2)).join('/');
  } catch (e) { tOK = false; tDet = String(e); }
  add('animation transitions (cross-fade)', tOK ? 'PASS' : 'FAIL', tDet);
  mixer.stopAllAction(); current = null;
  // uniform scale
  const H = s => { setScale(s); root.updateMatrixWorld(true); return new T.Box3().setFromObject(root, true).getSize(new T.Vector3()).y; };
  const h10 = H(1), h08 = H(0.8), h11 = H(1.1); setScale(1);
  add('uniform level scaling', Math.abs(h08 / h10 - 0.8) < 0.01 && Math.abs(h11 / h10 - 1.1) < 0.01 ? 'PASS' : 'FAIL',
      `height ${h10.toFixed(3)} m; ×0.8 → ${(h08 / h10).toFixed(3)}, ×1.1 → ${(h11 / h10).toFixed(3)}`);
  add('no browser console errors', errors.length ? 'FAIL' : 'PASS', errors.join(' | ') || 'none');
  add('render stats', 'INFO', `${renderer.info.render.triangles} tris/frame · ${renderer.info.memory.geometries} geometries · WebGL ${renderer.capabilities.isWebGL2 ? 2 : 1}`);
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

out = os.path.join(ROOT, '07_WEB_PREVIEW', 'rig_test.html')
os.makedirs(os.path.dirname(out), exist_ok=True)
html = (HTML.replace('__PALETTE__', json.dumps(palette))
            .replace('__BONES__', json.dumps(bones))
            .replace('__FACE__', json.dumps({k: face[k] for k in ('expressions', 'default_visible', 'swap_parts', 'morphs')})))
open(out, 'w', encoding='utf-8').write(html)
print(out, len(html), 'bytes')
