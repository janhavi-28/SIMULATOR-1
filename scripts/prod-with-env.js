/**
 * Run prod with NODE_OPTIONS set in this process so they're inherited by all children.
 * Use: node scripts/prod-with-env.js
 * Or: npm run prod:env
 */
const { spawnSync } = require("child_process");
const path = require("path");

const maxMB = Number(process.env.NODE_MAX_OLD_SPACE_MB) || 16384;
process.env.NODE_OPTIONS = `--max-old-space-size=${maxMB}`;

const root = path.join(__dirname, "..");
const result = spawnSync(process.execPath, [path.join(__dirname, "run-prod.js")], {
  env: process.env,
  stdio: "inherit",
  cwd: root,
});

process.exit(result.status !== null ? result.status : result.signal ? 1 : 0);
