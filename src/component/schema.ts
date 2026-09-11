import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  issues: defineTable({
    issueId: v.string(),
    repo: v.string(),
    number: v.number(),
    title: v.string(),
    state: v.union(v.literal("open"), v.literal("closed")),
    authorLogin: v.optional(v.string()),
    labels: v.optional(v.array(v.string())),
    assignees: v.optional(v.array(v.string())),
    url: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_issueId", ["issueId"])
    .index("by_repo", ["repo"]),

  pullRequests: defineTable({
    pullRequestId: v.string(),
    repo: v.string(),
    number: v.number(),
    title: v.string(),
    state: v.union(v.literal("open"), v.literal("closed")),
    merged: v.boolean(),
    authorLogin: v.optional(v.string()),
    headRef: v.optional(v.string()),
    baseRef: v.optional(v.string()),
    url: v.string(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_pullRequestId", ["pullRequestId"])
    .index("by_repo", ["repo"]),

  webhookEvents: defineTable({
    eventId: v.string(),
    eventType: v.string(),
    repo: v.optional(v.string()),
    payload: v.string(),
    receivedAt: v.number(),
  }).index("by_eventId", ["eventId"]),
});
