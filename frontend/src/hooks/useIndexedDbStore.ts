import { useEffect, useState } from "react";
import type { ShowSnapshot } from "../types/ShowSnapshot";
import { loadLocalSnapshot } from "../stores/repository";
import { useRepository } from "../stores/repository";

export interface IndexedDbStoreState {
  loading: boolean;
  snapshot: ShowSnapshot | null;
  source: "localStorage" | "indexeddb" | "seed";
}

/**
 * 应用启动 hook：从 localStorage / IndexedDB 恢复方案，没有本地数据则使用种子。
 * 关掉页面再打开仍能继续编排。
 */
export function useIndexedDbStore(): IndexedDbStoreState & { reload: () => Promise<void> } {
  const hydrate = useRepository((state) => state.hydrate);
  const [loading, setLoading] = useState(true);
  const [snapshot, setSnapshot] = useState<ShowSnapshot | null>(null);
  const [source, setSource] = useState<IndexedDbStoreState["source"]>("seed");

  const reload = async () => {
    setLoading(true);
    const local = await loadLocalSnapshot();
    if (local) {
      hydrate(local);
      setSnapshot(local);
      setSource(local.saved_at ? "indexeddb" : "localStorage");
    }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const local = await loadLocalSnapshot();
      if (cancelled) return;
      if (local) {
        hydrate(local);
        setSnapshot(local);
        // localStorage 有镜像时优先标记为本地恢复（IDB 为冗余备份）
        setSource("localStorage");
      } else {
        setSource("seed");
      }
      useRepository.setState({ ready: true });
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [hydrate]);

  return { loading, snapshot, source, reload };
}
