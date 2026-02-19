/**
 * Run Next.js build with increased Node heap so the process and workers don't OOM.
 * Fixes "JavaScript heap out of memory" during "Collecting page data" on Windows.
 *
 * Set NODE_MAX_OLD_SPACE_MB=8192 (default) or 16384 for more RAM. Workers inherit via NODE_OPTIONS.
 */
const { spawn } = require("child_process");
const path = require("path");

const maxOldSpaceMB = Number(process.env.NODE_MAX_OLD_SPACE_MB) || 16384;
// Force NODE_OPTIONS and NODE_MAX_OLD_SPACE_MB so main process and all workers get the same heap (fixes OOM on Windows)
const nodeOptions = `--max-old-space-size=${maxOldSpaceMB}`;
const env = { ...process.env, NODE_OPTIONS: nodeOptions, NODE_MAX_OLD_SPACE_MB: String(maxOldSpaceMB) };

const nextBin = path.join(__dirname, "..", "node_modules", "next", "dist", "bin", "next");
const child = spawn(process.execPath, ["--max-old-space-size=" + maxOldSpaceMB, nextBin, "build"], {
  env,
  stdio: "inherit",
  cwd: path.join(__dirname, ".."),
});

child.on("close", (code, signal) => {
  process.exit(code !== null ? code : signal ? 1 : 0);
});
