import * as core from "@actions/core";
import * as github from "@actions/github";
import type { DigestEntry, MergedPullRequest } from "./report";
import { buildDigest, buildReleaseNotes } from "./report";

function positiveInteger(name: string, raw: string, min: number, max: number): number {
  const value = Number(raw);
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new Error(`Input '${name}' must be an integer from ${min} to ${max}.`);
  }
  return value;
}

function labelsOf(labels: Array<{ name?: string | null } | string>): string[] {
  return labels.map((label) => (typeof label === "string" ? label : label.name ?? "")).filter(Boolean);
}

interface RawIssue {
  number: number;
  title: string;
  html_url: string;
  updated_at: string;
  user: { login: string } | null;
  labels: Array<{ name?: string | null } | string>;
  pull_request?: unknown;
}

async function run(): Promise<void> {
  const token = core.getInput("github-token", { required: true });
  const repository = core.getInput("repository") || process.env.GITHUB_REPOSITORY || "";
  const [owner, repo, extra] = repository.split("/");
  if (!owner || !repo || extra) {
    throw new Error("Input 'repository' must use the owner/repository format.");
  }

  const days = positiveInteger("days", core.getInput("days") || "7", 1, 365);
  const maxItems = positiveInteger("max-items", core.getInput("max-items") || "50", 1, 200);
  const title = core.getInput("title") || "MaintainerKit weekly digest";
  const sinceDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const since = sinceDate.toISOString();
  const octokit = github.getOctokit(token);

  core.info(`Collecting recent activity from ${owner}/${repo} since ${since}.`);
  const rawIssues = await octokit.paginate(octokit.rest.issues.listForRepo, {
    owner,
    repo,
    state: "all",
    since,
    per_page: 100,
    sort: "updated",
    direction: "desc",
  });

  const entries: DigestEntry[] = (rawIssues as RawIssue[]).map((item) => ({
    number: item.number,
    title: item.title,
    url: item.html_url,
    updatedAt: item.updated_at,
    author: item.user?.login ?? "unknown",
    labels: labelsOf(item.labels),
    kind: "pull_request" in item ? "pull_request" : "issue",
  }));

  const mergedPullRequests: MergedPullRequest[] = [];
  const pages = octokit.paginate.iterator(octokit.rest.pulls.list, {
    owner,
    repo,
    state: "closed",
    sort: "updated",
    direction: "desc",
    per_page: 100,
  });
  for await (const { data } of pages) {
    if (data.length === 0) break;
    let crossedWindow = false;
    for (const pullRequest of data) {
      if (Date.parse(pullRequest.updated_at) < sinceDate.getTime()) {
        crossedWindow = true;
        continue;
      }
      if (pullRequest.merged_at && Date.parse(pullRequest.merged_at) >= sinceDate.getTime()) {
        mergedPullRequests.push({
          number: pullRequest.number,
          title: pullRequest.title,
          url: pullRequest.html_url,
          updatedAt: pullRequest.updated_at,
          mergedAt: pullRequest.merged_at,
          author: pullRequest.user?.login ?? "unknown",
          labels: labelsOf(pullRequest.labels),
          kind: "pull_request",
        });
      }
    }
    if (crossedWindow) break;
  }

  const digest = buildDigest(entries, { repository, title, since, maxItems });
  const releaseNotes = buildReleaseNotes(mergedPullRequests, { repository, since });
  core.setOutput("digest-markdown", digest);
  core.setOutput("release-notes-markdown", releaseNotes);
  await core.summary.addRaw(digest).addSeparator().addRaw(releaseNotes).write();
  core.info(`Digest includes ${entries.length} activity item(s); release-note draft includes ${mergedPullRequests.length} merged pull request(s).`);
}

run().catch((error: unknown) => {
  core.setFailed(error instanceof Error ? error.message : String(error));
});
