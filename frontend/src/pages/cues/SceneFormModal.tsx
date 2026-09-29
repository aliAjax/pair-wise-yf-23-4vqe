import { useState } from "react";
import { Modal } from "../../components/common/Modal";
import { ColorChannelSlider } from "../../components/common/ColorChannelSlider";
import type { Fixture } from "../../types/Fixture";
import type { CueSceneDraft } from "../../constructors/CueSceneConstructor";
import { formatDuration } from "../../utils/formatters";

interface SceneFormModalProps {
  fixtures: Fixture[];
  onClose: () => void;
  onSubmit: (draft: CueSceneDraft) => Promise<void>;
}

/** 新建场景：名称 / 淡入 / 保持 / 优先级；默认不命中任何灯具，创建后再细调 */
export function SceneFormModal({ onClose, onSubmit }: SceneFormModalProps) {
  const [name, setName] = useState("");
  const [fadeIn, setFadeIn] = useState(2000);
  const [hold, setHold] = useState(0);
  const [priority, setPriority] = useState(5);

  return (
    <Modal
      open
      title="新建灯光场景"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="btn" onClick={onClose}>
            取消
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!name.trim()}
            onClick={() =>
              void onSubmit({
                name: name.trim(),
                fixture_states: {},
                fade_in_ms: fadeIn,
                hold_ms: hold,
                priority,
                scene_status: "DRAFT"
              })
            }
          >
            创建
          </button>
        </>
      }
    >
      <div className="space-y-4">
        <label className="block text-xs text-slate-400">
          场景名称
          <input
            autoFocus
            type="text"
            value={name}
            placeholder="如：蓝色合唱"
            onChange={(event) => setName(event.target.value)}
            className="mt-1"
          />
        </label>
        <div className="grid grid-cols-3 gap-3">
          <label className="text-xs text-slate-400">
            淡入 ms
            <input type="number" min={0} step={100} value={fadeIn} onChange={(event) => setFadeIn(Number(event.target.value))} className="mt-1" />
          </label>
          <label className="text-xs text-slate-400">
            保持 ms
            <input type="number" min={0} step={500} value={hold} onChange={(event) => setHold(Number(event.target.value))} className="mt-1" />
          </label>
          <label className="text-xs text-slate-400">
            优先级
            <input type="number" min={0} max={99} value={priority} onChange={(event) => setPriority(Number(event.target.value))} className="mt-1" />
          </label>
        </div>
        <div className="rounded-lg border border-edge bg-panel2 p-3">
          <p className="mb-2 text-xs text-slate-400">淡入预览（{formatDuration(fadeIn)}）</p>
          <ColorChannelSlider kind="dimmer" label="示意" value={(fadeIn / 4000) * 255} disabled onChange={() => undefined} />
        </div>
        <p className="text-[11px] text-slate-500">
          创建后在左侧列表选中场景，逐台灯具设置颜色与亮度；停用/归档状态的场景不会参与舞台预览合成。
        </p>
      </div>
    </Modal>
  );
}
