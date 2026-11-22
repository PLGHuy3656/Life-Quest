# Gate H2 — cosmetic compatibility report (outfit library)

Every item of the six outfits was measured against all **50** approved clips:
- the 17 required clips at every 2nd frame;
- the 33 others at every 4th frame.

The method, metric, obstacles and thresholds are those of H1: `cosmetics_matrix_h1.py`, imported unchanged by
`cosmetics_matrix_h2.py`.

**Severity:** < 2 mm OK · 2–8 mm MINOR (`m`) · > 8 mm SEVERE (`S`).

**Cell markers.**
- `hid`: the HAND item is hidden by the H1 hand-busy rule in that clip. The measured value is shown in brackets.
- `t*`: the tail sweeps through the back zone. This is pre-existing in the approved model: the default backpack does it too (§3).

Data: `compatibility_matrix_h2.json`. H1 items are re-measured in the same run.

## 1. Outfits

| Outfit | Items | Worst value after rules | SEVERE after rules |
|---|---|---|---|
| Student | HEAD: student_cap, FACE: student_glasses, BODY: simple_jacket | 8.0 mm — simple_jacket × wave (FOX_Arm_L) | 0 |
| Sports | HEAD: sports_headband, BODY: sports_jersey, FEET: sports_sneakers | 6.1 mm — sports_sneakers × walk (FOX_Tail) | 0 |
| Explorer | HEAD: explorer_hat, BACK: explorer_backpack, HAND_RIGHT: explorer_magnifier | 5.3 mm — explorer_magnifier × alarm_success (FOX_Head) | 0 |
| Mage | HEAD: mage_hat, BACK: mage_capelet, HAND_RIGHT: mage_wand | 4.8 mm — mage_capelet × walk (FOX_Scarf_Flap) | 0 |
| Ninja | HEAD: ninja_headband, BODY: ninja_gi, BACK: ninja_scroll | 8.0 mm — ninja_gi × wave (FOX_Arm_L) | 0 |
| Tết | HEAD: tet_khan_dong, BODY: tet_ao_dai, HAND_RIGHT: tet_lixi | 8.0 mm — tet_ao_dai × wave (FOX_Arm_L) | 0 |

**SEVERE values left after the H1 rules, over the 6 outfits: 0.** The `t*` class is listed in §3.

## 2. Items

| Item | Slot | Outfit | OK | MINOR | SEVERE | hidden | t* | Worst after rules |
|---|---|---|---|---|---|---|---|---|
| student_cap (H1) | HEAD | Student | 50 | 0 | 0 | 0 | 0 | 0.0 mm  |
| student_glasses (H1) | FACE | Student | 50 | 0 | 0 | 0 | 0 | 0.0 mm  |
| simple_jacket (H1) | BODY | Student | 12 | 38 | 0 | 0 | 0 | 8.0 mm wave (FOX_Arm_L) |
| sports_headband (H1) | HEAD | Sports | 50 | 0 | 0 | 0 | 0 | 0.0 mm  |
| sports_jersey | BODY | Sports | 50 | 0 | 0 | 0 | 0 | 0.0 mm  |
| sports_sneakers | FEET | Sports | 49 | 1 | 0 | 0 | 0 | 6.1 mm walk (FOX_Tail) |
| explorer_hat | HEAD | Explorer | 50 | 0 | 0 | 0 | 0 | 0.0 mm  |
| explorer_backpack (H1) | BACK | Explorer | 0 | 0 | 0 | 0 | 50 | 0.0 mm  |
| explorer_magnifier (H1) | HAND_RIGHT | Explorer | 37 | 5 | 0 | 8 | 0 | 5.3 mm alarm_success (FOX_Head) |
| mage_hat | HEAD | Mage | 50 | 0 | 0 | 0 | 0 | 0.0 mm  |
| mage_capelet | BACK | Mage | 30 | 20 | 0 | 0 | 0 | 4.8 mm walk (FOX_Scarf_Flap) |
| mage_wand | HAND_RIGHT | Mage | 38 | 4 | 0 | 8 | 0 | 4.4 mm quest_complete (FOX_Scarf_Flap) |
| ninja_headband | HEAD | Ninja | 50 | 0 | 0 | 0 | 0 | 0.0 mm  |
| ninja_gi | BODY | Ninja | 12 | 38 | 0 | 0 | 0 | 8.0 mm wave (FOX_Arm_L) |
| ninja_scroll | BACK | Ninja | 29 | 0 | 0 | 0 | 21 | 0.3 mm group_victory (FOX_Tail) |
| tet_khan_dong | HEAD | Tết | 48 | 2 | 0 | 0 | 0 | 3.4 mm sleep_enter (FLOOR) |
| tet_ao_dai | BODY | Tết | 12 | 38 | 0 | 0 | 0 | 8.0 mm wave (FOX_Arm_L) |
| tet_lixi | HAND_RIGHT | Tết | 40 | 2 | 0 | 8 | 0 | 4.8 mm challenge_win (FOX_Scarf_Flap) |

## 3. Back zone vs tail (pre-existing)

| BACK item | max into the tail | clips ≤ approved default pack |
|---|---|---|
| explorer_backpack | 46.9 mm | 48 / 50 |
| ninja_scroll | 8.4 mm | 49 / 50 |
| mage_capelet | 0.0 mm | 50 / 50 |
| approved default backpack | 82.8 mm | — |

The capelet is skinned with the body weights, so it follows the back. The scroll and the packs are rigid on SPINE.
Fixing the tail arc would change approved animation; this was not done in H2.

## 4. Hand-busy rules (unchanged from H1)

- `HAND_RIGHT` hidden in: sleep_enter, sleep_loop, sleep_wake, sports_start, sports_complete, study_complete, wake_start, duo_celebrate_mirror.
- These clips were derived in H1 from the magnifier. The wand and the lì xì were measured again here.
- Any SEVERE value they have outside these clips is listed in §1.

## 5. Cross-slot combinations and layering

- **Within an outfit:** every outfit uses different slots, and no two of its items share space.
  - BODY garments: 5 mm offset + 3 mm thickness.
  - The capelet sits at 12 mm, so it layers over any BODY item (runtime layering test).
  - Head items stay in front of or between the ears.
- **The scarf:** no outfit uses the NECK slot, so the red scarf stays in every outfit. All garments are V-necked under the scarf flap.
- **Straps:** the scroll re-uses the default strap path. The garments' strap cut-outs follow that path, so they fit both the scroll and the backpack.
- **Rules:** no cross-slot `excludes` rule was needed. Same-slot items replace each other (contract rule 1).

## 6. Required clips (max depth, mm)

| Clip | sports_jersey | sports_sneakers | explorer_hat | mage_hat | mage_capelet | mage_wand | ninja_headband | ninja_gi | ninja_scroll | tet_khan_dong | tet_ao_dai | tet_lixi |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| idle | 0.0 | 0.0 | 0.0 | 0.0 | 2.8 m | 0.0 | 0.0 | 0.5 | 0.0 | 0.0 | 0.0 | 0.0 |
| walk | 0.0 | 6.1 m | 0.0 | 0.0 | 4.8 m | 0.0 | 0.0 | 0.5 | 0.0 | 0.0 | 0.1 | 0.0 |
| run | 0.0 | 0.8 | 0.0 | 0.0 | 4.1 m | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 0.6 | 0.0 |
| head_pet | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 0.5 | 3 t* | 0.0 | 0.0 | 0.0 |
| tail_touch | 0.0 | 0.0 | 0.0 | 0.0 | 3.6 m | 0.0 | 0.0 | 0.6 | 7 t* | 0.0 | 0.6 | 0.0 |
| quest_complete | 0.0 | 0.0 | 0.0 | 0.0 | 3.8 m | 4.4 m | 0.0 | 8.0 m | 5 t* | 0.0 | 7.9 m | 0.0 |
| level_up | 0.0 | 0.0 | 0.0 | 0.0 | 3.7 m | 0.0 | 0.0 | 8.0 m | 7 t* | 0.0 | 8.0 m | 0.0 |
| streak_active | 0.0 | 0.0 | 0.0 | 0.0 | 3.4 m | 0.0 | 0.0 | 5.1 m | 0.0 | 0.0 | 5.1 m | 0.0 |
| streak_lost | 0.0 | 0.0 | 0.0 | 0.0 | 3.5 m | 0.0 | 0.0 | 6.9 m | 2 t* | 0.0 | 6.9 m | 0.0 |
| study_focus | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 6.6 m | 0.0 | 0.0 | 6.6 m | 0.0 |
| sports_active | 0.0 | 0.0 | 0.0 | 0.0 | 3.4 m | 0.0 | 0.0 | 1.0 | 0.0 | 0.0 | 1.0 | 0.0 |
| sleep_enter | 0.0 | 1.9 | 0.0 | 0.0 | 1.0 | (10) hid | 0.0 | 8.0 m | 6 t* | 3.4 m | 8.0 m | (10) hid |
| sleep_loop | 0.0 | 0.0 | 0.0 | 0.0 | 1.4 | (0) hid | 0.0 | 0.6 | 7 t* | 0.3 | 0.6 | (0) hid |
| sleep_wake | 0.0 | 1.9 | 0.0 | 0.0 | 3.5 m | (0) hid | 0.0 | 7.1 m | 5 t* | 1.9 | 7.1 m | (0) hid |
| challenge_win | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.5 | 0.0 | 8.0 m | 8 t* | 0.0 | 8.0 m | 4.8 m |
| duo_celebrate | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 8.0 m | 3 t* | 0.0 | 8.0 m | 0.0 |
| duo_celebrate_mirror | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | (0) hid | 0.0 | 8.0 m | 0.0 | 0.0 | 8.0 m | (0) hid |

## 7. Further approved clips

| Clip | sports_jersey | sports_sneakers | explorer_hat | mage_hat | mage_capelet | mage_wand | ninja_headband | ninja_gi | ninja_scroll | tet_khan_dong | tet_ao_dai | tet_lixi |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| happy | 0.0 | 0.0 | 0.0 | 0.0 | 3.8 m | 0.0 | 0.0 | 0.8 | 6 t* | 0.0 | 0.8 | 0.0 |
| wave | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 8.0 m | 0.0 | 0.0 | 8.0 m | 0.0 |
| achievement_unlock | 0.0 | 0.0 | 0.0 | 0.0 | 3.8 m | 0.0 | 0.0 | 4.0 m | 5 t* | 0.0 | 4.0 m | 0.0 |
| quest_failed | 0.0 | 0.0 | 0.0 | 0.0 | 3.4 m | 0.0 | 0.0 | 1.4 | 0.0 | 0.0 | 1.4 | 0.0 |
| quest_start | 0.0 | 0.0 | 0.0 | 0.0 | 2.2 m | 0.0 | 0.0 | 8.0 m | 2 t* | 0.0 | 8.0 m | 0.0 |
| receive_xp | 0.0 | 0.0 | 0.0 | 0.0 | 2.4 m | 0.0 | 0.0 | 1.7 | 3 t* | 0.0 | 1.7 | 0.0 |
| streak_cheer | 0.0 | 0.0 | 0.0 | 0.0 | 3.8 m | 2.9 m | 0.0 | 7.9 m | 3 t* | 0.0 | 7.9 m | 0.1 |
| alarm_ring | 0.0 | 0.0 | 0.0 | 0.0 | 3.4 m | 0.0 | 0.0 | 3.5 m | 0.0 | 0.0 | 3.5 m | 0.0 |
| alarm_success | 0.0 | 0.0 | 0.0 | 0.0 | 3.3 m | 3.4 m | 0.0 | 8.0 m | 8 t* | 0.0 | 8.0 m | 3.1 m |
| cooldown_complete | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 7.0 m | 6 t* | 0.0 | 7.0 m | 0.0 |
| cooldown_wait | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 0.8 | 0.0 | 0.0 | 0.8 | 0.0 |
| cooldown_wait_impatient | 0.0 | 0.7 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 5.2 m | 0.0 | 0.0 | 5.2 m | 0.0 |
| sports_complete | 0.0 | 0.0 | 0.0 | 0.0 | 3.3 m | (0) hid | 0.0 | 7.7 m | 5 t* | 0.0 | 7.7 m | (0) hid |
| sports_start | 0.0 | 0.0 | 0.0 | 0.0 | 3.0 m | (14) hid | 0.0 | 8.0 m | 0.0 | 0.0 | 8.0 m | (14) hid |
| study_complete | 0.0 | 0.8 | 0.0 | 0.0 | 0.6 | (17) hid | 0.0 | 8.0 m | 6 t* | 0.0 | 8.0 m | (22) hid |
| study_start | 0.0 | 0.8 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 3.1 m | 0.0 | 0.0 | 3.1 m | 0.0 |
| wake_late | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 7.8 m | 0.0 | 0.0 | 7.8 m | 0.0 |
| wake_start | 0.0 | 0.5 | 0.0 | 0.0 | 1.0 | (14) hid | 0.0 | 8.0 m | 7 t* | 3.1 m | 8.0 m | (16) hid |
| challenge_accept | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 2.0 m | 0.0 | 0.0 | 2.0 m | 0.0 |
| challenge_draw | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 3.7 m | 0.0 | 0.0 | 3.7 m | 0.0 |
| challenge_invite | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 7.1 m | 0.0 | 0.0 | 7.1 m | 0.0 |
| challenge_lose | 0.0 | 0.2 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 2.5 m | 0.0 | 0.0 | 2.5 m | 0.0 |
| challenge_start | 0.0 | 0.2 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 1.4 | 0.0 | 0.0 | 1.4 | 0.0 |
| friend_greet | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 8.0 m | 0.0 | 0.0 | 8.0 m | 0.0 |
| friend_miss_you | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 4.2 m | 0.0 | 8.0 m | 0.0 | 0.0 | 8.0 m | 0.0 |
| friend_support | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 5.6 m | 0.0 | 0.0 | 5.6 m | 0.0 |
| group_streak_active | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 7.9 m | 7 t* | 0.0 | 7.9 m | 0.0 |
| group_streak_lost | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 6.0 m | 0.0 | 0.0 | 6.0 m | 0.0 |
| group_victory | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 8.0 m | 0.3 | 0.0 | 8.0 m | 0.4 |
| photo_reaction | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 7.7 m | 0.0 | 0.0 | 7.7 m | 0.0 |
| receive_comment | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 7.1 m | 0.0 | 0.0 | 7.1 m | 0.0 |
| receive_like | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 7.9 m | 0.0 | 0.0 | 7.9 m | 0.0 |
| team_encourage | 0.0 | 0.0 | 0.0 | 0.0 | 0.6 | 0.0 | 0.0 | 6.1 m | 0.0 | 0.0 | 6.1 m | 0.0 |
