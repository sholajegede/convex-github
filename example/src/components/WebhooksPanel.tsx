import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Card, Badge, Empty } from "./ui";
import { relativeTime } from "../lib/format";

const EVENT_TONE: Record<string, "good" | "neutral" | "bad"> = {
  issues: "good",
  pull_request: "neutral",
};

export function WebhooksPanel() {
  const events = useQuery(api.example.listRecentWebhookEvents, { limit: 30 });
  const [open, setOpen] = useState<Set<string>>(new Set());

  function toggle(id: string) {
    setOpen((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Card
      title="Recent webhook deliveries"
      desc="Every delivery to /webhooks/github, across every repo — signature-verified and deduplicated by X-GitHub-Delivery before anything else runs. Register the webhook on your repo (Settings → Webhooks) pointed at this deployment's .convex.site URL to see deliveries land here live."
    >
      {events === undefined && <Empty>Loading…</Empty>}
      {events && events.length === 0 && (
        <Empty>No deliveries yet — open or edit an issue or pull request on a repo whose webhook points here.</Empty>
      )}
      {events && events.length > 0 && (
        <ul className="obs-list">
          {events.map((event) => (
            <li key={event._id} className="obs-item">
              <div className="obs-top" onClick={() => toggle(event._id)} style={{ cursor: "pointer" }}>
                <span>
                  <Badge tone={EVENT_TONE[event.eventType] ?? "neutral"}>{event.eventType}</Badge>{" "}
                  {event.repo ?? "(no repo)"}
                </span>
                <span className="mono">{relativeTime(event.receivedAt)}</span>
              </div>
              {open.has(event._id) && (
                <pre className="obs-io">{formatPayload(event.payload)}</pre>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}

function formatPayload(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2).slice(0, 2000);
  } catch {
    return raw.slice(0, 2000);
  }
}
