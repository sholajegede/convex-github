import { query, action } from "./_generated/server.js";
import { components } from "./_generated/api.js";
import { GitHub } from "../../src/client/index.js";
import { v } from "convex/values";

const github = new GitHub(components.convexGithub, {
  token: process.env.GITHUB_TOKEN!,
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET!,
});

export const createIssue = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    title: v.string(),
    body: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
    assignees: v.optional(v.array(v.string())),
  },
  handler: async (ctx, args) => {
    return await github.createIssue(ctx, args);
  },
});

export const createIssueComment = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    issueNumber: v.number(),
    body: v.string(),
  },
  handler: async (ctx, args) => {
    return await github.createIssueComment(ctx, args);
  },
});

export const closeIssue = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    issueNumber: v.number(),
  },
  handler: async (ctx, args) => {
    await github.closeIssue(ctx, args);
    return null;
  },
});

export const mergePullRequest = action({
  args: {
    owner: v.string(),
    repo: v.string(),
    pullNumber: v.number(),
    mergeMethod: v.optional(
      v.union(v.literal("merge"), v.literal("squash"), v.literal("rebase")),
    ),
  },
  handler: async (ctx, args) => {
    await github.mergePullRequest(ctx, args);
    return null;
  },
});

export const getIssue = query({
  args: { issueId: v.string() },
  handler: async (ctx, args) => {
    return await github.getIssue(ctx, args);
  },
});

export const listIssuesByRepo = query({
  args: { repo: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await github.listIssuesByRepo(ctx, args);
  },
});

export const getPullRequest = query({
  args: { pullRequestId: v.string() },
  handler: async (ctx, args) => {
    return await github.getPullRequest(ctx, args);
  },
});

export const listPullRequestsByRepo = query({
  args: { repo: v.string(), limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    return await github.listPullRequestsByRepo(ctx, args);
  },
});
