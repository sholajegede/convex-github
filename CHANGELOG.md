# Changelog

## 0.0.5

### Patch Changes

- Document that getStats scans all 3 tables to compute counts, which is O(n) in
  total rows rather than O(1)

## 0.0.4

### Patch Changes

- Drop the username scope from the Convex directory badge link in README,
  matching the directory's updated URL format

## 0.0.3

### Patch Changes

Fix `createIssue`, `createIssueComment`, `closeIssue`, and `mergePullRequest`
being typed as `ctx: GenericActionCtx<GenericDataModel>`, which only type-checks
when the calling app's schema is empty. Any real app with its own tables got a
compile error on every one of these calls. They now accept a minimal structural
ctx type instead, matching the pattern the query methods already used. The
example app's schema was also given a real table, so this class of bug shows up
in this repo's own typecheck from now on instead of only in a downstream app.

## 0.0.2

### Patch Changes

- Add demo screenshot to README

## 0.0.1

- Fix `mergePullRequest` leaving pull requests stuck on "open" locally after a
  real merge — it now patches Convex's copy immediately instead of waiting on
  the webhook.
- Add `getStats`, `listRecentIssues`, `listRecentPullRequests`, and
  `listRecentWebhookEvents` for cross-repo dashboard views.
- Rebuild the example app into a full demo: Issues, Pull Requests, Webhooks, and
  History tabs, a repo switcher with a "connect your own repo" field, and a
  sidebar Activity console.

## 0.0.0

- Initial release.
