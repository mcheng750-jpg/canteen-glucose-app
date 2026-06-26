import bpy
import sys
from pathlib import Path


def main() -> None:
    if "--" not in sys.argv:
        raise SystemExit("Usage: blender --background input.blend --python export_blender_glb.py -- output.glb")

    output_path = Path(sys.argv[sys.argv.index("--") + 1]).expanduser()
    output_path.parent.mkdir(parents=True, exist_ok=True)

    bpy.ops.object.select_all(action="DESELECT")
    for obj in bpy.context.scene.objects:
        if obj.type in {"MESH", "CURVE", "FONT", "EMPTY", "LIGHT", "CAMERA"}:
            obj.select_set(True)

    bpy.ops.export_scene.gltf(
        filepath=str(output_path),
        export_format="GLB",
        use_selection=False,
        export_apply=True,
        export_lights=True,
        export_cameras=True,
        export_yup=True,
    )


if __name__ == "__main__":
    main()
