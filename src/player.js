import * as THREE from 'three';

const RADIUS = 0.42;
const WALK = 4.4, RUN = 7.6, GRAVITY = 19, JUMP = 7.0;

function blockedAt(x, z, colliders) {
  for (const c of colliders) {
    const nx = Math.max(c.minX, Math.min(x, c.maxX));
    const nz = Math.max(c.minZ, Math.min(z, c.maxZ));
    if ((x - nx) ** 2 + (z - nz) ** 2 < RADIUS * RADIUS) return true;
  }
  return false;
}

export function createPlayer({ camera, canvas, colliders, occluders, heroine }) {
  const root = heroine.root;
  root.position.set(-12, 0, -1.5);
  const velocity = new THREE.Vector3();
  const keys = Object.create(null);
  const state = {
    yaw: Math.PI, pitch: 0.22, camDist: 6.2, onGround: true, disabled: false,
    speed: 0, turning: 0, jumpQueued: false, position: root.position, velocity
  };

  let cameraInit = false;
  const ray = new THREE.Raycaster();
  const target = new THREE.Vector3();
  const desired = new THREE.Vector3();
  const dir = new THREE.Vector3();

  window.addEventListener('keydown', e => {
    keys[e.code] = true;
    if (e.code === 'Space' && !e.repeat) state.jumpQueued = true;
    if (e.code === 'Space') e.preventDefault();
  });
  window.addEventListener('keyup', e => { keys[e.code] = false; });

  canvas.addEventListener('click', () => {
    if (!state.disabled && !document.pointerLockElement) canvas.requestPointerLock?.();
  });
  document.addEventListener('mousemove', e => {
    if (document.pointerLockElement !== canvas || state.disabled) return;
    state.yaw -= e.movementX * 0.0026;
    state.pitch = THREE.MathUtils.clamp(state.pitch - e.movementY * 0.0021, -0.22, 0.9);
  });

  function update(dt) {
    if (!state.disabled) {
      const f = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
      const r = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0);
      const fx = Math.sin(state.yaw), fz = Math.cos(state.yaw);
      const rx = Math.cos(state.yaw), rz = -Math.sin(state.yaw);
      dir.set(fx * f + rx * r, 0, fz * f + rz * r);
      if (dir.lengthSq() > 0) dir.normalize();
      const run = keys.ShiftLeft || keys.ShiftRight;
      const targetSpeed = run ? RUN : WALK;
      const desiredVX = dir.x * targetSpeed, desiredVZ = dir.z * targetSpeed;
      const k = 1 - Math.exp(-12 * dt);
      velocity.x += (desiredVX - velocity.x) * k;
      velocity.z += (desiredVZ - velocity.z) * k;

      if (state.jumpQueued && state.onGround) {
        velocity.y = JUMP; state.onGround = false; state.jumpQueued = false;
      }
      velocity.y -= GRAVITY * dt;

      const nx = root.position.x + velocity.x * dt;
      const nz = root.position.z + velocity.z * dt;
      if (!blockedAt(nx, root.position.z, colliders)) root.position.x = nx;
      else velocity.x = 0;
      if (!blockedAt(root.position.x, nz, colliders)) root.position.z = nz;
      else velocity.z = 0;
      root.position.x = THREE.MathUtils.clamp(root.position.x, -118, 118);
      root.position.z = THREE.MathUtils.clamp(root.position.z, -118, 118);

      root.position.y += velocity.y * dt;
      if (root.position.y <= 0) { root.position.y = 0; velocity.y = 0; state.onGround = true; }

      const planar = Math.hypot(velocity.x, velocity.z);
      state.speed = planar;
      if (planar > 0.55) {
        const want = Math.atan2(velocity.x, velocity.z);
        let d = ((want - root.rotation.y + Math.PI * 3) % (Math.PI * 2)) - Math.PI;
        state.turning = d;
        root.rotation.y += d * (1 - Math.exp(-10 * dt));
      }
      heroine.update(dt, planar, !state.onGround, state.turning);
    } else {
      state.speed = 0;
      heroine.update(dt, 0, false, 0);
    }

    // 第三人称相机：平滑跟随 + 遮挡缩短
    const dist = state.camDist, horiz = dist * Math.cos(state.pitch);
    target.set(root.position.x, root.position.y + 1.5, root.position.z);
    desired.set(
      root.position.x - Math.sin(state.yaw) * horiz,
      target.y + dist * Math.sin(state.pitch) + 0.9,
      root.position.z - Math.cos(state.yaw) * horiz
    );
    dir.copy(desired).sub(target);
    const length = dir.length(); dir.normalize();
    ray.set(target, dir); ray.far = length;
    const hits = ray.intersectObjects(occluders, false);
    if (hits.length) {
      const safe = Math.max(1.4, hits[0].distance - 0.35);
      desired.copy(target).addScaledVector(dir, safe);
    }
    if (!cameraInit) { camera.position.copy(desired); cameraInit = true; }
    else camera.position.lerp(desired, 1 - Math.exp(-9 * dt));
    camera.lookAt(target);
  }

  function focusOn(position, yaw) {
    root.position.copy(position);
    if (yaw !== undefined) state.yaw = yaw;
  }

  return { state, update, focusOn, keys };
}
