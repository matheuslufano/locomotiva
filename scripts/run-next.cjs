const { spawn } = require("node:child_process");
const path = require("node:path");
const net = require("node:net");
const root = path.resolve(__dirname, "..");
const children = [];
const production = process.argv.includes("--production");
require("@next/env").loadEnvConfig(root, !production);
const backendUrl = new URL(process.env.LOCOMOTIVA_BACKEND_URL || "http://127.0.0.1:3001");
const webPort = Number(process.env.LOCOMOTIVA_WEB_PORT || 3002);
function launch(file, args) {
  const child = spawn(process.execPath, [file, ...args], {
    cwd: root, stdio: "inherit", windowsHide: true,
  });
  children.push(child);
  child.on("exit", (code) => {
    for (const sibling of children) if (sibling !== child) sibling.kill();
    process.exitCode = code || 0;
  });
}
function verifyPort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", (error) => {
      reject(new Error(error.code === "EADDRINUSE"
        ? "A porta " + webPort + " já está em uso. Confira http://127.0.0.1:" + webPort +
          " ou encerre a instância anterior com Ctrl+C antes de iniciar novamente."
        : error.message));
    });
    probe.listen(webPort, "127.0.0.1", () => probe.close(resolve));
  });
}

async function start() {
  if (!Number.isInteger(webPort) || webPort < 1 || webPort > 65535) {
    throw new Error("LOCOMOTIVA_WEB_PORT deve ser uma porta entre 1 e 65535.");
  }
  await verifyPort();
  let backendRunning = false;
  try {
    const base = backendUrl.href.replace(/\/$/, "") + "/";
    const responses = await Promise.all(["health", "locomotiva/config"].map((route) =>
      fetch(new URL(route, base), { signal: AbortSignal.timeout(3000) }),
    ));
    const [health, campaign] = await Promise.all(responses.map((response) => response.json()));
    backendRunning = responses.every((response) => response.ok) &&
      health.database === "ok" && typeof campaign.config?.published === "boolean";
  } catch { /* The configured backend is required. */ }
  if (!backendRunning) {
    throw new Error("Inicie o afiliados-backend completo (npm run dev) e confirme /health e /locomotiva/config antes de executar o site.");
  }
  launch(require.resolve("next/dist/bin/next"), [
    production ? "start" : "dev", "--hostname", "127.0.0.1", "--port", String(webPort),
  ]);
}
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => {
    for (const child of children) child.kill();
    process.exit();
  });
}
start().catch((error) => { console.error(error.message); process.exitCode = 1; });
