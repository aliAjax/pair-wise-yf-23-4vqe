import { useEffect, useMemo, useState } from "react";
import type { CueScene } from "../types/CueScene";
import type { CueStatus } from "../types/CueStatus";
import type { FixtureState } from "../types/Fixture";
import { useCueSceneStore } from "../stores/CueSceneStore";
import { useFixtureStore } from "../stores/FixtureStore";
import { useUiStore } from "../stores/UiStore";
import { CUE_STATUSES, CUE_STATUS_TEXT, PLAYABLE_CUE_STATUSES } from "../constants/CueStatus";
import { FIXTURE_TYPE_TEXT } from "../constants/FixtureType";
import { TIMELINE_CONSTANTS } from "../constants/appConfig";
import { createDefaultCueScene } from "../constructors/CueSceneConstructor";
import { createDefaultFixtureState } from "../constructors/FixtureConstructor";
import { upsertFixtureState, removeFixtureState } from "../services/CueSceneService";
import { CueCard } from "../components/common/CueCard";
import { ColorChannelSlider } from "../components/common/ColorChannelSlider";
import { FixtureIcon } from "../components/common/FixtureIcon";
import { EmptyState } from "../components/common/EmptyState";
import { formatClockSeconds } from "../utils/formatters";

export function CuesPage() {
  const cues = useCueSceneStore((state) => state.rows);
  const filterStatus = useCueSceneStore((state) => state.filterStatus);
  const setFilterStatus = useCueSceneStore((state) => state.setFilterStatus);
  const saveCue = useCueSceneStore((state) => state.save);
  const removeCue = useCueSceneStore((state) => state.remove);
  const setStatus = useCueSceneStore((state) => state.setStatus);
  const fixtures = useFixtureStore((state) => state.rows);
  const pushToast = useUiStore((state) => state.pushToast);

  const [selectedId, setSelectedId] = useState<number | null>(cues[0]?.id ?? null);
  const selected = cues.find((cue) => cue.id === selectedId) ?? cues[0] ?? null;

  // 名称输入本地缓冲，失焦再保存，避免每敲一个字就持久化
  const [liveName, setLiveName] = useState(selected?.name ?? "");
  useEffect(() => {
    setLiveName(selected?.name ?? "");
  }, [selected?.id, selected?.name]);

  const filteredCues = useMemo(
    () => (filterStatus === "ALL" ? cues : cues.filter((cue) => cue.scene_status === filterStatus)),
    [cues, filterStatus]
  );

  const createCue = async () => {
    const draft = createDefaultCueScene({ name: `新场景 ${cues.length + 1}` });
    try {
      const saved = await saveCue(draft);
      setSelectedId(saved.id);
      pushToast("success", `已创建场景「${saved.name}」，记得设为可演出`);
    } catch (error) {
      pushToast("error", (error as Error).message);
    }
  };

  const patchCue = async (patch: Partial<CueScene>) => {
    if (!selected) return;
    const next = { ...selected, ...patch };
    setSelectedId(next.id);
    try {
      await saveCue(next);
    } catch (error) {
      pushToast("error", (error as Error).message);
    }
  };

  const toggleFixture = (fixtureId: number) => {
    if (!selected) return;
    const exists = selected.fixture_states.some((state) => state.fixture_id === fixtureId);
    const next = exists
      ? removeFixtureState(selected, fixtureId)
      : upsertFixtureState(selected, createDefaultFixtureState(fixtureId));
    void patchCue({ fixture_states: next.fixture_states });
  };

  const changeState = (state: FixtureState) => {
    if (!selected) return;
    const next = upsertFixtureState(selected, state);
    void patchCue({ fixture_states: next.fixture_states });
  };

  const cycleStatus = async (cue: CueScene) => {
    const order: CueStatus[] = [...CUE_STATUSES];
    const next = order[(order.indexOf(cue.scene_status) + 1) % order.length];
    await setStatus(cue.id, next);
    pushToast("info", `「${cue.name}」状态：${CUE_STATUS_TEXT[next]}`);
  };

  const stateByFixture = useMemo(
    () => new Map(selected?.fixture_states.map((state) => [state.fixture_id, state]) ?? []),
    [selected]
  );

  const flushName = () => {
    if (selected && liveName !== selected.name) void patchCue({ name: liveName });
  };

  return (
    <div className="page-grid page-grid-cues">
      <section className="panel">
        <div className="panel-head">
          <h2>场景列表</h2>
          <button type="button" className="btn btn-primary" onClick={() => void createCue()}>＋ 新建场景</button>
        </div>
        <div className="filter-row">
          <button type="button" className={"chip" + (filterStatus === "ALL" ? " is-active" : "")} onClick={() => setFilterStatus("ALL")}>全部</button>
          {CUE_STATUSES.map((status) => (
            <button key={status} type="button"
              className={"chip" + (filterStatus === status ? " is-active" : "")}
              onClick={() => setFilterStatus(status)}>{CUE_STATUS_TEXT[status]}</button>
          ))}
        </div>
        {filteredCues.length === 0 ? <EmptyState title="没有场景" hint="新建一个场景并给灯具设置颜色" /> : (
          <div className="cue-list">
            {filteredCues.map((cue) => (
              <CueCard key={cue.id} cue={cue} fixtures={fixtures}
                selected={selected?.id === cue.id}
                onSelect={(item) => setSelectedId(item.id)}
                onStatusClick={(item) => void cycleStatus(item)} />
            ))}
          </div>
        )}
      </section>

      {selected ? (
        <section className="panel">
          <div className="panel-head">
            <h2>编辑场景</h2>
            <button type="button" className="btn btn-danger btn-small"
              onClick={() => {
                if (window.confirm(`删除场景「${selected.name}」？时间轴上的排期也会移除。`)) {
                  void removeCue(selected.id).then(() => pushToast("info", "场景已删除"));
                }
              }}>删除</button>
          </div>

          <div className="form-grid">
            <label className="span-2">
              <span>场景名称</span>
              <input value={selected.name} onChange={(event) => setLiveName(event.target.value)}
                onBlur={() => void flushName()} />
            </label>
            <label>
              <span>淡入时间（ms）</span>
              <input type="number" min={0} step={100} value={selected.fade_in_ms}
                onChange={(event) => void patchCue({ fade_in_ms: Number(event.target.value) })} />
            </label>
            <label>
              <span>保持时间（ms）</span>
              <input type="number" min={0} step={100} value={selected.hold_ms}
                onChange={(event) => void patchCue({ hold_ms: Number(event.target.value) })} />
            </label>
            <label>
              <span>优先级（0-{TIMELINE_CONSTANTS.MAX_SCENE_PRIORITY}，高者覆盖）</span>
              <input type="number" min={0} max={TIMELINE_CONSTANTS.MAX_SCENE_PRIORITY} value={selected.priority}
                onChange={(event) => void patchCue({ priority: Number(event.target.value) })} />
            </label>
            <label>
              <span>演出状态</span>
              <select value={selected.scene_status} onChange={(event) => void patchCue({ scene_status: event.target.value as CueStatus })}>
                {CUE_STATUSES.map((status) => <option key={status} value={status}>{CUE_STATUS_TEXT[status]}</option>)}
              </select>
            </label>
          </div>

          <p className="section-hint">
            淡入 {formatClockSeconds(selected.fade_in_ms)} · 保持 {formatClockSeconds(selected.hold_ms)} ·
            {" "}仅「{PLAYABLE_CUE_STATUSES.map((status) => CUE_STATUS_TEXT[status]).join("、")}」状态参与时间轴播放
          </p>

          <h3 className="subhead">选择灯具并设置通道</h3>
          {fixtures.length === 0 ? <EmptyState title="还没有灯具" hint="先去灯具布置页上架灯具" /> : (
            <div className="cue-fixture-editor">
              {fixtures.map((fixture) => {
                const state = stateByFixture.get(fixture.id);
                return (
                  <div key={fixture.id} className={"cue-fixture" + (state ? " is-on" : "")}>
                    <button type="button" className="cue-fixture-head" onClick={() => toggleFixture(fixture.id)}>
                      <FixtureIcon type={fixture.fixture_type} active={Boolean(state)} />
                      <span>
                        <strong>{fixture.fixture_code}</strong>
                        <em>{FIXTURE_TYPE_TEXT[fixture.fixture_type]}</em>
                      </span>
                      <span className={"switch " + (state ? "is-on" : "")}>{state ? "已选" : "添加"}</span>
                    </button>
                    {state ? <ColorChannelSlider fixture={fixture} state={state} onChange={changeState} /> : null}
                  </div>
                );
              })}
            </div>
          )}
        </section>
      ) : (
        <section className="panel"><EmptyState title="请选择或新建场景" /></section>
      )}
    </div>
  );
}
