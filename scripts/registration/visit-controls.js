(() => {
  const groups = new Map();
  function sync() {
    for (const [select, group] of groups) {
      group.replaceChildren();
      for (const option of select.options) {
        if (!option.value) continue;
        const button = document.createElement("button");
        button.type = "button";
        button.id = "locomotiva-" + select.dataset.choiceControl + "-" + option.value.toLowerCase().replace(/[^a-z0-9]/g, "-");
        button.textContent = option.textContent;
        if (select.dataset.choiceControl === "period") {
          const icon = document.createElementNS("http://www.w3.org/2000/svg", "svg");
          icon.setAttribute("viewBox", "0 0 24 24");
          icon.setAttribute("aria-hidden", "true");
          icon.innerHTML = option.value === "lunch"
            ? '<path d="M5 3v6m3-6v6M3 3v5a3 3 0 0 0 6 0V3M6 11v10M19 3c-4 1-5 5-5 9h5m0-9v18"/>'
            : '<path d="M20 15A8 8 0 0 1 9 4a8 8 0 1 0 11 11Z"/>';
          button.prepend(icon);
        }
        button.disabled = option.disabled;
        button.className = "registration-choice-button";
        button.setAttribute("aria-pressed", String(select.value === option.value));
        button.addEventListener("click", () => {
          select.value = option.value;
          select.dispatchEvent(new Event("change", { bubbles: true }));
          sync();
          document.getElementById(button.id)?.focus({ preventScroll: true });
        });
        group.append(button);
      }
    }
  }
  function initialize() {
    for (const select of document.querySelectorAll("[data-choice-control]")) {
      const group = document.createElement("div");
      group.id = select.id + "-choices";
      group.className = "registration-choice-group";
      group.setAttribute("role", "group");
      group.setAttribute("aria-label", select.labels[0]?.textContent.trim() || "Escolha uma opção");
      // Keep the native select available for validation, keyboard input and fallback.
      select.after(group);
      select.classList.add("registration-choice-select");
      select.addEventListener("invalid", (event) => {
        event.preventDefault();
        group.querySelector("button")?.focus();
        document.getElementById("locomotiva-status").textContent = "Escolha " + group.getAttribute("aria-label").toLowerCase() + " para continuar.";
      });
      select.addEventListener("change", sync);
      groups.set(select, group);
    }
    sync();
  }
  window.LocomotivaVisitControls = Object.freeze({ initialize, sync });
})();
