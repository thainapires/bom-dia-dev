import Alert01Icon from "@hugeicons/core-free-icons/Alert01Icon";
import BubbleChatIcon from "@hugeicons/core-free-icons/BubbleChatIcon";
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon";
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon";
import ViewIcon from "@hugeicons/core-free-icons/ViewIcon";
import { useCallback, useEffect, useState } from "react";
import { fetchDashboard } from "../api";
import { Header } from "../components/Header";
import { MrListCard } from "../components/MrListCard";
import { ReviewListCard } from "../components/ReviewListCard";
import { SummaryCards } from "../components/SummaryCards";
import { YesterdayList } from "../components/YesterdayList";
import { ListCardSkeleton } from "../components/skeletons/ListCardSkeleton";
import { SummaryCardsSkeleton } from "../components/skeletons/SummaryCardsSkeleton";
import { YesterdayListSkeleton } from "../components/skeletons/YesterdayListSkeleton";
import { useSettings } from "../SettingsContext";
import type { DashboardResponse, MrItem } from "../types";

function applyEsquecidoThreshold(items: MrItem[], limite: number): MrItem[] {
  return items.map((item) => ({ ...item, esquecido: item.diasAberto >= limite }));
}

export function DashboardPage() {
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { settings } = useSettings();

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

  const { visibleCards, diasEsquecidoLimite } = settings;

  return (
    <>
      <Header onRefresh={load} isRefreshing={isLoading} />

      {error && (
        <div className="mt-4 rounded-lg border-l-4 border-l-status-attention bg-card px-4 py-3 text-sm text-white/80">
          Não foi possível carregar os dados do GitLab: {error}
        </div>
      )}

      {data && (
        <>
          <SummaryCards summary={data.summary} />

          <div className="mt-4 flex flex-col gap-4">
            {visibleCards.pronto && (
              <MrListCard
                title="Pronto pra merge"
                items={applyEsquecidoThreshold(data.pronto, diasEsquecidoLimite)}
                emptyText="Nenhum MR pronto pra merge agora."
                icon={CheckmarkCircle02Icon}
                iconColorClass="text-status-ready"
              />
            )}
            {visibleCards.atencao && (
              <MrListCard
                title="Precisa de atenção"
                items={applyEsquecidoThreshold(data.atencao, diasEsquecidoLimite)}
                emptyText="Nenhum MR precisando de atenção."
                icon={Alert01Icon}
                iconColorClass="text-status-attention"
              />
            )}
            {visibleCards.precisaRevisar && (
              <ReviewListCard
                title="Precisa revisar"
                items={data.precisaRevisar}
                emptyText="Nenhum MR esperando sua revisão."
                icon={ViewIcon}
                iconColorClass="text-status-waiting"
                borderColorClass="border-l-status-waiting"
                badgeColorClass="bg-status-waiting/15 text-status-waiting"
              />
            )}
            {visibleCards.aguardandoResposta && (
              <ReviewListCard
                title="Aguardando resolução de comentário"
                items={data.aguardandoResposta}
                emptyText="Nenhum comentário seu aguardando resposta."
                icon={BubbleChatIcon}
                iconColorClass="text-status-neutral"
                borderColorClass="border-l-status-neutral"
                badgeColorClass="bg-status-neutral/15 text-status-neutral"
              />
            )}
            {visibleCards.aguardando && (
              <MrListCard
                title="Aguardando review"
                items={applyEsquecidoThreshold(data.aguardando, diasEsquecidoLimite)}
                emptyText="Nenhum MR aguardando review."
                icon={Clock01Icon}
                iconColorClass="text-status-waiting"
              />
            )}
          </div>

          {visibleCards.ontem && (
            <div className="mt-4">
              <YesterdayList items={data.ontem} />
            </div>
          )}
        </>
      )}

      {!data && isLoading && !error && (
        <>
          <SummaryCardsSkeleton />

          <div className="mt-4 flex flex-col gap-4">
            <ListCardSkeleton />
            <ListCardSkeleton />
            <ListCardSkeleton />
            <ListCardSkeleton />
            <ListCardSkeleton />
          </div>

          <div className="mt-4">
            <YesterdayListSkeleton />
          </div>
        </>
      )}
    </>
  );
}
