import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "../../src/component/schema.js";

const modules = import.meta.glob("./**/*.ts");
const componentModules = import.meta.glob("../../src/component/**/*.ts");

function initConvexTest() {
  const t = convexTest(schema, modules);
  t.registerComponent("convexGithub", schema, componentModules);
  return t;
}

test("getIssue returns null for unknown issue", async () => {
  const t = initConvexTest();
  const result = await t.query(api.example.getIssue, {
    issueId: "unknown_issue",
  });
  expect(result).toBe(null);
});

test("listIssuesByRepo returns empty array for unknown repo", async () => {
  const t = initConvexTest();
  const result = await t.query(api.example.listIssuesByRepo, {
    repo: "org/unknown-repo",
  });
  expect(result).toEqual([]);
});
