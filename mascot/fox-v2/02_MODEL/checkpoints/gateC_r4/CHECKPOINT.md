# Checkpoint gateC_r4 — Gate C correction r4, final shape polish (2026-11-16)

Frozen copy of the **current working model** delivered for Gate C review
round 4 (status: awaiting visual approval). Most recent verified rollback
point. `gateC_r1`–`gateC_r3` are kept until final approval (user instruction).

Do not edit. Restore by copying `modules/*.blend` and `fox_master.blend` back
into `02_MODEL/`, or rebuild with `scripts/` + `data/`.

| Item | SHA-256 (first 16) |
|---|---|
| fox_master.blend | 16ce1a046eb3842b |
| modules/head.blend | cffc9a939b441c2d |
| modules/face.blend | 0b6f6e5af7c3db08 |
| modules/ears.blend | 644973ed5f6bd6bc |
| modules/body.blend | 8ffd115fe80851c5 |
| modules/arms_legs.blend | 069be68b9c38d27a |
| modules/tail.blend | a55e5058ca44eb22 |
| modules/scarf.blend | 41d3e5e05b47b9f0 |
| modules/backpack.blend | abc31c516c0022f0 |

Verified byte-identical to `02_MODEL/` on creation (`cmp`). Validation of this
state: 35/35 checks passed (`data/validation_results.json`).
Change log: `GATE_C_R4_CHANGES.md` (copy included).
