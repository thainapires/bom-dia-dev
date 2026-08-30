import {
  addDays,
  aggregateSummaryItems,
  buildDailyActivity,
  buildTimeBuckets,
  buildWeekdayActivity,
  calculateAiCoding,
  calculateStreaks,
  countDays,
  dominantTimeBucket,
  datesBetween,
  formatDate,
  formatDuration,
  isDistributionUseful,
  longestSession,
  mostProductiveWeekday,
  parseDate,
  type WakatimeDurationEntry,
  type WakatimeSummaryDay,
} from "./wakatimeCalculations";
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
  last_6_months: "últimos 6 meses",
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


function startOfWeek(date: Date): Date {
  const diasDesdeSegunda = (date.getUTCDay() + 6) % 7;
  return addDays(date, -diasDesdeSegunda);
}

function startOfMonth(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 12));
}

function addMonths(date: Date, delta: number): Date {
  const result = new Date(date);
  result.setUTCMonth(result.getUTCMonth() + delta);
  return result;
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
    case "last_6_months":
      return { start: formatDate(addDays(addMonths(today, -6), 1)), end: formatDate(today), label: RANGE_LABELS.last_6_months };
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


function formatBestDayLabel(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "2-digit", month: "long", timeZone: "UTC" }).format(
    parseDate(dateStr),
  );
}

interface WakatimeSummariesApiResponse {
  data: WakatimeSummaryDay[];
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

async function fetchJson<T>(url: string, apiKey: string, errorPrefix: string): Promise<T> {
  const auth = Buffer.from(apiKey).toString("base64");
  const response = await fetch(url, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new WakatimeError(`${errorPrefix} (${response.status}): ${body}`);
  }

  return response.json() as Promise<T>;
}

async function getDurationsForDate(apiKey: string, date: string): Promise<WakatimeDurationEntry[]> {
  const query = new URLSearchParams({ date, timezone: TIMEZONE });
  const { data } = await fetchJson<WakatimeDurationsApiResponse>(
    `${WAKATIME_API_BASE}/users/current/durations?${query}`,
    apiKey,
    "Falha ao buscar durations do Wakatime",
  );
  return data;
}

async function getDurationsForRange(apiKey: string, start: string, end: string): Promise<Array<{ date: string; entries: WakatimeDurationEntry[] }>> {
  const dates = datesBetween(start, end);
  const result: Array<{ date: string; entries: WakatimeDurationEntry[] }> = [];
  for (let index = 0; index < dates.length; index += 5) {
    const batch = dates.slice(index, index + 5);
    const entries = await Promise.all(batch.map(async (date) => ({ date, entries: await getDurationsForDate(apiKey, date) })));
    result.push(...entries);
  }
  return result;
}

export async function getWakatimeStats(params: GetWakatimeStatsParams = {}): Promise<WakatimeStats> {
  const apiKey = getApiKey();

  const { start, end, label } = resolveRange(params.range ?? "last_7_days", params.start, params.end, new Date());

  const query = new URLSearchParams({ start, end, timezone: TIMEZONE });
  const { data, cumulative_total, daily_average } = await fetchJson<WakatimeSummariesApiResponse>(
    `${WAKATIME_API_BASE}/users/current/summaries?${query}`,
    apiKey,
    "Falha ao buscar stats do Wakatime",
  );

  const dailyActivity = buildDailyActivity(data, start, end);
  const projects = aggregateSummaryItems(data, "projects");
  const categories = aggregateSummaryItems(data, "categories");
  const editors = aggregateSummaryItems(data, "editors");
  const operatingSystems = aggregateSummaryItems(data, "operating_systems");
  const aiCoding = calculateAiCoding(data);
  const weekdayActivity = buildWeekdayActivity(dailyActivity);
  const streaks = calculateStreaks(dailyActivity, end);
  const durationsByDate = countDays(start, end) <= 31 ? await getDurationsForRange(apiKey, start, end) : [];
  const durations = durationsByDate.flatMap((day) => day.entries);
  const timeBuckets = durations.length > 0 ? buildTimeBuckets(durations, TIMEZONE) : [];
  const dominantBucket = dominantTimeBucket(timeBuckets);

  const bestDay = dailyActivity.reduce<{ date: string; seconds: number } | null>((best, day) => {
    if (day.seconds <= 0) return best;
    return !best || day.seconds > best.seconds ? { date: day.date, seconds: day.seconds } : best;
  }, null);

  return {
    range: label,
    start,
    end,
    totalText: formatDuration(cumulative_total.seconds),
    dailyAverageText: formatDuration(daily_average.seconds),
    bestDay: bestDay
      ? { date: bestDay.date, text: `${formatDuration(bestDay.seconds)} — ${formatBestDayLabel(bestDay.date)}` }
      : null,
    languages: aggregateSummaryItems(data, "languages", 8),
    dailyActivity,
    projects,
    categories: isDistributionUseful(categories) ? categories : [],
    editors: isDistributionUseful(editors) ? editors : [],
    operatingSystems,
    timeBuckets,
    dominantTimeBucket: dominantBucket,
    longestSession: longestSession(durationsByDate),
    currentStreak: streaks.current,
    longestStreak: streaks.longest,
    mostProductiveWeekday: mostProductiveWeekday(dailyActivity),
    weekdayActivity,
    aiCoding,
  };
}

const SESSION_MERGE_GAP_SECONDS = 5 * 60;

interface WakatimeDurationsApiResponse {
  data: WakatimeDurationEntry[];
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

  const query = new URLSearchParams({ date, timezone: TIMEZONE });
  const { data } = await fetchJson<WakatimeDurationsApiResponse>(
    `${WAKATIME_API_BASE}/users/current/durations?${query}`,
    apiKey,
    "Falha ao buscar timeline do Wakatime",
  );

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
