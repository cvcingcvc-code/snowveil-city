# 架构说明

## 引擎决策过程（真实记录）

| 检查项 | 结果 |
|---|---|
| 本机 Godot（PATH / 常见目录 / winget） | 未安装 |
| Blender | 未安装 |
| Node / npm | v22.22.2 / 10.9.7，可用 |
| GitHub `cvcingcvc-code/snowveil-city` | 存在，但为**空仓库**（size 0，无提交），创建于 2026-11-23 |
| Git 克隆 | 本次执行时代理 7890 与直连均超时，克隆失败；改为本地 `git init` + `feature/3d-prototype` 分支 |
| gh 认证 | token 无效，未执行任何 push |

**决策**：为遵守"未经确认不安装大型软件"，且优先交付可试玩的 3D 街角，阶段一/二采用 **Three.js WebGL + 本地 vendor 模块**（真实 3D，非伪 3D）。Godot 4 + GDScript 仍是用户首选正式引擎，是否下载引擎等待用户确认后决定迁移。

## 从 2D 原型复用的内容

复用文件：`../snow-city/js/story.js`（剧情文本、五章结构、三结局）、`js/world.js` 地点坐标与命名、`js/game.js` 的短信/对话/任务状态机思路。

不复用的内容：Canvas 渲染、2D 碰撞、2D 角色绘制、CSS 伪透视。所有渲染层重写。

解耦方式：剧情/任务数据集中在 `src/quest.js`，以纯数据 + 回调描述；渲染、输入、角色、车辆各自独立模块，任务系统不直接引用 Three.js 对象。

## 模块

```
src/
  main.js        启动、主循环、系统装配
  renderer.js    WebGLRenderer、后处理(Bloom)、灯光、雾、色调映射
  materials.js   Toon 色阶贴图、调色板、描边工具
  city.js        三维街角/街区生成、碰撞体注册、路牌、街灯、树、公交站
  character.js   程序化 anime 主角占位模型 + 分段动画
  player.js      输入、移动、跳跃、碰撞、第三人称相机与遮挡处理
  vehicle.js     车辆模型与驾驶
  npc.js         NPC 巡逻状态机与交互
  quest.js       第一章任务数据与状态机（与渲染解耦）
  snow.js        雪花粒子
  ui.js          HUD、对话、提示、任务日志
```

## 数据 / 资源目录

```
vendor/           Three.js 本地模块（three.module.js + jsm 子集）
assets/heroine.jpg  对话立绘，来源：用户上传的参考图
docs/             运行、架构、计划、素材、测试、验收文档
```

## 碰撞与导航

- 建筑、车辆使用 AABB；玩家使用水平圆形近似，逐轴推出解决穿墙。
- 相机遮挡：从角色头部向期望相机位置射线检测，命中则缩短镜头距离。
- 无寻路网格；NPC 使用硬编码巡逻点与简单状态机（idle / walk / talk）。
