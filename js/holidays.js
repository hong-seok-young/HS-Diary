// ============================================================
// 우리나라 공휴일 (달력의 빨간 날)
// - 양력으로 정해진 날: 신정, 삼일절, 노동절, 어린이날, 현충일, 제헌절, 광복절, 개천절, 한글날, 성탄절.
//   (노동절과 제헌절은 2026년부터 공휴일이에요.)
// - 음력으로 정해진 날: 설날 연휴(전날, 당일, 다음 날), 부처님오신날, 추석 연휴(전날, 당일, 다음 날).
//   아래 LUNAR 표는 우리나라 음력으로 계산한 양력 날짜예요 (2024~2050년).
// - 대체공휴일: 삼일절, 노동절, 어린이날, 부처님오신날, 제헌절, 광복절, 개천절, 한글날, 성탄절이
//   토요일·일요일이나 다른 공휴일과 겹치면 그다음 첫 평일. 설·추석 연휴는 일요일이나 다른 공휴일과 겹칠 때만.
//   신정과 현충일은 대체공휴일이 없어요.
// - 선거일은 날짜가 정해진 것만 넣었어요. 나라에서 그때그때 정하는 임시공휴일은 미리 알 수 없어서 없어요.
// ============================================================
(function () {
  "use strict";
  // 해마다 [설날, 부처님오신날, 추석] 을 월일 네 글자씩
  const LUNAR = "2024:021005150917 2025:012905051006 2026:021705240925 2027:020705130915 2028:012705021003 2029:021305200922 2030:020305090912 2031:012305281001 2032:021105160919 2033:013105060908 2034:021905250927 2035:020805150916 2036:012805031004 2037:021505220924 2038:020405110913 2039:012404301002 2040:021205180921 2041:020105070910 2042:012205260928 2043:021005160917 2044:013005051005 2045:021705240925 2046:020605130915 2047:012605021004 2048:021405200922 2049:020205090911 2050:012305280930"
    .split(" ").reduce((m, s) => { const [y, v] = s.split(":"); m[y] = [v.slice(0, 4), v.slice(4, 8), v.slice(8, 12)]; return m; }, {});
  const ELECT = { "2026-06-03": "지방선거", "2028-04-12": "국회의원 선거" };
  const key = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  const add = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
  const cache = {};
  function build(y) {
    const map = {}; // 날짜 → [{ name, sub 대체 규칙: "A" 토·일·겹침, "B" 일·겹침, "" 없음, block 연휴의 마지막 날 }]
    const put = (d, name, sub, block) => { const k = key(d); (map[k] = map[k] || []).push({ name, sub, block: block || d }); };
    const fixed = (m, dd, name, sub) => put(new Date(y, m - 1, dd), name, sub);
    fixed(1, 1, "신정", "");
    fixed(3, 1, "삼일절", "A");
    if (y >= 2026) fixed(5, 1, "노동절", "A");
    fixed(5, 5, "어린이날", "A");
    fixed(6, 6, "현충일", "");
    if (y >= 2026) fixed(7, 17, "제헌절", "A");
    fixed(8, 15, "광복절", "A");
    fixed(10, 3, "개천절", "A");
    fixed(10, 9, "한글날", "A");
    fixed(12, 25, "성탄절", "A");
    const L = LUNAR[y];
    if (L) {
      const at = (s) => new Date(y, Number(s.slice(0, 2)) - 1, Number(s.slice(2)));
      const seol = at(L[0]), chu = at(L[2]);
      [[seol, "설날"], [chu, "추석"]].forEach(([d, n]) => { const end = add(d, 1); put(add(d, -1), n + " 연휴", "B", end); put(d, n, "B", end); put(end, n + " 연휴", "B", end); });
      put(at(L[1]), "부처님오신날", "A");
    }
    Object.keys(ELECT).forEach((k) => { if (k.slice(0, 4) === String(y)) { const p = k.split("-").map(Number); put(new Date(p[0], p[1] - 1, p[2]), ELECT[k], ""); } });
    // 대체공휴일
    const out = {};
    Object.keys(map).forEach((k) => { out[k] = map[k].map((x) => x.name).filter((n, i, a) => a.indexOf(n) === i).join(" · "); });
    const free = (d) => { let n = add(d, 1); while (n.getDay() === 0 || n.getDay() === 6 || out[key(n)]) n = add(n, 1); return n; };
    Object.keys(map).sort().forEach((k) => {
      const list = map[k], p = k.split("-").map(Number), d = new Date(p[0], p[1] - 1, p[2]), w = d.getDay();
      const main = list.find((x) => x.sub) || null;
      if (!main) return;
      const names = list.map((x) => x.name.replace(" 연휴", ""));
      const overlap = names.filter((n, i, a) => a.indexOf(n) === i).length > 1;
      const hit = overlap || (main.sub === "A" ? w === 0 || w === 6 : w === 0);
      if (!hit) return;
      const last = list.reduce((m, x) => (x.block > m ? x.block : m), d);
      const s = free(last);
      out[key(s)] = "대체공휴일";
    });
    return out;
  }
  function yearMap(y) { return cache[y] || (cache[y] = build(y)); }
  // 그날이 공휴일이면 이름, 아니면 ""
  function of(d) {
    const k = key(d);
    return yearMap(d.getFullYear())[k] || (d.getMonth() === 0 && d.getDate() < 8 ? yearMap(d.getFullYear() - 1)[k] || "" : "");
  }
  window.Holidays = { of, year: yearMap };
})();
