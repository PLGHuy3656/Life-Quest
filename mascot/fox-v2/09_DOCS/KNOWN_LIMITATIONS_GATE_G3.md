# Gate G3 — known limitations

Scope: 17 challenge / duo-group / private-social clips (plus the mirrored duo variant), their props and VFX, the typed
event registry and the multi-mascot choreography layer. The rig, proportions, skeleton names and morph contract are unchanged.
Measured values are in `08_VALIDATION/deformation_report_g3.md` and `gate_g3_runtime_report.md`.

1. **The duo high-five is made in the air (forced by the proportions).**
   - The paw reaches ~0.30 m from the fox's vertical axis; the head is ~0.34 m wide (measured on the runtime cage).
   - So two upright foxes cannot touch paws without their heads intersecting.
   - What the clip does instead:
     - both foxes hop 0.12 m toward each other and arc 12° outward;
     - their paws meet at the apex (f36), with the heads ≥ 98 mm apart (Lv20 + Lv20);
     - they rebound to their start spots before landing.
   - Consequences:
     - the two foxes start ~0.78 m apart (at level scale 1);
     - "solo" playback shows an air high-five to the side.
   - A grounded, side-by-side high-five would need longer arms: a proportion change, which is out of scope.
2. **Different levels are absorbed by the jump.**
   - Lv1 + Lv30 differ by 0.11 m in paw height at the contact.
   - While both foxes are airborne, FoxDuoCoordinator raises the smaller fox's jump (+70 % of the gap) and lowers the larger
     one's (−30 %). This is a smooth bump that is zero at take-off and landing, so the feet never move on the floor.
   - Measured: contact paw-tip distance 23 mm, vertical 0 mm.
   - The shoulder correction (≤ 14°) is left for residuals; it applied 0.1° here.
   - The smaller fox visibly jumps higher. That is intended, but it needs visual approval.
3. **Only one duo pairing direction per clip.**
   - `duo_celebrate` expects the partner on the fox's left; `duo_celebrate_mirror` expects it on the right.
   - Facing pairs, or more than two foxes in a chain, are not supported by these clips.
4. **Multi-fox group mode is frame-locked, not varied.**
   - All foxes dance the same clip on the same frame (the measured clip-time difference is 0).
   - Per-fox offsets or variations would need extra clips.
   - In multi mode the per-fox team markers are suppressed, and one shared aura and burst is drawn instead.
5. **Render counts were measured in a software renderer (SwiftShader).**
   - Draw calls, geometries, textures and JS heap are counted. No FPS or GPU memory figure is claimed.
   - Every Fox instance adds its own skinned draw calls (~74 k triangles each, no geometry copy).
6. **The runtime contract is unchanged but extended.**
   - `CHALLENGE_WON` / `CHALLENGE_LOST` changed from the Gate F fallback reactions to native clips.
   - Their old reactions are kept as `fallbackSteps`, used automatically when the G3 module is missing.
7. **Intentional behaviour of `GROUP_STREAK_ACTIVE`.**
   - It turns the solo streak on when needed: a group streak needs the single flame.
   - `setStreak({ active: false })` also ends the group link.
8. **Reduced motion.**
   - These clips are replaced by documented face reactions: `challenge_start`, `challenge_win`, `duo_celebrate*`,
     `group_victory`, `group_streak_active`.
   - The state changes (group streak link, group data) are still applied.
   - Gentle social clips keep playing; their props fade in instead of popping.
9. **No user content in 3D.**
   - The photo frame is blank by default. `PhotoFrameProp.setPicture()` exists for an application texture, but no real image
     was tested.
   - Chat bubbles never show text.
   - Team markers are colours and counts only.
10. **The countdown is display only.**
    - `challenge_start` plays three pulses at fixed clip beats (f20 / f32 / f44).
    - The application supplies the values (`setChallengeCountdown`). It must not use the clip as a timer.
11. **Visual approval is pending.**
    - Every automated check passes: RAW deformation 18/18 with no hidden-edge exception, browser 34/34, and the regressions.
    - This does not approve the artistic quality.
    - Points to judge in the videos:
      - how readable the mid-air high-five is;
      - acting strength at small sizes;
      - whether the effects are too strong or too weak.
