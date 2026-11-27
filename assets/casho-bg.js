/* Casho page background: "live market". Small gold diamonds
   (the same diamond as the site's bullets) drift slowly upward like sparks of value. Starts when the browser is idle,
   shows one still frame under reduced motion, pauses when the tab is hidden. */
(function () {
  var c = document.getElementById("bg"); if (!c || !c.getContext) return;
  function start() {
    var x = c.getContext("2d"), cs = getComputedStyle(document.documentElement);
    var mint = cs.getPropertyValue("--mint").trim() || "#48C5A2", gold = cs.getPropertyValue("--gold").trim() || "#BFA060";
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var weak = (navigator.hardwareConcurrency || 8) <= 4;
    var W = 0, H = 0, sparks = [], last = 0;
    function size() {
      W = innerWidth; H = innerHeight; c.width = W; c.height = H; x.setTransform(1, 0, 0, 1, 0, 0); x.lineWidth = 1;
      var n = Math.max(18, Math.min(weak ? 28 : 46, Math.round(W * H / 30000)));
      while (sparks.length < n) sparks.push(spark(true));
      sparks.length = n;
    }
    function spark(anywhere) {
      return { x: Math.random() * W, y: anywhere ? Math.random() * H : H + 10, s: 3 + Math.random() * 5.5, vy: .14 + Math.random() * .32, sway: Math.random() * 6.28, sp: .004 + Math.random() * .01, a: .3 + Math.random() * .5, g: Math.random() < .72 };
    }
    function diamond(px, py, s, filled) { x.beginPath(); x.moveTo(px, py - s); x.lineTo(px + s, py); x.lineTo(px, py + s); x.lineTo(px - s, py); x.closePath(); if (filled) x.fill(); else x.stroke(); }
    function draw(dt) {
      x.clearRect(0, 0, W, H);
      var i, k;
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
      if (!document.hidden) { draw(dt); }
      requestAnimationFrame(loop);
    }
    size();
    if (reduce) { draw(0); addEventListener("resize", function () { size(); draw(0); }); return; }
    addEventListener("resize", size);
    requestAnimationFrame(loop);
  }
  if ("requestIdleCallback" in window) requestIdleCallback(start, { timeout: 2500 }); else setTimeout(start, 1500);
})();
