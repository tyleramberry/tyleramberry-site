/* Tiny loader for writing.html: renders window.POSTS as a filterable list,
   or a single post when the URL has ?post=<slug>. No dependencies. */
(function () {
  "use strict";

  var SOURCES = {
    x: { label: "X", icon: "xpost" },
    linkedin: { label: "LinkedIn", icon: "linkedin" },
    essay: { label: "Essay", icon: "essay" }
  };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function icon(id, cls) {
    return '<svg class="i ' + (cls || "") + '" aria-hidden="true"><use href="icons.svg#' + id + '"/></svg>';
  }
  function fmtDate(d) {
    var p = String(d).split("-");
    var dt = new Date(+p[0], (+p[1] || 1) - 1, +p[2] || 1);
    if (isNaN(dt)) return esc(d);
    return dt.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }
  function safeUrl(u) {
    u = String(u || "").trim();
    return /^(https?:\/\/|mailto:|\/|[a-z0-9-]+\.html)/i.test(u) ? u : "#";
  }

  // Minimal markdown: ## headings, > quotes, - lists, **bold**, [text](url), blank-line paragraphs.
  function inline(s) {
    return esc(s)
      .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
      .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, t, u) {
        var href = safeUrl(u.replace(/&amp;/g, "&"));
        var ext = /^https?:/i.test(href);
        return '<a href="' + esc(href) + '"' + (ext ? ' target="_blank" rel="noopener"' : "") + ">" + t + "</a>";
      });
  }
  function md(src) {
    return String(src || "").split(/\n\s*\n/).map(function (block) {
      block = block.trim();
      if (!block) return "";
      if (/^## /.test(block)) return "<h3>" + inline(block.slice(3)) + "</h3>";
      if (/^> /.test(block)) return "<blockquote>" + inline(block.replace(/^> ?/gm, "")) + "</blockquote>";
      if (/^- /.test(block)) {
        return "<ul>" + block.split("\n").map(function (l) { return "<li>" + inline(l.replace(/^- /, "")) + "</li>"; }).join("") + "</ul>";
      }
      return "<p>" + inline(block).replace(/\n/g, "<br>") + "</p>";
    }).join("");
  }

  function href(p) {
    return p.body ? "writing.html?post=" + encodeURIComponent(p.slug) : safeUrl(p.url);
  }

  function row(p) {
    var s = SOURCES[p.source] || SOURCES.essay;
    var external = !p.body && p.url;
    return '<a class="post-row" href="' + esc(href(p)) + '"' + (external ? ' target="_blank" rel="noopener"' : "") + ">" +
      '<time class="date" datetime="' + esc(p.date) + '">' + fmtDate(p.date) + "</time>" +
      "<div><h3>" + esc(p.title) + "</h3>" + (p.summary ? "<p>" + esc(p.summary) + "</p>" : "") + "</div>" +
      '<div class="src"><span class="chip">' + icon(s.icon, "i-sm") + esc(s.label) + "</span>" +
      (p.draft ? '<span class="chip draft">Draft</span>' : "") +
      icon(external ? "ext" : "arrow") + "</div></a>";
  }

  function renderList(root, posts) {
    var filtersEl = root.querySelector("[data-filters]");
    var listEl = root.querySelector("[data-posts]");
    var current = new URLSearchParams(location.search).get("source") || "all";
    var counts = { all: posts.length };
    posts.forEach(function (p) { counts[p.source] = (counts[p.source] || 0) + 1; });

    var opts = [["all", "All"]].concat(Object.keys(SOURCES).map(function (k) { return [k, SOURCES[k].label]; }));
    filtersEl.innerHTML = opts.map(function (o) {
      return '<button type="button" class="filter" data-f="' + o[0] + '" aria-pressed="' + (o[0] === current) + '">' +
        (o[0] !== "all" ? icon(SOURCES[o[0]].icon, "i-sm") : "") + esc(o[1]) +
        '<span class="count">' + (counts[o[0]] || 0) + "</span></button>";
    }).join("");

    function draw() {
      var shown = posts.filter(function (p) { return current === "all" || p.source === current; });
      listEl.innerHTML = shown.length ? shown.map(row).join("") : '<p class="empty">Nothing here yet.</p>';
    }
    filtersEl.addEventListener("click", function (e) {
      var b = e.target.closest("[data-f]");
      if (!b) return;
      current = b.dataset.f;
      filtersEl.querySelectorAll("[data-f]").forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      var u = new URL(location.href);
      if (current === "all") u.searchParams.delete("source"); else u.searchParams.set("source", current);
      history.replaceState(null, "", u);
      draw();
    });
    draw();
  }

  function renderPost(root, p) {
    var s = SOURCES[p.source] || SOURCES.essay;
    document.title = p.title + " — Tyler Amberry";
    root.innerHTML =
      '<article class="article wrap"><div class="article-inner">' +
        '<a class="text-link back" href="writing.html">' + icon("arrow-left", "i-sm") + "All writing</a>" +
        '<p class="eyebrow">' + icon(s.icon, "i-sm") + esc(s.label) + "</p>" +
        "<h1>" + esc(p.title) + "</h1>" +
        '<div class="meta"><time datetime="' + esc(p.date) + '">' + fmtDate(p.date) + "</time>" +
          (p.draft ? '<span class="chip draft">Draft</span>' : "") +
          (p.url ? '<a class="text-link" href="' + esc(safeUrl(p.url)) + '" target="_blank" rel="noopener" style="min-height:0">Original on ' + esc(s.label) + " " + icon("ext", "i-sm") + "</a>" : "") +
        "</div>" +
        (p.draft ? '<div class="draft-banner" role="note">' + icon("alert") + "<span>This is a placeholder draft. The final version is still being written.</span></div>" : "") +
        '<div class="prose">' + md(p.body) + "</div>" +
      "</div></article>";
  }

  function boot() {
    var root = document.querySelector("[data-writing]");
    if (!root) return;
    var posts = (window.POSTS || []).slice().sort(function (a, b) { return String(b.date).localeCompare(String(a.date)); });
    var slug = new URLSearchParams(location.search).get("post");
    if (slug) {
      var p = posts.filter(function (x) { return x.slug === slug; })[0];
      if (p && p.body) { renderPost(root, p); return; }
      if (p && p.url) { location.replace(safeUrl(p.url)); return; }
    }
    renderList(root, posts);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
