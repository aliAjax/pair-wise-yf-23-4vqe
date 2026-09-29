/**
 * 渲染冒烟：jsdom + fake-indexeddb 启动整棵 React 树，
 * 验证 IndexedDB 播种、四个 store 引导与四个页面挂载不报错。
 * env-setup 必须第一个导入。
 */
import "./env-setup.mts";
import { dom, flush } from "./env-setup.mts";
import { createRoot } from "react-dom/client";
import React from "react";
import { App } from "../src/App";

let failures = 0;
const report = (name: string, ok: boolean) => {
  console.log(ok ? `PASS ${name}` : `FAIL ${name}`);
  if (!ok) failures += 1;
};

async function main() {
  const root = createRoot(document.getElementById("root")!);
  root.render(React.createElement(App));
  await flush(800);

  const text = document.body.textContent ?? "";
  const checks: [string, boolean][] = [
    ["shell title", text.includes("舞台灯光编排")],
    ["fixtures page heading", text.includes("灯具布置")],
    ["seed fixture codes", text.includes("FACE-L-01")],
    ["DMX strip", text.includes("DMX512")],
    ["add fixture button", text.includes("新增灯具")]
  ];
  checks.forEach(([name, ok]) => report(name, ok));

  for (const [label, expected] of [
    ["场景编辑", "开场暖场"],
    ["时间轴编排", "高潮频闪"],
    ["舞台预览", "场景叠加栈"]
  ] as const) {
    const link = Array.from(document.querySelectorAll("a")).find((a) => a.textContent?.includes(label));
    link?.dispatchEvent(new dom.window.MouseEvent("click", { bubbles: true }));
    await flush(300);
    const bodyText = document.body.textContent ?? "";
    report(`${label} page renders`, bodyText.includes(expected));
  }

  report("timeline shows layer lock UI", (document.body.textContent ?? "").includes("锁定"));

  console.log(failures === 0 ? "\nRENDER SMOKE PASSED" : `\n${failures} RENDER FAILURES`);
  dom.window.close();
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
