/* Live force-directed graph of the second brain (anonymized: nodes + links only). */
(function () {
  var c = document.querySelector("canvas[data-graph]");
  if (!c) return;
  var ctx = c.getContext("2d"), N = [], E = [], W = 0, H = 0, dpr = Math.min(window.devicePixelRatio || 1, 2);
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches, drag = null, alpha = 1;
  function size() { var r = c.getBoundingClientRect(); W = r.width; H = r.height; c.width = W * dpr; c.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  fetch("img/graph.json").then(function (r) { return r.json(); }).then(function (d) {
    size();
    for (var i = 0; i < d.n; i++) N.push({ x: W / 2 + (Math.random() - .5) * W * .6, y: H / 2 + (Math.random() - .5) * H * .6, vx: 0, vy: 0, deg: 0 });
    d.e.forEach(function (e) { E.push(e); N[e[0]].deg++; N[e[1]].deg++; });
    N.forEach(function (n) { n.r = 1.4 + Math.sqrt(n.deg) * 1.1; });
    for (var k = 0; k < 120; k++) step();
    loop();
  });
  function step() {
    var cx = W / 2, cy = H / 2, i, j, a, b, dx, dy, d2, f;
    for (i = 0; i < N.length; i++) { a = N[i];
      for (j = i + 1; j < N.length; j++) { b = N[j]; dx = a.x - b.x; dy = a.y - b.y; d2 = dx * dx + dy * dy + .01;
        if (d2 < 9000) { f = 60 / d2; a.vx += dx * f; a.vy += dy * f; b.vx -= dx * f; b.vy -= dy * f; } }
      a.vx += (cx - a.x) * (a.deg ? .0035 : .012); a.vy += (cy - a.y) * (a.deg ? .0035 : .012) * (W / H); }
    E.forEach(function (e) { a = N[e[0]]; b = N[e[1]]; dx = b.x - a.x; dy = b.y - a.y; var d = Math.sqrt(dx * dx + dy * dy) || 1; f = (d - 26) * .012;
      a.vx += dx / d * f; a.vy += dy / d * f; b.vx -= dx / d * f; b.vy -= dy / d * f; });
    N.forEach(function (n) { if (n === drag) return; n.vx *= .82; n.vy *= .82; n.x += n.vx * alpha; n.y += n.vy * alpha;
      n.x = Math.max(4, Math.min(W - 4, n.x)); n.y = Math.max(4, Math.min(H - 4, n.y)); });
  }
  var t = 0;
  function draw() {
    var s = getComputedStyle(c), fg = s.color || "#ddd";
    ctx.clearRect(0, 0, W, H); ctx.globalAlpha = .18; ctx.strokeStyle = fg; ctx.lineWidth = .6; ctx.beginPath();
    E.forEach(function (e) { ctx.moveTo(N[e[0]].x, N[e[0]].y); ctx.lineTo(N[e[1]].x, N[e[1]].y); }); ctx.stroke();
    ctx.globalAlpha = .9; ctx.fillStyle = fg;
    N.forEach(function (n) { ctx.globalAlpha = n.deg ? .9 : .35; ctx.beginPath(); ctx.arc(n.x, n.y, n.r, 0, 6.283); ctx.fill(); });
  }
  function loop() {
    t++; if (!reduce) { alpha = Math.max(.25, alpha * .995); N.forEach(function (n, i) { n.vx += Math.sin(t * .01 + i) * .02; n.vy += Math.cos(t * .013 + i) * .02; }); step(); }
    draw(); if (!reduce || drag) requestAnimationFrame(loop);
  }
  function pt(ev) { var r = c.getBoundingClientRect(); return { x: ev.clientX - r.left, y: ev.clientY - r.top }; }
  c.addEventListener("pointerdown", function (ev) { var p = pt(ev), best = null, bd = 400;
    N.forEach(function (n) { var d = (n.x - p.x) * (n.x - p.x) + (n.y - p.y) * (n.y - p.y); if (d < bd) { bd = d; best = n; } });
    if (best) { drag = best; alpha = 1; c.setPointerCapture(ev.pointerId); if (reduce) loop(); } });
  c.addEventListener("pointermove", function (ev) { if (drag) { var p = pt(ev); drag.x = p.x; drag.y = p.y; } });
  c.addEventListener("pointerup", function () { drag = null; });
  window.addEventListener("resize", function () { var ow = W, oh = H; size(); N.forEach(function (n) { n.x *= W / ow; n.y *= H / oh; }); });
})();
