(function () {
var TZ = 8 * 3600 * 1000; // 台灣時間 UTC+8
var FIRST_FLIGHT = Date.parse("2026-11-21T09:45:00+08:00"); // CI310 起飛
var DAYS = [
{ d: "2026-11-21", t: "抵達沖繩" },
{ d: "2026-11-22", t: "北部海洋之旅" },
{ d: "2026-11-23", t: "浦添・那霸市區" },
{ d: "2026-11-24", t: "南部文化體驗" },
{ d: "2026-11-25", t: "回台灣" }
];
function now() {
try {
var p = new URLSearchParams(location.search).get("now");
if (p && !isNaN(Date.parse(p))) return Date.parse(p);
} catch (e) {}
return Date.now();
}
function twDate(ms) { return new Date(ms + TZ).toISOString().slice(0, 10); }
function pad(n) { return n < 10 ? "0" + n : "" + n; }
var el = document.getElementById("countdown");
var ttl = document.querySelector(".countdown-title");
var dayIdx = -1;
function tick() {
var t = now(), dist = FIRST_FLIGHT - t;
if (dist > 0) {
var days = Math.floor(dist / 86400000);
var hrs = Math.floor((dist % 86400000) / 3600000);
var min = Math.floor((dist % 3600000) / 60000);
var sec = Math.floor((dist % 60000) / 1000);
ttl.textContent = "沖繩出發倒數";
el.innerHTML = days + "天 " + pad(hrs) + "小時 " + pad(min) + "分 <span class=\"cd-sec\">" + pad(sec) + "</span>秒";
return;
}
var today = twDate(t);
var idx = -1;
for (var i = 0; i < DAYS.length; i++) if (DAYS[i].d === today) idx = i;
if (idx >= 0) {
ttl.textContent = "旅程進行中";
el.textContent = "Day " + (idx + 1) + " / 5｜" + DAYS[idx].t;
} else {
ttl.textContent = "旅程結束";
el.textContent = "🏡 歡迎回家，謝謝大家！";
}
dayIdx = idx;
}
tick();
setInterval(tick, 1000);
function openToday() {
if (dayIdx < 0) return;
var cards = document.querySelectorAll(".day-card");
for (var i = 0; i < cards.length; i++) {
var isToday = cards[i].getAttribute("data-day") === String(dayIdx + 1);
if (isToday) {
cards[i].setAttribute("open", "");
var sm = cards[i].querySelector("summary");
if (sm && !sm.querySelector(".today-badge")) {
var b = document.createElement("span");
b.className = "today-badge";
b.textContent = "今天";
sm.insertBefore(b, sm.firstChild);
}
} else {
cards[i].removeAttribute("open");
}
}
}
openToday();
var WD = ["日", "一", "二", "三", "四", "五", "六"];
function icon(c) {
if (c === 0) return "☀️";
if (c <= 2) return "🌤️";
if (c === 3) return "☁️";
if (c <= 48) return "🌫️";
if (c <= 57) return "🌦️";
if (c <= 67) return "🌧️";
if (c <= 77) return "🌨️";
if (c <= 82) return "🌦️";
if (c <= 86) return "🌨️";
return "⛈️";
}
function loadWeather() {
var note = document.getElementById("wx-note");
var url = "https://api.open-meteo.com/v1/forecast?latitude=26.2124&longitude=127.6809" +
"&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max" +
"&timezone=Asia%2FTokyo&start_date=2026-11-21&end_date=2026-11-25";
var ctrl = ("AbortController" in window) ? new AbortController() : null;
var timer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 8000);
fetch(url, ctrl ? { signal: ctrl.signal } : {})
.then(function (r) { if (!r.ok) throw new Error("http " + r.status); return r.json(); })
.then(function (j) {
clearTimeout(timer);
var d = j.daily;
if (!d || !d.time || d.time.length < 5) throw new Error("no data");
var cols = document.querySelectorAll("#wx-grid .wx-col");
for (var i = 0; i < 5 && i < cols.length; i++) {
var dt = new Date(d.time[i] + "T00:00:00Z");
var mm = pad(dt.getUTCMonth() + 1), dd = pad(dt.getUTCDate());
cols[i].querySelector(".wx-date").innerHTML = mm + "/" + dd + "<small>（" + WD[dt.getUTCDay()] + "）</small>";
cols[i].querySelector(".wx-ico").textContent = icon(d.weather_code[i]);
cols[i].querySelector(".wx-temp").innerHTML = Math.round(d.temperature_2m_min[i]) + "°<span>/</span>" + Math.round(d.temperature_2m_max[i]) + "°";
var p = d.precipitation_probability_max ? d.precipitation_probability_max[i] : null;
cols[i].querySelector(".wx-rain").textContent = (p === null || p === undefined) ? "" : "💧" + p + "%";
}
note.textContent = "✅ 即時預報（Open-Meteo），每次開啟自動更新";
})
.catch(function () {
clearTimeout(timer);
note.textContent = "ℹ️ 目前無法取得即時預報，顯示的是手動整理的參考值";
});
}
loadWeather();
var links = document.querySelectorAll("#quick-nav a");
var map = {};
for (var k = 0; k < links.length; k++) map[links[k].getAttribute("href").slice(1)] = links[k];
var nav = document.querySelector("#quick-nav .quick-nav-inner");
function setActive(id) {
for (var key in map) map[key].classList.toggle("active", key === id);
var a = map[id];
if (a && nav) nav.scrollTo({ left: a.offsetLeft - 16, behavior: "smooth" });
}
if ("IntersectionObserver" in window) {
var io = new IntersectionObserver(function (entries) {
entries.forEach(function (en) { if (en.isIntersecting) setActive(en.target.id); });
}, { rootMargin: "-30% 0px -60% 0px" });
Object.keys(map).forEach(function (id) {
var sec = document.getElementById(id);
if (sec) io.observe(sec);
});
}
})();

(function () {
var reduce = false;
try { reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
if (reduce || !("IntersectionObserver" in window)) return; // 不支援或使用者不要動畫：維持全部直接顯示
var root = document.documentElement;
var secs = document.querySelectorAll(".section");
for (var i = 0; i < secs.length; i++) {
var kids = secs[i].querySelectorAll(".spot-card,.food-card,.stay-card,.day-card,.flight-card");
for (var j = 0; j < kids.length; j++) kids[j].style.setProperty("--i", Math.min(j, 6));
}
root.classList.add("js-anim");
var io = new IntersectionObserver(function (entries) {
entries.forEach(function (en) {
if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
});
}, { threshold: 0.06, rootMargin: "0px 0px -6% 0px" });
for (var k = 0; k < secs.length; k++) io.observe(secs[k]);
setTimeout(function () {
var rest = document.querySelectorAll(".section:not(.in)");
for (var m = 0; m < rest.length; m++) {
var r = rest[m].getBoundingClientRect();
if (r.top < window.innerHeight * 1.2 && r.bottom > 0) rest[m].classList.add("in");
}
}, 3000);
})();
