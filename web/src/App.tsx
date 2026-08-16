import { AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { fetchDashboard } from "./api";
import { DailySummaryCard } from "./components/DailySummaryCard";
import { Header } from "./components/Header";
import { MrListCard } from "./components/MrListCard";
import { ReviewListCard } from "./components/ReviewListCard";
import { Sidebar } from "./components/Sidebar";
import { SummaryCards } from "./components/SummaryCards";
import { YesterdayList } from "./components/YesterdayList";
import type { DashboardResponse } from "./types";

function App() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const dashboard = await fetchDashboard();
      setData(dashboard);
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
    <div className="flex min-h-screen bg-bg">
      <Sidebar />
      <main className="min-w-0 flex-1 px-4 py-4 sm:px-6 sm:py-5">
        <Header onRefresh={load} isRefreshing={isLoading} />

        {error && (
          <div className="mt-4 rounded-lg border-l-4 border-l-status-attention bg-card px-4 py-3 text-sm text-white/80">
            Não foi possível carregar os dados do GitLab: {error}
          </div>
        )}

        {data && (
          <>
            {/* <div className="mt-4">
              <DailySummaryCard narrativa={data.narrativa} />
            </div> */}

            <SummaryCards summary={data.summary} />

            <div className="mt-4 flex flex-col gap-4">
              <MrListCard
                title="Pronto pra merge"
                items={data.pronto}
                emptyText="Nenhum MR pronto pra merge agora."
                icon={CheckCircle2}
                iconColorClass="text-status-ready"
              />
              <MrListCard
                title="Precisa de atenção"
                items={data.atencao}
                emptyText="Nenhum MR precisando de atenção."
                icon={AlertTriangle}
                iconColorClass="text-status-attention"
              />
              <ReviewListCard items={data.precisaRevisar} />
              <MrListCard
                title="Aguardando review"
                items={data.aguardando}
                emptyText="Nenhum MR aguardando review."
                icon={Clock}
                iconColorClass="text-status-waiting"
              />
            </div>

            <div className="mt-4">
              <YesterdayList items={data.ontem} />
            </div>
          </>
        )}

        {!data && isLoading && !error && (
          <p className="mt-6 text-sm text-white/50">Carregando dados do GitLab...</p>
        )}
      </main>
    </div>
  );
}

export default App;
