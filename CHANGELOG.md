# Changelog

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
