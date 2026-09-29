/**
 * 交互冒烟：创建灯具（DMX 冲突被阻止、空闲地址成功并落 IndexedDB），
 * 时间轴片段同层重叠拒绝、不同层允许、锁层拒绝。
 * env-setup 必须第一个导入，以便 jsdom 全局先于 src 模块就位。
 */
import "./env-setup.mts";
import { dom, setNativeValue, flush } from "./env-setup.mts";
import { createRoot } from "react-dom/client";
import React from "react";
import { App } from "../src/App";
import { useFixtureStore } from "../src/stores/FixtureStore";
import { useCueSceneStore } from "../src/stores/CueSceneStore";
import { useTimelineTrackStore } from "../src/stores/TimelineTrackStore";
import * as FixtureApi from "../src/api/Fixture";
import { idbGetAll } from "../src/utils/db";
import { STORE_KEYS } from "../src/constants/storageKeys";
import { seedData } from "../src/mocks/seedData";

let failures = 0;
const report = (name: string, ok: boolean) => {
  console.log(ok ? `PASS ${name}` : `FAIL ${name}`);
  if (!ok) failures += 1;
};

async function main() {
  const root = createRoot(document.getElementById("root")!);
  root.render(React.createElement(App));
  await flush(400);

  const findButton = (label: string) =>
    Array.from(document.querySelectorAll("button")).find((b) => b.textContent?.includes(label)) as
      | HTMLButtonElement
      | undefined;

  // ---------- 1. 新增灯具表单 + DMX 冲突 ----------
  findButton("新增灯具")?.click();
  await flush();
  report("create fixture form opened", document.body.textContent?.includes("上架灯具") ?? false);

  const numberInputs = Array.from(document.querySelectorAll('input[type="number"]')) as HTMLInputElement[];
  const dmxInput = numberInputs[0];
  setNativeValue(dmxInput, "3"); // 与 fx-1 的 CH1-4 压线
  await flush();
  report("conflict warning visible", document.body.textContent?.includes("FACE-L-01") ?? false);

  const submit = findButton("上架灯具");
  report("submit disabled when DMX conflict", Boolean(submit?.disabled));

  setNativeValue(dmxInput, "39"); // 种子占用到 CH36，39 起 3 通道空闲
  const codeInput = document.querySelector('input[type="text"]') as HTMLInputElement;
  setNativeValue(codeInput, "TEST-99");
  await flush();
  report("submit enabled when address free", submit ? !submit.disabled : false);

  submit?.click();
  await flush(500);

  const created = useFixtureStore.getState().rows.find((f) => f.fixture_code === "TEST-99");
  report("fixture added to store at address 39", Boolean(created) && created!.dmx_address === 39);

  const persisted = await idbGetAll<{ fixture_code: string }>(STORE_KEYS.fixture);
  report("fixture persisted to IndexedDB", persisted.some((f) => f.fixture_code === "TEST-99"));
  const refetched = await FixtureApi.listFixture();
  report("api refetch (simulating reopen) includes fixture", refetched.some((f) => f.fixture_code === "TEST-99"));

  // ---------- 2. 时间轴重叠 / 锁层 ----------
  const trackStore = useTimelineTrackStore.getState();
  const cue1 = useCueSceneStore.getState().rows.find((s) => s.id === "cue-1")!;

  let rejected = false;
  try {
    await trackStore.create(
      { cue_scene_id: "cue-1", start_ms: 10000, duration_ms: 5000, layer: 1, locked: false },
      cue1
    );
  } catch (error) {
    rejected = (error as Error).message.includes("时间重叠");
  }
  report("same-layer overlap rejected via store", rejected);

  const created4 = await trackStore.create(
    { cue_scene_id: "cue-1", start_ms: 10000, duration_ms: 5000, layer: 4, locked: false },
    cue1
  );
  report("overlap allowed on a different layer", Boolean(created4));

  await trackStore.setLocked(created4, true);
  let lockedRejected = false;
  try {
    await trackStore.create(
      { cue_scene_id: "cue-1", start_ms: 20000, duration_ms: 3000, layer: 4, locked: false },
      cue1
    );
  } catch (error) {
    lockedRejected = (error as Error).message.includes("锁定");
  }
  report("locked layer rejects new clips", lockedRejected);

  report("seed has 6 timeline tracks", seedData.timelineTrack.length === 6);
  report("seed tracks never overlap within one layer", (() => {
    const byLayer = new Map<number, { begin: number; end: number }[]>();
    seedData.timelineTrack.forEach((t) => {
      const list = byLayer.get(t.layer) ?? [];
      list.push({ begin: t.start_ms, end: t.start_ms + t.duration_ms });
      byLayer.set(t.layer, list);
    });
    // 半开区间 [begin,end)：end == begin 的首尾相接允许
    for (const ranges of byLayer.values()) {
      for (let i = 0; i < ranges.length; i += 1) {
        for (let j = i + 1; j < ranges.length; j += 1) {
          if (ranges[i].begin < ranges[j].end && ranges[j].begin < ranges[i].end) return false;
        }
      }
    }
    return true;
  })());

  console.log(failures === 0 ? "\nINTERACTION SMOKE PASSED" : `\n${failures} INTERACTION FAILURES`);
  dom.window.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
