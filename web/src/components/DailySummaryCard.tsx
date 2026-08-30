import { CheckCircleIcon } from "@solar-icons/react/bold-duotone/check-circle";
import { CopyIcon } from "@solar-icons/react/bold/copy";
import { useState } from "react";
import type { DailyEntry } from "../types";
import { Button, Card } from "./ui";

export function DailySummaryCard({ entry }: { entry: DailyEntry }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const texto = `Ontem: ${entry.ontem}\n\nHoje: ${entry.hoje}`;
    await navigator.clipboard.writeText(texto);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card padding="lg">
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
        <Button
          onClick={handleCopy}
          variant="ghost"
          className="h-8 rounded-md px-2.5 text-xs"
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
        </Button>
      </div>

      <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-foreground">{entry.ontem}</p>
      <p className="mt-4 whitespace-pre-line border-t border-border-default pt-4 text-base leading-relaxed text-foreground">
        {entry.hoje}
      </p>
    </Card>
  );
}
