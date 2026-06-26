import bpy

scene_path = "/Users/momo/食堂模型.blend"
bpy.ops.wm.open_mainfile(filepath=scene_path)

meshes = [obj for obj in bpy.context.scene.objects if obj.type == "MESH"]
mins = [float("inf"), float("inf"), float("inf")]
maxs = [float("-inf"), float("-inf"), float("-inf")]

for obj in meshes:
    for corner in obj.bound_box:
        world = obj.matrix_world @ __import__("mathutils").Vector(corner)
        for axis in range(3):
            mins[axis] = min(mins[axis], world[axis])
            maxs[axis] = max(maxs[axis], world[axis])

print("OBJECT_COUNT", len(bpy.context.scene.objects))
print("MESH_COUNT", len(meshes))
print("BOUNDS_MIN", [round(v, 3) for v in mins])
print("BOUNDS_MAX", [round(v, 3) for v in maxs])
print("BOUNDS_SIZE", [round(maxs[i] - mins[i], 3) for i in range(3)])
print("OBJECTS", [obj.name for obj in bpy.context.scene.objects[:20]])
