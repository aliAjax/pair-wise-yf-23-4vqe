import { buildSeedData } from "../src/mocks/seedData";
import { findDmxConflict, assertFixtureSavable as validate, suggestNextDmxAddress } from "../src/services/FixtureService";
import { createDefaultFixture } from "../src/constructors/FixtureConstructor";
import { assertTrackPlaceable, snapToGrid } from "../src/services/TimelineService";
import { renderStageAt, timelineDuration } from "../src/services/playbackEngine";
import type { Fixture } from "../src/types/Fixture";
import type { TimelineTrack } from "../src/types/TimelineTrack";

const seed = buildSeedData();
let failures = 0;
function check(name: string, condition: boolean, extra = "") {
  if (!condition) {
    failures++;
    console.error(`✗ ${name} ${extra}`);
  } else {
    console.log(`✓ ${name}`);
  }
}

// 1. DMX 压道：种子灯具 1 占用 1-3，新灯起始 3、3ch（3-5）必须冲突
const candidate: Fixture = {
  ...createDefaultFixture({ id: 99, fixture_code: "PAR-X-99", dmx_address: 3, channel_count: 3 })
};
const conflict = findDmxConflict(candidate, seed.fixtures);
check("DMX 重叠地址被识别为冲突", conflict?.fixture_code === "PAR-L-01", JSON.stringify(conflict));

let blocked = false;
try {
  validate(candidate, seed.fixtures);
} catch (e) {
  blocked = (e as Error).message.includes("冲突");
}
check("DMX 压道时保存被拒绝", blocked);

// 2. 合法地址（50）通过
let legal = true;
try {
  validate({ ...candidate, dmx_address: 50 }, seed.fixtures);
} catch {
  legal = false;
}
check("空闲 DMX 地址可以保存", legal);

// 超 universe
let outOfRange = false;
try {
  validate({ ...candidate, dmx_address: 512 }, seed.fixtures);
} catch {
  outOfRange = true;
}
check("超出 512 通道被拒绝", outOfRange);

// 3. 推荐地址：最小空闲空洞（14 之后），且区间合法
const suggested = suggestNextDmxAddress(seed.fixtures, "RGB");
check("推荐地址落在不冲突的空闲空洞", suggested + 3 - 1 <= 512 && !findDmxConflict({ ...candidate, dmx_address: suggested }, seed.fixtures), `got ${suggested}`);

// 4. 时间轴同图层重叠拦截
const tracks = seed.tracks;
const overlapBlock: TimelineTrack = { id: 999, cue_scene_id: 3, start_ms: 1000, duration_ms: 3000, layer: 1, locked: false };
let overlapRejected = false;
try {
  assertTrackPlaceable(overlapBlock, tracks, seed.timeline_meta, "高潮频闪");
} catch (e) {
  overlapRejected = (e as Error).message.includes("重叠");
}
check("同图层重叠排期被挡住", overlapRejected);

// 首尾相接不算重叠（在空图层上构造 0-8s 已有块，新块 8-9s）
const touchingBase: TimelineTrack[] = [{ id: 1, cue_scene_id: 1, start_ms: 0, duration_ms: 8000, layer: 4, locked: false }];
const touchingBlock: TimelineTrack = { id: 999, cue_scene_id: 3, start_ms: 8000, duration_ms: 1000, layer: 4, locked: false };
let touchingOk = true;
try {
  assertTrackPlaceable(touchingBlock, touchingBase, seed.timeline_meta, "高潮频闪");
} catch {
  touchingOk = false;
}
check("同图层首尾相接允许通过", touchingOk);

// 不同图层同时段允许
const otherLayer: TimelineTrack = { id: 999, cue_scene_id: 3, start_ms: 1000, duration_ms: 3000, layer: 3, locked: false };
let otherOk = true;
try {
  assertTrackPlaceable(otherLayer, tracks, seed.timeline_meta, "高潮频闪");
} catch {
  otherOk = false;
}
check("不同图层同时段允许排期", otherOk);

// 锁定图层
let lockRejected = false;
try {
  assertTrackPlaceable(otherLayer, tracks, { layer_count: 4, locks: { 3: true } }, "高潮频闪");
} catch (e) {
  lockRejected = (e as Error).message.includes("锁定");
}
check("锁定图层拒绝排期", lockRejected);

check("拖拽吸附 500ms 网格", snapToGrid(1234) === 1000 && snapToGrid(1260) === 1500);

// 5. 播放引擎
// t=0 时 cue1 刚开始、fade 3000 -> 灯 1 未完全亮起
const at0 = renderStageAt(0, seed.fixtures, seed.cues, tracks);
const lamp1At0 = at0.find((r) => r.fixture.id === 1)!;
check("t=0 淡入起点灯光强度为 0", lamp1At0.intensity === 0, `intensity=${lamp1At0.intensity}`);

const at3000 = renderStageAt(3000, seed.fixtures, seed.cues, tracks);
const lamp1At3 = at3000.find((r) => r.fixture.id === 1)!;
check("淡入结束后亮度生效（暖场 55%）", Math.abs(lamp1At3.intensity - 0.55) < 0.001, `intensity=${lamp1At3.intensity}`);

// t=7000：图层1上 cue1(p10, 0-8s) 与 cue2(p30, 6-13s) 叠加，灯3 被高优先级蓝色覆盖
const at7000 = renderStageAt(7000, seed.fixtures, seed.cues, tracks);
const lamp3 = at7000.find((r) => r.fixture.id === 3)!;
check("高优先级场景颜色覆盖低优先级（灯3 变蓝）", lamp3.activeCues.includes("主唱蓝调"), lamp3.activeCues.join("/"));
check("高优先级在叠加栈顶端", lamp3.activeCues[lamp3.activeCues.length - 1] === "主唱蓝调");

// 灯1 只在 cue1 中，t=7000 保持暖色
const lamp1At7 = at7000.find((r) => r.fixture.id === 1)!;
check("未被高层覆盖的灯具保持低层颜色", lamp1At7.activeCues.length === 1 && lamp1At7.activeCues[0] === "开场暖场");

// 摇头灯位置插值：t=6000 cue2 刚开始 fade=0 位置=原位，t=7500 淡入完到目标 (50,55)
const beamAt6000 = renderStageAt(6000, seed.fixtures, seed.cues, tracks).find((r) => r.fixture.id === 5)!;
check("摇头灯淡入起点在原始灯位", beamAt6000.x === 50 && beamAt6000.y === 8, `(${beamAt6000.x},${beamAt6000.y})`);
const beamAt7500 = renderStageAt(7500, seed.fixtures, seed.cues, tracks).find((r) => r.fixture.id === 5)!;
check("摇头灯淡入结束移动到目标坐标", Math.abs(beamAt7500.x - 50) < 0.01 && Math.abs(beamAt7500.y - 55) < 0.01, `(${beamAt7500.x},${beamAt7500.y})`);

// 黑场：t=-1 或超出末尾
const dark = renderStageAt(-1, seed.fixtures, seed.cues, tracks);
check("无场景时刻全部熄灭", dark.every((r) => r.intensity === 0));

check("时间轴总时长取最晚轨道结束", timelineDuration(tracks) === 20000, `got ${timelineDuration(tracks)}`);

if (failures > 0) {
  console.error(`\n${failures} 项失败`);
  process.exit(1);
}
console.log("\n全部业务规则验证通过");
