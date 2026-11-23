import * as THREE from 'three';
import { createRenderSystem } from './renderer.js';
import { createCity } from './city.js';
import { createHeroine } from './character.js';
import { createPlayer } from './player.js';
import { createVehicle } from './vehicle.js';
import { createNPC } from './npc.js';
import { createSnow } from './snow.js';
import { createUI } from './ui.js';
import { createQuest, QUEST } from './quest.js';

const canvas = document.getElementById('scene');
const ui = createUI();

try {
  const params = new URLSearchParams(location.search);
  const sys = createRenderSystem(canvas);
  const { scene, camera, composer } = sys;
  if (params.get('quality') === 'low') sys.setQuality('low');
  const colliders = [];
  const city = createCity(scene, colliders);
  const occluders = [];
  city.root.traverse(o => { if (o.name === 'occluder') occluders.push(o); });

  const heroine = createHeroine();
  scene.add(heroine.root);

  const player = createPlayer({ camera, canvas, colliders, occluders, heroine });
  if (params.get('shot') === 'close') { player.state.camDist = 3.4; player.state.pitch = 0.12; }
  const vehicle = createVehicle({ scene, colliders, camera, x: -28, z: 0, color: 0x7f95b4 });

  const npcs = {};
  npcs.ache = createNPC({ scene, name: '阿澈', x: -18, z: -9.2, color: 0x7d9bbd, hairColor: 0x3d3b44 });
  npcs.k = createNPC({ scene, name: '老K', x: 20, z: 9.5, color: 0x8b8f7e, hairColor: 0x5b5750 });
  const ambient = [
    createNPC({ scene, name: '行人', x: 0, z: 22, color: 0xb98d96, patrol: [{ x: 0, z: 22 }, { x: 0, z: -22 }, { x: 0, z: 22 }] }),
    createNPC({ scene, name: '行人', x: -24, z: 0, color: 0x9db4a5, patrol: [{ x: -24, z: 0 }, { x: 24, z: 0 }] }),
    createNPC({ scene, name: '行人', x: 26, z: -9, color: 0xa694b5, patrol: [{ x: 26, z: -9 }, { x: 26, z: 20 }, { x: 26, z: -9 }] })
  ];
  const allNpcs = [npcs.ache, npcs.k, ...ambient];

  const snow = createSnow(scene);
  const quest = createQuest({ ui, npcs, onComplete: () => {
    ui.toast('任务完成 · 初雪来信');
    setTimeout(() => ui.showPanel('quest'), 700);
  } });
  quest.refresh();

  ui.setMode('第三人称');
  ui.setQuest(quest.step.hint);

  // 输入
  let paused = false;
  window.addEventListener('keydown', e => {
    if (e.repeat) return;
    if (e.code === 'KeyE' && !ui.isDialogueActive() && !paused) interact();
    if (e.code === 'KeyM' && !ui.isDialogueActive()) { ui.showPanel('quest'); quest.refresh(); }
    if (e.code === 'KeyH' && !ui.isDialogueActive()) ui.showPanel('help');
    if (e.code === 'Escape') {
      if (!document.getElementById('panel').classList.contains('hidden')) { ui.closePanel(); return; }
      paused = !paused;
      document.getElementById('pause').classList.toggle('hidden', !paused);
      if (paused && document.pointerLockElement) document.exitPointerLock();
    }
    if ((e.code === 'Space' || e.code === 'Enter') && ui.isDialogueActive()) ui.advanceDialogue();
  });
  document.getElementById('btn-resume').onclick = () => {
    paused = false; document.getElementById('pause').classList.add('hidden');
  };
  document.getElementById('btn-help').onclick = () => { ui.showPanel('help'); };

  function interact() {
    const p = player.state.position;
    if (vehicle.state.driving) {
      const out = vehicle.exit();
      heroine.root.visible = true;
      player.focusOn(out, vehicle.group.rotation.y);
      player.state.disabled = false;
      ui.setMode('第三人称');
      ui.toast('已下车');
      return;
    }
    const dCar = Math.hypot(p.x - vehicle.position.x, p.z - vehicle.position.z);
    if (dCar < 3.4) {
      vehicle.enter();
      heroine.root.visible = false;
      player.state.disabled = true;
      ui.setMode('驾驶中 · WASD 行驶，E 下车');
      ui.toast('已上车 · W 加速 / S 刹车倒车 / A D 转向');
      return;
    }
    let best = null, bd = 3.2;
    for (const n of allNpcs) {
      const d = Math.hypot(p.x - n.group.position.x, p.z - n.group.position.z);
      if (d < bd) { bd = d; best = n; }
    }
    if (best && best.onTalk) quest.interact(best.name === '阿澈' ? 'ache' : 'k');
    else if (best) ui.toast('「' + best.name + '」：今天的风真大。');
    else ui.toast('附近没有可互动的对象');
  }

  // 交互提示与任务标记
  const v3 = new THREE.Vector3();
  let fpsAcc = 0, fpsFrames = 0, fps = 0;
  let last = 0;

  function frame(now) {
    if (!last) last = now;
    const dt = Math.max(0, Math.min(0.05, (now - last) / 1000));
    last = now;
    fpsAcc += dt; fpsFrames++;
    if (fpsAcc >= 0.5) { fps = Math.round(fpsFrames / fpsAcc); fpsAcc = 0; fpsFrames = 0; ui.setMode((vehicle.state.driving ? '驾驶中' : '第三人称') + ' · ' + fps + ' FPS'); }

    const active = !paused && !ui.isDialogueActive();
    if (active) {
      if (!vehicle.state.driving) player.update(dt);
      vehicle.update(dt, player.keys);
      allNpcs.forEach(n => n.update(dt));
      snow.update(dt, camera.position);
      ui.tickDialogue(dt);

      const p = player.state.position;
      ui.playerPosition = p;

      // 最近可互动对象
      let prompt = null, bd = 3.4;
      const dCar = Math.hypot(p.x - vehicle.position.x, p.z - vehicle.position.z);
      if (dCar < bd) { prompt = vehicle.state.driving ? '下车' : '上车'; bd = dCar; }
      for (const n of allNpcs) {
        const d = Math.hypot(p.x - n.group.position.x, p.z - n.group.position.z);
        if (d < bd) { bd = d; prompt = '与 ' + n.name + ' 交谈'; }
      }
      if (prompt) ui.showInteract(prompt); else ui.hideInteract();

      // 任务目标屏幕标签
      const target = quest.index === 0 ? npcs.ache : (quest.index === 1 ? npcs.k : null);
      if (target) {
        v3.set(target.group.position.x, 2.5, target.group.position.z).project(camera);
        if (v3.z < 1 && Math.abs(v3.x) < 1 && Math.abs(v3.y) < 1) {
          ui.updateMarker('◆ ' + target.name, {
            x: (v3.x * 0.5 + 0.5) * window.innerWidth,
            y: (-v3.y * 0.5 + 0.5) * window.innerHeight
          });
        } else ui.updateMarker(null);
      } else ui.updateMarker(null);
    }

    composer.render();
    {
      document.getElementById('debug').textContent =
        'P=' + player.state.position.x.toFixed(1) + ',' + player.state.position.y.toFixed(1) + ',' + player.state.position.z.toFixed(1) +
        ' C=' + camera.position.x.toFixed(1) + ',' + camera.position.y.toFixed(1) + ',' + camera.position.z.toFixed(1) +
        ' V=' + heroine.root.visible + ' D=' + player.state.camDist + ' YAW=' + player.state.yaw.toFixed(2);
    }
    requestAnimationFrame(frame);
  }

  ui.hideLoading();
  ui.toast('点击画面锁定鼠标 · 靠近阿澈按 E 开始任务');
  requestAnimationFrame(frame);

  // 暴露给自动化测试 / 调试
  window.__SNOWVEIL__ = { sys, city, player, vehicle, npcs, quest, ui, colliders, scene };
} catch (err) {
  console.error(err);
  ui.fatal(err);
}
