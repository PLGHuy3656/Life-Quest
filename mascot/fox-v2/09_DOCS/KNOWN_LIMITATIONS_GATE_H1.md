# Gate H1 — known limitations

1. **The tail passes through the backpack zone (pre-existing).**
   - The approved tail animation sweeps through the space behind the back. The approved default backpack enters the tail
     too (up to 82.8 mm by the same metric).
   - The explorer backpack keeps the default pack's footprint and is at or below the default in 48 of 50 clips. It is
     still above the 8 mm SEVERE threshold in every clip.
   - Fixing this needs a change to approved animation (tail arc) or a tail-aware pack shape. Neither is done in H1.
   - Details: `08_VALIDATION/cosmetics_h1/compatibility_matrix_h1.md` §2.
2. **Jacket sleeves: up to 8.0 mm (MINOR, at the threshold).**
   - When an arm is raised high (wave, level_up, duo), the arm root passes through the inner side of the short sleeve near
     the armpit.
   - The jacket is an offset copy of the body cage with the body's own weights, a technical prototype. A production
     jacket would need sleeve-specific weights or corrective shapes.
3. **Held items are hidden in paw-contact clips.**
   - They are hidden in the sleep clips, sports_start / sports_complete, study_complete, wake_start, and on the duo
     contact paw.
   - They are also hidden while a temporary paw prop or the streak flame is held.
   - This is by design, but the item disappears and reappears instantly (no fade).
4. **No NECK, FEET or TAIL library items.**
   - NECK is validated with a test-only item (re-uses the headband GLB) to prove the scarf-replacement path.
   - FEET and TAIL use slot-test fixtures (sneakers, ribbon), which are not cosmetic library content.
5. **glTF and Blender differ for far points under squash.**
   - In `streak_lost` / `challenge_win`, points 6–15 cm from their joint deviate from Blender by up to 19.8 mm (cap
     crown) and 14.7 mm (magnifier).
   - The approved Fox head shows the same deviation: up to 18.3 mm in the same poses. glTF stores TRS per joint, and the
     shear of non-uniform squash is lost.
   - At runtime the items stay exactly attached (0.000 mm in their bone frame).
6. **The cap hides the hair tuft while it is worn.** The tuft is restored on unequip.
7. **Prototype shaders.**
   - Item materials are glTF PBR colours (no textures).
   - The glasses lenses are a transparent material and read slightly grey under the sandbox lights.
8. **No GPU performance numbers.** Only software rendering (SwiftShader) was available. Cost is reported as draw calls,
   triangles, geometries and textures.
9. **Cosmetics are not part of the interaction proxies.** Tapping a cap counts as a head tap through the existing head
   proxy, which is the intended behaviour; items add no hit areas.
