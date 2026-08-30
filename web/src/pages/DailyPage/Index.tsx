import { useEffect, useState } from "react";
import { fetchDailyEntry } from "../../api";
import { DailySummaryCard } from "../../components/DailySummaryCard";
import { DateNavigation } from "../../components/notes/DateNavigation/DateNavigation";
import { Alert, Card, Page, PageContent, PageHeader } from "../../components/ui";
import { Skeleton } from "../../components/skeletons/Skeleton";
import { formatNotesDate, toISODate } from "../../formatting";
import type { DailyEntry } from "../../types";
import { ChatRoundLineIcon } from "@solar-icons/react/bold/chat-round-line";

export function DailyPage() {
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [entry, setEntry] = useState<DailyEntry | null>(null);
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
        actions={<DateNavigation date={date} isToday={isToday} onDateChange={setDate} />}
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
