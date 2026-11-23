import * as THREE from 'three';
import { PAL, toon, flat, glow } from './materials.js';

export function createVehicle({ scene, colliders, camera, x = 13, z = -13, color = 0x7f95b4 }) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  group.rotation.y = Math.PI / 2;
  scene.add(group);

  const bodyMat = toon(color);
  const glassMat = new THREE.MeshStandardMaterial({ color: 0x9fb8d2, roughness: 0.2, metalness: 0.15, transparent: true, opacity: 0.72 });

  const chassis = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.58, 4.3), bodyMat);
  chassis.position.y = 0.68; chassis.castShadow = true; chassis.receiveShadow = true; group.add(chassis);
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.78, 0.68, 2.1), glassMat);
  cabin.position.set(0, 1.22, -0.15); cabin.castShadow = true; group.add(cabin);
  const roof = new THREE.Mesh(new THREE.BoxGeometry(1.86, 0.14, 2.2), bodyMat);
  roof.position.set(0, 1.6, -0.15); roof.castShadow = true; group.add(roof);
  const snow = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.07, 2.25), toon(PAL.snow));
  snow.position.set(0, 1.7, -0.15); group.add(snow);

  const wheels = [];
  const wheelMat = toon(0x424b5e);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.24, 12), wheelMat);
    w.rotation.z = Math.PI / 2;
    w.position.set(sx * 1.03, 0.4, sz * 1.4);
    w.castShadow = true; group.add(w); wheels.push(w);
  }
  for (const sx of [-1, 1]) {
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.2, 0.1), flat(0xfff0c4));
    lamp.position.set(sx * 0.65, 0.78, 2.18); group.add(lamp);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.16, 0.1), flat(0xd4697a));
    tail.position.set(sx * 0.65, 0.8, -2.18); group.add(tail);
  }
  const beam = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 7), glow(0xffe3ad, 0.11));
  beam.rotation.x = -Math.PI / 2; beam.position.set(0, 0.03, 5.0); group.add(beam);

  const state = { speed: 0, steer: 0, driving: false, occupied: false };

  function canMove(nx, nz) {
    const r = 1.25;
    for (const c of colliders) {
      const px = Math.max(c.minX, Math.min(nx, c.maxX));
      const pz = Math.max(c.minZ, Math.min(nz, c.maxZ));
      if ((nx - px) ** 2 + (nz - pz) ** 2 < r * r) return false;
    }
    return true;
  }

  function update(dt, keys) {
    if (state.driving) {
      const accel = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
      const steerIn = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
      const maxSpeed = keys.ShiftLeft || keys.ShiftRight ? 17 : 11;
      state.speed += accel * 13 * dt;
      state.speed = THREE.MathUtils.clamp(state.speed, -5, maxSpeed);
      if (accel === 0) state.speed *= Math.exp(-1.9 * dt);
      state.steer += (steerIn - state.steer) * (1 - Math.exp(-7 * dt));
      group.rotation.y += state.steer * state.speed * dt * 0.18;
      const fx = Math.sin(group.rotation.y), fz = Math.cos(group.rotation.y);
      const nx = group.position.x + fx * state.speed * dt;
      const nz = group.position.z + fz * state.speed * dt;
      if (canMove(nx, nz)) { group.position.x = nx; group.position.z = nz; }
      else state.speed *= -0.18;
      for (const w of wheels) w.rotation.x += state.speed * dt * 2.2;

      const target = new THREE.Vector3(
        group.position.x - fx * 9.5, group.position.y + 4.6, group.position.z - fz * 9.5
      );
      camera.position.lerp(target, 1 - Math.exp(-5 * dt));
      camera.lookAt(group.position.x, group.position.y + 1.1, group.position.z);
    } else {
      state.speed *= Math.exp(-4 * dt);
      state.steer *= Math.exp(-6 * dt);
    }
  }

  function enter() { state.driving = true; state.occupied = true; }
  function exit() {
    state.driving = false; state.occupied = false; state.speed = 0;
    // 从驾驶位左侧下车
    const a = group.rotation.y;
    const px = group.position.x - Math.cos(a) * 2.6;
    const pz = group.position.z + Math.sin(a) * 2.6;
    return new THREE.Vector3(px, 0, pz);
  }

  return { group, state, update, enter, exit, position: group.position };
}
