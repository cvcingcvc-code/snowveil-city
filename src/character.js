import * as THREE from 'three';
import { PAL, toon, flat, addOutline } from './materials.js';

/*
 * 临时占位三维角色（程序化几何体生成）。
 * 明确声明：这不是最终 anime 角色建模，也没有专业骨骼绑定；
 * 这里用分组变换模拟待机/行走/奔跑/转向与头发围巾动态。
 * 最终资产要求见 docs/ASSETS.md 与 docs/PHASE_PLAN.md。
 */
export function createHeroine() {
  const root = new THREE.Group();
  root.name = 'heroine:placeholder';

  const coat = toon(PAL.coat);
  const coatShade = toon(0xdfe7f3);
  const hair = toon(PAL.hair);
  const hairShade = toon(PAL.hairShade);
  const skin = toon(PAL.skin);
  const scarf = toon(PAL.scarf);
  const dark = toon(0x343a4c);

  const body = new THREE.Group();
  body.position.y = 0.92;
  root.add(body);

  // 大衣躯干
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.34, 0.78, 12), coat);
  torso.position.y = 0.4; torso.castShadow = true; body.add(torso);
  addOutline(torso, 0x6b7996, 1.045);
  const skirt = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.43, 0.42, 12), coatShade);
  skirt.position.y = 0.02; skirt.castShadow = true; body.add(skirt);
  addOutline(skirt, 0x6b7996, 1.04);

  // 围巾（颈圈 + 飘带）
  const collar = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.085, 8, 16), scarf);
  collar.rotation.x = Math.PI / 2; collar.position.y = 0.82; body.add(collar);
  const tail = new THREE.Group();
  tail.position.set(0.1, 0.8, 0.18);
  const tailMesh = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.62, 0.08), scarf);
  tailMesh.position.y = -0.3; tailMesh.castShadow = true; tail.add(tailMesh);
  const tailTip = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.12, 0.09), toon(0xe07c90));
  tailTip.position.y = -0.6; tail.add(tailTip);
  body.add(tail);

  // 头
  const head = new THREE.Group();
  head.position.y = 1.1;
  body.add(head);
  const face = new THREE.Mesh(new THREE.SphereGeometry(0.285, 18, 14), skin);
  face.scale.set(1, 1.08, 0.94); face.castShadow = true; head.add(face);
  addOutline(face, 0x7a6f7c, 1.035);

  // 眼睛（日系大眼，红棕色）
  const eyeMat = flat(PAL.eye);
  for (const sx of [-1, 1]) {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.052, 12, 10), eyeMat);
    eye.scale.set(0.78, 1.28, 0.4);
    eye.position.set(sx * 0.108, 0.015, 0.263);
    head.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.016, 8, 6), flat(0xffffff));
    shine.position.set(sx * 0.108 - 0.012, 0.04, 0.285); head.add(shine);
  }
  const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.018, 8, 6), flat(0xb97783));
  mouth.scale.set(1.5, 0.6, 0.4); mouth.position.set(0, -0.11, 0.27); head.add(mouth);

  // 银白长发：发顶 + 后发束 + 侧发 + 刘海 + 黑发带
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.3, 18, 14), hair);
  cap.scale.set(1.06, 1.0, 1.02); cap.position.y = 0.06; cap.castShadow = true; head.add(cap);
  addOutline(cap, 0x7c88a6, 1.035);

  const backStrands = [];
  for (let i = 0; i < 5; i++) {
    const x = (i - 2) * 0.115;
    const len = 1.05 - Math.abs(i - 2) * 0.12;
    const strand = new THREE.Group();
    strand.position.set(x, -0.05, -0.19);
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.125, len, 8), i % 2 ? hairShade : hair);
    mesh.position.y = -len / 2; mesh.castShadow = true; strand.add(mesh);
    const tip = new THREE.Mesh(new THREE.ConeGeometry(0.12, 0.24, 8), hair);
    tip.rotation.x = Math.PI; tip.position.y = -len - 0.07; strand.add(tip);
    head.add(strand); backStrands.push(strand);
  }
  for (const sx of [-1, 1]) {
    const lock = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.095, 0.85, 8), hair);
    lock.position.set(sx * 0.27, -0.32, 0.02); lock.rotation.z = sx * 0.12;
    lock.castShadow = true; head.add(lock);
  }
  for (let i = 0; i < 5; i++) {
    const bang = new THREE.Mesh(new THREE.ConeGeometry(0.075, 0.32, 7), i % 2 ? hair : hairShade);
    bang.position.set((i - 2) * 0.105, 0.17, 0.235);
    bang.rotation.x = Math.PI + (i - 2) * 0.06;
    head.add(bang);
  }
  // 黑色蝴蝶结（右上方）
  const bow = new THREE.Group(); bow.position.set(0.22, 0.24, -0.06);
  for (const sx of [-1, 1]) {
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.11, 0.2, 6), dark);
    wing.rotation.z = sx * Math.PI / 2; wing.position.x = sx * 0.09; bow.add(wing);
  }
  head.add(bow);

  // 手臂
  const arms = [];
  for (const sx of [-1, 1]) {
    const arm = new THREE.Group();
    arm.position.set(sx * 0.34, 0.7, 0);
    const upper = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.46, 8), coat);
    upper.position.y = -0.23; upper.castShadow = true; arm.add(upper);
    const lower = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.4, 8), coatShade);
    lower.position.y = -0.62; lower.castShadow = true; arm.add(lower);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.075, 10, 8), skin);
    hand.position.y = -0.84; arm.add(hand);
    body.add(arm); arms.push(arm);
  }

  // 腿与靴子
  const legs = [];
  for (const sx of [-1, 1]) {
    const leg = new THREE.Group();
    leg.position.set(sx * 0.15, -0.02, 0);
    const thigh = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.085, 0.44, 8), toon(0x737f9a));
    thigh.position.y = -0.22; thigh.castShadow = true; leg.add(thigh);
    const shin = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.42, 8), toon(0x64718d));
    shin.position.y = -0.63; shin.castShadow = true; leg.add(shin);
    const boot = new THREE.Mesh(new THREE.BoxGeometry(0.19, 0.16, 0.3), toon(0x4c566e));
    boot.position.set(0, -0.88, 0.05); boot.castShadow = true; leg.add(boot);
    const snow = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.03, 0.31), toon(PAL.snow));
    snow.position.set(0, -0.96, 0.05); leg.add(snow);
    body.add(leg); legs.push(leg);
  }

  let phase = 0, t = 0;
  function update(dt, speed = 0, jumping = false, turning = 0) {
    t += dt;
    const amount = Math.min(1, speed / 2.6);
    phase += dt * (amount > 0.05 ? 6.5 + speed * 1.35 : 1.8);
    const sw = Math.sin(phase);
    const swing = sw * 0.62 * amount;
    arms[0].rotation.x = swing;
    arms[1].rotation.x = -swing;
    legs[0].rotation.x = -swing;
    legs[1].rotation.x = swing;
    arms[0].rotation.z = 0.06 + Math.abs(swing) * 0.1;
    arms[1].rotation.z = -0.06 - Math.abs(swing) * 0.1;
    body.position.y = 0.92 + (amount > 0.05 ? Math.abs(sw) * 0.045 : Math.sin(t * 1.7) * 0.012);
    body.rotation.z = turning * 0.06;

    // 围巾与头发的轻微二次动态
    tail.rotation.z = Math.sin(t * 2.6) * 0.1 + swing * 0.18;
    tail.rotation.x = -0.08 - amount * 0.12 + Math.sin(t * 3.1) * 0.05;
    backStrands.forEach((s, i) => {
      s.rotation.x = Math.sin(t * 1.9 + i * 0.5) * 0.045 - amount * 0.08;
      s.rotation.z = Math.sin(t * 1.3 + i * 0.7) * 0.035;
    });
    head.rotation.y = Math.sin(t * 1.2) * 0.03;

    if (jumping) {
      legs[0].rotation.x = -0.45; legs[1].rotation.x = 0.2;
      arms[0].rotation.x = -0.8; arms[1].rotation.x = -0.6;
      tail.rotation.x = -0.5;
    }
  }

  return { root, update, label: '占位角色 · 程序化临时模型（非最终建模）' };
}
