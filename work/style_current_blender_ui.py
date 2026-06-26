import math
import os
from collections import defaultdict, deque
from pathlib import Path

import bpy
from mathutils import Vector


OUT_DIR = Path("/Users/momo/Documents/Codex/blender-mcp-output/output")
OUT_DIR.mkdir(parents=True, exist_ok=True)
STYLED = OUT_DIR / "canteen_styled_in_blender_ui.blend"
RENDER = OUT_DIR / "canteen_styled_in_blender_ui.png"
FONT_PATH = Path("/System/Library/Fonts/STHeiti Medium.ttc")
SOURCE_BLEND = Path("/Users/momo/Documents/Codex/blender-mcp-output/output/canteen_styled_in_blender_ui.blend")


def is_default_cube_scene():
    mesh_names = sorted(o.name for o in bpy.context.scene.objects if o.type == "MESH")
    return mesh_names == ["Cube"]


if SOURCE_BLEND.exists() and (os.environ.get("BLENDER_OPEN_SOURCE") == "1" or is_default_cube_scene()):
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE_BLEND))


def mat(name, color, roughness=0.82, emission=None, strength=0.0):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = 0.0
        if emission and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = strength
    return material


def unlink_base_color_texture(material):
    if not material or not material.use_nodes:
        return
    bsdf = material.node_tree.nodes.get("Principled BSDF")
    if not bsdf:
        return
    base = bsdf.inputs.get("Base Color")
    if not base:
        return
    for link in list(base.links):
        material.node_tree.links.remove(link)


MAT_FLOOR = mat("warm beige ceramic tile matte", (0.66, 0.48, 0.28, 1), 0.96)
MAT_TILE = mat("sun warmed patterned tile matte", (0.76, 0.59, 0.37, 1), 0.98)
MAT_GROUT = mat("soft caramel grout matte", (0.42, 0.28, 0.15, 1), 0.99)
MAT_WALL = mat("cream sunlit upper wall matte", (0.84, 0.72, 0.56, 1), 0.94)
MAT_PANEL = mat("pale honey wood wall panel matte", (0.84, 0.58, 0.34, 1), 0.88)
MAT_COUNTER = mat("warm cream toy plastic matte", (0.84, 0.74, 0.58, 1), 0.94)
MAT_WOOD = mat("honey toy furniture matte", (0.80, 0.52, 0.27, 1), 0.88)
MAT_LEAF = mat("deep olive toy plant matte", (0.20, 0.37, 0.14, 1), 0.92)
MAT_LEAF_LIGHT = mat("yellow green toy leaf matte", (0.43, 0.60, 0.22, 1), 0.9)
MAT_FOOD_ORANGE = mat("toy food glazed orange matte", (0.92, 0.48, 0.16, 1), 0.86)
MAT_FOOD_CARAMEL = mat("toy food caramel matte", (0.78, 0.44, 0.16, 1), 0.88)
MAT_FOOD_SAUCE = mat("toy food dark sauce matte", (0.36, 0.16, 0.07, 1), 0.9)
MAT_FOOD_GREEN = mat("toy food vegetable matte", (0.20, 0.42, 0.13, 1), 0.9)
MAT_FOOD_RICE = mat("toy food rice warm matte", (0.94, 0.78, 0.48, 1), 0.9)
MAT_PLATE = mat("warm ivory ceramic tray matte", (0.88, 0.80, 0.64, 1), 0.94)
MAT_TEXT = mat("printed dark brown sign text", (0.025, 0.018, 0.012, 1), 0.96, (0.025, 0.018, 0.012, 1), 0.35)
MAT_LIGHT = mat("warm glowing lantern", (1.0, 0.72, 0.30, 1), 0.58, (1.0, 0.54, 0.14, 1), 2.2)
MAT_GLASS = mat("milky warm sun glass", (0.86, 0.96, 0.93, 0.5), 0.62, (1.0, 0.86, 0.55, 1), 0.32)


STALL_LABELS = [
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
    if material:
        obj.data.materials.append(material)
    if bevel:
        mod = obj.modifiers.new("large toy bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 8
        obj.modifiers.new("weighted soft normals", "WEIGHTED_NORMAL")
    return obj


def cylinder(name, loc, radius, depth, material):
    bpy.ops.mesh.primitive_cylinder_add(vertices=28, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.data.materials.append(material)
    bevel = obj.modifiers.new("rounded ceramic rim", "BEVEL")
    bevel.width = radius * 0.08
    bevel.segments = 4
    obj.modifiers.new("soft normals", "WEIGHTED_NORMAL")
    return obj


def sphere(name, loc, radius, material, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    obj.data.materials.append(material)
    return obj


def look_at(obj, target):
    direction = Vector(target) - obj.location
    obj.rotation_euler = direction.to_track_quat("-Z", "Y").to_euler()


def face_camera(obj, camera):
    direction = camera.location - obj.location
    obj.rotation_euler = direction.to_track_quat("Z", "Y").to_euler()


def material_color(obj):
    for slot in obj.material_slots:
        material = slot.material
        if not material:
            continue
        material.use_nodes = True
        bsdf = material.node_tree.nodes.get("Principled BSDF")
        if bsdf and "Base Color" in bsdf.inputs:
            return bsdf.inputs["Base Color"].default_value
    return None


def world_dimensions(obj):
    return tuple(abs(v) for v in obj.dimensions)


def tripo_mesh_object():
    return next((o for o in bpy.context.scene.objects if o.type == "MESH" and o.name.startswith("tripo_node_")), None)


def ensure_material_slot(obj, material):
    for index, slot in enumerate(obj.material_slots):
        if slot.material == material:
            return index
    obj.data.materials.append(material)
    return len(obj.data.materials) - 1


def image_from_material(obj):
    for slot in obj.material_slots:
        material = slot.material
        if not material or not material.use_nodes:
            continue
        for node in material.node_tree.nodes:
            if node.type == "TEX_IMAGE" and node.image:
                return node.image
    return None


def sample_image_color(image, uv):
    if not image:
        return None
    try:
        width, height = image.size
        pixels = image.pixels
    except Exception:
        return None
    if width <= 0 or height <= 0:
        return None
    try:
        x = int((uv.x % 1.0) * (width - 1))
        y = int((uv.y % 1.0) * (height - 1))
        offset = (y * width + x) * 4
        return (float(pixels[offset]), float(pixels[offset + 1]), float(pixels[offset + 2]))
    except Exception:
        return None


def mesh_components(obj):
    mesh = obj.data
    vertex_to_polys = defaultdict(list)
    for poly in mesh.polygons:
        for vi in poly.vertices:
            vertex_to_polys[vi].append(poly.index)

    seen = set()
    components = []
    for poly in mesh.polygons:
        if poly.index in seen:
            continue
        q = deque([poly.index])
        seen.add(poly.index)
        poly_indices = []
        vertex_indices = set()
        while q:
            pi = q.popleft()
            p = mesh.polygons[pi]
            poly_indices.append(pi)
            for vi in p.vertices:
                vertex_indices.add(vi)
                for npi in vertex_to_polys[vi]:
                    if npi not in seen:
                        seen.add(npi)
                        q.append(npi)

        pts = [obj.matrix_world @ mesh.vertices[vi].co for vi in vertex_indices]
        mins = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
        maxs = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        dims = maxs - mins
        components.append({
            "polys": poly_indices,
            "verts": vertex_indices,
            "center": (mins + maxs) / 2,
            "dims": Vector((abs(dims.x), abs(dims.y), abs(dims.z))),
        })
    return components


def component_average_color(obj, component, image):
    mesh = obj.data
    uv_layer = mesh.uv_layers.active.data if mesh.uv_layers.active else None
    if not image or not uv_layer:
        return None
    total = [0.0, 0.0, 0.0]
    count = 0
    for pi in component["polys"][:8]:
        poly = mesh.polygons[pi]
        for loop_index in list(poly.loop_indices)[:2]:
            color = sample_image_color(image, uv_layer[loop_index].uv)
            if color:
                total[0] += color[0]
                total[1] += color[1]
                total[2] += color[2]
                count += 1
    if not count:
        return None
    return (total[0] / count, total[1] / count, total[2] / count)


def color_stats(color):
    if not color:
        return 0.5, 0.0
    hi, lo = max(color), min(color)
    brightness = sum(color) / 3
    saturation = 0 if hi == 0 else (hi - lo) / hi
    return brightness, saturation


def is_white_canopy_component(component, color):
    dims = component["dims"]
    max_xy = max(dims.x, dims.y)
    min_xy = min(dims.x, dims.y)
    brightness, saturation = color_stats(color)
    flat_oval = (
        0.055 < max_xy < 0.62
        and 0.018 < min_xy < 0.32
        and 0.002 < dims.z < 0.095
        and max_xy / max(min_xy, 0.001) > 1.18
    )
    low_detail_leaf = len(component["polys"]) > 60
    bright_white = brightness > 0.56 and saturation < 0.40
    return flat_oval and low_detail_leaf and bright_white


def classify_food_material(color, component):
    if not color:
        return None
    dims = component["dims"]
    max_dim = max(dims.x, dims.y, dims.z)
    brightness, saturation = color_stats(color)
    if max_dim > 0.12 or dims.z > 0.055:
        return None
    if brightness > 0.72 and saturation < 0.22:
        return MAT_PLATE
    r, g, b = color
    if g > r * 0.92 and g > b * 1.25:
        return MAT_FOOD_GREEN
    if r > 0.45 and g > 0.28 and b < 0.24:
        return MAT_FOOD_ORANGE
    if r > 0.35 and g > 0.20 and b < 0.18:
        return MAT_FOOD_CARAMEL
    if brightness < 0.30 and saturation > 0.20:
        return MAT_FOOD_SAUCE
    if saturation > 0.25 and brightness > 0.28:
        return MAT_FOOD_CARAMEL
    return None


def refine_merged_tripo_mesh():
    obj = tripo_mesh_object()
    if not obj:
        print("MERGED_MESH_REFINED=missing_tripo")
        return
    mesh = obj.data
    image = image_from_material(obj)
    components = mesh_components(obj)
    material_indices = {
        MAT_COUNTER: ensure_material_slot(obj, MAT_COUNTER),
        MAT_WOOD: ensure_material_slot(obj, MAT_WOOD),
        MAT_LEAF: ensure_material_slot(obj, MAT_LEAF),
        MAT_LEAF_LIGHT: ensure_material_slot(obj, MAT_LEAF_LIGHT),
        MAT_FOOD_ORANGE: ensure_material_slot(obj, MAT_FOOD_ORANGE),
        MAT_FOOD_CARAMEL: ensure_material_slot(obj, MAT_FOOD_CARAMEL),
        MAT_FOOD_SAUCE: ensure_material_slot(obj, MAT_FOOD_SAUCE),
        MAT_FOOD_GREEN: ensure_material_slot(obj, MAT_FOOD_GREEN),
        MAT_FOOD_RICE: ensure_material_slot(obj, MAT_FOOD_RICE),
        MAT_PLATE: ensure_material_slot(obj, MAT_PLATE),
    }

    base_idx = material_indices[MAT_COUNTER]
    wood_idx = material_indices[MAT_WOOD]
    for poly in mesh.polygons:
        center = obj.matrix_world @ poly.center
        # Reset the baked/white Tripo texture look into a warm toy base. Low structural
        # pieces get honey wood, while counters/signs stay cream and matte.
        poly.material_index = wood_idx if center.z < 0.16 else base_idx

    faces_to_delete = set()
    recolored_food = 0
    recolored_leaf = 0
    for component in components:
        dims = component["dims"]
        max_xy = max(dims.x, dims.y)
        min_xy = min(dims.x, dims.y)
        possible_canopy = (
            0.055 < max_xy < 0.62
            and 0.018 < min_xy < 0.32
            and 0.002 < dims.z < 0.095
            and len(component["polys"]) > 60
        )
        possible_food = max(dims.x, dims.y, dims.z) <= 0.12 and dims.z <= 0.06
        if not (possible_canopy or possible_food):
            continue
        color = component_average_color(obj, component, image)
        if is_white_canopy_component(component, color):
            # Remove the largest bright oval canopies. Small uncertain components are
            # softened into foliage instead of deleted to protect plates and food.
            if len(component["polys"]) > 600:
                faces_to_delete.update(component["polys"])
            else:
                for pi in component["polys"]:
                    mesh.polygons[pi].material_index = material_indices[MAT_LEAF]
                recolored_leaf += 1
            continue
        food_material = classify_food_material(color, component)
        if food_material:
            for pi in component["polys"]:
                mesh.polygons[pi].material_index = material_indices[food_material]
            recolored_food += 1

    # Keep geometry intact for stability. Bright canopy-like islands are pushed into
    # foliage materials instead of deleting faces from the merged Tripo mesh.
    for pi in faces_to_delete:
        if pi < len(mesh.polygons):
            mesh.polygons[pi].material_index = material_indices[MAT_LEAF]
    mesh.update()
    print(f"MERGED_MESH_REFINED softened_canopy_faces={len(faces_to_delete)} recolored_food={recolored_food} recolored_leaf={recolored_leaf} components={len(components)}")


def bounds():
    meshes = [o for o in bpy.context.scene.objects if o.type == "MESH"]
    mins = Vector((1e9, 1e9, 1e9))
    maxs = Vector((-1e9, -1e9, -1e9))
    for obj in meshes:
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


def delete_previous_style_helpers():
    for obj in list(bpy.context.scene.objects):
        if obj.name.startswith(("warm ", "cream ", "thin floor", "back ", "left ", "large sun", "window ", "small warm", "matte plant", "chunky toy", "afternoon sun", "huge soft", "diorama render", "printed stall label")):
            bpy.data.objects.remove(obj, do_unlink=True)


def remove_white_tree_canopies():
    removed = 0
    for obj in list(bpy.context.scene.objects):
        if obj.type != "MESH":
            continue
        lname = obj.name.lower()
        if lname.startswith(("warm ", "cream ", "thin floor", "back ", "left ", "large sun", "window ", "small warm", "matte plant", "chunky toy")):
            continue
        dims = sorted(world_dimensions(obj))
        color = material_color(obj)
        if not color:
            color = (1, 1, 1, 1)
        light = color[0] > 0.62 and color[1] > 0.60 and color[2] > 0.54
        flattened = dims[0] < 0.115 and dims[2] < 0.68
        xdim, ydim, zdim = world_dimensions(obj)
        horizontal_oval = (
            light
            and zdim < 0.09
            and 0.11 < max(xdim, ydim) < 0.72
            and 0.035 < min(xdim, ydim) < 0.28
            and obj.location.z > 0.03
        )
        bundled_oval_tree = (
            light
            and 0.12 < max(xdim, ydim) < 0.86
            and 0.055 < min(xdim, ydim) < 0.36
            and 0.08 < zdim < 0.72
            and obj.location.z > 0.025
        )
        canopy_named = any(token in lname for token in ("canopy", "crown", "leaf", "foliage", "tree"))
        suspicious_blob = flattened and dims[1] > 0.045 and obj.location.z > 0.04
        if canopy_named or suspicious_blob or horizontal_oval or bundled_oval_tree:
            bpy.data.objects.remove(obj, do_unlink=True)
            removed += 1
    print(f"REMOVED_WHITE_CANOPIES={removed}")


def soften_model_materials():
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        lname = obj.name.lower()
        for slot in obj.material_slots:
            material = slot.material
            if not material:
                continue
            material.use_nodes = True
            bsdf = material.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                unlink_base_color_texture(material)
                bsdf.inputs["Metallic"].default_value = 0
                bsdf.inputs["Roughness"].default_value = max(0.82, bsdf.inputs["Roughness"].default_value)
                color = bsdf.inputs["Base Color"].default_value
                if color[0] > 0.86 and color[1] > 0.82 and color[2] > 0.76:
                    bsdf.inputs["Base Color"].default_value = (0.78, 0.68, 0.52, color[3])
                elif color[0] > 0.72 and color[1] > 0.50 and color[2] < 0.38:
                    bsdf.inputs["Base Color"].default_value = (0.80, 0.52, 0.27, color[3])
        if "plant" in lname or "leaf" in lname or "tree" in lname:
            obj.data.materials.clear()
            obj.data.materials.append(MAT_LEAF)
        if "table" in lname or "chair" in lname or "seat" in lname:
            obj.data.materials.clear()
            obj.data.materials.append(MAT_WOOD)
        if not any(m.type == "BEVEL" for m in obj.modifiers):
            bevel = obj.modifiers.new("tiny toy bevel", "BEVEL")
            bevel.width = 0.012
            bevel.segments = 3
            obj.modifiers.new("weighted toy normals", "WEIGHTED_NORMAL")


def add_printed_labels(mins, maxs, floor_z, camera):
    try:
        font = bpy.data.fonts.load(str(FONT_PATH)) if FONT_PATH.exists() else None
    except Exception:
        font = None

    source_min_x, source_max_x = -11.4, 8.9
    source_min_y, source_max_y = -5.45, 3.85
    model_width = maxs.x - mins.x
    model_depth = maxs.y - mins.y

    def map_x(value):
        t = (value - source_min_x) / (source_max_x - source_min_x)
        return mins.x + model_width * t

    def map_y(value):
        t = (value - source_min_y) / (source_max_y - source_min_y)
        return mins.y + model_depth * t

    for name, sx, sy, sw in STALL_LABELS:
        bpy.ops.object.text_add(location=(map_x(sx), map_y(sy), floor_z + 0.48))
        obj = bpy.context.object
        obj.name = f"printed stall label {name}"
        obj.data.body = name
        obj.data.align_x = "CENTER"
        obj.data.align_y = "CENTER"
        obj.data.size = max(0.014, min(0.034, 0.26 / max(len(name), 4)))
        obj.data.extrude = 0.0
        obj.data.space_character = 1.0
        if font:
            obj.data.font = font
        obj.data.materials.clear()
        obj.data.materials.append(MAT_TEXT)
        face_camera(obj, camera)
        for item in bpy.context.scene.objects:
            item.select_set(False)
        bpy.context.view_layer.objects.active = obj
        obj.select_set(True)
        bpy.ops.object.convert(target="MESH")
        mesh_label = bpy.context.object
        mesh_label.name = f"printed stall label mesh {name}"
        mesh_label.data.materials.clear()
        mesh_label.data.materials.append(MAT_TEXT)
        mesh_label.select_set(False)


def build_environment():
    mins, maxs = bounds()
    cx, cy = (mins.x + maxs.x) / 2, (mins.y + maxs.y) / 2
    width = max(maxs.x - mins.x, 1.8) + 0.45
    depth = max(maxs.y - mins.y, 1.25) + 0.45
    floor_z = mins.z - 0.05
    back_y = mins.y - 0.85
    left_x = mins.x - 0.85

    cube("warm diorama base slab", (cx, cy, floor_z - 0.08), (width, depth, 0.16), MAT_FLOOR, 0.08)
    cube("cream ceramic floor surface", (cx, cy, floor_z + 0.01), (width - 0.25, depth - 0.25, 0.025), MAT_TILE, 0.035)

    tile = 0.20
    for i in range(int(width / tile) + 1):
        x = cx - width / 2 + i * tile
        cube("thin floor grout x", (x, cy, floor_z + 0.035), (0.006, depth - 0.28, 0.012), MAT_GROUT, 0)
    for j in range(int(depth / tile) + 1):
        y = cy - depth / 2 + j * tile
        cube("thin floor grout y", (cx, y, floor_z + 0.037), (width - 0.28, 0.006, 0.012), MAT_GROUT, 0)

    wall_height = max(maxs.z - mins.z + 0.85, 1.55)
    cube("back warm matte wall", (cx, back_y, floor_z + wall_height / 2), (width, 0.18, wall_height), MAT_WALL, 0.045)
    cube("back ceramic tile wainscot", (cx, back_y + 0.1, floor_z + 0.64), (width - 0.25, 0.08, 1.05), MAT_TILE, 0.025)
    cube("back pale wood panel band", (cx, back_y + 0.11, floor_z + 1.82), (width - 0.3, 0.075, 1.18), MAT_PANEL, 0.025)
    cube("left warm matte wall", (left_x, cy, floor_z + wall_height / 2), (0.18, depth, wall_height), MAT_WALL, 0.045)
    cube("left pale wood panel band", (left_x + 0.11, cy, floor_z + 1.82), (0.075, depth - 0.3, 1.18), MAT_PANEL, 0.025)

    window_z = floor_z + wall_height * 0.68
    window_h = wall_height * 0.34
    window_w = depth * 0.18
    for y in [cy - depth * 0.28, cy - depth * 0.05, cy + depth * 0.18]:
        cube("large sun window frame", (left_x + 0.13, y, window_z), (0.07, window_w * 1.22, window_h * 1.15), MAT_COUNTER, 0.025)
        cube("large sun window glass", (left_x + 0.17, y, window_z), (0.035, window_w, window_h), MAT_GLASS, 0.02)
        cube("window cross bar v", (left_x + 0.2, y, window_z), (0.04, 0.018, window_h), MAT_COUNTER, 0.01)
        cube("window cross bar h", (left_x + 0.2, y, window_z), (0.04, window_w, 0.018), MAT_COUNTER, 0.01)

    for x in [cx - width * 0.36, cx - width * 0.18, cx, cx + width * 0.18, cx + width * 0.36]:
        cube("warm wall lantern", (x, back_y + 0.14, floor_z + wall_height * 0.74), (0.18, 0.06, 0.26), MAT_LIGHT, 0.035)
        bpy.ops.object.light_add(type="POINT", location=(x, back_y + 0.36, floor_z + wall_height * 0.72))
        lamp = bpy.context.object
        lamp.name = "small warm wall light"
        lamp.data.energy = 120
        lamp.data.color = (1.0, 0.68, 0.34)
        lamp.data.shadow_soft_size = 1.9

    for x in [mins.x + 0.35, cx - 0.45, cx + 0.55, maxs.x - 0.35]:
        for y in [mins.y + 0.35, cy + 0.18]:
            cylinder("matte plant pot", (x, y, floor_z + 0.07), 0.035, 0.085, MAT_PANEL)
            for angle in range(0, 360, 60):
                rad = math.radians(angle)
                sphere("chunky toy plant leaf", (x + math.cos(rad) * 0.05, y + math.sin(rad) * 0.05, floor_z + 0.15), 0.038, MAT_LEAF, (1.0, 0.55, 0.32))

    bpy.ops.object.light_add(type="SUN", location=(left_x - 3.5, cy + 1.2, floor_z + 6.2))
    sun = bpy.context.object
    sun.name = "afternoon sun from left windows"
    sun.rotation_euler = (math.radians(42), 0, math.radians(-34))
    sun.data.energy = 3.2
    sun.data.angle = math.radians(7)
    sun.data.color = (1.0, 0.82, 0.58)

    bpy.ops.object.light_add(type="AREA", location=(left_x - 1.4, cy - 1.0, floor_z + 3.4))
    area = bpy.context.object
    area.name = "huge soft window fill"
    area.data.energy = 650
    area.data.size = 5.2
    area.data.color = (1.0, 0.82, 0.55)

    # Keep the current spatial layout, but render from the open/front side so the new walls
    # read as a warm backdrop instead of blocking the model.
    camera_loc = (cx + width * 0.48, cy + depth * 0.86, floor_z + max(width, depth) * 0.56)
    camera_target = (cx, cy + depth * 0.18, floor_z + 0.38)
    bpy.ops.object.camera_add(location=camera_loc)
    camera = bpy.context.object
    camera.name = "diorama render camera"
    look_at(camera, camera_target)
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = max(width, depth) * 0.46
    bpy.context.scene.camera = camera
    # The source model already contains physical sign plates. Avoid floating screen-facing
    # labels in the render; clean printed text should be authored on the final sign meshes.


def set_render():
    scene = bpy.context.scene
    for engine in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = engine
            break
        except TypeError:
            continue
    if hasattr(scene, "eevee") and hasattr(scene.eevee, "taa_render_samples"):
        scene.eevee.taa_render_samples = 64
    scene.world = scene.world or bpy.data.worlds.new("World")
    scene.world.color = (0.98, 0.89, 0.75)
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium High Contrast"
    scene.view_settings.exposure = 0.10
    scene.view_settings.gamma = 1.0
    scene.render.resolution_x = 1792
    scene.render.resolution_y = 1024
    scene.render.film_transparent = False
    scene.render.filepath = str(RENDER)


delete_previous_style_helpers()
remove_white_tree_canopies()
soften_model_materials()
refine_merged_tripo_mesh()
build_environment()
set_render()
bpy.ops.wm.save_as_mainfile(filepath=str(STYLED))
bpy.ops.render.render(write_still=True)
print(f"STYLED_BLEND={STYLED}")
print(f"RENDER_PNG={RENDER}")
if os.environ.get("BLENDER_QUIT_AFTER_SCRIPT") == "1":
    bpy.ops.wm.quit_blender()
