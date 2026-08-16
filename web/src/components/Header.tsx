import { RefreshCw } from "lucide-react";
import { TIMEZONE, getSaoPauloHour } from "../formatting";

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
    timeZone: TIMEZONE,
  });
}

interface HeaderProps {
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function Header({ onRefresh, isRefreshing }: HeaderProps) {
  const now = new Date();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold text-white sm:text-2xl">
          {greeting(getSaoPauloHour(now))}, {USER_FIRST_NAME}
        </h1>
        <p className="mt-1 text-sm capitalize text-white/50">{formattedDate(now)}</p>
      </div>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="flex flex-none items-center gap-2 rounded-lg bg-card px-3 py-2 text-sm text-white/80 transition hover:bg-white/10 disabled:opacity-50"
      >
        <RefreshCw size={16} className={isRefreshing ? "animate-spin" : ""} />
        Atualizar
      </button>
    </div>
  );
}
