import type {
  BoardStatus,
  GitlabLabelEvent,
  IssueDayActivity,
  IssueNarrativeItem,
  IssueStandupFact,
  IssueTodayRelevance,
  IssueUpdateCategoria,
} from "./types";

export type IssueNarrativeClassifier = (
  activities: IssueDayActivity[],
) => Promise<IssueNarrativeItem[]>;

export const BOARD_STATUSES: BoardStatus[] = [
  "Blocked",
  "Sprint ready",
  "To do",
  "In progress",
  "For code review",
  "Code Review Failed",
  "For QA Deployment",
  "For QA Testing",
  "In Testing",
  "QA Testing Failed",
  "For Production Deployment",
  "For Production Testing",
  "Production Testing Failed",
  "Done",
  "Closed",
];

const STATUS_LABELS = new Map(
  BOARD_STATUSES.map((status) => [normalizeStatusText(status), status]),
);

const ATTENTION_PRIORITY: Partial<Record<BoardStatus, number>> = {
  "Production Testing Failed": 100,
  "QA Testing Failed": 90,
  "Code Review Failed": 80,
  Blocked: 70,
  "In progress": 60,
  "To do": 50,
  "Sprint ready": 40,
};

const PASSIVE_STATUSES = new Set<BoardStatus>([
  "For QA Deployment",
  "For QA Testing",
  "In Testing",
  "For Production Deployment",
  "For Production Testing",
  "Done",
  "Closed",
]);

const STATUS_TO_CATEGORY: Partial<Record<BoardStatus, IssueUpdateCategoria>> = {
  Blocked: "bloqueado",
  "In progress": "trabalhando",
  "For code review": "code_review",
  "Code Review Failed": "code_review",
  "For QA Deployment": "aguardando_qa",
  "For QA Testing": "aguardando_qa",
  "In Testing": "aguardando_qa",
  "QA Testing Failed": "testado_falhou",
  "For Production Testing": "testado_ok",
  "Production Testing Failed": "testado_falhou",
  Done: "finalizado",
  Closed: "finalizado",
};

function normalizeStatusText(value: string): string {
  const unscoped = value.split("::").at(-1) ?? value;
  return unscoped
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function normalizeBoardStatus(label: string): BoardStatus | null {
  return STATUS_LABELS.get(normalizeStatusText(label)) ?? null;
}

function rangeStart(range: { after: string }): Date {
  const start = new Date(range.after);
  start.setUTCDate(start.getUTCDate() + 1);
  return start;
}

function isWithinRange(iso: string, range: { after: string; before: string }): boolean {
  const time = new Date(iso).getTime();
  return time >= rangeStart(range).getTime() && time < new Date(range.before).getTime();
}

function currentStatus(activity: IssueDayActivity): BoardStatus | null {
  if (activity.issueState === "closed") return "Closed";
  for (const label of activity.currentLabels) {
    const status = normalizeBoardStatus(label);
    if (status) return status;
  }
  return null;
}

function statusFromEvent(event: GitlabLabelEvent): BoardStatus | null {
  return event.label ? normalizeBoardStatus(event.label.name) : null;
}

function statusAtStart(activity: IssueDayActivity, range: { after: string; before: string }): BoardStatus | null {
  const start = rangeStart(range).getTime();
  let status: BoardStatus | null = null;

  const previousChanges = activity.labelChanges
    .filter((event) => new Date(event.created_at).getTime() < start && statusFromEvent(event))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  for (const event of previousChanges) {
    const eventStatus = statusFromEvent(event);
    if (!eventStatus) continue;
    status = event.action === "add" ? eventStatus : status === eventStatus ? null : status;
  }

  const stateAtStart = activity.stateEvents
    .filter((event) => new Date(event.created_at).getTime() < start)
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .at(-1);
  if (stateAtStart?.state === "closed") return "Closed";

  if (status) return status;

  const hasStatusChangeInRange = activity.labelChanges.some(
    (event) => isWithinRange(event.created_at, range) && statusFromEvent(event),
  );
  return hasStatusChangeInRange ? null : currentStatus(activity);
}

function buildTransitions(activity: IssueDayActivity, range: { after: string; before: string }) {
  let previous = statusAtStart(activity, range);
  const changes = activity.labelChanges
    .filter((event) => statusFromEvent(event))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));

  const labelTransitions = changes.flatMap((event) => {
    const status = statusFromEvent(event);
    if (!status || !isWithinRange(event.created_at, range) || event.action !== "add") return [];

    const removedAtSameTime = changes.find(
      (candidate) =>
        candidate.action === "remove" &&
        candidate.created_at === event.created_at &&
        statusFromEvent(candidate) !== null,
    );
    const from = previous ?? (removedAtSameTime ? statusFromEvent(removedAtSameTime) : null);
    previous = status;

    if (from === status) return [];
    return [{ from, to: status, timestamp: event.created_at }];
  });

  const closedTransitions = activity.stateEvents
    .filter((event) => event.state === "closed" && isWithinRange(event.created_at, range))
    .map((event) => ({ from: previous, to: "Closed" as const, timestamp: event.created_at }));

  return [...labelTransitions, ...closedTransitions].sort((a, b) => a.timestamp.localeCompare(b.timestamp));
}

function assignmentTimes(activity: IssueDayActivity, range: { after: string; before: string }): string[] {
  return activity.assignmentEvents
    .filter((note) => isWithinRange(note.created_at, range))
    .map((note) => note.created_at)
    .sort();
}

function hasAssignmentBefore(activity: IssueDayActivity, range: { after: string }): boolean {
  const start = rangeStart(range).getTime();
  return activity.assignmentEvents.some((note) => new Date(note.created_at).getTime() < start);
}

function transitionFact(transition: { from: BoardStatus | null; to: BoardStatus }): string {
  const prefix = transition.from ? `${transition.from} -> ${transition.to}` : `mudou para ${transition.to}`;
  switch (transition.to) {
    case "For code review":
      return `${prefix}; desenvolvimento enviado para code review`;
    case "Code Review Failed":
      return `${prefix}; code review pediu ajustes`;
    case "In progress":
      if (transition.from === "Code Review Failed") return `${prefix}; voltou para desenvolvimento para ajustes de review`;
      if (transition.from === "QA Testing Failed") return `${prefix}; voltou para desenvolvimento para correção de QA`;
      return `${prefix}; ficou em desenvolvimento`;
    case "QA Testing Failed":
      return `${prefix}; QA falhou e precisa de atenção`;
    case "Production Testing Failed":
      return `${prefix}; teste em produção falhou e precisa de investigação`;
    case "Done":
    case "Closed":
      return `${prefix}; tarefa concluída`;
    case "Blocked":
      return `${prefix}; tarefa bloqueada`;
    default:
      return prefix;
  }
}

function todayRelevance(status: BoardStatus | null, transitions: Array<{ to: BoardStatus }>): IssueTodayRelevance {
  if (transitions.some((transition) => ["Code Review Failed", "QA Testing Failed", "Production Testing Failed", "Blocked"].includes(transition.to))) {
    return "attention";
  }
  if (!status) return "none";
  if (["Production Testing Failed", "QA Testing Failed", "Code Review Failed", "Blocked"].includes(status)) return "attention";
  if (["In progress", "To do", "Sprint ready"].includes(status)) return "active";
  if (PASSIVE_STATUSES.has(status)) return "passive";
  return "none";
}

function todayFacts(activity: IssueDayActivity, status: BoardStatus | null, relevance: IssueTodayRelevance): string[] {
  if (relevance === "none" || relevance === "passive") return [];
  if (!status) return [];
  if (status === "In progress") return [`estado atual: ${status}; pode continuar como trabalho em andamento`];
  if (status === "To do" || status === "Sprint ready") return [`estado atual: ${status}; candidata a trabalho se fizer sentido pela prioridade`];
  if (status === "Blocked") return [`estado atual: ${status}; verificar apenas se o bloqueio ainda impacta meu trabalho`];
  if (status === "Code Review Failed") return [`estado atual: ${status}; ajustes de review precisam de atenção`];
  if (status === "QA Testing Failed") return [`estado atual: ${status}; correção de QA precisa de atenção`];
  if (status === "Production Testing Failed") return [`estado atual: ${status}; investigação/correção em produção precisa de atenção`];
  return [`estado atual: ${status}`];
}

function narrativeLine(fact: IssueStandupFact): string | null {
  const transition = fact.statusTransitions.at(-1);
  if (transition) return `${fact.title}: ${transitionFact(transition)}`;
  if (fact.hasCommitDuringPeriod) return `Trabalhou em "${fact.title}"`;
  if (fact.commentsDuringPeriod.length > 0) return `Comentou em "${fact.title}"`;
  if (fact.assignedDuringPeriod.length > 0) return `Assumiu "${fact.title}"`;
  return null;
}

export function buildIssueStandupFacts(
  activities: IssueDayActivity[],
  username: string,
  range: { after: string; before: string },
): IssueStandupFact[] {
  return activities
    .map((activity) => {
      const status = currentStatus(activity);
      const transitions = buildTransitions(activity, range);
      const commentsDuringPeriod = activity.comments.filter((comment) => isWithinRange(comment.created_at, range));
      const assignedDuringPeriod = assignmentTimes(activity, range);
      const isAssignedToMe = activity.currentAssignees.includes(username);
      const relevance = todayRelevance(status, transitions);
      const yesterdayFacts = [
        ...assignedDuringPeriod.map((timestamp) => `atribuída a mim em ${timestamp}`),
        ...transitions.map(transitionFact),
        ...(activity.hasCommit ? ["commit relacionado dentro do período"] : []),
        ...commentsDuringPeriod.map((comment) => `comentário registrado em ${comment.created_at}`),
      ];

      return {
        issueIid: activity.issueIid,
        projectId: activity.projectId,
        title: activity.title,
        url: activity.url,
        currentStatus: status,
        statusAtPeriodStart: statusAtStart(activity, range),
        currentAssignees: activity.currentAssignees,
        isAssignedToMe,
        wasAssignedBeforePeriod: isAssignedToMe && hasAssignmentBefore(activity, range),
        assignedDuringPeriod,
        statusTransitions: transitions,
        commentsDuringPeriod: commentsDuringPeriod.map((comment) => ({ createdAt: comment.created_at })),
        hasCommitDuringPeriod: activity.hasCommit,
        yesterdayFacts,
        todayFacts: todayFacts(activity, status, relevance),
        todayRelevance: relevance,
        priority: status ? ATTENTION_PRIORITY[status] ?? 0 : 0,
      } satisfies IssueStandupFact;
    })
    .filter((fact) => fact.yesterdayFacts.length > 0 || fact.todayFacts.length > 0)
    .sort((a, b) => b.priority - a.priority || a.title.localeCompare(b.title));
}


export function buildIssueNarrativeItems(facts: IssueStandupFact[]): IssueNarrativeItem[] {
  return facts
    .map((fact) => {
      const line = narrativeLine(fact);
      if (!line) return null;
      return {
        issueIid: fact.issueIid,
        projectId: fact.projectId,
        title: fact.title,
        url: fact.url,
        linha: line,
        categoria: STATUS_TO_CATEGORY[fact.currentStatus ?? "In progress"] ?? "trabalhando",
      } satisfies IssueNarrativeItem;
    })
    .filter((item): item is IssueNarrativeItem => item !== null);
}

export function classifyIssueActivity(activity: IssueDayActivity): IssueNarrativeItem | null {
  const [fact] = buildIssueStandupFacts([activity], activity.currentAssignees[0] ?? "", {
    after: "1970-01-01",
    before: "9999-12-31",
  });
  const line = fact ? narrativeLine(fact) : null;
  if (!fact || !line) return null;

  return {
    issueIid: fact.issueIid,
    projectId: fact.projectId,
    title: fact.title,
    url: fact.url,
    linha: line,
    categoria: STATUS_TO_CATEGORY[fact.currentStatus ?? "In progress"] ?? "trabalhando",
  };
}

export const heuristicClassifier: IssueNarrativeClassifier = async (activities) =>
  buildIssueNarrativeItems(
    buildIssueStandupFacts(activities, activities[0]?.currentAssignees[0] ?? "", {
      after: "1970-01-01",
      before: "9999-12-31",
    }),
  );
