import "./style.css";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader";
import { RGBShiftShader } from "three/examples/jsm/shaders/RGBShiftShader";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass";
import gsap from "gsap";
// Steps to create a 3D scene
// 1. Create a scene
// 2. Create a camera
// 2.1. set the camera's position
// 3. Load GLTF model
// 4. add model to the scene
// 5. Create a renderer
// 6. Render the scene

// 1. Create a scene
const scene = new THREE.Scene();

// Load HDR environment map
new RGBELoader().load(
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/creepy_bathroom_1k.hdr",
  function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
    // scene.background = texture;
  }
);

// 2. Create a camera
const camera = new THREE.PerspectiveCamera(
  40,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
// 2.2. set the camera's position
camera.position.z = 4;

// 3. Load GLTF model
const loader = new GLTFLoader();
let model;

loader.load(
  "./DamagedHelmet.gltf",
  (gltf) => {
    model = gltf.scene;
    // Add model to scene
    scene.add(model);
  },
  (xhr) => {
    console.log((xhr.loaded / xhr.total) * 100 + "% loaded");
  },
  (error) => {
    console.error("An error happened:", error);
  }
);

// 5. Create a renderer
const canvas = document.querySelector("#draw");
const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: true,
});

window.addEventListener("resize", () => {
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  composer.setSize(window.innerWidth, window.innerHeight);
});

// 5.1. Set the pixel ratio
// This is to make the scene look better on high-dpi screens
// 2 is the maximum ratio so it doesn't use more processing power than necessary
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
// 5.2. Set the size
renderer.setSize(window.innerWidth, window.innerHeight);

// Enable tone mapping and correct color space
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.outputEncoding = THREE.sRGBEncoding;

// Create PMREM Generator for environment map processing
const pmremGenerator = new THREE.PMREMGenerator(renderer);
pmremGenerator.compileEquirectangularShader();

// Post processing setup
const composer = new EffectComposer(renderer);
const renderPass = new RenderPass(scene, camera);
composer.addPass(renderPass);

const rgbShiftPass = new ShaderPass(RGBShiftShader);
rgbShiftPass.uniforms["amount"].value = 0.0025;
composer.addPass(rgbShiftPass);

//Event listener for mouse movement
window.addEventListener("mousemove", (event) => {
  if (model) {
    const rotationX = (event.clientX / window.innerWidth - 0.5) * Math.PI * 0.3;
    const rotationY =
      (event.clientY / window.innerHeight - 0.5) * Math.PI * 0.3;
    gsap.to(model.rotation, {
      y: rotationX,
      x: rotationY,
      duration: 1,
      ease: "power2.out",
    });
    gsap.from(rgbShiftPass.uniforms["amount"], {
      value: 0,
      duration: 1,
      ease: "linear",
      yoyo: true,
      repeat: -1,
    });
    gsap.to(rgbShiftPass.uniforms["amount"], {
      value: 0.01,
      duration: 1,
      ease: "linear",
      yoyo: true,
      repeat: -1,
    });
  }
});
gsap.to("path", {
  strokeDasharray: 0,
  strokeDashoffset: 0,
  delay: 0.5,
  duration: 2,
  ease: "power2.out",
});
function animate() {
  //window.requestAnimationFrame is fps of the browser and it will call the animate function again and again at the rate of the fps
  window.requestAnimationFrame(animate);
  composer.render();
}

animate();
