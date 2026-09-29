import { useEffect, useState } from "react";
import { useFixtureStore } from "../stores/FixtureStore";
import { useCueSceneStore } from "../stores/CueSceneStore";
import { useTimelineTrackStore } from "../stores/TimelineTrackStore";
import { useShowProjectStore } from "../stores/ShowProjectStore";

interface BootstrapState {
  ready: boolean;
  error: string | null;
  reload: () => Promise<void>;
}

/**
 * 应用启动时把方案、灯具、场景、轨道四个仓库从 IndexedDB 拉进 zustand。
 * 关掉页面再打开数据依旧存在，所有页面共用同一份内存态。
 */
export function useIndexedDbStore(): BootstrapState {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFixtures = useFixtureStore((state) => state.load);
  const loadCues = useCueSceneStore((state) => state.load);
  const loadTracks = useTimelineTrackStore((state) => state.load);
  const loadProjects = useShowProjectStore((state) => state.load);

  async function reload() {
    setReady(false);
    setError(null);
    try {
      // 并行加载四个 IndexedDB 仓库
      await Promise.all([loadFixtures(), loadCues(), loadTracks(), loadProjects()]);
      setReady(true);
    } catch (loadError) {
      setError((loadError as Error).message);
    }
  }

  useEffect(() => {
    void reload();
    // 仅在挂载时引导一次
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { ready, error, reload };
}
