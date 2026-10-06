// Photo studio: live camera -> editor (filters, draw, text, stickers) -> diary photo.
const FILTERS = [
  { n: "Original", f: "none" },
  { n: "Warm", f: "sepia(.35) saturate(1.3) contrast(1.05)" },
  { n: "Vintage", f: "sepia(.7) contrast(.95) brightness(1.05)" },
  { n: "B&W", f: "grayscale(1) contrast(1.1)" },
  { n: "Cool", f: "hue-rotate(15deg) saturate(1.2) brightness(1.05)" },
  { n: "Vivid", f: "saturate(1.6) contrast(1.1)" }
];
const STICKERS = ["💙", "🌸", "✨", "🪔", "🏯", "📍", "🎉", "🕉️", "☀️", "🐘", "❤️", "😍", "🪁", "🌈", "🙏", "⭐"];
const COLORS = ["#ffffff", "#12324a", "#38a8ee", "#ffc83d", "#ff5a7a", "#4cd28a", "#a06bff", "#000000"];

let stream = null, facing = "environment";
let base = null;                // offscreen canvas with the untouched photo
let items = [];                 // strokes, texts, stickers drawn on top
let tool = "move", color = "#ffffff", size = 6, filterIdx = 0, stamp = false, spotId = null;
let drag = null, curStroke = null;
const ed = $("#ed"), ectx = ed.getContext("2d");

// ---------- open / close ----------
function showStudio(view) {
  $("#studio").classList.remove("hidden");
  $("#cam-view").classList.toggle("hidden", view !== "cam");
  $("#ed-view").classList.toggle("hidden", view !== "ed");
}
function closeStudio() {
  stopCam();
  $("#studio").classList.add("hidden");
}
function nearestSpotId() {
  if (!me) return $("#d-spot").value;
  return SPOTS.reduce((b, s) => dist(me, s) < dist(me, b) ? s : b, SPOTS[0]).id;
}
function pickSpotForPhoto() {
  spotId = $("#d-spot").value;
  if (me && me.acc <= 150) { spotId = nearestSpotId(); $("#d-spot").value = spotId; }
}

// ---------- camera ----------
async function startCam() {
  stopCam();
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: facing }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false });
    const v = $("#cam"); v.srcObject = stream; v.classList.toggle("mirror", facing === "user");
    $("#cam-err").classList.add("hidden");
  } catch (e) {
    $("#cam-err").textContent = "Camera not available: " + (e.message || e.name) + ". Allow camera permission, or use Gallery.";
    $("#cam-err").classList.remove("hidden");
  }
}
function stopCam() { if (stream) { stream.getTracks().forEach(t => t.stop()); stream = null; } }

$("#d-cam").onclick = () => {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return toast("Camera needs the secure https link");
  pickSpotForPhoto(); showStudio("cam"); startCam();
};
$("#cam-flip").onclick = () => { facing = facing === "user" ? "environment" : "user"; startCam(); };
$("#cam-close").onclick = closeStudio;
$("#cam-snap").onclick = () => {
  const v = $("#cam"); if (!v.videoWidth) return;
  const c = document.createElement("canvas"); c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext("2d").drawImage(v, 0, 0);
  stopCam(); loadBase(c);
};
$("#cam-gallery").onclick = () => $("#d-photo").click();
$("#d-gal").onclick = () => { pickSpotForPhoto(); $("#d-photo").click(); };
$("#d-photo").onchange = async e => {
  const f = e.target.files[0]; e.target.value = "";
  if (!f) return;
  stopCam();
  const bmp = await createImageBitmap(f, { imageOrientation: "from-image" });
  loadBase(bmp);
};

// ---------- editor ----------
function loadBase(src) {
  const w = src.width, h = src.height, k = Math.min(1, 1280 / Math.max(w, h));
  base = document.createElement("canvas"); base.width = Math.round(w * k); base.height = Math.round(h * k);
  base.getContext("2d").drawImage(src, 0, 0, base.width, base.height);
  ed.width = base.width; ed.height = base.height;
  items = []; filterIdx = 0; stamp = false; $("#ed-stamp").checked = false;
  setTool("move"); buildOptions(); showStudio("ed"); render();
}
function render(forExport) {
  const c = ectx, W = ed.width, H = ed.height;
  c.save(); c.filter = FILTERS[filterIdx].f; c.drawImage(base, 0, 0); c.restore();
  for (const it of items) {
    if (it.t === "stroke") {
      c.strokeStyle = it.color; c.lineWidth = it.size; c.lineCap = c.lineJoin = "round";
      c.beginPath(); it.pts.forEach((p, i) => i ? c.lineTo(p[0], p[1]) : c.moveTo(p[0], p[1]));
      if (it.pts.length === 1) c.lineTo(it.pts[0][0] + .1, it.pts[0][1]); c.stroke();
    } else if (it.t === "text") {
      c.font = `700 ${it.size}px system-ui, "Noto Sans Devanagari", sans-serif`; c.textAlign = "center"; c.textBaseline = "middle";
      c.lineWidth = it.size / 7; c.strokeStyle = it.color === "#ffffff" ? "#00000088" : "#ffffffaa"; c.strokeText(it.text, it.x, it.y);
      c.fillStyle = it.color; c.fillText(it.text, it.x, it.y);
    } else if (it.t === "sticker") {
      c.font = `${it.size}px sans-serif`; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(it.e, it.x, it.y);
    }
  }
  if (stamp) {
    const sp = SPOTS.find(s => s.id === spotId), bar = Math.max(48, H * 0.075);
    c.fillStyle = "#0f6db5cc"; c.fillRect(0, H - bar, W, bar);
    c.fillStyle = "#fff"; c.textAlign = "left"; c.textBaseline = "middle"; c.font = `600 ${bar * .42}px system-ui, "Noto Sans Devanagari", sans-serif`;
    c.fillText(`📍 ${sp ? sp.name[lang] : ""}`, bar * .35, H - bar * .5);
    c.textAlign = "right"; c.font = `${bar * .34}px system-ui`;
    c.fillText(new Date().toLocaleDateString(lang === "mr" ? "mr-IN" : "en-IN", { day: "numeric", month: "short", year: "numeric" }), W - bar * .35, H - bar * .5);
  }
}
function pos(e) {
  const r = ed.getBoundingClientRect();
  return [(e.clientX - r.left) * ed.width / r.width, (e.clientY - r.top) * ed.height / r.height];
}
function hit(x, y) { // topmost movable item under the pointer
  for (let i = items.length - 1; i >= 0; i--) {
    const it = items[i]; if (it.t === "stroke") continue;
    const r = it.t === "text" ? Math.max(it.size, it.text.length * it.size * .35) : it.size * .6;
    if (Math.abs(it.x - x) < r && Math.abs(it.y - y) < it.size * .7) return it;
  }
  return null;
}
ed.addEventListener("pointerdown", e => {
  e.preventDefault(); ed.setPointerCapture(e.pointerId);
  const [x, y] = pos(e);
  if (tool === "draw") { curStroke = { t: "stroke", color, size: size * ed.width / 600, pts: [[x, y]] }; items.push(curStroke); render(); }
  else { const it = hit(x, y); if (it) drag = { it, dx: it.x - x, dy: it.y - y }; }
});
ed.addEventListener("pointermove", e => {
  const [x, y] = pos(e);
  if (curStroke) { curStroke.pts.push([x, y]); render(); }
  else if (drag) { drag.it.x = x + drag.dx; drag.it.y = y + drag.dy; render(); }
});
const endPtr = () => { curStroke = null; drag = null; };
ed.addEventListener("pointerup", endPtr); ed.addEventListener("pointercancel", endPtr);

function setTool(t) {
  tool = t;
  document.querySelectorAll("#ed-tools button").forEach(b => b.classList.toggle("on", b.dataset.tool === t));
  ed.style.touchAction = "none"; ed.style.cursor = t === "draw" ? "crosshair" : "grab";
  buildOptions();
}
function swatches() {
  return `<div class="sw">${COLORS.map(c => `<i data-c="${c}" style="background:${c}" class="${c === color ? "on" : ""}"></i>`).join("")}</div>`;
}
function buildOptions() {
  const o = $("#ed-opts");
  if (tool === "draw") {
    o.innerHTML = swatches() + `<input type="range" id="ed-size" min="2" max="24" value="${size}">`;
    o.querySelector("#ed-size").oninput = e => size = +e.target.value;
  } else if (tool === "text") {
    o.innerHTML = swatches() + `<div class="txt"><input id="ed-text" placeholder="${lang === "mr" ? "इथे लिहा…" : "Type here…"}" maxlength="40"><button id="ed-addtext" class="big">Add</button></div>`;
    o.querySelector("#ed-addtext").onclick = () => {
      const v = o.querySelector("#ed-text").value.trim(); if (!v) return;
      items.push({ t: "text", text: v, x: ed.width / 2, y: ed.height / 2, size: ed.width / 11, color }); o.querySelector("#ed-text").value = ""; render(); setTool("move");
    };
  } else if (tool === "sticker") {
    o.innerHTML = `<div class="stk">${STICKERS.map(s => `<button data-e="${s}">${s}</button>`).join("")}</div>`;
    o.querySelectorAll("[data-e]").forEach(b => b.onclick = () => { items.push({ t: "sticker", e: b.dataset.e, x: ed.width / 2, y: ed.height / 2, size: ed.width / 6 }); render(); setTool("move"); });
  } else if (tool === "filter") {
    o.innerHTML = `<div class="flt">${FILTERS.map((f, i) => `<button data-i="${i}" class="${i === filterIdx ? "on" : ""}">${f.n}</button>`).join("")}</div>`;
    o.querySelectorAll("[data-i]").forEach(b => b.onclick = () => { filterIdx = +b.dataset.i; render(); buildOptions(); });
  } else {
    o.innerHTML = `<p class="hint">${lang === "mr" ? "लिहिलेला मजकूर किंवा स्टिकर ओढून हलवा." : "Drag text or stickers to move them."}</p>`;
  }
  o.querySelectorAll(".sw i").forEach(i => i.onclick = () => { color = i.dataset.c; buildOptions(); });
}
document.querySelectorAll("#ed-tools button").forEach(b => b.onclick = () => setTool(b.dataset.tool));
$("#ed-undo").onclick = () => { items.pop(); render(); };
$("#ed-stamp").onchange = e => { stamp = e.target.checked; render(); };
$("#ed-retake").onclick = () => { showStudio("cam"); startCam(); };
$("#ed-cancel").onclick = closeStudio;
$("#ed-done").onclick = () => {
  render();
  ed.toBlob(b => {
    diaryPhoto = b;
    $("#d-preview").src = URL.createObjectURL(b); $("#d-preview").classList.remove("hidden");
    $("#d-spot").value = spotId || $("#d-spot").value;
    closeStudio(); toast(lang === "mr" ? "फोटो तयार! आठवण लिहा 💙" : "Photo ready! Add a note 💙");
  }, "image/jpeg", 0.88);
};
