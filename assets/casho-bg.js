/* Casho page background: "live market". Soft mint rings pulse out from random points (a live signal, a bid landing) and small gold diamonds
   (the same diamond as the site's bullets) drift slowly upward like sparks of value. The pointer makes a small pulse. Starts when the browser is idle,
   shows one still frame under reduced motion, pauses when the tab is hidden. */
(function () {
  var c = document.getElementById("bg"); if (!c || !c.getContext) return;
  function start() {
    var x = c.getContext("2d"), cs = getComputedStyle(document.documentElement);
    var mint = cs.getPropertyValue("--mint").trim() || "#48C5A2", gold = cs.getPropertyValue("--gold").trim() || "#BFA060";
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, hover = matchMedia("(hover: hover)").matches;
    var weak = (navigator.hardwareConcurrency || 8) <= 4;
    var W = 0, H = 0, rings = [], sparks = [], last = 0, nextPulse = 0, lastMove = 0, T = 0;
    function size() {
      W = innerWidth; H = innerHeight; c.width = W; c.height = H; x.setTransform(1, 0, 0, 1, 0, 0); x.lineWidth = 1;
      var n = Math.max(18, Math.min(weak ? 28 : 46, Math.round(W * H / 30000)));
      while (sparks.length < n) sparks.push(spark(true));
      sparks.length = n;
    }
    function spark(anywhere) {
      return { x: Math.random() * W, y: anywhere ? Math.random() * H : H + 10, s: 3 + Math.random() * 5.5, vy: .14 + Math.random() * .32, sway: Math.random() * 6.28, sp: .004 + Math.random() * .01, a: .3 + Math.random() * .5, g: Math.random() < .72 };
    }
    function pulse(px, py, big) {
      var life = big ? 7000 : 3200, R = big ? 150 + Math.random() * 210 : 70;
      for (var i = 0; i < (big ? 3 : 2); i++) rings.push({ x: px, y: py, t0: T + i * (big ? 650 : 380), life: life, R: R, a: big ? .42 : .45, g: i === 1 });
    }
    function diamond(px, py, s, filled) { x.beginPath(); x.moveTo(px, py - s); x.lineTo(px + s, py); x.lineTo(px, py + s); x.lineTo(px - s, py); x.closePath(); if (filled) x.fill(); else x.stroke(); }
    function draw(dt) {
      x.clearRect(0, 0, W, H);
      var i, r, k, e, a;
      for (i = rings.length - 1; i >= 0; i--) {
        r = rings[i]; e = (T - r.t0) / r.life; if (e < 0) continue; if (e >= 1) { rings.splice(i, 1); continue; }
        a = r.a * (1 - e) * (1 - e); if (a < .004) continue;
        x.strokeStyle = r.g ? gold : mint; x.lineWidth = 1.5; x.globalAlpha = a; x.beginPath(); x.arc(r.x, r.y, r.R * (1 - Math.pow(1 - e, 2.2)), 0, 6.2832); x.stroke();
      }
      for (i = 0; i < sparks.length; i++) {
        k = sparks[i];
        if (!reduce) { k.y -= k.vy * dt / 16; k.sway += k.sp * dt / 16; k.x += Math.sin(k.sway) * .12; if (k.y < -12) sparks[i] = spark(false); }
        x.globalAlpha = k.a * (.65 + .35 * Math.sin(k.sway * 2.3));
        x.fillStyle = k.g ? gold : mint; x.strokeStyle = x.fillStyle;
        diamond(k.x, k.y, k.s, k.s < 4);
      }
      x.globalAlpha = 1;
    }
    function loop(now) {
      var dt = Math.min(64, now - (last || now)); last = now;
      if (!document.hidden) { T += dt; if (T >= nextPulse) { pulse(Math.random() * W, Math.random() * H, true); nextPulse = T + 1500 + Math.random() * 1700; } draw(dt); }
      requestAnimationFrame(loop);
    }
    size();
    for (var q = 0; q < 3; q++) pulse(Math.random() * W, Math.random() * H, true);
    if (reduce) { T = 2200; draw(0); addEventListener("resize", function () { size(); draw(0); }); return; }
    addEventListener("resize", size);
    if (hover) addEventListener("pointermove", function (e) { if (T - lastMove > 700) { lastMove = T; pulse(e.clientX, e.clientY, false); } }, { passive: true });
    requestAnimationFrame(loop);
  }
  if ("requestIdleCallback" in window) requestIdleCallback(start, { timeout: 2500 }); else setTimeout(start, 1500);
})();
