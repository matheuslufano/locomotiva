import { readFile } from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const entryFiles = new Set([
  "index.html", "condicoes.html", "seus-dados.html", "sua-visita.html",
  "profile-placeholder.svg", "solicitacao-recebida.html",
]);
const publicDirectories = new Set(["assets", "components", "styles", "scripts"]);
const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".png": "image/png", ".webp": "image/webp", ".svg": "image/svg+xml",
};

/** Serve the existing public pages through Next, excluding operational scripts and files. */
export async function GET(request, { params }) {
  const { file = ["index.html"] } = await params;
  const relativePath = file.join("/");
  const localPreview = process.env.NODE_ENV === "development" &&
    process.env.LOCOMOTIVA_LOCAL_PREVIEW === "true" &&
    ["127.0.0.1", "localhost", "[::1]"].includes(new URL(request.url).hostname);
  if (relativePath === "preview-config.json") {
    if (!localPreview) return new Response("Não encontrado", { status: 404 });
    const backendUrl = new URL(process.env.LOCOMOTIVA_BACKEND_URL || "http://127.0.0.1:3001");
    if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(backendUrl.hostname))
      return Response.json({ error: "A previa local precisa de um backend local." }, { status: 503 });
    try {
      const backendBase = backendUrl.href.endsWith("/") ? backendUrl : new URL(backendUrl.href + "/");
      const response = await fetch(new URL("locomotiva/preview-config", backendBase), {
        cache: "no-store",
        signal: AbortSignal.timeout(5000),
      });
      if (!response.ok)
        return Response.json({ error: "Nao foi possivel carregar as configuracoes locais salvas." }, { status: 503 });
      const preview = await response.json();
      return Response.json({
        ...preview.config,
        localPreview: true,
        previewAvailability: preview.availability,
      }, { headers: { "Cache-Control": "no-store" } });
    } catch {
      return Response.json({ error: "Nao foi possivel conectar ao backend local da campanha." }, { status: 503 });
    }
  }
  const extension = path.extname(relativePath);
  const root = process.cwd();
  const filename = path.resolve(/* turbopackIgnore: true */ root, relativePath);
  if (!filename.startsWith(root + path.sep) || !mimeTypes[extension] ||
      (!entryFiles.has(relativePath) && !publicDirectories.has(file[0])) ||
      relativePath === "scripts/dev-server.cjs") {
    return new Response("Não encontrado", { status: 404 });
  }
  try {
    let data = await readFile(filename);
    if (localPreview && extension === ".html") {
      data = data.toString("utf8").replace("</head>", '<meta name="locomotiva-preview" content="true" /></head>');
    }
    return new Response(data, {
      headers: { "Content-Type": mimeTypes[extension], "Cache-Control": "no-store" },
    });
  } catch {
    return new Response("Não encontrado", { status: 404 });
  }
}
