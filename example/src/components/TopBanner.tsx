export function TopBanner() {
  return (
    <div className="banner">
      This example calls the real GitHub REST API using <code>GITHUB_TOKEN</code> (set via{" "}
      <code>npx convex env set</code>), and receives live webhook deliveries at{" "}
      <code>/webhooks/github</code>. Actions below make real changes on GitHub — use a scratch repo
      you don't mind editing.
    </div>
  );
}
