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
  approved_by: Array<{ user: GitlabUser; approved_at: string }>;
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
  note?: { noteable_type: string };
}

export interface GitlabIssue {
  id: number;
  iid: number;
  project_id: number;
  title: string;
  web_url: string;
  state: "opened" | "closed";
  labels: string[];
  assignees: GitlabUser[];
  updated_at: string;
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

export interface GitlabStateEvent {
  created_at: string;
  state: "opened" | "closed" | "reopened";
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

export type ReviewSituacao =
  | "precisaRevisar"
  | "aguardandoRespostaMeus"
  | "aguardandoRespostaOutros"
  | "jaAprovado";

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
  currentLabels: string[];
  currentAssignees: string[];
  issueState: "opened" | "closed";
  hasCommit: boolean;
  labelChanges: GitlabLabelEvent[];
  comments: GitlabNote[];
  assignmentEvents: GitlabNote[];
  stateEvents: GitlabStateEvent[];
}

export interface IssueNarrativeItem {
  issueIid: number;
  projectId: number;
  title: string;
  url: string;
  linha: string;
  categoria: IssueUpdateCategoria;
}


export type BoardStatus =
  | "Blocked"
  | "Sprint ready"
  | "To do"
  | "In progress"
  | "For code review"
  | "Code Review Failed"
  | "For QA Deployment"
  | "For QA Testing"
  | "In Testing"
  | "QA Testing Failed"
  | "For Production Deployment"
  | "For Production Testing"
  | "Production Testing Failed"
  | "Done"
  | "Closed";

export interface IssueStatusTransition {
  from: BoardStatus | null;
  to: BoardStatus;
  timestamp: string;
}

export type IssueTodayRelevance = "active" | "attention" | "passive" | "none";

export interface IssueStandupFact {
  issueIid: number;
  projectId: number;
  title: string;
  url: string;
  currentStatus: BoardStatus | null;
  statusAtPeriodStart: BoardStatus | null;
  currentAssignees: string[];
  isAssignedToMe: boolean;
  wasAssignedBeforePeriod: boolean;
  assignedDuringPeriod: string[];
  statusTransitions: IssueStatusTransition[];
  commentsDuringPeriod: Array<{ createdAt: string }>;
  hasCommitDuringPeriod: boolean;
  yesterdayFacts: string[];
  todayFacts: string[];
  todayRelevance: IssueTodayRelevance;
  priority: number;
}

export interface TodoItem {
  id: number;
  text: string;
  url: string;
  createdAt: string;
}


export interface DailyIssueItem {
  issueIid: number;
  title: string;
  url: string;
  detail: string;
}

export interface DailyVisualStats {
  commits: number;
  pendencias: number;
  issues: number;
}

export interface DailyNarrative {
  ontem: string;
  hoje: string;
  porIssue: IssueNarrativeItem[];
  ontemItems?: DailyIssueItem[];
  hojeItems?: DailyIssueItem[];
  stats?: DailyVisualStats;


  geradoViaLLM: boolean;
}

export interface DailyEntry {
  date: string;
  ontem: string;
  hoje: string;
  geradoViaLLM: boolean;
  criadoEm: string;
  ontemItems?: DailyIssueItem[];
  hojeItems?: DailyIssueItem[];
  stats?: DailyVisualStats;
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

export interface ChecklistItem {
  id: number;
  text: string;
  done: boolean;
  position: number;
}

export interface Note {
  id: number;
  date: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface NoteSummary {
  id: number;
  date: string;
  title: string;
  preview: string;
  createdAt: string;
}

export interface DailyStats {
  totalTasks: number;
  completedTasks: number;
  wordCount: number;
  progressPercent: number;
}

export interface NotesDayResponse {
  date: string;
  note: Note | null;
  checklist: ChecklistItem[];
  stats: DailyStats;
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

export interface WakatimeDurationRankItem {
  name: string;
  percent: number;
  text: string;
  seconds: number;
}

export type WakatimeLanguage = WakatimeDurationRankItem;

export interface WakatimeDailyActivity {
  date: string;
  label: string;
  fullLabel: string;
  seconds: number;
  text: string;
}

export interface WakatimeTimeBucket {
  label: string;
  seconds: number;
  text: string;
}

export interface WakatimeAiCoding {
  aiPercent: number;
  humanPercent: number;
  aiLines: number;
  humanLines: number;
}

export interface WakatimeWeekdayActivity {
  weekday: string;
  shortLabel: string;
  averageSeconds: number;
  averageText: string;
  sampleDays: number;
}

export interface WakatimeStats {
  range: string;
  start: string;
  end: string;
  totalText: string;
  dailyAverageText: string;
  bestDay: { date: string; text: string } | null;
  languages: WakatimeLanguage[];
  dailyActivity: WakatimeDailyActivity[];
  projects: WakatimeDurationRankItem[];
  categories: WakatimeDurationRankItem[];
  editors: WakatimeDurationRankItem[];
  operatingSystems: WakatimeDurationRankItem[];
  timeBuckets: WakatimeTimeBucket[];
  dominantTimeBucket: WakatimeTimeBucket | null;
  longestSession: { text: string; seconds: number; project: string | null; date: string } | null;
  currentStreak: number;
  longestStreak: number;
  mostProductiveWeekday: { weekday: string; averageText: string; averageSeconds: number; sampleDays: number } | null;
  weekdayActivity: WakatimeWeekdayActivity[];
  aiCoding: WakatimeAiCoding | null;
}

export type WakatimeRangeKey =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_14_days"
  | "last_30_days"
  | "last_6_months"
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
