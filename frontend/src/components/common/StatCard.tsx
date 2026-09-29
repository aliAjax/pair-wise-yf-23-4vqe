import type { ReactNode } from "react";

export function StatCard({ label, value, hint }: { label: string; value: string | number; hint?: ReactNode }) {
  return (
    <div className="stat flex flex-col gap-1">
      <span>{label}</span>
      <strong>{value}</strong>
      {hint ? <em className="stat-hint">{hint}</em> : null}
    </div>
  );
}
