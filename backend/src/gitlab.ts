import { glabApi } from "./glab";
import type {
  GitlabApprovals,
  GitlabDiscussion,
  GitlabEvent,
  GitlabIssue,
  GitlabLabelEvent,
  GitlabMergeRequestDetail,
  GitlabMergeRequestSummary,
  GitlabNote,
  GitlabTodo,
  GitlabUser,
} from "./types";

export function getCurrentUser(): Promise<GitlabUser> {
  return glabApi<GitlabUser>("user");
}

export function getOpenMRs(): Promise<GitlabMergeRequestSummary[]> {
  return glabApi<GitlabMergeRequestSummary[]>(
    "merge_requests?scope=created_by_me&state=opened&per_page=50",
  );
}

export function getMergedMRs(limit = 10): Promise<GitlabMergeRequestSummary[]> {
  return glabApi<GitlabMergeRequestSummary[]>(
    `merge_requests?scope=created_by_me&state=merged&order_by=updated_at&sort=desc&per_page=${limit}`,
  );
}

// `updated_after` é só um filtro grosseiro de pré-seleção (marca quando o MR
// foi tocado por último, não quando foi mergeado) — quem chama precisa
// refinar por `merged_at` no código. Usada pra "Seu desempenho" e pra gerar
// atividade de merge fora da janela coberta por `getMergedMRs`.
export function getMergedMRsSince(after: string): Promise<GitlabMergeRequestSummary[]> {
  return glabApi<GitlabMergeRequestSummary[]>(
    `merge_requests?scope=created_by_me&state=merged&updated_after=${after}&order_by=updated_at&sort=desc&per_page=100`,
  );
}

// `state=all` inclui MRs ainda abertos e já fechados/mergeados criados no
// período — usada só pra contar "MRs abertos" em "Seu desempenho", não pra
// classificação de status (que usa `getOpenMRs`).
export function getMrsCreatedSince(after: string): Promise<GitlabMergeRequestSummary[]> {
  return glabApi<GitlabMergeRequestSummary[]>(
    `merge_requests?scope=created_by_me&state=all&created_after=${after}&per_page=100`,
  );
}

export function getMRDetail(
  projectId: number,
  iid: number,
): Promise<GitlabMergeRequestDetail> {
  return glabApi<GitlabMergeRequestDetail>(
    `projects/${projectId}/merge_requests/${iid}`,
  );
}

export function getApprovals(
  projectId: number,
  iid: number,
): Promise<GitlabApprovals> {
  return glabApi<GitlabApprovals>(
    `projects/${projectId}/merge_requests/${iid}/approvals`,
  );
}

export function getEvents(after: string, before: string): Promise<GitlabEvent[]> {
  return glabApi<GitlabEvent[]>(`events?after=${after}&before=${before}&per_page=100`);
}

export function getMrsToReview(username: string): Promise<GitlabMergeRequestSummary[]> {
  return glabApi<GitlabMergeRequestSummary[]>(
    `merge_requests?scope=all&reviewer_username=${username}&state=opened&per_page=50`,
  );
}

export function getAssignedIssues(username: string): Promise<GitlabIssue[]> {
  return glabApi<GitlabIssue[]>(
    `issues?assignee_username=${username}&scope=all&state=opened&per_page=100`,
  );
}

export function getIssueNotes(projectId: number, iid: number): Promise<GitlabNote[]> {
  return glabApi<GitlabNote[]>(
    `projects/${projectId}/issues/${iid}/notes?per_page=100&sort=desc&order_by=created_at`,
  );
}

export function getIssueLabelEvents(
  projectId: number,
  iid: number,
): Promise<GitlabLabelEvent[]> {
  return glabApi<GitlabLabelEvent[]>(
    `projects/${projectId}/issues/${iid}/resource_label_events?per_page=100`,
  );
}

export function getMrNotes(projectId: number, iid: number): Promise<GitlabNote[]> {
  return glabApi<GitlabNote[]>(
    `projects/${projectId}/merge_requests/${iid}/notes?per_page=100&sort=asc&order_by=created_at`,
  );
}

export function getTodos(): Promise<GitlabTodo[]> {
  return glabApi<GitlabTodo[]>("todos?state=pending&per_page=100");
}

export function getMrDiscussions(
  projectId: number,
  iid: number,
): Promise<GitlabDiscussion[]> {
  return glabApi<GitlabDiscussion[]>(
    `projects/${projectId}/merge_requests/${iid}/discussions?per_page=100`,
  );
}
