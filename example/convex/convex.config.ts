import { defineApp } from "convex/server";
import convexGithub from "../../src/component/convex.config.js";

const app = defineApp();
app.use(convexGithub);

export default app;
