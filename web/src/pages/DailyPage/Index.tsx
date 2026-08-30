import { ArrowLeftIcon } from "@solar-icons/react/linear/arrow-left";
import { ArrowRightIcon } from "@solar-icons/react/linear/arrow-right";
import { useEffect, useState } from "react";
import { fetchDailyDates, fetchDailyEntry } from "../../api";
import { DailySummaryCard } from "../../components/DailySummaryCard";
import { Alert, Button, Card, IconButton, Page, PageContent, PageHeader, Select } from "../../components/ui";
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
    <Page>
      <PageHeader
        icon={<ChatRoundLineIcon size={28} />}
        title="Daily"
        subtitle={<span className="capitalize">{formatNotesDate(date)}</span>}
        actions={
          <>
            {dates.length > 0 && (
              <Select
                value={dates.includes(date) ? date : ""}
                onChange={(event) => event.target.value && setDate(event.target.value)}
                title="Ver daily de outro dia"
                className="border-0 bg-surface text-foreground-soft"
              >
                <option value="" disabled>
                  Histórico
                </option>
                {dates.map((d) => (
                  <option key={d} value={d}>
                    {formatNotesDate(d)}
                  </option>
                ))}
              </Select>
            )}
            <IconButton onClick={() => setDate((current) => addDays(current, -1))} title="Dia anterior">
              <ArrowLeftIcon size={16} />
            </IconButton>
            {!isToday && (
              <Button variant="ghost" onClick={() => setDate(toISODate(new Date()))}>
                Hoje
              </Button>
            )}
            <IconButton onClick={() => setDate((current) => addDays(current, 1))} title="Próximo dia" disabled={isToday}>
              <ArrowRightIcon size={16} />
            </IconButton>
          </>
        }
      />

      <PageContent>
        {error && <Alert>{error}</Alert>}

        {!error && isLoading && (
          <Card padding="lg">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-4 h-16 w-full" />
            <Skeleton className="mt-4 h-16 w-full" />
          </Card>
        )}

        {!error && !isLoading && entry && (
          <div className="opacity-100 transition-opacity duration-200 ease-(--ease-out) starting:opacity-0">
            <DailySummaryCard entry={entry} />
          </div>
        )}

        {!error && !isLoading && !entry && (
          <Card padding="lg" className="text-sm text-foreground-subtle">
            Nenhum registro de daily pra esse dia.
          </Card>
        )}
      </PageContent>
    </Page>
  );
}
