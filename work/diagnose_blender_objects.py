import json
from pathlib import Path

import bpy


def color_of(obj):
    for slot in obj.material_slots:
        material = slot.material
        if not material:
            continue
        material.use_nodes = True
        bsdf = material.node_tree.nodes.get("Principled BSDF")
        if bsdf and "Base Color" in bsdf.inputs:
            return tuple(round(float(v), 4) for v in bsdf.inputs["Base Color"].default_value)
    return None


rows = []
for obj in bpy.context.scene.objects:
    if obj.type != "MESH":
        continue
    name = obj.name
    if name.startswith(("warm ", "cream ", "thin floor", "back ", "left ", "large sun", "window ", "small warm", "matte plant", "chunky toy")):
        continue
    x, y, z = (float(abs(v)) for v in obj.dimensions)
    max_xy = max(x, y)
    min_xy = min(x, y)
    rows.append({
        "name": name,
        "loc": [round(float(v), 4) for v in obj.location],
        "dims": [round(x, 4), round(y, 4), round(z, 4)],
        "max_xy": round(max_xy, 4),
        "min_xy": round(min_xy, 4),
        "color": color_of(obj),
        "materials": [slot.material.name if slot.material else "" for slot in obj.material_slots],
    })

Path("/tmp/blender_object_diag.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2))
print(f"DIAG_OBJECT_COUNT={len(rows)}")
