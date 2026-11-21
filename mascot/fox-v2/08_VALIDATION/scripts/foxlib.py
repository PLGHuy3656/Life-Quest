"""LifeQuest Fox V2 — procedural geometry helpers (Blender 5.x, bpy).

All geometry is generated from analytic profiles so the build is fully
reproducible. Units: metres, Z-up, character faces -Y, ground at Z=0,
total height ~1.0 at level-20 scale (1.00).
"""
import math
import bpy
import bmesh
from mathutils import Vector, Matrix
from mathutils.bvhtree import BVHTree
from mathutils.geometry import tessellate_polygon


# ----------------------------------------------------------------- colours
def srgb_to_linear(c):
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4


def hex_to_linear(h, a=1.0):
    h = h.lstrip('#')
    return tuple(srgb_to_linear(int(h[i:i + 2], 16) / 255.0) for i in (0, 2, 4)) + (a,)


def make_material(name, hex_color, roughness=0.55, specular=0.35, coat=0.0,
                  sheen=0.0, alpha=1.0):
    mat = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    mat.use_nodes = True
    nt = mat.node_tree
    bsdf = nt.nodes.get('Principled BSDF')
    bsdf.inputs['Base Color'].default_value = hex_to_linear(hex_color)
    bsdf.inputs['Roughness'].default_value = roughness
    bsdf.inputs['Specular IOR Level'].default_value = specular
    if coat:
        bsdf.inputs['Coat Weight'].default_value = coat
        bsdf.inputs['Coat Roughness'].default_value = 0.12
    if sheen:
        bsdf.inputs['Sheen Weight'].default_value = sheen
        bsdf.inputs['Sheen Roughness'].default_value = 0.6
    if alpha < 1.0:
        bsdf.inputs['Alpha'].default_value = alpha
    mat.diffuse_color = hex_to_linear(hex_color)  # viewport colour
    mat['source_hex'] = hex_color
    return mat


# ------------------------------------------------------------- collections
def get_collection(name, parent=None):
    col = bpy.data.collections.get(name)
    if col is None:
        col = bpy.data.collections.new(name)
        (parent or bpy.context.scene.collection).children.link(col)
    return col


# ------------------------------------------------------------ mesh making
def mesh_from_rings(name, rings, start_pole=None, end_pole=None, collection=None,
                    smooth=True):
    """rings: list of rings, each a list of N Vectors (closed loops)."""
    verts, faces = [], []
    n = len(rings[0])
    off = 0
    if start_pole is not None:
        verts.append(tuple(start_pole))
        off = 1
    for ring in rings:
        verts.extend(tuple(v) for v in ring)
    for r in range(len(rings) - 1):
        a, b = off + r * n, off + (r + 1) * n
        for i in range(n):
            j = (i + 1) % n
            faces.append((a + i, a + j, b + j, b + i))
    if start_pole is not None:
        for i in range(n):
            faces.append((0, 1 + (i + 1) % n, 1 + i))
    if end_pole is not None:
        p = len(verts)
        verts.append(tuple(end_pole))
        last = off + (len(rings) - 1) * n
        for i in range(n):
            faces.append((last + i, last + (i + 1) % n, p))
    return finish_mesh(name, verts, faces, collection, smooth)


def finish_mesh(name, verts, faces, collection=None, smooth=True):
    me = bpy.data.meshes.new(name)
    me.from_pydata(verts, [], faces)
    me.validate()
    bm = bmesh.new()
    bm.from_mesh(me)
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-7)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    (collection or bpy.context.scene.collection).objects.link(obj)
    if smooth:
        for p in me.polygons:
            p.use_smooth = True
    return obj


def interp_table(table, z):
    """Smooth monotone cubic (Fritsch-Carlson) interpolation of rows
    [(z, v1, v2, ...)] — no flat steps at the knots, no overshoot."""
    if z <= table[0][0]:
        return list(table[0][1:])
    if z >= table[-1][0]:
        return list(table[-1][1:])
    k = max(i for i in range(len(table) - 1) if table[i][0] <= z)
    z0, z1 = table[k][0], table[k + 1][0]
    h = z1 - z0
    t = (z - z0) / h
    out = []
    for c in range(1, len(table[0])):
        def slope(i):
            return (table[i + 1][c] - table[i][c]) / (table[i + 1][0] - table[i][0])
        def tangent(i):
            if i == 0:
                return slope(0)
            if i == len(table) - 1:
                return slope(i - 1)
            a, b = slope(i - 1), slope(i)
            if a * b <= 0:
                return 0.0
            return 2 * a * b / (a + b)
        y0, y1 = table[k][c], table[k + 1][c]
        m0, m1 = tangent(k) * h, tangent(k + 1) * h
        t2, t3 = t * t, t * t * t
        out.append((2 * t3 - 3 * t2 + 1) * y0 + (t3 - 2 * t2 + t) * m0
                   + (-2 * t3 + 3 * t2) * y1 + (t3 - t2) * m1)
    return out


def loft_profile(name, table, segments=48, rings=40, front_scale=1.0,
                 deform=None, collection=None, x_center=0.0, axis_power=2.0):
    """Vertical loft. table rows: (z, half_width, half_depth, y_center).
    First and last rows are the poles (their widths are ignored)."""
    z0, z1 = table[0][0], table[-1][0]
    ring_list = []
    for r in range(1, rings):
        # cosine spacing gives denser rings near the poles
        u = r / rings
        z = z0 + (z1 - z0) * (1 - math.cos(math.pi * u)) / 2
        a, b, yc = interp_table(table, z)
        ring = []
        for i in range(segments):
            th = 2 * math.pi * i / segments - math.pi / 2  # i=0 at front (-Y)
            cx, sy = math.cos(th), math.sin(th)
            # superellipse cross section
            ex = math.copysign(abs(cx) ** (2.0 / axis_power), cx)
            ey = math.copysign(abs(sy) ** (2.0 / axis_power), sy)
            bb = b * (front_scale if sy < 0 else 1.0)
            p = Vector((x_center + a * ex, yc + bb * ey, z))
            if deform:
                p = deform(p)
            ring.append(p)
        ring_list.append(ring)
    yb = table[0][3]
    yt = table[-1][3]
    sp = Vector((x_center, yb, z0))
    ep = Vector((x_center, yt, z1))
    if deform:
        sp, ep = deform(sp), deform(ep)
    return mesh_from_rings(name, ring_list, sp, ep, collection)


def catmull_rom(points, t):
    pts = [points[0]] + list(points) + [points[-1]]
    n = len(points) - 1
    s = min(max(t, 0.0), 1.0) * n
    i = min(int(s), n - 1)
    u = s - i
    p0, p1, p2, p3 = (Vector(pts[i + k]) for k in range(4))
    return 0.5 * ((2 * p1) + (-p0 + p2) * u + (2 * p0 - 5 * p1 + 4 * p2 - p3) * u * u
                  + (-p0 + 3 * p1 - 3 * p2 + p3) * u * u * u)


def sweep(name, spine, radius, segments=24, rings=32, up_hint=(0, 0, 1),
          collection=None, normal_fn=None, closed_ends=True):
    """Tube along a Catmull-Rom spine. radius(t) -> r or (rx, ry).
    Returns (obj, params) where params[v_index] = (t, theta)."""
    ts = [k / rings for k in range(1, rings)]
    P = [catmull_rom(spine, t) for t in ts]
    p_start, p_end = Vector(spine[0]), Vector(spine[-1])
    tangents = []
    for k in range(len(P)):
        a = P[k - 1] if k > 0 else p_start
        b = P[k + 1] if k < len(P) - 1 else p_end
        tangents.append((b - a).normalized())
    # parallel transport frames
    up = Vector(up_hint)
    n0 = (up - up.dot(tangents[0]) * tangents[0])
    if n0.length < 1e-6:
        n0 = tangents[0].orthogonal()
    normals = [n0.normalized()]
    for k in range(1, len(P)):
        prev_t, cur_t = tangents[k - 1], tangents[k]
        rot = prev_t.rotation_difference(cur_t)
        normals.append((rot @ normals[-1]).normalized())
    ring_list, params = [], []
    if closed_ends:
        params.append((0.0, 0.0))
    for k, (p, t) in enumerate(zip(P, ts)):
        T = tangents[k]
        N = normals[k]
        if normal_fn is not None:
            hint = Vector(normal_fn(p, ts[k]))
            N = (hint - hint.dot(T) * T).normalized()
        B = T.cross(N).normalized()
        r = radius(t)
        rx, ry = (r, r) if not isinstance(r, (tuple, list)) else r
        ring = []
        for i in range(segments):
            th = 2 * math.pi * i / segments
            ring.append(p + N * (math.cos(th) * rx) + B * (math.sin(th) * ry))
            params.append((t, th))
        ring_list.append(ring)
    if closed_ends:
        params.append((1.0, 0.0))
        obj = mesh_from_rings(name, ring_list, p_start, p_end, collection)
    else:
        obj = mesh_from_rings(name, ring_list, None, None, collection)
    return obj, params


def rounded_box(name, size, bevel=0.02, segments=3, collection=None, center=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    for v in bm.verts:
        v.co = Vector((v.co.x * size[0], v.co.y * size[1], v.co.z * size[2]))
    bmesh.ops.bevel(bm, geom=list(bm.edges), offset=bevel, segments=segments,
                    profile=0.5, affect='EDGES')
    for v in bm.verts:
        v.co += Vector(center)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    (collection or bpy.context.scene.collection).objects.link(obj)
    for p in me.polygons:
        p.use_smooth = True
    return obj


# ------------------------------------------------------------- utilities
def set_origin(obj, point):
    point = Vector(point)
    obj.data.transform(Matrix.Translation(-point))
    obj.location = obj.location + point
    bpy.context.view_layer.update()


def parent_keep(child, parent):
    """Parent while keeping the child's world transform."""
    bpy.context.view_layer.update()
    mw = child.matrix_world.copy()
    child.parent = parent
    child.matrix_parent_inverse = parent.matrix_world.inverted()
    bpy.context.view_layer.update()
    assert (child.matrix_world.translation - mw.translation).length < 1e-5


def add_subsurf(obj, levels=1, render_levels=2):
    m = obj.modifiers.new('Subdivision', 'SUBSURF')
    m.levels = levels
    m.render_levels = render_levels
    return m


def assign_materials(obj, mats, chooser):
    """chooser(face_center, face_normal, face_vertex_indices) -> slot index."""
    for m in mats:
        obj.data.materials.append(m)
    mw = obj.matrix_world
    for p in obj.data.polygons:
        c = mw @ p.center
        n = (mw.to_3x3() @ p.normal).normalized()
        p.material_index = chooser(c, n, list(p.vertices))


def bvh_for(obj):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    ev = obj.evaluated_get(dg)
    me = ev.to_mesh()
    mw = obj.matrix_world
    verts = [mw @ v.co for v in me.vertices]
    polys = [tuple(p.vertices) for p in me.polygons]
    ev.to_mesh_clear()
    return BVHTree.FromPolygons(verts, polys)


def project(bvh, origin, direction, max_dist=10.0):
    hit, nrm, idx, dist = bvh.ray_cast(Vector(origin), Vector(direction).normalized(), max_dist)
    return hit, nrm


def decal(name, outline, holes, to_world, bvh, ray_dir, offset=0.002, dome=0.0,
          cuts=2, collection=None, dome_radius=None):
    """2D polygon -> mesh projected onto a surface.
    outline/holes: lists of (u, v). to_world(u, v) -> ray origin (Vector).
    Vertices are snapped to the surface hit + normal*(offset + dome profile)."""
    loops = [[Vector((u, v, 0)) for u, v in outline]] + \
            [[Vector((u, v, 0)) for u, v in h] for h in holes]
    flat = [p for loop in loops for p in loop]
    tris = tessellate_polygon(loops)
    bm = bmesh.new()
    bv = [bm.verts.new(p) for p in flat]
    for tri in tris:
        try:
            bm.faces.new([bv[i] for i in tri])
        except ValueError:
            pass
    bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-9)
    if cuts:
        bmesh.ops.subdivide_edges(bm, edges=list(bm.edges), cuts=cuts, use_grid_fill=True)
    bmesh.ops.triangulate(bm, faces=bm.faces)
    # dome reference: centroid of outline
    cu = sum(u for u, v in outline) / len(outline)
    cv = sum(v for u, v in outline) / len(outline)
    if dome_radius is None:
        dome_radius = max(math.hypot(u - cu, v - cv) for u, v in outline)
    for v in bm.verts:
        u, w = v.co.x, v.co.y
        hit, nrm = project(bvh, to_world(u, w), ray_dir)
        if hit is None:
            o = to_world(u, w)
            # fall back to the nearest surface point to the ray's mid-line
            hit, nrm, _, _ = bvh.find_nearest(o + Vector(ray_dir).normalized() * 2.0)
        d = 0.0
        if dome:
            rr = min(1.0, math.hypot(u - cu, w - cv) / dome_radius)
            d = dome * math.sqrt(max(0.0, 1 - rr * rr))
        v.co = hit + nrm.normalized() * (offset + d)
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    (collection or bpy.context.scene.collection).objects.link(obj)
    for p in me.polygons:
        p.use_smooth = True
    return obj


def ellipse(cx, cy, rx, ry, n=32, rot=0.0):
    out = []
    for i in range(n):
        a = 2 * math.pi * i / n
        x, y = rx * math.cos(a), ry * math.sin(a)
        out.append((cx + x * math.cos(rot) - y * math.sin(rot),
                    cy + x * math.sin(rot) + y * math.cos(rot)))
    return out


def stroke_polygon(points, width, n_cap=6):
    """Thick 2D stroke with round caps around an open polyline -> outline."""
    pts = [Vector((x, y)) for x, y in points]
    left, right = [], []
    for i, p in enumerate(pts):
        a = pts[max(i - 1, 0)]
        b = pts[min(i + 1, len(pts) - 1)]
        t = (b - a).normalized()
        n = Vector((-t.y, t.x))
        left.append(p + n * width / 2)
        right.append(p - n * width / 2)
    def cap(center, direction, sign):
        out = []
        t = direction.normalized()
        n = Vector((-t.y, t.x))
        for k in range(1, n_cap):
            a = math.pi * k / n_cap
            out.append(center + (n * math.cos(a) * sign + t * math.sin(a)) * width / 2)
        return out
    end_cap = cap(pts[-1], pts[-1] - pts[-2], 1)
    start_cap = cap(pts[0], pts[0] - pts[1], -1)
    outline = left + end_cap + list(reversed(right)) + start_cap
    return [(p.x, p.y) for p in outline]


def split_by_values(obj, mats, values, lo=0.12, hi=0.88):
    """Cut the mesh exactly along the zero set of a per-vertex scalar field and
    assign mats[1] where value > 0, mats[0] elsewhere. Gives smooth colour
    boundaries (no stair-stepping) that survive subdivision and glTF export."""
    me = obj.data
    bm = bmesh.new()
    bm.from_mesh(me)
    bm.verts.ensure_lookup_table()
    lay = bm.verts.layers.float.new('fox_split')
    for v in bm.verts:
        val = values[v.index]
        if abs(val) < 1e-9:
            val = 1e-9
        v[lay] = val
    crossing = [e for e in bm.edges if e.verts[0][lay] * e.verts[1][lay] < 0]
    new_verts = []
    for e in crossing:
        a, b = e.verts
        fa, fb = a[lay], b[lay]
        fac = min(hi, max(lo, fa / (fa - fb)))
        ne, nv = bmesh.utils.edge_split(e, a, fac)
        nv[lay] = 0.0
        new_verts.append(nv)
    bmesh.ops.connect_verts(bm, verts=new_verts, check_degenerate=False)
    for m in mats:
        me.materials.append(m)
    for f in bm.faces:
        mx = max(v[lay] for v in f.verts)
        mn = min(v[lay] for v in f.verts)
        f.material_index = 1 if mx > 0 and mn >= 0 else 0
        f.smooth = True
    bm.verts.layers.float.remove(lay)
    bm.to_mesh(me)
    bm.free()


def values_from_positions(obj, fn):
    mw = obj.matrix_world
    return [fn(mw @ v.co) for v in obj.data.vertices]


def bvh_for_many(objs):
    bpy.context.view_layer.update()
    dg = bpy.context.evaluated_depsgraph_get()
    verts, polys = [], []
    for obj in objs:
        ev = obj.evaluated_get(dg)
        me = ev.to_mesh()
        off = len(verts)
        verts += [obj.matrix_world @ v.co for v in me.vertices]
        polys += [tuple(i + off for i in p.vertices) for p in me.polygons]
        ev.to_mesh_clear()
    return BVHTree.FromPolygons(verts, polys)
