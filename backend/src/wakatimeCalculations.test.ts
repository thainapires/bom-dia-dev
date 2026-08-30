import { describe, expect, it } from "vitest";
import {
  aggregateSummaryItems,
  buildDailyActivity,
  buildTimeBuckets,
  calculateAiCoding,
  calculateStreaks,
  dominantTimeBucket,
  longestSession,
  mostProductiveWeekday,
  type WakatimeDurationEntry,
  type WakatimeSummaryDay,
} from "./wakatimeCalculations";

function day(date: string, seconds: number, overrides: Partial<WakatimeSummaryDay> = {}): WakatimeSummaryDay {
  return {
    range: { date },
    grand_total: { total_seconds: seconds },
    languages: [],
    projects: [],
    categories: [],
    editors: [],
    operating_systems: [],
    ...overrides,
  };
}

function duration(localIsoWithoutOffset: string, durationSeconds: number, project = "app"): WakatimeDurationEntry {
  return { project, time: Date.parse(`${localIsoWithoutOffset}-03:00`) / 1000, duration: durationSeconds };
}

describe("wakatimeCalculations", () => {
  it("preenche dias sem atividade no gráfico diário", () => {
    const result = buildDailyActivity([day("2026-08-25", 3600)], "2026-08-24", "2026-08-26");

    expect(result.map((item) => ({ date: item.date, seconds: item.seconds }))).toEqual([
      { date: "2026-08-24", seconds: 0 },
      { date: "2026-08-25", seconds: 3600 },
      { date: "2026-08-26", seconds: 0 },
    ]);
  });

  it("agrega projetos e linguagens ordenando por maior duração", () => {
    const result = aggregateSummaryItems(
      [
        day("2026-08-25", 5400, { projects: [{ name: "bom-dia-dev", total_seconds: 3600 }, { name: "site", total_seconds: 1800 }] }),
        day("2026-08-26", 3600, { projects: [{ name: "site", total_seconds: 3600 }] }),
      ],
      "projects",
    );

    expect(result.map((item) => [item.name, item.seconds, item.percent])).toEqual([
      ["site", 5400, 60],
      ["bom-dia-dev", 3600, 40],
    ]);
  });

  it("divide durations que atravessam buckets de horário", () => {
    const buckets = buildTimeBuckets([duration("2026-08-25T08:30:00", 2 * 3600)], "America/Sao_Paulo");

    expect(buckets.find((bucket) => bucket.label === "06-09")?.seconds).toBe(30 * 60);
    expect(buckets.find((bucket) => bucket.label === "09-12")?.seconds).toBe(90 * 60);
    expect(dominantTimeBucket(buckets)?.label).toBe("09-12");
  });

  it("calcula maior sessão sem somar sessões separadas", () => {
    const result = longestSession([
      { date: "2026-08-25", entries: [duration("2026-08-25T09:00:00", 30 * 60), duration("2026-08-25T10:00:00", 45 * 60)] },
      { date: "2026-08-26", entries: [duration("2026-08-26T11:00:00", 20 * 60)] },
    ]);

    expect(result).toMatchObject({ seconds: 45 * 60, project: "app", date: "2026-08-25" });
  });

  it("calcula streak atual e maior streak respeitando datas reais", () => {
    const streaks = calculateStreaks(
      [
        { date: "2026-08-22", seconds: 3600 },
        { date: "2026-08-23", seconds: 3600 },
        { date: "2026-08-24", seconds: 0 },
        { date: "2026-08-25", seconds: 3600 },
        { date: "2026-08-26", seconds: 3600 },
      ],
      "2026-08-26",
    );

    expect(streaks).toEqual({ current: 2, longest: 2 });
  });

  it("calcula dia da semana mais produtivo pela média dos dias ativos", () => {
    const result = mostProductiveWeekday([
      { date: "2026-08-24", seconds: 2 * 3600 },
      { date: "2026-08-25", seconds: 8 * 3600 },
      { date: "2026-08-26", seconds: 0 },
    ]);

    expect(result).toMatchObject({ weekday: "Terça-feira", averageSeconds: 8 * 3600, sampleDays: 1 });
  });

  it("só retorna AI coding quando há campos explícitos de linhas", () => {
    expect(calculateAiCoding([day("2026-08-25", 3600)])).toBeNull();
    expect(
      calculateAiCoding([
        day("2026-08-25", 3600, {
          grand_total: {
            total_seconds: 3600,
            ai_additions: 20,
            ai_deletions: 10,
            human_additions: 60,
            human_deletions: 10,
          },
        }),
      ]),
    ).toEqual({ aiLines: 30, humanLines: 70, aiPercent: 30, humanPercent: 70 });
  });
});
