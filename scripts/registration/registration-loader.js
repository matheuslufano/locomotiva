(async () => {
  const mount = document.getElementById("locomotiva-registration-mount");
  try {
    const response = await fetch("./components/registration-form.html", { cache: "no-store" });
    if (!response.ok) throw new Error("Formulário indisponível");
    // The shared markup is a same-origin, repository-owned static fragment.
    mount.innerHTML = await response.text();
    const receiptResponse = await fetch("./solicitacao-recebida.html", { cache: "no-store" });
    if (!receiptResponse.ok) throw new Error("Resumo indisponível");
    const receiptPage = new DOMParser().parseFromString(await receiptResponse.text(), "text/html");
    const receipt = receiptPage.getElementById("locomotiva-success");
    receipt.hidden = true;
    mount.querySelector(".registration-section").append(receipt);
    const script = document.createElement("script");
    script.src = "./scripts/registration/campaign.js";
    script.onerror = () => {
      mount.textContent = "Não foi possível iniciar o cadastro. Recarregue a página.";
    };
    document.body.append(script);
  } catch {
    mount.textContent = "Não foi possível carregar o cadastro. Recarregue a página para tentar novamente.";
  }
})();
