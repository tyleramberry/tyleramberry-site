// Home intro: name, three roles, then the hero. One step per gesture, no matter how
// hard you scroll. After it finishes the intro is removed, so the hero is the top wall.
(function () {
  var intro = document.querySelector("[data-intro]");
  if (!intro) return;
  var hero = document.querySelector(".hero");
  var root = document.documentElement;
  function finish(instant) {
    root.classList.remove("intro-lock");
    intro.classList.add("is-done");
    if (hero) hero.classList.add("is-in");
    setTimeout(function () { intro.classList.add("is-gone"); }, instant ? 0 : 600);
    window.scrollTo(0, 0);
  }
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || location.hash) { finish(true); return; }
  if ("scrollRestoration" in history) history.scrollRestoration = "manual";
  window.scrollTo(0, 0);
  root.classList.add("intro-lock");
  var words = intro.querySelectorAll(".w"), n = words.length, idx = 0, busy = false, done = false;
  var STEP_MS = 850, quietTimer = null;
  function show(i) {
    words.forEach(function (w, j) { w.classList.toggle("is-on", j === i); w.classList.toggle("is-past", j < i); });
  }
  function step(dir) {
    if (busy || done) return;
    if (dir < 0) { if (idx === 0) return; idx--; }
    else if (idx === n - 1) { done = true; cleanup(); finish(false); return; }
    else idx++;
    intro.classList.add("is-scrolled");
    show(idx);
    busy = true;
    setTimeout(function () { busy = false; }, STEP_MS);
  }
  // A fast trackpad flick fires dozens of wheel events: take one step, then ignore
  // the rest until the gesture goes quiet AND the step animation has played.
  var gestureLive = false;
  function onWheel(e) {
    e.preventDefault();
    if (Math.abs(e.deltaY) < 4) return;
    clearTimeout(quietTimer);
    quietTimer = setTimeout(function () { gestureLive = false; }, 180);
    if (gestureLive) return;
    gestureLive = true;
    step(e.deltaY > 0 ? 1 : -1);
  }
  var ty = null;
  function onTouchStart(e) { ty = e.touches[0].clientY; }
  function onTouchMove(e) { e.preventDefault(); }
  function onTouchEnd(e) {
    if (ty === null) return;
    var dy = ty - e.changedTouches[0].clientY; ty = null;
    if (Math.abs(dy) > 30) step(dy > 0 ? 1 : -1);
  }
  function onKey(e) {
    var k = e.key;
    if (["ArrowDown", "PageDown", " ", "Enter"].indexOf(k) > -1) { e.preventDefault(); step(1); }
    else if (["ArrowUp", "PageUp"].indexOf(k) > -1) { e.preventDefault(); step(-1); }
    else if (k === "Escape" || k === "End") { e.preventDefault(); done = true; cleanup(); finish(false); }
  }
  function cleanup() {
    window.removeEventListener("wheel", onWheel);
    window.removeEventListener("touchstart", onTouchStart);
    window.removeEventListener("touchmove", onTouchMove);
    window.removeEventListener("touchend", onTouchEnd);
    window.removeEventListener("keydown", onKey, true);
  }
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("keydown", onKey, true);
  show(0);
})();
