/**
 * CLEBSCH — Dark / Light Theme Toggle
 * Toggles between the deep-black default and crisp-white light theme.
 * Persists choice to localStorage.
 */

(function initThemeToggle() {
  const btn   = document.getElementById("theme-toggle-btn");
  const icon  = document.getElementById("theme-icon");
  const label = document.getElementById("theme-label");

  if (!btn) return;

  // Restore saved preference (Default: Light / White theme)
  const saved = localStorage.getItem("clebsch-theme") || localStorage.getItem("clebsch_theme") || "light";
  if (saved === "dark") {
    applyDark();
  } else {
    applyLight();
  }

  btn.addEventListener("click", () => {
    if (document.body.classList.contains("light-theme")) {
      applyDark();
      localStorage.setItem("clebsch-theme", "dark");
    } else {
      applyLight();
      localStorage.setItem("clebsch-theme", "light");
    }
  });

  function applyDark() {
    document.body.classList.remove("light-theme");
    if (icon)  icon.className   = "fa-solid fa-moon";
    if (label) label.textContent = "Dark";
  }

  function applyLight() {
    document.body.classList.add("light-theme");
    if (icon)  icon.className   = "fa-solid fa-sun";
    if (label) label.textContent = "Light";
  }
})();
