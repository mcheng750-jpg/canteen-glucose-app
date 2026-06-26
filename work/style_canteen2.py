import math
import os
from pathlib import Path

import bpy
from mathutils import Vector


ROOT = Path("/Users/momo/Documents/Codex/2026-06-18/files-mentioned-by-the-user-mp4")
SOURCE = Path("/Users/momo/Documents/Codex/blender-mcp-output/output/食堂2.blend")
OUT_DIR = ROOT / "outputs"
OUT_BLEND = OUT_DIR / "食堂2_styled.blend"
OUT_PNG = OUT_DIR / "食堂2_styled.png"


def mat(name, color, roughness=0.82, emission=None, strength=0.0):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = 0
        if emission and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = strength
    return material


CREAM = mat("matte cream counter", (0.94, 0.88, 0.78, 1), 0.9)
TILE = mat("warm beige ceramic tile", (0.78, 0.64, 0.44, 1), 0.88)
GROUT = mat("soft tile grout", (0.56, 0.44, 0.30, 1), 0.92)
WOOD = mat("honey wood matte", (0.82, 0.55, 0.28, 1), 0.86)
WALL = mat("cream plaster wall", (0.92, 0.82, 0.65, 1), 0.9)
SIGN = mat("flat warm sign face", (0.86, 0.83, 0.76, 1), 0.88)
GREEN_SIGN = mat("sage low glucose sign", (0.68, 0.78, 0.55, 1), 0.88)
YELLOW_SIGN = mat("warm yellow glucose sign", (0.88, 0.67, 0.25, 1), 0.88)
RED_SIGN = mat("soft coral glucose sign", (0.80, 0.38, 0.30, 1), 0.88)
TEXT_MAT = mat("printed dark sign text", (0.055, 0.052, 0.045, 1), 0.92)
LAMP_MAT = mat("warm lantern glow", (1.0, 0.75, 0.36, 1), 0.55, (1.0, 0.55, 0.18, 1), 1.5)
PLANT = mat("matte plant green", (0.20, 0.40, 0.15, 1), 0.88)
FOOD_ORANGE = mat("toy food warm orange", (0.95, 0.45, 0.10, 1), 0.72)
FOOD_DARK = mat("toy sauce dark caramel", (0.28, 0.12, 0.045, 1), 0.76)


STALLS = [
    ("老碗会", -4.6, -5.0, 2.2, "gray"),
    ("衡阳鱼粉", 0.0, -5.0, 2.2, "gray"),
    ("湘遇湖南衡东土菜馆子", 5.2, -5.0, 4.0, "gray"),
    ("客家腌面", -6.6, -2.6, 1.8, "gray"),
    ("鲜湘下饭菜", -4.7, -2.6, 2.0, "gray"),
    ("德优选品", -2.7, -2.6, 2.0, "green"),
    ("壹品炖", -0.7, -2.6, 1.8, "green"),
    ("拌饭屋", 1.2, -2.6, 1.8, "yellow"),
    ("阿福烧腊", 3.0, -2.6, 1.8, "yellow"),
    ("三及第酸汤肥牛", 5.0, -2.6, 2.2, "gray"),
    ("三及第酸汤肥牛", 7.2, -2.6, 2.2, "gray"),
    ("尝来尝往", 9.2, -2.6, 1.8, "gray"),
    ("肯德基", -7.9, -0.4, 1.8, "gray"),
    ("关东灶", -6.0, -0.4, 1.9, "red"),
    ("小碗蒸鲜", -4.0, -0.4, 2.0, "green"),
    ("鲜炒小碗菜", -1.9, -0.4, 2.0, "gray"),
    ("盖浇饭", 0.2, -0.4, 1.6, "gray"),
    ("好怡", 1.7, -0.4, 1.4, "gray"),
    ("万和潮记", 3.2, -0.4, 1.7, "gray"),
    ("日式牛肉盖饭", 5.1, -0.4, 2.1, "gray"),
    ("重庆小面", 7.2, -0.4, 1.8, "gray"),
    ("扒知味", 9.0, -0.4, 1.7, "gray"),
    ("东旭", -3.8, 2.1, 5.6, "yellow"),
    ("广味三宝", 3.9, 2.5, 6.4, "green"),
]


def cube(name, loc, scale, material):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    bevel = obj.modifiers.new("large soft bevel", "BEVEL")
    bevel.width = min(scale) * 0.18
    bevel.segments = 8
    obj.modifiers.new("soft toy normals", "WEIGHTED_NORMAL")
    return obj


def add_text(name, text, loc, size=0.28):
    bpy.ops.object.text_add(location=loc, rotation=(math.radians(70), 0, 0))
    obj = bpy.context.object
    obj.name = name
    obj.data.body = text
    obj.data.align_x = "CENTER"
    obj.data.align_y = "CENTER"
    obj.data.size = size
    obj.data.extrude = 0.002
    obj.data.materials.append(TEXT_MAT)
    return obj


def add_floor_and_walls():
    cube("clean warm tile floor slab", (0, 0, -0.08), (18.5, 11.8, 0.12), TILE)
    for x in [i * 0.9 - 9 for i in range(21)]:
        cube("thin vertical grout", (x, 0, 0.006), (0.018, 11.6, 0.012), GROUT)
    for y in [i * 0.9 - 5.4 for i in range(14)]:
        cube("thin horizontal grout", (0, y, 0.008), (18.4, 0.018, 0.012), GROUT)

    cube("back cream wall", (0, -5.85, 1.85), (18.7, 0.18, 3.7), WALL)
    cube("back honey wood wainscot", (0, -5.72, 0.98), (18.5, 0.2, 1.52), WOOD)
    cube("left cream wall", (-9.25, 0, 1.7), (0.18, 11.8, 3.4), WALL)
    cube("left honey wood wainscot", (-9.12, 0, 0.88), (0.2, 11.6, 1.4), WOOD)

    for x in [i * 1.15 - 8.1 for i in range(15)]:
        cube("wood panel seam", (x, -5.59, 1.05), (0.025, 0.055, 1.25), GROUT)
    for y in [i * 1.2 - 4.8 for i in range(9)]:
        cube("left wood panel seam", (-9.0, y, 0.98), (0.055, 0.025, 1.18), GROUT)

    for y in [-4.0, -2.0, 0.0]:
        cube("left bright window frame", (-9.0, y, 2.25), (0.09, 1.15, 1.25), CREAM)
        cube("left bright window glass", (-8.95, y, 2.25), (0.035, 0.95, 1.0), mat("soft blue window glass", (0.74, 0.88, 0.86, 0.48), 0.55))


def add_lighting():
    bpy.ops.object.light_add(type="SUN", location=(-5, -4, 7))
    sun = bpy.context.object
    sun.name = "warm afternoon sun"
    sun.data.energy = 2.5
    sun.data.angle = math.radians(9)
    sun.rotation_euler = (math.radians(42), 0, math.radians(-32))

    bpy.ops.object.light_add(type="AREA", location=(-6.8, -3.0, 4.2), rotation=(math.radians(63), 0, math.radians(-38)))
    area = bpy.context.object
    area.name = "large soft left window light"
    area.data.energy = 650
    area.data.size = 5.5
    area.data.color = (1.0, 0.82, 0.58)

    for x in [-7.3, -4.6, -1.8, 1.0, 3.8, 6.6, 8.2]:
        cube("warm wall lantern", (x, -5.46, 2.55), (0.28, 0.09, 0.42), LAMP_MAT)
        bpy.ops.object.light_add(type="POINT", location=(x, -5.28, 2.45))
        lamp = bpy.context.object
        lamp.name = "small warm lantern light"
        lamp.data.energy = 75
        lamp.data.color = (1.0, 0.62, 0.27)
        lamp.data.shadow_soft_size = 2.0


def sign_material(kind):
    return {"green": GREEN_SIGN, "yellow": YELLOW_SIGN, "red": RED_SIGN}.get(kind, SIGN)


def add_signs_and_clean_faces():
    for name, x, y, width, kind in STALLS:
        sign_z = 1.48 if y < 2 else 1.2
        face = cube(f"printed flat sign - {name}", (x, y - 0.18, sign_z), (width, 0.12, 0.55), sign_material(kind))
        face.rotation_euler[0] = 0
        add_text(f"printed text - {name}", name, (x, y - 0.255, sign_z + 0.02), size=max(0.16, min(0.32, width / max(len(name), 4) * 0.72)))
        cube(f"cream counter face - {name}", (x, y + 0.08, 0.58), (width * 0.96, 0.78, 0.42), CREAM)
        cube(f"honey counter base - {name}", (x, y + 0.08, 0.25), (width * 0.96, 0.78, 0.28), WOOD)

        for i in range(max(3, min(8, int(width * 1.2)))):
            px = x - width * 0.36 + i * (width * 0.72 / max(1, max(3, min(8, int(width * 1.2))) - 1))
            cube("toy food tray", (px, y + 0.02, 0.85), (0.34, 0.22, 0.035), CREAM)
            bpy.ops.mesh.primitive_uv_sphere_add(segments=16, ring_count=8, radius=0.075, location=(px - 0.055, y, 0.91))
            food = bpy.context.object
            food.name = "warm orange toy food"
            food.scale.z = 0.55
            food.data.materials.append(FOOD_ORANGE if i % 3 else FOOD_DARK)
            bpy.ops.mesh.primitive_uv_sphere_add(segments=12, ring_count=6, radius=0.045, location=(px + 0.07, y + 0.05, 0.91))
            veg = bpy.context.object
            veg.name = "small green vegetable"
            veg.scale.z = 0.45
            veg.data.materials.append(PLANT)


def add_seating_and_plants():
    for x, y in [(-6.8, 4.2), (-4.2, 4.7), (-1.4, 4.4), (1.5, 4.8), (4.3, 4.5), (7.0, 4.2)]:
        cube("chunky rounded table", (x, y, 0.48), (0.9, 0.9, 0.18), WOOD)
        for dx, dy in [(-0.62, 0), (0.62, 0), (0, -0.62), (0, 0.62)]:
            cube("chunky stool", (x + dx, y + dy, 0.25), (0.36, 0.36, 0.22), WOOD)
        bpy.ops.mesh.primitive_uv_sphere_add(segments=14, ring_count=8, radius=0.13, location=(x, y, 0.65))
        plant = bpy.context.object
        plant.name = "table potted plant leaves"
        plant.scale.z = 0.55
        plant.data.materials.append(PLANT)

    cube("front planter base", (0, 5.55, 0.22), (17.2, 0.48, 0.32), CREAM)
    for i in range(46):
        x = -8.2 + i * 0.36
        bpy.ops.mesh.primitive_uv_sphere_add(segments=10, ring_count=6, radius=0.16, location=(x, 5.52 + (i % 3) * 0.04, 0.52))
        plant = bpy.context.object
        plant.name = "front green plant cluster"
        plant.scale.z = 0.55
        plant.data.materials.append(PLANT)


def tune_existing_materials():
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        obj.select_set(True)
        for material in obj.data.materials:
            if not material:
                continue
            material.use_nodes = True
            bsdf = material.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Roughness"].default_value = 0.86
                bsdf.inputs["Metallic"].default_value = 0
        obj.select_set(False)


def set_camera_and_render():
    bpy.ops.object.camera_add(location=(0, 8.8, 8.8), rotation=(math.radians(58), 0, math.radians(180)))
    bpy.context.scene.camera = bpy.context.object
    bpy.context.object.name = "reference isometric camera"

    bpy.context.scene.render.engine = "CYCLES"
    bpy.context.scene.cycles.samples = 64
    bpy.context.scene.view_settings.view_transform = "Filmic"
    bpy.context.scene.view_settings.look = "Medium High Contrast"
    bpy.context.scene.view_settings.exposure = 0.35
    bpy.context.scene.view_settings.gamma = 1
    bpy.context.scene.render.resolution_x = 1800
    bpy.context.scene.render.resolution_y = 1080
    bpy.context.scene.render.film_transparent = False
    bpy.context.scene.world.color = (0.98, 0.90, 0.78)
    bpy.context.scene.render.filepath = str(OUT_PNG)


def main():
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    tune_existing_materials()
    add_floor_and_walls()
    add_signs_and_clean_faces()
    add_seating_and_plants()
    add_lighting()
    set_camera_and_render()
    bpy.ops.wm.save_as_mainfile(filepath=str(OUT_BLEND))
    bpy.ops.render.render(write_still=True)


if __name__ == "__main__":
    main()
