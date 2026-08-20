import type { WakatimeStats } from "./types";

export class WakatimeError extends Error {}

const WAKATIME_API_BASE = "https://wakatime.com/api/v1";

interface WakatimeStatsApiResponse {
  data: {
    range: string;
    human_readable_total: string;
    human_readable_daily_average: string;
    best_day: { date: string; text: string } | null;
    languages: Array<{ name: string; percent: number; text: string }>;
  };
}

export async function getWakatimeStats(range = "last_7_days"): Promise<WakatimeStats> {
  const apiKey = process.env.WAKATIME_API_KEY;
  if (!apiKey) {
    throw new WakatimeError("WAKATIME_API_KEY não configurada no .env");
  }

  const auth = Buffer.from(apiKey).toString("base64");
  const response = await fetch(`${WAKATIME_API_BASE}/users/current/stats/${range}`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new WakatimeError(`Falha ao buscar stats do Wakatime (${response.status}): ${body}`);
  }

  const { data } = (await response.json()) as WakatimeStatsApiResponse;

  return {
    range: data.range,
    totalText: data.human_readable_total,
    dailyAverageText: data.human_readable_daily_average,
    bestDay: data.best_day,
    languages: (data.languages ?? [])
      .slice(0, 8)
      .map((lang) => ({ name: lang.name, percent: lang.percent, text: lang.text })),
  };
}
