// Small shared presentational pieces (cards, pills, KPI) — prototype look

export function Card({
  title,
  pill,
  children,
  className = "",
}: {
  title?: string;
  pill?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-2xl border border-line bg-surface p-5 shadow-sm ${className}`}
    >
      {(title || pill) && (
        <div className="mb-4 flex items-center justify-between gap-2">
          {title && <h2 className="text-sm font-bold text-navy">{title}</h2>}
          {pill && (
            <span className="rounded-full bg-soft px-2.5 py-1 text-[11px] font-medium text-navy">
              {pill}
            </span>
          )}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-4 shadow-sm">
      <small className="text-xs text-muted">{label}</small>
      <strong className="mt-1 block text-xl font-bold text-navy">{value}</strong>
      {note && <span className="text-[11px] text-muted">{note}</span>}
    </div>
  );
}

export function StagePill({ stage }: { stage: string }) {
  const won = stage === "Closed Won";
  const lost = stage === "Closed Lost";
  return (
    <span
      className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-medium ${
        won
          ? "bg-brand/15 text-navy"
          : lost
            ? "bg-red-50 text-red-600"
            : "bg-soft text-navy"
      }`}
    >
      {stage}
    </span>
  );
}

// horizontal bar rows — hand-drawn chart style from the prototype
export function BarRows({
  rows,
  unit,
}: {
  rows: { label: string; value: number; display: string }[];
  unit?: string;
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <div className="space-y-2.5">
      {rows.map((r) => (
        <div key={r.label}>
          <div className="mb-1 flex items-baseline justify-between text-xs">
            <span className="font-medium">{r.label}</span>
            <span className="text-muted">
              {r.display}
              {unit ? ` ${unit}` : ""}
            </span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-soft">
            <div
              className="h-full rounded-full bg-brand"
              style={{ width: `${(r.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
