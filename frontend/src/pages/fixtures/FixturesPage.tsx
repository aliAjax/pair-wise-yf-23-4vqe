import { useMemo, useState } from "react";
import { useFixtureStore } from "../../stores/FixtureStore";
import { useShowProjectStore } from "../../stores/ShowProjectStore";
import { useUiStore, withToast } from "../../stores/UiStore";
import { useDmxAddressCheck } from "../../hooks/useDmxAddressCheck";
import { suggestNextAddress } from "../../utils/dmx";
import { clampPercent } from "../../utils/color";
import { StageCanvas } from "../../components/common/StageCanvas";
import { UniverseBar } from "../../components/common/UniverseBar";
import { FixtureIcon } from "../../components/common/FixtureIcon";
import { DmxBadge } from "../../components/common/DmxBadge";
import { PropertyPanel, Field } from "../../components/common/PropertyPanel";
import { StatCard } from "../../components/common/StatCard";
import { EmptyState } from "../../components/common/EmptyState";
import { FIXTURE_TYPES, FixtureTypeText } from "../../constants/FixtureType";
import { CHANNEL_MODES, ChannelModeText, ChannelModeChannels } from "../../constants/ChannelMode";
import { DMX_UNIVERSE_SIZE } from "../../constants/dmx";
import { formatChannelMode, formatFixtureType } from "../../utils/formatters";
import { FixtureForm } from "./FixtureForm";
import type { Fixture } from "../../types/Fixture";
import type { FixtureType } from "../../types/FixtureType";
import type { ChannelMode } from "../../types/ChannelMode";

type FilterType = FixtureType | "ALL";

export function FixturesPage() {
  const fixtures = useFixtureStore((state) => state.rows);
  const create = useFixtureStore((state) => state.create);
  const update = useFixtureStore((state) => state.update);
  const remove = useFixtureStore((state) => state.remove);
  const pushToast = useUiStore((state) => state.pushToast);
  const activeProjectId = useShowProjectStore((state) => state.activeId);
  const projects = useShowProjectStore((state) => state.rows);
  const activeProject = projects.find((project) => project.id === activeProjectId) ?? projects[0] ?? undefined;
  const saveProject = useShowProjectStore((state) => state.save);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [filter, setFilter] = useState<FilterType>("ALL");
  /** 表单实时草稿，用于在通道条上预览候选地址段 */
  const [draft, setDraft] = useState<{ id: string; dmx_address: number; channel_count: number } | null>(null);

  const filtered = useMemo(
    () => (filter === "ALL" ? fixtures : fixtures.filter((fixture) => fixture.fixture_type === filter)),
    [fixtures, filter]
  );
  const selected = fixtures.find((fixture) => fixture.id === selectedId) ?? null;

  const barCandidate =
    draft ??
    (selected
      ? { id: selected.id, dmx_address: selected.dmx_address, channel_count: selected.channel_count }
      : null);
  const dmx = useDmxAddressCheck(fixtures, barCandidate);
  const formConflict = draft ? dmx.conflict : null;

  async function handleMove(id: string, x: number, y: number) {
    const fixture = fixtures.find((row) => row.id === id);
    if (!fixture) return;
    try {
      await update({ ...fixture, position_x: clampPercent(x), position_y: clampPercent(y) });
    } catch (error) {
      pushToast((error as Error).message, "error");
    }
  }

  async function syncProjectFixtureIds(nextFixtures: Fixture[]) {
    if (!activeProject) return;
    await saveProject({ ...activeProject, fixture_ids: nextFixtures.map((fixture) => fixture.id) });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="灯具总数" value={fixtures.length} hint={activeProject?.title} />
        <StatCard label="当前筛选" value={filter === "ALL" ? "全部" : FixtureTypeText[filter]} />
        <StatCard label="DMX 占用" value={`${Math.round(dmx.utilization * 100)}%`} hint={`${dmx.totalUsed}/${DMX_UNIVERSE_SIZE} 通道`} />
        <StatCard label="地址冲突" value={dmx.conflict ? 1 : 0} hint={dmx.conflict?.fixture_code} />
      </div>

      <div className="flex items-center gap-2">
        <div className="flex flex-wrap gap-1">
          <FilterChip active={filter === "ALL"} onClick={() => setFilter("ALL")}>
            全部
          </FilterChip>
          {FIXTURE_TYPES.map((type) => (
            <FilterChip key={type} active={filter === type} onClick={() => setFilter(type)}>
              {FixtureTypeText[type]}
            </FilterChip>
          ))}
        </div>
        <button className="btn-primary ml-auto" onClick={() => setCreating(true)}>
          ＋ 新增灯具
        </button>
      </div>

      <div className="flex gap-4">
        <div className="min-w-0 flex-1 space-y-4">
          <StageCanvas
            fixtures={filtered}
            editable
            selectedId={selectedId}
            onSelect={setSelectedId}
            onMove={(id, x, y) => void handleMove(id, x, y)}
            height={440}
          />
          <UniverseBar fixtures={fixtures} candidate={barCandidate} />
          <FixtureTable
            fixtures={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onDelete={(fixture) =>
              void withToast(
                async () => {
                  await remove(fixture);
                  const next = fixtures.filter((row) => row.id !== fixture.id);
                  await syncProjectFixtureIds(next);
                  setSelectedId(null);
                },
                `灯具 ${fixture.fixture_code} 已删除`,
                pushToast
              )
            }
          />
        </div>

        {creating && (
          <FixtureForm
            mode="create"
            defaultAddress={suggestNextAddress(fixtures, 3)}
            conflict={dmx.conflict}
            onDraftChange={setDraft}
            onCancel={() => {
              setCreating(false);
              setDraft(null);
            }}
            onSubmit={async (formDraft) => {
              await withToast(
                async () => {
                  const created = await create(formDraft);
                  if (activeProject) await syncProjectFixtureIds([...fixtures, created]);
                  setCreating(false);
                  setDraft(null);
                  setSelectedId(created.id);
                },
                `灯具 ${formDraft.fixture_code} 已上架`,
                pushToast
              );
            }}
          />
        )}

        {!creating && selected && (
          <FixtureForm
            key={selected.id}
            mode="edit"
            fixture={selected}
            conflict={formConflict}
            onDraftChange={setDraft}
            onCancel={() => {
              setSelectedId(null);
              setDraft(null);
            }}
            onSubmit={async (formDraft) => {
              await withToast(
                () =>
                  update({
                    ...selected,
                    fixture_code: formDraft.fixture_code,
                    fixture_type: formDraft.fixture_type,
                    color_mode: formDraft.color_mode,
                    channel_count: formDraft.channel_count ?? ChannelModeChannels[formDraft.color_mode],
                    dmx_address: formDraft.dmx_address,
                    position_x: formDraft.position_x,
                    position_y: formDraft.position_y
                  }),
                "灯具属性已保存",
                pushToast
              );
            }}
          />
        )}

        {!creating && !selected && <ReadonlyPanel fixtures={fixtures} />}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-xs ${
        active ? "border-accent bg-accent/15 text-accent" : "border-edge text-slate-400 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}

function FixtureTable({
  fixtures,
  selectedId,
  onSelect,
  onDelete
}: {
  fixtures: Fixture[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (fixture: Fixture) => void;
}) {
  if (fixtures.length === 0) {
    return <EmptyState title="舞台上还没有灯具" hint="点击右上角「新增灯具」开始布置，DMX 地址会自动避开已有通道。" />;
  }
  return (
    <div className="overflow-hidden rounded-xl border border-edge bg-panel">
      <table className="w-full text-left text-xs">
        <thead className="bg-panel2 text-slate-400">
          <tr>
            <th className="px-3 py-2">灯具</th>
            <th className="px-3 py-2">编号</th>
            <th className="px-3 py-2">类型</th>
            <th className="px-3 py-2">通道模式</th>
            <th className="px-3 py-2">位置 (x,y)</th>
            <th className="px-3 py-2">DMX</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {fixtures.map((fixture) => (
            <tr
              key={fixture.id}
              onClick={() => onSelect(fixture.id)}
              className={`cursor-pointer border-t border-edge hover:bg-panel2/60 ${
                selectedId === fixture.id ? "bg-accent/5" : ""
              }`}
            >
              <td className="px-3 py-2">
                <FixtureIcon type={fixture.fixture_type} size={26} active={selectedId === fixture.id} />
              </td>
              <td className="px-3 py-2 font-mono text-slate-200">{fixture.fixture_code}</td>
              <td className="px-3 py-2">{formatFixtureType(fixture.fixture_type)}</td>
              <td className="px-3 py-2">{formatChannelMode(fixture.color_mode)}</td>
              <td className="px-3 py-2 font-mono text-slate-400">
                {fixture.position_x.toFixed(0)}, {fixture.position_y.toFixed(0)}
              </td>
              <td className="px-3 py-2">
                <DmxBadge address={fixture.dmx_address} channelCount={fixture.channel_count} />
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  className="btn-danger"
                  onClick={(event) => {
                    event.stopPropagation();
                    onDelete(fixture);
                  }}
                >
                  删除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ReadonlyPanel({ fixtures }: { fixtures: Fixture[] }) {
  return (
    <PropertyPanel title="灯具属性">
      <p className="text-xs leading-relaxed text-slate-400">
        在平面图或下方列表中点选一台灯具即可编辑。拖动平面图上的灯具可直接摆放灯位；新增灯具时 DMX
        起始地址会自动寻找空闲通道，若手动输入的地址压到已有通道，保存会被阻止并在下方通道条标红。
      </p>
      <div className="space-y-1 text-xs text-slate-500">
        {FIXTURE_TYPES.map((type) => (
          <div key={type} className="flex items-center justify-between rounded bg-panel2 px-2 py-1.5">
            <span>{FixtureTypeText[type]}</span>
            <span>{fixtures.filter((fixture) => fixture.fixture_type === type).length} 台</span>
          </div>
        ))}
      </div>
      <div className="space-y-1 text-xs text-slate-500">
        {CHANNEL_MODES.map((mode: ChannelMode) => (
          <div key={mode} className="flex items-center justify-between rounded bg-panel2 px-2 py-1.5">
            <span>{ChannelModeText[mode]}</span>
            <span className="font-mono">{ChannelModeChannels[mode]} CH</span>
          </div>
        ))}
      </div>
    </PropertyPanel>
  );
}
