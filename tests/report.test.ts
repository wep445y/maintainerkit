import assert from "node:assert/strict";
import test from "node:test";
import { buildDigest, buildReleaseNotes, type DigestEntry, type MergedPullRequest } from "../src/report";

const base: DigestEntry = {
  number: 12,
  title: "Fix [important] issue",
  url: "https://github.com/acme/project/issues/12",
  updatedAt: "2026-11-20T12:00:00Z",
  author: "maintainer",
  labels: ["bug", "good first issue"],
  kind: "issue",
};

const options = {
  repository: "acme/project",
  title: "Weekly digest",
  since: "2026-11-18T00:00:00Z",
  maxItems: 10,
};

test("buildDigest groups activity, includes totals, and escapes Markdown titles", () => {
  const pullRequest: DigestEntry = {
    ...base,
    number: 13,
    title: "Add feature",
    kind: "pull_request",
    labels: ["enhancement"],
  };
  const digest = buildDigest([base, pullRequest], options);
  assert.match(digest, /## Issues \(1\)/);
  assert.match(digest, /## Pull requests \(1\)/);
  assert.ok(digest.includes("Fix \\[important\\] issue"));
  assert.match(digest, /https:\/\/github\.com\/acme\/project/);
});

test("buildDigest neutralizes raw HTML and line breaks from issue titles", () => {
  const digest = buildDigest([{ ...base, title: "<img src=x>\nInjected heading" }], options);
  assert.ok(digest.includes("\\<img src=x\\> Injected heading"));
  assert.doesNotMatch(digest, /(?:^|[^\\])<img/);
});

test("buildDigest caps displayed entries while keeping full activity totals", () => {
  const digest = buildDigest([base, { ...base, number: 14, kind: "pull_request" }], {
    ...options,
    maxItems: 1,
  });
  assert.match(digest, /Activity found: 1 issue\(s\), 1 pull request\(s\)/);
  assert.match(digest, /Showing the latest 1 of 2 activity items/);
});

test("buildReleaseNotes groups merged changes by label and remains an explicit draft", () => {
  const merged: MergedPullRequest = {
    ...base,
    kind: "pull_request",
    title: "Add keyboard navigation",
    labels: ["feature"],
    mergedAt: "2026-11-20T15:00:00Z",
  };
  const notes = buildReleaseNotes([merged], { repository: "acme/project", since: options.since });
  assert.match(notes, /# Draft release notes/);
  assert.match(notes, /## feature/);
  assert.match(notes, /Add keyboard navigation/);
  assert.match(notes, /No release was created or published/);
});

test("buildReleaseNotes handles an empty window", () => {
  const notes = buildReleaseNotes([], { repository: "acme/project", since: options.since });
  assert.match(notes, /No merged pull requests found/);
});
