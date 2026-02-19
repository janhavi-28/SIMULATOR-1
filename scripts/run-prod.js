/**
 * Run production build and server with NODE_OPTIONS set from the root process
 * so all child and worker processes inherit the heap limit (avoids OOM on Windows).
 */
const { spawnSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const maxMB = Number(process.env.NODE_MAX_OLD_SPACE_MB) || 16384;
const env = { ...process.env, NODE_OPTIONS: `--max-old-space-size=${maxMB}`, NODE_MAX_OLD_SPACE_MB: String(maxMB) };

console.log("Building with NODE_OPTIONS=--max-old-space-size=" + maxMB + "\n");

const build = spawnSync(
  process.execPath,
  [path.join(__dirname, "build-with-memory.js")],
  { env, stdio: "inherit", cwd: root }
);

if (build.status !== 0) {
  process.exit(build.status || 1);
}

const port = process.env.PORT || "3001";
// Use 127.0.0.1 on Windows so browser connects via IPv4 (localhost can resolve to ::1 and fail)
const host = process.env.HOST || "127.0.0.1";
console.log("\nStarting production server:");
console.log("  Server:  http://" + host + ":" + port);
console.log("  (Also try: http://localhost:" + port + ")\n");

const start = spawnSync("npx", ["next", "start", "-p", port, "--hostname", host], {
  env,
  stdio: "inherit",
  cwd: root,
});

if (start.status !== 0 && start.status !== null) {
  console.error("\nServer exited with code " + start.status + ". Check if port " + port + " is already in use.");
}
process.exit(start.status !== null ? start.status : start.signal ? 1 : 0);
