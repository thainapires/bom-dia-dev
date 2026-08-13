import { RefreshCw } from "lucide-react";

const USER_FIRST_NAME = "Thai";

function greeting(hour: number): string {
  if (hour < 12) return "Bom dia";
  if (hour < 18) return "Boa tarde";
  return "Boa noite";
}

function formattedDate(date: Date): string {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });
}

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Header({ onRefresh, isRefreshing }: HeaderProps) {
  const now = new Date();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-2xl font-semibold text-white">
          {greeting(now.getHours())}, {USER_FIRST_NAME}
        </h1>
        <p className="mt-1 text-sm capitalize text-white/50">{formattedDate(now)}</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:opacity-50"
      >
        <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
        Atualizar
      </button>
    </div>
  );
}
