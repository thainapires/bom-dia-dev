export function formatDiasAberto(diasAberto: number, horasAberto: number): string {
  if (diasAberto === 0) {
    if (horasAberto === 0) return "Aberto agora";
    return horasAberto === 1 ? "Aberto há 1h" : `Aberto há ${horasAberto}h`;
  }
  if (diasAberto === 1) return "Aberto há 1 dia";
  return `Aberto há ${diasAberto} dias`;
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

export function formatRelativeDays(iso: string): string {
  const toUTCDays = (isoDate: string) => {
    const [year, month, day] = isoDate.split("-").map(Number);
    return Date.UTC(year, month - 1, day) / (1000 * 60 * 60 * 24);
  };
  const diffDays = Math.round(toUTCDays(toISODate(new Date())) - toUTCDays(toISODate(new Date(iso))));
  if (diffDays <= 0) return "hoje";
  if (diffDays === 1) return "ontem";
  return `há ${diffDays} dias`;
}

export function formatHourMinute(iso: string): string {
  return new Date(iso).toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: TIMEZONE,
  });
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

export function formatShortDate(isoDate: string): string {
  return anchorUTC(isoDate)
    .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric", timeZone: "UTC" })
    .replace(".", "");
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
