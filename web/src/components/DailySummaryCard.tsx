import type { DailyNarrative, IssueUpdateCategoria } from "../types";

const dotByCategoria: Record<IssueUpdateCategoria, string> = {
  trabalhando: "bg-status-waiting",
  aguardando_qa: "bg-status-waiting",
  finalizado: "bg-status-ready",
  code_review: "bg-status-ready",
  testado_ok: "bg-status-ready",
  testado_falhou: "bg-status-attention",
  pausado: "bg-status-attention",
  bloqueado: "bg-status-attention",
};

export function DailySummaryCard({ narrativa }: { narrativa: DailyNarrative }) {
  return (
    <div className="rounded-lg bg-card p-4 border-white/5 border">
      <h2 className="text-sm font-semibold text-white/80">
        <span className="mr-2 inline-block h-2 w-2 rounded-full bg-status-neutral" />
        Resumo pra daily
      </h2>

      {narrativa.porIssue.length > 0 ? (
        <ul className="mt-3 flex flex-col gap-2">
          {narrativa.porIssue.map((item) => (
            <li key={`${item.projectId}-${item.issueIid}`} className="flex items-start gap-2 text-sm">
              <span
                className={`mt-1.5 h-1.5 w-1.5 flex-none rounded-full ${dotByCategoria[item.categoria]}`}
              />
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/80 hover:text-white hover:underline"
              >
                {item.linha}
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm text-white/40">{narrativa.ontem}</p>
      )}

      <p className="mt-3 border-t border-white/10 pt-3 text-sm text-white/70">{narrativa.hoje}</p>
    </div>
  );
}
