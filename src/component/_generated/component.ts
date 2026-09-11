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

type State = "open" | "closed";

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
          state: State;
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
          state: State;
          title: string;
          updatedAt: number;
          url: string;
        },
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
          state: State;
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
          state: State;
          title: string;
          updatedAt: number;
          url: string;
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
          state: State;
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
          state: State;
          title: string;
          url: string;
        },
        string,
        Name
      >;
      updateIssueState: FunctionReference<
        "mutation",
        "internal",
        { issueId: string; state: State },
        null,
        Name
      >;
    };
  };
