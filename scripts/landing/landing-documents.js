(async () => {
  try {
    const { config } = await window.LocomotivaApi.request("config");
    if (!config.published) return;
    for (const key of ["conditions", "privacy"]) {
      document.getElementById("locomotiva-footer-" + key).hidden = !config[key]?.trim();
    }
    document.getElementById("locomotiva-footer-documents").hidden =
      !config.conditions?.trim() && !config.privacy?.trim();
  } catch {
    // The invitation remains readable when campaign documents are unavailable.
  }
})();
