import fs from "node:fs";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const file = process.argv[2];
const data = fs.readFileSync(file);
const loader = new GLTFLoader();

loader.parse(
  data.buffer.slice(data.byteOffset, data.byteOffset + data.byteLength),
  "",
  (gltf) => {
    const box = new THREE.Box3().setFromObject(gltf.scene);
    const size = new THREE.Vector3();
    const center = new THREE.Vector3();
    box.getSize(size);
    box.getCenter(center);
    let meshes = 0;
    gltf.scene.traverse((node) => {
      if (node.isMesh) meshes += 1;
    });
    console.log(
      JSON.stringify(
        {
          file,
          meshes,
          min: box.min.toArray().map((v) => Number(v.toFixed(3))),
          max: box.max.toArray().map((v) => Number(v.toFixed(3))),
          size: size.toArray().map((v) => Number(v.toFixed(3))),
          center: center.toArray().map((v) => Number(v.toFixed(3)))
        },
        null,
        2
      )
    );
  },
  (error) => {
    console.error(error);
    process.exit(1);
  }
);
