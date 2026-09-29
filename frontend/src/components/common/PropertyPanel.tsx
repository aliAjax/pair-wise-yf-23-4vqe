interface PropertyPanelProps {
  title: string;
  onClose?: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

/** 右侧属性面板：灯具属性、场景属性编辑共用 */
export function PropertyPanel({ title, onClose, children, footer }: PropertyPanelProps) {
  return (
    <aside className="flex h-full w-80 shrink-0 flex-col rounded-xl border border-edge bg-panel">
      <header className="flex items-center justify-between border-b border-edge px-4 py-3">
        <h2 className="text-sm font-semibold text-slate-100">{title}</h2>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="rounded px-2 py-0.5 text-slate-400 hover:bg-panel2 hover:text-slate-200"
          >
            ✕
          </button>
        )}
      </header>
      <div className="flex-1 space-y-4 overflow-y-auto p-4">{children}</div>
      {footer && <footer className="border-t border-edge p-3">{footer}</footer>}
    </aside>
  );
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-medium text-slate-400">{label}</span>
      {children}
      {hint && <span className="block text-[11px] text-slate-500">{hint}</span>}
    </label>
  );
}
