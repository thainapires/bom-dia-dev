export function formatDiasAberto(dias: number): string {
  if (dias === 0) return "Aberto hoje";
  if (dias === 1) return "Aberto há 1 dia";
  return `Aberto há ${dias} dias`;
}
