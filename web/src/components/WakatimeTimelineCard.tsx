import { AltArrowLeftIcon } from "@solar-icons/react/bold-duotone/alt-arrow-left";
import { AltArrowRightIcon } from "@solar-icons/react/bold-duotone/alt-arrow-right";
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
const HOUR_TICKS = Array.from({ length: 25 }, (_, hour) => hour);
const GRID_TICKS = HOUR_TICKS.slice(1, -1);

interface TimelineRow {
  name: string;
  color: string;
  totalText: string;
  sessions: WakatimeTimelineSession[];
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
          <div className="mt-4 flex items-center gap-3">
            <div className="relative h-4 flex-1 text-[10px] text-white/40">
              {HOUR_TICKS.map((hour) => (
                <span
                  key={hour}
                  className="absolute -translate-x-1/2 first:translate-x-0 last:-translate-x-full"
                  style={{ left: `${(hour / 24) * 100}%` }}
                >
                  {String(hour).padStart(2, "0")}
                </span>
              ))}
            </div>
            <div className="w-32 shrink-0" />
          </div>

          <div className="mt-2 flex flex-col gap-1.5">
            {rows.map((row) => (
              <div key={row.name} className="flex items-center gap-2">
                <div className="relative h-6 flex-1 rounded-md bg-white/[0.08]">
                  {GRID_TICKS.map((hour) => (
                    <div
                      key={hour}
                      className="absolute inset-y-0 w-px bg-white/15"
                      style={{ left: `${(hour / 24) * 100}%` }}
                    />
                  ))}
                  {row.sessions.map((session, index) => {
                    const startSec = Math.min(secondsSinceMidnight(session.start), DAY_SECONDS);
                    const rawEndSec = secondsSinceMidnight(session.end);
                    const endSec = rawEndSec < startSec ? DAY_SECONDS : Math.min(rawEndSec, DAY_SECONDS);
                    const leftPct = (startSec / DAY_SECONDS) * 100;
                    const widthPct = ((endSec - startSec) / DAY_SECONDS) * 100;

                    return (
                      <div
                        key={`${session.start}-${index}`}
                        className="group absolute inset-y-0 rounded-full"
                        style={{
                          left: `${leftPct}%`,
                          width: `${widthPct}%`,
                          minWidth: "7px",
                          backgroundColor: row.color,
                        }}
                      >
                        <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 -translate-x-1/2 whitespace-nowrap rounded-md border border-white/10 bg-card-main px-2.5 py-1.5 text-xs opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
                          <p className="font-medium text-white">{session.project}</p>
                          <p className="text-white/50">
                            {formatHourMinuteSecond(session.start)}–{formatHourMinuteSecond(session.end)} ·{" "}
                            {formatDuration(session.durationSeconds)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="w-32 shrink-0 text-left">
                  <p className="truncate text-sm font-medium text-white">{row.name}</p>
                  <p className="text-xs text-white/40">{row.totalText}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 border-t border-white/5 pt-3">
            {rows.map((row) => (
              <div key={row.name} className="flex items-center gap-1.5 text-xs text-white/60">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: row.color }} />
                {row.name}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
