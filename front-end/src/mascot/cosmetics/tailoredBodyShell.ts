import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  MeshStandardMaterial,
  Object3D,
  SkinnedMesh,
  Vector3
} from 'three';

export type TailoredBodyId = 'simple_jacket' | 'sports_jersey' | 'ninja_gi' | 'tet_ao_dai';

const TAILORED_IDS = new Set<string>(['simple_jacket', 'sports_jersey', 'ninja_gi', 'tet_ao_dai']);

export function isTailoredBodyCosmetic(id: string): id is TailoredBodyId {
  return TAILORED_IDS.has(id);
}

interface GarmentStyle {
  baseColor: string;
  trimColor: string;
  accentColor: string;
  hasSleeves: boolean;
  openFrontHalfWidth: number; // >0 opens jacket front to show cute cream belly
  hemY: number;
  collarY: number;
  hasBelt: boolean;
  hasChestStripe: boolean;
  hasGoldTrim: boolean;
}

const GARMENT_STYLES: Record<TailoredBodyId, GarmentStyle> = {
  simple_jacket: {
    baseColor: '#1E7F8C',
    trimColor: '#193554',
    accentColor: '#F26B3A',
    hasSleeves: true,
    openFrontHalfWidth: 0.068,
    hemY: 0.142,
    collarY: 0.375,
    hasBelt: false,
    hasChestStripe: false,
    hasGoldTrim: false
  },
  sports_jersey: {
    baseColor: '#1F6FD1',
    trimColor: '#F8FAFC',
    accentColor: '#F2C14E',
    hasSleeves: false,
    openFrontHalfWidth: 0,
    hemY: 0.145,
    collarY: 0.372,
    hasBelt: false,
    hasChestStripe: true,
    hasGoldTrim: false
  },
  ninja_gi: {
    baseColor: '#262C3A',
    trimColor: '#151924',
    accentColor: '#E0533A',
    hasSleeves: true,
    openFrontHalfWidth: 0,
    hemY: 0.142,
    collarY: 0.375,
    hasBelt: true,
    hasChestStripe: false,
    hasGoldTrim: false
  },
  tet_ao_dai: {
    baseColor: '#C1121F',
    trimColor: '#E9B949',
    accentColor: '#FFE599',
    hasSleeves: true,
    openFrontHalfWidth: 0,
    hemY: 0.132,
    collarY: 0.378,
    hasBelt: false,
    hasChestStripe: false,
    hasGoldTrim: true
  }
};

/**
 * Inflates a cloned Fox carrier BufferGeometry smoothly along vertex normals so the
 * garment wraps cleanly outside Fox's body/arms with zero clipping and zero jagged cutouts.
 * Stores original rest-pose positions in `aRestPos` for razor-smooth per-fragment tailoring.
 */
function buildInflatedShellGeometry(src: BufferGeometry, inflationMeters: number): BufferGeometry {
  const geo = src.clone();
  const pos = geo.attributes.position as BufferAttribute;
  if (!geo.attributes.normal) geo.computeVertexNormals();
  const norm = geo.attributes.normal as BufferAttribute;

  const restArr = new Float32Array(pos.count * 3);
  const v = new Vector3();
  const n = new Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    restArr[i * 3] = v.x;
    restArr[i * 3 + 1] = v.y;
    restArr[i * 3 + 2] = v.z;

    n.fromBufferAttribute(norm, i).normalize();
    pos.setXYZ(
      i,
      v.x + n.x * inflationMeters,
      v.y + n.y * inflationMeters,
      v.z + n.z * inflationMeters
    );
  }

  pos.needsUpdate = true;
  geo.setAttribute('aRestPos', new BufferAttribute(restArr, 3));
  geo.computeBoundingBox();
  geo.computeBoundingSphere();
  return geo;
}

function buildTailoredMaterial(style: GarmentStyle, isSleeve: boolean): MeshStandardMaterial {
  const mat = new MeshStandardMaterial({
    color: new Color(style.baseColor),
    roughness: 0.72,
    metalness: 0.04,
    side: DoubleSide
  });

  const trim = new Color(style.trimColor);
  const accent = new Color(style.accentColor);

  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uTrimColor = { value: trim };
    shader.uniforms.uAccentColor = { value: accent };
    shader.uniforms.uHemY = { value: style.hemY };
    shader.uniforms.uCollarY = { value: style.collarY };
    shader.uniforms.uOpenFront = { value: style.openFrontHalfWidth };
    shader.uniforms.uHasBelt = { value: style.hasBelt ? 1.0 : 0.0 };
    shader.uniforms.uHasStripe = { value: style.hasChestStripe ? 1.0 : 0.0 };
    shader.uniforms.uHasGoldTrim = { value: style.hasGoldTrim ? 1.0 : 0.0 };
    shader.uniforms.uIsSleeve = { value: isSleeve ? 1.0 : 0.0 };

    shader.vertexShader = shader.vertexShader
      .replace(
        '#include <common>',
        `#include <common>
        attribute vec3 aRestPos;
        varying vec3 vRestPos;`
      )
      .replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vRestPos = aRestPos;`
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        '#include <common>',
        `#include <common>
        varying vec3 vRestPos;
        uniform vec3 uTrimColor;
        uniform vec3 uAccentColor;
        uniform float uHemY;
        uniform float uCollarY;
        uniform float uOpenFront;
        uniform float uHasBelt;
        uniform float uHasStripe;
        uniform float uHasGoldTrim;
        uniform float uIsSleeve;`
      )
      .replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        if (uIsSleeve > 0.5) {
          // Smooth tailored 3/4 sleeve ending cleanly before brown paws
          if (vRestPos.y < 0.228 || vRestPos.y > 0.382 || abs(vRestPos.x) > 0.238) {
            discard;
          }
          // Crisp cuff trim along lower sleeve edge
          if (vRestPos.y < 0.244 || abs(vRestPos.x) > 0.225) {
            diffuseColor.rgb = mix(diffuseColor.rgb, uTrimColor, 0.88);
          }
        } else {
          // Smooth torso hem & neckline
          if (vRestPos.y < uHemY || vRestPos.y > uCollarY) {
            discard;
          }
          // Smooth open-front jacket curve (reveals Fox's cute cream belly cleanly)
          if (uOpenFront > 0.001 && vRestPos.z > 0.04) {
            float curveOpen = uOpenFront + 0.022 * smoothstep(0.25, 0.36, vRestPos.y);
            if (abs(vRestPos.x) < curveOpen) {
              discard;
            }
            if (abs(vRestPos.x) < curveOpen + 0.016) {
              diffuseColor.rgb = mix(diffuseColor.rgb, uTrimColor, 0.9);
            }
          }
          // Bottom hem border
          if (vRestPos.y < uHemY + 0.015) {
            diffuseColor.rgb = mix(diffuseColor.rgb, uTrimColor, uHasGoldTrim > 0.5 ? 0.95 : 0.72);
          }
          // Sports jersey chest stripe & V-neck trim
          if (uHasStripe > 0.5) {
            if (vRestPos.y > 0.235 && vRestPos.y < 0.268 && vRestPos.z > 0.0) {
              diffuseColor.rgb = uTrimColor;
            }
            if (vRestPos.y > 0.268 && vRestPos.y < 0.280 && vRestPos.z > 0.0) {
              diffuseColor.rgb = uAccentColor;
            }
          }
          // Ninja gi red obi belt
          if (uHasBelt > 0.5) {
            if (vRestPos.y > 0.178 && vRestPos.y < 0.214) {
              diffuseColor.rgb = uAccentColor;
            } else if (vRestPos.y >= 0.214 && vRestPos.y < 0.224) {
              diffuseColor.rgb = uTrimColor;
            }
          }
          // Tet Ao Dai golden chest medallion & side trim
          if (uHasGoldTrim > 0.5 && vRestPos.z > 0.08) {
            float d = length(vec2(vRestPos.x, vRestPos.y - 0.245));
            if (d < 0.024 && d > 0.010) {
              diffuseColor.rgb = uAccentColor;
            }
          }
        }`
      );
  };

  mat.customProgramCacheKey = () => `tailored-body-${style.baseColor}-${isSleeve ? 's' : 'b'}`;
  return mat;
}

export interface TailoredBodyBuildResult {
  root: Object3D;
  meshes: SkinnedMesh[];
  dispose: () => void;
}

/**
 * Builds a smooth, zero-pixelation, exact-skeleton-bound 3D garment directly from Fox's
 * own smooth FOX_Body_1 (and FOX_Arm_L_1 / FOX_Arm_R_1) meshes without altering any GLB file.
 */
export function buildTailoredBodyShell(
  id: TailoredBodyId,
  objs: Record<string, Object3D>
): TailoredBodyBuildResult | null {
  const bodySrc = objs.FOX_Body_1 as SkinnedMesh | undefined;
  if (!bodySrc?.isSkinnedMesh) return null;

  const style = GARMENT_STYLES[id];
  const root = new Object3D();
  root.name = `COSMETIC_BODY_TAILORED_${id}`;

  const meshes: SkinnedMesh[] = [];
  const geometries: BufferGeometry[] = [];
  const materials: MeshStandardMaterial[] = [];

  // 1. Complete torso shell cloned from both FOX_Body_1 (fur) and FOX_Body_2 (belly primitive)
  // so closed-front garments (sports_jersey, ninja_gi, tet_ao_dai) cover the full torso seamlessly,
  // while open-front garments (simple_jacket) carve a crisp lapel opening revealing Fox's cream belly.
  const torsoMat = buildTailoredMaterial(style, false);
  materials.push(torsoMat);

  for (const bodyPartName of ['FOX_Body_1', 'FOX_Body_2'] as const) {
    const partSrc = objs[bodyPartName] as SkinnedMesh | undefined;
    if (!partSrc?.isSkinnedMesh) continue;
    const partGeo = buildInflatedShellGeometry(partSrc.geometry, 0.012);
    const partMesh = new SkinnedMesh(partGeo, torsoMat);
    partMesh.name = `TAILORED_${id}_${bodyPartName}`;
    partMesh.frustumCulled = false;
    partMesh.bind(partSrc.skeleton, partSrc.bindMatrix.clone());
    partMesh.userData.cosmetic = { id, slot: 'BODY' };
    root.add(partMesh);
    meshes.push(partMesh);
    geometries.push(partGeo);
  }

  // 2. Smooth sleeves cloned from FOX_Arm_L_1 & FOX_Arm_R_1 (when garment has sleeves)
  if (style.hasSleeves) {
    const sleeveMat = buildTailoredMaterial(style, true);
    materials.push(sleeveMat);

    for (const armName of ['FOX_Arm_L_1', 'FOX_Arm_R_1'] as const) {
      const armSrc = objs[armName] as SkinnedMesh | undefined;
      if (!armSrc?.isSkinnedMesh) continue;
      const sleeveGeo = buildInflatedShellGeometry(armSrc.geometry, 0.010);
      const sleeveMesh = new SkinnedMesh(sleeveGeo, sleeveMat);
      sleeveMesh.name = `TAILORED_${id}_${armName}`;
      sleeveMesh.frustumCulled = false;
      sleeveMesh.bind(armSrc.skeleton, armSrc.bindMatrix.clone());
      sleeveMesh.userData.cosmetic = { id, slot: 'BODY' };
      root.add(sleeveMesh);
      meshes.push(sleeveMesh);
      geometries.push(sleeveGeo);
    }
  }

  return {
    root,
    meshes,
    dispose: () => {
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
    }
  };
}
