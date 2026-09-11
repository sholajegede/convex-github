import { httpActionGeneric } from "convex/server";
import type { GenericActionCtx, GenericDataModel } from "convex/server";
import type { ComponentApi } from "../component/_generated/component.js";

const GITHUB_API_BASE = "https://api.github.com";
const GITHUB_API_VERSION = "2026-03-10";

export type GitHubOptions = {
  /** A personal access token, fine-grained token, or GitHub App installation token. */
  token: string;
  webhookSecret: string;
};

export type CreateIssueArgs = {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
};

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

async function hmacSha256Hex(secret: string, payload: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export class GitHub {
  webhookHandler: ReturnType<typeof httpActionGeneric>;

  constructor(
    private component: ComponentApi,
    private options: GitHubOptions,
  ) {
    const component_ = component;
    const webhookSecret = options.webhookSecret;

    this.webhookHandler = httpActionGeneric(async (ctx, request) => {
      const rawBody = await request.text();
      const signatureHeader = request.headers.get("x-hub-signature-256");
      const deliveryId = request.headers.get("x-github-delivery");
      const eventType = request.headers.get("x-github-event");

      if (!signatureHeader || !deliveryId || !eventType) {
        return new Response(JSON.stringify({ error: "Missing GitHub webhook headers" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const expected = `sha256=${await hmacSha256Hex(webhookSecret, rawBody)}`;
      if (!timingSafeEqual(expected, signatureHeader)) {
        console.error("convex-github: webhook signature mismatch");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const payload = JSON.parse(rawBody) as Record<string, unknown>;
      const repository = payload.repository as Record<string, unknown> | undefined;
      const repoFullName = (repository?.full_name as string) ?? undefined;

      const { alreadyProcessed } = await ctx.runMutation(component_.lib.checkAndRecordEvent, {
        eventId: deliveryId,
        eventType,
        repo: repoFullName,
        payload: rawBody,
      });

      if (alreadyProcessed) {
        return new Response(JSON.stringify({ success: true, duplicate: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }

      if (eventType === "issues" && repoFullName) {
        const issue = payload.issue as Record<string, unknown>;
        const user = issue.user as Record<string, unknown> | undefined;
        await ctx.runMutation(component_.lib.recordIssue, {
          issueId: String(issue.id),
          repo: repoFullName,
          number: issue.number as number,
          title: issue.title as string,
          state: (issue.state as string) === "closed" ? "closed" : "open",
          authorLogin: (user?.login as string) ?? undefined,
          labels: Array.isArray(issue.labels)
            ? (issue.labels as Array<Record<string, unknown>>).map((l) => l.name as string)
            : undefined,
          assignees: Array.isArray(issue.assignees)
            ? (issue.assignees as Array<Record<string, unknown>>).map((a) => a.login as string)
            : undefined,
          url: issue.html_url as string,
        });
      } else if (eventType === "pull_request" && repoFullName) {
        const pr = payload.pull_request as Record<string, unknown>;
        const user = pr.user as Record<string, unknown> | undefined;
        const head = pr.head as Record<string, unknown> | undefined;
        const base = pr.base as Record<string, unknown> | undefined;
        await ctx.runMutation(component_.lib.recordPullRequest, {
          pullRequestId: String(pr.id),
          repo: repoFullName,
          number: pr.number as number,
          title: pr.title as string,
          state: (pr.state as string) === "closed" ? "closed" : "open",
          merged: Boolean(pr.merged),
          authorLogin: (user?.login as string) ?? undefined,
          headRef: (head?.ref as string) ?? undefined,
          baseRef: (base?.ref as string) ?? undefined,
          url: pr.html_url as string,
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.options.token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": GITHUB_API_VERSION,
      "Content-Type": "application/json",
    };
  }

  async createIssue(
    ctx: GenericActionCtx<GenericDataModel>,
    args: CreateIssueArgs,
  ): Promise<{ number: number; url: string }> {
    const res = await fetch(`${GITHUB_API_BASE}/repos/${args.owner}/${args.repo}/issues`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify({
        title: args.title,
        body: args.body,
        labels: args.labels,
        assignees: args.assignees,
      }),
    });
    if (!res.ok) {
      throw new Error(`Failed to create GitHub issue: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as {
      id: number;
      number: number;
      title: string;
      state: string;
      html_url: string;
      user?: { login: string };
      labels?: Array<{ name: string }>;
      assignees?: Array<{ login: string }>;
    };

    await ctx.runMutation(this.component.lib.recordIssue, {
      issueId: String(json.id),
      repo: `${args.owner}/${args.repo}`,
      number: json.number,
      title: json.title,
      state: json.state === "closed" ? "closed" : "open",
      authorLogin: json.user?.login,
      labels: json.labels?.map((l) => l.name),
      assignees: json.assignees?.map((a) => a.login),
      url: json.html_url,
    });

    return { number: json.number, url: json.html_url };
  }

  async createIssueComment(
    ctx: GenericActionCtx<GenericDataModel>,
    args: { owner: string; repo: string; issueNumber: number; body: string },
  ): Promise<{ url: string }> {
    const res = await fetch(
      `${GITHUB_API_BASE}/repos/${args.owner}/${args.repo}/issues/${args.issueNumber}/comments`,
      { method: "POST", headers: this.headers(), body: JSON.stringify({ body: args.body }) },
    );
    if (!res.ok) {
      throw new Error(`Failed to comment on GitHub issue: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { html_url: string };
    return { url: json.html_url };
  }

  async closeIssue(
    ctx: GenericActionCtx<GenericDataModel>,
    args: { owner: string; repo: string; issueNumber: number },
  ): Promise<void> {
    const res = await fetch(
      `${GITHUB_API_BASE}/repos/${args.owner}/${args.repo}/issues/${args.issueNumber}`,
      { method: "PATCH", headers: this.headers(), body: JSON.stringify({ state: "closed" }) },
    );
    if (!res.ok) {
      throw new Error(`Failed to close GitHub issue: ${res.status} ${await res.text()}`);
    }
    const json = (await res.json()) as { id: number };
    await ctx.runMutation(this.component.lib.updateIssueState, {
      issueId: String(json.id),
      state: "closed",
    });
  }

  async mergePullRequest(
    ctx: GenericActionCtx<GenericDataModel>,
    args: {
      owner: string;
      repo: string;
      pullNumber: number;
      mergeMethod?: "merge" | "squash" | "rebase";
    },
  ): Promise<void> {
    const res = await fetch(
      `${GITHUB_API_BASE}/repos/${args.owner}/${args.repo}/pulls/${args.pullNumber}/merge`,
      {
        method: "PUT",
        headers: this.headers(),
        body: JSON.stringify({ merge_method: args.mergeMethod ?? "merge" }),
      },
    );
    if (!res.ok) {
      throw new Error(`Failed to merge GitHub pull request: ${res.status} ${await res.text()}`);
    }
  }

  async getIssue(ctx: RunQueryCtx, args: { issueId: string }) {
    return await ctx.runQuery(this.component.lib.getIssue, args);
  }

  async listIssuesByRepo(ctx: RunQueryCtx, args: { repo: string; limit?: number }) {
    return await ctx.runQuery(this.component.lib.listIssuesByRepo, args);
  }

  async getPullRequest(ctx: RunQueryCtx, args: { pullRequestId: string }) {
    return await ctx.runQuery(this.component.lib.getPullRequest, args);
  }

  async listPullRequestsByRepo(ctx: RunQueryCtx, args: { repo: string; limit?: number }) {
    return await ctx.runQuery(this.component.lib.listPullRequestsByRepo, args);
  }
}

type RunQueryCtx = {
  runQuery: GenericActionCtx<GenericDataModel>["runQuery"];
};
