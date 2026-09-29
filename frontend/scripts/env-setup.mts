/** jsdom + fake-indexeddb 环境，必须在任何 src 模块之前导入 */
import { JSDOM } from "jsdom";
import { IDBFactory } from "fake-indexeddb";

export const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', {
  url: "http://localhost:20113/fixtures",
  pretendToBeVisual: true
});

declare global {
  // eslint-disable-next-line no-var
  var __STAGE_LIGHT_ENV__: boolean;
}

export function installDomEnv() {
  globalThis.window = dom.window as unknown as Window & typeof globalThis;
  globalThis.document = dom.window.document;
  globalThis.navigator = dom.window.navigator;
  globalThis.HTMLElement = dom.window.HTMLElement as unknown as typeof HTMLElement;
  globalThis.Element = dom.window.Element as unknown as typeof Element;
  globalThis.Node = dom.window.Node as unknown as typeof Node;
  globalThis.Event = dom.window.Event as unknown as typeof Event;
  globalThis.MouseEvent = dom.window.MouseEvent as unknown as typeof MouseEvent;
  globalThis.KeyboardEvent = dom.window.KeyboardEvent as unknown as typeof KeyboardEvent;
  globalThis.PointerEvent = dom.window.PointerEvent as unknown as typeof PointerEvent;
  globalThis.requestAnimationFrame = ((cb: FrameRequestCallback) =>
    setTimeout(() => cb(performance.now()), 16)) as unknown as typeof requestAnimationFrame;
  globalThis.cancelAnimationFrame = ((id: number) => clearTimeout(id)) as unknown as typeof cancelAnimationFrame;
  globalThis.indexedDB = new IDBFactory() as unknown as IDBFactory;
  globalThis.localStorage = dom.window.localStorage;
  (dom.window as unknown as { matchMedia: unknown }).matchMedia = () => ({
    matches: false,
    addEventListener() {},
    removeEventListener() {}
  });
  globalThis.matchMedia = (dom.window as unknown as { matchMedia: typeof globalThis.matchMedia }).matchMedia;
  globalThis.__STAGE_LIGHT_ENV__ = true;
}

installDomEnv();

export function setNativeValue(input: Element, value: string) {
  const proto = Object.getPrototypeOf(input);
  const desc = Object.getOwnPropertyDescriptor(proto, "value");
  desc?.set?.call(input, value);
  input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  input.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
}

export function flush(ms = 150) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
