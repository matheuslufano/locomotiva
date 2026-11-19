// Local public campaign server. Reuses the installed backend and its PostgreSQL connection.
const path = require("node:path");
const { createRequire } = require("node:module");
require("@next/env").loadEnvConfig(path.resolve(__dirname, ".."), process.env.NODE_ENV !== "production");
const backendRoot = path.resolve(__dirname, "../../afiliados-backend");
const backendRequire = createRequire(path.join(backendRoot, "package.json"));
backendRequire("dotenv").config({ path: path.join(backendRoot, ".env"), quiet: true });
const express = backendRequire("express");
const cors = backendRequire("cors");
const app = express();
const backendUrl = new URL(process.env.LOCOMOTIVA_BACKEND_URL || "http://127.0.0.1:3001");
if (backendUrl.protocol !== "http:" || backendUrl.hostname !== "127.0.0.1" ||
    backendUrl.pathname !== "/") {
  throw new Error("O serviço local requer LOCOMOTIVA_BACKEND_URL em http://127.0.0.1:PORTA.");
}
const port = Number(backendUrl.port || 80);

app.use(cors({ origin: ["http://127.0.0.1:5500", "http://localhost:5500"] }));
app.use(express.json({ limit: "5mb" }));
app.get("/", (req, res) => res.redirect("/campanha-locomotiva/"));
app.use(backendRequire("./src/routes/locomotivaRoutes"));
app.listen(port, "127.0.0.1", () => {
  console.log("Locomotiva: http://127.0.0.1:" + port + "/campanha-locomotiva/");
  console.log("API e páginas usam o mesmo servidor. PostgreSQL do Afiliados Netbox.");
}).on("error", (error) => {
  console.error(error.code === "EADDRINUSE"
    ? "A porta " + port + " já está em uso. Verifique o servidor existente."
    : "Não foi possível iniciar o servidor local: " + error.message);
  process.exitCode = 1;
});
