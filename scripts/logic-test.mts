import { assertDmxAvailable, findDmxConflict, suggestNextAddress } from "../frontend/src/utils/dmx";
import { assertLayerAvailable, assertLayerUnlocked, findLayerOverlap, isLayerLocked } from "../frontend/src/utils/timeline";
import { composeSnapshot, getActiveCues } from "../frontend/src/utils/playback";
import { ServiceError } from "../frontend/src/utils/errors";
import { seedData } from "../frontend/src/mocks/seedData";
import type { Fixture } from "../frontend/src/types/Fixture";
import type { TimelineTrack } from "../frontend/src/types/TimelineTrack";

let failures = 0;
function check(name: string, cond: boolean) {
  if (cond) {
    console.log("PASS", name);
  } else {
    failures += 1;
    console.error("FAIL", name);
  }
}

function expectThrow(code: string, fn: () => void) {
  try {
    fn();
    failures += 1;
    console.error("FAIL expected throw", code);
  } catch (error) {
    check(`throws ${code}`, error instanceof ServiceError && error.code === code);
  }
}

// ---------- DMX ----------
const fixtures: Fixture[] = [
  { id: "a", fixture_code: "A", fixture_type: "PAR", position_x: 0, position_y: 0, dmx_address: 1, channel_count: 4, color_mode: "RGBW" },
  { id: "b", fixture_code: "B", fixture_type: "PAR", position_x: 0, position_y: 0, dmx_address: 5, channel_count: 3, color_mode: "RGB" }
];

check("seed DMX ranges do not overlap", seedData.fixture.every((f) => !findDmxConflict(f, seedData.fixture)));
check("adjacent ranges are not conflicts", findDmxConflict({ id: "c", dmx_address: 8, channel_count: 2 }, fixtures) === null);
check("overlapping range detected", findDmxConflict({ id: "c", dmx_address: 4, channel_count: 2 }, fixtures)?.id === "a");
expectThrow("DMX_ADDRESS_OVERLAP", () => assertDmxAvailable({ id: "c", fixture_code: "C", dmx_address: 6, channel_count: 4 }, fixtures));
expectThrow("DMX_ADDRESS_OUT_OF_RANGE", () => assertDmxAvailable({ id: "c", fixture_code: "C", dmx_address: 511, channel_count: 4 }, fixtures));
check("suggest next address = 8", suggestNextAddress(fixtures, 3) === 8);

// ---------- timeline ----------
const tracks: TimelineTrack[] = [
  { id: "t1", cue_scene_id: "cue-1", start_ms: 0, duration_ms: 5000, layer: 1, locked: false },
  { id: "t2", cue_scene_id: "cue-2", start_ms: 5000, duration_ms: 5000, layer: 1, locked: false },
  { id: "t3", cue_scene_id: "cue-3", start_ms: 0, duration_ms: 9000, layer: 2, locked: true }
];
check("same-layer touching edges allowed", findLayerOverlap({ id: "x", start_ms: 5000, duration_ms: 5000, layer: 1 }, tracks.filter((t) => t.id !== "t2")) === null);
check("same-layer overlap blocked", findLayerOverlap({ id: "x", start_ms: 4500, duration_ms: 1000, layer: 1 }, tracks)?.id === "t1");
check("same-layer overlap into next block detected", findLayerOverlap({ id: "x", start_ms: 5500, duration_ms: 1000, layer: 1 }, tracks)?.id === "t2");
check("different layers can overlap", findLayerOverlap({ id: "x", start_ms: 4500, duration_ms: 1000, layer: 3 }, tracks) === null);
check("layer 2 locked", isLayerLocked(2, tracks) === true && isLayerLocked(1, tracks) === false);
expectThrow("TRACK_OVERLAP", () => assertLayerAvailable({ id: "x", start_ms: 4500, duration_ms: 1000, layer: 1 }, tracks, "X"));
expectThrow("TRACK_LAYER_LOCKED", () => assertLayerUnlocked(2, tracks, "X"));

// ---------- playback composition ----------
const fx = seedData.fixture;
const scenes = seedData.cueScene;
const tl = seedData.timelineTrack;
const scenesById = new Map(scenes.map((s) => [s.id, s]));

// at 1000ms: cue-1 on layer1 fading in; cue-3 active on layer2 from 14s only
const active1 = getActiveCues(1000, tl, scenesById);
check("at 1s only cue-1 active", active1.length === 1 && active1[0].scene.id === "cue-1");

// at 15000ms: cue-2 (layer1, P6) and cue-3 (layer2, P8) overlap; cue-4 DRAFT excluded from 22-26s?
const active15 = getActiveCues(15000, tl, scenesById).map((a) => a.scene.id);
check("at 15s cue-2 + cue-3 active", active15.includes("cue-2") && active15.includes("cue-3") && active15.length === 2);

// cue-4 is DRAFT — active scenes still include DRAFT (only DISABLED/ARCHIVED excluded). Check spec: scene editing uses statuses; playback should probably exclude DRAFT too? Our impl includes DRAFT.
// fx-6 is in cue-1 (ended at 12s) and cue-2 (blue) only; at 15s fully faded -> b=200
const snap15 = composeSnapshot(15000, fx, tl, scenes);
check("fixture in lower-priority-only cue gets its color", snap15["fx-6"]!.b === 200 && snap15["fx-6"]!.sourceCueId === "cue-2");
// fx-3 is in cue-3 (P8) only
check("fx-3 lit by cue-3", snap15["fx-3"]!.active && snap15["fx-3"]!.dimmer === 255);

// priority override: build a custom timeline where cue-1(P5) and cue-2(P6) overlap 10-12s
const overlapTracks: TimelineTrack[] = [
  { id: "o1", cue_scene_id: "cue-1", start_ms: 0, duration_ms: 12000, layer: 1, locked: false },
  { id: "o2", cue_scene_id: "cue-2", start_ms: 10000, duration_ms: 14000, layer: 1, locked: false }
];
// 注意：合成引擎允许跨时刻重叠由调用方（service）保证同层不重叠；这里直接构造以验证优先级
const snap11 = composeSnapshot(11000, fx, overlapTracks, scenes);
const cue1State = scenes.find((s) => s.id === "cue-1")!.fixture_states["fx-1"]!;
const cue2State = scenes.find((s) => s.id === "cue-2")!.fixture_states["fx-1"]!;
const winner = snap11["fx-1"]!;
check("higher priority cue-2 wins fx-1 at 11s", winner.sourceCueId === "cue-2");
check("fade interpolation at 11s on cue-2 (progress = 1000/1500)", winner.dimmer > 0 && winner.dimmer < cue2State.dimmer);
check("fade progress math", Math.abs(winner.dimmer - cue2State.dimmer * (1000 / 1500)) < 0.01);
void cue1State;

// before 0 everything is black
const snapNeg = composeSnapshot(0, fx, tl, scenes);
check("at t=0 cue-1 has progress 0 -> dimmer 0", snapNeg["fx-1"]!.dimmer === 0);

// cue-4 is READY at 22-26s; a DRAFT scene must never play
const active23 = getActiveCues(23000, tl, scenesById);
check("READY cue-4 plays at 23s", active23.some((a) => a.scene.id === "cue-4"));
const draftTracks: TimelineTrack[] = [
  ...tl,
  { id: "t-draft", cue_scene_id: "cue-5", start_ms: 0, duration_ms: 60000, layer: 4, locked: false }
];
const draftActive = getActiveCues(23000, draftTracks, new Map(scenes.map((s) => [s.id, s])));
check("DRAFT cue-5 is excluded from playback even when on timeline", !draftActive.some((a) => a.scene.id === "cue-5"));

// at 25s: cue-2 (12-26), cue-3 first segment (14-26) and cue-4 (22-26) all active
const active25 = getActiveCues(25000, tl, scenesById).map((a) => a.scene.id);
check("at 25s cue-2 + cue-3 + cue-4 active together",
  active25.includes("cue-2") && active25.includes("cue-3") && active25.includes("cue-4"));

// at 31s: cue-1 again (30-38) and cue-3 second segment (26-32)
const snap31 = composeSnapshot(31000, fx, tl, scenes);
check("at 31s fx-1 lit by cue-1 again", snap31["fx-1"]!.sourceCueId === "cue-1");

console.log(failures === 0 ? "\nALL LOGIC TESTS PASSED" : `\n${failures} FAILURES`);
if (failures > 0) process.exit(1);
