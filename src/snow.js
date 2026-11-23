import * as THREE from 'three';

export function createSnow(scene, count = 1400) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const drift = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 90;
    positions[i * 3 + 1] = Math.random() * 26;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 90;
    speeds[i] = 1.4 + Math.random() * 2.6;
    drift[i] = Math.random() * 6.28;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

  // 圆形雪花贴图（运行时生成，无外部资源）
  const c = document.createElement('canvas'); c.width = c.height = 32;
  const ctx = c.getContext('2d');
  const grd = ctx.createRadialGradient(16, 16, 1, 16, 16, 15);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.5, 'rgba(255,255,255,.8)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = grd; ctx.fillRect(0, 0, 32, 32);
  const tex = new THREE.CanvasTexture(c);

  const mat = new THREE.PointsMaterial({
    size: 0.16, map: tex, transparent: true, opacity: 0.85,
    depthWrite: false, sizeAttenuation: true, blending: THREE.AdditiveBlending
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  scene.add(points);

  let t = 0;
  function update(dt, camPos) {
    t += dt;
    const p = geo.attributes.position.array;
    for (let i = 0; i < count; i++) {
      p[i * 3 + 1] -= speeds[i] * dt;
      p[i * 3] += Math.sin(t * 0.8 + drift[i]) * 0.35 * dt;
      if (p[i * 3 + 1] < -1) {
        p[i * 3 + 1] = 24 + Math.random() * 3;
        p[i * 3] = camPos.x + (Math.random() - 0.5) * 90;
        p[i * 3 + 2] = camPos.z + (Math.random() - 0.5) * 90;
      }
    }
    geo.attributes.position.needsUpdate = true;
  }
  return { points, update };
}
