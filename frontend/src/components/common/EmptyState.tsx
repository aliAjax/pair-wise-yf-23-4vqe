export function EmptyState({ title = "暂无数据", hint }: { title?: string; hint?: string }) {
  return (
    <div className="empty grid place-items-center gap-1.5">
      <strong>{title}</strong>
      {hint ? <p>{hint}</p> : null}
    </div>
  );
}
