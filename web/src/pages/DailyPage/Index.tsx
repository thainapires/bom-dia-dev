import { useEffect, useState } from "react";
import { fetchDailyEntry, generateDailyEntry } from "../../api";
import { DailySummaryCard } from "../../components/DailySummaryCard";
import { DateNavigation } from "../../components/notes/DateNavigation/DateNavigation";
import { Button, Card, Page, PageContent, PageHeader } from "../../components/ui";
import { Skeleton } from "../../components/skeletons/Skeleton";
import { formatNotesDate, toISODate } from "../../formatting";
import type { DailyEntry } from "../../types";
import { ChatRoundLineIcon } from "@solar-icons/react/bold/chat-round-line";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { CalendarSearchIcon } from "@solar-icons/react/linear/calendar-search";
import { DangerCircleIcon } from "@solar-icons/react/linear/danger-circle";

export function DailyPage() {
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [entry, setEntry] = useState<DailyEntry | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
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

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateDailyEntry(date);
      setEntry(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar a daily");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Page>
      <PageHeader
        icon={<ChatRoundLineIcon size={28} />}
        title="Daily"
        subtitle={<span className="capitalize">{formatNotesDate(date)}</span>}
        actions={<DateNavigation date={date} isToday={isToday} onDateChange={setDate} />}
      />

      <PageContent>
        {error && (
          <Card padding="lg" className="flex min-h-72 flex-col items-center justify-center text-center">
            <DangerCircleIcon size={48} className="text-attention" />
            <h2 className="mt-5 text-base font-semibold text-foreground">Não foi possível carregar a Daily.</h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-foreground-subtle">{error}</p>
            <Button className="mt-6" onClick={handleGenerate} disabled={isGenerating} icon={<RefreshIcon size={16} />}>
              {isGenerating ? "Gerando..." : "Tentar novamente"}
            </Button>
          </Card>
        )}

        {!error && isLoading && (
          <Card padding="lg" className="overflow-hidden p-0">
            <div className="p-5">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="mt-2 h-3 w-56" />
              <div className="mt-8 space-y-6">
                <div className="pl-7">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="mt-4 h-5 w-3/4" />
                </div>
                <div className="h-px bg-border-subtle" />
                <div className="pl-7">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="mt-4 h-14 w-full" />
                  <Skeleton className="mt-2 h-14 w-11/12" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-px border-t border-border-subtle bg-border-subtle">
              <Skeleton className="h-16 rounded-none" />
              <Skeleton className="h-16 rounded-none" />
              <Skeleton className="h-16 rounded-none" />
            </div>
          </Card>
        )}

        {!error && !isLoading && entry && (
          <div className="opacity-100 transition-opacity duration-200 ease-(--ease-out) starting:opacity-0">
            <DailySummaryCard entry={entry} />
          </div>
        )}

        {!error && !isLoading && !entry && (
          <Card padding="lg" className="flex min-h-72 flex-col items-center justify-center text-center">
            <CalendarSearchIcon size={52} className="text-primary-light" />
            <h2 className="mt-5 text-base font-semibold text-foreground">Nada por aqui</h2>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-foreground-subtle">
              Não encontramos uma Daily gerada para esta data.
            </p>
            <Button
              variant="primary"
              onClick={handleGenerate}
              disabled={isGenerating}
              icon={<RefreshIcon size={18} className={isGenerating ? "animate-spin" : undefined} />}
              className="mt-6 w-full sm:w-auto"
            >
              {isGenerating ? "Gerando..." : "Gerar daily"}
            </Button>
          </Card>
        )}
      </PageContent>
    </Page>
  );
}
