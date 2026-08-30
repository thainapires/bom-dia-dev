import {
  getApprovals,
  getAssignedIssues,
  getCurrentUser,
  getEvents,
  getIssueLabelEvents,
  getIssueNotes,
  getIssueStateEvents,
  getMRDetail,
  getMergedMRs,
  getMergedMRsSince,
  getMrDiscussions,
  getMrNotes,
  getMrsCreatedSince,
  getMrsToReview,
  getOpenMRs,
  getTodos,
} from "./gitlab";
import { buildIssueNarrativeItems, buildIssueStandupFacts } from "./narrative";
import { getOrCreateStandup } from "./standup";
import type {
  ActivityItem,
  DashboardResponse,
  DailyIssueItem,
  Desempenho,
  DesempenhoSemana,
  GitlabApprovals,
  GitlabDiscussion,
  GitlabEvent,
  GitlabIssue,
  GitlabMergeRequestSummary,
  GitlabTodo,
  IssueDayActivity,
  MrItem,
  MrStatus,
  ReviewItem,
  ReviewSituacao,
  TodoItem,
} from "./types";

// MR aguardando/em atenção há mais dias que isso ganha destaque visual —
// sinal de que provavelmente foi esquecido, não só que está demorando.
const DIAS_ESQUECIDO = 5;

const TIMEZONE = "America/Sao_Paulo";

function toDateStr(date: Date): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

// A API de eventos do GitLab trata `after`/`before` como exclusivos: para
// pegar só o dia de ontem, `after` precisa ser anteontem e `before` hoje.
function yesterdayRange(now: Date): { after: string; before: string } {
  const today = new Date(now);
  const twoDaysAgo = new Date(now);
  twoDaysAgo.setDate(today.getDate() - 2);
  return { after: toDateStr(twoDaysAgo), before: toDateStr(today) };
}

// Janela mais ampla usada pela "Atividade recente" e por "Seu desempenho" —
// diferente da `yesterdayRange` (que continua alimentando só a narrativa de
// "ontem"/hoje). `before` inclui o dia de hoje por completo (exclusivo do dia
// seguinte), então days=14 cobre hoje + os 14 dias anteriores.
function activityRange(now: Date, days: number): { after: string; before: string } {
  const start = new Date(now);
  start.setDate(start.getDate() - days);
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  return { after: toDateStr(start), before: toDateStr(tomorrow) };
}

function daysBetween(a: Date, b: Date): number {
  return Math.abs(b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24);
}

const MESES_PT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

function formatDiaMes(date: Date): string {
  const [, month, day] = toDateStr(date).split("-").map(Number);
  return `${day} ${MESES_PT[month - 1]}`;
}

// Horas corridas desde a criação, arredondadas pra baixo — base pro texto
// "aberto há Xh" (quando ainda não completou 24h) e pro "aberto há X dias"
// (horasAberto / 24) exibidos no frontend.
function hoursOpen(createdAt: Date, now: Date): number {
  return Math.floor(daysBetween(createdAt, now) * 24);
}

// `range.after` é o dia "anteontem" (ver `yesterdayRange`), excluído por
// completo pra imitar o comportamento exclusivo do `after`/`before` da API
// de eventos do GitLab — daí pular pro início do dia seguinte antes de
// comparar, em vez de usar `range.after` como limite inferior direto.
function isWithinRange(iso: string, range: { after: string; before: string }): boolean {
  const time = new Date(iso).getTime();
  const afterExclusive = new Date(range.after).getTime() + 24 * 60 * 60 * 1000;
  return time >= afterExclusive && time < new Date(range.before).getTime();
}

// Uma thread de code review conta como pendente quando tem nota(s)
// resolvível(is) ainda não resolvida(s) — não importa quem comentou por
// último, é sinal de code review em aberto no MR do autor.
function hasUnresolvedComments(discussions: GitlabDiscussion[]): boolean {
  return discussions.some((discussion) =>
    discussion.notes.some((note) => note.resolvable && !note.resolved),
  );
}

async function enrichMr(
  mr: GitlabMergeRequestSummary,
): Promise<{ item: MrItem; approvals: GitlabApprovals }> {
  const [detail, approvals, discussions] = await Promise.all([
    getMRDetail(mr.project_id, mr.iid),
    getApprovals(mr.project_id, mr.iid),
    getMrDiscussions(mr.project_id, mr.iid),
  ]);

  const pipelineStatus = detail.head_pipeline?.status ?? null;
  const pipelineFailed = pipelineStatus === "failed";
  const pipelineSuccess = pipelineStatus === "success";
  const approvalsCount = approvals.approved_by.length;
  const pendingComments = hasUnresolvedComments(discussions);

  let status: MrStatus;
  let motivoAtencao: string | null = null;

  if (pipelineFailed || detail.has_conflicts || pendingComments) {
    status = "atencao";
    motivoAtencao = pipelineFailed
      ? "Pipeline falhando"
      : detail.has_conflicts
        ? "Conflito de merge"
        : "Comentários de code review pendentes";
  } else if (pipelineSuccess && approvalsCount >= 1) {
    status = "pronto";
  } else {
    status = "aguardando";
  }

  const horasAberto = hoursOpen(new Date(mr.created_at), new Date());
  const diasAberto = Math.floor(horasAberto / 24);

  return {
    item: {
      id: mr.id,
      title: mr.title,
      branch: mr.source_branch,
      url: mr.web_url,
      status,
      approvals: approvalsCount,
      diasAberto,
      horasAberto,
      motivoAtencao,
      esquecido: status !== "pronto" && diasAberto > DIAS_ESQUECIDO,
    },
    approvals,
  };
}

// Dono de uma pendência de review é definido nota a nota, não por discussão
// inteira: uma nota resolvível ainda não resolvida é "minha" se eu sou a
// autora dela, senão é "de outros". Uma mesma discussão pode ter nota minha
// já resolvida e nota de outra pessoa ainda pendente (ou vice-versa) — por
// isso não dá pra decidir pela discussão como um todo, só nota por nota.
export function unresolvedCommentOwnership(
  discussions: GitlabDiscussion[],
  myUserId: number,
): { mine: boolean; others: boolean } {
  let mine = false;
  let others = false;
  for (const discussion of discussions) {
    for (const note of discussion.notes) {
      if (!note.resolvable || note.resolved) continue;
      if (note.author.id === myUserId) {
        mine = true;
      } else {
        others = true;
      }
    }
  }
  return { mine, others };
}

export async function enrichReviewItem(
  mr: GitlabMergeRequestSummary,
  myUserId: number,
): Promise<{ item: ReviewItem; situacao: ReviewSituacao }> {
  const [approvals, discussions] = await Promise.all([
    getApprovals(mr.project_id, mr.iid),
    getMrDiscussions(mr.project_id, mr.iid),
  ]);

  const alreadyApprovedByMe = approvals.approved_by.some((a) => a.user.id === myUserId);
  const { mine: pendenteComigo, others: pendenteComOutros } = unresolvedCommentOwnership(
    discussions,
    myUserId,
  );

  let situacao: ReviewSituacao;
  if (pendenteComigo) {
    situacao = "aguardandoRespostaMeus";
  } else if (pendenteComOutros) {
    situacao = "aguardandoRespostaOutros";
  } else if (alreadyApprovedByMe) {
    situacao = "jaAprovado";
  } else {
    situacao = "precisaRevisar";
  }

  const horasAberto = hoursOpen(new Date(mr.created_at), new Date());

  return {
    item: {
      id: mr.id,
      title: mr.title,
      branch: mr.source_branch,
      url: mr.web_url,
      author: mr.author.name,
      diasAberto: Math.floor(horasAberto / 24),
      horasAberto,
    },
    situacao,
  };
}

// Notas de sistema de assignment não têm campo estruturado próprio — o
// GitLab registra como uma nota de texto tipo "assigned to @usuario".
function isAssignmentNoteForUser(note: { system: boolean; body: string }, username: string): boolean {
  return note.system && /^assigned to/i.test(note.body) && note.body.includes(`@${username}`);
}

function averageMergeDays(merged: GitlabMergeRequestSummary[]): number | null {
  const withMergeTimes = merged.filter((mr) => mr.merged_at);
  if (withMergeTimes.length === 0) {
    return null;
  }
  const totalDays = withMergeTimes.reduce((sum, mr) => {
    return sum + daysBetween(new Date(mr.created_at), new Date(mr.merged_at!));
  }, 0);
  return totalDays / withMergeTimes.length;
}

function formatDias(dias: number | null): string {
  return dias === null ? "sem dados" : `${dias.toFixed(1).replace(".", ",")} dias`;
}

function averageMergeTime(merged: GitlabMergeRequestSummary[]): string {
  return formatDias(averageMergeDays(merged));
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
  const [notes, labelEvents, stateEvents] = await Promise.all([
    getIssueNotes(issue.project_id, issue.iid),
    getIssueLabelEvents(issue.project_id, issue.iid),
    getIssueStateEvents(issue.project_id, issue.iid),
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
      currentLabels: issue.labels,
      currentAssignees: issue.assignees.map((assignee) => assignee.username),
      issueState: issue.state,
      labelChanges: labelEvents,
      comments: notesInRange.filter((note) => !note.system),
      assignmentEvents: notes.filter((note) => isAssignmentNoteForUser(note, username)),
      stateEvents,
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
    case "commented on":
      if (event.note?.noteable_type === "MergeRequest") {
        return {
          kind: "comentario",
          text: event.target_title ?? "Comentário em MR",
          createdAt: event.created_at,
        };
      }
      return null;
    default:
      return null;
  }
}

// "/events" só reflete ações que a própria usuária executou — a aprovação
// de terceiros no MR dela não aparece por lá. Por isso é sintetizada a
// partir de `approved_by[].approved_at`, que a API de approvals já traz.

function dailyIssueItemsFromFacts(
  facts: Array<{ issueIid: number; title: string; url: string; yesterdayFacts: string[]; todayFacts: string[] }>,
  key: "yesterdayFacts" | "todayFacts",
): DailyIssueItem[] {
  return facts
    .filter((fact) => fact[key].length > 0)
    .slice(0, 5)
    .map((fact) => ({
      issueIid: fact.issueIid,
      title: fact.title,
      url: fact.url,
      detail: fact[key][0],
    }));
}

function buildApprovalActivity(
  authored: Array<{ mr: GitlabMergeRequestSummary; approvals: GitlabApprovals }>,
  range: { after: string; before: string },
): ActivityItem[] {
  return authored.flatMap(({ mr, approvals }) =>
    approvals.approved_by
      .filter((approval) => isWithinRange(approval.approved_at, range))
      .map((approval) => ({
        kind: "aprovacaoRecebida" as const,
        text: mr.title,
        createdAt: approval.approved_at,
      })),
  );
}

function inWindow(iso: string | null, start: Date, end: Date): boolean {
  if (!iso) return false;
  const time = new Date(iso).getTime();
  return time >= start.getTime() && time < end.getTime();
}

// Janela fixa de 14 dias (v1, sem seletor de período — ver CLAUDE.md/plano).
// `mrsCriados`/`mrsMergeados` já vêm buscados numa janela de 28 dias (atual +
// anterior), pra dar só 2 chamadas extras à API em vez de 4.
function buildDesempenho(
  mrsCriados: GitlabMergeRequestSummary[],
  mrsMergeados: GitlabMergeRequestSummary[],
  now: Date,
): Desempenho {
  const periodoDias = 14;
  const currentStart = new Date(now.getTime() - periodoDias * 24 * 60 * 60 * 1000);
  const previousStart = new Date(now.getTime() - periodoDias * 2 * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const criadosAtual = mrsCriados.filter((mr) => inWindow(mr.created_at, currentStart, windowEnd));
  const mergeadosAtual = mrsMergeados.filter((mr) => inWindow(mr.merged_at, currentStart, windowEnd));
  const mergeadosAnterior = mrsMergeados.filter((mr) => inWindow(mr.merged_at, previousStart, currentStart));

  const tempoMedioAtualDias = averageMergeDays(mergeadosAtual);
  const tempoMedioAnteriorDias = averageMergeDays(mergeadosAnterior);
  const variacaoPercentual =
    tempoMedioAtualDias !== null && tempoMedioAnteriorDias !== null && tempoMedioAnteriorDias > 0
      ? Math.round(((tempoMedioAnteriorDias - tempoMedioAtualDias) / tempoMedioAnteriorDias) * 100)
      : null;

  const seriePorSemana: DesempenhoSemana[] = [0, 1].map((semanaIndex) => {
    const inicio = new Date(currentStart.getTime() + semanaIndex * 7 * 24 * 60 * 60 * 1000);
    const fim = new Date(inicio.getTime() + 7 * 24 * 60 * 60 * 1000);
    const fechadosSemana = mergeadosAtual.filter((mr) => inWindow(mr.merged_at, inicio, fim));
    return {
      inicio: formatDiaMes(inicio),
      abertos: criadosAtual.filter((mr) => inWindow(mr.created_at, inicio, fim)).length,
      fechados: fechadosSemana.length,
      tempoMedioMergeDias: averageMergeDays(fechadosSemana),
    };
  });

  return {
    periodoDias,
    totalAbertos: criadosAtual.length,
    totalFechados: mergeadosAtual.length,
    tempoMedioMergeDiasAtual: formatDias(tempoMedioAtualDias),
    variacaoPercentual,
    seriePorSemana,
  };
}

export async function buildDashboard(
  dateRange?: { after: string; before: string },
  options: { standupDate?: string; persistStandup?: boolean } = {},
): Promise<DashboardResponse> {
  const now = new Date();
  const range = dateRange ?? yesterdayRange(now);
  // "Atividade recente" e "Seu desempenho" usam uma janela própria de 14/28
  // dias, independente de `range` (que continua só alimentando a narrativa
  // de ontem/hoje e a classificação de atividade por issue).
  const activityWindow = activityRange(now, 14);
  const performanceWindowStart = toDateStr(new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000));

  const user = await getCurrentUser();

  const [
    openMRs,
    mergedMRs,
    events,
    recentEvents,
    mrsToReviewRaw,
    assignedIssues,
    todosRaw,
    mrsCriados28d,
    mrsMergeados28d,
  ] = await Promise.all([
    getOpenMRs(),
    getMergedMRs(10),
    getEvents(range.after, range.before),
    getEvents(activityWindow.after, activityWindow.before),
    getMrsToReview(user.username),
    getAssignedIssues(user.username),
    getTodos(),
    getMrsCreatedSince(performanceWindowStart),
    getMergedMRsSince(performanceWindowStart),
  ]);

  const enrichedResults = await Promise.all(openMRs.map(enrichMr));
  const enrichedMrs = enrichedResults.map((result) => result.item);

  const pronto = enrichedMrs.filter((mr) => mr.status === "pronto");
  const aguardando = enrichedMrs.filter((mr) => mr.status === "aguardando");
  const atencao = enrichedMrs.filter((mr) => mr.status === "atencao");

  const reviewResults = await Promise.all(
    mrsToReviewRaw.filter((mr) => !mr.draft).map((mr) => enrichReviewItem(mr, user.id)),
  );

  const precisaRevisar = reviewResults
    .filter((result) => result.situacao === "precisaRevisar")
    .map((result) => result.item);
  const aguardandoRespostaMeus = reviewResults
    .filter((result) => result.situacao === "aguardandoRespostaMeus")
    .map((result) => result.item);
  const aguardandoRespostaOutros = reviewResults
    .filter((result) => result.situacao === "aguardandoRespostaOutros")
    .map((result) => result.item);
  const jaAprovado = reviewResults
    .filter((result) => result.situacao === "jaAprovado")
    .map((result) => result.item);

  const issueBuilds = await Promise.all(
    assignedIssues.map((issue) => buildIssueActivity(issue, user.username, range)),
  );
  const issueActivity = issueBuilds.flatMap((build) => build.assignmentEvents);
  const issueDayActivities: IssueDayActivity[] = issueBuilds.map((build, index) => ({
    ...build.activity,
    hasCommit: issueHasCommit(assignedIssues[index], events, range),
  }));
  const issueFacts = buildIssueStandupFacts(issueDayActivities, user.username, range);
  const porIssue = buildIssueNarrativeItems(issueFacts);

  const approvalDates = await Promise.all(mergedMRs.map(firstApprovalDate));

  const ontem = events
    .map(mapEventToActivity)
    .filter((item): item is ActivityItem => item !== null)
    .concat(issueActivity)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

  // MRs autorados pela usuária cujas aprovações podem ter caído dentro da
  // janela de atividade recente: os já abertos (aproveita o `getApprovals`
  // que `enrichMr` já buscou) + os mergeados recentemente (busca extra,
  // mesmo padrão de fetch em paralelo).
  const mergeadosRecentesAprovacoes = await Promise.all(
    mrsMergeados28d.map((mr) => getApprovals(mr.project_id, mr.iid)),
  );
  const autoradosComAprovacoes = [
    ...openMRs.map((mr, index) => ({ mr, approvals: enrichedResults[index].approvals })),
    ...mrsMergeados28d.map((mr, index) => ({ mr, approvals: mergeadosRecentesAprovacoes[index] })),
  ];

  const atividadeRecente = recentEvents
    .map(mapEventToActivity)
    .filter((item): item is ActivityItem => item !== null)
    .concat(buildApprovalActivity(autoradosComAprovacoes, activityWindow))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 20);

  const desempenho = buildDesempenho(mrsCriados28d, mrsMergeados28d, now);
  const ontemItems = dailyIssueItemsFromFacts(issueFacts, "yesterdayFacts");
  const hojeItems = dailyIssueItemsFromFacts(issueFacts, "todayFacts");
  const dailyStats = {
    commits: ontem.filter((item) => item.kind === "commit").length,
    pendencias: pronto.length + atencao.length + precisaRevisar.length + hojeItems.length,
    issues: issueFacts.length,
  };

  const standupResult = await getOrCreateStandup(
    options.standupDate ?? toDateStr(now),
    {
      periodo: range,
      ontemActivities: ontem,
      porIssue,
      issues: issueFacts,
      pendentes: {
        pronto: pronto.map((mr) => ({ title: mr.title })),
        atencao: atencao.map((mr) => ({ title: mr.title, motivoAtencao: mr.motivoAtencao })),
        precisaRevisar: precisaRevisar.map((mr) => ({ title: mr.title, author: mr.author })),
      },
    },
    { persist: options.persistStandup ?? !dateRange },
  );

  const summary = {
    pronto: pronto.length,
    precisaRevisar: precisaRevisar.length,
    aguardandoRespostaMeus: aguardandoRespostaMeus.length,
    aguardandoRespostaOutros: aguardandoRespostaOutros.length,
    aguardando: aguardando.length,
    atencao: atencao.length,
    jaAprovado: jaAprovado.length,
    tempoMedioMergeDias: averageMergeTime(mergedMRs),
    tempoMedioPrimeiraAprovacaoDias: averageFirstApprovalTime(mergedMRs, approvalDates),
  };

  return {
    user: { name: user.name },
    atualizadoEm: now.toISOString(),
    summary,
    pronto,
    precisaRevisar,
    aguardandoRespostaMeus,
    aguardandoRespostaOutros,
    jaAprovado,
    aguardando,
    atencao,
    atividadeRecente,
    desempenho,
    narrativa: { ...standupResult, porIssue, ontemItems, hojeItems, stats: dailyStats },
    todos: todosRaw.map(mapTodoToItem),
  };
}
