export interface AppRoute {
  name: string;
  route: string;
  description: string;
}

/** 路由配置（哈希路由，纯前端静态部署友好，Nginx try_files 兜底） */
export const routes: AppRoute[] = [
  { name: "灯具布置", route: "/fixtures", description: "平面图摆灯与 DMX 通道校验" },
  { name: "场景编辑", route: "/cues", description: "设置颜色、亮度、淡入与优先级" },
  { name: "时间轴编排", route: "/timeline", description: "按图层排场景，重叠拦截与轨道锁定" },
  { name: "舞台预览", route: "/preview", description: "按播放时刻叠加场景试演" }
];

export const DEFAULT_ROUTE = routes[0].route;

export function resolveRoute(hash: string): AppRoute {
  const path = hash.replace(/^#/, "") || DEFAULT_ROUTE;
  return routes.find((route) => route.route === path) ?? routes[0];
}
