import { ChartIcon } from "@solar-icons/react/bold-duotone/chart";
import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { FireIcon } from "@solar-icons/react/bold-duotone/fire";
import { StarIcon } from '@solar-icons/react/bold/star'
import { CodeIcon } from "@solar-icons/react/linear/code";
import { GraphNewIcon } from "@solar-icons/react/linear/graph-new";
import { useState, type ComponentType, type ReactNode } from "react";
import { Cell, Pie, PieChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis, ReferenceLine } from "recharts";
import { FaApple, FaDesktop, FaLinux, FaRedhat, FaUbuntu, FaWindows } from "react-icons/fa";
import { VscVscode } from "react-icons/vsc";
import { LuMonitor } from "react-icons/lu";
import { SiAndroidstudio, SiClaudecode, SiCodesandbox, SiCursor, SiIntellijidea, SiNeovim, SiPhpstorm, SiSublimetext, SiVim, SiWebstorm, SiXcode, SiZedindustries } from "react-icons/si";
import type { WakatimeDailyActivity, WakatimeDurationRankItem, WakatimeStats, WakatimeTimeBucket } from "../types";
import { Button, Card } from "./ui";
import { BoltIcon } from "@solar-icons/react/bold/bolt";
import { ChatSquare2Icon } from "@solar-icons/react/bold/chat-square-2";

const CHART_COLORS = [
  "var(--color-primary)",
  "var(--color-primary-light)",
  "var(--color-info)",
  "var(--color-pending)",
  "var(--color-chart-series-5)",
  "var(--color-chart-series-7)",
];

function secondsToHours(seconds: number): number {
  return Math.round((seconds / 3600) * 100) / 100;
}

function itemHours<T extends { seconds?: number; averageSeconds?: number }>(item: T): number {
  return secondsToHours(item.seconds ?? item.averageSeconds ?? 0);
}

function GradientDefs() {
  return (
    <defs>
      <linearGradient id="wakatimeBarGradient" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="var(--color-primary-light)" />
        <stop offset="100%" stopColor="var(--color-primary)" />
      </linearGradient>
    </defs>
  );
}

export function MetricCard({ icon, label, value, detail, valueClassName = "text-foreground" }: { icon: ReactNode; label: string; value: string; detail?: string; valueClassName?: string }) {
  return (
    <Card className="min-h-24 px-4 py-3">
      <p className="flex items-center gap-1.5 text-xs uppercase text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className={`mt-1 truncate text-2xl font-semibold ${valueClassName}`} title={value}>{value}</p>
      {detail && <p className="mt-1 truncate text-xs text-foreground-subtle" title={detail}>{detail}</p>}
    </Card>
  );
}

export function WakatimeKpiGrid({ data }: { data: WakatimeStats }) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard icon={<ClockCircleIcon size={17} className="text-primary-light" />} label={`Tempo codando (${data.range})`} value={data.totalText} valueClassName="text-primary-light" detail="Total no período" />
      <MetricCard icon={<FireIcon size={17} className="text-pending" />} label="Média diária" value={data.dailyAverageText} valueClassName="text-pending" detail="Média por dia" />
      <MetricCard icon={<StarIcon size={17} className="text-info" />} label="Melhor dia" value={data.bestDay ? data.bestDay.text.split(" — ")[0] : "sem dados"} detail={data.bestDay?.text.split(" — ")[1]} />
      <MetricCard icon={<BoltIcon size={17} className="text-success" />} label="Sequência atual" value={`${data.currentStreak} ${data.currentStreak === 1 ? "dia" : "dias"}`} detail="dias consecutivos" />
      {data.longestSession && <MetricCard icon={<ChatSquare2Icon size={17} className="text-primary" />} label="Maior sessão" value={data.longestSession.text} detail="sessão mais longa" />}
    </div>
  );
}

function DailyTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ payload: WakatimeDailyActivity }>; label?: string }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return <ChartTooltip title={item.fullLabel || label || ""} value={item.text} />;
}

function ChartTooltip({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface px-3 py-2 text-xs shadow-xl">
      <p className="font-medium capitalize text-foreground">{title}</p>
      <p className="mt-1 font-mono text-primary-light">{value}</p>
    </div>
  );
}

export function DailyActivityChart({ items }: { items: WakatimeDailyActivity[] }) {
  const hasData = items.some((item) => item.seconds > 0);

  return (
    <Card className="min-w-0">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground-soft">
        <ChartIcon size={17} className="text-primary-light" />
        Atividade diária
      </h2>
      {!hasData ? (
        <p className="mt-3 text-sm text-foreground-subtle">Sem atividade no período selecionado.</p>
      ) : (
        <div className="mt-4 h-52 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={items} margin={{ top: 16, right: 4, bottom: 0, left: -14 }}>
              <GradientDefs />
              <CartesianGrid stroke="var(--color-border-subtle)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--color-foreground-subtle)" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => value.slice(5).replace("-", "/")} />
              <YAxis stroke="var(--color-foreground-subtle)" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => `${value}h`} />
              <Tooltip cursor={{ fill: "var(--color-surface-hover)" }} content={<DailyTooltip />} />
              <Bar dataKey={itemHours} fill="url(#wakatimeBarGradient)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
}

export function ProductiveHoursChart({ buckets, dominant }: { buckets: WakatimeTimeBucket[]; dominant: WakatimeTimeBucket | null }) {
  if (buckets.length === 0 || !dominant) return null;
  return (
    <Card className="min-w-0">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground-soft">
        <GraphNewIcon size={17} className="text-primary-light" />
        Horário mais produtivo
      </h2>
      <div className="mt-4 h-52 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={buckets} margin={{ top: 16, right: 4, bottom: 0, left: -14 }}>
            <GradientDefs />
            <CartesianGrid stroke="var(--color-border-subtle)" vertical={false} />
            <XAxis dataKey="label" stroke="var(--color-foreground-subtle)" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis stroke="var(--color-foreground-subtle)" tickLine={false} axisLine={false} fontSize={11} tickFormatter={(value) => `${secondsToHours(Number(value))}h`} />
            <Tooltip cursor={{ fill: "var(--color-surface-hover)" }} content={({ active, payload }) => active && payload?.length ? <ChartTooltip title={payload[0].payload.label} value={payload[0].payload.text} /> : null} />
            <Bar dataKey="seconds" fill="url(#wakatimeBarGradient)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-center text-sm text-foreground-subtle">Maior concentração entre <span className="font-mono text-foreground-soft">{dominant.label}</span>.</p>
    </Card>
  );
}

export function WeekdayProductivityChart({ data }: { data: WakatimeStats }) {
  if (!data.mostProductiveWeekday || data.weekdayActivity.every((item) => item.averageSeconds <= 0)) return null;
  return (
    <Card className="min-w-0">
      <h2 className="text-sm font-semibold text-foreground-soft">Dia da semana mais produtivo</h2>
      <div className="mt-4 h-40 min-w-0">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.weekdayActivity} margin={{ top: 12, right: 4, bottom: 0, left: 0 }}>
            <GradientDefs />
            <XAxis dataKey="shortLabel" stroke="var(--color-foreground-subtle)" tickLine={false} axisLine={false} fontSize={11} />
            <YAxis hide />
            <Tooltip cursor={{ fill: "var(--color-surface-hover)" }} content={({ active, payload }) => active && payload?.length ? <ChartTooltip title={payload[0].payload.weekday} value={`${payload[0].payload.averageText} de média`} /> : null} />
            <ReferenceLine y={secondsToHours(data.mostProductiveWeekday.averageSeconds)} stroke="var(--color-primary-light)" strokeDasharray="3 3" strokeOpacity={0.45} />
            <Bar dataKey={itemHours} fill="url(#wakatimeBarGradient)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-2 text-lg font-semibold text-primary-light">{data.mostProductiveWeekday.weekday}</p>
      <p className="text-sm text-foreground-subtle">média {data.mostProductiveWeekday.averageText}</p>
    </Card>
  );
}

export function RankedDurationList({ title, items, emptyText, initialLimit = 6 }: { title: string; items: WakatimeDurationRankItem[]; emptyText: string; initialLimit?: number }) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? items : items.slice(0, initialLimit);

  return (
    <Card className="min-w-0">
      <h2 className="text-sm font-semibold text-foreground-soft">{title}</h2>
      <div className="mt-3 flex flex-col gap-2.5">
        {items.length === 0 ? (
          <p className="text-sm text-foreground-subtle">{emptyText}</p>
        ) : (
          visible.map((item) => (
            <div key={item.name} className="grid grid-cols-[minmax(5rem,1.1fr)_minmax(3rem,1fr)_4.75rem_3rem] items-center gap-2 text-sm">
              <span className="min-w-0 truncate text-foreground-soft" title={item.name}>{item.name}</span>
              <div className="h-1.5 overflow-hidden rounded-full bg-surface-hover">
                <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(item.percent, 1)}%` }} />
              </div>
              <span className="text-right font-mono text-xs text-foreground-subtle">{item.text}</span>
              <span className="text-right font-mono text-xs text-foreground-subtle">{item.percent}%</span>
            </div>
          ))
        )}
      </div>
      {items.length > initialLimit && (
        <Button variant="ghost" className="mt-4 h-8 px-2 text-xs" onClick={() => setExpanded((value) => !value)}>
          {expanded ? "Mostrar menos" : `Ver todos (${items.length})`}
        </Button>
      )}
    </Card>
  );
}

function CategoryDonutTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: WakatimeDurationRankItem }> }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return <ChartTooltip title={item.name} value={`${item.text} · ${item.percent}%`} />;
}

export function CategoryDonutCard({ items }: { items: WakatimeDurationRankItem[] }) {
  if (items.length === 0) return null;
  const visible = items.slice(0, 6);
  return (
    <Card className="min-w-0">
      <h2 className="text-sm font-semibold text-foreground-soft">Categorias</h2>
      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-[10rem_1fr] sm:items-center">
        <div className="h-40 min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Tooltip content={<CategoryDonutTooltip />} />
              <Pie data={visible} dataKey="seconds" nameKey="name" innerRadius="46%" outerRadius="84%" paddingAngle={1} stroke="var(--color-surface)">
                {visible.map((item, index) => <Cell key={item.name} fill={CHART_COLORS[index % CHART_COLORS.length]} />)}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="space-y-2">
          {visible.map((item, index) => (
            <div key={item.name} className="grid grid-cols-[minmax(0,1fr)_3rem_4.75rem] items-center gap-2 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-foreground-soft"><span className="h-2 w-2 flex-none rounded-full" style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }} /><span className="truncate">{item.name}</span></span>
              <span className="text-right font-mono text-xs text-foreground">{item.percent}%</span>
              <span className="text-right font-mono text-xs text-foreground-subtle">{item.text}</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

type IconType = ComponentType<{ className?: string; size?: number }>;

function editorIcon(name: string): IconType {
  const normalized = name.toLowerCase();
  if (normalized.includes("vs code") || normalized.includes("visual studio code")) return VscVscode;
  if (normalized.includes("phpstorm")) return SiPhpstorm;
  if (normalized.includes("webstorm")) return SiWebstorm;
  if (normalized.includes("intellij")) return SiIntellijidea;
  if (normalized.includes("cursor")) return SiCursor;
  if (normalized.includes("zed")) return SiZedindustries;
  if (normalized.includes("neovim")) return SiNeovim;
  if (normalized.includes("vim")) return SiVim;
  if (normalized.includes("sublime")) return SiSublimetext;
  if (normalized.includes("android studio")) return SiAndroidstudio;
  if (normalized.includes("xcode")) return SiXcode;
  if (normalized.includes("claude code")) return SiClaudecode;
  return LuMonitor;
}

function osIcon(name: string): IconType {
  const normalized = name.toLowerCase();
  if (normalized.includes("ubuntu")) return FaUbuntu;
  if (normalized.includes("red hat") || normalized.includes("fedora")) return FaRedhat;
  if (normalized.includes("linux")) return FaLinux;
  if (normalized.includes("windows")) return FaWindows;
  if (normalized.includes("mac") || normalized.includes("darwin") || normalized.includes("os x")) return FaApple;
  return FaDesktop;
}

export function IconDurationList({ title, items, kind }: { title: string; items: WakatimeDurationRankItem[]; kind: "editor" | "os" }) {
  if (items.length === 0 && kind === "editor") return null;
  return (
    <Card className="min-w-0">
      <h2 className="text-sm font-semibold text-foreground-soft">{title}</h2>
      <div className="mt-3 space-y-3.5">
        {items.length === 0 ? (
          <div className="flex items-center gap-3 text-sm text-foreground-subtle">
            <LuMonitor size={24} className="text-primary-light" />
            <span>Sem dados do período</span>
          </div>
        ) : items.slice(0, 5).map((item) => {
          const Icon = kind === "editor" ? editorIcon(item.name) : osIcon(item.name);
          return (
            <div key={item.name} className="grid grid-cols-[2rem_minmax(0,1fr)_4.5rem] items-center gap-3">
              <Icon size={24} className="text-primary-light" />
              <div className="min-w-0">
                <div className="flex items-center justify-between gap-3 text-sm text-foreground-soft">
                  <span className="truncate" title={item.name}>{item.name}</span>
                  <span className="font-mono text-xs text-foreground-subtle">{item.percent}%</span>
                </div>
                <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-hover"><div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(item.percent, 1)}%` }} /></div>
              </div>
              <span className="text-right font-mono text-xs text-foreground-subtle">{item.text}</span>
            </div>
          );
        })}
      </div>
    </Card>
  );
}

export function AiCodingCard({ aiCoding }: { aiCoding: WakatimeStats["aiCoding"] }) {
  if (!aiCoding) return null;
  return (
    <Card className="min-w-0">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground-soft">
        <CodeIcon size={17} className="text-primary-light" />
        AI coding
      </h2>
      <div className="mt-6">
        <div className="flex h-2 overflow-hidden rounded-full bg-surface-hover">
          <div className="bg-success" style={{ width: `${aiCoding.aiPercent}%` }} />
          <div className="bg-primary" style={{ width: `${aiCoding.humanPercent}%` }} />
        </div>
        <div className="mt-3 flex items-start justify-between gap-4 text-sm">
          <div>
            <p className="text-foreground-soft">AI-assisted</p>
            <p className="font-mono text-success">{aiCoding.aiPercent}%</p>
          </div>
          <div className="text-right">
            <p className="text-foreground-soft">Manual</p>
            <p className="font-mono text-primary-light">{aiCoding.humanPercent}%</p>
          </div>
        </div>
      </div>
      <p className="mt-6 text-xs text-foreground-subtle">Baseado em dados fornecidos pelo WakaTime.</p>
    </Card>
  );
}
