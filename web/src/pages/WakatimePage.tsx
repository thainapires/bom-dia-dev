import { ClockCircleIcon } from "@solar-icons/react/bold-duotone/clock-circle";
import { FireIcon } from "@solar-icons/react/bold-duotone/fire";
import { MedalStarIcon } from "@solar-icons/react/bold-duotone/medal-star";
import { useCallback, useEffect, useState } from "react";
import { fetchWakatimeStats } from "../api";
import { Header } from "../components/Header";
import type { WakatimeStats } from "../types";

export function WakatimePage() {
  const [data, setData] = useState<WakatimeStats | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const stats = await fetchWakatimeStats();
      setData(stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao buscar dados");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <>
      <Header onRefresh={load} isRefreshing={isLoading} />

      {error && (
        <div className="mt-4 rounded-lg border-l-4 border-l-status-attention bg-card px-4 py-3 text-sm text-white/80">
          Não foi possível carregar os dados do Wakatime: {error}
        </div>
      )}

      {data && (
        <>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-white/5 bg-card px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs uppercase text-white/50">
                <ClockCircleIcon size={17} className="text-status-ready" />
                Tempo codando ({data.range})
              </p>
              <p className="mt-1 text-2xl font-semibold text-status-ready">{data.totalText}</p>
            </div>
            <div className="rounded-lg border border-white/5 bg-card px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs uppercase text-white/50">
                <FireIcon size={17} className="text-status-waiting" />
                Média diária
              </p>
              <p className="mt-1 text-2xl font-semibold text-status-waiting">
                {data.dailyAverageText}
              </p>
            </div>
            <div className="rounded-lg border border-white/5 bg-card px-4 py-3">
              <p className="flex items-center gap-1.5 text-xs uppercase text-white/50">
                <MedalStarIcon size={17} className="text-status-neutral" />
                Melhor dia
              </p>
              <p className="mt-1 text-2xl font-semibold text-white">
                {data.bestDay ? data.bestDay.text : "sem dados"}
              </p>
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-white/5 bg-card p-4">
            <h2 className="text-sm font-semibold text-white/80">Linguagens</h2>
            <div className="mt-3 flex flex-col gap-3">
              {data.languages.length === 0 ? (
                <p className="text-sm text-white/40">Sem dados de linguagens no período.</p>
              ) : (
                data.languages.map((lang) => (
                  <div key={lang.name}>
                    <div className="flex items-center justify-between text-sm text-white/80">
                      <span>{lang.name}</span>
                      <span className="font-mono text-xs text-white/40">{lang.text}</span>
                    </div>
                    <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                      <div
                        className="h-full rounded-full bg-status-ready"
                        style={{ width: `${lang.percent}%` }}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {!data && isLoading && !error && (
        <p className="mt-4 text-sm text-white/40">Carregando estatísticas do Wakatime...</p>
      )}
    </>
  );
}
