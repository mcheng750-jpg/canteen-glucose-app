import math
import os
from pathlib import Path

import bpy
from mathutils import Vector


OUT_DIR = Path("/Users/momo/Documents/Codex/blender-mcp-output/output")
OUT_DIR.mkdir(parents=True, exist_ok=True)
STYLED = OUT_DIR / "canteen_styled_in_blender_ui.blend"
RENDER = OUT_DIR / "canteen_styled_in_blender_ui.png"
SOURCE_BLEND = OUT_DIR / "canteen_styled_in_blender_ui.blend"
FONT_PATH = Path("/System/Library/Fonts/STHeiti Medium.ttc")


def is_default_cube_scene():
    meshes = sorted(o.name for o in bpy.context.scene.objects if o.type == "MESH")
    return meshes == ["Cube"]


if SOURCE_BLEND.exists() and (os.environ.get("BLENDER_OPEN_SOURCE") == "1" or is_default_cube_scene()):
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE_BLEND))


def mat(name, color, roughness=0.88, emission=None, strength=0.0):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        base = bsdf.inputs.get("Base Color")
        if base:
            for link in list(base.links):
                material.node_tree.links.remove(link)
            base.default_value = color
        bsdf.inputs["Metallic"].default_value = 0.0
        bsdf.inputs["Roughness"].default_value = roughness
        if emission and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = strength
    return material


MAT_COUNTER = mat("fast warm clay cream toy ceramic", (0.70, 0.56, 0.38, 1), 0.96)
MAT_WOOD = mat("fast honey toy wood matte", (0.74, 0.45, 0.22, 1), 0.92)
MAT_SIGN = mat("fast soft ivory sign matte", (0.78, 0.70, 0.56, 1), 0.96)
MAT_FLOOR = mat("fast warm beige patterned tile", (0.68, 0.50, 0.31, 1), 0.98)
MAT_GROUT = mat("fast soft caramel grout", (0.34, 0.22, 0.12, 1), 0.99)
MAT_WALL = mat("fast cream upper wall", (0.82, 0.68, 0.50, 1), 0.96)
MAT_PANEL = mat("fast pale honey wall panel", (0.78, 0.48, 0.24, 1), 0.92)
MAT_LEAF = mat("fast deep olive plant", (0.18, 0.34, 0.12, 1), 0.93)
MAT_LEAF_LIGHT = mat("fast yellow green plant", (0.40, 0.58, 0.20, 1), 0.92)
MAT_PLATE = mat("fast warm ivory plate", (0.90, 0.82, 0.65, 1), 0.95)
MAT_ORANGE = mat("fast toy food orange", (0.94, 0.48, 0.14, 1), 0.88)
MAT_CARAMEL = mat("fast toy food caramel", (0.76, 0.39, 0.12, 1), 0.9)
MAT_SAUCE = mat("fast toy food sauce", (0.30, 0.13, 0.06, 1), 0.92)
MAT_GREEN = mat("fast toy food green", (0.20, 0.42, 0.13, 1), 0.92)
MAT_LIGHT = mat("fast warm lantern glow", (1.0, 0.74, 0.34, 1), 0.65, (1.0, 0.55, 0.16, 1), 2.4)
MAT_TEXT = mat("fast printed dark brown text", (0.035, 0.024, 0.014, 1), 0.96, (0.035, 0.024, 0.014, 1), 0.18)
MAT_LABEL_PATCH = mat("fast printed label ink plate", (0.86, 0.78, 0.62, 1), 0.96)


STALLS = [
    ("老碗会", -9.4, -5.25, 3.2),
    ("衡阳鱼粉", -4.3, -5.25, 3.2),
    ("湘遇湖南衡东土菜馆子", 3.75, -5.25, 5.6),
    ("客家腌面", -11.1, -1.85, 1.75),
    ("鲜湘下饭菜", -8.55, -1.85, 1.75),
    ("德优选品", -5.95, -1.85, 1.9),
    ("壹品炖", -3.35, -1.85, 1.75),
    ("拌饭屋", -1.05, -1.85, 1.75),
    ("阿福烧腊", 1.25, -1.85, 1.75),
    ("三及第酸汤肥牛", 3.7, -1.85, 1.75),
    ("三及第酸汤肥牛", 6.1, -1.85, 1.75),
    ("尝来尝往", 8.6, -1.85, 1.75),
    ("肯德基", -11.25, 2.25, 1.65),
    ("关东灶", -8.1, 1.9, 1.75),
    ("小碗蒸鲜", -5.75, 1.9, 1.75),
    ("鲜炒小碗菜", -3.2, 1.9, 1.75),
    ("盖浇饭", -0.9, 1.9, 1.2),
    ("好怡", 0.85, 1.9, 1.2),
    ("万和潮记", 2.55, 1.9, 1.2),
    ("日式牛肉盖饭", 4.8, 1.9, 1.55),
    ("重庆小面", 6.7, 1.9, 1.45),
    ("扒知味", 8.55, 1.9, 1.45),
    ("东旭", -4.35, 3.65, 5.1),
    ("广味三宝", 3.85, 3.65, 6.35),
]


def cube(name, loc, scale, material, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    obj.data.materials.append(material)
    if bevel:
        mod = obj.modifiers.new("toy rounded bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 6
        obj.modifiers.new("soft toy normals", "WEIGHTED_NORMAL")
    return obj


def cylinder(name, loc, radius, depth, material, vertices=24):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    bevel = obj.modifiers.new("soft rounded rim", "BEVEL")
    bevel.width = radius * 0.12
    bevel.segments = 4
    obj.modifiers.new("soft normals", "WEIGHTED_NORMAL")
    return obj


def sphere(name, loc, radius, material, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(material)
    return obj


def face_camera(obj, camera):
    direction = camera.location - obj.location
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()


def bounds():
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    mins = Vector((1e9, 1e9, 1e9))
    maxs = Vector((-1e9, -1e9, -1e9))
    for obj in meshes:
        if obj.name.startswith("fast "):
            continue
        for corner in obj.bound_box:
            p = obj.matrix_world @ Vector(corner)
            mins.x = min(mins.x, p.x)
            mins.y = min(mins.y, p.y)
            mins.z = min(mins.z, p.z)
            maxs.x = max(maxs.x, p.x)
            maxs.y = max(maxs.y, p.y)
            maxs.z = max(maxs.z, p.z)
    if mins.x == 1e9:
        return Vector((-6, -4, 0)), Vector((6, 4, 3))
    return mins, maxs


def clean_helpers():
    for obj in list(bpy.context.scene.objects):
        if obj.name.startswith(("fast ", "warm ", "cream ", "thin floor", "back ", "left ", "large sun", "window ", "small warm", "matte plant", "chunky toy", "afternoon sun", "huge soft", "diorama render")):
            bpy.data.objects.remove(obj, do_unlink=True)


def soften_original_model():
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH" or obj.name.startswith("fast "):
            continue
        lname = obj.name.lower()
        if obj.name.startswith("tripo_node_"):
            obj.data.materials.clear()
            obj.data.materials.append(MAT_COUNTER)
        else:
            for slot in obj.material_slots:
                material = slot.material
                if material:
                    matname = material.name.lower()
                    if any(t in lname or t in matname for t in ("plant", "leaf", "tree")):
                        slot.material = MAT_LEAF
                    elif any(t in lname or t in matname for t in ("table", "chair", "seat", "wood")):
                        slot.material = MAT_WOOD
                    elif any(t in lname or t in matname for t in ("sign", "label", "board")):
                        slot.material = MAT_SIGN
                    else:
                        slot.material = MAT_COUNTER
        if not any(m.type == "BEVEL" for m in obj.modifiers):
            bevel = obj.modifiers.new("fast soft bevel", "BEVEL")
            bevel.width = 0.01
            bevel.segments = 2
            obj.modifiers.new("fast weighted normals", "WEIGHTED_NORMAL")


def make_mapper(mins, maxs):
    sx0, sx1 = -11.4, 8.9
    sy0, sy1 = -5.45, 3.85
    width = maxs.x - mins.x
    depth = maxs.y - mins.y

    def mx(x):
        return mins.x + ((x - sx0) / (sx1 - sx0)) * width

    def my(y):
        return mins.y + ((y - sy0) / (sy1 - sy0)) * depth

    return mx, my


def add_food_details(mins, maxs):
    mx, my = make_mapper(mins, maxs)
    z = mins.z + 0.18
    foods = [MAT_ORANGE, MAT_CARAMEL, MAT_GREEN, MAT_SAUCE]
    for idx, (_, sx, sy, sw) in enumerate(STALLS):
        x = mx(sx)
        y = my(sy)
        count = 3 if sw < 2 else 5
        spread = min(0.16, sw * 0.022)
        for i in range(count):
            px = x + (i - (count - 1) / 2) * spread / max(count - 1, 1)
            py = y + 0.10 + (i % 2) * 0.055
            cylinder("fast tiny ivory food plate", (px, py, z), 0.010, 0.005, MAT_PLATE, 16)
            sphere("fast tiny warm toy food lump", (px - 0.004, py + 0.001, z + 0.007), 0.006, foods[(idx + i) % len(foods)], (1.25, 0.85, 0.55))
            sphere("fast tiny warm toy food accent", (px + 0.005, py - 0.002, z + 0.008), 0.004, foods[(idx + i + 1) % len(foods)], (1.0, 0.85, 0.55))


def add_printed_labels(mins, maxs, floor_z, camera):
    mx, my = make_mapper(mins, maxs)
    try:
        font = bpy.data.fonts.load(str(FONT_PATH)) if FONT_PATH.exists() else None
    except Exception:
        font = None
    for name, sx, sy, sw in STALLS:
        x = mx(sx)
        y = my(sy)
        z = floor_z + 0.40
        patch_w = min(0.18, max(0.085, sw * 0.020))
        cube("fast printed label backing", (x, y + 0.018, z - 0.002), (patch_w, 0.006, 0.030), MAT_LABEL_PATCH, 0.008)
        bpy.ops.object.text_add(location=(x, y + 0.024, z + 0.002))
        obj = bpy.context.object
        obj.name = f"fast printed stall text {name}"
        obj.data.body = name
        obj.data.align_x = "CENTER"
        obj.data.align_y = "CENTER"
        obj.data.size = max(0.004, min(0.012, patch_w * 0.36 / max(len(name), 4)))
        obj.data.extrude = 0.0
        obj.data.space_character = 1.0
        if font:
            obj.data.font = font
        obj.data.materials.append(MAT_TEXT)
        face_camera(obj, camera)


def add_environment_and_lights():
    mins, maxs = bounds()
    cx, cy = (mins.x + maxs.x) / 2, (mins.y + maxs.y) / 2
    width = max(maxs.x - mins.x, 1.8) + 0.55
    depth = max(maxs.y - mins.y, 1.25) + 0.55
    floor_z = mins.z - 0.055
    back_y = mins.y - 0.78
    left_x = mins.x - 0.78

    cube("fast warm diorama base slab", (cx, cy, floor_z - 0.08), (width, depth, 0.16), MAT_FLOOR, 0.08)
    cube("fast ceramic tile surface", (cx, cy, floor_z + 0.01), (width - 0.18, depth - 0.18, 0.025), MAT_FLOOR, 0.035)
    tile = 0.24
    for i in range(int(width / tile) + 1):
        x = cx - width / 2 + i * tile
        cube("fast tile grout x", (x, cy, floor_z + 0.033), (0.005, depth - 0.22, 0.01), MAT_GROUT, 0)
    for j in range(int(depth / tile) + 1):
        y = cy - depth / 2 + j * tile
        cube("fast tile grout y", (cx, y, floor_z + 0.034), (width - 0.22, 0.005, 0.01), MAT_GROUT, 0)

    wall_h = max(maxs.z - mins.z + 0.85, 1.55)
    cube("fast back cream wall", (cx, back_y, floor_z + wall_h / 2), (width, 0.18, wall_h), MAT_WALL, 0.045)
    cube("fast back honey wall panel", (cx, back_y + 0.105, floor_z + 1.30), (width - 0.24, 0.075, 1.45), MAT_PANEL, 0.025)
    cube("fast left cream wall", (left_x, cy, floor_z + wall_h / 2), (0.18, depth, wall_h), MAT_WALL, 0.045)
    cube("fast left honey wall panel", (left_x + 0.105, cy, floor_z + 1.30), (0.075, depth - 0.24, 1.45), MAT_PANEL, 0.025)

    for y in [cy - depth * 0.28, cy - depth * 0.06, cy + depth * 0.16]:
        cube("fast large sunny window", (left_x + 0.15, y, floor_z + wall_h * 0.70), (0.045, depth * 0.14, wall_h * 0.34), MAT_LIGHT, 0.018)

    for x in [cx - width * 0.34, cx - width * 0.17, cx, cx + width * 0.17, cx + width * 0.34]:
        cube("fast warm wall lantern", (x, back_y + 0.14, floor_z + wall_h * 0.72), (0.16, 0.055, 0.22), MAT_LIGHT, 0.03)
        bpy.ops.object.light_add(type="POINT", location=(x, back_y + 0.35, floor_z + wall_h * 0.70))
        lamp = bpy.context.object
        lamp.name = "fast warm lantern light"
        lamp.data.energy = 90
        lamp.data.color = (1.0, 0.66, 0.32)
        lamp.data.shadow_soft_size = 1.7

    for x in [mins.x + 0.32, cx - 0.45, cx + 0.55, maxs.x - 0.32]:
        for y in [mins.y + 0.32, cy + 0.20]:
            cylinder("fast plant pot", (x, y, floor_z + 0.07), 0.035, 0.08, MAT_PANEL)
            for a in range(0, 360, 72):
                rad = math.radians(a)
                material = MAT_LEAF if a % 144 else MAT_LEAF_LIGHT
                sphere("fast plant leaf", (x + math.cos(rad) * 0.045, y + math.sin(rad) * 0.045, floor_z + 0.145), 0.032, material, (1.0, 0.55, 0.30))

    bpy.ops.object.light_add(type="SUN", location=(left_x - 3.2, cy + 1.2, floor_z + 5.5))
    sun = bpy.context.object
    sun.name = "fast afternoon sun"
    sun.rotation_euler = (math.radians(42), 0, math.radians(-34))
    sun.data.energy = 2.8
    sun.data.angle = math.radians(8)
    sun.data.color = (1.0, 0.80, 0.56)

    bpy.ops.object.light_add(type="AREA", location=(left_x - 1.2, cy - 0.9, floor_z + 3.0))
    area = bpy.context.object
    area.name = "fast soft window fill"
    area.data.energy = 520
    area.data.size = 5.0
    area.data.color = (1.0, 0.82, 0.55)

    camera_loc = (cx + width * 0.48, cy + depth * 0.86, floor_z + max(width, depth) * 0.56)
    target = Vector((cx, cy + depth * 0.18, floor_z + 0.38))
    bpy.ops.object.camera_add(location=camera_loc)
    camera = bpy.context.object
    camera.name = "fast diorama render camera"
    direction = target - camera.location
    camera.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = max(width, depth) * 0.45
    bpy.context.scene.camera = camera
    # Do not add floating text or extra food props here. The current Tripo model has
    # tightly packed geometry, so screen-facing labels and synthetic plates easily
    # become visual clutter. Keep this pass focused on material, walls, floor, and light.


def set_render():
    scene = bpy.context.scene
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue
    scene.world = scene.world or bpy.data.worlds.new("World")
    scene.world.color = (0.92, 0.76, 0.52)
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium High Contrast"
    scene.view_settings.exposure = -0.18
    scene.view_settings.gamma = 1.0
    scene.render.resolution_x = 1792
    scene.render.resolution_y = 1024
    scene.render.filepath = str(RENDER)


clean_helpers()
soften_original_model()
add_environment_and_lights()
set_render()
bpy.ops.wm.save_as_mainfile(filepath=str(STYLED))
bpy.ops.render.render(write_still=True)
print(f"FAST_STYLED_BLEND={STYLED}")
print(f"FAST_RENDER_PNG={RENDER}")
