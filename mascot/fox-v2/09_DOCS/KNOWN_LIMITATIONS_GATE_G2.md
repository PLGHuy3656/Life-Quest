# Known limitations — Gate G2 (daily life)

1. **Leg / body stretch in seated and lying poses exceeds the approved E2/G1/G1.1 envelope** (FOX_Leg p99 ≈ 2.0–2.4 vs 0.77).
   The approved clips never sat or lay down; the rig has no knee or hip-socket deformer, so rotating a leg ~85° forward
   stretches the thigh ring buried in the torso. No detachment is measured and the renders show no visible tear, but it
   needs visual approval (see `08_VALIDATION/deformation_report_g2.md`). A real fix is a rig change (Gate-level decision).
2. **Feet slide during sit-down / stand-up transitions** (study_start/complete, sleep_enter, sleep_wake, wake_start; up to
   ≈ 16 mm/frame) and briefly in the jog → stop blend of sports_complete (max 4.6 mm, p95 0). Without knees / IK a
   planted-foot sit is not possible. Every standing clip and the jog loop measure 0.000 mm.
3. **Contact acting penetrates deeper than approved**: paws on the cheeks (wake_late), eye rubbing (wake_start,
   sleep_wake), overhead stretch (sports_start) — paw mesh up to ≈ 18–20 mm into the head (approved max 11 mm); scarf
   vertices into the head during head-down curls (up to 20 vs 13). sleep_wake: scarf vertices enter the body for a few
   frames while standing up. Listed per clip in the deformation report for review.
4. **Lying pose is a side pose seen from the front** (body rolled 70° about the forward axis, face to the viewer). A
   forward curl would turn the face away from the camera, so the "curl" is expressed by the tucked paws, tail along the
   floor and the pillow, not by a belly curl. The tail range (≤ 10° lift, ≤ ±20° sway) cannot wrap the tail around the body.
5. **Props sit at measured, fixed fx-root positions** (`PROP_LAYOUT`): they follow the level scale but not root motion
   from other clips. A full-body one-shot that plays over the seated study loop (e.g. QUEST_COMPLETED, priority ≥ 50)
   stands the fox up over a 0.2 s fade while the notebook stays on the lap until the study loop resumes.
6. **Leaving a state during its start clip** fades that clip out over 0.45 s instead of playing the complete clip
   (which starts from the loop pose) — a deliberate rule, not an animation.
7. **Alarm clock cost**: ≈ 19 extra draw calls (multi-part prop). Low-cost mode slows the ring arcs; merging the clock
   into one mesh is the first optimisation if a device needs it.
8. **No GPU measurement**: this environment renders with llvmpipe / SwiftShader (CPU). Draw calls, triangles and object
   counts are exact; frame rates must be measured on target devices. WebGPU was not used.
9. **Audio, notification permissions and alarm scheduling are not implemented** (application layer, by design). The
   runtime only emits `alarm-visual` / `state` / `cooldown` events.
10. **Earlier-gate suites on the G2 build** run with the G1.1 module set (`window.__foxModuleFilter`) so their clip-count
    expectations apply unchanged; the full module set is validated by `browser_g2_test.py`.
11. The E2 viewer regression routes `three@0.170.0` from the CDN to the sandbox's identical npm copy (the approved
    script's own `--three-dir` option) because this environment has no CDN access.
