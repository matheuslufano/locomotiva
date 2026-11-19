(() => {
  const carousel = document.getElementById("locomotiva-dishes");
  const track = document.getElementById("locomotiva-dish-track");
  const controls = document.getElementById("locomotiva-dish-controls");
  const toggle = document.getElementById("locomotiva-dish-toggle");
  const slides = [...track.children];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let playing = !reducedMotion.matches;
  let visible = false;
  let hovering = false;
  let timer;

  // Use the track's own scroll position so changing slides never moves the page.
  function move(direction) {
    const stride = slides[1].offsetLeft - slides[0].offsetLeft;
    const end = track.scrollWidth - track.clientWidth;
    const atBoundary = direction > 0
      ? track.scrollLeft >= end - 2
      : track.scrollLeft <= 2;
    const target = atBoundary
      ? (direction > 0 ? 0 : end)
      : (Math.round(track.scrollLeft / stride) + direction) * stride;
    track.scrollTo({
      left: target,
      behavior: reducedMotion.matches || atBoundary ? "instant" : "smooth",
    });
  }

  function updatePlayback() {
    clearInterval(timer);
    toggle.dataset.playing = String(playing);
    toggle.setAttribute("aria-label", playing ? "Pausar apresentação" : "Reproduzir apresentação");
    if (playing && visible && !hovering && !document.hidden) {
      timer = setInterval(() => move(1), 4500);
    }
  }

  function setPlayback(value) {
    playing = value;
    updatePlayback();
  }

  function navigate(direction) {
    setPlayback(false);
    move(direction);
  }

  toggle.addEventListener("click", () => setPlayback(!playing));
  document.getElementById("locomotiva-dish-previous").addEventListener("click", () => navigate(-1));
  document.getElementById("locomotiva-dish-next").addEventListener("click", () => navigate(1));
  carousel.addEventListener("focusin", (event) => {
    if (event.target.matches(":focus-visible")) setPlayback(false);
  });
  track.addEventListener("pointerdown", () => setPlayback(false));
  track.addEventListener("keydown", (event) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    navigate(event.key === "ArrowRight" ? 1 : -1);
  });
  track.addEventListener("pointerenter", (event) => {
    if (event.pointerType !== "mouse") return;
    hovering = true;
    updatePlayback();
  });
  track.addEventListener("pointerleave", () => {
    hovering = false;
    updatePlayback();
  });
  document.addEventListener("visibilitychange", updatePlayback);
  reducedMotion.addEventListener("change", ({ matches }) => {
    if (matches) setPlayback(false);
  });
  new IntersectionObserver(([entry]) => {
    visible = entry.isIntersecting;
    updatePlayback();
  }, { threshold: 0.45 }).observe(carousel);

  controls.hidden = false;
  updatePlayback();
})();
