import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { FireIcon } from "@solar-icons/react/bold-duotone/fire";
import { MedalStarIcon } from "@solar-icons/react/bold-duotone/medal-star";
import { PulseIcon } from "@solar-icons/react/bold-duotone/pulse";
import { RefreshIcon } from "@solar-icons/react/bold-duotone/refresh";
import { useCallback, useEffect, useState } from "react";
import { fetchWakatimeStats, fetchWakatimeTimeline } from "../../api";
import { WakatimeTimelineCard } from "../../components/WakatimeTimelineCard";
import { Alert, Button, Card, Input, Page, PageContent, PageHeader, Select } from "../../components/ui";
import { addDays, toISODate } from "../../formatting";
import type { WakatimeRangeKey, WakatimeStats, WakatimeTimeline } from "../../types";

const RANGE_OPTIONS: Array<{ value: WakatimeRangeKey; label: string }> = [
  { value: "today", label: "Hoje" },
  { value: "yesterday", label: "Ontem" },
  { value: "last_7_days", label: "Últimos 7 dias" },
  { value: "last_14_days", label: "Últimos 14 dias" },
  { value: "last_30_days", label: "Últimos 30 dias" },
  { value: "this_week", label: "Essa semana" },
  { value: "last_week", label: "Semana passada" },
  { value: "this_month", label: "Esse mês" },
  { value: "last_month", label: "Mês passado" },
  { value: "custom", label: "Customizado" },
];

export function WakatimePage() {
  const [data, setData] = useState<WakatimeStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [range, setRange] = useState<WakatimeRangeKey>("last_7_days");
  const [customStart, setCustomStart] = useState(() => addDays(toISODate(new Date()), -6));
  const [customEnd, setCustomEnd] = useState(() => toISODate(new Date()));

  const [timeline, setTimeline] = useState<WakatimeTimeline | null>(null);
  const [timelineDate, setTimelineDate] = useState(() => toISODate(new Date()));
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const hasValidCustomRange = range !== "custom" || (customStart !== "" && customEnd !== "" && customStart <= customEnd);

  const load = useCallback(async () => {
    if (!hasValidCustomRange) return;
    setIsLoading(true);
    setError(null);
    try {
      const stats = await fetchWakatimeStats({ range, start: customStart, end: customEnd });
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar dados");
    } finally {
      setIsLoading(false);
    }
  }, [range, customStart, customEnd, hasValidCustomRange]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    let cancelled = false;
    setTimelineError(null);
    fetchWakatimeTimeline(timelineDate)
      .then((result) => {
        if (!cancelled) setTimeline(result);
      })
      .catch((err) => {
        if (!cancelled) setTimelineError(err instanceof Error ? err.message : "Erro ao buscar dados");
      });
    return () => {
      cancelled = true;
    };
  }, [timelineDate]);

  return (
    <Page>
      <PageHeader
        icon={<PulseIcon size={28} />}
        title="Wakatime"
        subtitle="Estatísticas de produtividade e timeline de código."
        actions={
          <>
            <Button
              onClick={load}
              disabled={isLoading || !hasValidCustomRange}
              variant="secondary"
              icon={<RefreshIcon size={16} className={isLoading ? "animate-spin" : ""} />}
            >
              Atualizar
            </Button>
            <label className="flex items-center gap-2 text-sm text-foreground-secondary">
              Período
              <Select
                value={range}
                onChange={(event) => setRange(event.target.value as WakatimeRangeKey)}
              >
                {RANGE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value} className="bg-surface">
                    {option.label}
                  </option>
                ))}
              </Select>
            </label>

            {range === "custom" && (
              <div className="flex flex-wrap items-center gap-2 opacity-100 transition-opacity duration-150 ease-(--ease-out) starting:opacity-0">
                <Input
                  type="date"
                  value={customStart}
                  max={customEnd || undefined}
                  onChange={(event) => setCustomStart(event.target.value)}
                />
                <span className="text-sm text-foreground-subtle">até</span>
                <Input
                  type="date"
                  value={customEnd}
                  min={customStart || undefined}
                  onChange={(event) => setCustomEnd(event.target.value)}
                />
              </div>
            )}
          </>
        }
      />

      <PageContent className="space-y-[var(--section-gap)]">
        {error && <Alert>Não foi possível carregar os dados do Wakatime: {error}</Alert>}

        {timelineError && <Alert>Não foi possível carregar a timeline do Wakatime: {timelineError}</Alert>}

        {timeline && <WakatimeTimelineCard timeline={timeline} onDateChange={setTimelineDate} />}

        {data && (
          <div className="opacity-100 transition-opacity duration-300 ease-(--ease-out) starting:opacity-0">
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Card className="px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs uppercase text-muted-foreground">
                <ClockCircleIcon size={17} className="text-primary-light" />
                Tempo codando ({data.range})
              </p>
              <p className="mt-1 text-2xl font-semibold text-primary-light">{data.totalText}</p>
            </Card>
            <Card className="px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs uppercase text-muted-foreground">
                <FireIcon size={17} className="text-pending" />
                Média diária
              </p>
              <p className="mt-1 text-2xl font-semibold text-pending">
                {data.dailyAverageText}
              </p>
            </Card>
            <Card className="px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs uppercase text-muted-foreground">
                <MedalStarIcon size={17} className="text-status-neutral" />
                Melhor dia
              </p>
              <p className="mt-1 text-2xl font-semibold text-foreground">
                {data.bestDay ? data.bestDay.text : "sem dados"}
              </p>
            </Card>
          </div>

          <Card className="mt-4">
            <h2 className="text-sm font-semibold text-foreground-soft">Linguagens</h2>
            <div className="mt-3 flex flex-col gap-3">
              {data.languages.length === 0 ? (
                <p className="text-sm text-foreground-subtle">Sem dados de linguagens no período.</p>
              ) : (
                data.languages.map((lang) => (
                  <div key={lang.name}>
                    <div className="flex items-center justify-between text-sm text-foreground-soft">
                      <span>{lang.name}</span>
                      <span className="font-mono text-xs text-foreground-subtle">{lang.text}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${lang.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      )}

        {!data && isLoading && !error && (
          <p className="text-sm text-foreground-subtle">Carregando estatísticas do Wakatime...</p>
        )}
      </PageContent>
    </Page>
  );
}
