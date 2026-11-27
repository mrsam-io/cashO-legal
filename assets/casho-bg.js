/* Casho page background: a lab sheet in Casho colours. A mint measuring grid that drifts with the scroll, slow gold nodes joined by hairlines,
   and a probe that follows the pointer. Starts when the browser is idle, stays still under reduced motion, pauses when the tab is hidden. */
(function () {
  var c = document.getElementById("bg"); if (!c || !c.getContext) return;
  function start() {
    var x = c.getContext("2d"), cs = getComputedStyle(document.documentElement);
    var mint = cs.getPropertyValue("--mint").trim() || "#48C5A2", gold = cs.getPropertyValue("--gold").trim() || "#BFA060";
    var font = getComputedStyle(document.body).fontFamily || "sans-serif";
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches, hover = matchMedia("(hover: hover)").matches;
    var weak = (navigator.hardwareConcurrency || 8) <= 4;
    var W = 0, H = 0, D = 1, CELL = 56, nodes = [], px = -1, py = -1, SY = 0;
    function size() {
      D = 1; W = innerWidth; H = innerHeight; c.width = W; c.height = H; x.setTransform(1, 0, 0, 1, 0, 0); x.lineWidth = 1;
      var n = Math.max(30, Math.min(weak ? 42 : 72, Math.round(W * H / 24000)));
      while (nodes.length < n) nodes.push({ x: Math.random() * W, y: Math.random() * H, vx: (Math.random() - .5) * .22, vy: (Math.random() - .5) * .22 });
      nodes.length = n;
    }
    function a(v) { x.globalAlpha = v; }
    function draw() {
      x.clearRect(0, 0, W, H);
      var off = (SY * .12) % (CELL * 4), i, j, p, q, d;
      x.strokeStyle = mint;
      for (var gx = 0, k = 0; gx <= W + CELL; gx += CELL, k++) { a(k % 4 === 0 ? .1 : .05); x.beginPath(); x.moveTo(gx + .5, 0); x.lineTo(gx + .5, H); x.stroke(); }
      for (var gy = -CELL * 4, m = 0; gy <= H + CELL; gy += CELL, m++) { a(m % 4 === 0 ? .1 : .05); x.beginPath(); x.moveTo(0, gy + off + .5); x.lineTo(W, gy + off + .5); x.stroke(); }
      x.strokeStyle = gold;
      for (i = 0; i < nodes.length; i++) {
        p = nodes[i];
        if (!reduce) { p.x += p.vx; p.y += p.vy; if (p.x < -10) p.x = W + 10; if (p.x > W + 10) p.x = -10; if (p.y < -10) p.y = H + 10; if (p.y > H + 10) p.y = -10; }
        for (j = i + 1; j < nodes.length; j++) { q = nodes[j]; d = Math.hypot(p.x - q.x, p.y - q.y); if (d < 150) { a((1 - d / 150) * .3); x.beginPath(); x.moveTo(p.x, p.y); x.lineTo(q.x, q.y); x.stroke(); } }
      }
      x.fillStyle = gold; a(.7);
      for (i = 0; i < nodes.length; i++) x.fillRect(nodes[i].x - 1, nodes[i].y - 1, 2, 2);
      if (px >= 0) {
        x.strokeStyle = gold;
        for (i = 0; i < nodes.length; i++) { p = nodes[i]; d = Math.hypot(p.x - px, p.y - py); if (d < 190) { a((1 - d / 190) * .45); x.beginPath(); x.moveTo(px, py); x.lineTo(p.x, p.y); x.stroke(); } }
        a(.7); x.strokeStyle = mint; x.beginPath(); x.moveTo(px - 9, py + .5); x.lineTo(px + 10, py + .5); x.moveTo(px + .5, py - 9); x.lineTo(px + .5, py + 10); x.stroke();
        x.fillStyle = mint; x.font = "12px " + font; x.fillText((px / CELL).toFixed(1) + ", " + ((py + SY * .12) / CELL).toFixed(1), px + 14, py - 10);
      }
      a(1);
    }
    function loop() { if (!document.hidden) draw(); requestAnimationFrame(loop); }
    size(); draw();
    addEventListener("resize", function () { size(); draw(); });
    addEventListener("scroll", function () { SY = scrollY; if (reduce) draw(); }, { passive: true });
    if (!reduce) { if (hover) addEventListener("pointermove", function (e) { px = e.clientX; py = e.clientY; }, { passive: true }); document.addEventListener("pointerleave", function () { px = -1; py = -1; }); requestAnimationFrame(loop); }
  }
  if ("requestIdleCallback" in window) requestIdleCallback(start, { timeout: 2500 }); else setTimeout(start, 1500);
})();
