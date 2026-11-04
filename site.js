/* ==========================================================================
   Shared site JS: mobile nav, Cmd+K palette, "this week" ticker,
   agent-trace animation, scroll reveals. No dependencies, no build step.
   ========================================================================== */
(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var EMAIL = "tyleramberry@gmail.com";

  function icon(id, cls) {
    return '<svg class="i ' + (cls || "") + '" aria-hidden="true"><use href="icons.svg#' + id + '"/></svg>';
  }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  /* ------------------------------------------------------------------
     THIS WEEK — edit this list to update the home-page ticker.
     Keep every line true. Bold part = the project.
     ------------------------------------------------------------------ */
  var TICKER = [
    ["Portfolio", "rebuilt as a static, AI-native site. No framework, no build step"],
    ["MySI", "first outside tester went from interview to one winning model in ~15 min, for $0.07"],
    ["Homeroom", "decisions 001 + 002 logged: students first, portfolio first"],
    ["Second brain", "113 linked pages, 23 agent skills, 7 scheduled jobs"],
    ["Sundae Planner", "live in production at sundaeplanner.com"],
    ["Space Tiger AI", "Blueprint-call prep turned into a one-command hypothesis-doc skill"],
    ["Buzz", "9-agent software factory. Nothing ships until QA signs off"]
  ];

  /* ------------------------------------------------------------------
     Mobile nav
     ------------------------------------------------------------------ */
  function initNav() {
    var header = document.querySelector(".site-header");
    var btn = document.querySelector("[data-menu]");
    if (!header || !btn) return;
    btn.addEventListener("click", function () {
      var open = header.classList.toggle("open");
      btn.setAttribute("aria-expanded", String(open));
      btn.innerHTML = icon(open ? "close" : "menu", "i-lg") + '<span class="sr-only">' + (open ? "Close menu" : "Open menu") + "</span>";
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && header.classList.contains("open")) { btn.click(); btn.focus(); }
    });
  }

  /* ------------------------------------------------------------------
     Ticker
     ------------------------------------------------------------------ */
  function initTicker() {
    var track = document.querySelector("[data-ticker]");
    if (!track) return;
    var items = TICKER.map(function (t) { return "<li><b>" + esc(t[0]) + "</b>" + esc(t[1]) + "</li>"; }).join("");
    track.innerHTML = "<ul>" + items + '</ul><ul aria-hidden="true">' + items + "</ul>";
    // keep a steady reading speed regardless of content length
    var w = track.firstChild.scrollWidth;
    track.style.setProperty("--ticker-dur", Math.max(30, Math.round(w / 42)) + "s");
  }

  /* ------------------------------------------------------------------
     Agent trace: lines arrive one at a time
     ------------------------------------------------------------------ */
  function initTrace() {
    var lines = document.querySelectorAll("[data-trace] li");
    if (!lines.length || reduceMotion) return;
    lines.forEach(function (li) { li.classList.add("pending"); });
    lines.forEach(function (li, i) {
      setTimeout(function () { li.classList.add("in"); }, 350 + i * 420);
    });
  }

  /* ------------------------------------------------------------------
     Scroll reveal
     ------------------------------------------------------------------ */
  function initReveal() {
    var els = document.querySelectorAll(".reveal");
    if (!els.length) return;
    if (reduceMotion || !("IntersectionObserver" in window)) {
      els.forEach(function (el) { el.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
    els.forEach(function (el) { io.observe(el); });
  }

  /* ------------------------------------------------------------------
     Toast
     ------------------------------------------------------------------ */
  var toastEl, toastTimer;
  function toast(msg) {
    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "toast";
      toastEl.setAttribute("role", "status");
      document.body.appendChild(toastEl);
    }
    toastEl.innerHTML = icon("check", "i-sm") + esc(msg);
    toastEl.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove("show"); }, 1800);
  }

  /* ------------------------------------------------------------------
     Command palette (Cmd/Ctrl+K, or "/")
     ------------------------------------------------------------------ */
  var COMMANDS = [
    { g: "Pages", t: "Home", h: "index.html", i: "home", k: "start overview" },
    { g: "Pages", t: "Work: experience timeline", h: "work.html", i: "timeline", k: "experience jobs resume space tiger byu yards" },
    { g: "Pages", t: "Products: case studies", h: "products.html", i: "box", k: "projects portfolio case studies" },
    { g: "Pages", t: "Stories: one win, one miss", h: "stories.html", i: "book", k: "success failure" },
    { g: "Pages", t: "Writing", h: "writing.html", i: "pen", k: "blog posts essays x linkedin" },
    { g: "Case studies", t: "Space Tiger AI website redesign", h: "products.html#space-tiger", i: "spark", k: "web design" },
    { g: "Case studies", t: "Grant and RFP agent platform", h: "products.html#rfp-agents", i: "layers", k: "govcon contracting orchestrator" },
    { g: "Case studies", t: "Sundae Planner", h: "products.html#sundae", i: "calendar", k: "weekly planning coach saas" },
    { g: "Case studies", t: "Personal agent harness", h: "products.html#harness", i: "cpu", k: "second brain buzz software factory cfo" },
    { g: "Case studies", t: "Homeroom to MySI", h: "products.html#homeroom", i: "cap", k: "msb 341 student benchmark models" },
    { g: "Case studies", t: "Utah Valley Yards ops", h: "products.html#uvy", i: "leaf", k: "lawn care business" },
    { g: "Contact", t: "Email Tyler", h: "mailto:" + EMAIL, i: "mail", k: "contact hire" },
    { g: "Contact", t: "Copy email address", a: "copy", i: "copy", k: "contact clipboard", hint: EMAIL },
    { g: "Contact", t: "GitHub", h: "https://github.com/tyleramberry", i: "github", k: "code", ext: true }
    // TODO(Tyler): add LinkedIn once the profile URL is confirmed.
  ];

  function initPalette() {
    // add posts (writing page loads posts.js; elsewhere it is optional)
    if (Array.isArray(window.POSTS)) {
      window.POSTS.forEach(function (p) {
        COMMANDS.push({
          g: "Writing", t: p.title, i: p.source === "x" ? "xpost" : p.source === "linkedin" ? "linkedin" : "essay",
          h: p.url && !p.body ? p.url : "writing.html?post=" + encodeURIComponent(p.slug),
          ext: !!(p.url && !p.body), k: (p.source || "") + " " + (p.summary || "")
        });
      });
    }

    var back = document.createElement("div");
    back.className = "palette-backdrop";
    back.hidden = true;
    back.innerHTML =
      '<div class="palette" role="dialog" aria-modal="true" aria-label="Command menu">' +
        '<div class="palette-input">' + icon("search") +
          '<input type="text" placeholder="Jump to a page, project, or post…" aria-label="Search commands" ' +
          'role="combobox" aria-expanded="true" aria-controls="palette-list" aria-autocomplete="list" autocomplete="off" spellcheck="false">' +
          '<kbd>esc</kbd>' +
        "</div>" +
        '<div class="palette-list" id="palette-list" role="listbox"></div>' +
        '<div class="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> move</span><span><kbd>↵</kbd> open</span><span><kbd>esc</kbd> close</span></div>' +
      "</div>";
    document.body.appendChild(back);

    var input = back.querySelector("input");
    var list = back.querySelector(".palette-list");
    var results = [], sel = 0, lastFocus = null;

    function score(c, q) {
      if (!q) return 1;
      var hay = (c.t + " " + c.g + " " + (c.k || "")).toLowerCase();
      var title = c.t.toLowerCase();
      if (title.indexOf(q) === 0) return 4;
      if (title.indexOf(q) > -1) return 3;
      var words = q.split(/\s+/).filter(Boolean);
      if (words.every(function (w) { return hay.indexOf(w) > -1; })) return 2;
      // loose subsequence match
      var i = 0;
      for (var j = 0; j < hay.length && i < q.length; j++) if (hay[j] === q[i]) i++;
      return i === q.length ? 0.5 : 0;
    }

    function render() {
      var q = input.value.trim().toLowerCase();
      results = COMMANDS.map(function (c, idx) { return { c: c, s: score(c, q), idx: idx }; })
        .filter(function (r) { return r.s > 0; })
        .sort(function (a, b) { return q ? (b.s - a.s) || (a.idx - b.idx) : a.idx - b.idx; })
        .map(function (r) { return r.c; });
      if (sel >= results.length) sel = 0;
      if (!results.length) {
        list.innerHTML = '<div class="palette-empty">No matches. Try “sundae” or “email”.</div>';
        input.removeAttribute("aria-activedescendant");
        return;
      }
      var html = "", group = null;
      results.forEach(function (c, i) {
        if (!q && c.g !== group) { group = c.g; html += '<div class="palette-group" role="presentation">' + esc(group) + "</div>"; }
        html += '<button type="button" class="palette-item" role="option" id="pc-' + i + '" data-i="' + i + '" aria-selected="' + (i === sel) + '">' +
          icon(c.i) + "<span>" + esc(c.t) + "</span>" +
          '<span class="hint">' + (c.hint ? esc(c.hint) : c.ext ? "↗" : q ? esc(c.g) : "") + "</span></button>";
      });
      list.innerHTML = html;
      input.setAttribute("aria-activedescendant", "pc-" + sel);
    }

    function move(d) {
      if (!results.length) return;
      sel = (sel + d + results.length) % results.length;
      list.querySelectorAll(".palette-item").forEach(function (el, i) { el.setAttribute("aria-selected", String(i === sel)); });
      input.setAttribute("aria-activedescendant", "pc-" + sel);
      var cur = list.querySelector('[data-i="' + sel + '"]');
      if (cur) cur.scrollIntoView({ block: "nearest" });
    }

    function run(c) {
      if (!c) return;
      if (c.a === "copy") {
        var done = function () { close(); toast("Email copied"); };
        if (navigator.clipboard) navigator.clipboard.writeText(EMAIL).then(done, function () { window.location.href = "mailto:" + EMAIL; });
        else window.location.href = "mailto:" + EMAIL;
        return;
      }
      close();
      if (c.ext) window.open(c.h, "_blank", "noopener");
      else window.location.href = c.h;
    }

    function open() {
      if (!back.hidden) return;
      lastFocus = document.activeElement;
      back.hidden = false;
      input.value = ""; sel = 0; render();
      document.documentElement.style.overflow = "hidden";
      requestAnimationFrame(function () { back.classList.add("show"); input.focus(); });
    }
    function close() {
      if (back.hidden) return;
      back.classList.remove("show");
      document.documentElement.style.overflow = "";
      setTimeout(function () { back.hidden = true; }, reduceMotion ? 0 : 160);
      if (lastFocus && lastFocus.focus) lastFocus.focus();
    }

    input.addEventListener("input", function () { sel = 0; render(); });
    input.addEventListener("keydown", function (e) {
      if (e.key === "ArrowDown") { e.preventDefault(); move(1); }
      else if (e.key === "ArrowUp") { e.preventDefault(); move(-1); }
      else if (e.key === "Enter") { e.preventDefault(); run(results[sel]); }
      else if (e.key === "Tab") { e.preventDefault(); move(e.shiftKey ? -1 : 1); } // keep focus in dialog
    });
    list.addEventListener("click", function (e) {
      var b = e.target.closest(".palette-item");
      if (b) run(results[+b.dataset.i]);
    });
    list.addEventListener("mousemove", function (e) {
      var b = e.target.closest(".palette-item");
      if (b && +b.dataset.i !== sel) { sel = +b.dataset.i; move(0); }
    });
    back.addEventListener("mousedown", function (e) { if (e.target === back) close(); });

    document.addEventListener("keydown", function (e) {
      var k = e.key && e.key.toLowerCase();
      if ((e.metaKey || e.ctrlKey) && k === "k") { e.preventDefault(); back.hidden ? open() : close(); return; }
      if (e.key === "Escape" && !back.hidden) { e.preventDefault(); close(); return; }
      var tag = (e.target.tagName || "").toLowerCase();
      if (e.key === "/" && back.hidden && tag !== "input" && tag !== "textarea" && !e.target.isContentEditable) { e.preventDefault(); open(); }
    });
    document.querySelectorAll("[data-palette]").forEach(function (b) { b.addEventListener("click", open); });

    // show the right modifier key
    var isMac = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
    if (!isMac) document.querySelectorAll("[data-mod]").forEach(function (el) { el.textContent = "Ctrl K"; });
  }

  /* ------------------------------------------------------------------ */
  function boot() {
    initNav();
    initTicker();
    initTrace();
    initReveal();
    initPalette();
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();

  window.Site = { icon: icon, esc: esc };
})();
