import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { RGBELoader } from 'three/addons/loaders/RGBELoader.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// Cubemap Generator
let cubeCamera, cubeRenderTarget;

// Scene
THREE.ColorManagement.enabled = true;
const scene = new THREE.Scene();

// Renderer
const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.CineonToneMapping;
//renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.5;
renderer.useLegacyLights = false;

let model;
const loader = new GLTFLoader().setPath('static/');
const rgbeLoader = new RGBELoader().setPath('static/');


rgbeLoader.load('rural_asphalt_road_2k.hdr', function(texture) {
  texture.mapping = THREE.EquirectangularReflectionMapping;
  scene.background = texture;
  //scene.environment = texture;

  rgbeLoader.load('lightmap_archviz_linear.hdr', function(lightmap) {
    lightmap.flipY = false;
    lightmap.colroSpace = "srgb";
    lightmap.channel = 1;
    console.log(lightmap);
    loader.load( 'archviz.glb', function ( gltf ) {
      console.log(gltf);
      model = gltf.scene.children[0];
      model.children.forEach(obj => {
        console.log(obj.material)
        const { material } = obj;
        material.lightMap = material.emissiveMap;
        material.lightMapIntensity = 2.0;
        material.envMap = cubeRenderTarget.texture;
        material.aoMap = material.emissiveMap;
        material.aoMapIntensity = 0.5;
        //material.aoMap = lightmap;
        //material.lightMap = lightmap;
        //material.roughness = 0.05;
        //material.roughnessMap = null;
        if(material.roughnessMap) {
          material.roughness = 0.15;
          //material.roughnessMap.colorSpace = THREE.LinearSRGBColorSpace;
          material.roughnessMap.colorSpace = THREE.SRGBColorSpace;
        } else if(material.name === "Walls") {
          material.roughness = 0.8;
        }
        material.emissive = null;
        material.emissiveMap = null;
        if(material.normalMap) {
          material.normalMap.colorSpace = THREE.SRGBColorSpace;
        }
        
      })
      scene.add( gltf.scene );

      cubeCamera.update(renderer, scene);
    
      drawScene();
    }, undefined, function ( error ) {
      console.error( error );
    } );
  });
});



// Camera
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 3);
camera.lookAt(0, 0, 0);

// Cubemap Probe
cubeRenderTarget = new THREE.WebGLCubeRenderTarget(512);
cubeRenderTarget.texture.type = THREE.HalfFloatType;
cubeCamera = new THREE.CubeCamera(0.01, 1000, cubeRenderTarget);
cubeCamera.renderTarget.texture.generateMipmaps = true;
cubeCamera.renderTarget.minFilter = THREE.LinearMipMapLinearFilter;
cubeCamera.renderTarget.mapping = THREE.CubeReflectionMapping;
cubeCamera.position.set(0, 1, 0);

// Controls
const controls = new OrbitControls(camera, renderer.domElement);

const resizeViewport = () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
resizeViewport();
addEventListener('resize', resizeViewport);


document.body.appendChild(renderer.domElement);

const drawScene = () => {
    //model.rotation.x += 0.01;
    //model.rotation.z += 0.01;
  cubeCamera.position.set(camera.position.x, 0.01, camera.position.z);
  cubeCamera.update(renderer, scene);
  requestAnimationFrame(drawScene);
  renderer.render(scene, camera);
}
