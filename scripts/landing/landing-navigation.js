(() => {
  const header = document.getElementById("locomotiva-header");
  const toggle = document.getElementById("locomotiva-menu-toggle");
  const nav = document.getElementById("locomotiva-navigation");
  const mobile = matchMedia("(max-width: 839px)");

  function setMenu(open) {
    toggle.setAttribute("aria-expanded", String(open));
    nav.hidden = mobile.matches && !open;
  }

  function updateLayout() {
    toggle.hidden = !mobile.matches;
    setMenu(false);
  }

  toggle.addEventListener("click", () => {
    setMenu(toggle.getAttribute("aria-expanded") === "false");
  });
  nav.addEventListener("click", (event) => {
    const link = event.target.closest("a");
    if (!link || !mobile.matches) return;
    const target = document.getElementById(link.hash.slice(1));
    if (target) {
      target.tabIndex = -1;
      target.focus({ preventScroll: true });
    }
    setMenu(false);
  });
  header.addEventListener("keydown", (event) => {
    if (event.key !== "Escape" || toggle.getAttribute("aria-expanded") !== "true") return;
    toggle.focus();
    setMenu(false);
  });
  mobile.addEventListener("change", updateLayout);
  updateLayout();
})();
