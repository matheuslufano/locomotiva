(() => {
  const isLiveServer = ["localhost", "127.0.0.1", "[::1]"].includes(location.hostname) &&
    location.port === "5500";
  const apiBase = isLiveServer
    ? new URL("http://127.0.0.1:3001/locomotiva/")
    : new URL("../locomotiva/", location.href);

  async function request(path, body) {
    let response;
    try {
      response = await fetch(new URL(path, apiBase), {
        method: body ? "POST" : "GET",
        headers: body ? { "Content-Type": "application/json" } : {},
        body: body ? JSON.stringify(body) : undefined,
        cache: "no-store",
      });
    } catch {
      throw new Error("Não foi possível conectar ao serviço da campanha. Tente novamente em instantes.");
    }
    if (!response.headers.get("content-type")?.includes("application/json")) {
      throw new Error("O serviço da campanha está indisponível neste endereço. Acesse o link oficial da campanha.");
    }
    const data = await response.json();
    if (!response.ok) {
      throw Object.assign(
        new Error(data.error || "Não foi possível consultar a campanha. Tente novamente em instantes."),
        { status: response.status },
      );
    }
    return data;
  }

  window.LocomotivaApi = Object.freeze({ request });
})();
