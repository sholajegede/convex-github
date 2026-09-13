import { useState } from "react";
import { Header, type Tab } from "./components/Header";
import { TopBanner } from "./components/TopBanner";
import { IssuesPanel } from "./components/IssuesPanel";
import { PullRequestsPanel } from "./components/PullRequestsPanel";
import { WebhooksPanel } from "./components/WebhooksPanel";
import { History } from "./components/History";
import { Console } from "./components/Console";
import "./theme.css";

export default function App() {
  const [tab, setTab] = useState<Tab>("issues");
  const [repo, setRepo] = useState("sholajegede/convex-github-scratch-repo");

  return (
    <div className="shell">
      <div className="main">
        <Header tab={tab} onTab={setTab} repo={repo} onRepo={setRepo} />
        <TopBanner />
        {tab === "issues" && <IssuesPanel repoFullName={repo} />}
        {tab === "pullRequests" && <PullRequestsPanel repoFullName={repo} />}
        {tab === "webhooks" && <WebhooksPanel />}
        {tab === "history" && <History />}
      </div>
      <Console />
    </div>
  );
}
