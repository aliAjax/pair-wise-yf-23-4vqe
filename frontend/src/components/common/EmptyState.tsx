interface EmptyStateProps {
  title?: string;
  hint?: string;
  action?: React.ReactNode;
}

export function EmptyState({ title = "暂无数据", hint, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-edge bg-panel/50 px-6 py-12 text-center">
      <p className="text-sm font-medium text-slate-300">{title}</p>
      {hint && <p className="max-w-sm text-xs text-slate-500">{hint}</p>}
      {action}
    </div>
  );
}
