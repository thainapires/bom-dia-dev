import { ClockCircleIcon as ClockCircleLinear } from '@solar-icons/react/linear/clock-circle'
import { RestartIcon } from '@solar-icons/react/linear/restart'
import { BellIcon } from '@solar-icons/react/linear/bell'
import { DangerTriangleIcon } from '@solar-icons/react/linear/danger-triangle'
import { useCallback, useEffect, useState } from "react";
import { fetchDashboard } from "../api";
import { Header } from "../components/Header";
import { MrListCard } from "../components/MrListCard";
import { PerformanceCard } from "../components/PerformanceCard";
import { RecentActivityCard } from "../components/RecentActivityCard";
import { ReviewListCard } from "../components/ReviewListCard";
import { SummaryCards } from "../components/SummaryCards";
import { ListCardSkeleton } from "../components/skeletons/ListCardSkeleton";
import { PerformanceCardSkeleton } from "../components/skeletons/PerformanceCardSkeleton";
import { RecentActivityCardSkeleton } from "../components/skeletons/RecentActivityCardSkeleton";
import { Skeleton } from "../components/skeletons/Skeleton";
import { SummaryCardsSkeleton } from "../components/skeletons/SummaryCardsSkeleton";
import { useSettings } from "../SettingsContext";
import type { DashboardResponse, MrItem } from "../types";
import { CheckCircleIcon } from '@solar-icons/react/linear/check-circle'

function applyEsquecidoThreshold(items: MrItem[], limite: number): MrItem[] {
  return items.map((item) => ({ ...item, esquecido: item.diasAberto >= limite }));
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useSettings();

  const load = useCallback(async (forceRefresh = false) => {
    setIsLoading(true);
    setError(null);
    try {
      const dashboard = await fetchDashboard({ forceRefresh });
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

  const { visibleCards, diasEsquecidoLimite } = settings;

  return (
    <>
      <Header onRefresh={() => load(true)} isRefreshing={isLoading} lastUpdated={data?.atualizadoEm ?? null} />

      {error && (
        <div className="mt-4 rounded-lg border-l-4 border-l-status-attention bg-card px-4 py-3 text-sm text-white/80">
          Não foi possível carregar os dados do GitLab: {error}
        </div>
      )}

      {data && (
        <>
          <SummaryCards summary={data.summary} />

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="bg-card-main border-white/5 flex min-w-0 flex-col gap-4 rounded-lg border p-5 lg:col-span-3">
              <h2 className="text-lg font-bold">Visão geral</h2>
              <div className="flex flex-col gap-4">
                {visibleCards.pronto && (
                  <MrListCard
                    title="Pronto pra merge"
                    items={applyEsquecidoThreshold(data.pronto, diasEsquecidoLimite)}
                    emptyText="Nenhum MR pronto pra merge agora."
                    icon={CheckCircleIcon}
                    iconColorClass="text-status-ready"
                    iconBgClass="bg-status-ready/20"
                  />
                )}
                {visibleCards.atencao && (
                  <MrListCard
                    title="Precisa de atenção"
                    items={applyEsquecidoThreshold(data.atencao, diasEsquecidoLimite)}
                    emptyText="Nenhum MR precisando de atenção."
                    icon={DangerTriangleIcon}
                    iconColorClass="text-status-attention"
                    iconBgClass="bg-status-attention/20"
                  />
                )}
                {visibleCards.precisaRevisar && (
                  <ReviewListCard
                    title="Precisa revisar"
                    items={data.precisaRevisar}
                    emptyText="Nenhum MR esperando sua revisão."
                    icon={RestartIcon}
                    iconColorClass="text-status-waiting"
                    iconBgClass="bg-status-waiting/20"
                    borderColorClass="border-l-status-waiting"
                    badgeColorClass="bg-status-waiting/15 text-status-waiting"
                  />
                )}
                {visibleCards.aguardandoResposta && (
                  <ReviewListCard
                    title="Aguardando resolução de comentário"
                    items={data.aguardandoResposta}
                    emptyText="Nenhum comentário seu aguardando resposta."
                    icon={ClockCircleLinear}
                    iconColorClass="text-status-neutral"
                    iconBgClass="bg-status-neutral/20"
                    borderColorClass="border-l-status-neutral"
                    badgeColorClass="bg-status-neutral/15 text-status-neutral"
                  />
                )}
                {visibleCards.aguardando && (
                  <MrListCard
                    title="Aguardando review"
                    items={applyEsquecidoThreshold(data.aguardando, diasEsquecidoLimite)}
                    emptyText="Nenhum MR aguardando review."
                    icon={BellIcon}
                    iconColorClass="text-status-waiting"
                    iconBgClass="bg-status-waiting/20"
                  />
                )}
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
              {visibleCards.atividadeRecente && <RecentActivityCard items={data.atividadeRecente} />}
              <PerformanceCard desempenho={data.desempenho} />
            </div>
          </div>
        </>
      )}

      {!data && isLoading && !error && (
        <>
          <SummaryCardsSkeleton />

          <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="bg-card-main border-white/5 flex min-w-0 flex-col gap-4 rounded-lg border p-5 lg:col-span-3">
              <Skeleton className="h-5 w-32" />
              <div className="flex flex-col gap-4">
                <ListCardSkeleton />
                <ListCardSkeleton />
                <ListCardSkeleton />
                <ListCardSkeleton />
                <ListCardSkeleton />
              </div>
            </div>

            <div className="flex min-w-0 flex-col gap-4 lg:col-span-2">
              <RecentActivityCardSkeleton />
              <PerformanceCardSkeleton />
            </div>
          </div>
        </>
      )}
    </>
  );
}
