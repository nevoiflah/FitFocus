const { spawn } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
const startedAt = Date.now();

const env = { ...process.env };
delete env.CI;
delete env.CURSOR_AGENT;
delete env.ELECTRON_RUN_AS_NODE;
env.TERM = "xterm-256color";
env.FORCE_COLOR = "1";

const expoCli = path.join(process.cwd(), "node_modules", ".bin", "expo");
const child = spawn(expoCli, ["start", ...args], {
  stdio: "inherit",
  env,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});

child.on("error", (err) => {
  console.error("Failed to start Expo:", err.message);
  process.exit(1);
});
