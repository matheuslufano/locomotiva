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
    const response = await fetch(new URL("locomotiva/config", backendUrl.href.replace(/\/$/, "") + "/"), { signal: AbortSignal.timeout(3000) });
    backendRunning = response.headers.get("content-type")?.includes("application/json");
  } catch { /* Start the local backend when it is not already listening. */ }
  if (!backendRunning) {
    if (backendUrl.protocol !== "http:" || backendUrl.hostname !== "127.0.0.1" ||
        backendUrl.pathname !== "/" || Number(backendUrl.port || 80) === webPort) {
      throw new Error("Inicie o backend configurado em LOCOMOTIVA_BACKEND_URL antes de executar o site.");
    }
    launch(path.join(__dirname, "dev-server.cjs"), []);
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
