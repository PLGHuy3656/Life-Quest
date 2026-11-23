"""Gate I — cosmetic × animation compatibility matrix for all H1 + H2 outfit items across the 8 Gate I voice clips.

Usage: python 08_VALIDATION/scripts/cosmetics_matrix_i.py
Writes 08_VALIDATION/runtime_i/compatibility_matrix_i.json
"""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import cosmetics_matrix_h1 as M  # noqa: E402
import cosmetics_scene_h2 as CS2  # noqa: E402

O = M.OBSTACLES
M.OBSTACLES.update({
    'explorer_hat': O['student_cap'],
    'mage_hat': O['student_cap'],
    'tet_khan_dong': O['student_cap'],
    'ninja_headband': O['sports_headband'],
    'sports_jersey': O['simple_jacket'],
    'ninja_gi': O['simple_jacket'],
    'tet_ao_dai': O['simple_jacket'],
    'mage_capelet': {**{k: v for k, v in O['simple_jacket'].items() if not k.startswith('FOX_Arm')}, 'FOX_Tail': None},
    'ninja_scroll': O['explorer_backpack'],
    'mage_wand': O['explorer_magnifier'],
    'tet_lixi': O['explorer_magnifier'],
    'sports_sneakers': O['slot_test_sneakers'],
})
M.INHERITED['ninja_scroll'] = ['FOX_Backpack_Strap_L', 'FOX_Backpack_Strap_R']
M.CS = CS2
M.OUT = os.path.join(M.ROOT, '08_VALIDATION', 'runtime_i')
M.BLENDS = {
    'i': os.path.join(M.ROOT, '04_ANIMATIONS', 'i_voice_assistant', 'fox_anim_i.blend'),
}
M.REQUIRED = {
    'i': [
        'voice_listen_start',
        'voice_listening_loop',
        'voice_processing',
        'task_suggestion',
        'task_notebook_open',
        'task_notebook_write',
        'task_notebook_confirm',
        'voice_retry',
    ],
}
M.EXTRA = {'i': []}

if __name__ == '__main__':
    os.makedirs(M.OUT, exist_ok=True)
    M.run()
    src = os.path.join(M.OUT, 'compatibility_matrix_h1.json')
    dst = os.path.join(M.OUT, 'compatibility_matrix_i.json')
    os.replace(src, dst)
    print('saved ->', dst)
