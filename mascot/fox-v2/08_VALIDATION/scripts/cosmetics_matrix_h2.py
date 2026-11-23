"""Gate H2 — cosmetic × animation compatibility matrix for the H1 + H2 items (same metric, thresholds, obstacles logic
and baselines as cosmetics_matrix_h1.py, which is imported unchanged; only the item set and the output path differ).

Usage: python 08_VALIDATION/scripts/cosmetics_matrix_h2.py   [FOX_H1_QUICK=1 → required clips only]
Writes 08_VALIDATION/cosmetics_h2/compatibility_matrix_h2.json
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cosmetics_matrix_h1 as M  # noqa: E402
import cosmetics_scene_h2 as CS2  # noqa: E402

O = M.OBSTACLES
M.OBSTACLES.update({
    'explorer_hat': O['student_cap'], 'mage_hat': O['student_cap'], 'tet_khan_dong': O['student_cap'],     # these hide the tuft
    'ninja_headband': O['sports_headband'],
    'sports_jersey': O['simple_jacket'], 'ninja_gi': O['simple_jacket'], 'tet_ao_dai': O['simple_jacket'],
    'mage_capelet': {**{k: v for k, v in O['simple_jacket'].items() if not k.startswith('FOX_Arm')}, 'FOX_Tail': None},
    'ninja_scroll': O['explorer_backpack'],
    'mage_wand': O['explorer_magnifier'], 'tet_lixi': O['explorer_magnifier'],
    'sports_sneakers': O['slot_test_sneakers'],
})
M.INHERITED['ninja_scroll'] = ['FOX_Backpack_Strap_L', 'FOX_Backpack_Strap_R']
M.CS = CS2
M.OUT = os.path.join(M.ROOT, '08_VALIDATION', 'cosmetics_h2')

if __name__ == '__main__':
    M.run()
    quick = os.environ.get('FOX_H1_QUICK') == '1'
    src = os.path.join(M.OUT, 'compatibility_matrix_h1' + ('_quick' if quick else '') + '.json')
    os.replace(src, src.replace('matrix_h1', 'matrix_h2'))
    print('renamed →', src.replace('matrix_h1', 'matrix_h2'))
