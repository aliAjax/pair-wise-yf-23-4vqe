/** 颜色工具：hex/rgb 解析、亮度缩放、按透明度混合，供 ColorChannelSlider 与 StageCanvas 共用 */

export function clampChannel(value: number): number {
  return Math.max(0, Math.min(255, Math.round(value)));
}

export function clampRatio(value: number): number {
  return Math.max(0, Math.min(1, value));
}

export interface RgbColor {
  r: number;
  g: number;
  b: number;
}

export function parseHexColor(hex: string): RgbColor {
  const normalized = hex.replace("#", "").trim();
  const full = normalized.length === 3 ? normalized.split("").map((c) => c + c).join("") : normalized;
  const value = /^[0-9a-fA-F]{6}$/.test(full) ? full : "000000";
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16)
  };
}

export function toHexColor({ r, g, b }: RgbColor): string {
  return "#" + [r, g, b].map((v) => clampChannel(v).toString(16).padStart(2, "0")).join("");
}

/** 应用亮度（0-100） */
export function applyBrightness(hex: string, brightness: number): RgbColor {
  const { r, g, b } = parseHexColor(hex);
  const ratio = clampRatio(brightness / 100);
  return { r: r * ratio, g: g * ratio, b: b * ratio };
}

/** 两种颜色按 t 线性插值（t=0 全 a，t=1 全 b） */
export function mixColor(a: RgbColor, b: RgbColor, t: number): RgbColor {
  const ratio = clampRatio(t);
  return {
    r: a.r + (b.r - a.r) * ratio,
    g: a.g + (b.g - a.g) * ratio,
    b: a.b + (b.b - a.b) * ratio
  };
}

export function rgbCss({ r, g, b }: RgbColor, alpha = 1): string {
  return `rgba(${clampChannel(r)}, ${clampChannel(g)}, ${clampChannel(b)}, ${clampRatio(alpha)})`;
}

/** 相对亮度，用于决定灯具图标上的文字用深色还是浅色 */
export function isLightColor({ r, g, b }: RgbColor): boolean {
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}
