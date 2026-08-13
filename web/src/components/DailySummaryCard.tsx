import type { DailyNarrative } from "../types";

export function DailySummaryCard({ narrativa }: { narrativa: DailyNarrative }) {
  return (
    <div className="rounded-lg bg-card p-4">
      <h2 className="text-sm font-semibold text-white/80">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-status-neutral" />
        Resumo pra daily
      </h2>
      <div className="mt-3 flex flex-col gap-1.5 text-sm text-white/70">
        <p>{narrativa.ontem}</p>
        <p>{narrativa.hoje}</p>
      </div>
    </div>
  );
}
