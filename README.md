# 舞台灯光编排模拟器（stage-light）

纯浏览器端舞台灯光编排工具：在二维平面图上布置灯具并校验 DMX 通道，编辑场景的颜色/亮度/淡入时间，用多轨时间轴安排演出，按播放时刻在舞台预览上以优先级叠加场景。方案、灯具、场景和轨道全部存在本地 IndexedDB，关掉页面再打开可以继续编排。

## 快速启动

```bash
cp .env.example .env && docker compose up -d
```

启动后访问：<http://localhost:20113>

## 本地开发方式

```bash
cd frontend
npm install
npm run dev      # Vite 开发服务器，端口 20113
npm run build    # 类型检查 + 生产构建到 dist/
npm run preview  # 预览生产构建
```

### 本地冒烟测试（Node + jsdom，不依赖浏览器）

```bash
cd frontend
npm install
npm test   # 依次运行 logic / render / interactions / persist 四套冒烟
```

- `npm run test:logic`：DMX 压线/越界、同层时间重叠、锁层、优先级覆盖与淡入插值。
- `npm run test:render`：四个页面在 jsdom + fake-indexeddb 下完整挂载。
- `npm run test:interactions`：表单创建灯具（冲突禁用提交、空闲地址落库）、时间轴 store 拒绝重叠/锁层。
- `npm run test:persist`：模拟关页重开，确认首启播种不会覆盖用户已写入的数据。

## 访问地址或 CLI 示例

- 前端：<http://localhost:20113>
- 路由：
  - `/fixtures` 灯具布置
  - `/cues` 场景编辑
  `/timeline` 时间轴编排
  - `/preview` 舞台预览

## 核心功能与业务规则

### 灯具布置 `/fixtures`

- 二维舞台平面图，灯具可点击选中、直接拖拽摆位（坐标为 0-100 的百分比）。
- 新灯具的 DMX 起始地址会自动建议下一个空闲通道；手动输入地址若压到已有灯具通道，**保存按钮被禁用**，下方 DMX512 通道条标红并显示冲突灯具。
- 通道模式（RGB/RGBW/DIMMER_ONLY/MOVING_HEAD）决定默认通道数，可手动覆盖；地址超出 1-512 也会阻止保存。
- 整条 universe 占用可视化、按灯具类型筛选。

### 场景编辑 `/cues`

- 一个场景（CueScene）为多台灯具设置颜色（RGB/W）、亮度（DIMMER）与摇头灯目标坐标（X/Y）。
- 场景级参数：淡入时间、保持时间、优先级、状态（草稿/就绪/停用/归档）。
- 所有灯具状态调整即时保存到 IndexedDB；只有 **就绪（READY）** 状态的场景会参与时间轴试演。

### 时间轴编排 `/timeline`

- 多层轨道（layer），把场景从素材库拖到轨道上，或用「精确加入」填表。
- **同轨（同层）片段首尾可以相接但不能重叠**：拖入、移动、左右拖拽改时长都会做重叠校验，冲突时操作被拒绝并 toast 报错。
- 每层可一键 🔒 锁定/解锁，锁层上的片段无法拖动、改时长、删除，也不能放入新片段。
- 支持 0.5×/1×/2× 试演与时间轴内播放头。

### 舞台预览 `/preview`

- 按播放时刻叠加所有激活场景：逐台灯取**优先级最高**的命中场景（同优先级再按层号）。
- 颜色、亮度、摇头位置按场景淡入进度从黑场线性插值，灯具光斑/锥光/频闪按类型渲染。
- 右侧实时展示场景叠加栈（优先级、层、淡入进度）与每台灯的瞬时通道值。

### 本地持久化与方案

- 首次打开自动播种一套示例彩排数据；之后全部读写 IndexedDB（库名 `stage-light`，五个对象仓库：fixture / cueScene / timelineTrack / showProject / log）。
- 所有写操作记录操作日志（「📜 操作日志」查看）。
- 顶栏可切换/保存演出方案；「⬇ 导出方案 / ⬆ 导入方案」用 JSON 做本地备份与恢复，「↺ 恢复示例」回到种子数据。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 状态管理 | Zustand（四个实体各自独立 store + UI store） |
| 路由 | React Router 6（布局路由 + Outlet） |
| 本地存储 | IndexedDB（自封装 Promise 版 `utils/db.ts`），首次播种走 localStorage 标记 |
| 后端 | 无，纯前端；api 层按模型分文件异步封装 |
| 部署 | Docker Compose（多阶段构建 + Nginx） |

## 项目目录结构

```text
frontend/src/
├── api/                  # 按模型分文件的异步 API（IndexedDB 实现 + 首启播种）
├── services/             # 业务校验：DMX 压线、同层重叠、锁层、导入解析（抛 ServiceError）
├── stores/               # zustand 独立 store：Fixture/CueScene/TimelineTrack/ShowProject/Ui
├── types/                # Fixture/CueScene/TimelineTrack/ShowProject/FixtureState/...
├── constants/            # 枚举、日志模板、错误码/错误消息、存储键、播放常量、状态文案
├── constructors/         # 各实体默认表单/落库/导入构造器（禁止页面散写默认结构）
├── components/common/    # FixtureIcon CueCard TimelineRuler StageCanvas
│                         # ColorChannelSlider DmxBadge PlaybackControls ...
├── components/layout/     # AppShell（导航/方案切换/导入导出/日志抽屉）
├── hooks/                # useTimelinePlayback / useDmxAddressCheck / useIndexedDbStore
├── pages/                # fixtures/ cues/ timeline/ preview/ 四个路由页面（按域分子目录）
├── router/               # 路由表与导航条目
├── utils/                # db / dmx / timeline / playback / color / logger / errors / formatters / backup
└── mocks/                # seedData 本地种子（DMX 不压线、同层不重叠）
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`：Compose 项目名，默认 `stage-light`。
- `FRONTEND_PORT`：宿主机映射端口，默认 `20113`，容器内固定监听 80。

## Docker 部署说明

- 根 Compose 文件不写 `version`，顶层 `name: stage-light`。
- 仅编排 `frontend` 一个服务；`frontend/Dockerfile` 为 Node 构建 + Nginx 托管的多阶段构建。
- 容器名：`${COMPOSE_PROJECT_NAME:-stage-light}-frontend`。
- 端口映射：`${FRONTEND_PORT:-20113}:80`。
- 纯前端无数据库，不需要命名卷；所有用户数据在浏览器 IndexedDB 中。
- `frontend/nginx.conf` 配置 `try_files $uri $uri/ /index.html;` 支持 SPA 深链刷新。
- 常见问题：
  - 端口占用：改 `.env` 里的 `FRONTEND_PORT` 后 `docker compose up -d`。
  - 想清空编排数据：页面内「↺ 恢复示例」，或在浏览器 DevTools 删除 IndexedDB 库 `stage-light`。
  - 中文目录名：构建上下文用相对路径，不依赖绝对目录，可在任意目录名下启动。

## 枚举/常量出现位置清单

新增任意枚举值时，至少需要同步：常量与文案、类型、构造器默认值、日志/错误、formatters、列表筛选器、详情/徽标组件。

### FixtureType（PAR / SPOT / WASH / BEAM / STROBE）

- 常量与文案/光束元数据：`frontend/src/constants/FixtureType.ts`
- 类型：`frontend/src/types/FixtureType.ts`，聚合出口 `types/enums.ts`
- 构造器默认值：`constructors/FixtureConstructor.ts`（默认 PAR）
- 日志模板：`constants/logTemplates.ts`（Fixture 段）
- 错误消息：`constants/errorMessages.ts`（灯具编号/通道错误间接引用）
- 格式化：`utils/formatters.ts#formatFixtureType`，聚合文案 `constants/statusText.ts`
- 列表筛选器：`pages/fixtures/FixturesPage.tsx`（类型筛选 chip）
- 展示组件/控制器：`components/common/FixtureIcon.tsx`、`components/common/StageCanvas.tsx`（光束形态）、灯具表格

### CueStatus（DRAFT / READY / DISABLED / ARCHIVED）

- 常量/文案/配色：`frontend/src/constants/CueStatus.ts`
- 类型：`frontend/src/types/CueStatus.ts`
- 构造器默认值：`constructors/CueSceneConstructor.ts`（默认 DRAFT）
- 日志模板：`constants/logTemplates.ts`（CueScene.STATUS 使用 `CueStatusText`）
- 播放引擎：`utils/playback.ts`（仅 READY 参与合成）、时间轴素材库过滤 ARCHIVED
- 格式化：`utils/formatters.ts#formatStatus`，聚合文案 `constants/statusText.ts`
- 列表筛选器：`pages/cues/CuesPage.tsx`（状态筛选 + 行内切换）
- 展示组件：`components/common/StatusBadge.tsx`、`CueCard.tsx`、`TimelineBlock.tsx`、预览页场景栈

### ChannelMode（RGB / RGBW / DIMMER_ONLY / MOVING_HEAD）

- 常量/文案/默认通道数/通道标签：`frontend/src/constants/ChannelMode.ts`
- 类型：`frontend/src/types/ChannelMode.ts`
- 构造器默认值：`constructors/FixtureConstructor.ts`（默认 RGB，通道数按模式推导）
- 日志模板：`constants/logTemplates.ts`（Fixture 段）
- 格式化：`utils/formatters.ts#formatChannelMode`，聚合文案 `constants/statusText.ts`
- 列表/详情：灯具属性表单、灯具表格、灯具布置页只读面板的通道模式统计
- 展示组件/控制器：`pages/cues/SceneEditor.tsx`（按模式显示 W 通道与 PAN/TILT）、`StageCanvas.tsx`（摇头灯锥光指向 target_x/y）

## 为什么会牵一发动全身

实体字段、枚举、日志模板、错误码/消息、构造器、格式化、筛选器和展示组件被刻意拆分在 `constants / types / constructors / api / services / stores / hooks / components / pages / utils / mocks` 多个目录中：

- 写操作链路固定为 **页面 → zustand store（controller，包 ControllerError）→ service（校验 + 包 ServiceError + 写日志）→ api → IndexedDB**，任何一个字段改动会穿过 5 层以上文件。
- 枚举在 `constants` 与 `types` 双处声明，并经 `statusText` 聚合、`formatters` 转换、筛选器与徽标共同消费。
- `utils/formatters.ts` 故意混合时间码、时长、DMX 通道、状态文案与风险等级，多页面共同依赖。
- 新增配置需同步 `.env.example`、`docker-compose.yml`、`constants/storageKeys.ts`（IndexedDB 库/仓库名）。
- 每个实体都有独立构造器（表单默认值、落库对象、导入兜底），页面与 store 不散写默认结构。

## License

MIT
