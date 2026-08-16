export function formatDiasAberto(dias: number): string {
  if (dias === 0) return "Aberto hoje";
  if (dias === 1) return "Aberto há 1 dia";
  return `Aberto há ${dias} dias`;
}

export const TIMEZONE = "America/Sao_Paulo";

export function toISODate(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function getSaoPauloHour(date: Date = new Date()): number {
  return Number(
    new Intl.DateTimeFormat("en-US", {
      timeZone: TIMEZONE,
      hour: "2-digit",
      hourCycle: "h23",
    }).format(date),
  );
}

function anchorUTC(isoDate: string): Date {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(Date.UTC(year, month - 1, day, 12));
}

export function addDays(isoDate: string, delta: number): string {
  const anchored = anchorUTC(isoDate);
  anchored.setUTCDate(anchored.getUTCDate() + delta);
  const year = anchored.getUTCFullYear();
  const month = String(anchored.getUTCMonth() + 1).padStart(2, "0");
  const day = String(anchored.getUTCDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function formatNotesDate(isoDate: string): string {
  return anchorUTC(isoDate).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}
