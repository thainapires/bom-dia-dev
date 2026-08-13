import { glabApi } from "./glab";
import type {
  GitlabApprovals,
  GitlabEvent,
  GitlabIssue,
  GitlabMergeRequestDetail,
  GitlabMergeRequestSummary,
  GitlabNote,
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
