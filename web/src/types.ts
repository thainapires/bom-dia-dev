export type MrStatus = "pronto" | "aguardando" | "atencao";

export interface MrItem {
  id: number;
  title: string;
  branch: string;
  url: string;
  status: MrStatus;
  approvals: number;
  diasAberto: number;
  horasAberto: number;
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
  horasAberto: number;
}

export type ActivityKind =
  | "commit"
  | "merge"
  | "review"
  | "abertura"
  | "issue"
  | "comentario"
  | "aprovacaoRecebida";

export interface ActivityItem {
  kind: ActivityKind;
  text: string;
  createdAt: string;
}

export interface DesempenhoSemana {
  inicio: string;
  abertos: number;
  fechados: number;
  tempoMedioMergeDias: number | null;
}

export interface Desempenho {
  periodoDias: number;
  totalAbertos: number;
  totalFechados: number;
  tempoMedioMergeDiasAtual: string;
  variacaoPercentual: number | null;
  seriePorSemana: DesempenhoSemana[];
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
  geradoViaLLM: boolean;
}

export interface DailyEntry {
  date: string;
  ontem: string;
  hoje: string;
  geradoViaLLM: boolean;
  criadoEm: string;
}

export interface ChecklistItem {
  id: number;
  text: string;
  done: boolean;
  position: number;
}

export interface NotesDay {
  date: string;
  content: string;
  checklist: ChecklistItem[];
}

export interface DashboardResponse {
  user: { name: string };
  atualizadoEm: string;
  summary: {
    pronto: number;
    precisaRevisar: number;
    aguardandoRespostaMeus: number;
    aguardandoRespostaOutros: number;
    aguardando: number;
    atencao: number;
    jaAprovado: number;
    tempoMedioMergeDias: string;
    tempoMedioPrimeiraAprovacaoDias: string;
  };
  pronto: MrItem[];
  precisaRevisar: ReviewItem[];
  aguardandoRespostaMeus: ReviewItem[];
  aguardandoRespostaOutros: ReviewItem[];
  jaAprovado: ReviewItem[];
  aguardando: MrItem[];
  atencao: MrItem[];
  atividadeRecente: ActivityItem[];
  desempenho: Desempenho;
  narrativa: DailyNarrative;
  todos: TodoItem[];
}

export interface WakatimeLanguage {
  name: string;
  percent: number;
  text: string;
}

export interface WakatimeStats {
  range: string;
  totalText: string;
  dailyAverageText: string;
  bestDay: { date: string; text: string } | null;
  languages: WakatimeLanguage[];
}

export type WakatimeRangeKey =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_14_days"
  | "last_30_days"
  | "this_week"
  | "last_week"
  | "this_month"
  | "last_month"
  | "custom";

export interface WakatimeTimelineSession {
  project: string;
  start: string;
  end: string;
  durationSeconds: number;
}

export interface WakatimeTimelineProject {
  name: string;
  totalSeconds: number;
  totalText: string;
  sessions: WakatimeTimelineSession[];
}

export interface WakatimeTimeline {
  date: string;
  projects: WakatimeTimelineProject[];
}
