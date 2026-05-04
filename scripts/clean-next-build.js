const { rmSync } = require("fs");
const { resolve } = require("path");

const projectRoot = resolve(__dirname, "..");
const nextBuildDir = resolve(projectRoot, ".next");

if (!nextBuildDir.startsWith(projectRoot)) {
  throw new Error("Refusing to clean a path outside the project.");
}

rmSync(nextBuildDir, { recursive: true, force: true });
console.log("Cleaned .next build output.");
