// 真实应用渲染冒烟：jsdom 环境下挂载 App，切换四个路由。
// 用内存 localStorage 预置方案快照（IndexedDB 用极简 stub 兜底）。
(globalThis as unknown as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
import { JSDOM } from "jsdom";
import React from "react";
import { createRoot } from "react-dom/client";
import { act } from "react-dom/test-utils";
import { Provider } from "react-redux";
import { rootStore, repoApi } from "../src/stores/redux/store";
import { buildSeedData } from "../src/mocks/seedData";
import { STORAGE_CONSTANTS } from "../src/constants/appConfig";
import { App } from "../src/App";

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "http://localhost:20113/#/fixtures",
  pretendToBeVisual: true
});

const g = globalThis as unknown as Record<string, unknown>;
g.window = dom.window;
g.document = dom.window.document;
g.navigator = dom.window.navigator;
g.localStorage = dom.window.localStorage;
(dom.window as unknown as { requestAnimationFrame: (cb: (t: number) => void) => number }).requestAnimationFrame = (cb) =>
  setTimeout(() => cb(Date.now()), 0) as unknown as number;
g.requestAnimationFrame = (dom.window as unknown as { requestAnimationFrame: unknown }).requestAnimationFrame;
g.cancelAnimationFrame = clearTimeout;

// 极简 IndexedDB stub：open 成功，store 为内存 Map，get/put 都能 onsuccess，put 触发事务 complete
const memory = new Map<string, unknown>();
g.indexedDB = {
  open() {
    const request: Record<string, unknown> = {};
    const fakeDb = {
      objectStoreNames: { contains: () => true },
      transaction() {
        const tx: Record<string, unknown> = { oncomplete: null, onerror: null };
        tx.objectStore = () => ({
          get: (key: string) => {
            const r: Record<string, unknown> = {};
            setTimeout(() => {
              r.result = memory.get(key);
              r.onsuccess?.();
            }, 0);
            return r;
          },
          put: (value: unknown, key: string) => {
            memory.set(key, value);
            const r: Record<string, unknown> = {};
            setTimeout(() => {
              r.onsuccess?.();
              (tx.oncomplete as null | (() => void))?.();
            }, 0);
            return r;
          }
        });
        return tx;
      }
    };
    setTimeout(() => {
      request.result = fakeDb;
      request.onsuccess?.();
    }, 0);
    return request;
  }
};

// 预置本地快照，模拟“关掉页面再打开恢复”
dom.window.localStorage.setItem(STORAGE_CONSTANTS.LS_KEY, JSON.stringify(buildSeedData()));

let failures = 0;
const flush = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
process.on("uncaughtException", (error) => {
  failures++;
  console.error("✗ uncaughtException", error);
});
process.on("unhandledRejection", (reason) => {
  failures++;
  console.error("✗ unhandledRejection", reason);
});
function check(name: string, ok: boolean, extra = "") {
  if (!ok) {
    failures++;
    console.error(`✗ ${name} ${extra}`);
  } else console.log(`✓ ${name}`);
}

async function main() {
  repoApi.hydrate(buildSeedData());
  const container = dom.window.document.getElementById("root")!;
  createRoot(container).render(
    React.createElement(Provider, { store: rootStore }, React.createElement(App))
  );
  await flush(200);

  const html1 = dom.window.document.getElementById("root")!.innerHTML;
  check("灯具布置页渲染出舞台", html1.includes("舞台平面图"), html1.slice(0, 120));
  check("灯具布置页渲染出种子灯具", html1.includes("PAR-L-01"));
  check("侧栏渲染操作日志面板", html1.includes("操作日志"));

  for (const [hash, keyword] of [
    ["#/cues", "场景列表"],
    ["#/timeline", "时间轴图层"],
    ["#/preview", "舞台预览"],
    ["#/fixtures", "舞台平面图"]
  ] as const) {
    dom.window.location.hash = hash;
    dom.window.dispatchEvent(new dom.window.Event("hashchange"));
    await flush(30);
    check(`路由 ${hash} 渲染`, dom.window.document.getElementById("root")!.innerHTML.includes(keyword), hash);
  }

  dom.window.location.hash = "#/preview";
  dom.window.dispatchEvent(new dom.window.Event("hashchange"));
  await flush(30);
  check("预览页显示叠加场景栈", dom.window.document.getElementById("root")!.innerHTML.includes("叠加场景栈"));

  // 验证灯具创建流程经过 service/api 并写入 Redux
  const { saveFixture } = await import("../src/api/Fixture");
  await saveFixture({
    id: 0,
    fixture_code: "PAR-SMOKE-1",
    fixture_type: "PAR",
    position_x: 40,
    position_y: 40,
    dmx_address: 40,
    channel_count: 3,
    color_mode: "RGB"
  });
  await flush(200);
  const saved = rootStore.getState().repo.fixtures.some((f) => f.fixture_code === "PAR-SMOKE-1");
  check("通过 API 创建的灯具进入 Redux 仓库", saved);
  const logged = rootStore.getState().ui.logs.some((l) => l.message.includes("PAR-SMOKE-1"));
  check("创建灯具写入操作日志", logged);
  const persisted = dom.window.localStorage.getItem(STORAGE_CONSTANTS.LS_KEY) ?? "";
  check("写操作持久化到 localStorage", persisted.includes("PAR-SMOKE-1"));

  console.log(failures ? `\n${failures} 项失败` : "\n渲染冒烟全部通过");
  process.exit(failures ? 1 : 0);
}

void main();
