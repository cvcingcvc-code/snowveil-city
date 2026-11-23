/* 真实浏览器功能测试：通过 CDP 驱动页面，走完第一章任务 */
const targets = await (await fetch('http://127.0.0.1:9223/json')).json();
const page = targets.find(t => t.type === 'page' && t.url.includes('8123'));
if (!page) { console.error('找不到测试页面'); process.exit(1); }

const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.onopen = r);
let id = 0;
const pending = new Map();
ws.onmessage = e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
const send = (method, params = {}) => new Promise(res => {
  const i = ++id; pending.set(i, res);
  ws.send(JSON.stringify({ id: i, method, params }));
});
const ev = async expr => {
  const r = await send('Runtime.evaluate', { expression: expr, returnByValue: true, awaitPromise: true });
  if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.text);
  return r.result?.result?.value;
};
const wait = ms => new Promise(r => setTimeout(r, ms));
const results = [];
const check = (name, ok, detail = '') => {
  results.push({ name, ok, detail });
  console.log((ok ? 'PASS' : 'FAIL') + ' | ' + name + (detail ? ' | ' + detail : ''));
};

await send("Page.reload", {ignoreCache:true}); await wait(2500);
check('页面完成初始化', await ev('!!window.__SNOWVEIL__'));
check('Three.js 场景存在', await ev('window.__SNOWVEIL__.scene.children.length > 5'), await ev('String(window.__SNOWVEIL__.scene.children.length)') + ' 个场景对象');
check('建筑碰撞体已注册', await ev('window.__SNOWVEIL__.colliders.length >= 8'), await ev('String(window.__SNOWVEIL__.colliders.length)') + ' 个碰撞体');
check('初始任务目标为阿澈', await ev('window.__SNOWVEIL__.quest.index === 0 && window.__SNOWVEIL__.npcs.ache.highlighted'));

// 阶段 1：与阿澈对话领信
await ev('window.__SNOWVEIL__.quest.interact("ache")');
await wait(200);
check('对话已触发', await ev('window.__SNOWVEIL__.ui.isDialogueActive()'));
await ev('for(let i=0;i<30;i++) window.__SNOWVEIL__.ui.advanceDialogue();');
await wait(200);
check('领信后任务进入驾驶阶段', await ev('window.__SNOWVEIL__.quest.index === 1'), await ev('window.__SNOWVEIL__.ui ? "index="+window.__SNOWVEIL__.quest.index : ""'));
check('老K标记已点亮', await ev('window.__SNOWVEIL__.npcs.k.highlighted'));

// 阶段 2：上车并验证车辆能移动
const carBefore = await ev('window.__SNOWVEIL__.vehicle.position.x');
await ev('window.__SNOWVEIL__.vehicle.enter(); window.__SNOWVEIL__.player.keys.KeyW = true;');
await wait(3500);
await ev('window.__SNOWVEIL__.player.keys.KeyW = false;');
const carAfter = await ev('window.__SNOWVEIL__.vehicle.position.x');
check('车辆可驾驶位移', Math.abs(carAfter - carBefore) > 1.0, `x: ${carBefore.toFixed(1)} → ${carAfter.toFixed(1)}`);
await ev('window.__SNOWVEIL__.vehicle.exit()');

// 阶段 3：到东端公交站与老K交信
await ev('(()=>{const g=window.__SNOWVEIL__; g.vehicle.group.position.set(20,0,11); g.player.focusOn(g.vehicle.position); g.quest.interact("k");})()');
await wait(200);
await ev('for(let i=0;i<30;i++) window.__SNOWVEIL__.ui.advanceDialogue();');
await wait(300);
check('任务完成状态正确', await ev('window.__SNOWVEIL__.quest.completed === true && window.__SNOWVEIL__.quest.index === 2'));
check('完成后目标标记关闭', await ev('!window.__SNOWVEIL__.npcs.k.highlighted && !window.__SNOWVEIL__.npcs.ache.highlighted'));

// 阶段 4：玩家碰撞与边界
await ev('(()=>{const g=window.__SNOWVEIL__; g.player.state.position.set(-18,0,-8); g.player.state.yaw=Math.PI; g.player.keys.KeyW=true;})()');
await wait(1800);
await ev('window.__SNOWVEIL__.player.keys.KeyW=false');
const py = await ev('window.__SNOWVEIL__.player.state.position.z');
check('玩家朝建筑移动被碰撞阻挡', py > -11, `z=${py.toFixed(2)}（建筑前沿 z=-11）`);

const failed = results.filter(r => !r.ok);
console.log(`\n结果：${results.length - failed.length}/${results.length} 通过`);
ws.close();
process.exit(failed.length ? 1 : 0);
