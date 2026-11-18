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
  var STEP_MS = 650, lastStep = 0, pending = 0;
  function show(i) {
    words.forEach(function (w, j) { w.classList.toggle("is-on", j === i); w.classList.toggle("is-past", j < i); });
  }
  function step(dir) {
    if (done) return;
    if (busy) { pending = dir; return; } // remember it instead of dropping the gesture
    if (dir < 0) { if (idx === 0) return; idx--; }
    else if (idx === n - 1) { done = true; cleanup(); finish(false); return; }
    else idx++;
    intro.classList.add("is-scrolled");
    show(idx);
    busy = true; lastStep = Date.now();
    setTimeout(function () {
      busy = false;
      if (pending) { var d = pending; pending = 0; step(d); }
    }, STEP_MS);
  }
  // Trackpads keep firing "momentum" wheel events for a second or two after a flick.
  // Those must not count as new steps, but a real new swipe must never be swallowed.
  // After each step we wait for a fresh gesture: a pause in events, a clear jump in
  // speed (a new swipe on top of the momentum tail), or a direction change.
  var acc = 0, lastT = 0, lastAbs = 0, lastSign = 0, needFresh = false;
  function onWheel(e) {
    e.preventDefault();
    var d = e.deltaY;
    if (e.deltaMode === 1) d *= 16; else if (e.deltaMode === 2) d *= window.innerHeight;
    var now = Date.now(), abs = Math.abs(d), sign = d > 0 ? 1 : d < 0 ? -1 : 0;
    var gap = now - lastT;
    if (sign === 0) return;
    var fresh = gap > 140 || sign !== lastSign || abs > lastAbs * 1.6 + 6;
    lastT = now; lastAbs = abs; lastSign = sign;
    if (needFresh) {
      if (!fresh) return; // still the momentum tail of the last swipe
      needFresh = false; acc = 0;
    }
    acc += d; // if a step is still animating, step() queues this one instead of dropping it
    if (Math.abs(acc) >= 24) {
      var dir = acc > 0 ? 1 : -1;
      acc = 0; needFresh = true;
      step(dir);
    }
  }
  var ty = null;
  function onTouchStart(e) { ty = e.touches[0].clientY; }
  function onTouchMove(e) { e.preventDefault(); }
  function onTouchEnd(e) {
    if (ty === null) return;
    var dy = ty - e.changedTouches[0].clientY; ty = null;
    if (Math.abs(dy) > 30) step(dy > 0 ? 1 : -1);
  }
  function onClick() { step(1); }
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
    intro.removeEventListener("click", onClick);
  }
  window.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("touchstart", onTouchStart, { passive: true });
  window.addEventListener("touchmove", onTouchMove, { passive: false });
  window.addEventListener("touchend", onTouchEnd, { passive: true });
  window.addEventListener("keydown", onKey, true);
  intro.addEventListener("click", onClick);
  show(0);
})();
