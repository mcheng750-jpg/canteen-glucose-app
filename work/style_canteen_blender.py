import math
import sys
from pathlib import Path

import bpy
from mathutils import Vector


SOURCE = Path("/Users/momo/Documents/Codex/blender-mcp-output/output/model_2026-06-23T12-15-28.blend")
STYLED = Path("/Users/momo/Documents/Codex/blender-mcp-output/output/canteen_styled_warm.blend")
RENDER = Path("/Users/momo/Documents/Codex/blender-mcp-output/output/canteen_styled_warm.png")


def mat(name, color, roughness=0.82, emission=None, strength=0.0):
    material = bpy.data.materials.get(name) or bpy.data.materials.new(name)
    material.use_nodes = True
    nodes = material.node_tree.nodes
    bsdf = nodes.get("Principled BSDF")
    if bsdf:
        bsdf.inputs["Base Color"].default_value = color
        bsdf.inputs["Roughness"].default_value = roughness
        bsdf.inputs["Metallic"].default_value = 0.0
        if emission and "Emission Color" in bsdf.inputs:
            bsdf.inputs["Emission Color"].default_value = emission
            bsdf.inputs["Emission Strength"].default_value = strength
    return material


MAT_FLOOR = mat("warm beige ceramic tile - matte", (0.82, 0.68, 0.47, 1), 0.9)
MAT_TILE = mat("soft cream floor tile - matte", (0.93, 0.84, 0.68, 1), 0.92)
MAT_GROUT = mat("soft caramel tile grout", (0.58, 0.43, 0.26, 1), 0.95)
MAT_WALL = mat("warm tan wall - matte", (0.78, 0.58, 0.34, 1), 0.88)
MAT_PANEL = mat("pale toy wood wall panel", (0.86, 0.64, 0.38, 1), 0.86)
MAT_COUNTER = mat("cream toy counter matte", (0.94, 0.89, 0.78, 1), 0.88)
MAT_WOOD = mat("honey toy wood matte", (0.82, 0.56, 0.28, 1), 0.84)
MAT_LEAF = mat("soft olive leaves matte", (0.30, 0.48, 0.20, 1), 0.9)
MAT_LIGHT = mat("warm lantern glow", (1.0, 0.74, 0.34, 1), 0.55, (1.0, 0.58, 0.18, 1), 1.35)
MAT_WINDOW = mat("milky sunlit glass", (0.70, 0.90, 0.95, 0.36), 0.55, (0.76, 0.92, 0.92, 1), 0.18)


def cube(name, loc, scale, material, bevel=0.0):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.dimensions = scale
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)
    if material:
        obj.data.materials.append(material)
    if bevel:
        mod = obj.modifiers.new("toy rounded bevel", "BEVEL")
        mod.width = bevel
        mod.segments = 8
        mod.affect = "EDGES"
        obj.modifiers.new("soft toy normals", "WEIGHTED_NORMAL")
    return obj


def cylinder(name, loc, radius, depth, material, vertices=32, bevel=False):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=loc)
    obj = bpy.context.object
    obj.name = name
    if material:
        obj.data.materials.append(material)
    if bevel:
        mod = obj.modifiers.new("rounded rim", "BEVEL")
        mod.width = radius * 0.08
        mod.segments = 5
        obj.modifiers.new("soft normals", "WEIGHTED_NORMAL")
    return obj


def sphere(name, loc, radius, material, scale=(1, 1, 1)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=24, ring_count=12, radius=radius, location=loc)
    obj = bpy.context.object
    obj.name = name
    obj.scale = scale
    if material:
        obj.data.materials.append(material)
    return obj


def scene_bounds():
    meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
    if not meshes:
        return Vector((-6, -4, 0)), Vector((6, 4, 3))
    mins = Vector((1e9, 1e9, 1e9))
    maxs = Vector((-1e9, -1e9, -1e9))
    for obj in meshes:
        for corner in obj.bound_box:
            world = obj.matrix_world @ Vector(corner)
            mins.x = min(mins.x, world.x)
            mins.y = min(mins.y, world.y)
            mins.z = min(mins.z, world.z)
            maxs.x = max(maxs.x, world.x)
            maxs.y = max(maxs.y, world.y)
            maxs.z = max(maxs.z, world.z)
    return mins, maxs


def soften_existing_model():
    for obj in bpy.context.scene.objects:
        if obj.type != "MESH":
            continue
        obj.select_set(False)
        name = obj.name.lower()
        if not obj.data.materials:
            obj.data.materials.append(MAT_COUNTER)
        for slot in obj.material_slots:
            material = slot.material
            if not material:
                continue
            material.use_nodes = True
            bsdf = material.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Metallic"].default_value = 0.0
                bsdf.inputs["Roughness"].default_value = 0.82
                color = bsdf.inputs["Base Color"].default_value
                # Keep imported colors, but nudge white plastic away from pure white.
                if color[0] > 0.88 and color[1] > 0.85 and color[2] > 0.78:
                    bsdf.inputs["Base Color"].default_value = (0.94, 0.89, 0.78, color[3])
        if "leaf" in name or "plant" in name or "tree" in name:
            obj.data.materials.clear()
            obj.data.materials.append(MAT_LEAF)
        if "table" in name or "chair" in name or "seat" in name:
            obj.data.materials.clear()
            obj.data.materials.append(MAT_WOOD)
        if "counter" in name or "stall" in name or "sign" in name:
            if obj.data.materials:
                obj.data.materials[0] = MAT_COUNTER
        if not any(mod.type == "BEVEL" for mod in obj.modifiers):
            bevel = obj.modifiers.new("micro toy bevel", "BEVEL")
            bevel.width = 0.015
            bevel.segments = 3
            bevel.affect = "EDGES"
            obj.modifiers.new("soft weighted normals", "WEIGHTED_NORMAL")


def add_environment():
    mins, maxs = scene_bounds()
    cx = (mins.x + maxs.x) / 2
    cy = (mins.y + maxs.y) / 2
    width = max(maxs.x - mins.x, 10) + 3.0
    depth = max(maxs.y - mins.y, 7) + 3.0
    floor_z = mins.z - 0.05
    back_y = mins.y - 0.85
    left_x = mins.x - 0.85

    cube("warm diorama base slab", (cx, cy, floor_z - 0.08), (width, depth, 0.16), MAT_FLOOR, 0.08)
    cube("cream ceramic tile surface", (cx, cy, floor_z + 0.005), (width - 0.25, depth - 0.25, 0.025), MAT_TILE, 0.035)

    tile = 0.72
    x_count = int(width / tile)
    y_count = int(depth / tile)
    for i in range(x_count + 1):
        x = cx - width / 2 + i * tile
        cube("thin floor grout x", (x, cy, floor_z + 0.028), (0.012, depth - 0.35, 0.014), MAT_GROUT, 0)
    for j in range(y_count + 1):
        y = cy - depth / 2 + j * tile
        cube("thin floor grout y", (cx, y, floor_z + 0.03), (width - 0.35, 0.012, 0.014), MAT_GROUT, 0)

    wall_height = 3.1
    cube("back warm wall", (cx, back_y, floor_z + wall_height / 2), (width, 0.18, wall_height), MAT_WALL, 0.045)
    cube("back ceramic wainscot", (cx, back_y + 0.095, floor_z + 0.66), (width - 0.25, 0.08, 1.05), MAT_TILE, 0.025)
    cube("back pale wood panel", (cx, back_y + 0.105, floor_z + 1.78), (width - 0.3, 0.075, 1.15), MAT_PANEL, 0.025)
    cube("left sun wall", (left_x, cy, floor_z + wall_height / 2), (0.18, depth, wall_height), MAT_WALL, 0.045)
    cube("left pale wood panel", (left_x + 0.105, cy, floor_z + 1.78), (0.075, depth - 0.3, 1.15), MAT_PANEL, 0.025)

    for idx, y in enumerate([cy - depth * 0.30, cy - depth * 0.08, cy + depth * 0.14]):
        cube("large sun window frame", (left_x + 0.13, y, floor_z + 2.15), (0.07, 1.25, 1.25), MAT_COUNTER, 0.025)
        cube("large sun window glass", (left_x + 0.17, y, floor_z + 2.15), (0.035, 1.02, 1.02), MAT_WINDOW, 0.02)
        cube("window cross bar v", (left_x + 0.195, y, floor_z + 2.15), (0.04, 0.035, 1.02), MAT_COUNTER, 0.01)
        cube("window cross bar h", (left_x + 0.2, y, floor_z + 2.15), (0.04, 1.02, 0.035), MAT_COUNTER, 0.01)

    for x in [cx - width * 0.36, cx - width * 0.18, cx, cx + width * 0.18, cx + width * 0.36]:
        cube("warm wall lantern", (x, back_y + 0.14, floor_z + 2.32), (0.28, 0.08, 0.42), MAT_LIGHT, 0.05)
        bpy.ops.object.light_add(type="POINT", location=(x, back_y + 0.34, floor_z + 2.25))
        lamp = bpy.context.object
        lamp.name = "small warm wall light"
        lamp.data.energy = 95
        lamp.data.color = (1.0, 0.68, 0.34)
        lamp.data.shadow_soft_size = 1.8

    for x in [mins.x + 0.7, cx - 1.2, cx + 1.6, maxs.x - 0.7]:
        for y in [mins.y + 0.7, cy + 0.4]:
            cylinder("matte plant pot", (x, y, floor_z + 0.18), 0.12, 0.28, MAT_PANEL, 20, True)
            for angle in range(0, 360, 60):
                rad = math.radians(angle)
                sphere(
                    "chunky toy plant leaf",
                    (x + math.cos(rad) * 0.16, y + math.sin(rad) * 0.16, floor_z + 0.42),
                    0.12,
                    MAT_LEAF,
                    (1.0, 0.55, 0.32),
                )

    bpy.ops.object.light_add(type="SUN", location=(left_x - 3.5, cy + 1.2, floor_z + 6.2))
    sun = bpy.context.object
    sun.name = "afternoon sun from left windows"
    sun.rotation_euler = (math.radians(42), 0, math.radians(-34))
    sun.data.energy = 2.8
    sun.data.angle = math.radians(7)
    sun.data.color = (1.0, 0.82, 0.58)

    bpy.ops.object.light_add(type="AREA", location=(left_x - 1.4, cy - 1.0, floor_z + 3.3))
    area = bpy.context.object
    area.name = "huge soft window fill"
    area.data.energy = 520
    area.data.size = 5.0
    area.data.color = (1.0, 0.82, 0.55)

    bpy.ops.object.camera_add(location=(cx + width * 0.05, cy + depth * 0.82, floor_z + 6.2), rotation=(math.radians(61), 0, math.radians(180)))
    camera = bpy.context.object
    camera.name = "warm diorama render camera"
    camera.data.type = "ORTHO"
    camera.data.ortho_scale = max(width, depth) * 0.86
    bpy.context.scene.camera = camera


def render_settings():
    scene = bpy.context.scene
    scene.render.engine = "BLENDER_EEVEE_NEXT"
    scene.eevee.taa_render_samples = 64
    scene.world = scene.world or bpy.data.worlds.new("World")
    scene.world.color = (0.98, 0.89, 0.75)
    scene.view_settings.view_transform = "Filmic"
    scene.view_settings.look = "Medium High Contrast"
    scene.view_settings.exposure = 0.45
    scene.view_settings.gamma = 1.0
    scene.render.resolution_x = 1792
    scene.render.resolution_y = 1024
    scene.render.film_transparent = False
    scene.render.filepath = str(RENDER)


def main():
    bpy.ops.wm.open_mainfile(filepath=str(SOURCE))
    soften_existing_model()
    add_environment()
    render_settings()
    STYLED.parent.mkdir(parents=True, exist_ok=True)
    bpy.ops.wm.save_as_mainfile(filepath=str(STYLED))
    bpy.ops.render.render(write_still=True)
    print(f"STYLED_BLEND={STYLED}")
    print(f"RENDER_PNG={RENDER}")


if __name__ == "__main__":
    main()
