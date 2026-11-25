import { Euler, MathUtils, Matrix4, Quaternion, Vector3 } from 'three';
import type { CosmeticItemId, CosmeticSlot } from './cosmeticContract';

/**
 * MASCOT-C01 + MASCOT-C02 — Non-destructive per-item & layer-aware runtime calibration
 * for Gate I Fox V2 cosmetics and default accessories (Scarf + Backpack/Straps).
 *
 * Conceptual physical layer order (pure geometry, zero renderOrder/depthTest hacks):
 *   1. Base Fox body (untouched)
 *   2. Torso clothing (BODY: simple_jacket, sports_jersey, ninja_gi, tet_ao_dai)
 *   3. Neck / Scarf (default FOX_Scarf_Roll / Flap / Emblem — dynamically lifted over BODY)
 *   4. Back / Straps (default FOX_Backpack + Strap_L/R, explorer_backpack, ninja_scroll, mage_capelet)
 *   5. Face (student_glasses)
 *   6. Headwear (HEAD hats & headbands)
 */
export type OutfitLayerIndex = 1 | 2 | 3 | 4 | 5 | 6;

export interface CosmeticCalibrationEntry {
  itemId: CosmeticItemId;
  slot: CosmeticSlot;
  layer: OutfitLayerIndex;
  anchorBone: string;
  /** Rest-pose pivot in Fox local space (meters, Three.js Y-up). */
  pivot: readonly [number, number, number];
  /** Fine positional offset in Fox rest-pose space (meters). */
  positionOffset: readonly [number, number, number];
  /** Fine Euler XYZ rotation offset (degrees) around pivot. */
  rotationOffsetDeg: readonly [number, number, number];
  /** Per-axis scale multiplier around pivot to clear Fox carrier mesh cleanly. */
  scaleMultiplier: readonly [number, number, number];
  /** Optional extra offset/scale applied when worn OVER an active BODY garment (Layer 4 over Layer 2). */
  overBodyDelta?: {
    positionOffset: readonly [number, number, number];
    scaleMultiplier: readonly [number, number, number];
  };
  animationNotes: string;
}

export interface DefaultAccessoryLayerConfig {
  /** Layer-3 calibration for built-in FOX_Scarf_* skinned meshes when a BODY garment or capelet is worn. */
  scarfOverBody: {
    pivot: readonly [number, number, number];
    positionOffset: readonly [number, number, number];
    rotationOffsetDeg: readonly [number, number, number];
    scaleMultiplier: readonly [number, number, number];
  };
  /** Layer-4 calibration for built-in rigid FOX_Backpack + independent Strap_L/R when a BODY garment is worn. */
  defaultBackpackOverBody: {
    packPositionDelta: readonly [number, number, number];
    packScaleMultiplier: readonly [number, number, number];
    strapLeftPositionDelta: readonly [number, number, number];
    strapLeftScaleMultiplier: readonly [number, number, number];
    strapRightPositionDelta: readonly [number, number, number];
    strapRightScaleMultiplier: readonly [number, number, number];
  };
}

export const DEFAULT_ACCESSORY_LAYERING: DefaultAccessoryLayerConfig = {
  scarfOverBody: {
    pivot: [0, 0.37, 0.02],
    positionOffset: [0, 0.010, 0.014],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.06, 1.03, 1.09]
  },
  defaultBackpackOverBody: {
    packPositionDelta: [0, 0.004, -0.012],
    packScaleMultiplier: [1.03, 1.02, 1.03],
    strapLeftPositionDelta: [0.007, 0.004, 0.012],
    strapLeftScaleMultiplier: [1.05, 1.02, 1.07],
    strapRightPositionDelta: [-0.007, 0.004, 0.012],
    strapRightScaleMultiplier: [1.05, 1.02, 1.07]
  }
};

export const COSMETIC_CALIBRATION: Partial<Record<CosmeticItemId, CosmeticCalibrationEntry>> = {
  // ── LAYER 6: HEAD ──
  student_cap: {
    itemId: 'student_cap',
    slot: 'HEAD',
    layer: 6,
    anchorBone: 'HEAD (ATT_HAT)',
    pivot: [0, 0.76, 0.14],
    positionOffset: [0, 0.008, 0.005],
    rotationOffsetDeg: [-1, 0, 0],
    scaleMultiplier: [1.03, 1.03, 1.03],
    animationNotes: 'Rigid on HEAD; sits snug on forehead without floating or sinking during idle/happy/walk nods.'
  },
  explorer_hat: {
    itemId: 'explorer_hat',
    slot: 'HEAD',
    layer: 6,
    anchorBone: 'HEAD (ATT_HAT)',
    pivot: [0, 0.75, 0.14],
    positionOffset: [0, 0.010, 0.005],
    rotationOffsetDeg: [-1, 0, 0],
    scaleMultiplier: [1.04, 1.04, 1.04],
    animationNotes: 'Rigid on HEAD; eliminates forehead star-badge sinking while remaining flush on crown.'
  },
  mage_hat: {
    itemId: 'mage_hat',
    slot: 'HEAD',
    layer: 6,
    anchorBone: 'HEAD (ATT_HAT)',
    pivot: [0, 0.78, 0.10],
    positionOffset: [0, 0.014, 0.004],
    rotationOffsetDeg: [-2, 0, 0],
    scaleMultiplier: [1.04, 1.04, 1.04],
    animationNotes: 'Rigid on HEAD; lifts gold rim cleanly above head crown while staying in Lv30 frame.'
  },
  tet_khan_dong: {
    itemId: 'tet_khan_dong',
    slot: 'HEAD',
    layer: 6,
    anchorBone: 'HEAD (ATT_HAT)',
    pivot: [0, 0.68, 0.0],
    positionOffset: [0, 0.014, 0.006],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.03, 1.04, 1.03],
    animationNotes: 'Rigid on HEAD; clears upper forehead and keeps wrapped band crisp around crown.'
  },
  sports_headband: {
    itemId: 'sports_headband',
    slot: 'HEAD',
    layer: 6,
    anchorBone: 'HEAD',
    pivot: [0, 0.62, 0.0],
    positionOffset: [0, 0.004, 0.004],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.02, 1.01, 1.02],
    animationNotes: 'Rigid on HEAD; subtle radial clearance prevents forehead Z-fighting during nods.'
  },
  ninja_headband: {
    itemId: 'ninja_headband',
    slot: 'HEAD',
    layer: 6,
    anchorBone: 'HEAD',
    pivot: [0, 0.62, 0.0],
    positionOffset: [0, 0.004, 0.004],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.02, 1.01, 1.02],
    animationNotes: 'Rigid on HEAD; preserves steel plate front clearance and rear knot tails.'
  },

  // ── LAYER 5: FACE ──
  student_glasses: {
    itemId: 'student_glasses',
    slot: 'FACE',
    layer: 5,
    anchorBone: 'HEAD (ATT_GLASSES)',
    pivot: [0, 0.61, 0.22],
    positionOffset: [0, 0.003, 0.007],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.02, 1.02, 1.02],
    animationNotes: 'Rigid on HEAD; clears eye/cheek morph targets during happy/excited expressions.'
  },

  // ── LAYER 2: BODY (Torso clothing — cleanly outside FOX_Body_1/2 & FOX_Arm_L/R) ──
  simple_jacket: {
    itemId: 'simple_jacket',
    slot: 'BODY',
    layer: 2,
    anchorBone: 'SPINE + ARM_L/R + HIPS',
    pivot: [0, 0.25, 0.0],
    positionOffset: [0, 0.005, 0.007],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.07, 1.04, 1.10],
    animationNotes: 'Layer 2 torso shell; clears arms & torso cleanly while leaving room for Layer 3 scarf and Layer 4 straps.'
  },
  sports_jersey: {
    itemId: 'sports_jersey',
    slot: 'BODY',
    layer: 2,
    anchorBone: 'SPINE + HIPS + NECK',
    pivot: [0, 0.25, 0.0],
    positionOffset: [0, 0.005, 0.007],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.06, 1.04, 1.10],
    animationNotes: 'Layer 2 sleeveless torso shell; lifts chest/side panels cleanly outside FOX_Body_1/2.'
  },
  ninja_gi: {
    itemId: 'ninja_gi',
    slot: 'BODY',
    layer: 2,
    anchorBone: 'SPINE + ARM_L/R + HIPS',
    pivot: [0, 0.25, 0.0],
    positionOffset: [0, 0.005, 0.007],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.07, 1.04, 1.10],
    animationNotes: 'Layer 2 torso/arm shell; eliminates orange shoulder/sleeve bleed-through during arm swing.'
  },
  tet_ao_dai: {
    itemId: 'tet_ao_dai',
    slot: 'BODY',
    layer: 2,
    anchorBone: 'SPINE + ARM_L/R + HIPS',
    pivot: [0, 0.25, 0.0],
    positionOffset: [0, 0.005, 0.007],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.07, 1.04, 1.10],
    animationNotes: 'Layer 2 3/4 sleeve garment; clears arms and torso cleanly during idle and celebration.'
  },

  // ── LAYER 4: BACK (Automatically adds overBodyDelta when worn over Layer 2 BODY clothing) ──
  explorer_backpack: {
    itemId: 'explorer_backpack',
    slot: 'BACK',
    layer: 4,
    anchorBone: 'SPINE (ATT_BACKPACK)',
    pivot: [0, 0.28, -0.06],
    positionOffset: [0, 0.005, -0.008],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.03, 1.02, 1.03],
    overBodyDelta: {
      positionOffset: [0, 0.004, -0.006],
      scaleMultiplier: [1.04, 1.02, 1.05]
    },
    animationNotes: 'Layer 4 backpack; expands cleanly over Layer 2 BODY garments so straps never cut into jacket.'
  },
  mage_capelet: {
    itemId: 'mage_capelet',
    slot: 'BACK',
    layer: 4,
    anchorBone: 'SPINE + NECK + HIPS',
    pivot: [0, 0.29, -0.02],
    positionOffset: [0, 0.008, -0.006],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.07, 1.04, 1.09],
    overBodyDelta: {
      positionOffset: [0, 0.004, -0.004],
      scaleMultiplier: [1.04, 1.02, 1.05]
    },
    animationNotes: 'Layer 4 capelet; drapes outside Layer 2 BODY items and sits beneath Layer 3 scarf.'
  },
  ninja_scroll: {
    itemId: 'ninja_scroll',
    slot: 'BACK',
    layer: 4,
    anchorBone: 'SPINE (ATT_BACKPACK)',
    pivot: [0, 0.29, -0.08],
    positionOffset: [0, 0.006, -0.010],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.03, 1.02, 1.03],
    overBodyDelta: {
      positionOffset: [0, 0.004, -0.006],
      scaleMultiplier: [1.04, 1.02, 1.05]
    },
    animationNotes: 'Layer 4 scroll + straps; clears ninja_gi and other BODY garments cleanly.'
  },

  // ── HAND_RIGHT ──
  explorer_magnifier: {
    itemId: 'explorer_magnifier',
    slot: 'HAND_RIGHT',
    layer: 4,
    anchorBone: 'PAW_R (ATT_HAND_R)',
    pivot: [-0.29, 0.21, 0.06],
    positionOffset: [-0.006, 0.004, 0.006],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.02, 1.02, 1.02],
    animationNotes: 'Rigid on PAW_R; auto-hidden during HAND_BUSY_CLIPS.'
  },
  mage_wand: {
    itemId: 'mage_wand',
    slot: 'HAND_RIGHT',
    layer: 4,
    anchorBone: 'PAW_R (ATT_HAND_R)',
    pivot: [-0.29, 0.20, 0.06],
    positionOffset: [-0.006, 0.004, 0.006],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.03, 1.03, 1.03],
    animationNotes: 'Rigid on PAW_R; star tip clears right paw and torso during idle/celebrate.'
  },
  tet_lixi: {
    itemId: 'tet_lixi',
    slot: 'HAND_RIGHT',
    layer: 4,
    anchorBone: 'PAW_R (ATT_HAND_R)',
    pivot: [-0.29, 0.21, 0.06],
    positionOffset: [-0.006, 0.004, 0.008],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.03, 1.03, 1.03],
    animationNotes: 'Rigid on PAW_R; clears paw mesh cleanly and hides during paw-contact clips.'
  },

  // ── FEET (Anchored strictly at Y=0 floor plane) ──
  sports_sneakers: {
    itemId: 'sports_sneakers',
    slot: 'FEET',
    layer: 2,
    anchorBone: 'FOOT_L + FOOT_R',
    pivot: [0, 0.0, 0.02],
    positionOffset: [0, 0.0, 0.002],
    rotationOffsetDeg: [0, 0, 0],
    scaleMultiplier: [1.03, 1.05, 1.03],
    animationNotes: 'Skinned on FOOT_L/R; pivot anchored at Y=0 keeps soles flush with floor while clearing toes.'
  }
};

export function composePivotTransform(
  pivot: readonly [number, number, number],
  offset: readonly [number, number, number],
  rotDeg: readonly [number, number, number],
  scale: readonly [number, number, number]
): Matrix4 {
  const [px, py, pz] = pivot;
  const [ox, oy, oz] = offset;
  const [rx, ry, rz] = rotDeg;
  const [sx, sy, sz] = scale;

  const toOrigin = new Matrix4().makeTranslation(-px, -py, -pz);
  const scaleRot = new Matrix4().compose(
    new Vector3(0, 0, 0),
    new Quaternion().setFromEuler(
      new Euler(MathUtils.degToRad(rx), MathUtils.degToRad(ry), MathUtils.degToRad(rz), 'XYZ')
    ),
    new Vector3(sx, sy, sz)
  );
  const backAndOffset = new Matrix4().makeTranslation(px + ox, py + oy, pz + oz);

  return backAndOffset.multiply(scaleRot).multiply(toOrigin);
}

export function buildCalibrationMatrix(
  entry: CosmeticCalibrationEntry,
  options: { hasBodyClothing?: boolean } = {}
): Matrix4 {
  const applyOverBody = Boolean(options.hasBodyClothing && entry.overBodyDelta);
  const ox = entry.positionOffset[0] + (applyOverBody ? entry.overBodyDelta!.positionOffset[0] : 0);
  const oy = entry.positionOffset[1] + (applyOverBody ? entry.overBodyDelta!.positionOffset[1] : 0);
  const oz = entry.positionOffset[2] + (applyOverBody ? entry.overBodyDelta!.positionOffset[2] : 0);
  const sx = entry.scaleMultiplier[0] * (applyOverBody ? entry.overBodyDelta!.scaleMultiplier[0] : 1);
  const sy = entry.scaleMultiplier[1] * (applyOverBody ? entry.overBodyDelta!.scaleMultiplier[1] : 1);
  const sz = entry.scaleMultiplier[2] * (applyOverBody ? entry.overBodyDelta!.scaleMultiplier[2] : 1);

  return composePivotTransform(entry.pivot, [ox, oy, oz], entry.rotationOffsetDeg, [sx, sy, sz]);
}

export function getCosmeticCalibration(itemId: string): CosmeticCalibrationEntry | undefined {
  return COSMETIC_CALIBRATION[itemId as CosmeticItemId];
}

export function getCosmeticCalibrationMatrix(
  itemId: string,
  options: { hasBodyClothing?: boolean } = {}
): Matrix4 | null {
  const entry = getCosmeticCalibration(itemId);
  return entry ? buildCalibrationMatrix(entry, options) : null;
}

export function getDefaultScarfOverBodyMatrix(): Matrix4 {
  const cfg = DEFAULT_ACCESSORY_LAYERING.scarfOverBody;
  return composePivotTransform(cfg.pivot, cfg.positionOffset, cfg.rotationOffsetDeg, cfg.scaleMultiplier);
}
