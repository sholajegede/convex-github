import { v } from "convex/values";
import { mutation, query } from "./_generated/server.js";

const stateValidator = v.union(v.literal("open"), v.literal("closed"));

const issueValidator = v.object({
  _id: v.id("issues"),
  _creationTime: v.number(),
  issueId: v.string(),
  repo: v.string(),
  number: v.number(),
  title: v.string(),
  state: stateValidator,
  authorLogin: v.optional(v.string()),
  labels: v.optional(v.array(v.string())),
  assignees: v.optional(v.array(v.string())),
  url: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

const pullRequestValidator = v.object({
  _id: v.id("pullRequests"),
  _creationTime: v.number(),
  pullRequestId: v.string(),
  repo: v.string(),
  number: v.number(),
  title: v.string(),
  state: stateValidator,
  merged: v.boolean(),
  authorLogin: v.optional(v.string()),
  headRef: v.optional(v.string()),
  baseRef: v.optional(v.string()),
  url: v.string(),
  createdAt: v.number(),
  updatedAt: v.number(),
});

// ─── Queries ────────────────────────────────────────────────────────────────

export const getIssue = query({
  args: { issueId: v.string() },
  returns: v.union(v.null(), issueValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("issues")
      .withIndex("by_issueId", (q) => q.eq("issueId", args.issueId))
      .first();
  },
});

export const listIssuesByRepo = query({
  args: { repo: v.string(), limit: v.optional(v.number()) },
  returns: v.array(issueValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("issues")
      .withIndex("by_repo", (q) => q.eq("repo", args.repo))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

export const getPullRequest = query({
  args: { pullRequestId: v.string() },
  returns: v.union(v.null(), pullRequestValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pullRequests")
      .withIndex("by_pullRequestId", (q) => q.eq("pullRequestId", args.pullRequestId))
      .first();
  },
});

export const listPullRequestsByRepo = query({
  args: { repo: v.string(), limit: v.optional(v.number()) },
  returns: v.array(pullRequestValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("pullRequests")
      .withIndex("by_repo", (q) => q.eq("repo", args.repo))
      .order("desc")
      .take(args.limit ?? 50);
  },
});

// ─── Mutations ──────────────────────────────────────────────────────────────

export const recordIssue = mutation({
  args: {
    issueId: v.string(),
    repo: v.string(),
    number: v.number(),
    title: v.string(),
    state: stateValidator,
    authorLogin: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
    assignees: v.optional(v.array(v.string())),
    url: v.string(),
  },
  returns: v.id("issues"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("issues")
      .withIndex("by_issueId", (q) => q.eq("issueId", args.issueId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("issues", { ...args, createdAt: now, updatedAt: now });
  },
});

export const recordPullRequest = mutation({
  args: {
    pullRequestId: v.string(),
    repo: v.string(),
    number: v.number(),
    title: v.string(),
    state: stateValidator,
    merged: v.boolean(),
    authorLogin: v.optional(v.string()),
    headRef: v.optional(v.string()),
    baseRef: v.optional(v.string()),
    url: v.string(),
  },
  returns: v.id("pullRequests"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const existing = await ctx.db
      .query("pullRequests")
      .withIndex("by_pullRequestId", (q) => q.eq("pullRequestId", args.pullRequestId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, { ...args, updatedAt: now });
      return existing._id;
    }

    return await ctx.db.insert("pullRequests", { ...args, createdAt: now, updatedAt: now });
  },
});

export const updateIssueState = mutation({
  args: {
    issueId: v.string(),
    state: stateValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("issues")
      .withIndex("by_issueId", (q) => q.eq("issueId", args.issueId))
      .first();
    if (!existing) return null;
    await ctx.db.patch(existing._id, { state: args.state, updatedAt: Date.now() });
    return null;
  },
});

export const updatePullRequestState = mutation({
  args: {
    pullRequestId: v.string(),
    state: stateValidator,
    merged: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("pullRequests")
      .withIndex("by_pullRequestId", (q) => q.eq("pullRequestId", args.pullRequestId))
      .first();
    if (!existing) return null;
    await ctx.db.patch(existing._id, {
      state: args.state,
      merged: args.merged,
      updatedAt: Date.now(),
    });
    return null;
  },
});

// ─── Dashboard / history ────────────────────────────────────────────────────

// Demo/debug stats panel -- collects every row in each of these 3 tables
// just to count them, so this is O(total rows), not O(1). Fine for a small
// test workspace; a production dashboard at real scale should track counts
// incrementally (e.g. a running counter row updated alongside each insert)
// instead of calling this on every render.
export const getStats = query({
  args: {},
  returns: v.object({
    issues: v.number(),
    pullRequests: v.number(),
    webhookEvents: v.number(),
  }),
  handler: async (ctx) => {
    const [issues, pullRequests, webhookEvents] = await Promise.all([
      ctx.db.query("issues").collect(),
      ctx.db.query("pullRequests").collect(),
      ctx.db.query("webhookEvents").collect(),
    ]);
    return {
      issues: issues.length,
      pullRequests: pullRequests.length,
      webhookEvents: webhookEvents.length,
    };
  },
});

export const listRecentIssues = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(issueValidator),
  handler: async (ctx, args) => {
    return await ctx.db.query("issues").order("desc").take(args.limit ?? 30);
  },
});

export const listRecentPullRequests = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(pullRequestValidator),
  handler: async (ctx, args) => {
    return await ctx.db.query("pullRequests").order("desc").take(args.limit ?? 30);
  },
});

export const listRecentWebhookEvents = query({
  args: { limit: v.optional(v.number()) },
  returns: v.array(
    v.object({
      _id: v.id("webhookEvents"),
      _creationTime: v.number(),
      eventId: v.string(),
      eventType: v.string(),
      repo: v.optional(v.string()),
      payload: v.string(),
      receivedAt: v.number(),
    }),
  ),
  handler: async (ctx, args) => {
    return await ctx.db.query("webhookEvents").order("desc").take(args.limit ?? 30);
  },
});

export const checkAndRecordEvent = mutation({
  args: {
    eventId: v.string(),
    eventType: v.string(),
    repo: v.optional(v.string()),
    payload: v.string(),
  },
  returns: v.object({ alreadyProcessed: v.boolean() }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("webhookEvents")
      .withIndex("by_eventId", (q) => q.eq("eventId", args.eventId))
      .first();
    if (existing) {
      return { alreadyProcessed: true };
    }
    await ctx.db.insert("webhookEvents", { ...args, receivedAt: Date.now() });
    return { alreadyProcessed: false };
  },
});
