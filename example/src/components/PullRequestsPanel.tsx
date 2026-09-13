import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Select, Button, Badge, Empty } from "./ui";
import { withLog } from "../lib/logStore";

function ownerRepo(full: string): { owner: string; repo: string } {
  const [owner, repo] = full.split("/");
  return { owner: owner ?? "", repo: repo ?? "" };
}

type MergeMethod = "merge" | "squash" | "rebase";

export function PullRequestsPanel(props: { repoFullName: string }) {
  const { owner, repo } = ownerRepo(props.repoFullName);
  const [mergeMethod, setMergeMethod] = useState<MergeMethod>("merge");

  const mergePullRequest = useAction(api.example.mergePullRequest);
  const pullRequests = useQuery(
    api.example.listPullRequestsByRepo,
    repo ? { repo: props.repoFullName } : "skip",
  );

  return (
    <Card
      title={`Pull requests in ${props.repoFullName}`}
      desc="Merging fetches the PR's id first, then patches Convex's copy immediately — it doesn't wait for the webhook."
    >
      <div className="row" style={{ marginBottom: "0.85rem" }}>
        <label className="merge-method-label">
          Merge method
          <Select value={mergeMethod} onChange={(e) => setMergeMethod(e.target.value as MergeMethod)}>
            <option value="merge">merge</option>
            <option value="squash">squash</option>
            <option value="rebase">rebase</option>
          </Select>
        </label>
      </div>

      {pullRequests === undefined && <Empty>Loading…</Empty>}
      {pullRequests && pullRequests.length === 0 && (
        <Empty>
          No pull requests yet — open one on GitHub (or via the API) against{" "}
          {props.repoFullName || "this repo"} and it'll show up here once the webhook fires.
        </Empty>
      )}
      {pullRequests && pullRequests.length > 0 && (
        <ul className="issue-list">
          {pullRequests.map((pr) => (
            <li key={pr._id} className="issue-item">
              <div className="issue-top">
                <a href={pr.url} target="_blank" rel="noreferrer" className="issue-title">
                  #{pr.number} {pr.title}
                </a>
                <Badge tone={pr.merged ? "merged" : pr.state === "open" ? "good" : "neutral"}>
                  {pr.merged ? "merged" : pr.state}
                </Badge>
              </div>
              <div className="issue-meta">
                {pr.authorLogin && <span>by {pr.authorLogin}</span>}
                {pr.headRef && pr.baseRef && (
                  <span className="mono">
                    {pr.headRef} → {pr.baseRef}
                  </span>
                )}
              </div>
              {pr.state === "open" && !pr.merged && (
                <div className="issue-actions">
                  <Button
                    onClick={() =>
                      withLog(`mergePullRequest #${pr.number} (${mergeMethod})`, () =>
                        mergePullRequest({ owner, repo, pullNumber: pr.number, mergeMethod }),
                      )
                    }
                  >
                    Merge #{pr.number}
                  </Button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
