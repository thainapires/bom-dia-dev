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
    <div className="rounded-lg bg-card p-5 border-white/5 border">
      <div className="flex items-start justify-between gap-3">
        <h2 className="text-sm font-semibold text-white/80">
          <span className="mr-2 inline-block h-2 w-2 rounded-full bg-status-neutral" />
          Resumo pra daily
          {!entry.geradoViaLLM && (
            <span className="ml-2 rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-normal text-white/40">
              gerado sem IA
            </span>
          )}
        </h2>
        <button
          type="button"
          onClick={handleCopy}
          className="flex flex-none items-center gap-1.5 rounded-md bg-white/5 px-2.5 py-1.5 text-xs text-white/70 transition hover:bg-white/10 hover:text-white active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
        >
          {copied ? (
            <span className="flex items-center gap-1.5 opacity-100 transition-opacity duration-150 ease-(--ease-out) starting:opacity-0">
              <CheckCircleIcon size={14} className="text-status-ready" />
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

      <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-white/90">{entry.ontem}</p>
      <p className="mt-4 whitespace-pre-line border-t border-white/10 pt-4 text-base leading-relaxed text-white/90">
        {entry.hoje}
      </p>
    </div>
  );
}
