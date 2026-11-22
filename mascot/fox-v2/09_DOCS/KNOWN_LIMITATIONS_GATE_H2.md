# Gate H2 — known limitations

All H1 limitations still apply (`KNOWN_LIMITATIONS_GATE_H1.md`). These are the additions and changes in H2.

1. **The back zone and the tail (pre-existing).**
   - The approved tail sweeps through the space behind the back.
   - Measured maximum depth into the tail, over the 50 clips:
     - ninja scroll: 8.4 mm in one clip, at or below the approved default pack in 49 of 50 clips;
     - mage capelet: 0 mm, because it is skinned to the back;
     - explorer backpack (H1): 46.9 mm;
     - approved default pack: 82.8 mm.
   - A real fix needs a change to the tail animation arc, which is approved animation.
2. **Garment sleeves at the armpit (MINOR, at the 8 mm threshold).** The gi and the áo dài reach 8.0 mm when an arm is
   raised high, the same as the H1 jacket. The áo dài sleeves were shortened to the gi's length after measuring
   (0.095 → 0.075 m).
3. **Held items are hidden in paw-contact clips.** The wand and the lì xì follow the H1 hand-busy rules. The wand was
   shortened to the magnifier's length, because a 15 cm wand reached the head in `alarm_success` and `challenge_start`.
4. **The mage hat is deliberately low.**
   - A tall cone (0.35 m) left the harness frame at Lv30 even in idle.
   - The final hat has a pointed, floppy tip folded back. It rises 7 cm above the crown and stays below the ear tips.
   - A taller hat needs app framing that allows for it. That is a frontend decision.
5. **The harness camera crops the approved Fox at the Lv30 jump apex.** The fixed 3/4 camera of `#/h1` cuts off the
   Fox's own ears in `level_up` (−58 px) and `challenge_win` (−83 px) at Lv30. The H2 framing check therefore compares
   items with the Fox in the same clip. The H1 check measured only items: the H1 items stay below the ears, so they were
   not affected.
6. **Outfits are technical-quality assets.**
   - Materials are PBR colours without textures.
   - The patterns are geometry or material bands, not textures: the jersey stripe, the gi lapel, the áo dài blossoms,
     the khăn đóng folds.
   - Garments are offset copies of the Fox cage. They have no cloth simulation and no secondary motion: the ninja knot
     tails and the capelet are not simulated.
   - Garment openings and hems follow the low-poly cage faces, so the edges look stepped in the runtime (jacket,
     jersey, gi, áo dài). Production garments would need clean edge loops.
7. **Student reuses the three H1 items as they are.** It has no item of its own in H2.
8. **No GPU tests, and no native Windows or macOS.** The same as H1 and the portability report.
9. **The preview videos are labelled "H1 · outfit …".** The H1 capture script is reused unchanged, so its fixed
   overlay text says H1. Only the file names say H2.
