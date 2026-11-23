# Gate I — Known Limitations (Production Finalization)

All pre-existing H1 / H2 limitations (`KNOWN_LIMITATIONS_GATE_H2.md`) continue to apply unchanged. Gate I adds the following documented items:

1. **`f_fallback` isolated regression timing exception (34/35 PASS, threshold unchanged):**
   - Check: `Pointer leaves → gentle return to neutral (look offset ≈ 0)` (`abs(lookYaw) < 2.5`).
   - Isolated rerun result: `lookYaw = +4.74°` (after turning to `-37.0°`; prior runs `+3.69°`, `+5.32°`).
   - Verified root cause: `FoxLookAtController.ts` (`SHA-256: DA2E449A…F020CD7E`) and `FoxInteractionManager.ts` (`SHA-256: 0043773D…317D618`) are byte-identical to Gate H2. While `pointerInside === false`, `dYaw` tracks the 6 s `idle` loop's animated head yaw `cy[0]` via a critically damped spring (`ω = 2.6`). Because `browser_companion_test_f.py` runs real-time `wait_for_timeout` calls on SwiftShader before stepping, `?modules=0` shifts the widget's phase in the 6 s `idle` cycle so sampling lands near a head-sway zero-crossing. The same look-at code passes **35/35** in `f_g1` (`lookYaw = +1.07°`).
   - Assertion threshold was intentionally left unmodified.
2. **Software rendering only (SwiftShader in Docker Linux):**
   - All Gate I browser tests, regressions, and preview renders ran in headless Chromium with SwiftShader CPU rendering inside Docker (`python:3.13-slim-bookworm`, `bpy==5.3.0`). No real-GPU FPS or native Windows/macOS browser benchmarks are claimed.
3. **glTF non-shear leaf-bone limit (pre-existing format limit):**
   - Gate I max bone deviation vs Blender is **4.760 mm** (`task_notebook_open` f27 `EAR_L_02`), well within the approved 6.0 mm tolerance (G2.1: 5.20 mm, G3: 4.99 mm, E2 `tail_touch`: 8.69 mm).
4. **Application-owned voice & persistence boundaries (by design):**
   - The mascot SDK does not implement speech recognition (ASR), microphone permission checks/requests, or task database persistence. `task_notebook_confirm` is strictly triggered by the host application dispatching `TASK_CREATED`.
5. **Pre-existing back-zone tail sweep & technical-quality cosmetics (unchanged from H1/H2):**
   - The approved tail animation sweeps through the back/backpack zone (default backpack included).
   - Cosmetics remain PBR node-colour technical-quality assets without cloth simulation.
