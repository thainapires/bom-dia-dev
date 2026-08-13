export type MrStatus = "pronto" | "aguardando" | "atencao";

export interface MrItem {
  id: number;
  title: string;
  branch: string;
  url: string;
  status: MrStatus;
  approvals: number;
  diasAberto: number;
  motivoAtencao: string | null;
}

export interface ReviewItem {
  id: number;
  title: string;
  branch: string;
  url: string;
  author: string;
  diasAberto: number;
}

export type ActivityKind = "commit" | "merge" | "review" | "abertura" | "issue";

export interface ActivityItem {
  kind: ActivityKind;
  text: string;
  createdAt: string;
}

export interface DailyNarrative {
  ontem: string;
  hoje: string;
}

export interface DashboardResponse {
  user: { name: string };
  summary: {
    pronto: number;
    precisaRevisar: number;
    aguardando: number;
    atencao: number;
    tempoMedioMergeDias: string;
  };
  pronto: MrItem[];
  precisaRevisar: ReviewItem[];
  aguardando: MrItem[];
  atencao: MrItem[];
  ontem: ActivityItem[];
  narrativa: DailyNarrative;
}
