/* ==========================================================================
   EAGLE WIRE — front-end renderer
   Reads articles.json and builds the front page, the section pages and the
   article pages. Swap loadData() for a Supabase or Worker fetch later; every
   render function below expects the same shape.
   ========================================================================== */
(function () {
  "use strict";

  var DATA_URL = "articles.json";

  /* ---------- helpers ---------------------------------------------------- */

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function fmtDate(iso) {
    var d = new Date(iso + "T12:00:00");
    if (isNaN(d)) { return esc(iso); }
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  }

  function href(a) { return "article.html?id=" + encodeURIComponent(a.id); }

  function thumb(a) {
    if (a.image) {
      return '<div class="ew-thumb"><img src="' + esc(a.image) + '" alt=""></div>';
    }
    return '<div class="ew-thumb" aria-hidden="true">Eagle Wire</div>';
  }

  function byline(a) {
    return '<div class="ew-byline"><b>' + esc(a.author) + '</b> &middot; ' +
           esc(a.desk) + ' &middot; ' + fmtDate(a.date) + "</div>";
  }

  function card(a, withThumb) {
    return '<article><a href="' + href(a) + '">' +
      (withThumb ? thumb(a) : "") +
      '<span class="ew-kicker">' + esc(a.kicker) + "</span>" +
      '<h3 class="ew-hed">' + esc(a.headline) + "</h3>" +
      '<p class="ew-dek">' + esc(a.dek) + "</p>" +
      byline(a) + "</a></article>";
  }

  /* ---------- front page ------------------------------------------------- */

  function renderFront(data) {
    var arts = data.articles || [];
    if (!arts.length) { return; }

    var lead = arts.filter(function (a) { return a.lead; })[0] || arts[0];
    var rest = arts.filter(function (a) { return a !== lead; });

    var leadEl = document.getElementById("ew-lead");
    if (leadEl) {
      leadEl.innerHTML =
        '<div class="ew-lead-main"><article><a href="' + href(lead) + '">' +
          thumb(lead) +
          '<span class="ew-kicker red">' + esc(lead.kicker) + "</span>" +
          '<h2 class="ew-hed">' + esc(lead.headline) + "</h2>" +
          '<p class="ew-dek">' + esc(lead.dek) + "</p>" +
          byline(lead) +
        "</a></article></div>" +
        '<div class="ew-lead-side">' +
          rest.slice(0, 3).map(function (a) { return card(a, false); }).join("") +
        "</div>";
    }

    var gridEl = document.getElementById("ew-grid");
    if (gridEl) {
      gridEl.innerHTML = rest.slice(3, 9).map(function (a) { return card(a, true); }).join("");
    }

    var latestEl = document.getElementById("ew-latest");
    if (latestEl) {
      latestEl.innerHTML = arts.slice(0, 5).map(function (a, i) {
        return '<div class="ew-list-item">' +
          '<span class="ew-rank">' + (i + 1) + "</span>" +
          '<a href="' + href(a) + '"><h3 class="ew-hed">' + esc(a.headline) + "</h3>" +
          '<div class="ew-byline">' + esc(a.desk) + " &middot; " + fmtDate(a.date) + "</div></a></div>";
      }).join("");
    }
  }

  /* ---------- section page ----------------------------------------------- */

  function renderSection(data) {
    var gridEl = document.getElementById("ew-section-grid");
    if (!gridEl) { return; }

    var want = new URLSearchParams(location.search).get("name") || "";
    var arts = (data.articles || []).filter(function (a) {
      return !want || a.section.toLowerCase() === want.toLowerCase();
    });

    var label = want || "All coverage";
    document.title = label + " — Eagle Wire";
    var h = document.getElementById("ew-section-title");
    if (h) { h.textContent = label; }

    if (!arts.length) {
      gridEl.innerHTML = '<div class="ew-empty"><h3>Nothing filed here yet</h3>' +
        "<p>This desk has not published a story in this section.</p>" +
        '<a class="ew-btn ew-btn-ghost" href="index.html">Back to the front page</a></div>';
      gridEl.style.gridTemplateColumns = "1fr";
      return;
    }
    gridEl.innerHTML = arts.map(function (a) { return card(a, true); }).join("");
  }

  /* ---------- article page ----------------------------------------------- */

  function block(b) {
    if (b.t === "h2")    { return "<h2>" + esc(b.v) + "</h2>"; }
    if (b.t === "quote") { return "<blockquote>" + esc(b.v) + "</blockquote>"; }
    if (b.t === "list")  {
      return "<ul>" + (b.v || []).map(function (i) { return "<li>" + esc(i) + "</li>"; }).join("") + "</ul>";
    }
    return "<p>" + esc(b.v) + "</p>";
  }

  function renderArticle(data) {
    var host = document.getElementById("ew-article");
    if (!host) { return; }

    var id = new URLSearchParams(location.search).get("id");
    var a = (data.articles || []).filter(function (x) { return x.id === id; })[0];

    if (!a) {
      host.innerHTML = '<div class="ew-empty"><h3>Story not found</h3>' +
        "<p>That story may have been withdrawn, or the link may be incomplete.</p>" +
        '<a class="ew-btn ew-btn-ghost" href="index.html">Back to the front page</a></div>';
      return;
    }

    document.title = a.headline + " — Eagle Wire";
    var meta = document.querySelector('meta[name="description"]');
    if (meta) { meta.setAttribute("content", a.dek); }

    host.innerHTML =
      '<nav class="ew-crumbs"><a href="index.html">Front page</a> / ' +
        '<a href="section.html?name=' + encodeURIComponent(a.section) + '">' + esc(a.section) + "</a></nav>" +
      '<span class="ew-kicker">' + esc(a.kicker) + "</span>" +
      "<h1>" + esc(a.headline) + "</h1>" +
      '<p class="ew-dek">' + esc(a.dek) + "</p>" +
      '<div class="ew-artmeta">' + byline(a) + "</div>" +
      '<figure class="ew-figure">' + thumb(a) +
        (a.caption ? '<figcaption class="ew-figcap">' + esc(a.caption) + "</figcaption>" : "") +
      "</figure>" +
      '<div class="ew-body">' + (a.body || []).map(block).join("") + "</div>" +
      '<div class="ew-endnote"><strong>This is a work of fiction.</strong> Eagle Wire is the in-universe ' +
        "wire service of USAI | The American Ideal, a Roblox roleplay community. The people, offices and " +
        "events described above are fictional and no part of this report describes real news.</div>";
  }

  /* ---------- shared furniture ------------------------------------------- */

  function renderFurniture(data) {
    var bar = document.getElementById("ew-breaking");
    if (bar && data.breaking && data.breaking.length) {
      var one = data.breaking.map(function (t, i) {
        return '<span class="ew-breaking-item"><b>' + String(i + 1).padStart(2, "0") + "</b>" + esc(t) + "</span>";
      }).join("");
      bar.innerHTML = one + one.replace(/<span class="ew-breaking-item">/g,
        '<span class="ew-breaking-item" aria-hidden="true">');
    }

    var dock = document.getElementById("ew-docket");
    if (dock && data.docket) {
      dock.innerHTML = data.docket.map(function (d) {
        return '<div class="ew-docket-row"><time>' + esc(d.when) + "</time><span>" + esc(d.what) + "</span></div>";
      }).join("");
    }
  }

  /* ---------- boot -------------------------------------------------------- */

  fetch(DATA_URL, { cache: "no-cache" })
    .then(function (r) {
      if (!r.ok) { throw new Error("HTTP " + r.status); }
      return r.json();
    })
    .then(function (data) {
      renderFurniture(data);
      renderFront(data);
      renderSection(data);
      renderArticle(data);
    })
    .catch(function () {
      ["ew-lead", "ew-grid", "ew-section-grid", "ew-article"].forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) { return; }
        el.innerHTML = '<div class="ew-empty"><h3>Wire feed unavailable</h3>' +
          "<p>The story file could not be loaded. If you opened this page directly from your " +
          "computer, run it through a local server &mdash; browsers block file reads otherwise.</p></div>";
        el.style.gridTemplateColumns = "1fr";
      });
    });

  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  var today = document.getElementById("ew-today");
  if (today) {
    today.textContent = new Date().toLocaleDateString("en-US",
      { weekday: "long", month: "long", day: "numeric", year: "numeric" });
  }
})();
