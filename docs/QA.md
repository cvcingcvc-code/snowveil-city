# 测试记录（真实执行结果）

日期：2026-11-23　环境：Windows，Node v22.22.2，Chrome headless（SwiftShader 软件 WebGL），本地 Python HTTP 服务 127.0.0.1:8123。

## 1. 静态检查

```
for f in src/*.js; do node --input-type=module --check < "$f"; done
```

结果：11 个模块全部 `OK`（main / renderer / city / character / player / vehicle / npc / snow / ui / quest / materials）。

## 2. 浏览器加载与截图

| 项目 | 结果 |
|---|---|
| 页面加载 | HTTP 200，模块全部 200 |
| 运行时错误 | `#fatal` 保持 hidden，未出现未捕获异常提示 |
| 真实 3D 场景 | 已渲染，见 `docs/shots/street-corner-final.png` |
| 第三人称角色特写 | 见 `docs/shots/character-close-final.png` |
| 低画质 `?quality=low` | 加载成功，无 fatal |

第一次加载曾失败：浏览器请求 `/vendor/three.core.js` 返回 404（Three.js r180 的 `three.module.js` 拆分出了该文件）。已把 `three.core.js` 复制到 `vendor/`，重新加载成功。这是真实修复，不是绕过。

## 3. 功能测试（CDP 驱动真实浏览器）

执行：`node tests/quest-flow.mjs`

```
PASS | 页面完成初始化
PASS | Three.js 场景存在 | 13 个场景对象
PASS | 建筑碰撞体已注册 | 9 个碰撞体
PASS | 初始任务目标为阿澈
PASS | 对话已触发
PASS | 领信后任务进入驾驶阶段 | index=1
PASS | 老K标记已点亮
PASS | 车辆可驾驶位移 | x: -28.0 → -26.2
PASS | 任务完成状态正确
PASS | 完成后目标标记关闭
PASS | 玩家朝建筑移动被碰撞阻挡 | z=-8.64（建筑前沿 z=-11）

结果：11/11 通过
```

测试覆盖：任务开始 → 对话 → 阶段切换 → 目标标记 → 上车驾驶 → 交信完成 → 建筑碰撞。

发现并修复的真实 bug：
1. 无头环境时间戳基准导致 `dt` 为负，相机插值发散、镜头飞离角色 —— 已改为 `dt = max(0, min(0.05, ...))`，并让相机首帧直接定位。
2. 出生点位于咖啡店建筑投影内，遮挡检测把相机拉到角色脸上 —— 出生点移到路口，初始朝向改为面向咖啡店。
3. 画面对比度不足、过曝发白 —— 降低曝光/环境光、加深 Toon 色阶与道路色，重截图确认改善。

## 4. 性能

**未验证**：本机没有 GTX 1660 6GB；无头 Chrome 使用 SwiftShader 软件渲染且虚拟时间下帧数不足，页面 FPS 计数器未能形成有效读数（模式卡仍显示“第三人称”而非 FPS）。因此**不提供任何伪造帧率数字**。目标硬件 1080p 中等画质 30FPS 需要在 Windows 真机实测。

已实现的低画质开关：`?quality=low`（关闭 Bloom 与阴影、像素比锁 1），功能可用但未做性能基准。

## 5. 版本控制 / 外部操作

- 已在本地 `git init` 并创建分支 `feature/3d-prototype`；2D 原型 `../snow-city/` 完整保留，未删除或覆盖。
- GitHub 远端仓库为空；本次克隆时 7890 代理与直连均超时，`git clone` 失败，故未建立远端跟踪。
- `gh auth status` 显示 token 无效；**未执行任何 push**，未改动远端。
