/* USAI | The American Ideal — shared behaviour */
(function () {
  "use strict";

  var btn = document.querySelector(".menu-btn");
  var bar = document.getElementById("navbar");

  if (btn && bar) {
    btn.addEventListener("click", function () {
      var open = bar.classList.toggle("open");
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.style.overflow = open ? "hidden" : "";
    });
    bar.addEventListener("click", function (e) {
      if (e.target.closest("a") && bar.classList.contains("open")) { btn.click(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && bar.classList.contains("open")) { btn.click(); }
    });
  }

  var targets = document.querySelectorAll(".reveal");
  if (targets.length) {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced || !("IntersectionObserver" in window)) {
      targets.forEach(function (el) { el.classList.add("in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { entry.target.classList.add("in"); io.unobserve(entry.target); }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      targets.forEach(function (el) { io.observe(el); });
    }
  }

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
