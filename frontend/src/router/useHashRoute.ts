import { useEffect, useState } from "react";
import { resolveRoute, DEFAULT_ROUTE } from "./routes";
import type { AppRoute } from "./routes";

/** 极简哈希路由：不引入 react-router，保持纯前端单镜像部署 */
export function useHashRoute(): [AppRoute, (path: string) => void] {
  const [route, setRoute] = useState<AppRoute>(() => resolveRoute(window.location.hash));

  useEffect(() => {
    const onHashChange = () => setRoute(resolveRoute(window.location.hash));
    window.addEventListener("hashchange", onHashChange);
    if (!window.location.hash) window.location.hash = DEFAULT_ROUTE;
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const navigate = (path: string) => {
    window.location.hash = path;
  };

  return [route, navigate];
}
