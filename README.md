# Snowveil City / 雪落之城 — 3D 原型

> 本地开发已暂停，项目已整理准备云端接手。迁移分支：`feat/cloud-migration`　｜　目标仓库：`https://github.com/cvcingcvc-code/snowveil-city.git`　｜　状态：**阶段一/二 prototype，真实 WebGL 3D，非最终引擎版本**

> 接手必读：`docs/CLOUD_HANDOFF.md`。当前版本保留全部代码、素材、场景、截图与测试记录，未重建、未删除。

## 这是什么

基于 2D 原型 `../snow-city/` 的剧情与任务数据，制作的**真正三维**第三人称冬日街角可玩验证版。
使用 Three.js（WebGL）渲染，全部资源本地化，无 CDN 依赖，不是 CSS 透视或伪 3D。

## 本地运行（已暂停，仅供历史记录）

```bash
cd snowveil-3d
python -m http.server 8080
# 浏览器打开 http://127.0.0.1:8080/
```

> ES Module + import map 需要通过 HTTP 访问；直接双击 `index.html` 可能被浏览器模块策略拦截。

## 操作

| 键位 | 功能 |
|---|---|
| WASD | 相机相对移动 |
| 鼠标 | 第三人称视角旋转（点击画面锁定指针，Esc 解锁） |
| Shift | 奔跑 |
| Space | 跳跃 |
| E | 互动 / 上下车 |
| M | 任务日志 |
| H | 帮助 |
| Esc | 暂停 / 释放鼠标 |

## 快速验收

1. 打开后看到有高度与屋顶的真实三维雪城街角，镜头平滑跟随角色。
2. WASD 自由行走，Shift 奔跑，Space 跳跃，撞墙会被挡住。
3. 靠近咖啡店门口的阿澈按 E，接到「初雪来信」任务。
4. 走到街对面的车旁按 E 上车，驾驶到东端公交站，按 E 下车。
5. 找到老K按 E 交信，任务显示完成。
6. 按 M 查看任务日志，状态为已完成。

## 当前已知限制（未伪装为已完成）

- 主角是**程序化生成的临时占位三维角色**（有基础分段动画），不是最终 anime 角色建模与骨骼绑定。
- 城市目前是「精品街角 + 周边街区」，不是完整 200m×200m 全密度城市。
- 剧情只实现第一章《初雪来信》一个完整任务；2D 版的其余四章数据保留在 `src/quest.js` 注释与 `../snow-city/js/story.js` 中，尚未迁移。
- 性能目标（GTX 1660 / 1080p / 30FPS）**尚未在目标硬件实测**，仅记录本机头less软件渲染结果，见 `docs/QA.md`。
- Windows 独立打包尚未执行。
- Godot 4 未安装；正式引擎选择待用户确认，见 `docs/PHASE_PLAN.md`。

## 启动方法（供接手环境参考）

```bash
git clone https://github.com/cvcingcvc-code/snowveil-city.git
cd snowveil-city
git checkout feat/cloud-migration
npm install
python -m http.server 8080
# 浏览器打开 http://127.0.0.1:8080/
```

> 本项目把 Three.js 模块放在 `vendor/`，`node_modules/` 仅用于记录依赖版本；不联网 CDN 也能运行。
> ES Module + import map 需要 HTTP 访问，不能直接用 `file://` 双击打开。

## 下一步计划

1. 云端接手后先跑 `node tests/quest-flow.mjs` 对应的浏览器测试（需要可访问的 HTTP 服务与浏览器调试端口）。
2. 确认正式引擎：Godot 4 下载/安装需要用户确认；当前原型是 Three.js WebGL 路线。
3. 扩充城市密度、迁移剩余四章剧情与三结局、替换占位角色。
4. 目标硬件性能实测与 Windows 独立打包。

## 文档

- `docs/CLOUD_HANDOFF.md` — **云端接手入口**：架构、已完成、待修 Bug、运行与后续计划
- `docs/ARCHITECTURE.md` — 架构与可复用逻辑
- `docs/PHASE_PLAN.md` — 五阶段计划与当前状态
- `docs/ASSETS.md` — 素材来源与许可证
- `docs/QA.md` — 真实测试记录
- `docs/ACCEPTANCE.md` — 验收清单（逐项标注真实状态）
