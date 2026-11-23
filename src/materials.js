import * as THREE from 'three';

// 冷白 / 雾蓝 / 浅紫 / 柔粉 的冬日调色板
export const PAL = {
  snow: 0xf2f6fc,
  snowShade: 0xdbe5f2,
  road: 0x8698b2,
  roadDark: 0x73869f,
  sidewalk: 0xcbd7e7,
  curb: 0xb9c7d9,
  wallA: 0xdde5f0,
  wallB: 0xe8e0e8,
  wallC: 0xd3dfec,
  wallD: 0xe4e4ee,
  roof: 0x9fb2cb,
  roofDark: 0x8297b4,
  wood: 0x8d7b74,
  warm: 0xffd9a0,
  warmDeep: 0xf0b871,
  hair: 0xeef0fa,
  hairShade: 0xcfd6ea,
  scarf: 0xc5536a,
  coat: 0xf4f6fb,
  skin: 0xf4dacd,
  eye: 0xa64f63,
  ink: 0x52617a,
  pine: 0x6d918a,
  pineDark: 0x57786f,
  metal: 0x8898ad
};

// 四阶色阶贴图：Toon / Cel Shading 核心
let gradient = null;
export function toonGradient() {
  if (gradient) return gradient;
  const steps = new Uint8Array([52, 112, 182, 255]);
  gradient = new THREE.DataTexture(steps, steps.length, 1, THREE.RedFormat);
  gradient.minFilter = THREE.NearestFilter;
  gradient.magFilter = THREE.NearestFilter;
  gradient.generateMipmaps = false;
  gradient.needsUpdate = true;
  return gradient;
}

export function toon(color, opts = {}) {
  return new THREE.MeshToonMaterial({
    color,
    gradientMap: toonGradient(),
    emissive: opts.emissive ?? 0x000000,
    emissiveIntensity: opts.emissiveIntensity ?? 1,
    transparent: opts.transparent ?? false,
    opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide
  });
}

export function flat(color, opts = {}) {
  return new THREE.MeshBasicMaterial({
    color, transparent: opts.transparent ?? false, opacity: opts.opacity ?? 1,
    side: opts.side ?? THREE.FrontSide, depthWrite: opts.depthWrite ?? true
  });
}

export function glow(color, opacity = 0.35) {
  return new THREE.MeshBasicMaterial({
    color, transparent: true, opacity, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide
  });
}

// 反向外扩描边（动漫描边），用于角色与关键物件
export function addOutline(mesh, color = 0x5a6884, scale = 1.035) {
  if (!mesh.geometry) return null;
  const outline = new THREE.Mesh(mesh.geometry, new THREE.MeshBasicMaterial({
    color, side: THREE.BackSide
  }));
  outline.scale.setScalar(scale);
  outline.castShadow = false;
  outline.receiveShadow = false;
  outline.name = 'outline';
  mesh.add(outline);
  return outline;
}

// 运行时 Canvas 贴图：建筑立面（窗格 + 暖光），避免大量独立窗格 mesh
export function facadeTexture(baseColor, litRatio = 0.45, cols = 4, rows = 3) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 256;
  const x = c.getContext('2d');
  const base = new THREE.Color(baseColor);
  x.fillStyle = `#${base.getHexString()}`;
  x.fillRect(0, 0, 256, 256);
  // 墙面细微纹理
  for (let i = 0; i < 260; i++) {
    x.fillStyle = `rgba(255,255,255,${Math.random() * 0.05})`;
    x.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
  }
  const cw = 34, ch = 42;
  const gx = (256 - cols * cw) / (cols + 1);
  const gy = (256 - rows * ch) / (rows + 1);
  for (let r = 0; r < rows; r++) for (let col = 0; col < cols; col++) {
    const px = gx + col * (cw + gx), py = gy + r * (ch + gy);
    x.fillStyle = 'rgba(90,110,140,.35)';
    x.fillRect(px - 3, py - 3, cw + 6, ch + 6);
    const lit = Math.random() < litRatio;
    const grad = x.createLinearGradient(px, py, px, py + ch);
    if (lit) {
      grad.addColorStop(0, '#fff0c8'); grad.addColorStop(1, '#e8b978');
    } else {
      grad.addColorStop(0, '#9fb4ce'); grad.addColorStop(1, '#7e93ae');
    }
    x.fillStyle = grad; x.fillRect(px, py, cw, ch);
    x.strokeStyle = 'rgba(70,90,120,.5)'; x.lineWidth = 2;
    x.strokeRect(px, py, cw, ch);
    x.beginPath(); x.moveTo(px + cw / 2, py); x.lineTo(px + cw / 2, py + ch); x.stroke();
    if (lit) {
      x.fillStyle = 'rgba(255,240,200,.18)';
      x.fillRect(px - 8, py - 6, cw + 16, ch + 12);
    }
    // 窗台积雪
    x.fillStyle = 'rgba(245,249,255,.9)';
    x.fillRect(px - 4, py + ch + 1, cw + 8, 4);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

export function signTexture(text, bg = '#e9eef6', fg = '#4a5f80') {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = bg; x.fillRect(0, 0, 512, 128);
  x.strokeStyle = 'rgba(120,145,180,.5)'; x.lineWidth = 5; x.strokeRect(4, 4, 504, 120);
  x.fillStyle = fg; x.font = 'bold 58px "Noto Sans SC","Microsoft YaHei",sans-serif';
  x.textAlign = 'center'; x.textBaseline = 'middle';
  x.fillText(text, 256, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}
