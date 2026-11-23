import * as THREE from 'three';
import { PAL, toon, flat, glow, addOutline } from './materials.js';

export function createNPC({ scene, name, x, z, color = 0x8fa4c0, hairColor = 0x4d4a56, patrol = [], onTalk }) {
  const group = new THREE.Group();
  group.position.set(x, 0, z);
  scene.add(group);

  const coat = toon(color), hair = toon(hairColor), skin = toon(PAL.skin);
  const body = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.8, 10), coat);
  body.position.y = 0.92; body.castShadow = true; group.add(body);
  addOutline(body, 0x697894, 1.04);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), skin);
  head.position.y = 1.52; head.castShadow = true; group.add(head);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.255, 14, 12), hair);
  cap.scale.set(1.05, 1, 1); cap.position.y = 1.57; group.add(cap);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.028, 8, 6), flat(0x41485a));
    eye.position.set(sx * 0.09, 1.52, 0.225); group.add(eye);
  }
  const legs = [];
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group(); leg.position.set(sx * 0.13, 0.56, 0);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.065, 0.56, 8), toon(0x59667f));
    m.position.y = -0.28; m.castShadow = true; leg.add(m);
    group.add(leg); legs.push(leg);
  }
  const arms = [];
  for (const sx of [-1, 1]) {
    const arm = new THREE.Group(); arm.position.set(sx * 0.29, 1.2, 0);
    const m = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.06, 0.5, 8), coat);
    m.position.y = -0.25; arm.add(m);
    group.add(arm); arms.push(arm);
  }

  // 任务标记：悬浮发光菱形
  const marker = new THREE.Mesh(new THREE.OctahedronGeometry(0.22), glow(0xffd06b, 0.9));
  marker.position.y = 2.35; marker.visible = false; group.add(marker);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.5, 0.62, 24), glow(0xffc45c, 0.42));
  ring.rotation.x = -Math.PI / 2; ring.position.y = 0.04; ring.visible = false; group.add(ring);

  const npc = {
    name, group, marker, onTalk,
    state: 'idle', waypoints: patrol, wp: 0, idle: Math.random() * 2,
    phase: Math.random() * 6, highlighted: false,
    setHighlight(v) { this.highlighted = v; marker.visible = v; ring.visible = v; },
    talk(playerPos) {
      this.state = 'talk'; this.idle = 3.2;
      const a = Math.atan2(playerPos.x - group.position.x, playerPos.z - group.position.z);
      group.rotation.y = a;
    },
    update(dt) {
      this.phase += dt * 5;
      const walking = this.state === 'walk';
      const sw = Math.sin(this.phase) * (walking ? 0.5 : 0.03);
      legs[0].rotation.x = sw; legs[1].rotation.x = -sw;
      arms[0].rotation.x = -sw * 0.7; arms[1].rotation.x = sw * 0.7;
      body.position.y = 0.92 + (walking ? Math.abs(Math.sin(this.phase)) * 0.025 : Math.sin(this.phase * 0.4) * 0.008);

      if (this.state === 'talk') {
        this.idle -= dt;
        if (this.idle <= 0) this.state = 'idle';
      } else if (this.state === 'idle') {
        this.idle -= dt;
        if (this.idle <= 0 && this.waypoints.length) this.state = 'walk';
      } else if (walking) {
        const wp = this.waypoints[this.wp % this.waypoints.length];
        const dx = wp.x - group.position.x, dz = wp.z - group.position.z;
        const d = Math.hypot(dx, dz);
        if (d < 0.5) { this.wp++; this.state = 'idle'; this.idle = 1 + Math.random() * 2; }
        else {
          const a = Math.atan2(dx, dz);
          let diff = ((a - group.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
          group.rotation.y += diff * (1 - Math.exp(-6 * dt));
          group.position.x += dx / d * 1.15 * dt;
          group.position.z += dz / d * 1.15 * dt;
        }
      }
      if (marker.visible) {
        marker.rotation.y += dt * 1.6;
        marker.position.y = 2.35 + Math.sin(performance.now() * 0.003) * 0.12;
      }
    }
  };
  return npc;
}
