import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { CopyIcon } from "@solar-icons/react/bold/copy";
import { useState } from "react";
import type { DailyEntry } from "../types";

export function DailySummaryCard({ entry }: { entry: DailyEntry }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const texto = `Ontem: ${entry.ontem}\n\nHoje: ${entry.hoje}`;
    await navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg bg-surface p-5 border-border-subtle border mt-4">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-foreground-soft">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-status-neutral" />
          Resumo pra daily
          {!entry.geradoViaLLM && (
            <span className="ml-2 rounded-full bg-surface-selected px-2 py-0.5 text-[10px] font-normal text-foreground-subtle">
              gerado sem IA
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={handleCopy}
          className="flex flex-none items-center gap-1.5 rounded-md bg-surface-hover px-2.5 py-1.5 text-xs text-foreground-secondary transition hover:bg-surface-selected hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        >
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
        </button>
      </div>

      <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground">{entry.ontem}</p>
      <p className="mt-4 whitespace-pre-line border-t border-border-default pt-4 text-base leading-relaxed text-foreground">
        {entry.hoje}
      </p>
    </div>
  );
}
