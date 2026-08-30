import type {
  WakatimeAiCoding,
  WakatimeDailyActivity,
  WakatimeDurationRankItem,
  WakatimeTimeBucket,
} from "./types";

export interface WakatimeSummaryItem {
  name: string;
  total_seconds: number;
}

export interface WakatimeSummaryDay {
  grand_total: {
    total_seconds: number;
    ai_additions?: number | null;
    ai_deletions?: number | null;
    human_additions?: number | null;
    human_deletions?: number | null;
  };
  languages?: WakatimeSummaryItem[];
  projects?: WakatimeSummaryItem[];
  categories?: WakatimeSummaryItem[];
  editors?: WakatimeSummaryItem[];
  operating_systems?: WakatimeSummaryItem[];
  range: { date: string };
}

export interface WakatimeDurationEntry {
  project: string | null;
  time: number;
  duration: number;
}

const DAY_SECONDS = 24 * 60 * 60;
const TIME_BUCKETS = [
  { start: 0, end: 6, label: "00-06" },
  { start: 6, end: 9, label: "06-09" },
  { start: 9, end: 12, label: "09-12" },
  { start: 12, end: 15, label: "12-15" },
  { start: 15, end: 18, label: "15-18" },
  { start: 18, end: 21, label: "18-21" },
  { start: 21, end: 24, label: "21-24" },
];

export function parseDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function formatDate(date: Date): string {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(date: Date, delta: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + delta);
  return result;
}

export function datesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  for (let cursor = parseDate(start); formatDate(cursor) <= end; cursor = addDays(cursor, 1)) {
    dates.push(formatDate(cursor));
  }
  return dates;
}

export function countDays(start: string, end: string): number {
  return datesBetween(start, end).length;
}

export function formatDuration(totalSeconds: number): string {
  const totalMinutes = Math.round(totalSeconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes}min`;
  if (minutes === 0) return `${hours}h`;
  return `${hours}h ${minutes}min`;
}

function formatDailyLabel(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: "UTC" }).format(parseDate(dateStr));
}

function formatFullDate(dateStr: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    timeZone: "UTC",
  }).format(parseDate(dateStr));
}

export function buildDailyActivity(days: WakatimeSummaryDay[], start: string, end: string): WakatimeDailyActivity[] {
  const byDate = new Map(days.map((day) => [day.range.date, day.grand_total.total_seconds]));
  return datesBetween(start, end).map((date) => {
    const seconds = byDate.get(date) ?? 0;
    return {
      date,
      label: formatDailyLabel(date),
      fullLabel: formatFullDate(date),
      seconds,
      text: formatDuration(seconds),
    };
  });
}

export function aggregateSummaryItems(days: WakatimeSummaryDay[], key: "languages" | "projects" | "categories" | "editors" | "operating_systems", limit?: number): WakatimeDurationRankItem[] {
  const totals = new Map<string, number>();
  for (const day of days) {
    for (const item of day[key] ?? []) {
      totals.set(item.name, (totals.get(item.name) ?? 0) + item.total_seconds);
    }
  }

  const totalSeconds = [...totals.values()].reduce((sum, seconds) => sum + seconds, 0);
  const items = [...totals.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([name, seconds]) => ({
      name,
      seconds,
      percent: totalSeconds > 0 ? Math.round((seconds / totalSeconds) * 1000) / 10 : 0,
      text: formatDuration(seconds),
    }));

  return typeof limit === "number" ? items.slice(0, limit) : items;
}

export function calculateStreaks(dailyActivity: Array<{ date: string; seconds: number }>, today: string): { current: number; longest: number } {
  const activeDates = new Set(dailyActivity.filter((day) => day.seconds > 0).map((day) => day.date));
  let current = 0;
  for (let cursor = parseDate(today); activeDates.has(formatDate(cursor)); cursor = addDays(cursor, -1)) {
    current++;
  }

  let longest = 0;
  let running = 0;
  for (const day of [...dailyActivity].sort((a, b) => a.date.localeCompare(b.date))) {
    if (day.seconds > 0) {
      running++;
      longest = Math.max(longest, running);
    } else {
      running = 0;
    }
  }

  return { current, longest };
}

function secondsSinceMidnight(iso: string, timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(iso));
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value ?? 0);
  return get("hour") * 3600 + get("minute") * 60 + get("second");
}

export function buildTimeBuckets(durations: WakatimeDurationEntry[], timezone: string): WakatimeTimeBucket[] {
  const totals = TIME_BUCKETS.map((bucket) => ({ ...bucket, seconds: 0 }));

  for (const duration of durations) {
    const startIso = new Date(duration.time * 1000).toISOString();
    const endIso = new Date((duration.time + duration.duration) * 1000).toISOString();
    let start = secondsSinceMidnight(startIso, timezone);
    let end = secondsSinceMidnight(endIso, timezone);
    if (end <= start) end = DAY_SECONDS;

    for (const bucket of totals) {
      const bucketStart = bucket.start * 3600;
      const bucketEnd = bucket.end * 3600;
      const overlap = Math.max(0, Math.min(end, bucketEnd) - Math.max(start, bucketStart));
      bucket.seconds += overlap;
    }
  }

  return totals.map((bucket) => ({ label: bucket.label, seconds: bucket.seconds, text: formatDuration(bucket.seconds) }));
}

export function dominantTimeBucket(buckets: WakatimeTimeBucket[]): WakatimeTimeBucket | null {
  const bucket = [...buckets].sort((a, b) => b.seconds - a.seconds)[0];
  return bucket && bucket.seconds > 0 ? bucket : null;
}

export function longestSession(durationsByDate: Array<{ date: string; entries: WakatimeDurationEntry[] }>): { text: string; seconds: number; project: string | null; date: string } | null {
  let longest: { seconds: number; project: string | null; date: string } | null = null;
  for (const day of durationsByDate) {
    for (const entry of day.entries) {
      if (!longest || entry.duration > longest.seconds) {
        longest = { seconds: entry.duration, project: entry.project, date: day.date };
      }
    }
  }
  return longest ? { ...longest, text: formatDuration(longest.seconds) } : null;
}

const WEEKDAYS = ["Domingo", "Segunda-feira", "Terça-feira", "Quarta-feira", "Quinta-feira", "Sexta-feira", "Sábado"];
const WEEKDAYS_SHORT = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export function buildWeekdayActivity(dailyActivity: Array<{ date: string; seconds: number }>) {
  const groups = new Map<number, { total: number; samples: number }>();
  for (const day of dailyActivity) {
    if (day.seconds <= 0) continue;
    const weekday = parseDate(day.date).getUTCDay();
    const group = groups.get(weekday) ?? { total: 0, samples: 0 };
    group.total += day.seconds;
    group.samples++;
    groups.set(weekday, group);
  }

  return [1, 2, 3, 4, 5, 6, 0].map((weekday) => {
    const group = groups.get(weekday) ?? { total: 0, samples: 0 };
    const averageSeconds = group.samples > 0 ? group.total / group.samples : 0;
    return {
      weekday: WEEKDAYS[weekday],
      shortLabel: WEEKDAYS_SHORT[weekday],
      averageSeconds,
      averageText: formatDuration(averageSeconds),
      sampleDays: group.samples,
    };
  });
}

export function mostProductiveWeekday(dailyActivity: Array<{ date: string; seconds: number }>): { weekday: string; averageText: string; averageSeconds: number; sampleDays: number } | null {
  const groups = new Map<number, { total: number; samples: number }>();
  for (const day of dailyActivity) {
    if (day.seconds <= 0) continue;
    const weekday = parseDate(day.date).getUTCDay();
    const group = groups.get(weekday) ?? { total: 0, samples: 0 };
    group.total += day.seconds;
    group.samples++;
    groups.set(weekday, group);
  }

  const best = [...groups.entries()]
    .map(([weekday, group]) => ({ weekday, averageSeconds: group.total / group.samples, sampleDays: group.samples }))
    .sort((a, b) => b.averageSeconds - a.averageSeconds)[0];

  return best
    ? {
        weekday: WEEKDAYS[best.weekday],
        averageSeconds: best.averageSeconds,
        averageText: formatDuration(best.averageSeconds),
        sampleDays: best.sampleDays,
      }
    : null;
}

export function calculateAiCoding(days: WakatimeSummaryDay[]): WakatimeAiCoding | null {
  let aiLines = 0;
  let humanLines = 0;
  for (const day of days) {
    aiLines += (day.grand_total.ai_additions ?? 0) + (day.grand_total.ai_deletions ?? 0);
    humanLines += (day.grand_total.human_additions ?? 0) + (day.grand_total.human_deletions ?? 0);
  }

  const total = aiLines + humanLines;
  if (total <= 0) return null;
  return {
    aiLines,
    humanLines,
    aiPercent: Math.round((aiLines / total) * 1000) / 10,
    humanPercent: Math.round((humanLines / total) * 1000) / 10,
  };
}

export function isDistributionUseful(items: WakatimeDurationRankItem[]): boolean {
  return items.length > 1 && items[0].percent < 99.5;
}
