"""Render the four orthographic turnaround views of fox_master.blend.

Usage (from LifeQuest_Fox_V2/):
    python 08_VALIDATION/scripts/render_turnaround.py [--samples 64] [--res 724] [--out DIR]

Camera framing is pixel-registered to the reference crops: ortho scale 1.128 m
over 724 px and frame centre at Z=0.48 m means the ground sits at y=670 px and
the 1.0 m-tall character spans 642 px, exactly like the reference turnaround.
"""
import argparse
import math
import os
import sys

import bpy
from mathutils import Vector

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
BG = (253, 246, 241)

# name: (azimuth in degrees around Z, measured from the -Y (front) axis towards -X)
VIEWS = {
    'front': 0.0,
    '34': 38.0,      # fox turned to viewer's right, showing its right side (matches reference 3/4)
    'side': 270.0,   # camera on +X: fox faces screen-left (matches reference side)
    'back': 180.0,
}


def look_at(obj, target):
    d = Vector(target) - obj.location
    obj.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def setup(scene, samples, res):
    scene.render.engine = 'CYCLES'
    scene.cycles.device = 'CPU'
    scene.cycles.samples = samples
    scene.cycles.use_denoising = True
    scene.render.resolution_x = res
    scene.render.resolution_y = res
    scene.render.film_transparent = True
    scene.render.image_settings.file_format = 'PNG'
    scene.render.image_settings.color_mode = 'RGBA'
    scene.view_settings.view_transform = 'Standard'
    scene.view_settings.look = 'None'
    scene.view_settings.exposure = -0.7
    world = bpy.data.worlds.new('WRL_Review') if scene.world is None else scene.world
    scene.world = world
    world.use_nodes = True
    bgn = world.node_tree.nodes.get('Background')
    bgn.inputs['Color'].default_value = (0.98, 0.93, 0.88, 1)
    bgn.inputs['Strength'].default_value = 0.8
    # shadow catcher ground
    if 'REVIEW_Ground' not in bpy.data.objects:
        bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0, 0))
        g = bpy.context.active_object
        g.name = 'REVIEW_Ground'
        g.is_shadow_catcher = True
        prev = bpy.data.collections.get('LIGHTING_PREVIEW')
        if prev:
            for c in g.users_collection:
                c.objects.unlink(g)
            prev.objects.link(g)
    cam_data = bpy.data.cameras.get('CAM_Review') or bpy.data.cameras.new('CAM_Review')
    cam_data.type = 'ORTHO'
    cam_data.ortho_scale = 1.128 * res / res
    cam = bpy.data.objects.get('CAM_Review') or bpy.data.objects.new('CAM_Review', cam_data)
    if cam.name not in scene.collection.objects and not cam.users_collection:
        (bpy.data.collections.get('LIGHTING_PREVIEW') or scene.collection).objects.link(cam)
    scene.camera = cam
    return cam


def render_views(out_dir, samples=64, res=724, views=None, masks_dir=None):
    from PIL import Image
    scene = bpy.context.scene
    cam = setup(scene, samples, res)
    os.makedirs(out_dir, exist_ok=True)
    paths = {}
    from mathutils import Matrix
    rig = [o for o in bpy.data.objects if o.type == 'LIGHT']
    rest = {o.name: o.matrix_world.copy() for o in rig}
    for name, az in (views or VIEWS).items():
        a = math.radians(az)
        cam.location = (-6 * math.sin(a), -6 * math.cos(a), 0.48)
        # camera-relative light rig: identical lighting in every turnaround view
        for o in rig:
            o.matrix_world = Matrix.Rotation(-a, 4, 'Z') @ rest[o.name]
        look_at(cam, (0, 0, 0.48))
        tmp = os.path.join(out_dir, f'_tmp_{name}.png')
        scene.render.filepath = tmp
        bpy.ops.render.render(write_still=True)
        im = Image.open(tmp).convert('RGBA')
        bg = Image.new('RGBA', im.size, BG + (255,))
        bg.alpha_composite(im)
        p = os.path.join(out_dir, f'fox_{name}.png')
        bg.convert('RGB').save(p)
        if masks_dir:
            os.makedirs(masks_dir, exist_ok=True)
            # silhouette mask (alpha minus the shadow catcher's faint shadow)
            im.getchannel('A').point(lambda a: 255 if a > 200 else 0).save(
                os.path.join(masks_dir, f'mask_{name}.png'))
        os.remove(tmp)
        paths[name] = p
        print('rendered', p)
    for o in rig:
        o.matrix_world = rest[o.name]
    return paths


if __name__ == '__main__':
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    ap = argparse.ArgumentParser()
    ap.add_argument('--samples', type=int, default=64)
    ap.add_argument('--res', type=int, default=724)
    ap.add_argument('--blend', default=os.path.join(ROOT, '02_MODEL', 'fox_master.blend'))
    ap.add_argument('--out', default=os.path.join(ROOT, '01_DESIGN', 'turnaround'))
    ap.add_argument('--masks', default=os.path.join(ROOT, '08_VALIDATION', 'masks'))
    args = ap.parse_args(argv)
    bpy.ops.wm.open_mainfile(filepath=args.blend)
    render_views(args.out, args.samples, args.res, masks_dir=args.masks)
