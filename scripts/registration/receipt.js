(() => {
  function show(result, submitted, { preview = false } = {}) {
    const get = key => document.getElementById("locomotiva-" + key);
    document.body.dataset.registrationStep = "receipt";
    get("registration").dataset.step = "receipt";
    get("registration-title").hidden = true;
    get("step-caption").hidden = true;
    const success = get("success");
    success.hidden = false;
    get("success-title").textContent = "Solicitação recebida!";
    get("success-preview").hidden = !preview;
    get("success-state").textContent = "Em análise";
    get("success-state").hidden = false;
    get("success-details").hidden = false;
    get("success-spam").hidden = Boolean(result.localTest);
    get("success-message").textContent = result.localTest
      ? "Solicitação de teste gravada no ambiente local. Nenhum e-mail será enviado."
      : "Sua participação ainda não está confirmada. Enviaremos o retorno por e-mail.";
    const date = new Date(result.date + "T12:00:00-03:00");
    get("success-date").textContent = new Intl.DateTimeFormat("pt-BR", {
      day: "numeric", month: "long", year: "numeric", timeZone: "America/Araguaina",
    }).format(date);
    get("success-time").textContent = (submitted.period === "lunch" ? "Almoço" : "Jantar") + " às " + result.time;
    get("success-modality").textContent = submitted.modality === "STORIES" ? "4 Stories" : "1 Reels de 60 segundos";
    get("success-email").textContent = result.email;
    window.LocomotivaApi.showVoucher(result);
    const voucher = get("success-voucher");
    if (voucher) voucher.textContent = "Voucher de " + window.LocomotivaApi.formatVoucher(result);
    get("protocol").textContent = result.protocol;
    history.pushState(null, "", "./solicitacao-recebida.html");
    document.title = "Solicitação recebida | Locomotiva Restaurante";
    success.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  window.LocomotivaReceipt = Object.freeze({ show });
})();
