# 舞台灯光编排模拟器（stage-light）

纯前端舞台灯光彩排编排工具：在浏览器里布置灯具 DMX 通道、编辑场景（颜色/亮度/淡入）、按图层排时间轴、按播放时刻叠加试演；**方案、灯具、场景、轨道全部保存在本地（IndexedDB + localStorage 双写），关掉页面再打开可继续编排**。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

启动后访问：<http://localhost:20113>

## 访问地址或 CLI 示例

- 灯具布置：<http://localhost:20113/#/fixtures>
- 场景编辑：<http://localhost:20113/#/cues>
- 时间轴编排：<http://localhost:20113/#/timeline>
- 舞台预览：<http://localhost:20113/#/preview>

不使用 Docker 时可直接用任意静态服务器托管 `frontend/dist`（构建产物），或运行开发服务器。

## 本地开发方式

```bash
cd frontend
npm install
npm run dev        # http://localhost:20113
npm run build      # 类型检查 + 产物构建到 dist/
npm run preview    # 本地预览构建产物
```

仓库附带两个不依赖浏览器的验证脚本（需先 `npm install`）：

```bash
# 业务规则：DMX 压道、同轨重叠拦截、轨道锁定、预览叠加优先级/淡入/摇头灯插值
npx esbuild scripts/verify.ts --bundle --platform=node --format=esm --outfile=/tmp/verify.mjs && node /tmp/verify.mjs
```

## 功能说明

1. **灯具布置 `/fixtures`**：平面图摆灯（灯具卡片可拖到舞台），设置类型、通道模式（RGB/RGBW/DIMMER_ONLY/MOVING_HEAD）与 DMX 起始地址；**新灯具地址压到已有通道区间时实时告警并拒绝保存**，同时给出下一空闲地址建议与 512 通道拥挤度。
2. **场景编辑 `/cues`**：为每台灯设置颜色、亮度与（摇头灯）目标坐标，配置淡入时间、保持时间、叠加优先级与场景状态（草稿/可演出/停用/归档）；可保存多个场景并按状态筛选。
3. **时间轴编排 `/timeline`**：把场景库拖到图层轨道上，块可移动/拖尾改时长（500ms 吸附）；**同一图层区间重叠会被挡住**（首尾相接允许），图层可整轨锁定，锁定后不可新增/移动/删除。
4. **舞台预览 `/preview`**：按真实时间播放，当前时刻各轨道上的场景叠加渲染，**高优先级场景覆盖低优先级**的颜色/亮度，淡入期间颜色与摇头灯位置平滑过渡；右侧展示叠加场景栈与每台灯实时状态。
5. **方案管理**：侧栏编辑方案名/场地，支持整包导出/导入 JSON、一键重置内置演示编排；所有写操作都进“操作日志”面板。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | React 18 + TypeScript + Vite |
| 样式 | 原生 CSS 主题 + Tailwind CSS（工具类层，preflight 关闭） |
| 状态管理 | Redux Toolkit（`stores/redux`：repo/ui 切片 + Provider）；实体级独立 store（Zustand）订阅仓库作为缓存层 |
| 本地持久化 | IndexedDB（主持久层）+ localStorage（同步镜像秒开） |
| 路由 | 哈希路由（`router/`），适配纯静态 Nginx 托管 |
| 数据来源 | 本地 mock 种子（`mocks/seedData.ts`）+ 浏览器本地数据，无第三方 API |
| 部署 | Docker Compose（多阶段构建，Nginx 托管） |

## 项目目录结构

```text
frontend/src/
├── api/                  # 按模型分文件的 async 本地 API（Fixture/CueScene/TimelineTrack/ShowProject）
├── stores/               # Redux Toolkit 切片(redux/) + 四个实体独立 store + 仓库/UI 外观
├── types/                # 数据模型与枚举类型
├── constants/            # 枚举常量、错误码、错误消息、日志模板、状态文案、全局配置
├── constructors/         # 默认对象 / 表单对象 / 导入响应对象构造器
├── services/             # 业务规则：DMX 校验、时间轴重叠、播放叠加引擎、日志、业务异常
├── components/common/    # FixtureIcon / CueCard / TimelineRuler / StageCanvas / ColorChannelSlider 等
├── hooks/                # useTimelinePlayback / useDmxAddressCheck / useIndexedDbStore
├── pages/                # FixturesPage / CuesPage / TimelinePage / PreviewPage
├── router/               # 路由表与哈希路由 hook
├── utils/                # formatters（日期/时间/风险/状态混合）、color、indexedDb、id
├── mocks/                # 首次打开的内置演示编排
├── App.tsx               # 应用骨架（侧栏/导航/方案操作/日志/toast）
└── main.tsx              # Redux Provider 挂载入口
```

## 数据模型

| 模型 | 关键字段 | 关系 |
|---|---|---|
| Fixture 灯具 | id, fixture_code, fixture_type, position_x/y, dmx_address, channel_count, color_mode | 被场景灯态、方案引用 |
| CueScene 场景 | id, name, fixture_states（颜色/亮度/目标位）, fade_in_ms, hold_ms, priority, scene_status | 被轨道块引用 |
| TimelineTrack 轨道块 | id, cue_scene_id, start_ms, duration_ms, layer, locked | 图层锁定状态存于 timeline_meta |
| ShowProject 方案 | id, title, venue_name, fixture_ids, track_ids, updated_at | 聚合灯具与轨道 |

## 环境变量说明

- `COMPOSE_PROJECT_NAME`：Compose 项目名与容器名前缀，默认 `stage-light`
- `FRONTEND_PORT`：宿主机映射端口，默认 `20113`（容器内固定 80）

## Docker 部署说明

- 根目录 `docker-compose.yml` 顶层 `name: stage-light`，不写 `version:`，只编排 `frontend` 一个服务。
- 容器名：`${COMPOSE_PROJECT_NAME:-stage-light}-frontend`；端口映射：`${FRONTEND_PORT:-20113}:80`。
- `frontend/Dockerfile` 为 Node 构建 + Nginx 托管的多阶段构建；`frontend/nginx.conf` 配置了 `try_files $uri $uri/ /index.html;` 支持哈希路由刷新。
- 纯前端无数据库卷；数据保存在浏览器内（IndexedDB / localStorage），更换浏览器或清除站点数据会丢失，可用“导出 JSON”备份。
- 常见问题：
  - 端口占用：修改 `.env` 中 `FRONTEND_PORT` 后 `docker compose up -d`。
  - 在任意目录名（含中文目录）下均可构建启动，构建上下文只依赖 `frontend/`。
  - 想恢复内置演示编排：页面侧栏点“重置演示”，或清除站点数据后刷新。

## 枚举/常量出现位置清单

- **FixtureType（PAR / SPOT / WASH / BEAM / STROBE）**：
  `types/FixtureType.ts`、`constants/FixtureType.ts`（文案）、`constructors/FixtureConstructor.ts`、`mocks/seedData.ts`、`constants/logTemplates.ts`、`constants/errorMessages.ts`、`constants/statusText.ts`、`utils/formatters.ts`、`stores/FixtureStore.ts`、`services/FixtureService.ts`、`components/common/FixtureIcon.tsx`、`pages/FixturesPage.tsx`（类型筛选）、`pages/CuesPage.tsx`。
- **CueStatus（DRAFT / READY / DISABLED / ARCHIVED）**：
  `types/CueStatus.ts`、`constants/CueStatus.ts`（文案 + 可播放集合）、`constructors/CueSceneConstructor.ts`、`mocks/seedData.ts`、`constants/logTemplates.ts`、`constants/errorMessages.ts`、`constants/statusText.ts`、`utils/formatters.ts`、`stores/CueSceneStore.ts`、`services/CueSceneService.ts`、`components/common/StatusBadge.tsx`、`components/common/CueCard.tsx`、`pages/CuesPage.tsx`（状态筛选）、`pages/TimelinePage.tsx`（图例）、`services/playbackEngine.ts`（可播放过滤）。
- **ChannelMode（RGB / RGBW / DIMMER_ONLY / MOVING_HEAD）**：
  `types/ChannelMode.ts`、`constants/ChannelMode.ts`（文案 + 通道占用表）、`constructors/FixtureConstructor.ts`、`constants/logTemplates.ts`、`constants/errorMessages.ts`、`constants/statusText.ts`、`utils/formatters.ts`、`services/FixtureService.ts`（通道数与推荐地址）、`stores/FixtureStore.ts`、`components/common/ColorChannelSlider.tsx`（摇头灯坐标）、`pages/FixturesPage.tsx`、`pages/CuesPage.tsx`。

## 为什么会牵一发动全身

- 枚举在 `types/` 与 `constants/` 双侧定义，文案、日志模板、错误消息、筛选器、图标和格式化函数分文件引用，新增一个枚举值至少触达 7 个以上文件。
- 每个写操作链路跨 `constructors → api(localClient 包装) → services(规则+BusinessError+日志) → Redux 切片 → 实体 store → 页面/共享组件`，并被 `utils/formatters` 等公共模块横向依赖。
- 本地持久化逻辑分散在 `constants/appConfig`（键名）、`utils/indexedDb`、`stores/redux/store`（订阅防抖双写）、`hooks/useIndexedDbStore`（启动恢复）四处，改动存储格式需同步版本号与导入构造器。

## License

MIT
