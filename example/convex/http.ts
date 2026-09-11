import { httpRouter } from "convex/server";
import { components } from "./_generated/api";
import { GitHub } from "../../src/client/index.js";

const github = new GitHub(components.convexGithub, {
  token: process.env.GITHUB_TOKEN!,
  webhookSecret: process.env.GITHUB_WEBHOOK_SECRET!,
});

const http = httpRouter();

http.route({
  path: "/webhooks/github",
  method: "POST",
  handler: github.webhookHandler,
});

export default http;
