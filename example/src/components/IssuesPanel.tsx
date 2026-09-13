import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Field, TextInput, TextArea, Button, Badge, Chip, Empty } from "./ui";
import { withLog } from "../lib/logStore";
import { truncate } from "../lib/format";

const SUGGESTIONS = [
  { title: "Docs: clarify webhook setup", body: "The README could use a diagram for step 4." },
  { title: "Bug: closeIssue 404s on wrong repo", body: "Repro steps, expected vs actual." },
  { title: "Feature request: GraphQL support", body: "Would like Projects v2 field support." },
];

function ownerRepo(full: string): { owner: string; repo: string } {
  const [owner, repo] = full.split("/");
  return { owner: owner ?? "", repo: repo ?? "" };
}

export function IssuesPanel(props: { repoFullName: string }) {
  const { owner, repo } = ownerRepo(props.repoFullName);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});

  const createIssue = useAction(api.example.createIssue);
  const createIssueComment = useAction(api.example.createIssueComment);
  const closeIssue = useAction(api.example.closeIssue);

  const issues = useQuery(api.example.listIssuesByRepo, repo ? { repo: props.repoFullName } : "skip");

  async function submit() {
    if (!owner || !repo || !title) return;
    await withLog(`createIssue: ${title}`, () =>
      createIssue({ owner, repo, title, body: body || undefined }),
    );
    setTitle("");
    setBody("");
  }

  return (
    <>
      <Card title="Open an issue" desc="Calls the GitHub REST API and records it in Convex immediately — no webhook round-trip needed to see it below.">
        <div className="chip-row">
          {SUGGESTIONS.map((s) => (
            <Chip key={s.title} onClick={() => { setTitle(s.title); setBody(s.body); }}>
              {s.title}
            </Chip>
          ))}
        </div>
        <Field label="Title">
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Something is broken" />
        </Field>
        <Field label="Body">
          <TextArea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Steps to reproduce..." />
        </Field>
        <Button onClick={submit} disabled={!owner || !repo || !title}>
          Create issue on {props.repoFullName || "…"}
        </Button>
      </Card>

      <Card title={`Issues in ${props.repoFullName}`} desc="Reactive — updates the instant a webhook or action changes something.">
        {issues === undefined && <Empty>Loading…</Empty>}
        {issues && issues.length === 0 && <Empty>No issues yet. Create one above.</Empty>}
        {issues && issues.length > 0 && (
          <ul className="issue-list">
            {issues.map((issue) => (
              <li key={issue._id} className="issue-item">
                <div className="issue-top">
                  <a href={issue.url} target="_blank" rel="noreferrer" className="issue-title">
                    #{issue.number} {issue.title}
                  </a>
                  <Badge tone={issue.state === "open" ? "good" : "neutral"}>{issue.state}</Badge>
                </div>
                <div className="issue-meta">
                  {issue.authorLogin && <span>by {issue.authorLogin}</span>}
                  {issue.labels && issue.labels.length > 0 && <span>{issue.labels.join(", ")}</span>}
                </div>
                <div className="issue-actions">
                  <TextInput
                    placeholder="Add a comment…"
                    value={commentDrafts[issue.issueId] ?? ""}
                    onChange={(e) =>
                      setCommentDrafts((d) => ({ ...d, [issue.issueId]: e.target.value }))
                    }
                  />
                  <Button
                    variant="secondary"
                    disabled={!commentDrafts[issue.issueId]}
                    onClick={async () => {
                      const draft = commentDrafts[issue.issueId];
                      await withLog(`comment on #${issue.number}: ${truncate(draft, 40)}`, () =>
                        createIssueComment({ owner, repo, issueNumber: issue.number, body: draft }),
                      );
                      setCommentDrafts((d) => ({ ...d, [issue.issueId]: "" }));
                    }}
                  >
                    Comment
                  </Button>
                  {issue.state === "open" && (
                    <Button
                      variant="danger"
                      onClick={() =>
                        withLog(`closeIssue #${issue.number}`, () =>
                          closeIssue({ owner, repo, issueNumber: issue.number }),
                        )
                      }
                    >
                      Close
                    </Button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </>
  );
}
