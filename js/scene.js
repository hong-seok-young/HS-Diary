// ============================================================
// 홈 화면 풍경
// - 해의 높이를 위치와 시각으로 계산해서 새벽, 해 뜰 녘, 아침, 오후, 노을, 해 질 녘, 저녁, 밤, 늦은 밤 하늘을 그려요.
// - 진짜 날씨(맑음, 구름, 비, 소나기, 천둥, 눈, 안개, 바람, 기온)를 받아 와서 그대로 보여 줘요.
// - 시간마다 할 일: 아침 커피, 점심 도시락, 간식, 저녁 식사, 모닥불, 연날리기, 잠.
// - 생일, 기념일, 명절 같은 날에는 풍선, 케이크, 불꽃놀이.
// - 낙엽, 꽃잎, 눈은 바닥에 쌓이고 비는 웅덩이가 돼요. 누르면 날리고, 쓸어 넘기면 바람이 불어요.
// 시험용 주소: ?at=2026-11-18T12:30&wx=rain&temp=3&wind=6
// ============================================================
(function () {
  "use strict";

  const cfg = typeof DIARY_CONFIG !== "undefined" ? DIARY_CONFIG : {};
  const $ = (id) => document.getElementById(id);
  const SEOUL = { lat: 37.5665, lon: 126.978, place: "서울" };
  const qs = new URLSearchParams(location.search);
  const atParam = qs.get("at") ? Date.parse(qs.get("at")) : NaN;
  const offset = isNaN(atParam) ? 0 : atParam - Date.now();
  const now = () => Date.now() + offset;
  const reduced = () => window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const rand = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, k) => a + (b - a) * k;

  function lsGet(k) {
    try { return JSON.parse(localStorage.getItem(k) || "null"); } catch (e) { return null; }
  }
  function lsSet(k, v) {
    try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* 저장 공간이 막혀 있어도 그림은 그려요 */ }
  }

  // ---------- 해와 달 ----------
  function sunElev(ms, lat, lon) {
    const rad = Math.PI / 180;
    const d = ms / 86400000 - 10957.5;
    const g = rad * (((357.529 + 0.98560028 * d) % 360) + 360);
    const q = (280.459 + 0.98564736 * d) % 360;
    const L = rad * (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
    const e = rad * (23.439 - 0.00000036 * d);
    const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
    const dec = Math.asin(Math.sin(e) * Math.sin(L));
    const gmst = (18.697374558 + 24.06570982441908 * d) % 24;
    const H = rad * (gmst * 15 + lon) - ra;
    const la = rad * lat;
    return Math.asin(Math.sin(la) * Math.sin(dec) + Math.cos(la) * Math.cos(dec) * Math.cos(H)) / rad;
  }
  function dayStart(ms) {
    const d = new Date(ms);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }
  let sunCache = null;
  function sunTimes(ms) {
    const ds = dayStart(ms);
    const key = ds + ":" + loc.lat.toFixed(2) + ":" + loc.lon.toFixed(2);
    if (sunCache && sunCache.key === key) return sunCache;
    let rise = ds + 6.5 * 3600000, set = ds + 18 * 3600000, maxE = -90, noon = ds + 12 * 3600000;
    let prev = sunElev(ds, loc.lat, loc.lon);
    for (let t = ds + 600000; t <= ds + 86400000; t += 600000) {
      const e = sunElev(t, loc.lat, loc.lon);
      if (prev < -0.833 && e >= -0.833) rise = t;
      if (prev >= -0.833 && e < -0.833) set = t;
      if (e > maxE) { maxE = e; noon = t; }
      prev = e;
    }
    sunCache = { key, rise, set, noon, maxE };
    return sunCache;
  }
  function moonPhase(ms) {
    const syn = 29.530588853;
    let p = ((ms - Date.UTC(2000, 0, 6, 18, 14)) / 86400000) % syn;
    if (p < 0) p += syn;
    return p / syn;
  }

  // ---------- 하늘 색 ----------
  const NIGHT = ["#151a36", "#1d2448", "#28305c"];
  const MORNING = [
    [-18, ...NIGHT],
    [-10, "#1f2852", "#33407a", "#55598e"],
    [-4, "#3a4b8e", "#8a7db3", "#f0a5a2"],
    [0, "#6c8dd0", "#f2b5a8", "#ffcd90"],
    [6, "#8cc4ef", "#c8e4f5", "#ffe3bd"],
    [20, "#a3d9f7", "#c2e7fb", "#def4fd"],
  ];
  const EVENING = [
    [-18, ...NIGHT],
    [-10, "#222754", "#3c386f", "#674c84"],
    [-4, "#3c3d7e", "#8c5d98", "#df8389"],
    [0, "#6a6fb5", "#ef8a79", "#ffb067"],
    [7, "#86aee3", "#f4c48f", "#ffbf7d"],
    [20, "#a3d9f7", "#c2e7fb", "#def4fd"],
  ];
  function hex(c) {
    return [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
  }
  function mix(a, b, k) {
    const x = hex(a), y = hex(b);
    return "#" + x.map((v, i) => Math.round(lerp(v, y[i], k)).toString(16).padStart(2, "0")).join("");
  }
  function skyColors(elev, rising, cloud, fog, deep) {
    const table = rising ? MORNING : EVENING;
    let cols = table[0].slice(1);
    for (let i = 0; i < table.length - 1; i++) {
      const [e0, ...c0] = table[i];
      const [e1, ...c1] = table[i + 1];
      if (elev >= e0 && elev <= e1) { const k = (elev - e0) / (e1 - e0); cols = c0.map((c, j) => mix(c, c1[j], k)); break; }
      if (elev > e1) cols = c1;
    }
    const day = clamp((elev + 6) / 12, 0, 1);
    const gray = ["#8f9aa8", "#a7b0bb", "#c0c6cc"];
    const grayN = ["#20243a", "#272c44", "#30354e"];
    if (cloud > 0) cols = cols.map((c, i) => mix(c, day > 0.4 ? gray[i] : grayN[i], cloud * (day > 0.4 ? 0.7 : 0.5)));
    if (fog > 0) cols = cols.map((c) => mix(c, day > 0.4 ? "#d8dde2" : "#3a3f55", fog * 0.6));
    if (deep) cols = cols.map((c) => mix(c, "#0c0f22", 0.3));
    return cols;
  }

  // ---------- 위치와 날씨 ----------
  let loc = lsGet("hsd.loc") || SEOUL;
  let wx = lsGet("hsd.wx");
  const WX_OVERRIDE = qs.get("wx");
  const KIND = {
    0: "clear", 1: "clear", 2: "partly", 3: "cloudy", 45: "fog", 48: "fog",
    51: "drizzle", 53: "drizzle", 55: "drizzle", 56: "drizzle", 57: "drizzle",
    61: "rain", 63: "rain", 65: "heavy", 66: "rain", 67: "heavy", 80: "rain", 81: "rain", 82: "heavy",
    71: "snow", 73: "snow", 75: "heavysnow", 77: "snow", 85: "snow", 86: "heavysnow", 95: "thunder", 96: "thunder", 99: "thunder",
  };
  const KIND_LABEL = { clear: "맑음", partly: "구름 조금", cloudy: "흐림", fog: "안개", drizzle: "이슬비", rain: "비", heavy: "폭우", snow: "눈", heavysnow: "함박눈", thunder: "천둥번개" };
  const KIND_ICON = { clear: "wsun", partly: "wcloud", cloudy: "wcloud", fog: "wfog", drizzle: "wrain", rain: "wrain", heavy: "wrain", snow: "wsnow", heavysnow: "wsnow", thunder: "wthunder" };
  function weather() {
    const base = wx || { code: 1, temp: null, wind: 2, cloud: 20 };
    const o = Object.assign({}, base);
    if (WX_OVERRIDE) {
      const map = { clear: 0, partly: 2, cloudy: 3, fog: 45, drizzle: 53, rain: 63, heavy: 65, snow: 73, heavysnow: 75, thunder: 95 };
      o.code = map[WX_OVERRIDE] != null ? map[WX_OVERRIDE] : o.code;
      o.cloud = { clear: 5, partly: 40, cloudy: 90 }[WX_OVERRIDE] != null ? { clear: 5, partly: 40, cloudy: 90 }[WX_OVERRIDE] : 95;
    }
    if (qs.get("temp")) o.temp = Number(qs.get("temp"));
    if (qs.get("wind")) o.wind = Number(qs.get("wind"));
    o.kind = KIND[o.code] || "clear";
    o.wet = ["drizzle", "rain", "heavy", "thunder"].includes(o.kind);
    o.snowy = ["snow", "heavysnow"].includes(o.kind);
    return o;
  }
  function askLocation(force) {
    return new Promise((resolve) => {
      const fresh = loc && loc.at && Date.now() - loc.at < 6 * 3600000;
      if (!navigator.geolocation || (fresh && !force)) return resolve(false);
      navigator.geolocation.getCurrentPosition(
        (p) => {
          loc = { lat: p.coords.latitude, lon: p.coords.longitude, at: Date.now(), place: "지금 있는 곳" };
          lsSet("hsd.loc", loc);
          sunCache = null;
          resolve(true);
        },
        () => {
          if (!loc || !loc.at) loc = Object.assign({}, SEOUL, { denied: true });
          resolve(false);
        },
        { enableHighAccuracy: false, timeout: 10000, maximumAge: 6 * 3600000 }
      );
    });
  }
  async function fetchWeather(force) {
    if (!force && wx && wx.at && Date.now() - wx.at < 25 * 60000 && wx.lat === loc.lat) return;
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${loc.lat.toFixed(3)}&longitude=${loc.lon.toFixed(3)}` +
      "&current=temperature_2m,weather_code,wind_speed_10m,cloud_cover&wind_speed_unit=ms&timezone=auto&forecast_days=1";
    try {
      const res = await fetch(url, { cache: "no-store" });
      if (!res.ok) return;
      const j = await res.json();
      const c = j.current || {};
      const prev = wx;
      wx = { at: Date.now(), lat: loc.lat, code: c.weather_code, temp: c.temperature_2m, wind: c.wind_speed_10m, cloud: c.cloud_cover };
      const k = KIND[wx.code] || "clear";
      wx.lastWetAt = ["drizzle", "rain", "heavy", "thunder"].includes(k) ? Date.now() : prev && prev.lastWetAt;
      lsSet("hsd.wx", wx);
      update(true);
    } catch (e) { /* 인터넷이 없으면 지난 날씨로 그려요 */ }
  }

  // ---------- 오늘이 무슨 날인지 ----------
  function parseDate(s) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s || "");
    return m ? new Date(+m[1], +m[2] - 1, +m[3]) : null;
  }
  function specials(d) {
    const out = [];
    const md = (d.getMonth() + 1) * 100 + d.getDate();
    const same = (s) => { const x = parseDate(s); return x && x.getMonth() === d.getMonth() && x.getDate() === d.getDate(); };
    if (same(cfg.himBirthday)) out.push({ key: "bday", who: "him", label: `${cfg.him || "석영"} 생일` });
    if (same(cfg.herBirthday)) out.push({ key: "bday", who: "her", label: `${cfg.her || "예은"} 생일` });
    const start = parseDate(cfg.startDate);
    if (start) {
      const t = new Date(d); t.setHours(0, 0, 0, 0);
      const n = Math.round((t - start) / 86400000) + 1;
      if (n > 1 && n % 100 === 0) out.push({ key: "anniv", label: `${n}일` });
      else if (same(cfg.startDate) && d.getFullYear() > start.getFullYear()) out.push({ key: "anniv", label: `${d.getFullYear() - start.getFullYear()}주년` });
      else if (d.getDate() === start.getDate() && n > 20) {
        const months = (d.getFullYear() - start.getFullYear()) * 12 + d.getMonth() - start.getMonth();
        if (months > 0) out.push({ key: "monthly", label: `${months}개월` });
      }
    }
    if (same(cfg.firstMet) && parseDate(cfg.firstMet).getFullYear() < d.getFullYear()) out.push({ key: "met", label: "처음 만난 날" });
    if (md === 1224 || md === 1225) out.push({ key: "xmas", label: "크리스마스" });
    if (md === 101) out.push({ key: "newyear", label: "새해" });
    if (md === 214) out.push({ key: "valentine", label: "밸런타인데이" });
    if (md === 314) out.push({ key: "white", label: "화이트데이" });
    if (md === 1111) out.push({ key: "pepero", label: "빼빼로데이" });
    if (md === 1031) out.push({ key: "halloween", label: "핼러윈" });
    return out;
  }
  function season(d) {
    const m = d.getMonth() + 1;
    return m === 12 || m <= 2 ? "winter" : m <= 5 ? "spring" : m <= 8 ? "summer" : "autumn";
  }
  function timePhase(d, elev, rising) {
    const h = d.getHours();
    if (h < 4) return { key: "latenight", label: "늦은 밤" };
    if (rising) {
      if (elev < -6) return { key: "dawn", label: "새벽" };
      if (elev < 3) return { key: "sunrise", label: "해 뜨는 중" };
      return h < 10 ? { key: "morning", label: "아침" } : { key: "forenoon", label: "오전" };
    }
    if (elev >= 10) return { key: "afternoon", label: "오후" };
    if (elev >= 0) return { key: "golden", label: "노을" };
    if (elev >= -6) return { key: "dusk", label: "해 질 녘" };
    return h < 21 ? { key: "evening", label: "저녁" } : { key: "night", label: "밤" };
  }
  function activity(d, w) {
    const h = d.getHours();
    const weekend = d.getDay() === 0 || d.getDay() === 6;
    const out = !w.wet && !w.snowy;
    const kite = weekend && out && (w.wind || 0) >= 1.5;
    if (h < 6) return { key: "sleep", label: "꿈나라" };
    if (h === 6) return { key: "stretch", label: "아침 체조" };
    if (h === 7 || h === 8) return { key: "breakfast", label: "아침 식사" };
    if (h === 10 || h === 11) return kite ? { key: "kite", label: "연날리기" } : { key: "read", label: "책 읽기" };
    if (h === 12) return { key: "lunch", label: "점심시간" };
    if (h === 13 || h === 14) return kite ? { key: "kite", label: "연날리기" } : !w.wet ? { key: "walk", label: w.snowy ? "눈길 산책" : "산책" } : { key: "read", label: "책 읽기" };
    if (h === 15) return { key: "snack", label: "간식 시간" };
    if (h === 16) return { key: "cafe", label: "카페 데이트" };
    if (h === 18) return { key: "dinner", label: "저녁 식사" };
    if (h === 19) return { key: "movie", label: "영화 보기" };
    if (h === 20 || h === 21) return out ? { key: "campfire", label: "모닥불" } : { key: "movie", label: "영화 보기" };
    if (h === 22) return out && w.kind !== "cloudy" ? { key: "stargaze", label: "별 보기" } : { key: "movie", label: "영화 보기" };
    if (h === 23) return { key: "bedtime", label: "잘 시간" };
    return null;
  }

  // ---------- 상태 ----------
  const S = {
    W: 300, H: 160, dpr: 1, u: 2,
    elev: 30, rising: true, dark: 0, golden: 0, phase: null, act: null, specials: [], season: "autumn", w: weather(),
    wind: 0, gust: 0, celebrate: false,
    parts: [], rest: [], snow: [], puddles: [], ripples: [],
    clouds: [], birds: [], flies: [], cat: null, shooting: 0,
    acc: { rain: 0, snow: 0, leaf: 0, firework: 0, breath: 0, bird: 0 },
    backDirty: true, running: false, visible: true, active: true,
  };
  let front, back, fctx, bctx, scene;

  // 그림 조각 (캔버스용)
  const LEAF_COLORS = { autumn: ["#f5a56b", "#ee9453", "#e8604b", "#ffc65c", "#c97a3c"], spring: ["#ffd6e3", "#ffc4d6", "#ffb9cf"], summer: ["#86cc86", "#66b46e"], winter: ["#e3dacb"] };
  const HEART = ["0110110", "1111111", "1111111", "0111110", "0011100", "0001000"];

  function px(ctx, x, y, w, h, c) {
    ctx.fillStyle = c;
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
  }
  function groundTop() {
    return S.H - 24;
  }
  function snowAt(x) {
    const i = clamp(Math.floor(x / S.u), 0, S.snow.length - 1);
    return S.snow[i] || 0;
  }

  // ---------- 화면 크기 ----------
  function resize() {
    const r = scene.getBoundingClientRect();
    const W = Math.max(120, Math.round(r.width));
    const H = Math.max(80, Math.round(r.height));
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    if (W === S.W && H === S.H && dpr === S.dpr && front.width) return;
    const oldW = S.W;
    S.W = W; S.H = H; S.dpr = dpr;
    [front, back].forEach((c) => {
      c.width = Math.round(W * dpr);
      c.height = Math.round(H * dpr);
      c.style.width = W + "px";
      c.style.height = H + "px";
      c.getContext("2d").setTransform(dpr, 0, 0, dpr, 0, 0);
    });
    const n = Math.ceil(W / S.u);
    const old = S.snow;
    S.snow = new Array(n).fill(0).map((_, i) => old.length ? old[Math.floor((i / n) * old.length)] || 0 : 0);
    if (oldW && oldW !== W) S.rest.forEach((l) => { l.x = (l.x / oldW) * W; });
    S.backDirty = true;
    placeClouds();
  }

  // ---------- 구름 ----------
  function placeClouds() {
    const box = $("clouds");
    if (!box) return;
    const w = S.w;
    const n = { clear: 2, partly: 3, cloudy: 5, fog: 3 }[w.kind] || (w.wet || w.snowy ? 6 : 2);
    if (S.clouds.length !== n) {
      box.innerHTML = "";
      S.clouds = [];
      for (let i = 0; i < n; i++) {
        const big = i % 2 === 0;
        const el = document.createElement("span");
        el.className = "cloud tap";
        el.innerHTML = PIXEL.sprite(big ? "cloud" : "cloudSmall", big ? 3 : 2);
        box.appendChild(el);
        S.clouds.push({ el, x: (i / n) * (S.W + 80) - 40 + rand(-20, 20), y: 6 + ((i * 17) % 40), speed: rand(0.6, 1.3) });
      }
    }
    const dark = w.kind === "thunder" ? 0.55 : w.wet || w.snowy ? 0.72 : w.kind === "cloudy" ? 0.88 : 1;
    box.style.filter = dark < 1 ? `brightness(${dark}) saturate(.6)` : "";
  }

  // ---------- 매분 다시 정하기 ----------
  let lastKey = "";
  function update(force) {
    const t = now();
    const d = new Date(t);
    const st = sunTimes(t);
    S.w = weather();
    S.elev = sunElev(t, loc.lat, loc.lon);
    S.rising = t < st.noon;
    S.dark = clamp((2 - S.elev) / 16, 0, 1);
    S.golden = clamp(1 - Math.abs(S.elev - 3) / 9, 0, 1) * (1 - S.dark * 0.5);
    S.phase = timePhase(d, S.elev, S.rising);
    S.act = activity(d, S.w);
    S.specials = specials(d);
    S.season = season(d);
    S.celebrate = S.specials.some((s) => ["bday", "anniv", "met", "newyear", "xmas"].includes(s.key));
    S.wind = (S.w.wind || 0) * 9;

    const cloud = { clear: 0, partly: 0.15, cloudy: 0.6, fog: 0.4 }[S.w.kind];
    const cl = cloud != null ? cloud : S.w.kind === "thunder" ? 0.9 : 0.75;
    const cols = skyColors(S.elev, S.rising, cl, S.w.kind === "fog" ? 1 : 0, d.getHours() < 4);
    const sky = `linear-gradient(180deg, ${cols[0]} 0%, ${cols[1]} 58%, ${cols[2]} 100%)`;
    setSky(sky);

    // 해와 달 위치
    const sun = $("sun"), moon = $("moon");
    const skyH = Math.max(40, S.H - 70);
    const dayFrac = clamp((t - st.rise) / Math.max(1, st.set - st.rise), 0, 1);
    const sunUp = S.elev > -3;
    sun.style.transform = `translate(${Math.round(8 + dayFrac * (S.W - 50))}px, ${Math.round(8 + (1 - clamp(S.elev / Math.max(10, st.maxE), 0, 1)) * skyH)}px)`;
    const veil = S.w.kind === "thunder" ? 0.15 : S.w.wet || S.w.snowy ? 0.3 : S.w.kind === "cloudy" ? 0.45 : S.w.kind === "fog" ? 0.5 : 1;
    sun.style.opacity = sunUp ? String(clamp((S.elev + 3) / 5, 0, 1) * veil) : "0";
    sun.classList.toggle("low", S.elev < 8);
    sun.classList.toggle("hot", (S.w.temp || 0) >= 28);
    const nightLen = 86400000 - (st.set - st.rise);
    const sinceSet = ((t - st.set) % 86400000 + 86400000) % 86400000;
    const nightFrac = clamp(sinceSet / Math.max(1, nightLen), 0, 1);
    moon.style.transform = `translate(${Math.round(8 + nightFrac * (S.W - 50))}px, ${Math.round(10 + Math.abs(nightFrac - 0.5) * 2 * skyH * 0.7)}px)`;
    moon.style.opacity = String(clamp(S.dark * 1.3 - 0.2, 0, 1) * (S.w.wet || S.w.snowy ? 0.4 : 1));
    const phaseKey = Math.round(moonPhase(t) * 16);
    if (moon.dataset.p !== String(phaseKey)) { moon.dataset.p = String(phaseKey); moon.innerHTML = PIXEL.moon(phaseKey / 16, 3); }

    const stars = $("stars");
    stars.style.opacity = String(S.w.wet || S.w.snowy || S.w.kind === "cloudy" ? S.dark * 0.25 : S.dark);
    $("tint").style.background = `rgba(26, 30, 80, ${(S.dark * 0.48).toFixed(3)})`;
    $("haze").style.opacity = S.w.kind === "fog" ? "0.6" : S.w.wet ? "0.18" : "0";
    document.body.classList.toggle("night", S.dark > 0.55);
    scene.classList.toggle("golden", S.golden > 0.35 && S.dark < 0.6);
    scene.classList.toggle("sleeping", !!S.act && S.act.key === "sleep");
    scene.classList.toggle("sleepy", !!S.act && S.act.key === "bedtime");
    scene.classList.toggle("stretch", !!S.act && S.act.key === "stretch");

    // 무지개: 비가 그치고 한 시간 안에 해가 있으면
    const rainbow = (wx && wx.lastWetAt && Date.now() - wx.lastWetAt < 90 * 60000 && !S.w.wet && S.dark < 0.3) || qs.get("rainbow") === "1";
    $("rainbow").classList.toggle("on", !!rainbow || rainbowEgg > Date.now());

    placeClouds();
    paintSeason();
    paintVillage();
    syncCritters();
    renderChips();
    const key = [S.act && S.act.key, S.w.kind, S.season, S.specials.map((s) => s.key).join(","), S.dark > 0.55, Math.round(S.w.temp || 0) <= 3, Math.round(S.w.temp || 0) >= 28].join("|");
    if (force || key !== lastKey) { lastKey = key; renderProps(); }
    if (S.w.wet && window.Garden) window.Garden.rain();
  }
  let skyOn = "A";
  let skyNow = "";
  function setSky(bg) {
    if (bg === skyNow) return;
    skyNow = bg;
    const next = skyOn === "A" ? $("skyB") : $("skyA");
    const prev = skyOn === "A" ? $("skyA") : $("skyB");
    next.style.background = bg;
    next.style.opacity = "1";
    prev.style.opacity = "0";
    skyOn = skyOn === "A" ? "B" : "A";
  }
  function renderChips() {
    const w = S.w;
    const icon = S.dark > 0.55 && (w.kind === "clear" || w.kind === "partly") ? "wmoon" : KIND_ICON[w.kind] || "wsun";
    $("weatherChip").innerHTML = `${PIXEL.icon(icon, 2)}<b>${w.temp == null ? KIND_LABEL[w.kind] : Math.round(w.temp) + "°"}</b>`;
    const sp = S.specials[0];
    $("phaseChip").textContent = sp ? sp.label : S.act ? S.act.label : S.phase.label;
  }

  // ---------- 소품 ----------
  function prop(name, scale, style, cls) {
    return `<span class="prop ${cls || ""}" style="${style}">${PIXEL.sprite(name, scale)}</span>`;
  }
  function steam(style) {
    return `<span class="steam" style="${style}"><i></i><i></i><i></i></span>`;
  }
  function renderProps() {
    const box = $("props");
    const deco = $("deco");
    const a = S.act ? S.act.key : "";
    const w = S.w;
    let html = "";
    let back = "";
    const L = (px) => `left:calc(50% ${px < 0 ? "-" : "+"} ${Math.abs(px)}px)`;
    // 날씨
    if (w.wet && a !== "sleep") html += prop("umbrella", 5, `${L(4)};bottom:34px`, "umbrella");
    if ((w.snowy || avgSnow() > 3) && S.season === "winter") back += prop("snowman", 3, `${L(70)};bottom:14px`, "snowman");
    // 할 일
    if (a === "sleep") html += `<span class="zzz" style="${L(-30)}"><i>z</i><i>z</i><i>Z</i></span><span class="zzz z2" style="${L(18)}"><i>z</i><i>z</i><i>Z</i></span>`;
    if (a === "breakfast") html += prop("mug", 3, `${L(-66)};bottom:10px`) + steam(`${L(-62)};bottom:30px`) + prop("mug", 3, `${L(56)};bottom:10px`) + steam(`${L(60)};bottom:30px`);
    if (a === "lunch") back += prop("mat", 5, `${L(-60)};bottom:2px`, "mat"), html += prop("bowl", 3, `${L(-70)};bottom:8px`) + steam(`${L(-64)};bottom:24px`) + prop("bowl", 3, `${L(56)};bottom:8px`) + steam(`${L(62)};bottom:24px`);
    if (a === "snack") {
      const snack = S.season === "winter" ? "bungeo" : S.season === "summer" ? "icecream" : "cake";
      html += prop(snack, 3, `${L(-58)};bottom:30px`, "held") + prop(snack, 3, `${L(46)};bottom:30px`, "held b2");
    }
    if (a === "dinner") back += prop("table", 3, `${L(58)};bottom:12px`) , html += prop("pot", 3, `${L(66)};bottom:27px`) + steam(`${L(74)};bottom:40px`);
    if (a === "dinner" || a === "campfire" || (S.dark > 0.55 && new Date(now()).getMonth() === 11)) html += `<span class="lights" style='background-image:${PIXEL.dataUri("lights", 2)}'></span>`;
    if (a === "campfire") back += `<span class="prop fire" style="${L(62)};bottom:10px">${PIXEL.sprite("fire1", 3)}${PIXEL.sprite("fire2", 3)}</span>`;
    if (a === "kite") html += `<span class="prop kite" id="kite" style="left:18%;top:14%">${PIXEL.sprite("kite", 3)}</span>`;
    if (a === "read") html += prop("book", 3, `${L(-52)};bottom:30px`, "held") + prop("book2", 3, `${L(36)};bottom:30px`, "held b2");
    if (a === "cafe") back += prop("cafeTable", 3, `${L(62)};bottom:12px`), html += prop("mug", 3, `${L(-60)};bottom:28px`, "held") + steam(`${L(-56)};bottom:46px`);
    if (a === "movie") back += prop("screen", 3, `${L(66)};bottom:14px`, "screen"), html += prop("popcorn", 3, `${L(-56)};bottom:26px`, "held");
    if (a === "stargaze") back += prop("telescope", 3, `${L(64)};bottom:12px`, "scope");
    // 특별한 날
    let hat = { him: "", her: "" };
    if (a === "sleep" || a === "bedtime") hat = { him: "nightCap", her: "nightCap" };
    S.specials.forEach((sp) => {
      if (sp.key === "bday") {
        hat[sp.who] = "partyHat";
        back += prop("cake", 3, `${L(58)};bottom:10px`);
        html += prop("balloonP", 3, `${L(-96)};bottom:24px`, "balloon") + prop("balloonY", 3, `${L(-82)};bottom:30px`, "balloon b2") + prop("balloonB", 3, `${L(-110)};bottom:28px`, "balloon b3");
      }
      if (sp.key === "anniv" || sp.key === "met" || sp.key === "newyear") {
        html += prop("balloonP", 3, `${L(-96)};bottom:24px`, "balloon") + prop("balloonB", 3, `${L(-82)};bottom:32px`, "balloon b2");
        back += prop("gift", 3, `${L(58)};bottom:10px`);
        if (sp.key === "newyear") hat = { him: "partyHat", her: "partyHat" };
      }
      if (sp.key === "monthly") html += prop("balloonP", 3, `${L(-90)};bottom:26px`, "balloon");
      if (sp.key === "xmas") { hat = { him: "santaHat", her: "santaHat" }; back += prop("xtree", 3, `${L(-120)};bottom:16px`); }
      if (sp.key === "halloween") back += prop("pumpkin", 3, `${L(62)};bottom:10px`);
      if (["valentine", "white", "pepero"].includes(sp.key)) back += prop("gift", 3, `${L(60)};bottom:10px`);
    });
    ["him", "her"].forEach((who) => {
      const el = $(who === "him" ? "topHim" : "topHer");
      el.innerHTML = hat[who] ? PIXEL.sprite(hat[who], 3) : "";
      el.parentNode.classList.toggle("has-hat", !!hat[who]);
    });
    box.innerHTML = html;
    deco.innerHTML = back;
    renderStars();
  }
  function renderStars() {
    const box = $("stars");
    if (box.childElementCount) return;
    let html = "";
    for (let i = 0; i < 22; i++) {
      const x = (i * 47) % 97 + 1.5;
      const y = (i * 29) % 52 + 3;
      html += `<i style="left:${x}%;top:${y}%;animation-delay:-${(i * 0.37).toFixed(2)}s"></i>`;
    }
    box.innerHTML = html;
  }

  // ---------- 배경 마을 ----------
  const TREE_COLORS = {
    spring: { L: "#ffc4d6", D: "#ff9ec0" },
    summer: { L: "#86cc86", D: "#66b46e" },
    autumn: { L: "#f5a56b", D: "#e0823f" },
  };
  const GROUND_COLORS = {
    spring: { D: "#7fca7f", G: "#a2dc95", g: "#8fd28a" },
    summer: { D: "#74c178", G: "#95d590", g: "#84cb84" },
    autumn: { D: "#b9b36a", G: "#d2cd86", g: "#c4bf76" },
    winter: { D: "#bcd3c2", G: "#e3eee6", g: "#d2e2d6" },
  };
  const HILL_COLORS = { spring: "#cdeec0", summer: "#c4e8b6", autumn: "#e2dba0", winter: "#e6f0ea" };
  function el(tag, cls, html, style) {
    const e = document.createElement(tag);
    e.className = cls;
    if (html) e.innerHTML = html;
    if (style) e.setAttribute("style", style);
    return e;
  }
  function buildVillage() {
    const hills = scene.querySelector(".sc-hills");
    const house = PIXEL.rows("house");
    const house2 = PIXEL.rows("house2");
    const lit = (c) => Object.assign({}, c, { G: "#ffe08f" });
    const h1 = el("span", "house h1", PIXEL.draw(house.rows, house.colors, 2, "px day") + PIXEL.draw(house.rows, lit(house.colors), 2, "px nite") + '<i class="smoke"><b></b><b></b><b></b></i>');
    const h2 = el("span", "house h2", PIXEL.draw(house2.rows, house2.colors, 2, "px day") + PIXEL.draw(house2.rows, lit(house2.colors), 2, "px nite") + '<i class="smoke"><b></b><b></b><b></b></i>');
    [el("div", "sc-mountains", "", ""), h1, h2].forEach((x) => scene.insertBefore(x, hills));
    scene.insertBefore(el("div", "sc-fence", "", ""), hills.nextSibling);
    scene.insertBefore(el("span", "sc-lamp", PIXEL.sprite("lamp", 2)), scene.querySelector(".sc-ground").nextSibling);
    scene.insertBefore(el("div", "sc-glow"), $("couple"));
    scene.insertBefore(el("div", "sc-critters", "", ""), $("props"));
  }
  let seasonDrawn = "";
  function paintSeason() {
    const key = S.season + (S.w.snowy ? "-snow" : "");
    if (key === seasonDrawn) return;
    seasonDrawn = key;
    const winter = S.season === "winter";
    scene.querySelector(".sc-mountains").style.backgroundImage = PIXEL.dataUri(winter ? "mountainsSnow" : "mountains", 3);
    scene.querySelector(".sc-fence").style.backgroundImage = PIXEL.dataUri("fence", 2, winter ? { F: "#e8d9c0" } : null);
    scene.querySelector(".sc-ground").style.backgroundImage = PIXEL.dataUri("ground", 3, GROUND_COLORS[S.season]);
    scene.querySelector(".sc-ground").style.backgroundColor = GROUND_COLORS[S.season].G;
    scene.querySelector(".sc-hills").style.backgroundImage = PIXEL.dataUri("hills", 3, { G: HILL_COLORS[S.season] });
    scene.querySelectorAll(".sc-tree").forEach((t) => {
      const scale = t.classList.contains("t1") ? 3 : 2;
      if (winter) {
        const r = PIXEL.rows("treeBare");
        t.innerHTML = PIXEL.draw(r.rows, r.colors, scale);
      } else {
        const r = PIXEL.rows("tree");
        t.innerHTML = PIXEL.draw(r.rows, Object.assign(r.colors, TREE_COLORS[S.season]), scale);
      }
    });
    const flowers = { spring: ["flowerA", "flowerB", "flowerC"], summer: ["flowerB", "flowerB", "flowerA"], autumn: ["flowerC", "flowerC", "flowerB"] }[S.season];
    scene.querySelectorAll(".sc-flower").forEach((f, i) => {
      f.style.display = winter ? "none" : "";
      if (flowers) f.innerHTML = PIXEL.sprite(flowers[i % 3], 2);
    });
  }
  function paintVillage() {
    const night = S.dark > 0.45;
    scene.classList.toggle("lit", night);
    const m = scene.querySelector(".sc-mountains");
    m.style.filter = `brightness(${(1 - S.dark * 0.55).toFixed(2)}) saturate(${(1 - S.dark * 0.4).toFixed(2)})`;
    m.style.opacity = S.w.kind === "fog" ? "0.25" : S.w.wet || S.w.snowy ? "0.55" : "1";
    scene.classList.toggle("smoky", (S.w.temp != null && S.w.temp < 12) || S.season === "winter");
    const glow = scene.querySelector(".sc-glow");
    glow.style.opacity = String(clamp((S.dark - 0.35) * 1.6, 0, 1));
    const wind = S.w.wind || 0;
    scene.dataset.wind = wind >= 7 ? "windy" : wind >= 2.5 ? "breeze" : "calm";
  }

  // ---------- 동물 ----------
  // 정해진 범위 안에서 목표점을 바꿔 가며 돌아다녀요.
  const critters = [];
  function addCritter(kind, opts) {
    const box = scene.querySelector(".sc-critters");
    const frames = opts.frames || [kind];
    const e = el(opts.button ? "button" : "span", "critter " + kind, frames.map((f) => PIXEL.sprite(f, opts.scale || 2)).join(""));
    if (frames.length > 1) e.classList.add("anim");
    box.appendChild(e);
    const c = Object.assign({ kind, el: e, x: opts.x, y: opts.y, tx: opts.x, ty: opts.y, speed: 30, rest: 0, face: 1 }, opts);
    critters.push(c);
    return c;
  }
  function clearCritters(kind) {
    for (let i = critters.length - 1; i >= 0; i--) {
      if (!kind || critters[i].kind === kind) { critters[i].el.remove(); critters.splice(i, 1); }
    }
  }
  function hasCritter(kind) {
    return critters.some((c) => c.kind === kind);
  }
  function treeTop(sel) {
    const t = scene.querySelector(sel);
    if (!t) return null;
    const sr = scene.getBoundingClientRect();
    const r = t.getBoundingClientRect();
    return { x: r.left - sr.left, y: r.top - sr.top, w: r.width, h: r.height };
  }
  function syncCritters() {
    const day = S.dark < 0.35;
    const night = S.dark > 0.6;
    const dry = !S.w.wet && !S.w.snowy;
    const gt = groundTop();
    const want = {
      fly: day && dry && (S.season === "spring" || S.season === "summer") ? 2 : 0,
      dfly: day && dry && S.season === "autumn" ? 2 : 0,
      bat: S.dark > 0.3 && S.dark < 0.85 && !S.rising && (S.season === "summer" || S.season === "autumn") && dry ? 2 : 0,
      frog: S.w.wet ? 1 : 0,
      snail: day && (S.w.kind === "drizzle" || (wx && wx.lastWetAt && Date.now() - wx.lastWetAt < 3 * 3600000)) ? 1 : 0,
      owl: night ? 1 : 0,
      squirrel: day && S.season === "autumn" ? 1 : 0,
    };
    Object.keys(want).forEach((k) => {
      const have = critters.filter((c) => c.kind === k).length;
      if (have > want[k]) clearCritters(k);
      for (let i = have; i < want[k]; i++) {
        if (k === "fly") addCritter("fly", { frames: ["fly1", "fly2"], x: rand(20, S.W - 20), y: rand(gt - 50, gt - 10), speed: 28, area: [10, S.W - 10, gt - 70, gt - 6] });
        if (k === "dfly") addCritter("dfly", { frames: ["dfly"], x: rand(20, S.W - 20), y: rand(30, gt - 30), speed: 70, dart: true, area: [10, S.W - 10, 24, gt - 20] });
        if (k === "bat") addCritter("bat", { frames: ["bat1", "bat2"], x: rand(20, S.W - 20), y: rand(14, 50), speed: 60, area: [0, S.W, 10, S.H * 0.4] });
        if (k === "frog") addCritter("frog", { button: true, x: S.W * 0.3, y: gt + 6, speed: 0, hop: true, scale: 2 });
        if (k === "snail") addCritter("snail", { button: true, x: S.W * 0.85, y: gt + 10, speed: 3, area: [S.W * 0.1, S.W * 0.9, gt + 10, gt + 10], scale: 2 });
        if (k === "owl") { const t = treeTop(".sc-tree.t2"); if (t) addCritter("owl", { button: true, x: t.x + t.w / 2 - 7, y: t.y - 10, speed: 0, scale: 2 }); }
        if (k === "squirrel") { const t = treeTop(".sc-tree.t1"); if (t) addCritter("squirrel", { button: true, x: t.x + t.w / 2, y: t.y + 4, speed: 0, perch: t, scale: 2 }); }
      }
    });
    if (!S.dogDone && day && dry && (new Date(now()).getDay() % 6 === 0) && !hasCritter("dog") && Math.random() < 0.5) {
      S.dogDone = true;
      setTimeout(() => { if (!hasCritter("dog")) addCritter("dog", { button: true, frames: ["dog1", "dog2"], x: -30, y: groundTop() + 4, tx: S.W + 40, ty: groundTop() + 4, speed: 36, walkOff: true, scale: 3 }); }, rand(2000, 9000));
    }
  }
  function stepCritters(dt, time) {
    for (let i = critters.length - 1; i >= 0; i--) {
      const c = critters[i];
      if (c.hop) {
        c.rest -= dt;
        if (c.rest <= 0) { c.rest = rand(2, 5); play(c.el, "hop"); }
      } else if (c.speed > 0) {
        const dx = c.tx - c.x, dy = c.ty - c.y;
        const d = Math.hypot(dx, dy);
        if (d < 2) {
          if (c.walkOff) { c.el.remove(); critters.splice(i, 1); continue; }
          const a = c.area;
          c.tx = rand(a[0], a[1]);
          c.ty = rand(a[2], a[3]);
        } else {
          const v = c.speed * (c.dart ? (Math.sin(time * 3 + i) > 0.6 ? 2.4 : 0.4) : 1);
          c.x += (dx / d) * v * dt + (S.gust * 0.05 * dt);
          c.y += (dy / d) * v * dt + (c.kind === "fly" ? Math.sin(time * 6 + i) * 10 * dt : 0);
          if (Math.abs(dx) > 1) c.face = dx < 0 ? -1 : 1;
        }
      } else if (c.perch && c.kind === "squirrel") {
        // 다람쥐는 가끔 나무에서 내려왔다가 올라가요.
        c.rest -= dt;
        if (c.rest <= 0) {
          c.rest = rand(5, 10);
          const down = c.y < c.perch.y + c.perch.h * 0.5;
          c.y = down ? groundTop() + 2 : c.perch.y + 4;
          c.x = c.perch.x + c.perch.w / 2 + (down ? rand(6, 26) : 0);
          c.el.classList.toggle("down", down);
        }
      }
      c.el.style.transform = `translate(${Math.round(c.x)}px, ${Math.round(c.y)}px) scaleX(${c.kind === "dog" || c.kind === "snail" ? -c.face : c.face})`;
    }
  }
  function tapCritter(c, x, y) {
    const H = window.HSD || {};
    play(c.el, "boing");
    if (c.kind === "frog") { play(c.el, "hop"); if (H.bubble) H.bubble("개굴", "him"); for (let k = 0; k < 6; k++) spawn({ t: "splash", x: x + rand(-6, 6), y: y + 4, vx: rand(-60, 60), vy: rand(-140, -60), life: 0.5 }); }
    if (c.kind === "owl") { if (H.bubble) H.bubble("부엉", "her"); shootingStar(x + 30, y - 10); }
    if (c.kind === "squirrel") { if (H.bubble) H.bubble("도토리 줄게", "her"); for (let k = 0; k < 3; k++) spawnLeaf(x + rand(-6, 6), y, rand(-60, 60), -rand(40, 100)); }
    if (c.kind === "snail") { if (H.bubble) H.bubble("느릿느릿", "him"); c.el.classList.add("hide"); setTimeout(() => c.el.classList.remove("hide"), 2500); }
    if (c.kind === "dog") { if (H.bubble) H.bubble("멍멍!", "him"); burst(x, y - 10, 6, "heart"); c.speed = 70; }
  }

  // ---------- 감정 표시 ----------
  let emoteT = 4;
  function emote(who, kind) {
    const p = charPos(who);
    if (!p) return;
    const e = el("span", "emote", PIXEL.sprite(kind, 3), `left:${Math.round(p.x + (who === "him" ? -22 : 10))}px;top:${Math.round(p.y - 86)}px`);
    $("props").appendChild(e);
    e.addEventListener("animationend", () => e.remove());
  }
  function pickEmote(who) {
    const w = S.w;
    const H = window.HSD || {};
    const mood = H.mood ? H.mood(who) : 0;
    const pool = [];
    if (S.act && (S.act.key === "sleep" || S.act.key === "bedtime")) return null;
    if (w.temp != null && w.temp >= 28) pool.push("emoSweat", "emoSweat");
    if (w.temp != null && w.temp <= 0) pool.push("emoDots");
    if (w.kind === "thunder") pool.push("emoBang", "emoBang");
    if (w.wet) pool.push("emoDots", "emoQ");
    if (S.celebrate) pool.push("emoStar", "emoHeart", "emoHeart");
    if (mood === 1 || mood === 2) pool.push("emoHeart", "emoNote", "emoNote");
    if (mood === 4 || mood === 5) pool.push("emoSweat", "emoDots");
    if (S.act && ["walk", "cafe", "movie", "stargaze", "kite"].includes(S.act.key)) pool.push("emoHeart", "emoNote");
    pool.push("emoHeart", "emoNote", "emoStar", "emoQ");
    return pool[Math.floor(Math.random() * pool.length)];
  }
  function stepEmotes(dt) {
    emoteT -= dt;
    if (emoteT > 0) return;
    emoteT = rand(6, 13);
    const who = Math.random() < 0.5 ? "him" : "her";
    const k = pickEmote(who);
    if (k) emote(who, k);
    if (S.w.temp != null && S.w.temp <= 0) { const b = document.querySelector(`.bob[data-who="${who}"]`); if (b) play(b, "shiver"); }
  }

  // ---------- 산책: 둘이 왔다 갔다 ----------
  let walkX = 0;
  let walkDir = 1;
  function stepWalk(dt, time) {
    const couple = $("couple");
    if (!couple) return;
    const walking = S.act && S.act.key === "walk";
    const target = walking ? Math.sin(time / 7) * Math.min(70, S.W * 0.18) : 0;
    const prev = walkX;
    walkX += (target - walkX) * Math.min(1, dt * 1.5);
    const v = walkX - prev;
    if (Math.abs(v) > 0.02) walkDir = v < 0 ? -1 : 1;
    couple.style.transform = `translateX(calc(-50% + ${walkX.toFixed(1)}px))`;
    couple.classList.toggle("walking", walking && Math.abs(v) > 0.02);
    couple.classList.toggle("face-left", walking && walkDir < 0);
  }

  // ---------- 별자리 (별 보기) ----------
  const CONST = [[0.62, 0.12], [0.68, 0.2], [0.75, 0.16], [0.8, 0.26], [0.88, 0.22], [0.84, 0.34]];
  function drawConstellation(ctx, time) {
    if (!S.act || S.act.key !== "stargaze" || S.dark < 0.6) return;
    const pts = CONST.map(([x, y]) => [x * S.W, y * S.H]);
    ctx.fillStyle = "rgba(255,247,214," + (0.35 + 0.15 * Math.sin(time * 2)).toFixed(2) + ")";
    for (let i = 0; i < pts.length - 1; i++) {
      const [x0, y0] = pts[i], [x1, y1] = pts[i + 1];
      const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 4);
      for (let k = 0; k <= n; k++) ctx.fillRect(Math.round(lerp(x0, x1, k / n)), Math.round(lerp(y0, y1, k / n)), 1, 1);
    }
    pts.forEach(([x, y]) => { ctx.fillStyle = "#fff7d6"; ctx.fillRect(Math.round(x) - 1, Math.round(y) - 1, 3, 3); });
  }

  // ---------- 파티클 ----------
  function spawn(p) {
    if (S.parts.length > 420) return;
    S.parts.push(p);
  }
  function leafColor() {
    const list = LEAF_COLORS[S.season];
    return list[Math.floor(Math.random() * list.length)];
  }
  function spawnLeaf(x, y, vx, vy, kind) {
    spawn({ t: "leaf", kind: kind || (S.season === "spring" ? "petal" : "leaf"), x, y, vx: vx || 0, vy: vy || rand(20, 40), ph: rand(0, 6), c: leafColor(), land: rand(groundTop() + 2, S.H - 4), spin: rand(2, 5) });
  }
  function avgSnow() {
    if (!S.snow.length) return 0;
    return S.snow.reduce((a, b) => a + b, 0) / S.snow.length;
  }

  function step(dt, time) {
    const w = S.w;
    S.gust *= Math.pow(0.25, dt);
    const wind = S.wind + S.gust;
    const gt = groundTop();
    // 비
    const rainRate = { drizzle: 25, rain: 60, heavy: 110, thunder: 90 }[w.kind] || 0;
    S.acc.rain += rainRate * dt;
    while (S.acc.rain >= 1) { S.acc.rain--; spawn({ t: "rain", x: rand(-40, S.W + 40), y: rand(-20, -2), vx: wind * 1.4, vy: rand(330, 420), land: rand(gt + 2, S.H - 3) }); }
    // 눈
    const snowRate = { snow: 16, heavysnow: 34 }[w.kind] || 0;
    S.acc.snow += snowRate * dt;
    while (S.acc.snow >= 1) { S.acc.snow--; spawn({ t: "snow", x: rand(-30, S.W + 30), y: rand(-10, -2), vx: wind * 0.6, vy: rand(22, 42), ph: rand(0, 6), s: Math.random() < 0.25 ? 2 : 1 }); }
    // 계절에 따라 떨어지는 것
    const leafRate = { autumn: 0.55, spring: 0.7, summer: 0.06, winter: 0 }[S.season] * (1 + (w.wind || 0) / 4) * (w.wet ? 0.4 : 1);
    S.acc.leaf += leafRate * dt;
    while (S.acc.leaf >= 1) { S.acc.leaf--; spawnLeaf(rand(0, S.W), -6, wind * 0.5); }
    // 반딧불
    if (S.season === "summer" && S.dark > 0.6 && !w.wet && S.parts.filter((p) => p.t === "firefly").length < 9) {
      spawn({ t: "firefly", x: rand(0, S.W), y: rand(S.H * 0.35, gt), ph: rand(0, 6), life: rand(8, 16) });
    }
    // 입김
    if ((w.temp != null && w.temp <= 3) && !(S.act && S.act.key === "sleep")) {
      S.acc.breath += dt / 2.4;
      if (S.acc.breath >= 1) { S.acc.breath = 0; ["him", "her"].forEach((who, i) => { const c = charPos(who); if (c) setTimeout(() => spawn({ t: "breath", x: c.x + (who === "him" ? 14 : -14), y: c.y - 30, life: 1.2, max: 1.2 }), i * 600); }); }
    }
    // 불꽃놀이
    if (S.celebrate && S.dark > 0.5) {
      S.acc.firework += dt / 2.6;
      if (S.acc.firework >= 1) { S.acc.firework = 0; firework(rand(S.W * 0.15, S.W * 0.85), rand(14, S.H * 0.35)); }
    }
    // 새
    if (S.dark < 0.3 && !w.wet && !w.snowy && S.birds.length < 3) {
      S.acc.bird += dt / 18;
      if (S.acc.bird >= 1) { S.acc.bird = 0; addBirds(Math.random() < 0.5 ? -10 : S.W + 10, rand(10, S.H * 0.3)); }
    }
    // 별똥별
    if (S.dark > 0.75 && !w.wet && !w.snowy && Math.random() < dt / 25) shootingStar(rand(S.W * 0.3, S.W), rand(4, 30));

    // 움직이기
    const out = [];
    for (const p of S.parts) {
      let keep = true;
      switch (p.t) {
        case "rain":
          p.x += (p.vx + S.gust) * dt; p.y += p.vy * dt;
          if (p.y >= p.land) {
            keep = false;
            if (Math.random() < 0.35) for (let k = 0; k < 2; k++) out.push({ t: "splash", x: p.x, y: p.land, vx: rand(-40, 40), vy: rand(-70, -30), life: 0.35 });
            if (Math.random() < 0.12) S.ripples.push({ x: p.x, y: p.land, r: 0, life: 0.5 });
            growPuddle(p.x, p.land);
          }
          break;
        case "snow":
          p.ph += dt * 2;
          p.x += (p.vx + S.gust * 0.6 + Math.sin(p.ph) * 12) * dt; p.y += p.vy * dt;
          if (p.y >= gt - snowAt(p.x) * S.u + 2) { keep = false; addSnow(p.x, 0.16 * p.s); }
          break;
        case "leaf":
          p.ph += dt * p.spin;
          p.vy += (p.flying ? 260 : 0) * dt;
          if (p.flying) { p.vx *= Math.pow(0.5, dt); p.vy = Math.min(p.vy, 90); }
          p.x += (p.vx + (p.flying ? 0 : S.gust + Math.sin(p.ph) * 18)) * dt + (p.flying ? 0 : wind * 0.3 * dt);
          p.y += (p.flying ? p.vy : p.vy + Math.cos(p.ph) * 6) * dt;
          if (p.x < -20 || p.x > S.W + 20) keep = false;
          else if (p.y >= p.land && (!p.flying || p.vy > 0)) {
            keep = false;
            S.rest.push({ x: p.x, y: p.land, c: p.c, kind: p.kind, f: Math.floor(p.ph) % 2 });
            if (S.rest.length > 170) S.rest.shift();
            S.backDirty = true;
          }
          break;
        case "firefly":
          p.ph += dt; p.life -= dt;
          p.x += Math.sin(p.ph * 0.9) * 14 * dt + S.gust * 0.2 * dt; p.y += Math.cos(p.ph * 1.3) * 9 * dt;
          if (p.life <= 0) keep = false;
          break;
        case "splash": case "spark": case "puff": case "grass":
          p.vy += (p.t === "spark" ? 60 : 420) * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          if (p.life <= 0) keep = false;
          break;
        case "rocket":
          p.y += p.vy * dt; p.vy += 90 * dt; p.life -= dt;
          if (p.vy >= -20 || p.life <= 0) { keep = false; burstFirework(p.x, p.y); }
          break;
        case "breath":
          p.life -= dt; p.y -= 10 * dt; p.x += (S.gust * 0.2 + 6) * dt;
          if (p.life <= 0) keep = false;
          break;
        case "star":
          p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt;
          if (p.life <= 0) keep = false;
          break;
        case "love": {
          p.k += dt / p.dur;
          if (p.k >= 1) { keep = false; if (p.onEnd) p.onEnd(); break; }
          const k = Math.max(0, p.k);
          p.x = lerp(p.x0, p.x1, k);
          p.y = lerp(p.y0, p.y1, k) - Math.sin(k * Math.PI) * p.arc;
          break;
        }
      }
      if (keep) out.push(p);
    }
    S.parts = out;
    // 녹고 마르기
    if (!w.snowy && (w.temp == null || w.temp > 1)) {
      let changed = false;
      for (let i = 0; i < S.snow.length; i++) if (S.snow[i] > 0) { S.snow[i] = Math.max(0, S.snow[i] - dt * 0.01); changed = true; }
      if (changed && Math.random() < 0.05) S.backDirty = true;
    }
    if (!w.wet && S.puddles.length) {
      S.puddles.forEach((p) => { p.w -= dt * 0.02; });
      S.puddles = S.puddles.filter((p) => p.w > 0.5);
      if (Math.random() < 0.05) S.backDirty = true;
    }
    S.ripples.forEach((r) => { r.life -= dt; r.r += dt * 18; });
    S.ripples = S.ripples.filter((r) => r.life > 0);
    // 구름, 새, 나비, 고양이
    const cw = S.W + 100;
    S.clouds.forEach((c) => {
      c.x += (5 + wind * 0.5) * c.speed * dt;
      if (c.x > S.W + 20) c.x -= cw;
      if (c.x < -100) c.x += cw;
      c.el.style.transform = `translate(${Math.round(c.x)}px, ${c.y}px)`;
    });
    stepBirds(dt, time);
    stepCat(dt, time);
    stepCritters(dt, time);
    stepEmotes(dt);
    stepWalk(dt, time);
  }

  function addSnow(x, amt) {
    const i = clamp(Math.floor(x / S.u), 0, S.snow.length - 1);
    S.snow[i] = Math.min(10, (S.snow[i] || 0) + amt);
    // 옆이 낮으면 흘러내려요.
    for (const j of [i - 1, i + 1]) {
      if (j >= 0 && j < S.snow.length && S.snow[i] - S.snow[j] > 1) { const m = (S.snow[i] - S.snow[j]) / 3; S.snow[i] -= m; S.snow[j] += m; }
    }
    S.backDirty = true;
  }
  function growPuddle(x, y) {
    let p = S.puddles.find((q) => Math.abs(q.x - x) < 30 && Math.abs(q.y - y) < 8);
    if (!p) {
      if (S.puddles.length >= 5 || Math.random() > 0.05) return;
      p = { x, y: clamp(y, groundTop() + 6, S.H - 6), w: 1 };
      S.puddles.push(p);
    }
    p.w = Math.min(18, p.w + 0.03);
    S.backDirty = true;
  }

  // ---------- 그리기 ----------
  function drawBack() {
    S.backDirty = false;
    const ctx = bctx;
    ctx.clearRect(0, 0, S.W, S.H);
    const u = S.u;
    const gt = groundTop();
    // 웅덩이
    S.puddles.forEach((p) => {
      const w = Math.round(p.w) * u;
      px(ctx, p.x - w / 2, p.y, w, u, "rgba(127,178,229,.75)");
      px(ctx, p.x - w / 2 + u, p.y - u, Math.max(0, w - 2 * u), u, "rgba(127,178,229,.6)");
      px(ctx, p.x - w / 2 + u, p.y + u, Math.max(0, w - 2 * u), u, "rgba(95,143,192,.6)");
      px(ctx, p.x - w / 4, p.y - u, u * 2, u, "rgba(255,255,255,.6)");
    });
    // 쌓인 눈
    for (let i = 0; i < S.snow.length; i++) {
      const h = Math.round(S.snow[i]);
      if (h <= 0) continue;
      px(ctx, i * u, gt - h * u + 2, u, h * u + 4, "#ffffff");
      px(ctx, i * u, gt + 4, u, u, "#dfe9f3");
    }
    // 쌓인 낙엽과 꽃잎
    S.rest.forEach((l) => drawLeaf(ctx, l.x, l.y, l.c, l.kind, l.f));
  }
  function drawLeaf(ctx, x, y, c, kind, f) {
    const u = S.u;
    if (kind === "petal") {
      px(ctx, x, y, u, u, c); px(ctx, x + u, y + (f ? u : 0), u, u, c);
      return;
    }
    if (f) { px(ctx, x, y, u * 2, u, c); px(ctx, x + u, y + u, u * 2, u, c); }
    else { px(ctx, x + u, y, u, u, c); px(ctx, x, y + u, u * 3, u, c); px(ctx, x + u, y + 2 * u, u, u, c); }
  }
  function drawFront(time) {
    const ctx = fctx;
    ctx.clearRect(0, 0, S.W, S.H);
    const u = S.u;
    const night = S.dark > 0.55;
    for (const p of S.parts) {
      switch (p.t) {
        case "rain": {
          const c = night ? "rgba(200,215,255,.55)" : "rgba(120,160,215,.6)";
          const lean = clamp((p.vx + S.gust) / 200, -1, 1) * u;
          px(ctx, p.x, p.y, 1, u * 2, c);
          px(ctx, p.x - lean, p.y + u * 2, 1, u * 2, c);
          break;
        }
        case "snow": px(ctx, p.x, p.y, u * p.s * 0.75 + 1, u * p.s * 0.75 + 1, "#ffffff"); break;
        case "leaf": drawLeaf(ctx, p.x, p.y, p.c, p.kind, Math.floor(p.ph) % 2); break;
        case "firefly": {
          const a = 0.5 + 0.5 * Math.sin(p.ph * 4);
          ctx.globalAlpha = a * 0.35; px(ctx, p.x - u, p.y - u, u * 3, u * 3, "#fff3a0");
          ctx.globalAlpha = 0.6 + a * 0.4; px(ctx, p.x, p.y, u, u, "#fff7c0");
          ctx.globalAlpha = 1;
          break;
        }
        case "splash": px(ctx, p.x, p.y, u, u, "rgba(150,190,240,.9)"); break;
        case "puff": ctx.globalAlpha = clamp(p.life * 2, 0, 1); px(ctx, p.x, p.y, u, u, "#ffffff"); ctx.globalAlpha = 1; break;
        case "grass": px(ctx, p.x, p.y, u, u, p.c); break;
        case "spark": ctx.globalAlpha = clamp(p.life / p.max, 0, 1); px(ctx, p.x, p.y, u, u, p.c); ctx.globalAlpha = 1; break;
        case "rocket": px(ctx, p.x, p.y, u, u * 2, "#fff3c4"); break;
        case "breath": {
          const k = 1 - p.life / p.max;
          ctx.globalAlpha = 0.6 * (1 - k);
          const s = u * (1 + Math.round(k * 2));
          px(ctx, p.x, p.y, s, s, "#ffffff");
          ctx.globalAlpha = 1;
          break;
        }
        case "star":
          for (let i = 0; i < 6; i++) { ctx.globalAlpha = (1 - i / 6) * clamp(p.life, 0, 1); px(ctx, p.x - p.vx * 0.02 * i, p.y - p.vy * 0.02 * i, u, u, "#fff7d6"); }
          ctx.globalAlpha = 1;
          break;
        case "love": {
          if (p.k < 0) break;
          for (let y = 0; y < HEART.length; y++) for (let x = 0; x < HEART[y].length; x++) {
            if (HEART[y][x] === "1") px(ctx, p.x + (x - 3) * (u - 1), p.y + y * (u - 1), u - 1, u - 1, "#ff86ad");
          }
          break;
        }
      }
    }
    // 물결
    S.ripples.forEach((r) => {
      ctx.globalAlpha = clamp(r.life * 2, 0, 1) * 0.7;
      px(ctx, r.x - r.r, r.y, u, 1, "#dff3ff");
      px(ctx, r.x + r.r, r.y, u, 1, "#dff3ff");
      ctx.globalAlpha = 1;
    });
    // 연줄
    const kite = $("kite");
    if (kite) {
      const sr = scene.getBoundingClientRect();
      const kr = kite.getBoundingClientRect();
      const hand = charPos("him");
      if (hand) {
        const x0 = kr.left - sr.left + kr.width / 2, y0 = kr.top - sr.top + kr.height;
        const x1 = hand.x - 14, y1 = hand.y - 20;
        ctx.fillStyle = "rgba(91,70,56,.6)";
        for (let k = 0; k <= 1; k += 0.03) {
          const x = lerp(x0, x1, k), y = lerp(y0, y1, k) + Math.sin(k * Math.PI) * 10;
          ctx.fillRect(Math.round(x), Math.round(y), 1, 1);
        }
      }
    }
    drawConstellation(ctx, time);
    // 번개
    if (S.w.kind === "thunder" && Math.random() < 1 / 420) flash();
  }

  // ---------- 효과 ----------
  function firework(x, y) {
    spawn({ t: "rocket", x, y: S.H - 30, vy: -Math.sqrt(2 * 90 * (S.H - 30 - y)) - 10, life: 3 });
  }
  function burstFirework(x, y) {
    const colors = ["#ff86ad", "#ffd978", "#7fb2e5", "#86cc86", "#ffffff", "#ee9453"];
    const c = colors[Math.floor(Math.random() * colors.length)];
    for (let i = 0; i < 26; i++) {
      const a = (i / 26) * Math.PI * 2;
      const v = rand(40, 75);
      spawn({ t: "spark", x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, life: rand(0.8, 1.3), max: 1.3, c: i % 5 === 0 ? "#ffffff" : c });
    }
  }
  function shootingStar(x, y) {
    spawn({ t: "star", x, y, vx: -rand(160, 230), vy: rand(60, 110), life: 1.1 });
  }
  function flash() {
    const f = $("flash");
    f.classList.remove("on");
    void f.offsetWidth;
    f.classList.add("on");
    scene.classList.remove("shake");
    void scene.offsetWidth;
    scene.classList.add("shake");
  }
  function charPos(who) {
    const el = document.querySelector(`.bob[data-who="${who}"]`);
    if (!el) return null;
    const sr = scene.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height };
  }

  // ---------- 새와 고양이 ----------
  function addBirds(x, y) {
    const dir = x < S.W / 2 ? 1 : -1;
    for (let i = 0; i < 2 + Math.floor(Math.random() * 2); i++) {
      const el = document.createElement("span");
      el.className = "bird";
      el.innerHTML = PIXEL.sprite("bird1", 2) + PIXEL.sprite("bird2", 2);
      $("props").appendChild(el);
      S.birds.push({ el, x: x - dir * i * 14, y: y + i * 7, vx: dir * rand(38, 55), ph: rand(0, 6) });
    }
  }
  function stepBirds(dt) {
    S.birds = S.birds.filter((b) => {
      b.x += b.vx * dt; b.ph += dt * 3;
      b.el.style.transform = `translate(${Math.round(b.x)}px, ${Math.round(b.y + Math.sin(b.ph) * 4)}px) scaleX(${b.vx < 0 ? -1 : 1})`;
      if (b.x < -40 || b.x > S.W + 40) { b.el.remove(); return false; }
      return true;
    });
  }
  function catVisit() {
    if (S.cat || S.dark > 0.5 || S.w.wet || S.w.snowy) return;
    const el = document.createElement("button");
    el.className = "cat";
    el.setAttribute("aria-label", "고양이");
    el.innerHTML = `<span class="walk">${PIXEL.sprite("cat1", 3)}${PIXEL.sprite("cat2", 3)}</span><span class="sit">${PIXEL.sprite("catSit", 3)}</span>`;
    $("props").appendChild(el);
    S.cat = { el, x: S.W + 10, target: S.W / 2 + 76 + rand(0, 20), state: "walk", t: 0 };
  }
  function stepCat(dt) {
    const c = S.cat;
    if (!c) return;
    c.t += dt;
    if (c.state === "walk") {
      c.x -= 26 * dt;
      if (c.x <= c.target) { c.state = "sit"; c.t = 0; c.el.classList.add("sitting"); }
    } else if (c.state === "sit" && c.t > 40) {
      c.state = "leave"; c.el.classList.remove("sitting"); c.el.classList.add("leaving");
    } else if (c.state === "leave") {
      c.x += 34 * dt;
      if (c.x > S.W + 30) { c.el.remove(); S.cat = null; return; }
    }
    c.el.style.transform = `translateX(${Math.round(c.x)}px)`;
  }

  // ---------- 누르기 ----------
  let rainbowEgg = 0;
  let skyTaps = [];
  function onTap(ev) {
    const t = ev.target;
    if (t.closest(".bob") || t.closest("#plant") || t.closest(".weather-chip") || t.closest(".phase-chip")) return;
    const sr = scene.getBoundingClientRect();
    const x = ev.clientX - sr.left;
    const y = ev.clientY - sr.top;
    const H = window.HSD || {};
    const crit = t.closest(".critter");
    if (crit) {
      const c = critters.find((k) => k.el === crit);
      if (c) tapCritter(c, x, y);
      return;
    }
    if (t.closest(".house")) {
      const h = t.closest(".house");
      play(h, "boing");
      for (let k = 0; k < 5; k++) spawn({ t: "puff", x: x + rand(-4, 4), y: y - 10, vx: rand(-20, 20), vy: rand(-60, -30), life: 1 });
      if (H.bubble) H.bubble(S.dark > 0.45 ? "불 켜진 집 따뜻해 보여" : "저기 살고 싶다", "her");
      return;
    }
    if (t.closest(".sc-lamp")) { scene.classList.toggle("lamp-off"); play(t.closest(".sc-lamp"), "boing"); return; }
    if (t.closest(".emote")) { burst(x, y, 4, "heart"); return; }
    if (t.closest(".cat")) {
      const c = S.cat;
      if (c) { c.t = 0; if (c.state === "leave") { c.state = "sit"; c.el.classList.add("sitting"); c.el.classList.remove("leaving"); } }
      play(t.closest(".cat"), "boing");
      burst(x, y - 10, 5, "heart");
      if (H.bubble) H.bubble("냥", "her");
      return;
    }
    if (t.closest(".cloud")) {
      const el = t.closest(".cloud");
      play(el, "puff");
      const r = el.getBoundingClientRect();
      const cx = r.left - sr.left + r.width / 2, cy = r.top - sr.top + r.height;
      for (let i = 0; i < 8; i++) {
        if (S.w.snowy || S.season === "winter") spawn({ t: "snow", x: cx + rand(-16, 16), y: cy, vx: 0, vy: rand(30, 50), ph: rand(0, 6), s: 1 });
        else spawn({ t: "rain", x: cx + rand(-16, 16), y: cy + rand(0, 6), vx: 0, vy: rand(260, 320), land: rand(groundTop() + 2, S.H - 3) });
      }
      return;
    }
    if (t.closest(".sc-sun")) { play($("sun"), "spin"); burst(x, y, 8); skyTaps.push(Date.now()); checkEgg(); return; }
    if (t.closest(".sc-moon")) { play($("moon"), "spin"); shootingStar(x + 20, y); burst(x, y, 6); return; }
    if (t.closest(".sc-tree")) { shakeTree(t.closest(".sc-tree")); return; }
    if (t.closest(".sc-flower")) {
      const f = t.closest(".sc-flower");
      play(f, "boing");
      if (S.season !== "winter" && S.dark < 0.5) addFly(x, y - 10);
      return;
    }
    if (t.closest(".snowman")) { play(t.closest(".snowman"), "boing"); for (let i = 0; i < 10; i++) spawn({ t: "puff", x: x + rand(-10, 10), y: y + rand(-10, 4), vx: rand(-60, 60), vy: rand(-140, -60), life: 0.8 }); return; }
    if (t.closest(".kite")) { play(t.closest(".kite"), "spin"); S.gust += 120; return; }
    if (t.closest(".balloon")) { play(t.closest(".balloon"), "boing"); burst(x, y, 6, "heart"); return; }
    if (t.closest(".fire")) { for (let i = 0; i < 12; i++) spawn({ t: "spark", x: x + rand(-6, 6), y: y - 6, vx: rand(-30, 30), vy: rand(-90, -40), life: rand(0.5, 0.9), max: 0.9, c: i % 2 ? "#ffd978" : "#ff8a4a" }); return; }
    if (y < groundTop() - 18) tapSky(x, y);
    else tapGround(x, y);
  }
  function checkEgg() {
    skyTaps = skyTaps.filter((t) => Date.now() - t < 3000);
    if (skyTaps.length >= 5) {
      skyTaps = [];
      rainbowEgg = Date.now() + 60000;
      $("rainbow").classList.add("on");
      if (window.HSD && window.HSD.toast) window.HSD.toast("무지개가 떴어요");
    }
  }
  function tapSky(x, y) {
    if (S.celebrate && S.dark > 0.4) { firework(x, y); return; }
    if (S.dark > 0.55) { shootingStar(x, y); return; }
    if (S.w.kind === "thunder") { flash(); return; }
    if (S.w.wet) { for (let i = 0; i < 10; i++) spawn({ t: "rain", x: x + rand(-14, 14), y: y + rand(-6, 6), vx: 0, vy: rand(260, 330), land: rand(groundTop() + 2, S.H - 3) }); return; }
    addBirds(x, y);
  }
  function tapGround(x, y) {
    let hit = 0;
    // 쌓인 낙엽 날리기
    S.rest = S.rest.filter((l) => {
      const dx = l.x - x, dy = l.y - y;
      const d = Math.hypot(dx, dy);
      if (d > 64) return true;
      hit++;
      const push = (1 - d / 64) * 220 + 60;
      spawn({ t: "leaf", kind: l.kind, x: l.x, y: l.y - 2, vx: (dx >= 0 ? 1 : -1) * push * rand(0.6, 1.1), vy: -rand(140, 280) * (1 - d / 90), ph: rand(0, 6), c: l.c, land: rand(groundTop() + 2, S.H - 4), spin: rand(6, 12), flying: true });
      return false;
    });
    // 쌓인 눈 퍼내기
    const i0 = Math.floor(x / S.u);
    for (let i = i0 - 10; i <= i0 + 10; i++) {
      if (i < 0 || i >= S.snow.length || S.snow[i] <= 0) continue;
      const take = Math.min(S.snow[i], (1 - Math.abs(i - i0) / 11) * 3);
      if (take <= 0) continue;
      S.snow[i] -= take;
      hit++;
      if (Math.random() < 0.6) spawn({ t: "puff", x: i * S.u, y: groundTop() - S.snow[i] * S.u, vx: rand(-80, 80), vy: rand(-170, -70), life: 0.9 });
    }
    // 웅덩이 첨벙
    S.puddles.forEach((p) => {
      if (Math.abs(p.x - x) < p.w * S.u / 2 + 8 && Math.abs(p.y - y) < 14) {
        hit++;
        for (let k = 0; k < 10; k++) spawn({ t: "splash", x: p.x + rand(-p.w, p.w), y: p.y, vx: rand(-80, 80), vy: rand(-180, -80), life: 0.6 });
        S.ripples.push({ x: p.x, y: p.y, r: 0, life: 0.8 });
      }
    });
    if (hit) { S.backDirty = true; return; }
    // 아무것도 없으면 풀잎이 튀고, 가을이면 낙엽 몇 장이 날려요.
    for (let k = 0; k < 5; k++) spawn({ t: "grass", x: x + rand(-4, 4), y, vx: rand(-60, 60), vy: rand(-140, -60), life: 0.5, c: k % 2 ? "#74c178" : "#9bd68f" });
    if (S.season === "autumn" || S.season === "spring") for (let k = 0; k < 3; k++) spawnLeaf(x + rand(-8, 8), y - 4, rand(-90, 90), -rand(60, 140));
  }
  function shakeTree(el) {
    play(el, "shake");
    const sr = scene.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    const cx = r.left - sr.left + r.width / 2, cy = r.top - sr.top + r.height * 0.35;
    const n = S.season === "summer" ? 3 : 9;
    for (let i = 0; i < n; i++) {
      if (S.season === "winter") spawn({ t: "snow", x: cx + rand(-14, 14), y: cy + rand(-8, 8), vx: rand(-20, 20), vy: rand(30, 60), ph: rand(0, 6), s: 1 });
      else spawnLeaf(cx + rand(-14, 14), cy + rand(-8, 8), rand(-50, 50), rand(10, 50));
    }
  }
  function addFly(x, y) {
    const el = document.createElement("span");
    el.className = "fly";
    el.innerHTML = S.season === "autumn" ? PIXEL.sprite("dfly", 2) + PIXEL.sprite("dfly", 2) : PIXEL.sprite("fly1", 2) + PIXEL.sprite("fly2", 2);
    el.style.transform = `translate(${Math.round(x)}px, ${Math.round(y)}px)`;
    $("props").appendChild(el);
    const tx = x + rand(-80, 80), ty = rand(10, S.H * 0.5);
    requestAnimationFrame(() => { el.style.transform = `translate(${Math.round(tx)}px, ${Math.round(ty)}px)`; el.style.opacity = "0"; });
    setTimeout(() => el.remove(), 3200);
  }
  function play(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
    el.addEventListener("animationend", function done(e) {
      if (e.animationName !== cls) return;
      el.classList.remove(cls);
      el.removeEventListener("animationend", done);
    });
  }
  function burst(x, y, n, kind) {
    const H = window.HSD;
    if (!H || !H.burst) return;
    const sr = scene.getBoundingClientRect();
    H.burst(sr.left + x, sr.top + y, n, kind);
  }

  // 쓸어 넘기면 바람이 불어요.
  let drag = null;
  function onDown(ev) {
    drag = { x: ev.clientX, y: ev.clientY, t: performance.now(), moved: 0 };
  }
  function onMove(ev) {
    if (!drag) return;
    const dt = Math.max(16, performance.now() - drag.t);
    const vx = (ev.clientX - drag.x) / dt * 1000;
    drag.moved += Math.abs(ev.clientX - drag.x);
    drag.x = ev.clientX; drag.y = ev.clientY; drag.t = performance.now();
    if (drag.moved > 24) {
      S.gust = clamp(S.gust + vx * 0.08, -420, 420);
      const sr = scene.getBoundingClientRect();
      const x = ev.clientX - sr.left;
      S.rest = S.rest.filter((l) => {
        if (Math.abs(l.x - x) > 22) return true;
        spawn({ t: "leaf", kind: l.kind, x: l.x, y: l.y - 2, vx: vx * 0.4, vy: -rand(80, 180), ph: rand(0, 6), c: l.c, land: rand(groundTop() + 2, S.H - 4), spin: rand(6, 12), flying: true });
        S.backDirty = true;
        return false;
      });
    }
  }
  function onUp() {
    if (drag && drag.moved > 24) scene.dataset.swiped = String(Date.now());
    drag = null;
  }

  // ---------- 저장 ----------
  function save() {
    lsSet("hsd.scene", {
      at: Date.now(), W: S.W,
      rest: S.rest.map((l) => [Math.round(l.x), Math.round(l.y - (S.H - 24)), l.c, l.kind === "petal" ? 1 : 0, l.f]),
      snow: S.snow.map((v) => Math.round(v * 10) / 10),
      puddles: S.puddles.map((p) => [Math.round(p.x), Math.round(p.y - (S.H - 24)), Math.round(p.w)]),
    });
  }
  function restore() {
    const d = lsGet("hsd.scene");
    if (!d) return;
    const age = Date.now() - (d.at || 0);
    const kx = S.W / (d.W || S.W);
    let rest = (d.rest || []).map((r) => ({ x: r[0] * kx, y: S.H - 24 + r[1], c: r[2], kind: r[3] ? "petal" : "leaf", f: r[4] }));
    if (age > 2 * 86400000) rest = rest.filter((_, i) => i % 3 === 0);
    S.rest = rest;
    if (age < 12 * 3600000 && Array.isArray(d.snow)) {
      const n = S.snow.length;
      S.snow = new Array(n).fill(0).map((_, i) => d.snow[Math.floor((i / n) * d.snow.length)] || 0);
    }
    if (age < 3600000) S.puddles = (d.puddles || []).map((p) => ({ x: p[0] * kx, y: S.H - 24 + p[1], w: p[2] }));
    S.backDirty = true;
  }

  // ---------- 하트 날리기 (보낸 사람에서 받는 사람에게) ----------
  function loveFlight(from, n, onEnd) {
    const a = charPos(from), b = charPos(from === "him" ? "her" : "him");
    if (!a || !b) return;
    n = Math.min(n, 8);
    for (let i = 0; i < n; i++) {
      spawn({ t: "love", x0: a.x, y0: a.y - 40, x1: b.x, y1: b.y - 40, x: a.x, y: a.y - 40, k: -i * 0.18, dur: 1.1, arc: 30 + i * 3, onEnd: i === n - 1 ? onEnd : null });
    }
  }

  // ---------- 돌리기 ----------
  let raf = 0;
  let last = 0;
  function loop(ts) {
    raf = requestAnimationFrame(loop);
    const dt = last ? Math.min(0.05, (ts - last) / 1000) : 0.016;
    last = ts;
    step(dt, ts / 1000);
    if (S.backDirty) drawBack();
    drawFront(ts / 1000);
  }
  function setRunning() {
    const want = S.active && S.visible && !reduced();
    if (want && !S.running) { S.running = true; last = 0; raf = requestAnimationFrame(loop); }
    if (!want && S.running) { S.running = false; cancelAnimationFrame(raf); save(); }
  }

  function init() {
    scene = $("scene");
    front = $("fxCanvas");
    back = $("fxBack");
    fctx = front.getContext("2d");
    bctx = back.getContext("2d");
    buildVillage();
    resize();
    restore();
    update(true);
    if (window.ResizeObserver) new ResizeObserver(() => { resize(); update(false); }).observe(scene);
    else window.addEventListener("resize", () => { resize(); update(false); });
    scene.addEventListener("click", onTap);
    scene.addEventListener("pointerdown", onDown);
    scene.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    document.addEventListener("visibilitychange", () => {
      S.visible = document.visibilityState === "visible";
      if (S.visible) { update(false); fetchWeather(false); } else save();
      setRunning();
    });
    window.addEventListener("pagehide", save);
    $("weatherChip").addEventListener("click", async () => {
      const H = window.HSD || {};
      const w = S.w;
      if (H.toast) H.toast(`${loc.place || "서울"} · ${KIND_LABEL[w.kind]}${w.temp == null ? "" : " " + Math.round(w.temp) + "°"}${w.wind ? " · 바람 " + Math.round(w.wind) + "m/s" : ""}`);
      play($("weatherChip"), "boing");
      const moved = await askLocation(true);
      fetchWeather(moved || true);
    });
    setInterval(() => { if (S.visible) update(false); }, 30000);
    setInterval(() => { if (S.visible) fetchWeather(false); }, 10 * 60000);
    setInterval(() => { if (S.visible && S.active && Math.random() < 0.25) catVisit(); }, 60000);
    setInterval(save, 30000);
    setRunning();
    askLocation(false).then((moved) => fetchWeather(moved));
    if (Math.random() < 0.3) setTimeout(catVisit, 4000);
  }

  window.Scene = {
    init,
    setActive(on) { S.active = on; if (on) { resize(); update(false); } setRunning(); },
    update,
    loveFlight,
    flash,
    firework,
    phase() { return S.phase; },
    activity() { return S.act; },
    weather() { return S.w; },
    specials() { return S.specials; },
    // 말풍선에 넣을 한마디
    lines() {
      const out = [];
      const a = S.act ? S.act.key : "";
      const w = S.w;
      S.specials.forEach((sp) => {
        if (sp.key === "bday") out.push(`${sp.label} 축하해!`);
        else if (["anniv", "monthly"].includes(sp.key)) out.push(`우리 ${sp.label} 축하해`);
        else if (sp.key === "met") out.push("오늘이 우리 처음 만난 날이야");
        else out.push(`${sp.label}이다!`);
      });
      const byAct = { sleep: "쿨쿨… 잘 자", bedtime: "졸려… 이제 자자", breakfast: "좋은 아침, 커피 마시자", lunch: "점심 뭐 먹었어?", snack: "간식 먹을 시간이야", dinner: "저녁 맛있게 먹어", campfire: "불멍 하자", kite: "연 날리기 좋은 바람이야" };
      if (byAct[a]) out.push(byAct[a]);
      const byKind = { rain: "비 온다, 우산 같이 쓰자", heavy: "비가 엄청 와", drizzle: "부슬부슬 비가 와", thunder: "천둥 무서워, 꼭 붙어 있자", snow: "눈이다! 눈사람 만들자", heavysnow: "함박눈이야", fog: "안개가 꼈어", clear: S.dark > 0.55 ? "별이 잘 보여" : "날씨 좋다, 산책 가자" };
      if (byKind[w.kind]) out.push(byKind[w.kind]);
      if (w.temp != null && w.temp <= 0) out.push("추워, 손 잡자");
      else if (w.temp != null && w.temp >= 28) out.push("덥다… 아이스크림 먹을래");
      const byPhase = { dawn: "벌써 일어났어?", sunrise: "해 뜬다", golden: "노을 예쁘다", dusk: "하늘 봐, 보라색이야", latenight: "아직 안 자?" };
      if (S.phase && byPhase[S.phase.key]) out.push(byPhase[S.phase.key]);
      return out;
    },
    emote,
    _state: S,
  };
})();
