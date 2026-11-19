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
    const folder = path.join(process.cwd(), "docs/campanha");
    const draft = JSON.parse(await readFile(path.join(folder, "configuracao-rascunho.json"), "utf8"));
    const privacy = await readFile(path.join(folder, "aviso-de-privacidade.txt"), "utf8");
    const previewAvailability = Array.from({ length: 10 }, (_, index) => ({
      date: "2026-11-" + (21 + index),
      state: index < 2 ? "CLOSED" : "AVAILABLE",
      times: {
        lunch: ["11:00", "11:30", "12:00", "12:30", "13:00", "13:30"],
        dinner: [],
      },
    }));
    return Response.json({ ...draft, privacy, localPreview: true, previewAvailability }, {
      headers: { "Cache-Control": "no-store" },
    });
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
