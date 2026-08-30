import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { CopyIcon } from "@solar-icons/react/bold/copy";
import { AltArrowRightIcon } from "@solar-icons/react/linear/alt-arrow-right";
import { ChecklistIcon } from "@solar-icons/react/linear/checklist";
import { CodeIcon } from "@solar-icons/react/linear/code";
import { FileTextIcon } from "@solar-icons/react/linear/file-text";
import { useState, type ReactNode } from "react";
import type { DailyEntry, DailyIssueItem } from "../types";
import { Button, Card } from "./ui";

function copyText(entry: DailyEntry): string {
  return `Ontem: ${entry.ontem}\n\nHoje: ${entry.hoje}`;
}

function DailyItemRow({ item }: { item: DailyIssueItem }) {
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noreferrer"
      className="group flex min-h-14 items-center gap-3 rounded-md bg-surface-hover px-3 py-2 transition hover:bg-surface-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
    >
      <span className="w-14 flex-none font-mono text-sm font-semibold text-primary-light">#{item.issueIid}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-foreground">{item.title}</span>
        <span className="mt-0.5 block truncate text-xs text-foreground-subtle">{item.detail}</span>
      </span>
      <AltArrowRightIcon size={16} className="flex-none text-primary transition group-hover:translate-x-0.5" />
    </a>
  );
}

function DailySection({
  label,
  text,
  items,
  emptyText,
}: {
  label: "ONTEM" | "HOJE";
  text: string;
  items?: DailyIssueItem[];
  emptyText: string;
}) {
  const sectionItems = items ?? [];
  const hasItems = sectionItems.length > 0;
  const hasText = text.trim().length > 0;

  return (
    <section className="relative pl-7">
      <span className="absolute left-1 top-1.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_0_4px_rgba(124,77,255,0.16)]" />
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-normal text-primary-light">
        {label === "ONTEM" ? <ChecklistIcon size={15} /> : <CheckCircleIcon size={15} />}
        <span>{label}</span>
      </div>

      {hasText ? (
        <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">{text}</p>
      ) : (
        <p className="mt-3 text-sm text-foreground-subtle">{emptyText}</p>
      )}

      {hasItems && (
        <div className="mt-4 space-y-2">
          {sectionItems.map((item) => (
            <DailyItemRow key={`${item.url}-${item.detail}`} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}

function StatTile({ icon, value, label }: { icon: ReactNode; value: number; label: string }) {
  return (
    <div className="flex min-w-0 items-center justify-center gap-3 px-4 py-4">
      <span className="flex h-8 w-8 flex-none items-center justify-center text-primary-light">{icon}</span>
      <span className="min-w-0">
        <span className="block text-base font-semibold tabular-nums text-foreground">{value}</span>
        <span className="block text-xs text-foreground-subtle">{label}</span>
      </span>
    </div>
  );
}

export function DailySummaryCard({ entry }: { entry: DailyEntry }) {
  const [copied, setCopied] = useState(false);
  const ontemItems = entry.ontemItems ?? [];
  const hojeItems = entry.hojeItems ?? [];
  const stats = entry.stats ?? {
    commits: 0,
    pendencias: hojeItems.length,
    issues: ontemItems.length + hojeItems.length,
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(copyText(entry));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card padding="lg" className="overflow-hidden p-0">
      <div className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 flex h-8 w-8 flex-none items-center justify-center rounded-md bg-surface-hover text-foreground-soft">
              <FileTextIcon size={18} />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold text-foreground">Resumo da Daily</h2>
              <p className="mt-0.5 text-sm text-foreground-subtle">Baseado nas suas atividades no GitLab</p>
              {!entry.geradoViaLLM && (
                <span className="mt-2 inline-flex rounded-md bg-surface-selected px-2 py-0.5 text-[10px] font-medium text-foreground-subtle">
                  gerado sem IA
                </span>
              )}
            </div>
          </div>

          <Button onClick={handleCopy} variant="ghost" className="h-8 rounded-md px-2.5 text-xs">
            {copied ? (
              <span className="flex items-center gap-1.5 opacity-100 transition-opacity duration-150 ease-(--ease-out) starting:opacity-0">
                <CheckCircleIcon size={14} className="text-success" />
                Copiado
              </span>
            ) : (
              <span className="flex items-center gap-1.5 opacity-100 transition-opacity duration-150 ease-(--ease-out) starting:opacity-0">
                <CopyIcon size={14} />
                Copiar
              </span>
            )}
          </Button>
        </div>

        <div className="mt-8 space-y-6">
          <DailySection label="ONTEM" text={entry.ontem} items={ontemItems} emptyText="Nenhuma atividade registrada no GitLab." />
          <div className="h-px bg-border-subtle" />
          <DailySection label="HOJE" text={entry.hoje} items={hojeItems} emptyText="Nada pendente por enquanto." />
        </div>
      </div>

      <div className="grid grid-cols-1 divide-y divide-border-subtle border-t border-border-subtle bg-surface-overlay sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        <StatTile icon={<CodeIcon size={20} />} value={stats.commits} label="Commits" />
        <StatTile icon={<CheckCircleIcon size={20} />} value={stats.pendencias} label="Pendências" />
        <StatTile icon={<ChecklistIcon size={20} />} value={stats.issues} label="Issues" />
      </div>
    </Card>
  );
}
