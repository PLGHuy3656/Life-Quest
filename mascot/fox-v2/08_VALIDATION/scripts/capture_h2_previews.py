"""Gate H2 — outfit preview videos from the three.js runtime (capture_h1_previews.py, imported unchanged; only the plan,
the URL and the output folder differ). Serve companion_sandbox_h2/dist on 127.0.0.1:4250, then:
    python 08_VALIDATION/scripts/capture_h2_previews.py
Writes 08_VALIDATION/runtime_h2/previews/h1_outfit_<name>.mp4 (+ strip PNG): each outfit through 7 key clips, 3/4 + front,
3.5 s per clip (software rendering is slow; frames are exact, timing is not real time).
"""
import asyncio, os, sys
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
os.environ.setdefault('FOX_H1_MAX_S', '3.5')
import capture_h1_previews as P  # noqa: E402

KEY = ['idle', 'walk', 'run', 'level_up', 'study_focus', 'challenge_win', 'sleep_enter']
P.PLAN = [(o, KEY, ['34', 'front']) for o in ('outfit_student', 'outfit_sports', 'outfit_explorer', 'outfit_mage', 'outfit_ninja', 'outfit_tet')]
only = [p for p in os.environ.get('FOX_H2_OUTFITS', '').split(',') if p]
P.PLAN = [p for p in P.PLAN if not only or p[0] in only]
P.OUT = os.path.join(P.ROOT, '08_VALIDATION', 'runtime_h2', 'previews')
P.URL = os.environ.get('FOX_SANDBOX_URL', 'http://127.0.0.1:4250/index.html') + '?capture=1&seed=7#/h1'
asyncio.run(P.main())
