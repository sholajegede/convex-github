/* eslint-disable */
/**
 * Generated `ComponentApi` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type { FunctionReference } from "convex/server";

/**
 * A utility for referencing a Convex component's exposed API.
 *
 * Useful when expecting a parameter like `components.myComponent`.
 * Usage:
 * ```ts
 * async function myFunction(ctx: QueryCtx, component: ComponentApi) {
 *   return ctx.runQuery(component.someFile.someQuery, { ...args });
 * }
 * ```
 */
export type ComponentApi<Name extends string | undefined = string | undefined> =
  {
    lib: {
      checkAndRecordEvent: FunctionReference<
        "mutation",
        "internal",
        { eventId: string; eventType: string; payload: string; repo?: string },
        { alreadyProcessed: boolean },
        Name
      >;
      getIssue: FunctionReference<
        "query",
        "internal",
        { issueId: string },
        null | {
          _creationTime: number;
          _id: string;
          assignees?: Array<string>;
          authorLogin?: string;
          createdAt: number;
          issueId: string;
          labels?: Array<string>;
          number: number;
          repo: string;
          state: "open" | "closed";
          title: string;
          updatedAt: number;
          url: string;
        },
        Name
      >;
      getPullRequest: FunctionReference<
        "query",
        "internal",
        { pullRequestId: string },
        null | {
          _creationTime: number;
          _id: string;
          authorLogin?: string;
          baseRef?: string;
          createdAt: number;
          headRef?: string;
          merged: boolean;
          number: number;
          pullRequestId: string;
          repo: string;
          state: "open" | "closed";
          title: string;
          updatedAt: number;
          url: string;
        },
        Name
      >;
      getStats: FunctionReference<
        "query",
        "internal",
        {},
        { issues: number; pullRequests: number; webhookEvents: number },
        Name
      >;
      listIssuesByRepo: FunctionReference<
        "query",
        "internal",
        { limit?: number; repo: string },
        Array<{
          _creationTime: number;
          _id: string;
          assignees?: Array<string>;
          authorLogin?: string;
          createdAt: number;
          issueId: string;
          labels?: Array<string>;
          number: number;
          repo: string;
          state: "open" | "closed";
          title: string;
          updatedAt: number;
          url: string;
        }>,
        Name
      >;
      listPullRequestsByRepo: FunctionReference<
        "query",
        "internal",
        { limit?: number; repo: string },
        Array<{
          _creationTime: number;
          _id: string;
          authorLogin?: string;
          baseRef?: string;
          createdAt: number;
          headRef?: string;
          merged: boolean;
          number: number;
          pullRequestId: string;
          repo: string;
          state: "open" | "closed";
          title: string;
          updatedAt: number;
          url: string;
        }>,
        Name
      >;
      listRecentIssues: FunctionReference<
        "query",
        "internal",
        { limit?: number },
        Array<{
          _creationTime: number;
          _id: string;
          assignees?: Array<string>;
          authorLogin?: string;
          createdAt: number;
          issueId: string;
          labels?: Array<string>;
          number: number;
          repo: string;
          state: "open" | "closed";
          title: string;
          updatedAt: number;
          url: string;
        }>,
        Name
      >;
      listRecentPullRequests: FunctionReference<
        "query",
        "internal",
        { limit?: number },
        Array<{
          _creationTime: number;
          _id: string;
          authorLogin?: string;
          baseRef?: string;
          createdAt: number;
          headRef?: string;
          merged: boolean;
          number: number;
          pullRequestId: string;
          repo: string;
          state: "open" | "closed";
          title: string;
          updatedAt: number;
          url: string;
        }>,
        Name
      >;
      listRecentWebhookEvents: FunctionReference<
        "query",
        "internal",
        { limit?: number },
        Array<{
          _creationTime: number;
          _id: string;
          eventId: string;
          eventType: string;
          payload: string;
          receivedAt: number;
          repo?: string;
        }>,
        Name
      >;
      recordIssue: FunctionReference<
        "mutation",
        "internal",
        {
          assignees?: Array<string>;
          authorLogin?: string;
          issueId: string;
          labels?: Array<string>;
          number: number;
          repo: string;
          state: "open" | "closed";
          title: string;
          url: string;
        },
        string,
        Name
      >;
      recordPullRequest: FunctionReference<
        "mutation",
        "internal",
        {
          authorLogin?: string;
          baseRef?: string;
          headRef?: string;
          merged: boolean;
          number: number;
          pullRequestId: string;
          repo: string;
          state: "open" | "closed";
          title: string;
          url: string;
        },
        string,
        Name
      >;
      updateIssueState: FunctionReference<
        "mutation",
        "internal",
        { issueId: string; state: "open" | "closed" },
        null,
        Name
      >;
      updatePullRequestState: FunctionReference<
        "mutation",
        "internal",
        { merged: boolean; pullRequestId: string; state: "open" | "closed" },
        null,
        Name
      >;
    };
  };
