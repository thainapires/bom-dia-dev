import {
  getApprovals,
  getAssignedIssues,
  getCurrentUser,
  getEvents,
  getIssueLabelEvents,
  getIssueNotes,
  getMRDetail,
  getMergedMRs,
  getMrNotes,
  getMrsToReview,
  getOpenMRs,
  getTodos,
} from "./gitlab";
import { heuristicClassifier } from "./narrative";
import type {
  ActivityItem,
  DailyNarrative,
  DashboardResponse,
  GitlabEvent,
  GitlabIssue,
  GitlabMergeRequestSummary,
  GitlabTodo,
  IssueDayActivity,
  IssueNarrativeItem,
  MrItem,
  MrStatus,
  ReviewItem,
  TodoItem,
} from "./types";

// MR aguardando/em atenção há mais dias que isso ganha destaque visual —
// sinal de que provavelmente foi esquecido, não só que está demorando.
const DIAS_ESQUECIDO = 5;

function toDateStr(date: Date): string {
  return date.toISOString().slice(0, 10);
}

// A API de eventos do GitLab trata `after`/`before` como exclusivos: para
// pegar só o dia de ontem, `after` precisa ser anteontem e `before` hoje.
function yesterdayRange(now: Date): { after: string; before: string } {
  const today = new Date(now);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(today.getDate() - 2);
  return { after: toDateStr(twoDaysAgo), before: toDateStr(today) };
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

function isWithinRange(iso: string, range: { after: string; before: string }): boolean {
  const time = new Date(iso).getTime();
  return time >= new Date(range.after).getTime() && time < new Date(range.before).getTime();
}

async function enrichMr(mr: GitlabMergeRequestSummary): Promise<MrItem> {
  const [detail, approvals] = await Promise.all([
    getMRDetail(mr.project_id, mr.iid),
    getApprovals(mr.project_id, mr.iid),
  ]);

  const pipelineStatus = detail.head_pipeline?.status ?? null;
  const pipelineFailed = pipelineStatus === "failed";
  const pipelineSuccess = pipelineStatus === "success";
  const approvalsCount = approvals.approved_by.length;

  let status: MrStatus;
  let motivoAtencao: string | null = null;

  if (pipelineFailed || detail.has_conflicts) {
    status = "atencao";
    motivoAtencao = pipelineFailed ? "Pipeline falhando" : "Conflito de merge";
  } else if (pipelineSuccess && approvalsCount >= 1) {
    status = "pronto";
  } else {
    status = "aguardando";
  }

  const diasAberto = Math.floor(daysBetween(new Date(mr.created_at), new Date()));

  return {
    id: mr.id,
    title: mr.title,
    branch: mr.source_branch,
    url: mr.web_url,
    status,
    approvals: approvalsCount,
    diasAberto,
    motivoAtencao,
    esquecido: status !== "pronto" && diasAberto > DIAS_ESQUECIDO,
  };
}

async function enrichReviewItem(
  mr: GitlabMergeRequestSummary,
  myUserId: number,
): Promise<ReviewItem | null> {
  const approvals = await getApprovals(mr.project_id, mr.iid);
  const alreadyApprovedByMe = approvals.approved_by.some((a) => a.user.id === myUserId);
  if (alreadyApprovedByMe) {
    return null;
  }

  return {
    id: mr.id,
    title: mr.title,
    branch: mr.source_branch,
    url: mr.web_url,
    author: mr.author.name,
    diasAberto: Math.floor(daysBetween(new Date(mr.created_at), new Date())),
  };
}

// Notas de sistema de assignment não têm campo estruturado próprio — o
// GitLab registra como uma nota de texto tipo "assigned to @usuario".
function isAssignmentNoteForUser(note: { system: boolean; body: string }, username: string): boolean {
  return note.system && /^assigned to/i.test(note.body) && note.body.includes(`@${username}`);
}

function averageMergeTime(merged: GitlabMergeRequestSummary[]): string {
  const withMergeTimes = merged.filter((mr) => mr.merged_at);
  if (withMergeTimes.length === 0) {
    return "sem dados";
  }
  const totalDays = withMergeTimes.reduce((sum, mr) => {
    return sum + daysBetween(new Date(mr.created_at), new Date(mr.merged_at!));
  }, 0);
  const avg = totalDays / withMergeTimes.length;
  return `${avg.toFixed(1).replace(".", ",")} dias`;
}

// Não existe campo estruturado de "hora da aprovação" na API de approvals —
// o jeito confiável é achar a nota de sistema que o GitLab gera ao aprovar.
async function firstApprovalDate(mr: GitlabMergeRequestSummary): Promise<Date | null> {
  const notes = await getMrNotes(mr.project_id, mr.iid);
  const approvalNote = notes.find(
    (note) => note.system && /approved this merge request/i.test(note.body),
  );
  return approvalNote ? new Date(approvalNote.created_at) : null;
}

function averageFirstApprovalTime(
  merged: GitlabMergeRequestSummary[],
  approvalDates: Array<Date | null>,
): string {
  const diffsDays = merged
    .map((mr, index) => {
      const approvedAt = approvalDates[index];
      return approvedAt ? daysBetween(new Date(mr.created_at), approvedAt) : null;
    })
    .filter((diff): diff is number => diff !== null);

  if (diffsDays.length === 0) {
    return "sem dados";
  }
  const avg = diffsDays.reduce((sum, diff) => sum + diff, 0) / diffsDays.length;
  return `${avg.toFixed(1).replace(".", ",")} dias`;
}

const TODO_ACTION_LABELS: Record<string, string> = {
  assigned: "Atribuíram você",
  mentioned: "Te mencionaram",
  review_requested: "Pediram sua revisão",
  review_submitted: "Revisão enviada",
  approval_required: "Aprovação necessária",
  build_failed: "Pipeline falhou",
  directly_addressed: "Te chamaram diretamente",
  attention_requested: "Pediram sua atenção",
  unmergeable: "MR não pode ser mergeado",
  merge_train_removed: "Removido do merge train",
};

function mapTodoToItem(todo: GitlabTodo): TodoItem {
  const prefix = TODO_ACTION_LABELS[todo.action_name] ?? todo.action_name;
  const text = todo.body ? `${prefix}: ${todo.body}` : prefix;
  return {
    id: todo.id,
    text,
    url: todo.target_url,
    createdAt: todo.created_at,
  };
}

// GitLab linka `#123` automaticamente à issue de mesmo iid no mesmo projeto
// — é o único sinal disponível pra ligar um commit a uma issue específica.
// Só existe se a convenção de referenciar a issue na mensagem for seguida.
function issueHasCommit(
  issue: GitlabIssue,
  events: GitlabEvent[],
  range: { after: string; before: string },
): boolean {
  const issueRef = new RegExp(`#${issue.iid}\\b`);
  return events.some((event) => {
    if (event.project_id !== issue.project_id) return false;
    if (event.action_name !== "pushed to" && event.action_name !== "pushed new") return false;
    if (!isWithinRange(event.created_at, range)) return false;
    return issueRef.test(event.push_data?.commit_title ?? "");
  });
}

async function buildIssueActivity(
  issue: GitlabIssue,
  username: string,
  range: { after: string; before: string },
): Promise<{ activity: Omit<IssueDayActivity, "hasCommit">; assignmentEvents: ActivityItem[] }> {
  const [notes, labelEvents] = await Promise.all([
    getIssueNotes(issue.project_id, issue.iid),
    getIssueLabelEvents(issue.project_id, issue.iid),
  ]);

  const notesInRange = notes.filter((note) => isWithinRange(note.created_at, range));

  const assignmentEvents = notesInRange
    .filter((note) => isAssignmentNoteForUser(note, username))
    .map((note) => ({
      kind: "issue" as const,
      text: `Assumiu: ${issue.title}`,
      createdAt: note.created_at,
    }));

  return {
    activity: {
      issueIid: issue.iid,
      projectId: issue.project_id,
      title: issue.title,
      url: issue.web_url,
      labelChanges: labelEvents.filter((change) => isWithinRange(change.created_at, range)),
      comments: notesInRange.filter((note) => !note.system),
    },
    assignmentEvents,
  };
}

function mapEventToActivity(event: GitlabEvent): ActivityItem | null {
  switch (event.action_name) {
    case "pushed to":
    case "pushed new": {
      const title = event.push_data?.commit_title ?? event.push_data?.ref ?? "push";
      return { kind: "commit", text: title, createdAt: event.created_at };
    }
    case "accepted":
      return {
        kind: "merge",
        text: event.target_title ?? "MR mergeado",
        createdAt: event.created_at,
      };
    case "approved":
      return {
        kind: "review",
        text: event.target_title ?? "MR aprovado",
        createdAt: event.created_at,
      };
    case "opened":
      if (event.target_type === "MergeRequest") {
        return {
          kind: "abertura",
          text: event.target_title ?? "MR aberto",
          createdAt: event.created_at,
        };
      }
      return null;
    default:
      return null;
  }
}

function pluralize(count: number, singular: string, plural: string): string {
  return count === 1 ? singular : plural;
}

function joinPtBr(parts: string[]): string {
  if (parts.length === 0) return "";
  if (parts.length === 1) return parts[0];
  return `${parts.slice(0, -1).join(", ")} e ${parts[parts.length - 1]}`;
}

function buildResumoOntem(ontem: ActivityItem[]): string {
  const counts = { commit: 0, merge: 0, review: 0, abertura: 0, issue: 0 };
  for (const item of ontem) {
    counts[item.kind]++;
  }

  const parts: string[] = [];
  if (counts.commit > 0) {
    parts.push(`fez ${counts.commit} ${pluralize(counts.commit, "commit", "commits")}`);
  }
  if (counts.abertura > 0) {
    parts.push(`abriu ${counts.abertura} ${pluralize(counts.abertura, "MR", "MRs")}`);
  }
  if (counts.merge > 0) {
    parts.push(`mergeou ${counts.merge} ${pluralize(counts.merge, "MR", "MRs")}`);
  }
  if (counts.review > 0) {
    parts.push(`revisou ${counts.review} ${pluralize(counts.review, "MR", "MRs")}`);
  }
  if (counts.issue > 0) {
    parts.push(`assumiu ${counts.issue} ${pluralize(counts.issue, "issue", "issues")}`);
  }

  if (parts.length === 0) {
    return "Ontem foi tranquilo, sem atividade registrada no GitLab.";
  }

  return `Ontem você ${joinPtBr(parts)}.`;
}

function buildResumoHoje(summary: DashboardResponse["summary"]): string {
  const parts: string[] = [];
  if (summary.pronto > 0) {
    parts.push(`${summary.pronto} ${pluralize(summary.pronto, "MR pronto", "MRs prontos")} pra merge`);
  }
  if (summary.precisaRevisar > 0) {
    parts.push(
      `${summary.precisaRevisar} ${pluralize(summary.precisaRevisar, "MR esperando", "MRs esperando")} sua revisão`,
    );
  }
  if (summary.aguardando > 0) {
    parts.push(
      `${summary.aguardando} ${pluralize(summary.aguardando, "MR aguardando", "MRs aguardando")} aprovação`,
    );
  }
  if (summary.atencao > 0) {
    parts.push(`${summary.atencao} ${pluralize(summary.atencao, "MR pedindo", "MRs pedindo")} atenção`);
  }

  if (parts.length === 0) {
    return "Hoje tá tudo tranquilo, nada pendente por aqui.";
  }

  return `Hoje: ${joinPtBr(parts)}.`;
}

function buildNarrativa(
  ontem: ActivityItem[],
  summary: DashboardResponse["summary"],
  porIssue: IssueNarrativeItem[],
): DailyNarrative {
  return {
    ontem: buildResumoOntem(ontem),
    hoje: buildResumoHoje(summary),
    porIssue,
  };
}

export async function buildDashboard(
  dateRange?: { after: string; before: string },
): Promise<DashboardResponse> {
  const now = new Date();
  const range = dateRange ?? yesterdayRange(now);

  const user = await getCurrentUser();

  const [openMRs, mergedMRs, events, mrsToReviewRaw, assignedIssues, todosRaw] = await Promise.all([
    getOpenMRs(),
    getMergedMRs(10),
    getEvents(range.after, range.before),
    getMrsToReview(user.username),
    getAssignedIssues(user.username),
    getTodos(),
  ]);

  const enrichedMrs = await Promise.all(openMRs.map(enrichMr));

  const pronto = enrichedMrs.filter((mr) => mr.status === "pronto");
  const aguardando = enrichedMrs.filter((mr) => mr.status === "aguardando");
  const atencao = enrichedMrs.filter((mr) => mr.status === "atencao");

  const precisaRevisar = (
    await Promise.all(
      mrsToReviewRaw.filter((mr) => !mr.draft).map((mr) => enrichReviewItem(mr, user.id)),
    )
  ).filter((item): item is ReviewItem => item !== null);

  const issueBuilds = await Promise.all(
    assignedIssues.map((issue) => buildIssueActivity(issue, user.username, range)),
  );
  const issueActivity = issueBuilds.flatMap((build) => build.assignmentEvents);
  const issueDayActivities: IssueDayActivity[] = issueBuilds.map((build, index) => ({
    ...build.activity,
    hasCommit: issueHasCommit(assignedIssues[index], events, range),
  }));
  const porIssue = await heuristicClassifier(issueDayActivities);

  const approvalDates = await Promise.all(mergedMRs.map(firstApprovalDate));

  const ontem = events
    .map(mapEventToActivity)
    .filter((item): item is ActivityItem => item !== null)
    .concat(issueActivity)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  const summary = {
    pronto: pronto.length,
    precisaRevisar: precisaRevisar.length,
    aguardando: aguardando.length,
    atencao: atencao.length,
    tempoMedioMergeDias: averageMergeTime(mergedMRs),
    tempoMedioPrimeiraAprovacaoDias: averageFirstApprovalTime(mergedMRs, approvalDates),
  };

  return {
    user: { name: user.name },
    summary,
    pronto,
    precisaRevisar,
    aguardando,
    atencao,
    ontem,
    narrativa: buildNarrativa(ontem, summary, porIssue),
    todos: todosRaw.map(mapTodoToItem),
  };
}
