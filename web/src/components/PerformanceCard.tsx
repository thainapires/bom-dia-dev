import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { GraphUpIcon } from "@solar-icons/react/bold-duotone/graph-up";
import { Bar, BarChart, Cell, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { Desempenho } from "../types";
import { Card, Input, Select } from "./ui";

const COLOR_ABERTOS = "var(--color-chart-open)";
const COLOR_FECHADOS = "var(--color-chart-success)";

const tooltipStyle = {
  background: "var(--color-chart-background)",
  border: "1px solid var(--color-border-default)",
  borderRadius: 8,
  fontSize: 12,
};

const axisTick = { fill: "var(--color-foreground-subtle)", fontSize: 11 };

function formatDays(value: number | null): string {
  return value === null ? "sem dados" : `${value.toFixed(1).replace(".", ",")} dias`;
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function currentMergeDays(desempenho: Desempenho): number | null {
  const explicit = finiteNumber(desempenho.tempoMedioMergeDiasAtualValor);
  if (explicit !== null) return explicit;
  const match = desempenho.tempoMedioMergeDiasAtual.match(/[0-9]+(?:[.,][0-9]+)?/);
  return match ? Number(match[0].replace(",", ".")) : null;
}

function TrendBadge({ variation }: { variation: number | null | undefined }) {
  const safeVariation = finiteNumber(variation);
  if (safeVariation === null) {
    return <span className="text-xs text-foreground-subtle">sem comparação</span>;
  }

  const improved = safeVariation > 0;
  const worsened = safeVariation < 0;
  const color = improved ? "text-success" : worsened ? "text-attention" : "text-foreground-subtle";
  const arrow = improved ? "↓" : worsened ? "↑" : "→";

  return (
    <span className={`inline-flex items-center gap-1 rounded-md border border-current/20 bg-current/10 px-2 py-1 text-xs font-medium ${color}`}>
      <span aria-hidden="true">{arrow}</span>
      <span>{Math.abs(safeVariation)}%</span>
      <span className="ml-0.5 font-normal text-foreground-secondary">vs. período anterior</span>
    </span>
  );
}

function MergeTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { label: string; value: number; color: string } }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return (
    <div className="rounded-md border border-border-default bg-chart-background px-3 py-2 text-xs shadow-xl">
      <p className="text-foreground-soft">{item.label}</p>
      <p className="mt-1 font-mono" style={{ color: item.color }}>{formatDays(item.value)}</p>
    </div>
  );
}

function OpenClosedChart({ data }: { data: Array<{ label: string; abertos: number; fechados: number }> }) {
  if (data.length < 3) {
    const comparison = [
      { label: "Abertos", value: data.reduce((sum, item) => sum + item.abertos, 0), color: COLOR_ABERTOS },
      { label: "Fechados", value: data.reduce((sum, item) => sum + item.fechados, 0), color: COLOR_FECHADOS },
    ];
    return (
      <div className="h-32 min-w-0" role="img" aria-label="Comparação entre MRs abertos e fechados">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparison} layout="vertical" margin={{ top: 4, right: 8, left: 8, bottom: 0 }}>
            <CartesianGrid stroke="var(--color-border-subtle)" horizontal={false} />
            <XAxis type="number" hide allowDecimals={false} />
            <YAxis type="category" dataKey="label" tick={axisTick} axisLine={false} tickLine={false} width={54} />
            <Tooltip content={<MergeTooltip />} cursor={{ fill: "var(--color-surface-hover)" }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} isAnimationActive={false}>
              {comparison.map((item) => <Cell key={item.label} fill={item.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  }

  return (
    <div className="h-32 min-w-0" role="img" aria-label="Evolução de MRs abertos e fechados">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 8, left: 4, bottom: 0 }}>
          <CartesianGrid stroke="var(--color-border-subtle)" vertical={false} />
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis hide allowDecimals={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey="abertos" name="Abertos" stroke={COLOR_ABERTOS} strokeWidth={2} dot={{ r: 3, fill: COLOR_ABERTOS }} isAnimationActive={false} />
          <Line type="monotone" dataKey="fechados" name="Fechados" stroke={COLOR_FECHADOS} strokeWidth={2} dot={{ r: 3, fill: COLOR_FECHADOS }} isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MergeComparisonChart({ current, previous }: { current: number | null; previous: number | null }) {
  if (current === null && previous === null) {
    return <p className="flex h-32 items-center justify-center text-sm text-foreground-subtle">Sem dados suficientes para comparar.</p>;
  }

  const data = [
    { label: "Período anterior", value: previous ?? 0, color: "var(--color-foreground-muted)", missing: previous === null },
    { label: "Período atual", value: current ?? 0, color: COLOR_ABERTOS, missing: current === null },
  ];

  return (
    <div className="h-32 min-w-0" role="img" aria-label="Comparação do tempo médio até merge entre os períodos">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 22, right: 8, left: 8, bottom: 0 }}>
          <XAxis dataKey="label" tick={axisTick} axisLine={false} tickLine={false} interval={0} />
          <YAxis hide domain={[0, "auto"]} />
          <Tooltip content={<MergeTooltip />} cursor={{ fill: "var(--color-surface-hover)" }} />
          <Bar dataKey="value" radius={[4, 4, 0, 0]} isAnimationActive={false}>
            {data.map((item) => <Cell key={item.label} fill={item.missing ? "var(--color-surface-hover-strong)" : item.color} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PerformanceCardProps {
  desempenho: Desempenho;
  range: "last_7_days" | "last_14_days" | "last_30_days" | "custom";
  rangeOptions: Array<{ value: PerformanceCardProps["range"]; label: string }>;
  customStart: string;
  customEnd: string;
  onRangeChange: (range: PerformanceCardProps["range"]) => void;
  onCustomStartChange: (value: string) => void;
  onCustomEndChange: (value: string) => void;
  isLoading: boolean;
}

export function PerformanceCard({
  desempenho,
  range,
  rangeOptions,
  customStart,
  customEnd,
  onRangeChange,
  onCustomStartChange,
  onCustomEndChange,
  isLoading,
}: PerformanceCardProps) {
  const series = desempenho.seriePorSemana.map((semana) => ({
    label: semana.inicio,
    abertos: semana.abertos,
    fechados: semana.fechados,
  }));
  const total = desempenho.totalAbertos + desempenho.totalFechados;
  const closedRatio = total > 0 ? Math.round((desempenho.totalFechados / total) * 100) : null;
  const difference = desempenho.totalAbertos - desempenho.totalFechados;
  const current = currentMergeDays(desempenho);
  const previous = finiteNumber(desempenho.tempoMedioMergeDiasAnteriorValor);
  const absoluteDifference = current !== null && previous !== null ? Math.abs(previous - current) : null;
  const improved = finiteNumber(desempenho.variacaoPercentual) !== null && desempenho.variacaoPercentual! > 0;

  return (
    <Card className="min-w-0 bg-surface-section">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Seu desempenho</h2>
          <p className="mt-1 text-sm text-foreground-secondary">Visão geral de {desempenho.periodoLabel}</p>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          {range === "custom" && (
            <>
              <Input type="date" value={customStart} max={customEnd || undefined} aria-label="Início do período de desempenho" onChange={(event) => onCustomStartChange(event.target.value)} />
              <span className="text-xs text-foreground-subtle">até</span>
              <Input type="date" value={customEnd} min={customStart || undefined} aria-label="Fim do período de desempenho" onChange={(event) => onCustomEndChange(event.target.value)} />
            </>
          )}
          <label className="sr-only" htmlFor="performance-period">Período do desempenho</label>
          <Select id="performance-period" value={range} disabled={isLoading} onChange={(event) => onRangeChange(event.target.value as PerformanceCardProps["range"])}>
            {rangeOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </Select>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
        <section className="min-w-0 rounded-[var(--card-radius)] border border-border-subtle bg-surface p-4" aria-labelledby="performance-open-closed">
          <div className="flex items-start gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-category-purple-bg text-primary-light"><GraphUpIcon size={18} /></span>
            <div>
              <h3 id="performance-open-closed" className="text-sm font-semibold text-foreground">MRs abertos vs. fechados</h3>
              <p className="mt-0.5 text-xs text-foreground-secondary">Comparativo do período</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 divide-x divide-border-subtle">
            <div className="pr-3">
              <p className="text-3xl font-semibold text-primary-light">{desempenho.totalAbertos}</p>
              <p className="mt-0.5 text-sm text-foreground-secondary">Abertos</p>
            </div>
            <div className="pl-3">
              <p className="text-3xl font-semibold text-success">{desempenho.totalFechados}</p>
              <p className="mt-0.5 text-sm text-foreground-secondary">Fechados</p>
            </div>
          </div>
          <div className="mt-4"><OpenClosedChart data={series} /></div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-foreground-secondary" aria-label="Legenda do gráfico">
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-primary-light" />Abertos</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-success" />Fechados</span>
          </div>
          {total > 0 && (
            <p className="mt-3 rounded-lg border border-border-subtle bg-surface-hover px-3 py-2 text-xs text-foreground-secondary">
              <strong className="font-medium text-foreground">{total} MRs no período</strong>
              {closedRatio !== null && <span> · {closedRatio}% fechados</span>}
              {difference !== 0 && <span> · {Math.abs(difference)} {difference > 0 ? "a mais abertos" : "a mais fechados"}</span>}
            </p>
          )}
        </section>

        <section className="min-w-0 rounded-[var(--card-radius)] border border-border-subtle bg-surface p-4" aria-labelledby="performance-merge-time">
          <div className="flex items-start gap-2">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-pending/15 text-pending"><ClockCircleIcon size={18} /></span>
            <div>
              <h3 id="performance-merge-time" className="text-sm font-semibold text-foreground">Tempo médio até merge</h3>
              <p className="mt-0.5 text-xs text-foreground-secondary">Comparativo do período</p>
            </div>
          </div>
          <div className="mt-4">
            <p className="text-3xl font-semibold text-primary-light">{desempenho.tempoMedioMergeDiasAtual}</p>
            <div className="mt-2"><TrendBadge variation={desempenho.variacaoPercentual} /></div>
          </div>
          <div className="mt-3"><MergeComparisonChart current={current} previous={previous} /></div>
          {absoluteDifference !== null && (
            <p className={`mt-3 rounded-lg border px-3 py-2 text-xs ${improved ? "border-success/20 bg-success/10 text-foreground-secondary" : "border-border-subtle bg-surface-hover text-foreground-secondary"}`}>
              {improved ? "Redução" : "Diferença de"} <strong className={improved ? "font-medium text-success" : "font-medium text-foreground"}>{formatDays(absoluteDifference)}</strong> no tempo até merge
            </p>
          )}
        </section>
      </div>
    </Card>
  );
}
