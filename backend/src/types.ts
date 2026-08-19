export interface GitlabUser {
  id: number;
  username: string;
  name: string;
}

export interface GitlabMergeRequestSummary {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  web_url: string;
  source_branch: string;
  created_at: string;
  merged_at: string | null;
  draft: boolean;
  author: { name: string };
}

export interface GitlabPipeline {
  status: string;
}

export interface GitlabMergeRequestDetail {
  id: number;
  iid: number;
  project_id: number;
  has_conflicts: boolean;
  head_pipeline: GitlabPipeline | null;
}

export interface GitlabApprovals {
  approved: boolean;
  approved_by: Array<{ user: GitlabUser }>;
  approvals_left: number;
}

export interface GitlabPushData {
  commit_count: number;
  commit_title: string | null;
  ref: string | null;
}

export interface GitlabEvent {
  project_id: number;
  action_name: string;
  target_type: string | null;
  target_title: string | null;
  created_at: string;
  push_data?: GitlabPushData;
}

export interface GitlabIssue {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  web_url: string;
}

export interface GitlabNote {
  id: number;
  body: string;
  system: boolean;
  created_at: string;
}

export interface GitlabLabelEvent {
  created_at: string;
  action: "add" | "remove";
  label: { name: string } | null;
}

export interface GitlabTodo {
  id: number;
  action_name: string;
  target_url: string;
  body: string;
  created_at: string;
}

export interface GitlabDiscussionNote {
  id: number;
  author: { id: number };
  resolvable: boolean;
  resolved: boolean;
}

export interface GitlabDiscussion {
  id: string;
  notes: GitlabDiscussionNote[];
}

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

// "precisaRevisar": MR aguardando sua primeira revisão.
// "aguardandoResposta": você já deixou comentário(s) não resolvidos no MR —
// a bola está com o autor, não precisa revisar de novo ainda.
export type ReviewSituacao = "precisaRevisar" | "aguardandoResposta";

export type ActivityKind = "commit" | "merge" | "review" | "abertura" | "issue";

export interface ActivityItem {
  kind: ActivityKind;
  text: string;
  createdAt: string;
}

// Categorias que o classificador (heurístico hoje, possivelmente LLM depois)
// pode atribuir a uma issue com atividade no dia — usadas pra colorir a UI
// com a mesma paleta de status já usada nos MRs.
export type IssueUpdateCategoria =
  | "trabalhando"
  | "finalizado"
  | "code_review"
  | "aguardando_qa"
  | "testado_ok"
  | "testado_falhou"
  | "pausado"
  | "bloqueado";

export interface IssueDayActivity {
  issueIid: number;
  projectId: number;
  title: string;
  url: string;
  hasCommit: boolean;
  labelChanges: GitlabLabelEvent[];
  comments: GitlabNote[];
}

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
  summary: {
    pronto: number;
    precisaRevisar: number;
    aguardandoResposta: number;
    aguardando: number;
    atencao: number;
    tempoMedioMergeDias: string;
    tempoMedioPrimeiraAprovacaoDias: string;
  };
  pronto: MrItem[];
  precisaRevisar: ReviewItem[];
  aguardandoResposta: ReviewItem[];
  aguardando: MrItem[];
  atencao: MrItem[];
  ontem: ActivityItem[];
  narrativa: DailyNarrative;
  todos: TodoItem[];
}
