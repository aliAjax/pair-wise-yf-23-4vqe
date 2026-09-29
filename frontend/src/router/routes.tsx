import type { RouteObject } from "react-router-dom";
import { FixturesPage } from "../pages/FixturesPage";
import { CuesPage } from "../pages/CuesPage";
import { TimelinePage } from "../pages/TimelinePage";
import { PreviewPage } from "../pages/PreviewPage";
import { AppShell } from "../components/layout/AppShell";

/** 页面路由（四个核心页面，灯具布置为默认入口） */
export const pageRoutes: RouteObject[] = [
  { path: "/fixtures", element: <FixturesPage /> },
  { path: "/cues", element: <CuesPage /> },
  { path: "/timeline", element: <TimelinePage /> },
  { path: "/preview", element: <PreviewPage /> },
  { path: "/", element: <FixturesPage /> },
  { path: "*", element: <FixturesPage /> }
];

/** 完整路由：AppShell 作为布局层，页面通过 Outlet 挂载 */
export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: pageRoutes
  }
];

export interface NavEntry {
  name: string;
  route: string;
  icon: string;
  description: string;
}

export const navEntries: NavEntry[] = [
  { name: "灯具布置", route: "/fixtures", icon: "💡", description: "灯位与 DMX 通道" },
  { name: "场景编辑", route: "/cues", icon: "🎨", description: "颜色 / 亮度 / 淡入" },
  { name: "时间轴编排", route: "/timeline", icon: "🎚️", description: "片段叠层与锁定" },
  { name: "舞台预览", route: "/preview", icon: "🎭", description: "按时刻试演合成" }
];
