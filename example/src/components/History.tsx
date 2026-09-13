import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Badge, Empty, Button } from "./ui";
import { relativeTime } from "../lib/format";
import { withLog } from "../lib/logStore";

type HistoryRow =
  | {
      kind: "issue";
      key: string;
      repo: string;
      number: number;
      title: string;
      state: "open" | "closed";
      url: string;
      updatedAt: number;
      authorLogin?: string;
    }
  | {
      kind: "pullRequest";
      key: string;
      repo: string;
      number: number;
      title: string;
      state: "open" | "closed";
      merged: boolean;
      url: string;
      updatedAt: number;
      authorLogin?: string;
    };

export function History() {
  const issues = useQuery(api.example.listRecentIssues, { limit: 30 });
  const pullRequests = useQuery(api.example.listRecentPullRequests, { limit: 30 });
  const createIssue = useAction(api.example.createIssue);
  const [open, setOpen] = useState<Set<string>>(new Set());

  if (issues === undefined || pullRequests === undefined) {
    return (
      <Card title="History" desc="Every issue and pull request this component has ever recorded, across all repos.">
        <Empty>Loading…</Empty>
      </Card>
    );
  }

  const rows: HistoryRow[] = [
    ...issues.map((i) => ({
      kind: "issue" as const,
      key: `issue:${i._id}`,
      repo: i.repo,
      number: i.number,
      title: i.title,
      state: i.state,
      url: i.url,
      updatedAt: i.updatedAt,
      authorLogin: i.authorLogin,
    })),
    ...pullRequests.map((p) => ({
      kind: "pullRequest" as const,
      key: `pr:${p._id}`,
      repo: p.repo,
      number: p.number,
      title: p.title,
      state: p.state,
      merged: p.merged,
      url: p.url,
      updatedAt: p.updatedAt,
      authorLogin: p.authorLogin,
    })),
  ].sort((a, b) => b.updatedAt - a.updatedAt);

  function toggle(key: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  return (
    <Card
      title="History"
      desc="Every issue and pull request this component has ever recorded, newest first, across every repo — independent of whichever repo is selected above."
    >
      {rows.length === 0 && <Empty>Nothing recorded yet.</Empty>}
      {rows.length > 0 && (
        <ul className="obs-list">
          {rows.map((row) => (
            <li key={row.key} className="obs-item">
              <div className="obs-top" onClick={() => toggle(row.key)} style={{ cursor: "pointer" }}>
                <span>
                  <Badge tone={row.kind === "issue" ? "neutral" : "merged"}>
                    {row.kind === "issue" ? "issue" : "pull request"}
                  </Badge>{" "}
                  {row.repo}#{row.number}
                </span>
                <span className="mono">{relativeTime(row.updatedAt)}</span>
              </div>
              {open.has(row.key) && (
                <div className="obs-io">
                  <div>{row.title}</div>
                  <div>
                    state: {row.kind === "pullRequest" && row.merged ? "merged" : row.state}
                    {row.authorLogin ? ` · by ${row.authorLogin}` : ""}
                  </div>
                  <div>
                    <a href={row.url} target="_blank" rel="noreferrer">
                      {row.url}
                    </a>
                  </div>
                  {row.kind === "issue" && (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        const [owner, repo] = row.repo.split("/");
                        return withLog(`recreate as follow-up: ${row.title}`, () =>
                          createIssue({
                            owner,
                            repo,
                            title: `Follow-up: ${row.title}`,
                            body: `Opened from the History tab as a follow-up to #${row.number}.`,
                          }),
                        );
                      }}
                    >
                      🔁 Open follow-up issue
                    </Button>
                  )}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
