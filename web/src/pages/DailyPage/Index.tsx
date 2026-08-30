import { ArrowLeftIcon } from "@solar-icons/react/linear/arrow-left";
import { ArrowRightIcon } from "@solar-icons/react/linear/arrow-right";
import { useEffect, useState } from "react";
import { fetchDailyDates, fetchDailyEntry } from "../../api";
import { DailySummaryCard } from "../../components/DailySummaryCard";
import { Skeleton } from "../../components/skeletons/Skeleton";
import { addDays, formatNotesDate, toISODate } from "../../formatting";
import type { DailyEntry } from "../../types";
import { ChatRoundLineIcon } from "@solar-icons/react/bold/chat-round-line";

export function DailyPage() {
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [dates, setDates] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    fetchDailyEntry(date)
      .then((result) => {
        if (cancelled) return;
        setEntry(result);
        return fetchDailyDates().then((result2) => {
          if (!cancelled) setDates(result2);
        });
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Erro ao buscar a daily");
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [date]);

  const isToday = date === toISODate(new Date());

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ChatRoundLineIcon size={28} className="text-primary" />
            <h1 className="text-2xl font-semibold text-foreground">Daily</h1>
          </div>
          <p className="mt-1 text-sm capitalize text-muted-foreground">{formatNotesDate(date)}</p>
        </div>
        <div className="flex items-center gap-2">
          {dates.length > 0 && (
            <select
              value={dates.includes(date) ? date : ""}
              onChange={(event) => event.target.value && setDate(event.target.value)}
              title="Ver daily de outro dia"
              className="rounded-lg border-0 bg-surface px-3 py-2 text-sm text-foreground-soft transition hover:bg-surface-selected focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              <option value="" disabled>
                Histórico
              </option>
              {dates.map((d) => (
                <option key={d} value={d}>
                  {formatNotesDate(d)}
                </option>
              ))}
            </select>
          )}
          <button
            type="button"
            onClick={() => setDate((current) => addDays(current, -1))}
            title="Dia anterior"
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-foreground-soft transition hover:bg-surface-selected active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowLeftIcon size={16} />
          </button>
          {!isToday && (
            <button
              type="button"
              onClick={() => setDate(toISODate(new Date()))}
              className="rounded-lg bg-surface px-3 py-2 text-sm text-foreground-soft transition hover:bg-surface-selected active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
            >
              Hoje
            </button>
          )}
          <button
            type="button"
            onClick={() => setDate((current) => addDays(current, 1))}
            title="Próximo dia"
            disabled={isToday}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface text-foreground-soft transition hover:bg-surface-selected active:scale-[0.97] disabled:opacity-30 disabled:hover:bg-surface disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <ArrowRightIcon size={16} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 rounded-lg border-l-4 border-l-attention bg-surface px-4 py-3 text-sm text-foreground-soft">
          {error}
        </div>
      )}

      {!error && isLoading && (
        <div className="mt-4 rounded-lg border border-border-subtle bg-surface p-5">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-4 h-16 w-full" />
          <Skeleton className="mt-4 h-16 w-full" />
        </div>
      )}

      {!error && !isLoading && entry && (
        <div className="opacity-100 transition-opacity duration-200 ease-(--ease-out) starting:opacity-0">
          <DailySummaryCard entry={entry} />
        </div>
      )}

      {!error && !isLoading && !entry && (
        <div className="mt-4 rounded-lg border border-border-subtle bg-surface p-5 text-sm text-foreground-subtle">
          Nenhum registro de daily pra esse dia.
        </div>
      )}
    </div>
  );
}
