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

// Automatically detect local IP to fix the 127.0.0.1 issue
const os = require('os');
const networkInterfaces = os.networkInterfaces();
let localIp = '127.0.0.1';

for (const interfaceName in networkInterfaces) {
  const interfaces = networkInterfaces[interfaceName];
  for (const i of interfaces) {
    if (i.family === 'IPv4' && !i.internal) {
      localIp = i.address;
      break;
    }
  }
}
env.EXPO_PACKAGER_HOSTNAME = localIp;
env.REACT_NATIVE_PACKAGER_HOSTNAME = localIp;
env.EXPO_PUBLIC_API_BASE_URL = env.EXPO_PUBLIC_API_BASE_URL || `http://${localIp}:5117/api`;
console.log(`››› FORCING EXPO TO USE IP: ${localIp} ‹‹‹`);
console.log(`››› USING API BASE URL: ${env.EXPO_PUBLIC_API_BASE_URL} ‹‹‹`);


const expoCli = path.join(process.cwd(), "node_modules", ".bin", "expo");
// We use --host lan because Expo validates this flag against a list (lan, tunnel, localhost)
// But it will respect the EXPO_PACKAGER_HOSTNAME env var we set above.
const child = spawn(expoCli, ["start", "--host", "lan", ...args], {
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
