import * as THREE from 'three';
import { PAL, toon, flat, glow, facadeTexture, signTexture } from './materials.js';

const snowMat = () => toon(PAL.snow);
const roadMat = () => toon(PAL.road);
const wallMat = () => toon(PAL.wallA);

function addBox(group, w, h, d, x, y, z, mat, cast = true) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
  m.position.set(x, y, z);
  m.castShadow = cast; m.receiveShadow = true;
  group.add(m);
  return m;
}

function makeBuilding(opts, colliders) {
  const {
    x, z, w, d, h, color = PAL.wallA, name = '', roof = 'gable',
    lit = 0.45, cols = 4, rows = 3, awning = false, chimney = false
  } = opts;
  const g = new THREE.Group();
  g.position.set(x, 0, z);
  g.name = 'building:' + (name || 'block');

  const tex = facadeTexture(color, lit, cols, rows);
  const facade = toon(0xffffff); facade.map = tex;
  const top = snowMat();
  const bottom = toon(PAL.roofDark);
  const mats = [facade, facade, top, bottom, facade, facade];
  const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mats);
  body.position.y = h / 2;
  body.castShadow = true; body.receiveShadow = true;
  body.name = 'occluder';
  g.add(body);

  // 屋顶
  if (roof === 'gable') {
    const rise = Math.max(1.6, d * 0.19);
    const theta = Math.atan(rise / (d / 2));
    const slopeLen = Math.hypot(d / 2, rise) + 0.7;
    const rm = toon(PAL.roof);
    const snowEdge = snowMat();
    for (const side of [1, -1]) {
      const panel = new THREE.Mesh(new THREE.BoxGeometry(w + 1.1, 0.32, slopeLen), rm);
      panel.rotation.x = side * theta;
      panel.position.set(0, h + rise / 2, side * d / 4);
      panel.castShadow = true; panel.receiveShadow = true;
      g.add(panel);
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 1.3, 0.18, 0.65), snowEdge);
      cap.position.set(0, h + 0.18, side * (d / 2 + 0.25));
      cap.castShadow = true;
      g.add(cap);
    }
  } else {
    addBox(g, w + 0.9, 0.45, d + 0.9, 0, h + 0.22, 0, snowMat());
    // 女儿墙
    const p = toon(PAL.roofDark);
    addBox(g, w + 0.9, 0.5, 0.3, 0, h + 0.55, d / 2 + 0.3, p);
    addBox(g, w + 0.9, 0.5, 0.3, 0, h + 0.55, -d / 2 - 0.3, p);
  }

  // 门 + 暖光
  const doorMat = toon(PAL.wood);
  addBox(g, 2.2, 3.0, 0.25, 0, 1.5, d / 2 + 0.14, doorMat);
  addBox(g, 3.0, 0.22, 0.6, 0, 0.12, d / 2 + 0.35, snowMat(), false);
  const lampGlow = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.8),
    glow(PAL.warm, 0.28));
  lampGlow.position.set(0, 2.2, d / 2 + 0.28);
  g.add(lampGlow);

  if (name) {
    const sign = new THREE.Mesh(new THREE.PlaneGeometry(Math.min(w * 0.62, 7), 1.5),
      new THREE.MeshBasicMaterial({ map: signTexture(name), transparent: false }));
    sign.position.set(0, h * 0.62, d / 2 + 0.2);
    g.add(sign);
    const signSnow = addBox(g, Math.min(w * 0.62, 7) + 0.3, 0.12, 0.45, 0, h * 0.62 + 0.82, d / 2 + 0.24, snowMat(), false);
    signSnow.receiveShadow = false;
  }

  if (awning) {
    const aw = new THREE.Mesh(new THREE.BoxGeometry(w * 0.66, 0.18, 2.6), toon(0xb96b78));
    aw.position.set(0, 3.7, d / 2 + 1.25);
    aw.rotation.x = -0.14;
    aw.castShadow = true;
    g.add(aw);
    addBox(g, w * 0.66 + 0.2, 0.12, 2.4, 0, 3.92, d / 2 + 1.25, snowMat(), false);
  }
  if (chimney) {
    addBox(g, 1.1, 2.6, 1.1, w * 0.25, h + 1.5, -d * 0.18, toon(PAL.wallD));
    addBox(g, 1.35, 0.18, 1.35, w * 0.25, h + 2.85, -d * 0.18, snowMat());
  }

  colliders.push({ minX: x - w / 2, maxX: x + w / 2, minZ: z - d / 2, maxZ: z + d / 2, name: name || '建筑' });
  return g;
}

function makeLamp(x, z, lights) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const metal = toon(PAL.metal);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 5.2, 8), metal);
  pole.position.y = 2.6; pole.castShadow = true; g.add(pole);
  const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.9, 8), metal);
  arm.rotation.z = Math.PI / 2; arm.position.set(0.4, 5.1, 0); g.add(arm);
  const head = new THREE.Mesh(new THREE.ConeGeometry(0.42, 0.45, 8), metal);
  head.rotation.x = Math.PI; head.position.set(0.8, 4.95, 0); g.add(head);
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), flat(0xffe6ae));
  bulb.position.set(0.8, 4.72, 0); g.add(bulb);

  const pool = new THREE.Mesh(new THREE.CircleGeometry(3.6, 24), glow(0xffdda0, 0.16));
  pool.rotation.x = -Math.PI / 2; pool.position.set(0.8, 0.035, 0); g.add(pool);

  if (lights.length < 7) {
    const pl = new THREE.PointLight(0xffd39a, 14, 17, 2);
    pl.position.set(0.8, 4.6, 0);
    g.add(pl); lights.push(pl);
  }
  return g;
}

function makePine(x, z, s = 1) {
  const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(s);
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 1.6, 7), toon(PAL.wood));
  trunk.position.y = 0.8; trunk.castShadow = true; g.add(trunk);
  for (let i = 0; i < 3; i++) {
    const r = 1.5 - i * 0.33;
    const cone = new THREE.Mesh(new THREE.ConeGeometry(r, 1.9, 9), toon(i % 2 ? PAL.pineDark : PAL.pine));
    cone.position.y = 1.75 + i * 0.95; cone.castShadow = true; g.add(cone);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(r * 0.72, 0.62, 9), snowMat());
    cap.position.y = 2.55 + i * 0.95; g.add(cap);
  }
  return g;
}

function makeBusStop(x, z, colliders) {
  const g = new THREE.Group(); g.position.set(x, 0, z);
  const frame = toon(PAL.metal);
  const glass = new THREE.MeshStandardMaterial({ color: 0xdfeef7, transparent: true, opacity: 0.28, roughness: 0.15, metalness: 0.1, side: THREE.DoubleSide });
  // 顶棚
  addBox(g, 5.4, 0.22, 2.8, 0, 3.1, 0, snowMat());
  addBox(g, 5.4, 0.12, 2.8, 0, 2.93, 0, frame);
  for (const sx of [-2.5, 2.5]) {
    addBox(g, 0.14, 3.0, 0.14, sx, 1.5, -1.25, frame);
    addBox(g, 0.14, 3.0, 0.14, sx, 1.5, 1.25, frame);
  }
  const back = new THREE.Mesh(new THREE.PlaneGeometry(5.0, 2.6), glass);
  back.position.set(0, 1.55, -1.28); g.add(back);
  // 长椅
  const wood = toon(PAL.wood);
  addBox(g, 3.6, 0.14, 0.65, 0, 0.85, -0.55, wood);
  addBox(g, 3.6, 0.6, 0.12, 0, 1.18, -0.92, wood);
  addBox(g, 3.6, 0.12, 0.7, 0, 0.86, -0.55, snowMat(), false);
  // 站牌
  addBox(g, 0.1, 2.2, 0.1, 3.2, 1.1, 0.4, frame);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 0.85),
    new THREE.MeshBasicMaterial({ map: signTexture('公交站', '#e6f0fa', '#486b96'), side: THREE.DoubleSide }));
  sign.position.set(3.2, 2.15, 0.46); g.add(sign);
  colliders.push({ minX: x - 2.6, maxX: x + 2.6, minZ: z - 1.4, maxZ: z + 1.4, name: '公交站' });
  return g;
}

function makeSnowPile(x, z, s) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(1, 10, 7), snowMat());
  m.scale.set(s, s * 0.38, s * 0.75);
  m.position.set(x, s * 0.12, z);
  m.receiveShadow = true; m.castShadow = true;
  return m;
}

export function createCity(scene, colliders) {
  const lamps = [];
  const root = new THREE.Group(); root.name = 'city';
  scene.add(root);

  // 雪地
  const ground = new THREE.Mesh(new THREE.PlaneGeometry(260, 260), snowMat());
  ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
  root.add(ground);
  // 淡淡雪面纹理：随机雪堆与冰蓝斑块
  for (let i = 0; i < 90; i++) {
    const px = (Math.random() - 0.5) * 130, pz = (Math.random() - 0.5) * 130;
    if (Math.abs(px) < 9 || Math.abs(pz) < 9) continue;
    root.add(makeSnowPile(px, pz, 0.5 + Math.random() * 1.3));
  }

  // 十字道路
  const roadMatX = roadMat();
  const roadA = new THREE.Mesh(new THREE.PlaneGeometry(240, 13), roadMatX);
  roadA.rotation.x = -Math.PI / 2; roadA.position.y = 0.012; roadA.receiveShadow = true;
  const roadB = new THREE.Mesh(new THREE.PlaneGeometry(13, 240), roadMatX);
  roadB.rotation.x = -Math.PI / 2; roadB.position.y = 0.014; roadB.receiveShadow = true;
  root.add(roadA, roadB);

  // 人行道（抬高 0.16，雪顶）
  const walkMat = toon(PAL.sidewalk);
  const curbMat = toon(PAL.curb);
  for (const side of [-1, 1]) {
    const w1 = new THREE.Mesh(new THREE.BoxGeometry(240, 0.18, 3.4), walkMat);
    w1.position.set(0, 0.09, side * 9.7); w1.receiveShadow = true; root.add(w1);
    const w2 = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.18, 240), walkMat);
    w2.position.set(side * 9.7, 0.09, 0); w2.receiveShadow = true; root.add(w2);
    const c1 = new THREE.Mesh(new THREE.BoxGeometry(240, 0.2, 0.28), curbMat);
    c1.position.set(0, 0.1, side * 7.95); root.add(c1);
    const c2 = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.2, 240), curbMat);
    c2.position.set(side * 7.95, 0.1, 0); root.add(c2);
  }

  // 斑马线
  const cross = toon(0xf6f9ff);
  for (let i = -3; i <= 3; i++) {
    const a = new THREE.Mesh(new THREE.PlaneGeometry(0.75, 5.4), cross);
    a.rotation.x = -Math.PI / 2; a.position.set(i * 1.55, 0.02, 8.4); root.add(a);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 0.75), cross);
    b.rotation.x = -Math.PI / 2; b.position.set(8.4, 0.022, i * 1.55); root.add(b);
  }

  // 主体建筑：有造型差异与视觉焦点
  root.add(makeBuilding({ x: -18, z: -17, w: 15, d: 12, h: 7.4, color: PAL.wallB, name: '暖炉咖啡', roof: 'gable', lit: 0.62, cols: 4, rows: 2, awning: true, chimney: true }, colliders));
  root.add(makeBuilding({ x: 18, z: -18, w: 17, d: 13, h: 11.5, color: PAL.wallA, name: '旧书店', roof: 'flat', lit: 0.4, cols: 5, rows: 4 }, colliders));
  root.add(makeBuilding({ x: -19, z: 18, w: 15, d: 14, h: 12.8, color: PAL.wallC, name: '雪港公寓', roof: 'gable', lit: 0.5, cols: 4, rows: 4, chimney: true }, colliders));
  root.add(makeBuilding({ x: 21, z: 20, w: 20, d: 15, h: 8.6, color: PAL.wallD, name: '霜港车站', roof: 'flat', lit: 0.55, cols: 6, rows: 2 }, colliders));
  // 周边次要建筑
  root.add(makeBuilding({ x: -42, z: -20, w: 18, d: 16, h: 14, color: PAL.wallC, roof: 'flat', lit: 0.35, cols: 5, rows: 4 }, colliders));
  root.add(makeBuilding({ x: 42, z: -22, w: 16, d: 18, h: 9, color: PAL.wallB, roof: 'gable', lit: 0.45, cols: 4, rows: 3 }, colliders));
  root.add(makeBuilding({ x: -43, z: 22, w: 20, d: 15, h: 10, color: PAL.wallA, roof: 'gable', lit: 0.3, cols: 5, rows: 3 }, colliders));
  root.add(makeBuilding({ x: 44, z: 24, w: 17, d: 17, h: 16, color: PAL.wallD, roof: 'flat', lit: 0.4, cols: 4, rows: 5 }, colliders));

  // 街灯
  for (const [x, z] of [[10.5, 10.5], [-10.5, -10.5], [10.5, -10.5], [-10.5, 10.5], [10.5, 34], [-10.5, -34], [34, -10.5]]) {
    root.add(makeLamp(x, z, lamps));
  }
  // 松树
  for (const [x, z, s] of [[-9.5, -26, 1.1], [-13, -27, 0.9], [10, -30, 1.2], [13.5, 26, 1.0], [-11, 33, 1.15], [30, 10, 0.95], [-30, -9, 1.05], [27, -11, 0.85]]) {
    root.add(makePine(x, z, s));
  }
  // 公交站（东端）
  root.add(makeBusStop(15.5, 7.5, colliders));

  // 远景建筑群（低细节，靠雾形成纵深，不参与碰撞）
  const skylineMats = [toon(PAL.wallA), toon(PAL.wallC), toon(PAL.wallD), toon(PAL.wallB)];
  for (let i = 0; i < 34; i++) {
    const a = (i / 34) * Math.PI * 2;
    const r = 78 + Math.random() * 46;
    const w = 8 + Math.random() * 12, h = 12 + Math.random() * 30, d = 8 + Math.random() * 12;
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), skylineMats[i % 4]);
    m.position.set(Math.cos(a) * r, h / 2, Math.sin(a) * r);
    m.receiveShadow = true;
    root.add(m);
    const cap = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5, 0.4, d + 0.5), snowMat());
    cap.position.set(m.position.x, h + 0.2, m.position.z);
    root.add(cap);
  }

  // 咖啡店门口的暖光池
  const cafeLight = new THREE.PointLight(0xffc98a, 18, 20, 2);
  cafeLight.position.set(-18, 3.6, -10);
  root.add(cafeLight);
  lamps.push(cafeLight);

  return { root, lamps, colliders };
}
