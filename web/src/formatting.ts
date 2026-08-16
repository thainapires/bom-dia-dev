export function formatDiasAberto(dias: number): string {
  if (dias === 0) return "Aberto hoje";
  if (dias === 1) return "Aberto há 1 dia";
  return `Aberto há ${dias} dias`;
}

export function toISODate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDays(isoDate: string, delta: number): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return toISODate(new Date(year, month - 1, day + delta));
}

export function formatNotesDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}
