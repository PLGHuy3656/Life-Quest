import { Bone, BoxGeometry, MeshStandardMaterial, Skeleton, SkinnedMesh, Vector3 } from 'three'
import { describe, expect, it } from 'vitest'
import { COSMETIC_CATALOG, type CosmeticItemId } from './cosmeticContract'
import {
  COSMETIC_CALIBRATION,
  DEFAULT_ACCESSORY_LAYERING,
  buildCalibrationMatrix,
  getCosmeticCalibration,
  getCosmeticCalibrationMatrix,
  getDefaultScarfOverBodyMatrix
} from './cosmeticCalibration'
import { buildTailoredBodyShell, isTailoredBodyCosmetic } from './tailoredBodyShell'

describe('MASCOT-C01 / C02 Cosmetic Attachment & Layering Calibration', () => {
  it('provides valid, non-singular runtime calibration and layer order for all 18 non-fixture Gate I cosmetics', () => {
    const nonFixtureIds = Object.values(COSMETIC_CATALOG)
      .filter((item) => !item.fixture)
      .map((item) => item.id as CosmeticItemId)

    expect(nonFixtureIds).toHaveLength(18)

    for (const id of nonFixtureIds) {
      const entry = getCosmeticCalibration(id)
      expect(entry, `missing calibration for ${id}`).toBeDefined()
      expect(entry!.itemId).toBe(id)
      expect(entry!.slot).toBe(COSMETIC_CATALOG[id].slot)
      expect(entry!.layer).toBeGreaterThanOrEqual(2)
      expect(entry!.layer).toBeLessThanOrEqual(6)
      expect(entry!.scaleMultiplier.every((s) => Number.isFinite(s) && s >= 0.95 && s <= 1.15)).toBe(
        true
      )

      const mat = getCosmeticCalibrationMatrix(id)
      expect(mat).not.toBeNull()
      expect(mat!.determinant()).toBeGreaterThan(0.8)
    }
  })

  it('expands BACK items further when worn over BODY clothing (Layer 4 over Layer 2)', () => {
    for (const backId of ['explorer_backpack', 'mage_capelet', 'ninja_scroll'] as const) {
      const baseMat = getCosmeticCalibrationMatrix(backId, { hasBodyClothing: false })!
      const overBodyMat = getCosmeticCalibrationMatrix(backId, { hasBodyClothing: true })!
      expect(overBodyMat.determinant()).toBeGreaterThan(baseMat.determinant())
    }
  })

  it('elevates built-in FOX_Scarf_* (Layer 3) and independent FOX_Backpack straps (Layer 4) cleanly over BODY clothing', () => {
    const scarfMat = getDefaultScarfOverBodyMatrix()
    expect(scarfMat.determinant()).toBeGreaterThan(1.0)

    const collarPoint = new Vector3(0, 0.37, 0.16).applyMatrix4(scarfMat)
    expect(collarPoint.y).toBeGreaterThan(0.37)
    expect(collarPoint.z).toBeGreaterThan(0.16)

    const packCfg = DEFAULT_ACCESSORY_LAYERING.defaultBackpackOverBody
    expect(packCfg.strapLeftPositionDelta[0]).toBeGreaterThan(0)
    expect(packCfg.strapRightPositionDelta[0]).toBeLessThan(0)
    expect(packCfg.strapLeftPositionDelta[2]).toBeGreaterThan(0)
    expect(packCfg.packPositionDelta[2]).toBeLessThan(0)
  })

  it('keeps sports_sneakers anchored at Y=0 floor plane so soles never sink below ground', () => {
    const sneakers = COSMETIC_CATALOG.sports_sneakers
    expect(sneakers.slot).toBe('FEET')
    const entry = COSMETIC_CALIBRATION.sports_sneakers!
    expect(entry.pivot[1]).toBe(0)
    expect(entry.positionOffset[1]).toBe(0)

    const mat = buildCalibrationMatrix(entry)
    const floorPoint = new Vector3(0.09, 0, 0.02).applyMatrix4(mat)
    expect(floorPoint.y).toBeCloseTo(0, 5)
  })

  it('builds smooth tailored runtime BODY shells from FOX_Body_1/2 and FOX_Arm_L/R_1 for all 4 torso garments', () => {
    const bodyIds = ['simple_jacket', 'sports_jersey', 'ninja_gi', 'tet_ao_dai'] as const
    for (const id of bodyIds) {
      expect(isTailoredBodyCosmetic(id)).toBe(true)
    }
    expect(isTailoredBodyCosmetic('student_cap')).toBe(false)

    const makeMockCarrier = (name: string) => {
      const geo = new BoxGeometry(0.2, 0.2, 0.2)
      const mat = new MeshStandardMaterial()
      const mesh = new SkinnedMesh(geo, mat)
      mesh.name = name
      mesh.bind(new Skeleton([new Bone()]))
      return mesh
    }

    const objs = {
      FOX_Body_1: makeMockCarrier('FOX_Body_1'),
      FOX_Body_2: makeMockCarrier('FOX_Body_2'),
      FOX_Arm_L_1: makeMockCarrier('FOX_Arm_L_1'),
      FOX_Arm_R_1: makeMockCarrier('FOX_Arm_R_1')
    }

    const jacket = buildTailoredBodyShell('simple_jacket', objs)!
    expect(jacket).not.toBeNull()
    expect(jacket.meshes).toHaveLength(4) // Body_1 + Body_2 + Arm_L_1 + Arm_R_1
    expect(jacket.meshes[0].geometry.attributes.aRestPos).toBeDefined()
    jacket.dispose()

    const jersey = buildTailoredBodyShell('sports_jersey', objs)!
    expect(jersey).not.toBeNull()
    expect(jersey.meshes).toHaveLength(2) // Sleeveless: Body_1 + Body_2 only
    jersey.dispose()
  })
})
