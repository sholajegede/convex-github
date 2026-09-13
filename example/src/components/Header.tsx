import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Corners, Chip } from "./ui";

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

const DEMO_REPOS = [
  "sholajegede/convex-github-scratch-repo",
  "sholajegede/the-convex-reactor",
  "convex-dev/convex-backend",
];

export function Header(props: {
  tab: Tab;
  onTab: (t: Tab) => void;
  repo: string;
  onRepo: (repo: string) => void;
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
        {DEMO_REPOS.map((r) => (
          <Chip key={r} active={props.repo === r} onClick={() => props.onRepo(r)}>
            {r}
          </Chip>
        ))}
      </div>
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
