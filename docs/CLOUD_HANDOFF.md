# 云端接手文档 / CLOUD HANDOFF

生成时间：2026-11-23　｜　本地根目录：`C:\Users\lin\WorkBuddy\2026-11-23-19-59-13\snowveil-3d`
目标仓库：`https://github.com/cvcingcvc-code/snowveil-city.git`　｜　迁移分支：`feat/cloud-migration`

> 本文件是接手入口。当前本地高负载开发已停止，未删除或重建任何项目文件。

## 1. 项目是什么

《Snowveil City / 雪落之城》3D 原型：以用户提供的银发红围巾少女插画为灵感，用 Three.js WebGL 实现的**真正三维**第三人称冬日街角可玩验证版。不是 2D、不是伪 3D。2D 前作在同级目录 `../snow-city/`，未被删除，也不在本次迁移范围内。

## 2. 架构

```
index.html              入口（import map 指向本地 vendor）
css/style.css           HUD / 对话 / 面板
src/main.js             装配与主循环、交互派发、任务标记投影
src/renderer.js         WebGLRenderer、灯光、雾、天空、Bloom、画质档
src/materials.js        Toon 色阶、调色板、描边、运行时 Canvas 贴图
src/city.js             三维街角/街区生成、碰撞体注册、街灯、树、公交站
src/character.js        程序化主角占位模型 + 分段动画
src/player.js           WASD/鼠标/Space/Shift、第三人称相机与遮挡、碰撞
src/vehicle.js          车辆模型与驾驶
src/npc.js              NPC 巡逻状态机与任务标记
src/quest.js            第一章任务数据与状态机（与渲染解耦）
src/snow.js             雪花粒子
src/ui.js               HUD、对话、提示、任务日志
tests/quest-flow.mjs    CDP 驱动的浏览器功能测试
vendor/                 Three.js r180 本地模块（离线可运行）
docs/                   架构、计划、素材、QA、验收、本文件
assets/heroine.jpg      用户提供的参考图，仅作对话立绘
```

剧情/任务数据与渲染层已解耦：`quest.js` 是纯数据 + 回调，可迁移到 Godot 的 Resource/GDScript。

## 3. 已完成功能

- 真实 3D 冬日街角：有高度/屋顶的建筑、道路、人行道、积雪、暖色窗光、街灯、松树、公交站、远景楼群与雾。
- 第三人称：WASD 移动、鼠标视角、Shift 奔跑、Space 跳跃、平滑跟随、建筑遮挡时相机缩短。
- 碰撞：建筑 AABB、玩家圆形碰撞逐轴推出、车辆碰撞、世界边界。
- NPC：巡逻/待机/交谈状态机、靠近提示、任务标记。
- 车辆：E 上下车、加速/刹车/转向、驾驶相机切换。
- 剧情：第一章《初雪来信》完整流程（阿澈领信 → 驾车 → 老K交信 → 完成）；对话、任务日志。
- 渲染：Toon 色阶、描边、暖冷光对比、雪花、轻量 Bloom、距离雾。
- 低画质开关：`?quality=low`（关闭阴影与 Bloom，像素比锁 1）。
- 真实截图：`docs/shots/street-corner-final.png`、`character-close-final.png`。
- 测试记录：`docs/QA.md`，`node tests/quest-flow.mjs` 曾 11/11 通过（本机 Chrome headless + SwiftShader）。

## 4. 已知问题 / 未验证

**待处理**
- 主角是程序化几何体占位模型，**不是最终 anime 角色建模/骨骼绑定**，不得对外宣称已完成。
- 城市只是街角 + 周边街区，不是完整 200m×200m 密度。
- 只实现一章；其余四章与三结局数据在 2D 原型 `../snow-city/js/story.js`，尚未迁移。
- `src/main.js` 与 `index.html` 保留了隐藏的 `#debug` 元素，仅用于测试读取相机位置，可安全删除。
- 无寻路网格，NPC 使用硬编码巡逻点。
- 云雾/暖光已改善，但离参考插画的电影感仍有明显差距。

**未验证（不要写成已完成）**
- GTX 1660 6GB / 1080p / 中等画质 30FPS：本机无该硬件；headless 软件渲染帧数不足，未取得有效 FPS 读数，未编造数字。
- Windows 独立 exe 打包、安装包、自动更新。
- Godot 4 迁移：本机未安装 Godot，下载引擎需用户确认；正式引擎未定。

**已修复的真实 Bug（历史记录）**
1. `three.module.js` 依赖 `three.core.js` 缺失导致 404 白屏 —— 已复制到 `vendor/`。
2. headless 时间戳基准差导致 `dt` 为负、相机插值发散 —— 已钳制 `dt` 并让相机首帧直接定位。
3. 出生点位于建筑投影内导致镜头贴脸 —— 已移到路口。
4. 画面对比度不足/过曝 —— 已调整曝光、环境光与 Toon 色阶。

## 5. 运行方式

```bash
git clone https://github.com/cvcingcvc-code/snowveil-city.git
cd snowveil-city
git checkout feat/cloud-migration
npm install
python -m http.server 8080
# 浏览器打开 http://127.0.0.1:8080/
```

- 需要 HTTP 服务，不能直接 `file://` 打开（ES Module 限制）。
- 操作：WASD / 鼠标 / Shift / Space / E / M / H / Esc。
- 验收路径：靠近咖啡店门口阿澈按 E → 驾车到东端公交站 → 找老K按 E → 任务完成。

## 6. 云端环境核查（如实记录）

- 当前会话运行在**本机 Windows 桌面**：`os=win32`，工作目录在 `C:\Users\lin\...`，所有命令实际在本机执行；本次迁移只使用本机做必要整理与 Git 推送。
- WorkBuddy 公开文档（Overview / Create-Task / Task-Management）提到「云端任务」这一任务形态（例如云端任务没有「打开文件夹」菜单），但**没有文档确认存在可独立访问 GitHub、执行代码与浏览器测试的云端开发沙箱**；当前会话也没有暴露这样的工具入口。
- 本机未安装任何连接器（connector 列表为空）；`gh auth status` 显示 token 无效；环境变量无 GitHub Token。Git 推送只能依赖本机 Git credential helper 中已有的凭据，若失败即为权限阻塞。
- 因此：**代码推送到 GitHub 不等于「已经迁移到独立云端开发环境」**。云端执行能力未经证实，不得声称已迁移成功。

## 7. 后续开发计划

1. 在可写 GitHub 的云端任务中 clone `feat/cloud-migration`，先按第 5 节跑起来并复测功能。
2. 决定正式引擎：若用户确认下载 Godot 4，则以 `quest.js` 数据为基础迁移；否则继续 Three.js 路线。
3. 扩充城市至 200m×200m，补建筑造型差异与地标。
4. 迁移剩余四章剧情与三结局；替换占位角色为正式 anime 模型与骨骼动画。
5. 目标硬件性能基准、低画质档位、Windows 打包。
6. 每完成一步更新 `docs/QA.md` 与 `docs/ACCEPTANCE.md`，不伪造截图、帧率或测试结果。

## 8. 给云端 Agent 的接手提示词（可直接复制）

> 从 `https://github.com/cvcingcvc-code/snowveil-city.git` 克隆仓库，切换到 `feat/cloud-migration` 分支，先读 `docs/CLOUD_HANDOFF.md`、`docs/ARCHITECTURE.md` 和 `docs/QA.md`。不要重建项目、不要删除已有文件。按 HTTP 服务方式运行并复验第一章任务。然后向用户确认正式引擎选择，再继续扩充。不要声称已完成未验证的性能或打包目标。
