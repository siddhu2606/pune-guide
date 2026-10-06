const $ = s => document.querySelector(s);
const RADIUS = 70; // metres: how close she must be to trigger a spot
const EMOJI = { bhidewada: "📚", mandai: "🥭", sarasbaug: "🌳", fergusson: "🎓", chaturshringi: "🛕", sppu: "🏫", osho: "🎋", shinde: "🪦", kasba: "🐘", lalmahal: "🏰", shaniwarwada: "🏯", dagdusheth: "🪔", tulshibaug: "🛍️", vishrambaug: "🏛️", kelkar: "🖼️", parvati: "⛰️", pataleshwar: "🕉️", agakhan: "🕊️" };
const T = {
  mr: { title: "पुणे वारसा", listen: "▶ ऐका", next: "पुढचा थांबा: ", here: "✅ मी इथे आहे", dir: "🚶 मार्ग", mem: "📷 आठवण", start: "📍 चालायला सुरुवात", stop: "⏹ थांबवा",
        passport: "तुमचा वारसा पासपोर्ट", visited: n => `${n} / ${SPOTS.length} ठिकाणे पाहिली`, diary: "आठवणींची डायरी", save: "आठवण जपा 💙", finding: "तुम्हाला शोधतोय…",
        newStamp: n => `🎉 नवीन स्टॅम्प: ${n}!`, hello: "नमस्कार" },
  en: { title: "Pune Heritage", listen: "▶ Listen", next: "Next: ", here: "✅ I'm here", dir: "🚶 Directions", mem: "📷 Memory", start: "📍 Start walking tour", stop: "⏹ Stop tour",
        passport: "Your Heritage Passport", visited: n => `${n} of ${SPOTS.length} places visited`, diary: "Memory Diary", save: "Save memory 💙", finding: "Finding you…",
        newStamp: n => `🎉 New stamp: ${n}!`, hello: "Hello" }
};
let lang = localStorage.lang || "mr";
let userName = localStorage.userName || "";
let visited = new Set(JSON.parse(localStorage.visited || "[]"));
let current = null, me = null, watchId = null, routeLine = null;
let tripId = localStorage.trip || "both";
if (!TRIPS.some(t => t.id === tripId)) tripId = "both";
const trip = () => TRIPS.find(t => t.id === tripId);
const tripSpots = () => trip().ids.map(id => SPOTS.find(s => s.id === id));
const nextOf = id => { const ids = trip().ids, i = ids.indexOf(id); return i >= 0 && i < ids.length - 1 ? SPOTS.find(s => s.id === ids[i + 1]) : null; };
let tripLine = null;
const announced = new Set();
const markers = {};
const spot = id => SPOTS.find(s => s.id === id);
const idx = id => { const i = trip().ids.indexOf(id); return (i < 0 ? SPOTS.findIndex(s => s.id === id) : i) + 1; };

// ---------- Welcome ----------
$("#w-input").value = userName;
document.querySelectorAll(".w-lang button").forEach(b => b.onclick = () => {
  document.querySelectorAll(".w-lang button").forEach(x => x.classList.toggle("on", x === b));
  setLang(b.dataset.l);
});
$("#w-go").onclick = () => {
  userName = $("#w-input").value.trim(); localStorage.userName = userName;
  $("#welcome").classList.add("gone");
  setTimeout(() => $("#welcome").remove(), 700);
  unlockSpeech();
  setTimeout(() => map.invalidateSize(), 100);
  setTimeout(() => speak(lang === "mr" ? `नमस्कार ${userName}! चला, जुन्या पुण्याची सफर सुरू करूया.` : `Hello ${userName}! Let's begin our walk through old Pune.`), 500);
};
function refreshWelcome() {
  document.querySelectorAll(".w-lang button").forEach(x => x.classList.toggle("on", x.dataset.l === lang));
  $("#w-go").textContent = lang === "mr" ? "सफर सुरू करा ✨" : "Begin the journey ✨";
}

// ---------- Map ----------
const map = L.map("map", { zoomControl: false }).setView([18.5164, 73.8556], 16);
L.control.zoom({ position: "topright" }).addTo(map);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 19, attribution: "© OpenStreetMap contributors" }).addTo(map);
const meMarker = L.marker([0, 0], { icon: L.divIcon({ className: "", html: '<div class="me-dot"></div>', iconSize: [18, 18] }), zIndexOffset: 1000 });

function pinIcon(s, sel) {
  return L.divIcon({ className: "", iconSize: [34, 34], iconAnchor: [17, 34],
    html: `<div class="pin ${visited.has(s.id) ? "v" : ""} ${sel ? "sel" : ""}"><span>${visited.has(s.id) ? "✓" : idx(s.id)}</span></div>` });
}
SPOTS.forEach(s => {
  markers[s.id] = L.marker([s.lat, s.lng], { icon: pinIcon(s) }).addTo(map).on("click", () => openSpot(s.id, false));
});
function refreshPins() { SPOTS.forEach(s => markers[s.id].setIcon(pinIcon(s, current && current.id === s.id))); }
function applyTrip(fit) {
  const ids = trip().ids;
  SPOTS.forEach(s => ids.includes(s.id) ? markers[s.id].addTo(map) : markers[s.id].remove());
  if (tripLine) tripLine.remove();
  const pts = tripSpots().map(s => [s.lat, s.lng]);
  tripLine = L.polyline(pts, { color: "#38a8ee", weight: 4, opacity: .7, dashArray: "2 9", lineCap: "round" }).addTo(map);
  if (current && !ids.includes(current.id)) closePanel();
  refreshPins(); renderCards();
  $("#tripchip").textContent = trip().emoji + " " + trip().name[lang];
  if (fit) map.fitBounds(tripLine.getBounds(), { padding: [40, 40] });
}
function renderTrips() {
  $("#t-title").textContent = lang === "mr" ? "तुमची सफर निवडा" : "Choose your trip";
  $("#trips").innerHTML = TRIPS.map(t => {
    const done = t.ids.filter(id => visited.has(id)).length;
    return `<div class="trip ${t.id === tripId ? "on" : ""}">
      <div class="t-e">${t.emoji}</div><h3>${t.name[lang]}</h3><p>${t.desc[lang]}</p>
      <div class="chips"><span>${t.ids.length} ${lang === "mr" ? "ठिकाणे" : "stops"}</span><span>✓ ${done}/${t.ids.length}</span></div>
      <button class="big" data-t="${t.id}">${t.id === tripId ? (lang === "mr" ? "नकाशावर पहा 🗺️" : "Show on map 🗺️") : (lang === "mr" ? "ही सफर सुरू करा" : "Start this trip")}</button></div>`;
  }).join("");
  document.querySelectorAll("#trips button").forEach(b => b.onclick = () => selectTrip(b.dataset.t));
}
function selectTrip(id) {
  tripId = id; localStorage.trip = id; announced.clear();
  closePanel(); applyTrip(true); renderTrips(); showTab("map");
  toast(trip().emoji + " " + trip().name[lang]);
}
$("#tripchip").onclick = () => showTab("trips");

function dist(a, b) { // haversine, metres
  const R = 6371000, r = x => x * Math.PI / 180;
  const dLa = r(b.lat - a.lat), dLo = r(b.lng - a.lng);
  const h = Math.sin(dLa / 2) ** 2 + Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// ---------- Cards ----------
function renderCards() {
  $("#cards").innerHTML = tripSpots().map(s => {
    const d = me ? dist(me, s) : null;
    const dt = d == null ? "" : d < 1000 ? Math.round(d) + " m" : (d / 1000).toFixed(1) + " km";
    return `<div class="scard ${visited.has(s.id) ? "v" : ""} ${d != null && d < RADIUS ? "near" : ""}" data-id="${s.id}">
      <div class="n">${visited.has(s.id) ? "✓" : idx(s.id)}</div><b>${s.name[lang]}</b><small>${dt}</small></div>`;
  }).join("");
  document.querySelectorAll(".scard").forEach(c => c.onclick = () => openSpot(c.dataset.id, false));
}

// ---------- Language ----------
function setLang(l) {
  lang = l; localStorage.lang = l;
  $("#lang-mr").classList.toggle("on", l === "mr");
  $("#lang-en").classList.toggle("on", l === "en");
  const t = T[l];
  $("#h-title").textContent = t.title;
  $("#p-play").textContent = t.listen; $("#p-here").textContent = t.here; $("#p-walk").textContent = t.dir; $("#p-memory").textContent = t.mem;
  $("#locate").textContent = watchId !== null ? t.stop : t.start; $("#pick").textContent = l === "mr" ? "📍 माझे ठिकाण" : "📍 Location";
  $("#j-title").textContent = t.passport; $("#d-title").textContent = t.diary;
  $("#diary-form .big").textContent = t.save;
  SPOTS.forEach(s => markers[s.id].bindTooltip(s.name[l]));
  fillSpotSelect(); renderCards(); renderStamps(); refreshWelcome(); renderTrips(); $("#tripchip").textContent = trip().emoji + " " + trip().name[l];
  if (current) openSpot(current.id, false, true);
  renderEntries(); updateVoiceList();
}
$("#lang-mr").onclick = () => setLang("mr");
$("#lang-en").onclick = () => setLang("en");

// ---------- Spot panel ----------
function openSpot(id, autoSpeak, keepView) {
  current = spot(id);
  const nx = nextOf(id);
  $("#p-name").textContent = `${idx(id)}. ${current.name[lang]}`;
  $("#p-story").textContent = current.story[lang];
  $("#p-next").classList.toggle("hidden", !nx); $("#p-walk").classList.toggle("hidden", !nx);
  if (nx) $("#p-next").textContent = "➡ " + T[lang].next + nx.name[lang];
  else toast(lang === "mr" ? "🎉 ही सफर पूर्ण झाली!" : "🎉 Trip complete!");
  $("#panel").classList.remove("hidden");
  $("#cards").classList.add("hidden"); $("#recenter").style.bottom = "50%";
  if (!keepView) map.flyTo([current.lat, current.lng], 17, { duration: 0.8 });
  refreshPins();
  if (autoSpeak) speak(current.story[lang]);
}
function closePanel() {
  $("#panel").classList.add("hidden"); $("#cards").classList.remove("hidden"); $("#recenter").style.bottom = "150px";
  current = null; stopSpeak(); refreshPins();
}
$("#p-close").onclick = closePanel;
$("#p-play").onclick = () => current && speak(current.story[lang]);
$("#p-stop").onclick = stopSpeak;
$("#p-memory").onclick = () => { showTab("diary"); $("#d-spot").value = current.id; };
$("#p-here").onclick = () => markVisited(current.id);
$("#p-next").onclick = () => { const nx = nextOf(current.id); if (!nx) return; showRoute(current, nx); openSpot(nx.id, false, true); };
$("#p-walk").onclick = () => {
  const nx = nextOf(current.id); if (!nx) return;
  const from = me ? `${me.lat},${me.lng}` : `${current.lat},${current.lng}`;
  window.open(`https://www.openstreetmap.org/directions?engine=fossgis_osrm_foot&route=${from};${nx.lat},${nx.lng}`, "_blank");
};
function showRoute(a, b) {
  if (routeLine) map.removeLayer(routeLine);
  const from = me || a;
  routeLine = L.polyline([[from.lat, from.lng], [b.lat, b.lng]], { color: "#0f6db5", weight: 5, dashArray: "2 10", lineCap: "round" }).addTo(map);
  map.fitBounds(routeLine.getBounds(), { padding: [60, 60] });
}

// ---------- Visited / passport ----------
function markVisited(id) {
  if (visited.has(id)) return toast(lang === "mr" ? "हा स्टॅम्प आधीच मिळाला आहे 💙" : "You already have this stamp 💙");
  visited.add(id); localStorage.visited = JSON.stringify([...visited]);
  toast(T[lang].newStamp(spot(id).name[lang])); confetti(); refreshPins(); renderCards(); renderStamps(); renderTrips();
}
function renderStamps() {
  $("#stamps").innerHTML = SPOTS.map(s => `<div class="stamp ${visited.has(s.id) ? "v" : ""}"><div class="e">${EMOJI[s.id]}</div><b>${s.name[lang]}</b></div>`).join("");
  $("#j-bar").style.width = (visited.size / SPOTS.length * 100) + "%";
  $("#j-count").textContent = T[lang].visited(visited.size);
}
$("#reset").onclick = () => { if (confirm("Reset all stamps?")) { visited.clear(); localStorage.visited = "[]"; announced.clear(); refreshPins(); renderCards(); renderStamps(); } };

function toast(msg) {
  const t = $("#toast"); t.textContent = msg; t.classList.remove("hidden");
  clearTimeout(toast.t); toast.t = setTimeout(() => t.classList.add("hidden"), 3500);
}
function confetti() {
  const box = $("#confetti"), em = ["💙", "✨", "🎉", "🪁", "☁️", "🌸"];
  for (let i = 0; i < 28; i++) {
    const e = document.createElement("i"); e.textContent = em[i % em.length];
    e.style.left = Math.random() * 100 + "%"; e.style.fontSize = 16 + Math.random() * 18 + "px"; e.style.animationDelay = Math.random() * .6 + "s";
    box.appendChild(e); setTimeout(() => e.remove(), 3200);
  }
}

// ---------- Live location ----------
const secure = window.isSecureContext;
if (!secure) {
  $("#banner").classList.remove("hidden");
  $("#banner").textContent = "⚠️ Live location needs a secure (https) link. Open the app from its https address, or use “I'm here” on each spot.";
}
function geoError(e) {
  const msg = { 1: "Location permission denied — allow it in the browser/site settings.", 2: "Can't get a GPS fix. Go outside or turn on Location.", 3: "Location timed out. Retrying…" }[e.code] || e.message;
  const s = $("#status"); s.textContent = "⚠️ " + msg; s.classList.remove("hidden");
}
$("#locate").onclick = () => {
  if (manual && watchId === null) { manual = false; meMarker.dragging && meMarker.dragging.disable(); }
  if (watchId !== null) {
    navigator.geolocation.clearWatch(watchId); watchId = null;
    $("#locate").classList.remove("on"); $("#locate").textContent = T[lang].start;
    $("#status").classList.add("hidden"); $("#recenter").classList.add("hidden"); meMarker.remove(); if (accCircle) { accCircle.remove(); accCircle = null; } firstFix = true; goodFix = false; me = null; renderCards(); return;
  }
  if (!navigator.geolocation) return geoError({ message: "This browser has no GPS support." });
  if (!secure) return geoError({ message: "Needs https — see the yellow note above." });
  manual = false; meMarker.dragging && meMarker.dragging.disable();
  unlockSpeech();
  $("#locate").classList.add("on"); $("#locate").textContent = T[lang].stop;
  const s = $("#status"); s.textContent = T[lang].finding; s.classList.remove("hidden");
  watchId = navigator.geolocation.watchPosition(onPos, geoError, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
};
$("#recenter").onclick = () => me && map.flyTo([me.lat, me.lng], 17);
let firstFix = true, accCircle = null, manual = false, goodFix = false;
// Manual mode: she (or you) taps the map to say "I am here"; the marker can then be dragged.
function setManualLocation(lat, lng, zoomTo = true) {
  if (watchId !== null) $("#locate").click(); // stop GPS
  manual = true; firstFix = false;
  meMarker.options.draggable = true; meMarker.dragging && meMarker.dragging.enable();
  onPos({ coords: { latitude: lat, longitude: lng, accuracy: 10 } });
  if (zoomTo) map.flyTo([lat, lng], 17);
}
function pickLocation() {
  toast(lang === "mr" ? "नकाशावर तुमचे ठिकाण निवडा 👆" : "Tap the map where you are 👆");
  map.once("click", e => setManualLocation(e.latlng.lat, e.latlng.lng, false));
}
meMarker.on("dragend", () => { const p = meMarker.getLatLng(); onPos({ coords: { latitude: p.lat, longitude: p.lng, accuracy: 10 } }); });
// ----- Location sheet: GPS / tap map / "I'm at a spot" / search a place -----
function locState() {
  const t = !me ? (lang === "mr" ? "अजून ठिकाण सेट नाही." : "Location not set yet.")
    : manual ? `📌 Manual location (${me.lat.toFixed(4)}, ${me.lng.toFixed(4)})`
    : `🎯 GPS · accuracy ±${me.acc >= 1000 ? (me.acc / 1000).toFixed(1) + " km" : Math.round(me.acc) + " m"}${me.acc > GOOD_ACC ? " (weak)" : ""}`;
  $("#ls-state").textContent = t;
}
function openLocSheet() {
  $("#ls-spot").innerHTML = SPOTS.map(s => `<option value="${s.id}">${s.name[lang]}</option>`).join("");
  $("#ls-results").innerHTML = ""; locState(); $("#locsheet").classList.remove("hidden");
}
const closeLocSheet = () => $("#locsheet").classList.add("hidden");
$("#pick").onclick = openLocSheet;
$("#ls-close").onclick = closeLocSheet;
$("#locsheet").onclick = e => { if (e.target.id === "locsheet") closeLocSheet(); };
$("#ls-gps").onclick = () => {
  closeLocSheet(); manual = false; meMarker.dragging && meMarker.dragging.disable();
  if (!secure) return geoError({ message: "Needs https." });
  goodFix = false; firstFix = true;
  const s = $("#status"); s.textContent = T[lang].finding; s.classList.remove("hidden");
  if (watchId === null) $("#locate").click();
  else navigator.geolocation.getCurrentPosition(onPos, geoError, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 });
};
$("#ls-map").onclick = () => { closeLocSheet(); pickLocation(); };
$("#ls-spotgo").onclick = () => { const s = spot($("#ls-spot").value); closeLocSheet(); setManualLocation(s.lat, s.lng); };
async function searchPlace() {
  const q = $("#ls-q").value.trim(); if (!q) return;
  const box = $("#ls-results"); box.textContent = "…";
  try {
    const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=6&countrycodes=in&viewbox=73.6,18.75,74.1,18.3&q=" + encodeURIComponent(q + " Pune"));
    const list = await r.json(); box.innerHTML = "";
    if (!list.length) box.textContent = lang === "mr" ? "काही सापडले नाही." : "Nothing found.";
    list.forEach(p => {
      const b = document.createElement("button"); b.textContent = "📍 " + p.display_name.split(",").slice(0, 3).join(",");
      b.onclick = () => { closeLocSheet(); setManualLocation(+p.lat, +p.lon); }; box.appendChild(b);
    });
  } catch (e) { box.textContent = "Search failed - check internet."; }
}
$("#ls-search").onclick = searchPlace;
$("#ls-q").onkeydown = e => { if (e.key === "Enter") searchPlace(); };

const GOOD_ACC = 100; // metres: only trust fixes at least this accurate for auto-triggering
function onPos(p) {
  me = { lat: p.coords.latitude, lng: p.coords.longitude, acc: p.coords.accuracy };
  meMarker.setLatLng([me.lat, me.lng]).addTo(map);
  if (!accCircle) accCircle = L.circle([me.lat, me.lng], { radius: me.acc, color: "#1a73e8", weight: 1, fillOpacity: .12 }).addTo(map);
  else accCircle.setLatLng([me.lat, me.lng]).setRadius(me.acc);
  $("#recenter").classList.remove("hidden"); $("#status").classList.remove("hidden");
  if (firstFix) { firstFix = false; map.flyTo([me.lat, me.lng], me.acc > 500 ? 14 : 17); }
  let nearest = null, nd = Infinity;
  tripSpots().forEach(s => { const d = dist(me, s); if (d < nd) { nd = d; nearest = s; } });
  const dt = nd < 1000 ? Math.round(nd) + " m" : (nd / 1000).toFixed(1) + " km";
  const good = me.acc <= GOOD_ACC;
  if (good && !goodFix && !manual) { goodFix = true; map.flyTo([me.lat, me.lng], 17); }
  $("#status").textContent = manual ? `📌 ${nearest.name[lang]} · ${dt}` : good
    ? `📍 ${nearest.name[lang]} · ${dt} · ±${Math.round(me.acc)} m`
    : `⚠️ Weak location (±${me.acc >= 1000 ? (me.acc / 1000).toFixed(1) + " km" : Math.round(me.acc) + " m"}) — turn on GPS / Precise location, go outside`;
  $("#status").innerHTML += `<br><small>${me.lat.toFixed(5)}, ${me.lng.toFixed(5)} · v3 · <a href="https://www.google.com/maps?q=${me.lat},${me.lng}" target="_blank">check on Google Maps</a></small>`;
  renderCards();
  if (good && nd < RADIUS && !announced.has(nearest.id)) {
    announced.add(nearest.id);
    markVisited(nearest.id);
    openSpot(nearest.id, $("#v-auto").checked);
    if (navigator.vibrate) navigator.vibrate([150, 80, 150]);
  }
}
// Speech only works after a user tap; this "unlocks" it.
function unlockSpeech() { try { speechSynthesis.speak(new SpeechSynthesisUtterance("")); } catch (e) {} }

// ---------- Voice ----------
let voices = [];
function updateVoiceList() {
  voices = speechSynthesis.getVoices();
  const code = lang === "mr" ? "mr" : "en";
  const list = voices.filter(v => v.lang.toLowerCase().startsWith(code));
  $("#v-voice").innerHTML = list.map(v => `<option value="${v.voiceURI}">${v.name} (${v.lang})</option>`).join("");
  $("#v-hint").textContent = list.length ? "" :
    (lang === "mr" ? "No Marathi voice found on this phone. Android: Settings → System → Languages → Text-to-speech → Google → install Marathi. (A Hindi voice is used meanwhile.)" : "No English voice found.");
}
speechSynthesis.onvoiceschanged = updateVoiceList;
function speak(text) {
  stopSpeak();
  const u = new SpeechSynthesisUtterance(text);
  const code = lang === "mr" ? "mr" : "en";
  const v = voices.find(x => x.voiceURI === $("#v-voice").value && x.lang.toLowerCase().startsWith(code))
         || voices.find(x => x.lang.toLowerCase().startsWith(code))
         || (lang === "mr" ? voices.find(x => x.lang.toLowerCase().startsWith("hi")) : null);
  if (v) { u.voice = v; u.lang = v.lang; } else u.lang = lang === "mr" ? "mr-IN" : "en-IN";
  u.rate = +$("#v-rate").value; u.pitch = +$("#v-pitch").value;
  u.onstart = () => $("#wave").classList.add("on");
  u.onend = u.onerror = () => $("#wave").classList.remove("on");
  speechSynthesis.speak(u);
}
function stopSpeak() { speechSynthesis.cancel(); $("#wave").classList.remove("on"); }
$("#v-test").onclick = () => speak(lang === "mr" ? "नमस्कार! पुण्याच्या सफरीत तुमचे स्वागत आहे." : "Hello! Welcome to your Pune heritage walk.");

// ---------- Diary (IndexedDB) ----------
let db;
const openReq = indexedDB.open("pune-diary", 1);
openReq.onupgradeneeded = () => openReq.result.createObjectStore("entries", { keyPath: "id", autoIncrement: true });
openReq.onsuccess = () => { db = openReq.result; renderEntries(); };
const store = mode => db.transaction("entries", mode).objectStore("entries");

function fillSpotSelect() {
  const v = $("#d-spot").value;
  $("#d-spot").innerHTML = SPOTS.map(s => `<option value="${s.id}">${s.name[lang]}</option>`).join("");
  if (v) $("#d-spot").value = v;
}
let diaryPhoto = null; // set by the photo studio (studio.js)
$("#diary-form").onsubmit = e => {
  e.preventDefault();
  const file = diaryPhoto, note = $("#d-note").value.trim();
  if (!file && !note) return;
  store("readwrite").add({ spot: $("#d-spot").value, note, photo: file || null, date: Date.now() }).onsuccess = () => {
    e.target.reset(); diaryPhoto = null; $("#d-preview").classList.add("hidden"); renderEntries(); toast("💙 Saved"); confetti();
  };
};
function renderEntries() {
  if (!db) return;
  store("readonly").getAll().onsuccess = ev => {
    const all = ev.target.result.sort((a, b) => b.date - a.date);
    const box = $("#entries"); box.innerHTML = "";
    all.forEach(en => {
      const d = document.createElement("div"); d.className = "entry";
      const date = new Date(en.date).toLocaleString(lang === "mr" ? "mr-IN" : "en-IN");
      d.innerHTML = (en.photo ? `<img src="${URL.createObjectURL(en.photo)}">` : "") +
        `<div class="t"><b>${spot(en.spot).name[lang]}</b><div class="meta">${date}</div><p></p></div>`;
      d.querySelector("p").textContent = en.note;
      const del = document.createElement("button"); del.textContent = "Delete";
      del.onclick = () => confirm("Delete this memory?") && (store("readwrite").delete(en.id).onsuccess = renderEntries);
      d.appendChild(del); box.appendChild(d);
    });
    if (!all.length) box.innerHTML = '<p class="hint">Your memories will appear here. 💙</p>';
  };
}

// ---------- Tabs ----------
function showTab(t) {
  document.querySelectorAll(".tab").forEach(x => x.classList.toggle("on", x.id === "tab-" + t));
  document.querySelectorAll("nav button").forEach(x => x.classList.toggle("on", x.dataset.tab === t));
  if (t === "map") setTimeout(() => map.invalidateSize(), 50);
}
document.querySelectorAll("nav button").forEach(b => b.onclick = () => showTab(b.dataset.tab));

setLang(lang);
applyTrip(true);
if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
