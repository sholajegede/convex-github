import { useState } from "react";
import { useAction, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import "./App.css";

export default function App() {
  const [owner, setOwner] = useState("");
  const [repo, setRepo] = useState("");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [createdUrl, setCreatedUrl] = useState<string | null>(null);

  const createIssue = useAction(api.example.createIssue);
  const issues = useQuery(
    api.example.listIssuesByRepo,
    owner && repo ? { repo: `${owner}/${repo}` } : "skip",
  );

  async function submit() {
    const result = await createIssue({
      owner,
      repo,
      title,
      body: body || undefined,
    });
    setCreatedUrl(result.url);
    setTitle("");
    setBody("");
  }

  return (
    <main className="app">
      <h1>convex-github</h1>
      <p>
        Sync GitHub issues and pull requests into Convex reactively, and open
        issues from Convex functions.
      </p>

      <label>
        Owner
        <input
          value={owner}
          onChange={(e) => setOwner(e.target.value)}
          placeholder="my-org"
        />
      </label>

      <label>
        Repo
        <input
          value={repo}
          onChange={(e) => setRepo(e.target.value)}
          placeholder="my-repo"
        />
      </label>

      <label>
        Title
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Something is broken"
        />
      </label>

      <label>
        Body
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Steps to reproduce..."
        />
      </label>

      <button onClick={submit} disabled={!owner || !repo || !title}>
        Create issue
      </button>

      {createdUrl && (
        <p>
          Created:{" "}
          <a href={createdUrl} target="_blank" rel="noreferrer">
            {createdUrl}
          </a>
        </p>
      )}

      {issues && issues.length > 0 && (
        <ul>
          {issues.map((issue) => (
            <li key={issue._id}>
              #{issue.number} {issue.title} — <strong>{issue.state}</strong>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
