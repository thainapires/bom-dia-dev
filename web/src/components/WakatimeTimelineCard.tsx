import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
import { Fragment, useEffect, useState } from "react";
import { TIMEZONE, addDays, toISODate } from "../formatting";
import type { WakatimeTimeline, WakatimeTimelineSession } from "../types";

// Paleta categórica validada (checagem de daltonismo + contraste) contra o
// fundo escuro dos cards deste projeto (#19232F) — ver skill de dataviz.
// Ordem fixa, nunca ciclada: o 9º projeto em diante vira "Outros".
const PALETTE = [
  "#3987e5",
  "#d95926",
  "#199e70",
  "#c98500",
  "#d55181",
  "#008300",
  "#9085e9",
  "#e66767",
];

const DAY_SECONDS = 24 * 60 * 60;
const AXIS_HOURS = [0, 3, 6, 9, 12, 15, 18, 21, 24];

interface TimelineRow {
  name: string;
  color: string;
  totalText: string;
  sessions: WakatimeTimelineSession[];
}

interface HoveredSegment {
  project: string;
  color: string;
  start: string;
  end: string;
  durationSeconds: number;
}

function formatDuration(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

function secondsSinceMidnight(iso: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return get("hour") * 3600 + get("minute") * 60 + get("second");
}

function formatHourMinuteSecond(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  });
}

function buildRows(projects: WakatimeTimeline["projects"]): TimelineRow[] {
  if (projects.length <= PALETTE.length) {
    return projects.map((project, index) => ({
      name: project.name,
      color: PALETTE[index],
      totalText: project.totalText,
      sessions: project.sessions,
    }));
  }

  const individual = projects.slice(0, PALETTE.length - 1);
  const rest = projects.slice(PALETTE.length - 1);
  const outrosSeconds = rest.reduce((sum, project) => sum + project.totalSeconds, 0);

  return [
    ...individual.map((project, index) => ({
      name: project.name,
      color: PALETTE[index],
      totalText: project.totalText,
      sessions: project.sessions,
    })),
    {
      name: "Outros",
      color: PALETTE[PALETTE.length - 1],
      totalText: formatDuration(outrosSeconds),
      sessions: rest.flatMap((project) => project.sessions),
    },
  ];
}

function formatDateLabel(dateStr: string): string {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12)).toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: "UTC",
  });
}

interface WakatimeTimelineCardProps {
  timeline: WakatimeTimeline;
  onDateChange: (date: string) => void;
}

export function WakatimeTimelineCard({ timeline, onDateChange }: WakatimeTimelineCardProps) {
  const rows = buildRows(timeline.projects);
  const isToday = timeline.date === toISODate(new Date());
  const nowPct = isToday ? (secondsSinceMidnight(new Date().toISOString()) / DAY_SECONDS) * 100 : null;
  const [hovered, setHovered] = useState<HoveredSegment | null>(null);

  useEffect(() => {
    setHovered(null);
  }, [timeline.date]);

  return (
    <div className="rounded-lg border border-white/5 bg-card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-white/80">Timeline do dia</h2>
        <div className="flex items-center gap-1 rounded-md bg-white/5 px-1.5 py-1 text-xs text-white/60">
          <button
            type="button"
            onClick={() => onDateChange(addDays(timeline.date, -1))}
            className="rounded p-1 transition hover:bg-white/10 hover:text-white active:scale-[0.9] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            title="Dia anterior"
          >
            <AltArrowLeftIcon size={13} />
          </button>
          <span className="min-w-24 text-center capitalize">
            {isToday ? "Hoje" : formatDateLabel(timeline.date)}
          </span>
          <button
            type="button"
            onClick={() => onDateChange(addDays(timeline.date, 1))}
            disabled={isToday}
            className="rounded p-1 transition hover:bg-white/10 hover:text-white active:scale-[0.9] disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent disabled:active:scale-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/25 focus-visible:ring-offset-2 focus-visible:ring-offset-bg"
            title="Próximo dia"
          >
            <AltArrowRightIcon size={13} />
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="mt-3 text-sm text-white/40">Sem atividade registrada nesse dia.</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <div className="relative min-w-[36rem]">
              <div className="grid w-full grid-cols-[9.5rem_1fr] items-center gap-x-3 gap-y-1.5">
                {/* Eixo de horário — poucos marcos (a cada 3h) em vez de uma grade por hora. */}
                <div className="sticky left-0 z-10 bg-card" />
                <div className="relative h-4 border-b border-white/5 pb-1.5 font-mono text-[10px] tabular-nums text-white/40">
                  {AXIS_HOURS.map((hour) => (
                    <span
                      key={hour}
                      className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                      style={{ left: `${(hour / 24) * 100}%` }}
                    >
                      {String(hour).padStart(2, "0")}
                    </span>
                  ))}
                </div>

                {rows.map((row) => (
                  <Fragment key={row.name}>
                    <div className="sticky left-0 z-10 flex min-w-0 flex-col justify-center gap-0.5 bg-card pr-2">
                      <span className="flex items-center gap-1.5 truncate text-sm font-medium text-white/90" title={row.name}>
                        <span
                          className="h-1.5 w-1.5 shrink-0 rounded-full"
                          style={{ backgroundColor: row.color }}
                        />
                        <span className="truncate">{row.name}</span>
                      </span>
                      <span className="pl-3 font-mono text-xs text-white/40">{row.totalText}</span>
                    </div>

                    <div className="relative h-7 rounded-md bg-white/[0.06] transition-colors hover:bg-white/[0.09]">
                      {row.sessions.map((session, index) => {
                        const startSec = Math.min(secondsSinceMidnight(session.start), DAY_SECONDS);
                        const rawEndSec = secondsSinceMidnight(session.end);
                        const endSec = rawEndSec < startSec ? DAY_SECONDS : Math.min(rawEndSec, DAY_SECONDS);
                        const leftPct = (startSec / DAY_SECONDS) * 100;
                        const widthPct = ((endSec - startSec) / DAY_SECONDS) * 100;

                        return (
                          <button
                            key={`${session.start}-${index}`}
                            type="button"
                            onMouseEnter={() =>
                              setHovered({ project: session.project, color: row.color, ...session })
                            }
                            onFocus={() =>
                              setHovered({ project: session.project, color: row.color, ...session })
                            }
                            onClick={() =>
                              setHovered({ project: session.project, color: row.color, ...session })
                            }
                            onMouseLeave={() => setHovered(null)}
                            onBlur={() => setHovered(null)}
                            title={`${session.project} · ${formatHourMinuteSecond(session.start)}–${formatHourMinuteSecond(session.end)} · ${formatDuration(session.durationSeconds)}`}
                            className="absolute inset-y-1 cursor-pointer  border-0 p-0 outline-none transition-[filter] duration-150 hover:brightness-125 focus-visible:brightness-125 focus-visible:ring-2 focus-visible:ring-white/50"
                            style={{
                              left: `${leftPct}%`,
                              width: `${widthPct}%`,
                              minWidth: "4px",
                              backgroundColor: row.color,
                            }}
                          />
                        );
                      })}
                    </div>
                  </Fragment>
                ))}
              </div>

              {/* Fora do grid: um item com grid-row abrangendo todas as linhas
                  implícitas ("1 / -1") fica ambíguo sem grid-template-rows
                  explícito e descolava o auto-placement das linhas seguintes.
                  Por isso o marcador de "agora" é posicionado à parte, alinhado
                  à coluna da trilha via calc() (9.5rem = largura da coluna de
                  rótulo, 0.75rem = gap-x-3). */}
              {nowPct !== null && (
                <div
                  className="pointer-events-none absolute inset-y-0"
                  style={{ left: "calc(9.5rem + 0.75rem)", right: 0 }}
                >
                  <span
                    className="absolute -top-0.5 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-status-ready"
                    style={{ left: `${nowPct}%` }}
                  />
                  <span
                    className="absolute inset-y-0 w-px bg-status-ready/40"
                    style={{ left: `${nowPct}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div
            aria-live="polite"
            className="mt-3 flex h-9 items-center gap-2 rounded-md border border-white/5 bg-white/[0.03] px-3 text-xs"
          >
            {hovered ? (
              <>
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: hovered.color }} />
                <span className="font-medium text-white">{hovered.project}</span>
                <span className="text-white/25">·</span>
                <span className="font-mono text-white/60">
                  {formatHourMinuteSecond(hovered.start)}–{formatHourMinuteSecond(hovered.end)}
                </span>
                <span className="text-white/25">·</span>
                <span className="text-white/50">{formatDuration(hovered.durationSeconds)}</span>
              </>
            ) : (
              <span className="text-white/30">Passe o mouse ou navegue com Tab sobre um bloco para ver os detalhes</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
