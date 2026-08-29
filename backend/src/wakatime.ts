import type { WakatimeRangeKey, WakatimeStats, WakatimeTimeline, WakatimeTimelineProject } from "./types";

export class WakatimeError extends Error {}

const WAKATIME_API_BASE = "https://wakatime.com/api/v1";
const TIMEZONE = "America/Sao_Paulo";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const RANGE_LABELS: Record<Exclude<WakatimeRangeKey, "custom">, string> = {
  today: "hoje",
  yesterday: "ontem",
  last_7_days: "últimos 7 dias",
  last_14_days: "últimos 14 dias",
  last_30_days: "últimos 30 dias",
  this_week: "essa semana",
  last_week: "semana passada",
  this_month: "esse mês",
  last_month: "mês passado",
};

function toDateStr(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// Wrapper de "data pura" (meio-dia UTC) pra fazer aritmética de calendário
// sem risco de DST — a conversão pro fuso de SP já aconteceu em `toDateStr`.
function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, delta: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + delta);
  return result;
}

// Segunda-feira como início de semana.
function startOfWeek(date: Date): Date {
  const diasDesdeSegunda = (date.getUTCDay() + 6) % 7;
  return addDays(date, -diasDesdeSegunda);
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
}

function endOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0, 12));
}

function formatShortDate(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "2-digit", timeZone: "UTC" }).format(
    parseDate(dateStr),
  );
}

function formatCustomLabel(start: string, end: string): string {
  return start === end ? formatShortDate(start) : `${formatShortDate(start)} – ${formatShortDate(end)}`;
}

interface ResolvedRange {
  start: string;
  end: string;
  label: string;
}

function resolveRange(
  range: WakatimeRangeKey,
  customStart: string | undefined,
  customEnd: string | undefined,
  now: Date,
): ResolvedRange {
  if (range === "custom") {
    if (!customStart || !customEnd || !DATE_RE.test(customStart) || !DATE_RE.test(customEnd)) {
      throw new WakatimeError("Range customizado exige start e end no formato YYYY-MM-DD");
    }
    if (customStart > customEnd) {
      throw new WakatimeError("Data inicial não pode ser depois da data final");
    }
    return { start: customStart, end: customEnd, label: formatCustomLabel(customStart, customEnd) };
  }

  const today = parseDate(toDateStr(now));

  switch (range) {
    case "today":
      return { start: formatDate(today), end: formatDate(today), label: RANGE_LABELS.today };
    case "yesterday": {
      const ontem = addDays(today, -1);
      return { start: formatDate(ontem), end: formatDate(ontem), label: RANGE_LABELS.yesterday };
    }
    case "last_7_days":
      return { start: formatDate(addDays(today, -6)), end: formatDate(today), label: RANGE_LABELS.last_7_days };
    case "last_14_days":
      return { start: formatDate(addDays(today, -13)), end: formatDate(today), label: RANGE_LABELS.last_14_days };
    case "last_30_days":
      return { start: formatDate(addDays(today, -29)), end: formatDate(today), label: RANGE_LABELS.last_30_days };
    case "this_week":
      return { start: formatDate(startOfWeek(today)), end: formatDate(today), label: RANGE_LABELS.this_week };
    case "last_week": {
      const inicioEstaSemana = startOfWeek(today);
      return {
        start: formatDate(addDays(inicioEstaSemana, -7)),
        end: formatDate(addDays(inicioEstaSemana, -1)),
        label: RANGE_LABELS.last_week,
      };
    }
    case "this_month":
      return { start: formatDate(startOfMonth(today)), end: formatDate(today), label: RANGE_LABELS.this_month };
    case "last_month": {
      const ancoraMesPassado = addDays(startOfMonth(today), -1);
      return {
        start: formatDate(startOfMonth(ancoraMesPassado)),
        end: formatDate(endOfMonth(ancoraMesPassado)),
        label: RANGE_LABELS.last_month,
      };
    }
    default:
      throw new WakatimeError(`Range inválido: ${range}`);
  }
}

function formatDuration(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

function formatBestDayLabel(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "UTC" }).format(
    parseDate(dateStr),
  );
}

interface WakatimeSummariesApiResponse {
  data: Array<{
    grand_total: { total_seconds: number };
    languages: Array<{ name: string; total_seconds: number }>;
    range: { date: string };
  }>;
  cumulative_total: { seconds: number };
  daily_average: { seconds: number };
}

export interface GetWakatimeStatsParams {
  range?: WakatimeRangeKey;
  start?: string;
  end?: string;
}

function getApiKey(): string {
  const apiKey = process.env.WAKATIME_API_KEY;
  if (!apiKey) {
    throw new WakatimeError("WAKATIME_API_KEY não configurada no .env");
  }
  return apiKey;
}

export async function getWakatimeStats(params: GetWakatimeStatsParams = {}): Promise<WakatimeStats> {
  const apiKey = getApiKey();

  const { start, end, label } = resolveRange(params.range ?? "last_7_days", params.start, params.end, new Date());

  const auth = Buffer.from(apiKey).toString("base64");
  const query = new URLSearchParams({ start, end, timezone: TIMEZONE });
  const response = await fetch(`${WAKATIME_API_BASE}/users/current/summaries?${query}`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new WakatimeError(`Falha ao buscar stats do Wakatime (${response.status}): ${body}`);
  }

  const { data, cumulative_total, daily_average } = (await response.json()) as WakatimeSummariesApiResponse;

  const languageSeconds = new Map<string, number>();
  let bestDay: { date: string; seconds: number } | null = null;

  for (const day of data) {
    const seconds = day.grand_total.total_seconds;
    if (seconds > 0 && (!bestDay || seconds > bestDay.seconds)) {
      bestDay = { date: day.range.date, seconds };
    }
    for (const lang of day.languages) {
      languageSeconds.set(lang.name, (languageSeconds.get(lang.name) ?? 0) + lang.total_seconds);
    }
  }

  const totalLanguageSeconds = [...languageSeconds.values()].reduce((sum, seconds) => sum + seconds, 0);
  const languages = [...languageSeconds.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, seconds]) => ({
      name,
      percent: totalLanguageSeconds > 0 ? Math.round((seconds / totalLanguageSeconds) * 1000) / 10 : 0,
      text: formatDuration(seconds),
    }));

  return {
    range: label,
    totalText: formatDuration(cumulative_total.seconds),
    dailyAverageText: formatDuration(daily_average.seconds),
    bestDay: bestDay
      ? { date: bestDay.date, text: `${formatDuration(bestDay.seconds)} — ${formatBestDayLabel(bestDay.date)}` }
      : null,
    languages,
  };
}

// Sessões separadas por menos que isso na mesma trilha viram um único bloco
// visual — o endpoint /durations retorna um registro por heartbeat agrupado,
// então sem essa fusão a timeline fica cheia de blocos minúsculos.
const SESSION_MERGE_GAP_SECONDS = 5 * 60;

interface WakatimeDurationsApiResponse {
  data: Array<{ project: string | null; time: number; duration: number }>;
}

export interface GetWakatimeTimelineParams {
  date?: string;
}

export async function getWakatimeTimeline(params: GetWakatimeTimelineParams = {}): Promise<WakatimeTimeline> {
  const apiKey = getApiKey();

  const date = params.date ?? toDateStr(new Date());
  if (!DATE_RE.test(date)) {
    throw new WakatimeError("Data inválida, use o formato YYYY-MM-DD");
  }

  const auth = Buffer.from(apiKey).toString("base64");
  const query = new URLSearchParams({ date, timezone: TIMEZONE });
  const response = await fetch(`${WAKATIME_API_BASE}/users/current/durations?${query}`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new WakatimeError(`Falha ao buscar timeline do Wakatime (${response.status}): ${body}`);
  }

  const { data } = (await response.json()) as WakatimeDurationsApiResponse;

  const rangesByProject = new Map<string, Array<{ start: number; end: number }>>();
  for (const entry of data) {
    const project = entry.project ?? "Sem projeto";
    const ranges = rangesByProject.get(project) ?? [];
    ranges.push({ start: entry.time, end: entry.time + entry.duration });
    rangesByProject.set(project, ranges);
  }

  const projects: WakatimeTimelineProject[] = [];
  for (const [name, ranges] of rangesByProject) {
    ranges.sort((a, b) => a.start - b.start);

    const merged: Array<{ start: number; end: number }> = [];
    for (const range of ranges) {
      const last = merged[merged.length - 1];
      if (last && range.start - last.end <= SESSION_MERGE_GAP_SECONDS) {
        last.end = Math.max(last.end, range.end);
      } else {
        merged.push({ ...range });
      }
    }

    const totalSeconds = merged.reduce((sum, session) => sum + (session.end - session.start), 0);
    projects.push({
      name,
      totalSeconds,
      totalText: formatDuration(totalSeconds),
      sessions: merged.map((session) => ({
        project: name,
        start: new Date(session.start * 1000).toISOString(),
        end: new Date(session.end * 1000).toISOString(),
        durationSeconds: session.end - session.start,
      })),
    });
  }

  projects.sort((a, b) => b.totalSeconds - a.totalSeconds);

  return { date, projects };
}
