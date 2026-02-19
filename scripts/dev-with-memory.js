/**
 * Run Next.js dev server with increased Node heap to avoid "JavaScript heap out of memory"
 * when compiling heavy pages (e.g. /high-school/physics/light).
 */
const { spawn } = require("child_process");
const path = require("path");

const maxOldSpaceMB = Number(process.env.NODE_MAX_OLD_SPACE_MB) || 6144;
const env = { ...process.env, NODE_OPTIONS: `--max-old-space-size=${maxOldSpaceMB}` };

const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
const port = process.env.PORT || process.argv[2] || "3000";
const host = process.env.HOST || process.argv[3] || "127.0.0.1";
// Use Turbopack if requested (avoids webpack/jest-worker crashes: --turbo)
const useTurbo = process.argv.includes("--turbo") || process.env.TURBO === "1";
const devArgs = ["dev", "-H", host, "-p", port];
if (useTurbo) devArgs.push("--turbo");

const child = spawn(
  process.execPath,
  ["--max-old-space-size=" + maxOldSpaceMB, nextBin, ...devArgs],
  { env, stdio: "inherit", cwd: path.join(__dirname, "..") }
);

child.on("close", (code, signal) => {
  process.exit(code !== null ? code : signal ? 1 : 0);
});
