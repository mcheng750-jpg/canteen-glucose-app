import json
from collections import defaultdict, deque
from pathlib import Path

import bpy
from mathutils import Vector


obj = next((o for o in bpy.context.scene.objects if o.type == "MESH" and o.name.startswith("tripo_node_")), None)
rows = []

if obj:
    mesh = obj.data
    vertex_to_polys = defaultdict(list)
    for poly in mesh.polygons:
        for vi in poly.vertices:
            vertex_to_polys[vi].append(poly.index)

    seen = set()
    for poly in mesh.polygons:
        if poly.index in seen:
            continue
        q = deque([poly.index])
        seen.add(poly.index)
        polys = []
        vertices = set()
        while q:
            pi = q.popleft()
            p = mesh.polygons[pi]
            polys.append(pi)
            for vi in p.vertices:
                vertices.add(vi)
                for npi in vertex_to_polys[vi]:
                    if npi not in seen:
                        seen.add(npi)
                        q.append(npi)

        pts = [obj.matrix_world @ mesh.vertices[vi].co for vi in vertices]
        mins = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts)))
        maxs = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
        dims = maxs - mins
        rows.append({
            "polys": len(polys),
            "verts": len(vertices),
            "center": [round(float(v), 5) for v in ((mins + maxs) / 2)],
            "dims": [round(abs(float(v)), 5) for v in dims],
        })

rows.sort(key=lambda r: (r["dims"][0] * r["dims"][1] * r["dims"][2], r["polys"]), reverse=True)
Path("/tmp/blender_component_diag.json").write_text(json.dumps(rows, ensure_ascii=False, indent=2))
print(f"DIAG_COMPONENT_COUNT={len(rows)}")
