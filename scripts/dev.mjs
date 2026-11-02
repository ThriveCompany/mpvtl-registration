import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { assertNoDotenv, developmentEnvironment } from "./dev-safety.mjs";

const root = new URL("../", import.meta.url);
const env = developmentEnvironment(process.env);
assertNoDotenv(root);

function run(executable, args) {
  const result = spawnSync(executable, args, { cwd: fileURLToPath(root), env, stdio: "inherit" });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status || 1);
}
function node(relative, args = []) {
  run(process.execPath, [fileURLToPath(new URL(relative, root)), ...args]);
}
function compose(args) {
  const context = spawnSync("docker", ["context", "inspect", "--format", "{{json .Endpoints.docker.Host}}"], {
    cwd: fileURLToPath(root), env, encoding: "utf8",
  });
  if (context.error) throw context.error;
  if (context.status !== 0) throw new Error("Cannot inspect the Docker context");
  const endpoint = JSON.parse(context.stdout.trim());
  if (!endpoint.startsWith("npipe://") && !endpoint.startsWith("unix://")) {
    throw new Error("Refusing a nonlocal Docker context");
  }
  run("docker", ["compose", "--project-name", "mpvtl-wo03-synthetic", "--file", "compose.dev.yaml", ...args]);
}

switch (process.argv[2]) {
  case "db:up": compose(["up", "-d", "--wait"]); break;
  case "db:down": compose(["down"]); break;
  case "generate": node("node_modules/prisma/build/index.js", ["generate"]); break;
  case "prepare":
    node("node_modules/prisma/build/index.js", ["generate"]);
    // Local disposable schema only: never use the staff seed or production migrations.
    node("node_modules/prisma/build/index.js", ["db", "push", "--skip-generate"]);
    node("scripts/seed-synthetic.mjs");
    break;
  case "start": node("node_modules/next/dist/bin/next", ["dev", "--hostname", "127.0.0.1", "--port", "3001"]); break;
  case "typecheck":
    node("node_modules/next/dist/bin/next", ["typegen"]);
    node("node_modules/typescript/bin/tsc", ["--noEmit", "--incremental", "false"]);
    break;
  default: throw new Error("Expected db:up, db:down, generate, prepare, start or typecheck");
}
