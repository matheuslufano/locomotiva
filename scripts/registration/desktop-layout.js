(() => {
  const desktop = matchMedia("(min-width: 1000px)");
  let currentStep = 1;
  let actionsHome;
  function sync(step = currentStep) {
    currentStep = step;
    const get = key => document.getElementById("locomotiva-" + key);
    const actions = get("form").querySelector(".form-actions");
    if (!actionsHome) {
      actionsHome = document.createComment("Shared form actions");
      actions.before(actionsHome);
    }
    // One set of controls moves between desktop columns and the mobile flow.
    actionsHome.after(actions);
    if (step === 1) get("consents").append(get("approval-notice"));
    else actions.before(get("approval-notice"));
    if (desktop.matches && step === 1) {
      get("step-1").querySelector(".conditions-desktop-copy").append(actions);
      get("step-1").querySelector(".registration-benefit").append(get("approval-notice"));
    }
    if (desktop.matches && step === 2) {
      get("step-2").querySelector(".personal-desktop-main").append(actions);
    }
    if (desktop.matches && step === 3) {
      const sidebar = get("step-3").querySelector(".visit-desktop-sidebar");
      sidebar.append(get("approval-notice"), actions);
    }
    if (step === 1) {
      get("registration-title").textContent = desktop.matches
        ? "Condições de participação" : "Antes de participar";
    }
  }
  desktop.addEventListener("change", () => {
    if (document.getElementById("locomotiva-form") && document.body.dataset.registrationStep !== "receipt") sync();
  });
  window.LocomotivaDesktopLayout = Object.freeze({ sync });
})();
