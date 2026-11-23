import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

export function createRenderSystem(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.98;
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xdbe7f5);
  scene.fog = new THREE.Fog(0xc8d8ec, 62, 235);

  // 渐变天空穹顶
  const sky = new THREE.Mesh(
    new THREE.SphereGeometry(300, 24, 16),
    new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: {
        top: { value: new THREE.Color(0xa9c4e6) },
        mid: { value: new THREE.Color(0xdce7f5) },
        bottom: { value: new THREE.Color(0xf1f4fa) }
      },
      vertexShader: `varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }`,
      fragmentShader: `
        uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP;
        void main(){
          float h=normalize(vP).y;
          vec3 c = h>0.0 ? mix(mid,top,clamp(h*1.4,0.0,1.0)) : mix(mid,bottom,clamp(-h*1.8,0.0,1.0));
          gl_FragColor=vec4(c,1.0);
        }`
    })
  );
  sky.frustumCulled = false;
  scene.add(sky);

  const hemi = new THREE.HemisphereLight(0xe8f1ff, 0x9fb2cd, 1.12);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffeed8, 1.95);
  sun.position.set(38, 64, 26);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -75; sun.shadow.camera.right = 75;
  sun.shadow.camera.top = 75; sun.shadow.camera.bottom = -75;
  sun.shadow.camera.near = 1; sun.shadow.camera.far = 180;
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.025;
  sun.shadow.radius = 3;
  scene.add(sun);
  scene.add(new THREE.AmbientLight(0xc9d8ee, 0.16));

  const camera = new THREE.PerspectiveCamera(58, window.innerWidth / window.innerHeight, 0.1, 400);
  camera.position.set(0, 6, 12);

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(window.innerWidth, window.innerHeight), 0.34, 0.6, 0.84);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  let quality = 'medium';
  function setQuality(q) {
    quality = q;
    if (q === 'low') {
      renderer.setPixelRatio(1);
      renderer.shadowMap.enabled = false;
      bloom.enabled = false;
    } else {
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
      renderer.shadowMap.enabled = true;
      bloom.enabled = true;
    }
    resize();
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h);
    composer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  window.addEventListener('resize', resize);

  return { renderer, scene, camera, composer, sun, quality: () => quality, setQuality };
}
