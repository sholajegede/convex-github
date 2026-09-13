import { useState } from "react";
import { Header, type Tab } from "./components/Header";
import { TopBanner } from "./components/TopBanner";
import { IssuesPanel } from "./components/IssuesPanel";
import { PullRequestsPanel } from "./components/PullRequestsPanel";
import { WebhooksPanel } from "./components/WebhooksPanel";
import { History } from "./components/History";
import { Console } from "./components/Console";
import "./theme.css";

const DEFAULT_REPO = "sholajegede/convex-github-scratch-repo";

export default function App() {
  const [tab, setTab] = useState<Tab>("issues");
  const [repos, setRepos] = useState<string[]>([DEFAULT_REPO]);
  const [repo, setRepo] = useState(DEFAULT_REPO);

  function addRepo(fullName: string) {
    setRepos((prev) => (prev.includes(fullName) ? prev : [...prev, fullName]));
    setRepo(fullName);
  }

  return (
    <div className="shell">
      <div className="main">
        <Header
          tab={tab}
          onTab={setTab}
          repo={repo}
          repos={repos}
          onSelectRepo={setRepo}
          onAddRepo={addRepo}
        />
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
