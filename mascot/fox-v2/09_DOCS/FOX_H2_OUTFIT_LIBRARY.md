# Fox V2 — Gate H2 outfit library (configuration and slot definitions)

H2 adds six themed outfits on top of the H1 cosmetic system. Nothing in H1 was changed:
- the H1 slots, binding, hide / conflict rules and hand-busy rules are unchanged (`FOX_H1_COSMETIC_CONTRACT.md`);
- the H1 item ids and presets are unchanged;
- the H1 test suite runs unchanged against the H2 build.

Contract version: `fox-v2/h1-cosmetics-1+h2-library-1`.

Source of truth:
- `07_WEB_PREVIEW/companion_sandbox_h2/src/mascot/cosmetics/cosmeticContract.ts`: `LIBRARY_ITEM_IDS`, the `outfit_*` entries
  of `OUTFIT_PRESETS`, and `OUTFIT_LIBRARY`;
- item build data: `05_COSMETICS/h2_outfits/cosmetic_catalog_h2.json`.

## Outfits

| Outfit (`setOutfit` id) | HEAD | FACE | BODY | BACK | HAND_RIGHT | FEET | Defaults kept |
|---|---|---|---|---|---|---|---|
| Student (`outfit_student`) | student cap (H1) | student glasses (H1) | simple jacket (H1) | — | — | — | scarf, backpack |
| Sports (`outfit_sports`) | sports headband (H1) | — | **sports jersey** | — | — | **sports sneakers** | scarf, backpack |
| Explorer (`outfit_explorer`) | **safari hat** | — | — | explorer backpack (H1) | explorer magnifier (H1) | — | scarf |
| Mage (`outfit_mage`) | **mage hat** | — | — | **mage capelet** | **star wand** | — | scarf |
| Ninja (`outfit_ninja`) | **ninja headband** | — | **ninja gi** | **ninja scroll** | — | — | scarf |
| Tết (`outfit_tet`) | **khăn đóng** | — | **áo dài top** | — | **lì xì envelope** | — | scarf, backpack |

**Bold** marks the 12 new H2 items. Student reuses the three H1 student items as they are. Explorer reuses the H1
backpack and magnifier.

**Identity rules, kept by every outfit:**
- No outfit uses `NECK`, so the Fox's own red scarf is always shown.
- Every garment is V-necked under the scarf flap.
- No item covers the eyes, muzzle or mouth, so the face expressions stay readable.
- The tail is never covered.
- Head items sit in front of or between the ears and reach no higher than the ears.

## Slot use of the new items

| Item id | Slot | Skin | Hides | Notes |
|---|---|---|---|---|
| `sports_jersey` | BODY | body weights (HIPS / SPINE / NECK) | — | sleeveless, blue with white side panels and hem, gold chest stripe |
| `sports_sneakers` | FEET | leg weights (FOOT_L / FOOT_R) | — | soles never below the floor |
| `explorer_hat` | HEAD | rigid, HEAD (socket ATT_HAT) | `FOX_Tuft` | domed khaki crown, green band, side brim, compass badge |
| `mage_hat` | HEAD | rigid, HEAD (ATT_HAT) | `FOX_Tuft` | pointed cone between the ears with a floppy tip folded back (kept low so it stays in frame at Lv30 jumps), gold band, stars |
| `mage_capelet` | BACK | body weights, 12 mm off the body | default backpack | shoulder capelet with gold hem and star clasp; layers over any BODY item |
| `mage_wand` | HAND_RIGHT | rigid, PAW_R (ATT_HAND_R) | — | magnifier-length wand with a glowing star |
| `ninja_headband` | HEAD | rigid, HEAD | — | navy band with a steel plate and knot tails |
| `ninja_gi` | BODY | body + arm weights | — | charcoal wrap top, short sleeves, lapel trim, orange obi belt |
| `ninja_scroll` | BACK | rigid, SPINE (ATT_BACKPACK) | default backpack | scroll on the back, carried on the default strap path (re-coloured) |
| `tet_khan_dong` | HEAD | rigid, HEAD (ATT_HAT) | `FOX_Tuft` | red crown + wrapped red / gold band (khăn đóng) |
| `tet_ao_dai` | BODY | body + arm weights | — | red áo dài top, gold hem / placket / cuffs, blossom dots on the back |
| `tet_lixi` | HAND_RIGHT | rigid, PAW_R | — | red envelope with a gold star |

## API

```ts
await fox.setOutfit('outfit_mage');           // one call per outfit; slots the outfit does not name go back to default
fox.getEquippedItems();                        // → [{ slot: 'HEAD', id: 'mage_hat', … }, { slot: 'NECK', id: 'default_scarf', default: true }, …]
OUTFIT_LIBRARY.outfit_mage                     // → { name: 'Mage', theme: 'magic', palette: [...], keepsDefault: ['scarf'] }
fox.equip('ninja_gi');                         // items can still be mixed freely, slot by slot
```

## Conflicts

These rules apply:
- **Same slot:** items in the same slot are exclusive (H1 rule 1). Switching outfits replaces every slot; the runtime
  test runs all 30 ordered outfit pairs.
- **BACK items:** they hide the default backpack (explorer backpack, capelet, scroll).
- **Hats:** the explorer hat, mage hat and khăn đóng hide the hair tuft, as the H1 student cap does.
- **Hand items:** wand and lì xì follow the H1 hand-busy rules (temporary paw props, paw-contact clips).

No cross-slot `excludes` rule was needed. The capelet layers over the four BODY items, and the BODY garments' strap
cut-outs fit both the backpack and the scroll straps. Measured clip compatibility:
`08_VALIDATION/cosmetics_h2/cosmetic_compatibility_report_h2.md`.
