# convex-github

Sync GitHub issues and pull requests into your Convex database reactively, and open issues, comment, and merge pull requests directly from Convex functions.

[![npm version](https://badge.fury.io/js/convex-github.svg)](https://badge.fury.io/js/convex-github)

<!-- START: Include on https://convex.dev/components -->

## What this does

`convex-github` gives your Convex app a live, queryable mirror of GitHub issues and pull requests for the repos you care about, kept up to date by GitHub webhooks, plus a small set of actions for driving GitHub from your own backend logic:

- **Reactive issue & PR tracking** — every `issues` and `pull_request` webhook event updates a Convex table, so `useQuery` in your React app re-renders the instant something changes on GitHub.
- **Open, comment, close, merge** — call `createIssue`, `createIssueComment`, `closeIssue`, and `mergePullRequest` from Convex actions using the GitHub REST API.
- **Idempotent by delivery ID** — every webhook delivery is recorded by its `X-GitHub-Delivery` ID, so retried deliveries (GitHub retries failed webhooks) never double-process.
- **Signature verified** — every inbound webhook is verified against `X-Hub-Signature-256` with a constant-time HMAC-SHA256 comparison before anything is written.

This is a [Convex component](https://convex.dev/components): its `issues`, `pullRequests`, and `webhookEvents` tables live in an isolated schema, not your app's schema, and are only reachable through the functions this component exposes.

## Table of Contents

- [Install](#install)
- [Quick Start](#quick-start)
- [Setup](#setup)
- [Usage](#usage)
- [API Reference](#api-reference)
- [Type Reference](#type-reference)
- [Webhook Events](#webhook-events)
- [Database Schema](#database-schema)
- [Example App](#example-app)
- [Testing](#testing)
- [Limitations](#limitations)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [Changelog](#changelog)

## Install

```sh
npm install convex-github
```

## Quick Start

### 1. Add the component

```ts
// convex/convex.config.ts
import { defineApp } from "convex/server";
import convexGithub from "convex-github/convex.config";

const app = defineApp();
app.use(convexGithub);

export default app;
```

### 2. Set environment variables

```sh
npx convex env set GITHUB_TOKEN ghp_...
npx convex env set GITHUB_WEBHOOK_SECRET whsec_...
```

`GITHUB_TOKEN` is a personal access token, a fine-grained token, or a GitHub App installation token with `issues` and `pull_requests` scopes on the repos you want to manage. `GITHUB_WEBHOOK_SECRET` is the secret you set on the webhook in step 4.

### 3. Mount the webhook handler

```ts
// convex/http.ts
import { httpRouter } from "convex/server";
import { components } from "./_generated/api";
import { GitHub } from "convex-github";

const github = new GitHub(components.convexGithub, {
  token: process.env.GITHUB_TOKEN!,
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET!,
});

const http = httpRouter();

http.route({
  path: "/webhooks/github",
  method: "POST",
  handler: github.webhookHandler,
});

export default http;
```

### 4. Register the webhook in GitHub

In your repo (or organization) settings, add a webhook pointing at `https://<your-deployment>.convex.site/webhooks/github`, content type `application/json`, with the same secret as `GITHUB_WEBHOOK_SECRET`. Subscribe to the **Issues** and **Pull requests** events.

### 5. Initialize the client

```ts
// convex/example.ts
import { action, query } from "./_generated/server";
import { components } from "./_generated/api";
import { GitHub } from "convex-github";
import { v } from "convex/values";

const github = new GitHub(components.convexGithub, {
  token: process.env.GITHUB_TOKEN!,
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET!,
});

export const listIssuesByRepo = query({
  args: { repo: v.string() },
  handler: async (ctx, args) => {
    return await github.listIssuesByRepo(ctx, args);
  },
});
```

## Setup

The component needs no schema changes in your app — its tables (`issues`, `pullRequests`, `webhookEvents`) live entirely inside the component's own isolated schema. All you need is the webhook mounted (step 3 above) and a `GitHub` client instance wherever you call its methods.

Repos are identified throughout by their `"owner/repo"` full name (e.g. `"sholajegede/the-convex-reactor"`), matching GitHub's own `repository.full_name` field, so there's no separate repo-registration step — the first webhook event or `createIssue` call for a repo is enough for it to start showing up in queries.

## Usage

### Create an issue

```ts
export const fileIssue = action({
  args: { owner: v.string(), repo: v.string(), title: v.string(), body: v.optional(v.string()) },
  handler: async (ctx, args) => {
    return await github.createIssue(ctx, args);
  },
});
```

Returns `{ number, url }` and immediately records the issue in Convex — you don't have to wait for the webhook round-trip to see it in a query.

### Comment on an issue

```ts
export const comment = action({
  args: { owner: v.string(), repo: v.string(), issueNumber: v.number(), body: v.string() },
  handler: async (ctx, args) => {
    return await github.createIssueComment(ctx, args);
  },
});
```

### Close an issue

```ts
export const resolveIssue = action({
  args: { owner: v.string(), repo: v.string(), issueNumber: v.number() },
  handler: async (ctx, args) => {
    await github.closeIssue(ctx, args);
    return null;
  },
});
```

`closeIssue` only patches the issue's `state` in Convex — it never overwrites the issue's stored `title`, `labels`, or `url` with stale data, so it's safe to call even if your local copy of those fields is out of date.

### Merge a pull request

```ts
export const merge = action({
  args: { owner: v.string(), repo: v.string(), pullNumber: v.number() },
  handler: async (ctx, args) => {
    await github.mergePullRequest(ctx, args);
    return null;
  },
});
```

Pass `mergeMethod: "merge" | "squash" | "rebase"` to control the merge strategy (defaults to `"merge"`). `mergePullRequest` looks the pull request up first to get its id (GitHub's merge response doesn't include it), merges it, then immediately patches its `merged` and `state` fields in Convex — like `closeIssue`, it doesn't wait for the `pull_request` webhook to arrive.

### Read issues and pull requests reactively

```tsx
const issues = useQuery(api.example.listIssuesByRepo, { repo: "sholajegede/the-convex-reactor" });
```

Every `issues` and `pull_request` webhook event patches or inserts a row, so this query re-renders live as issues are opened, labeled, assigned, or closed on GitHub — no polling.

## API Reference

### Actions (need `ctx` from an action)

| Method | Description |
| --- | --- |
| `createIssue(ctx, { owner, repo, title, body?, labels?, assignees? })` | Opens a new issue via the REST API and records it. Returns `{ number, url }`. |
| `createIssueComment(ctx, { owner, repo, issueNumber, body })` | Posts a comment on an issue or PR. Returns `{ url }`. |
| `closeIssue(ctx, { owner, repo, issueNumber })` | Closes an issue on GitHub and patches its stored `state`. |
| `mergePullRequest(ctx, { owner, repo, pullNumber, mergeMethod? })` | Merges a pull request via the REST API. |

### Queries (work from actions, queries, or mutations)

| Method | Description |
| --- | --- |
| `getIssue(ctx, { issueId })` | Fetch one issue by its GitHub numeric ID (as a string). |
| `listIssuesByRepo(ctx, { repo, limit? })` | Most recently updated issues for a repo, newest first. |
| `getPullRequest(ctx, { pullRequestId })` | Fetch one pull request by its GitHub numeric ID (as a string). |
| `listPullRequestsByRepo(ctx, { repo, limit? })` | Most recently updated pull requests for a repo, newest first. |
| `getStats(ctx)` | Counts of issues, pull requests, and webhook deliveries recorded so far. |
| `listRecentIssues(ctx, { limit? })` | Most recently updated issues across every repo, newest first. |
| `listRecentPullRequests(ctx, { limit? })` | Most recently updated pull requests across every repo, newest first. |
| `listRecentWebhookEvents(ctx, { limit? })` | Most recent raw webhook deliveries across every repo, newest first. |

### Webhook

| Property | Description |
| --- | --- |
| `webhookHandler` | An `httpAction` that verifies, deduplicates, and processes `issues` and `pull_request` webhook deliveries. Mount it at any route. |

## Type Reference

```ts
type GitHubOptions = {
  token: string;         // personal access token, fine-grained token, or GitHub App installation token
  webhookSecret: string; // the secret configured on the GitHub webhook
};

type CreateIssueArgs = {
  owner: string;
  repo: string;
  title: string;
  body?: string;
  labels?: string[];
  assignees?: string[];
};

type Issue = {
  issueId: string;       // GitHub's numeric issue id, as a string
  repo: string;          // "owner/repo"
  number: number;
  title: string;
  state: "open" | "closed";
  authorLogin?: string;
  labels?: string[];
  assignees?: string[];
  url: string;
  createdAt: number;
  updatedAt: number;
};

type PullRequest = {
  pullRequestId: string; // GitHub's numeric PR id, as a string
  repo: string;
  number: number;
  title: string;
  state: "open" | "closed";
  merged: boolean;
  authorLogin?: string;
  headRef?: string;
  baseRef?: string;
  url: string;
  createdAt: number;
  updatedAt: number;
};
```

## Webhook Events

The webhook handler subscribes to two GitHub event types (set these when creating the webhook):

- **`issues`** — any action (`opened`, `edited`, `labeled`, `assigned`, `closed`, `reopened`, ...) upserts the issue's current state into the `issues` table.
- **`pull_request`** — any action (`opened`, `edited`, `closed`, `reopened`, `synchronize`, ...) upserts the pull request's current state into the `pullRequests` table, including `merged`.

Every delivery is checked against `X-Hub-Signature-256` (HMAC-SHA256 of the raw request body, hex-encoded, prefixed `sha256=`) with a constant-time comparison, and deduplicated by `X-GitHub-Delivery` before any table write — GitHub's automatic webhook retries on timeout or 5xx are safe to receive twice.

Other event types (`push`, `star`, `release`, etc.) are accepted by the route but ignored after signature verification and idempotency recording, so you can subscribe to more events later without needing a new endpoint.

## Database Schema

```ts
issues: {
  issueId: string;      // indexed: by_issueId
  repo: string;         // indexed: by_repo
  number: number;
  title: string;
  state: "open" | "closed";
  authorLogin?: string;
  labels?: string[];
  assignees?: string[];
  url: string;
  createdAt: number;
  updatedAt: number;
}

pullRequests: {
  pullRequestId: string; // indexed: by_pullRequestId
  repo: string;          // indexed: by_repo
  number: number;
  title: string;
  state: "open" | "closed";
  merged: boolean;
  authorLogin?: string;
  headRef?: string;
  baseRef?: string;
  url: string;
  createdAt: number;
  updatedAt: number;
}

webhookEvents: {
  eventId: string;   // indexed: by_eventId — GitHub's X-GitHub-Delivery
  eventType: string; // X-GitHub-Event
  repo?: string;
  payload: string;   // raw JSON body, for auditing/replay
  receivedAt: number;
}
```

This schema lives entirely inside the component's isolated namespace — it will never collide with tables in your app's own `convex/schema.ts`. `getStats`, `listRecentIssues`, `listRecentPullRequests`, and `listRecentWebhookEvents` scan across every repo to power a dashboard-style view — they're not indexed by repo, so they're meant for demos and internal tooling, not high-volume production use.

## Customer IDs

Issues and pull requests are keyed by GitHub's own numeric `id` field (converted to a string), not by `number` — `number` is only unique within a single repo, while `id` is globally unique and stable even if a repo is renamed or transferred. Always look issues and pull requests up by `repo` + `number` for UI purposes, but store and index on `issueId`/`pullRequestId`.

## Example App

The `example/` app is a full interactive demo, not just a form:

- **Issues** — open an issue (with suggestion chips), comment on it, and close it, all reactively reflected below.
- **Pull Requests** — merge an open pull request with your choice of merge method; Convex's copy updates immediately, it doesn't wait for the webhook.
- **Webhooks** — a live, expandable feed of every raw delivery to `/webhooks/github`, across every repo, so you can watch signature verification and deduplication happen in real time.
- **History** — every issue and pull request this component has ever recorded, newest first, across every repo, with a one-click "open follow-up issue" action.
- A repo switcher to flip between a few example repos, and a sidebar **Activity** console logging every action call this demo makes, with its result or error.

Run it from the repo root (not `example/`):

```sh
npm install --legacy-peer-deps
npx convex env set GITHUB_TOKEN ghp_...
npx convex env set GITHUB_WEBHOOK_SECRET whsec_...
npm run dev
```

Then register a webhook on a scratch repo pointed at `https://<your-dev-deployment>.convex.site/webhooks/github` (see [Quick Start](#quick-start)) to see live deliveries land in the Webhooks tab.

## Testing

```sh
npm run test
npm run typecheck
```

Tests use [`convex-test`](https://www.npmjs.com/package/convex-test) and cover `recordIssue`/`recordPullRequest` upsert behavior (including that `closeIssue`'s `updateIssueState` path never blanks out an issue's `title` or `url`), `updatePullRequestState` marking a PR merged without touching its title, `listIssuesByRepo`/`listPullRequestsByRepo` scoping by repo, webhook idempotency via `checkAndRecordEvent`, and the cross-repo `getStats`/`listRecentIssues`/`listRecentPullRequests`/`listRecentWebhookEvents` queries.

## Limitations

- Only `issues` and `pull_request` webhook events are processed; review, check-run, and deployment events are out of scope for this component.
- `createIssue`/`createIssueComment`/`closeIssue`/`mergePullRequest` use the REST API (`api.github.com`), not GraphQL — for GraphQL-only features (e.g. Projects v2 fields) you'll need to call the GitHub GraphQL API directly.
- The component does not manage webhook registration for you — you create the webhook once in GitHub's UI or via the REST API yourself.
- Rate limits are GitHub's own (5,000 requests/hour for most tokens, higher for GitHub Apps) — this component does not implement its own rate limiting or backoff.

## Troubleshooting

**Webhook returns 401** — the signature didn't match. Double check `GITHUB_WEBHOOK_SECRET` matches exactly what's configured on the GitHub webhook (not your `GITHUB_TOKEN`), and that GitHub is set to send `application/json`, not `application/x-www-form-urlencoded`.

**Issues never appear in queries** — confirm the webhook's "Recent Deliveries" tab in GitHub shows a `200` response, and that the webhook is subscribed to the **Issues** and **Pull requests** events specifically (not just "Just the push event").

**`closeIssue` throws a 404** — the issue number must belong to the same `owner/repo` the token has access to; fine-grained tokens scoped to a different repo will fail here even if the issue ID exists in your Convex table from a webhook on another repo.

**`mergePullRequest` throws a 404 before merging anything** — that's the id lookup (`GET .../pulls/{pullNumber}`) that runs first, not the merge itself; same cause and fix as the `closeIssue` 404 above.

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## Changelog

See [CHANGELOG.md](./CHANGELOG.md).

<!-- END: Include on https://convex.dev/components -->
