import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Corners, Chip, TextInput, Button } from "./ui";

export type Tab = "issues" | "pullRequests" | "webhooks" | "history";

function FlowDiagram() {
  return (
    <div>
      <div
        className="flow"
        aria-label="your app talks to Convex, which talks to GitHub over REST and webhooks, and mirrors state back reactively"
      >
        <span className="flow-node">your app</span>
        <span className="flow-arrow">⇄</span>
        <span className="flow-node hub">Convex</span>
        <span className="flow-arrow">⇄</span>
        <span className="flow-node accent">GitHub</span>
      </div>
      <p className="flow-caption">
        createIssue / closeIssue / mergePullRequest run as Convex actions that call the GitHub REST
        API — GitHub's own webhooks call back into Convex, which mirrors issues and pull requests
        into reactive tables. Your app never talks to GitHub directly.
      </p>
    </div>
  );
}

function ConnectRepo(props: { onConnect: (repo: string) => void }) {
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  function submit() {
    const trimmed = value.trim().replace(/^https?:\/\/github\.com\//, "").replace(/\/$/, "");
    const parts = trimmed.split("/");
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      setError("Enter it as owner/repo, e.g. octocat/hello-world");
      return;
    }
    setError(null);
    props.onConnect(trimmed);
    setValue("");
  }

  return (
    <div className="connect-repo">
      <TextInput
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="owner/repo — connect any throwaway repo of your own"
      />
      <Button variant="secondary" onClick={submit} disabled={!value.trim()}>
        Connect
      </Button>
      {error && <p className="error-text">{error}</p>}
    </div>
  );
}

export function Header(props: {
  tab: Tab;
  onTab: (t: Tab) => void;
  repo: string;
  repos: string[];
  onSelectRepo: (repo: string) => void;
  onAddRepo: (repo: string) => void;
}) {
  const stats = useQuery(api.example.getStats);

  return (
    <div className="hero-frame">
      <Corners />
      <div className="hero-stats">
        <span>
          <strong>{stats?.issues ?? "…"}</strong> issues
        </span>
        <span className="dot">·</span>
        <span>
          <strong>{stats?.pullRequests ?? "…"}</strong> pull requests
        </span>
        <span className="dot">·</span>
        <span>
          <strong>{stats?.webhookEvents ?? "…"}</strong> webhook deliveries
        </span>
      </div>
      <div className="hero-divider" />
      <div className="hero-main">
        <div className="wordmark">
          <span className="logo-mark">gh</span>
          convex-github
        </div>
        <h1 className="hero-title">
          Sync <span className="hl">GitHub</span> into Convex, reactively
        </h1>
        <p className="hero-sub">
          Issues and pull requests mirrored live by webhook, and driven from Convex actions —
          open, comment, close, and merge without leaving your backend.
        </p>
        <FlowDiagram />
      </div>
      <div className="hero-stripe" />
      <div className="repo-switch">
        {props.repos.map((r) => (
          <Chip key={r} active={props.repo === r} onClick={() => props.onSelectRepo(r)}>
            {r}
          </Chip>
        ))}
      </div>
      <ConnectRepo onConnect={props.onAddRepo} />
      <nav className="tabs">
        <button className={`tab${props.tab === "issues" ? " active" : ""}`} onClick={() => props.onTab("issues")}>
          Issues
        </button>
        <button
          className={`tab${props.tab === "pullRequests" ? " active" : ""}`}
          onClick={() => props.onTab("pullRequests")}
        >
          Pull Requests
        </button>
        <button
          className={`tab${props.tab === "webhooks" ? " active" : ""}`}
          onClick={() => props.onTab("webhooks")}
        >
          Webhooks
        </button>
        <button
          className={`tab${props.tab === "history" ? " active" : ""}`}
          onClick={() => props.onTab("history")}
        >
          History
        </button>
      </nav>
    </div>
  );
}
