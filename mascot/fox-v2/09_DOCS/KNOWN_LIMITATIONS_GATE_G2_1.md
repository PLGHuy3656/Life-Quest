# Gate G2.1 — known limitations

Scope: deformation correction and motion polish of the 15 G2 daily-life clips (+ `cooldown_wait_impatient`). Clip names,
event names, the runtime contract and the rig are unchanged. Measured values: `08_VALIDATION/deformation_report_g2_1.md`.

1. **RAW leg stretch still fails on 9 clips (seated, lying, jog).** The RAW rule is kept unchanged and reported.
   - The failing edges belong to the buried top ring of each leg (161 HIPS-weighted vertices inside the opaque torso).
   - Every visible leg edge stays at or below 0.57 (approved leg limit: 0.766).
   - Close-ups `closeup_sit_legs.png` and `closeup_lie_legs.png` show no gap, crease or exposed seam from any of the three angles.
   - Making RAW pass needs a rig or weight change. Options: (a) reweight the buried ring to a LEG/HIPS blend, which changes the
     approved G1.1 mesh weights; (b) add a KNEE bone. Neither was done, because the brief forbids silent rig changes and no
     visible defect justifies one. Both are listed for a decision in `root_cause_g2_1.md` §Rig.
2. **The VISIBLE stretch check is an added metric.** It is computed with the same scripts on the approved E2/G1/G1.1 clips
   (`runtime_g2_1/diag/`), and all other rules are identical to RAW. The justification is in the deformation report. It needs
   reviewer acceptance; it does not replace RAW.
3. **Resolver attenuation.** Some gestures are softened so the approved limits hold. The smallest factors per group:
   - arm_R 0.6 in wake_start (eye rub);
   - scarf 0.66 in wake_start;
   - arm_R 0.70 in cooldown_complete;
   - arm_R 0.71 in sports_complete (overhead stretch).

   No gesture keeps less than 60 %. Check these frames in the comparison videos for readability.
4. **wake_start: two frames exceed the resolver's internal margin.** These are f8 (ears 1.004 × margin) and f90 (arm_R 1.001 × margin).
   Both are inside the approved envelope, since the resolver margins are tighter than the approved maxima, and the clip passes RAW
   and VISIBLE for every non-leg metric.
5. **Foot contact.**
   - anim_check per-vertex slide is ≤ 0.041 mm/frame on standing frames (rule: 0.05).
   - The world-space sole trace (aggregate sole position) shows ≤ 0.22 mm/frame, down from about 16 mm/frame in G2. The residual
     comes from the heel roll moving the sole's contact centroid, not from the paw translating.
   - Airborne frames (the sports_complete landing hop) are excluded by design.
6. **Pose envelope.** head roll ±4.5°, head pitch −10/+9°, spine ±9–11° and arm swing ≤ 58° are soft-clipped (tanh above 70 % of
   the limit). Very large head tilts from G2 now read smaller.
7. **Performance.** All browser timings come from headless Chrome with a CPU rasteriser (llvmpipe / SwiftShader). No GPU claim is made.
8. **glTF fidelity.** The worst error is 5.2 mm (EAR_L_02, study_start f30) against a 6.0 mm tolerance; the approved E2 GLB is 3.78 mm.
   The difference is the usual linear-key ear-chain resampling.
