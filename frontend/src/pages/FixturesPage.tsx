import { useMemo, useState } from "react";
import type { Fixture } from "../types/Fixture";
import type { FixtureType } from "../types/FixtureType";
import type { ChannelMode } from "../types/ChannelMode";
import { FIXTURE_TYPES, FIXTURE_TYPE_TEXT } from "../constants/FixtureType";
import { CHANNEL_MODES, CHANNEL_MODE_TEXT, CHANNEL_MODE_OCCUPANCY } from "../constants/ChannelMode";
import { DMX_UNIVERSE_SIZE } from "../types/Fixture";
import { useFixtureStore } from "../stores/FixtureStore";
import { useUiStore } from "../stores/UiStore";
import { useDmxAddressCheck } from "../hooks/useDmxAddressCheck";
import { createDefaultFixture } from "../constructors/FixtureConstructor";
import { FixtureIcon } from "../components/common/FixtureIcon";
import { StageCanvas } from "../components/common/StageCanvas";
import { EmptyState } from "../components/common/EmptyState";
import { formatDmxRange, formatRisk } from "../utils/formatters";
import { renderStageAt } from "../services/playbackEngine";

const emptyDraft = createDefaultFixture();

export function FixturesPage() {
  const fixtures = useFixtureStore((state) => state.rows);
  const save = useFixtureStore((state) => state.save);
  const remove = useFixtureStore((state) => state.remove);
  const pushToast = useUiStore((state) => state.pushToast);

  const [typeFilter, setTypeFilter] = useState<FixtureType | "ALL">("ALL");
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [draft, setDraft] = useState<Fixture>(emptyDraft);

  const filtered = useMemo(
    () => (typeFilter === "ALL" ? fixtures : fixtures.filter((fixture) => fixture.fixture_type === typeFilter)),
    [fixtures, typeFilter]
  );

  // 平面图展示灯具原始位置（无时间轴，黑场）
  const stageRendered = useMemo(
    () => renderStageAt(-1, fixtures, [], []).map((item) => ({ ...item, x: item.fixture.position_x, y: item.fixture.position_y })),
    [fixtures]
  );

  const usedChannels = fixtures.reduce((sum, fixture) => sum + fixture.channel_count, 0);
  const risk = formatRisk(usedChannels / DMX_UNIVERSE_SIZE);

  const check = useDmxAddressCheck(fixtures, draft);

  const startCreate = () => {
    const next = createDefaultFixture({
      fixture_code: `NEW-${(fixtures.length ? fixtures[fixtures.length - 1].id : 0) + 1}`,
      dmx_address: check.suggestedAddress
    });
    setDraft(next);
    setEditingId("new");
  };

  const startEdit = (fixture: Fixture) => {
    setDraft({ ...fixture });
    setEditingId(fixture.id);
  };

  const patchDraft = (patch: Partial<Fixture>) => setDraft((prev) => ({ ...prev, ...patch }));

  const changeMode = (color_mode: ChannelMode) =>
    patchDraft({ color_mode, channel_count: CHANNEL_MODE_OCCUPANCY[color_mode] });

  const onDropOnStage = (event: React.DragEvent) => {
    event.preventDefault();
    const id = Number(event.dataTransfer.getData("text/fixture-id"));
    const fixture = fixtures.find((item) => item.id === id);
    if (!fixture) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const x = Math.round(((event.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((event.clientY - rect.top) / rect.height) * 100);
    void save({ ...fixture, position_x: clampPercent(x), position_y: clampPercent(y) })
      .then(() => pushToast("success", `已移动 ${fixture.fixture_code}`))
      .catch((error: Error) => pushToast("error", error.message));
  };

  const submit = async () => {
    try {
      const saved = await save(draft);
      pushToast("success", editingId === "new" ? `灯具 ${saved.fixture_code} 已上架` : `灯具 ${saved.fixture_code} 已更新`);
      setEditingId(null);
    } catch (error) {
      pushToast("error", (error as Error).message);
    }
  };

  const onRemove = async (fixture: Fixture) => {
    if (!window.confirm(`确定删除灯具 ${fixture.fixture_code}？相关场景中的灯态也会一并清除。`)) return;
    await remove(fixture.id);
    pushToast("info", `已删除 ${fixture.fixture_code}`);
    if (editingId === fixture.id) setEditingId(null);
  };

  return (
    <div className="page-grid">
      <section className="panel panel-stage">
        <div className="panel-head">
          <div>
            <h2>舞台平面图</h2>
            <p className="panel-sub">拖动右侧灯具卡片到舞台摆位；点击灯具可编辑 DMX 地址。</p>
          </div>
          <button type="button" className="btn btn-primary" onClick={startCreate}>＋ 新增灯具</button>
        </div>
        <div
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDropOnStage}
        >
          <StageCanvas rendered={stageRendered} showBeams={false} />
        </div>
        <div className="dmx-summary">
          <span>DMX 通道占用：<strong>{usedChannels}</strong> / {DMX_UNIVERSE_SIZE}</span>
          <span className={"risk risk-" + risk.level.toLowerCase()}>拥挤度：{risk.text}</span>
        </div>
      </section>

      <section className="panel">
        <div className="panel-head">
          <h2>灯具列表</h2>
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value as FixtureType | "ALL")}>
            <option value="ALL">全部类型</option>
            {FIXTURE_TYPES.map((type) => (
              <option key={type} value={type}>{FIXTURE_TYPE_TEXT[type]}</option>
            ))}
          </select>
        </div>
        {filtered.length === 0 ? <EmptyState title="还没有灯具" hint="新增灯具后拖拽到舞台摆位" /> : (
          <ul className="fixture-list">
            {filtered.map((fixture) => (
              <li
                key={fixture.id}
                draggable
                onDragStart={(event) => event.dataTransfer.setData("text/fixture-id", String(fixture.id))}
                className={"fixture-row" + (editingId === fixture.id ? " is-editing" : "")}
              >
                <FixtureIcon type={fixture.fixture_type} />
                <div className="fixture-row-main">
                  <strong>{fixture.fixture_code}</strong>
                  <span>{FIXTURE_TYPE_TEXT[fixture.fixture_type]} · {CHANNEL_MODE_TEXT[fixture.color_mode]}</span>
                </div>
                <div className="fixture-row-dmx">
                  <code title={`DMX ${formatDmxRange(fixture.dmx_address, fixture.channel_count)}`}>
                    {formatDmxRange(fixture.dmx_address, fixture.channel_count)}
                  </code>
                  <span className="fixture-pos">({fixture.position_x}, {fixture.position_y})</span>
                </div>
                <div className="fixture-row-actions">
                  <button type="button" className="btn btn-small" onClick={() => startEdit(fixture)}>编辑</button>
                  <button type="button" className="btn btn-small btn-danger" onClick={() => void onRemove(fixture)}>删除</button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {editingId !== null ? (
        <div className="modal-mask" onClick={() => setEditingId(null)}>
          <div className="modal" onClick={(event) => event.stopPropagation()}>
            <h2>{editingId === "new" ? "新增灯具" : `编辑灯具 ${draft.fixture_code}`}</h2>
            <div className="form-grid">
              <label>
                <span>灯具编号</span>
                <input value={draft.fixture_code} onChange={(event) => patchDraft({ fixture_code: event.target.value })} placeholder="PAR-L-01" />
              </label>
              <label>
                <span>灯具类型</span>
                <select value={draft.fixture_type} onChange={(event) => patchDraft({ fixture_type: event.target.value as FixtureType })}>
                  {FIXTURE_TYPES.map((type) => <option key={type} value={type}>{FIXTURE_TYPE_TEXT[type]}</option>)}
                </select>
              </label>
              <label>
                <span>通道模式</span>
                <select value={draft.color_mode} onChange={(event) => changeMode(event.target.value as ChannelMode)}>
                  {CHANNEL_MODES.map((mode) => <option key={mode} value={mode}>{CHANNEL_MODE_TEXT[mode]}（{CHANNEL_MODE_OCCUPANCY[mode]}ch）</option>)}
                </select>
              </label>
              <label>
                <span>DMX 起始地址</span>
                <input type="number" min={1} max={DMX_UNIVERSE_SIZE} value={draft.dmx_address}
                  onChange={(event) => patchDraft({ dmx_address: Number(event.target.value) })} />
              </label>
              <label>
                <span>舞台 X（0-100）</span>
                <input type="number" min={0} max={100} value={draft.position_x}
                  onChange={(event) => patchDraft({ position_x: clampPercent(Number(event.target.value)) })} />
              </label>
              <label>
                <span>舞台 Y（0-100）</span>
                <input type="number" min={0} max={100} value={draft.position_y}
                  onChange={(event) => patchDraft({ position_y: clampPercent(Number(event.target.value)) })} />
              </label>
            </div>
            <div className={"dmx-check" + (check.conflict ? " has-conflict" : "")}>
              {check.conflict ? (
                <p className="dmx-conflict">
                  ⚠ DMX 地址压道：{check.candidateRange[0]}-{check.candidateRange[1]} 与灯具
                  <strong> {check.conflict.fixture_code} </strong>
                  （{formatDmxRange(check.conflict.dmx_address, check.conflict.channel_count)}）冲突，保存会被拒绝。
                </p>
              ) : (
                <p className="dmx-ok">✓ 通道 {formatDmxRange(draft.dmx_address, draft.channel_count)} 空闲，推荐下一空闲地址 {check.suggestedAddress}。</p>
              )}
            </div>
            <div className="modal-actions">
              <button type="button" className="btn" onClick={() => setEditingId(null)}>取消</button>
              <button type="button" className="btn btn-primary" onClick={() => void submit()}
                disabled={Boolean(check.conflict)}>保存灯具</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function clampPercent(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}
