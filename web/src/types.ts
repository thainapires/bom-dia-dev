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
  esquecido: boolean;
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

export type IssueUpdateCategoria =
  | "trabalhando"
  | "finalizado"
  | "code_review"
  | "aguardando_qa"
  | "testado_ok"
  | "testado_falhou"
  | "pausado"
  | "bloqueado";

export interface IssueNarrativeItem {
  issueIid: number;
  projectId: number;
  title: string;
  url: string;
  linha: string;
  categoria: IssueUpdateCategoria;
}

export interface TodoItem {
  id: number;
  text: string;
  url: string;
  createdAt: string;
}

export interface DailyNarrative {
  ontem: string;
  hoje: string;
  porIssue: IssueNarrativeItem[];
}

export interface DashboardResponse {
  user: { name: string };
  summary: {
    pronto: number;
    precisaRevisar: number;
    aguardando: number;
    atencao: number;
    tempoMedioMergeDias: string;
    tempoMedioPrimeiraAprovacaoDias: string;
  };
  pronto: MrItem[];
  precisaRevisar: ReviewItem[];
  aguardando: MrItem[];
  atencao: MrItem[];
  ontem: ActivityItem[];
  narrativa: DailyNarrative;
  todos: TodoItem[];
}
