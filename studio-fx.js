/* Casho Studio effects: beauty, colour looks, brightness and blurred background for the computer camera.
   Runs in a worker, so it keeps going when the seller switches to another window or tab. Frame in -> frame out: it never turns, crops or mirrors
   the picture (the output has the same size and the same way up as the input). If anything goes wrong with a frame, the ORIGINAL frame is sent on. */
let params = { beauty: 0, look: "none", bright: 0, blur: false };
let seg = null, segTried = false, maskCanvas = null, maskReady = false, maskFixed = false, n = 0;
let W = 0, H = 0, out, base, person, smooth, o, b, pc, sc;   /* canvases and contexts, made for the picture size */

function setup(w, h) {
  W = w; H = h;
  out = new OffscreenCanvas(w, h); o = out.getContext("2d");
  base = new OffscreenCanvas(w, h); b = base.getContext("2d");
  person = new OffscreenCanvas(w, h); pc = person.getContext("2d");
  smooth = new OffscreenCanvas(w, h); sc = smooth.getContext("2d");
}

async function initSegmenter() {
  if (segTried) return; segTried = true;
  let stage = "start";
  try {
    const V = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.14";
    /* a classic worker: the CommonJS build of MediaPipe fills self.exports (read as text, since the server does not send it as a script) */
    stage = "bundle"; self.exports = {}; (0, eval)(await (await fetch(V + "/vision_bundle.cjs")).text());
    const m = self.exports; stage = "wasm";
    const files = await m.FilesetResolver.forVisionTasks(V + "/wasm"); stage = "model";
    seg = await m.ImageSegmenter.createFromOptions(files, {
      baseOptions: { modelAssetPath: "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/latest/selfie_segmenter.tflite", delegate: "GPU" },
      runningMode: "VIDEO", outputCategoryMask: true, outputConfidenceMasks: false });
    postMessage({ type: "seg", ok: true });
  } catch (e) { seg = null; postMessage({ type: "seg", ok: false, error: stage + ": " + String(e && e.message || e) }); }
}

const LOOKS = { none: "", warm: "saturate(1.06)", cool: "", vivid: "saturate(1.35) contrast(1.08)", mono: "grayscale(1) contrast(1.1)", glow: "" };
function filterString() {
  let f = LOOKS[params.look] || "";
  if (Math.abs(params.bright) > 0.01) f += " brightness(" + (1 + params.bright * 0.25).toFixed(3) + ")";
  return f.trim() || "none";
}

/* the person mask (white = person), updated every 3rd picture; the segmenter reads the finished base picture */
function updateMask() {
  if (!seg || maskFixed) return;
  try {
    seg.segmentForVideo(base, performance.now(), (r) => {
      const cm = r.categoryMask; if (!cm) return;
      const a = cm.getAsUint8Array(), mw = cm.width, mh = cm.height;
      if (!maskCanvas || maskCanvas.width !== mw || maskCanvas.height !== mh) maskCanvas = new OffscreenCanvas(mw, mh);
      const img = new ImageData(mw, mh);
      for (let i = 0; i < a.length; i++) { const v = a[i] > 0 ? 255 : 0; img.data[i * 4 + 3] = v; }   /* alpha only: person = opaque */
      maskCanvas.getContext("2d").putImageData(img, 0, 0); maskReady = true;
    });
  } catch (e) { /* keep the last mask */ }
}

function render(frame) {
  const w = frame.displayWidth, h = frame.displayHeight;
  if (w !== W || h !== H) { setup(w, h); maskReady = false; }
  /* 1. the picture with the look and the brightness */
  b.globalCompositeOperation = "source-over"; b.globalAlpha = 1; b.filter = filterString(); b.drawImage(frame, 0, 0, w, h); b.filter = "none";
  if (params.look === "warm") { b.globalCompositeOperation = "soft-light"; b.fillStyle = "rgba(255,150,40,0.28)"; b.fillRect(0, 0, w, h); }
  if (params.look === "cool") { b.globalCompositeOperation = "soft-light"; b.fillStyle = "rgba(60,110,255,0.26)"; b.fillRect(0, 0, w, h); }
  if (params.look === "glow") { b.globalCompositeOperation = "screen"; b.globalAlpha = 0.4; b.filter = "blur(" + Math.round(w / 90) + "px)"; b.drawImage(frame, 0, 0, w, h); b.filter = "none"; }
  b.globalCompositeOperation = "source-over"; b.globalAlpha = 1;
  /* 2. who is in the picture (only when something needs it) */
  const needMask = params.blur || params.beauty > 0;
  if (needMask && !seg && !segTried) initSegmenter();
  if (needMask && seg && n % 3 === 0) updateMask();
  const haveMask = needMask && seg && maskReady;
  /* 3. the background blur: sharp person over a blurred copy */
  o.globalCompositeOperation = "source-over"; o.globalAlpha = 1; o.clearRect(0, 0, w, h);
  if (params.blur && haveMask) {
    o.filter = "blur(" + Math.round(w / 40) + "px)"; o.drawImage(base, 0, 0, w, h); o.filter = "none";
    pc.globalCompositeOperation = "source-over"; pc.clearRect(0, 0, w, h); pc.drawImage(base, 0, 0, w, h);
    pc.globalCompositeOperation = "destination-in"; pc.filter = "blur(2px)"; pc.drawImage(maskCanvas, 0, 0, w, h); pc.filter = "none"; pc.globalCompositeOperation = "source-over";
    o.drawImage(person, 0, 0);
  } else o.drawImage(base, 0, 0, w, h);
  /* 4. beauty: a soft copy mixed in, on the person only when we know where the person is (the product stays sharp) */
  if (params.beauty > 0) {
    const amount = [0, 0.3, 0.45, 0.6][params.beauty], px = [0, 2, 3, 4][params.beauty];
    sc.globalCompositeOperation = "source-over"; sc.clearRect(0, 0, w, h); sc.filter = "blur(" + Math.max(1, Math.round(px * w / 720)) + "px)"; sc.drawImage(out, 0, 0, w, h); sc.filter = "none";
    if (haveMask) { sc.globalCompositeOperation = "destination-in"; sc.drawImage(maskCanvas, 0, 0, w, h); sc.globalCompositeOperation = "source-over"; }
    o.globalAlpha = haveMask ? amount : amount * 0.5; o.drawImage(smooth, 0, 0); o.globalAlpha = 1;
    o.globalCompositeOperation = "soft-light"; o.fillStyle = "rgba(255,255,255," + (params.beauty * 0.03).toFixed(2) + ")"; o.fillRect(0, 0, w, h); o.globalCompositeOperation = "source-over";   /* a slight lift of brightness */
  }
  return new VideoFrame(out, { timestamp: frame.timestamp, duration: frame.duration || undefined });
}

onmessage = (e) => {
  const m = e.data;
  if (m.type === "testMask") {   /* used by the self-check only: a fixed person mask (the left half of the picture) */
    maskCanvas = new OffscreenCanvas(64, 64); const t = maskCanvas.getContext("2d"); t.fillStyle = "#000"; t.fillRect(0, 0, 32, 64); maskReady = true; maskFixed = true; seg = seg || {}; segTried = true; return;
  }
  if (m.type === "params") { params = Object.assign(params, m.params); if (!maskFixed && !(params.blur || params.beauty > 0)) maskReady = false; return; }
  if (m.type !== "start") return;
  params = Object.assign(params, m.params);
  const ts = new TransformStream({
    transform(frame, controller) {
      n++;
      try { const f = render(frame); frame.close(); controller.enqueue(f); }
      catch (err) { controller.enqueue(frame); }   /* the original picture goes on */
    }
  });
  m.readable.pipeThrough(ts).pipeTo(m.writable).catch(() => {});
};
