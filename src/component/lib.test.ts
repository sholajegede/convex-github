import { describe, expect, test } from "vitest";
import { initConvexTest } from "./setup.test.js";
import { api } from "./_generated/api.js";

describe("issues", () => {
  test("recordIssue inserts then updates the same issueId", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordIssue, {
      issueId: "issue_1",
      repo: "sholajegede/convex-github",
      number: 1,
      title: "Fix bug",
      state: "open",
      url: "https://github.com/sholajegede/convex-github/issues/1",
    });

    let issue = await t.query(api.lib.getIssue, { issueId: "issue_1" });
    expect(issue?.state).toBe("open");

    await t.mutation(api.lib.updateIssueState, { issueId: "issue_1", state: "closed" });

    issue = await t.query(api.lib.getIssue, { issueId: "issue_1" });
    expect(issue?.state).toBe("closed");
    expect(issue?.title).toBe("Fix bug");
  });

  test("listIssuesByRepo scopes by repo", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordIssue, {
      issueId: "issue_a",
      repo: "org/repo-a",
      number: 1,
      title: "a",
      state: "open",
      url: "https://github.com/org/repo-a/issues/1",
    });
    await t.mutation(api.lib.recordIssue, {
      issueId: "issue_b",
      repo: "org/repo-b",
      number: 1,
      title: "b",
      state: "open",
      url: "https://github.com/org/repo-b/issues/1",
    });

    const results = await t.query(api.lib.listIssuesByRepo, { repo: "org/repo-a" });
    expect(results).toHaveLength(1);
    expect(results[0].issueId).toBe("issue_a");
  });
});

describe("pull requests", () => {
  test("recordPullRequest upserts by pullRequestId", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordPullRequest, {
      pullRequestId: "pr_1",
      repo: "org/repo",
      number: 5,
      title: "Add feature",
      state: "open",
      merged: false,
      url: "https://github.com/org/repo/pull/5",
    });

    let pr = await t.query(api.lib.getPullRequest, { pullRequestId: "pr_1" });
    expect(pr?.merged).toBe(false);

    await t.mutation(api.lib.recordPullRequest, {
      pullRequestId: "pr_1",
      repo: "org/repo",
      number: 5,
      title: "Add feature",
      state: "closed",
      merged: true,
      url: "https://github.com/org/repo/pull/5",
    });

    pr = await t.query(api.lib.getPullRequest, { pullRequestId: "pr_1" });
    expect(pr?.merged).toBe(true);
  });

  test("updatePullRequestState marks a PR merged without touching its title", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordPullRequest, {
      pullRequestId: "pr_2",
      repo: "org/repo",
      number: 9,
      title: "Add feature",
      state: "open",
      merged: false,
      url: "https://github.com/org/repo/pull/9",
    });

    await t.mutation(api.lib.updatePullRequestState, {
      pullRequestId: "pr_2",
      state: "closed",
      merged: true,
    });

    const pr = await t.query(api.lib.getPullRequest, { pullRequestId: "pr_2" });
    expect(pr?.state).toBe("closed");
    expect(pr?.merged).toBe(true);
    expect(pr?.title).toBe("Add feature");
  });

  test("updatePullRequestState is a no-op for an unknown pullRequestId", async () => {
    const t = initConvexTest();
    await t.mutation(api.lib.updatePullRequestState, {
      pullRequestId: "does_not_exist",
      state: "closed",
      merged: true,
    });
    const pr = await t.query(api.lib.getPullRequest, { pullRequestId: "does_not_exist" });
    expect(pr).toBeNull();
  });
});

describe("stats and history", () => {
  test("getStats counts rows across all three tables", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordIssue, {
      issueId: "issue_stats",
      repo: "org/repo",
      number: 1,
      title: "a",
      state: "open",
      url: "https://github.com/org/repo/issues/1",
    });
    await t.mutation(api.lib.recordPullRequest, {
      pullRequestId: "pr_stats",
      repo: "org/repo",
      number: 2,
      title: "b",
      state: "open",
      merged: false,
      url: "https://github.com/org/repo/pull/2",
    });
    await t.mutation(api.lib.checkAndRecordEvent, {
      eventId: "delivery_stats",
      eventType: "issues",
      repo: "org/repo",
      payload: "{}",
    });

    const stats = await t.query(api.lib.getStats, {});
    expect(stats).toEqual({ issues: 1, pullRequests: 1, webhookEvents: 1 });
  });

  test("listRecentIssues and listRecentPullRequests return newest first, across repos", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.recordIssue, {
      issueId: "issue_1",
      repo: "org/repo-a",
      number: 1,
      title: "first",
      state: "open",
      url: "https://github.com/org/repo-a/issues/1",
    });
    await t.mutation(api.lib.recordIssue, {
      issueId: "issue_2",
      repo: "org/repo-b",
      number: 1,
      title: "second",
      state: "open",
      url: "https://github.com/org/repo-b/issues/1",
    });

    const recent = await t.query(api.lib.listRecentIssues, {});
    expect(recent.map((i) => i.issueId)).toEqual(["issue_2", "issue_1"]);

    const limited = await t.query(api.lib.listRecentIssues, { limit: 1 });
    expect(limited).toHaveLength(1);
    expect(limited[0].issueId).toBe("issue_2");
  });

  test("listRecentWebhookEvents returns newest first", async () => {
    const t = initConvexTest();

    await t.mutation(api.lib.checkAndRecordEvent, {
      eventId: "delivery_a",
      eventType: "issues",
      repo: "org/repo",
      payload: "{}",
    });
    await t.mutation(api.lib.checkAndRecordEvent, {
      eventId: "delivery_b",
      eventType: "pull_request",
      repo: "org/repo",
      payload: "{}",
    });

    const events = await t.query(api.lib.listRecentWebhookEvents, {});
    expect(events.map((e) => e.eventId)).toEqual(["delivery_b", "delivery_a"]);
  });
});

describe("webhook idempotency", () => {
  test("checkAndRecordEvent flags duplicate delivery ids", async () => {
    const t = initConvexTest();

    const first = await t.mutation(api.lib.checkAndRecordEvent, {
      eventId: "delivery_1",
      eventType: "issues",
      repo: "org/repo",
      payload: "{}",
    });
    expect(first.alreadyProcessed).toBe(false);

    const second = await t.mutation(api.lib.checkAndRecordEvent, {
      eventId: "delivery_1",
      eventType: "issues",
      repo: "org/repo",
      payload: "{}",
    });
    expect(second.alreadyProcessed).toBe(true);
  });
});
