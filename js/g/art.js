// ============================================================
// 꽃마루 정원: 도트 그림 만들기
// 꽃, 나무, 열매, 동물 친구를 점 단위로 그려서 작은 PNG 로 굳혀 둬요.
// 한 번 그린 그림은 기억해 두고 다시 써서 누를 때 버벅이지 않아요.
// ============================================================
(function () {
  "use strict";

  const OUT = "#5b4638";
  const cache = new Map();

  // ---------- 색 ----------
  function hex(c) {
    const n = parseInt(c.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  function toHex(r, g, b) {
    const f = (v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0");
    return "#" + f(r) + f(g) + f(b);
  }
  function shade(c, k) {
    const [r, g, b] = hex(c);
    if (k < 0) return toHex(r * (1 + k), g * (1 + k), b * (1 + k));
    return toHex(r + (255 - r) * k, g + (255 - g) * k, b + (255 - b) * k);
  }
  function hsl(h, s, l) {
    s /= 100; l /= 100;
    const k = (n) => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = (n) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return toHex(f(0) * 255, f(8) * 255, f(4) * 255);
  }

  // ---------- 점판 ----------
  function Grid(w, h) {
    this.w = w; this.h = h;
    this.c = new Array(w * h).fill("");
  }
  Grid.prototype.set = function (x, y, r) {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return;
    this.c[y * this.w + x] = r;
  };
  Grid.prototype.get = function (x, y) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return "";
    return this.c[y * this.w + x];
  };
  Grid.prototype.ell = function (cx, cy, rx, ry, r, only) {
    for (let y = Math.floor(cy - ry - 1); y <= Math.ceil(cy + ry + 1); y++) {
      for (let x = Math.floor(cx - rx - 1); x <= Math.ceil(cx + rx + 1); x++) {
        const dx = (x - cx) / (rx + 0.35), dy = (y - cy) / (ry + 0.35);
        if (dx * dx + dy * dy <= 1 && (!only || this.get(x, y) === only)) this.set(x, y, r);
      }
    }
  };
  Grid.prototype.disc = function (cx, cy, rr, r, only) { this.ell(cx, cy, rr, rr, r, only); };
  Grid.prototype.rect = function (x, y, w, h, r) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, r);
  };
  Grid.prototype.line = function (x0, y0, x1, y1, r) {
    x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx + dy;
    for (;;) {
      this.set(x0, y0, r);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 >= dy) { err += dy; x0 += sx; }
      if (e2 <= dx) { err += dx; y0 += sy; }
    }
  };
  Grid.prototype.poly = function (pts, r) {
    let minY = 1e9, maxY = -1e9, minX = 1e9, maxX = -1e9;
    pts.forEach(([x, y]) => { minY = Math.min(minY, y); maxY = Math.max(maxY, y); minX = Math.min(minX, x); maxX = Math.max(maxX, x); });
    for (let y = Math.floor(minY); y <= Math.ceil(maxY); y++) {
      for (let x = Math.floor(minX); x <= Math.ceil(maxX); x++) {
        let inside = false;
        for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
          const [xi, yi] = pts[i], [xj, yj] = pts[j];
          if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
        }
        if (inside) this.set(x, y, r);
      }
    }
  };
  // 그림 둘레에 진한 테두리를 둘러요. (도트 그림이 귀여워 보이는 비결)
  Grid.prototype.outline = function () {
    const add = [];
    for (let y = 0; y < this.h; y++) {
      for (let x = 0; x < this.w; x++) {
        if (this.get(x, y)) continue;
        const n = [this.get(x - 1, y), this.get(x + 1, y), this.get(x, y - 1), this.get(x, y + 1)];
        if (n.some((v) => v && v !== "o" && v !== "g")) add.push([x, y]);
      }
    }
    add.forEach(([x, y]) => this.set(x, y, "o"));
  };
  // 둥근 덩어리 왼쪽 위에 빛 한 점
  Grid.prototype.shine = function (cx, cy, rr, role) {
    this.set(cx - Math.round(rr * 0.5), cy - Math.round(rr * 0.5), role || "h");
  };

  function render(grid, pal) {
    const cv = document.createElement("canvas");
    cv.width = grid.w; cv.height = grid.h;
    const ctx = cv.getContext("2d");
    const img = ctx.createImageData(grid.w, grid.h);
    for (let y = 0; y < grid.h; y++) {
      for (let x = 0; x < grid.w; x++) {
        const role = grid.c[y * grid.w + x];
        if (!role) continue;
        let col = typeof pal === "function" ? pal(role, x, y) : pal[role];
        if (!col) col = role === "o" ? OUT : "#ff00ff";
        let a = 255;
        if (col.length === 9) { a = parseInt(col.slice(7), 16); col = col.slice(0, 7); }
        const [r, g, b] = hex(col);
        const i = (y * grid.w + x) * 4;
        img.data[i] = r; img.data[i + 1] = g; img.data[i + 2] = b; img.data[i + 3] = a;
      }
    }
    ctx.putImageData(img, 0, 0);
    return { uri: cv.toDataURL("image/png"), w: grid.w, h: grid.h };
  }

  // ---------- 꽃 ----------
  const W = 18, HH = 26, BX = 9, BY = 25;

  function stem(g, top, opt) {
    const curve = opt && opt.curve || 0;
    for (let y = BY; y >= top; y--) {
      const t = (BY - y) / Math.max(1, BY - top);
      g.set(BX + Math.round(Math.sin(t * Math.PI) * curve), y, "s");
    }
  }
  function leafPair(g, y, size, flip) {
    const s = size || 2;
    g.ell(BX - 1 - s, y, s, 1, "l");
    g.ell(BX + 1 + s, y - (flip ? 0 : 2), s, 1, "l");
    g.set(BX - 1 - s * 2 + 1, y - 1, "l2");
    g.set(BX + 1 + s * 2 - 1, y - (flip ? 0 : 2) - 1, "l2");
  }
  function sprout(g, h) {
    const top = BY - h;
    stem(g, top);
    g.ell(BX - 2, top, 2, 1, "l");
    g.ell(BX + 2, top - 1, 2, 1, "l");
    g.set(BX - 3, top - 1, "l2");
  }

  // 꽃 머리들. (cx, cy) 가 꽃 가운데예요.
  const HEADS = {
    daisy(g, cx, cy, o) {
      const r = o.r || 3;
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        g.disc(cx + Math.cos(a) * r, cy + Math.sin(a) * r * 0.9, 1.2, i % 2 ? "p" : "d");
      }
      g.disc(cx, cy, Math.max(1, r * 0.55), "c");
      g.set(cx - 1, cy - 1, "c2");
    },
    sunflower(g, cx, cy, o) {
      const r = o.r || 5;
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        g.ell(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 1.4, 1.4, i % 2 ? "p" : "d");
      }
      g.disc(cx, cy, r * 0.6, "c");
      for (let i = -2; i <= 2; i += 2) g.set(cx + i, cy + (i ? 0 : 1), "c2");
    },
    tulip(g, cx, cy) {
      g.ell(cx, cy + 1, 3, 3, "p");
      g.set(cx - 3, cy - 2, "p"); g.set(cx, cy - 3, "p"); g.set(cx + 3, cy - 2, "p");
      g.set(cx - 2, cy - 2, "p"); g.set(cx + 2, cy - 2, "p");
      g.set(cx - 1, cy - 2, ""); g.set(cx + 1, cy - 2, "");
      g.line(cx + 1, cy - 1, cx + 2, cy + 3, "d");
      g.set(cx - 2, cy, "h");
    },
    rose(g, cx, cy) {
      g.disc(cx, cy, 3.4, "p");
      g.line(cx - 1, cy - 1, cx + 1, cy - 1, "d");
      g.line(cx + 1, cy - 1, cx + 1, cy + 1, "d");
      g.line(cx + 1, cy + 1, cx - 2, cy + 1, "d");
      g.line(cx - 2, cy + 1, cx - 2, cy - 2, "d");
      g.set(cx + 3, cy + 2, "d"); g.set(cx - 3, cy + 2, "d");
      g.set(cx - 2, cy - 3, "h"); g.set(cx, cy, "h");
      g.ell(cx - 3, cy + 4, 2, 1, "l"); g.ell(cx + 3, cy + 4, 2, 1, "l");
    },
    bell(g, cx, cy) {
      // 구부러진 줄기에 종이 줄줄이
      g.line(BX, cy + 2, BX + 2, cy - 2, "s");
      g.line(BX + 2, cy - 2, BX + 6, cy - 1, "s");
      [[BX + 1, cy + 2], [BX + 4, cy + 1], [BX + 7, cy + 2]].forEach(([x, y], i) => {
        g.ell(x, y + 1, 1.4, 1.2, i === 1 ? "d" : "p");
        g.set(x - 1, y + 2, "p"); g.set(x + 1, y + 2, "p");
        g.set(x, y - 1, "s");
      });
    },
    spike(g, cx, cy) {
      for (let y = cy - 5; y <= cy + 4; y++) {
        const w = y < cy - 3 ? 0 : 1;
        for (let x = -w; x <= w; x++) g.set(cx + x, y, (x + y) % 2 ? "p" : "d");
      }
      g.set(cx, cy - 6, "h");
    },
    ball(g, cx, cy, o) {
      const r = o.r || 4;
      g.disc(cx, cy, r, "p");
      for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++) {
        if ((x * 3 + y * 5) % 4 === 0 && g.get(cx + x, cy + y) === "p") g.set(cx + x, cy + y, "d");
        if ((x * 7 + y * 3) % 9 === 0 && g.get(cx + x, cy + y) === "p") g.set(cx + x, cy + y, "h");
      }
    },
    star(g, cx, cy, o) {
      const R = o.r || 4.5, r = R * 0.45, pts = [];
      for (let i = 0; i < 10; i++) {
        const a = -Math.PI / 2 + (i / 10) * Math.PI * 2;
        const rr = i % 2 ? r : R;
        pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]);
      }
      g.poly(pts, "p");
      g.disc(cx, cy, 1, "c");
      g.set(cx - 1, cy - 2, "h");
      g.set(cx + 2, cy + 1, "d");
    },
    lily(g, cx, cy) {
      for (let i = 0; i < 6; i++) {
        const a = -Math.PI / 2 + (i / 6) * Math.PI * 2;
        g.line(cx, cy, cx + Math.cos(a) * 4, cy + Math.sin(a) * 3.4, i % 2 ? "d" : "p");
        g.line(cx + Math.cos(a) * 1, cy + Math.sin(a) * 1 + 1, cx + Math.cos(a) * 3, cy + Math.sin(a) * 2.6, "p");
      }
      g.set(cx, cy, "c"); g.set(cx - 1, cy - 1, "c"); g.set(cx + 1, cy - 1, "c");
    },
    pansy(g, cx, cy) {
      g.disc(cx - 2, cy - 2, 2, "d"); g.disc(cx + 2, cy - 2, 2, "d");
      g.disc(cx - 3, cy + 1, 1.8, "p"); g.disc(cx + 3, cy + 1, 1.8, "p"); g.disc(cx, cy + 2, 2, "p");
      g.set(cx, cy, "c"); g.set(cx - 1, cy + 1, "c"); g.set(cx + 1, cy + 1, "c"); g.set(cx, cy + 1, "c2");
      g.set(cx - 3, cy - 3, "h");
    },
    cup(g, cx, cy) {
      // 양귀비, 코스모스처럼 활짝 벌어진 컵
      g.ell(cx, cy, 4, 2.5, "p");
      g.set(cx - 4, cy - 2, "p"); g.set(cx + 4, cy - 2, "p"); g.set(cx, cy - 3, "p");
      g.ell(cx, cy, 1.4, 1, "c");
      g.set(cx - 2, cy + 1, "d"); g.set(cx + 2, cy + 1, "d"); g.set(cx + 3, cy, "d");
      g.set(cx - 3, cy - 1, "h");
    },
    camellia(g, cx, cy) {
      for (let i = 0; i < 5; i++) {
        const a = -Math.PI / 2 + (i / 5) * Math.PI * 2;
        g.disc(cx + Math.cos(a) * 2.6, cy + Math.sin(a) * 2.6, 2, i % 2 ? "d" : "p");
      }
      g.disc(cx, cy, 1.2, "c");
      g.set(cx - 2, cy - 3, "h");
    },
    heart(g, cx, cy) {
      g.disc(cx - 2, cy - 1, 2.2, "p"); g.disc(cx + 2, cy - 1, 2.2, "p");
      g.poly([[cx - 4.4, cy], [cx + 4.4, cy], [cx, cy + 4.5]], "p");
      g.set(cx - 3, cy - 2, "h"); g.set(cx + 2, cy + 1, "d"); g.set(cx + 1, cy + 2, "d");
    },
    moon(g, cx, cy) {
      g.disc(cx, cy, 4, "p");
      g.disc(cx + 2, cy - 1, 3.4, "", "p");
      g.set(cx - 3, cy - 1, "h"); g.set(cx - 2, cy + 3, "d");
      g.set(cx + 3, cy - 4, "c"); g.set(cx + 4, cy + 2, "c");
    },
    crystal(g, cx, cy) {
      g.poly([[cx, cy - 6], [cx + 3, cy - 1], [cx, cy + 4], [cx - 3, cy - 1]], "p");
      g.poly([[cx - 4, cy - 2], [cx - 2, cy + 1], [cx - 4, cy + 4], [cx - 6, cy + 1]], "d");
      g.poly([[cx + 4, cy - 3], [cx + 6, cy], [cx + 4, cy + 3], [cx + 2, cy]], "d");
      g.line(cx - 1, cy - 4, cx - 1, cy, "h");
    },
    flame(g, cx, cy) {
      g.poly([[cx, cy - 6], [cx + 4, cy + 1], [cx + 2, cy + 4], [cx - 2, cy + 4], [cx - 4, cy + 1]], "p");
      g.poly([[cx, cy - 3], [cx + 2, cy + 2], [cx - 2, cy + 2]], "d");
      g.set(cx, cy + 2, "c"); g.set(cx, cy + 1, "c");
    },
    cloud(g, cx, cy) {
      g.disc(cx - 3, cy + 1, 2.2, "p"); g.disc(cx, cy - 1, 3, "p"); g.disc(cx + 3, cy + 1, 2.2, "p");
      g.rect(cx - 4, cy + 1, 9, 2, "p");
      g.set(cx - 1, cy - 3, "h"); g.set(cx + 2, cy + 2, "d"); g.set(cx - 3, cy + 2, "d");
    },
    clock(g, cx, cy) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        g.disc(cx + Math.cos(a) * 4, cy + Math.sin(a) * 4, 1, i % 2 ? "d" : "p");
      }
      g.disc(cx, cy, 3, "c");
      g.line(cx, cy, cx, cy - 2, "o"); g.line(cx, cy, cx + 2, cy, "o");
    },
    passion(g, cx, cy) {
      for (let i = 0; i < 10; i++) {
        const a = (i / 10) * Math.PI * 2;
        g.line(cx, cy, cx + Math.cos(a) * 4.5, cy + Math.sin(a) * 3.6, "p");
      }
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        g.set(cx + Math.cos(a) * 2.5, cy + Math.sin(a) * 2.2, "d");
      }
      g.set(cx, cy, "c"); g.set(cx, cy - 1, "c");
    },
    trumpet(g, cx, cy) {
      // 나팔꽃, 박꽃
      g.ell(cx, cy - 1, 4, 2, "p");
      g.poly([[cx - 2, cy], [cx + 2, cy], [cx + 1, cy + 4], [cx - 1, cy + 4]], "d");
      g.disc(cx, cy - 1, 1, "c");
      g.set(cx - 3, cy - 2, "h");
    },
    orchid(g, cx, cy) {
      g.ell(cx - 3, cy - 1, 2, 1.4, "p"); g.ell(cx + 3, cy - 1, 2, 1.4, "p");
      g.ell(cx, cy - 3, 1.4, 2, "p");
      g.ell(cx, cy + 2, 1.6, 1.6, "d");
      g.set(cx, cy, "c"); g.set(cx - 4, cy - 2, "h");
    },
    lotus(g, cx, cy) {
      g.poly([[cx, cy - 5], [cx + 2, cy], [cx - 2, cy]], "p");
      g.poly([[cx - 5, cy - 3], [cx, cy + 1], [cx - 3, cy + 1]], "d");
      g.poly([[cx + 5, cy - 3], [cx, cy + 1], [cx + 3, cy + 1]], "d");
      g.ell(cx, cy + 1, 4, 1.2, "p");
      g.set(cx, cy - 3, "h");
    },
    bird(g, cx, cy) {
      // 극락조화
      g.poly([[cx - 4, cy + 2], [cx + 3, cy], [cx - 1, cy + 3]], "d");
      g.poly([[cx - 1, cy], [cx + 1, cy - 6], [cx + 2, cy]], "p");
      g.poly([[cx + 1, cy], [cx + 4, cy - 5], [cx + 3, cy]], "p");
      g.poly([[cx - 2, cy], [cx - 2, cy - 4], [cx, cy]], "c");
    },
    trap(g, cx, cy) {
      g.ell(cx - 2, cy, 2, 3, "p"); g.ell(cx + 2, cy, 2, 3, "p");
      g.line(cx - 2, cy - 2, cx - 2, cy + 2, "d"); g.line(cx + 2, cy - 2, cx + 2, cy + 2, "d");
      [-4, 4].forEach((dx) => { g.set(cx + dx, cy - 2, "c"); g.set(cx + dx, cy, "c"); g.set(cx + dx, cy + 2, "c"); });
    },
  };

  // 꽃이 아닌 모양 (나무, 덤불, 채소 같은 것)
  const BODIES = {
    tree(g, o, stage, pal) {
      const fruit = stage >= 4;
      g.rect(BX - 1, 16, 3, 10, "t");
      g.set(BX + 1, 18, "t2"); g.set(BX - 1, 21, "t2");
      g.disc(BX, 10, stage >= 3 ? 7 : 5, o.canopy || "l");
      g.disc(BX - 2, 8, 2, o.canopy2 || "l2", o.canopy || "l");
      if (fruit) {
        [[-4, 9], [3, 7], [1, 12], [-2, 13], [5, 11], [-5, 12], [0, 6]].forEach(([dx, y], i) => {
          if (o.blossom) { g.set(BX + dx, y, i % 2 ? "p" : "h"); g.set(BX + dx + 1, y, "p"); }
          else { g.disc(BX + dx, y, 0.9, "p"); g.set(BX + dx, y - 1, "h"); }
        });
      }
    },
    conifer(g, o, stage) {
      g.rect(BX - 1, 21, 3, 5, "t");
      const tiers = stage >= 3 ? 4 : 3;
      for (let i = 0; i < tiers; i++) {
        const y = 20 - i * 4, w = 7 - i * 1.5;
        g.poly([[BX - w, y], [BX + w, y], [BX, y - 6]], i % 2 ? "l2" : "l");
      }
      if (stage >= 4) [[-3, 17], [2, 13], [-1, 9], [3, 18], [0, 5]].forEach(([dx, y], i) => g.set(BX + dx, y, i % 2 ? "p" : "c"));
    },
    bush(g, o, stage) {
      g.disc(BX, 18, 6, "l");
      g.disc(BX - 3, 16, 3, "l2", "l");
      if (stage >= 4) [[-4, 15], [2, 14], [4, 18], [-1, 19], [-4, 20], [0, 16], [3, 21]].forEach(([dx, y], i) => {
        g.set(BX + dx, y, i % 2 ? "p" : "d"); g.set(BX + dx + 1, y, "p");
        if (o.dot) g.set(BX + dx, y - 1, "h");
      });
      if (stage === 3) [[-2, 14], [3, 16]].forEach(([dx, y]) => g.set(BX + dx, y, "p"));
    },
    vine(g, o, stage) {
      // 덩굴: 지지대를 감고 올라가요
      g.line(BX - 4, BY, BX - 4, 4, "t"); g.line(BX + 4, BY, BX + 4, 4, "t"); g.line(BX - 4, 4, BX + 4, 4, "t");
      for (let y = BY - 1; y > 6; y--) g.set(BX + Math.round(Math.sin(y * 0.6) * 4), y, "s");
      [[-3, 20], [3, 16], [-2, 11], [2, 7], [0, 14], [-4, 8]].forEach(([dx, y]) => g.ell(BX + dx, y, 1.4, 1, "l"));
      if (stage >= 4) [[-3, 18], [3, 13], [-1, 9], [2, 20], [1, 5]].forEach(([dx, y], i) => {
        if (o.grape) { g.disc(BX + dx, y + 1, 1.2, i % 2 ? "p" : "d"); g.set(BX + dx, y + 2, "p"); }
        else { g.disc(BX + dx, y, 1.3, "p"); g.set(BX + dx, y, "c"); }
      });
    },
    fruitbush(g, o, stage) {
      // 딸기, 토마토처럼 낮은 덤불에 열매
      stem(g, 15);
      g.ell(BX - 3, 19, 3, 1.5, "l"); g.ell(BX + 3, 17, 3, 1.5, "l"); g.ell(BX, 14, 2, 1.5, "l"); g.ell(BX - 2, 22, 3, 1.4, "l2");
      if (stage >= 4) {
        const big = o.big;
        [[-4, 21], [4, 20], [1, 18]].slice(0, big ? 1 : 3).forEach(([dx, y]) => {
          if (big) { g.ell(BX, 21, 5, 3, "p"); g.line(BX - 2, 19, BX - 2, 23, "d"); g.line(BX + 2, 19, BX + 2, 23, "d"); g.set(BX - 3, 20, "h"); g.set(BX, 17, "s"); }
          else {
            g.ell(BX + dx, y, 1.5, 1.8, "p"); g.set(BX + dx - 1, y - 1, "h");
            if (o.seeds) g.set(BX + dx, y + 1, "c");
            g.set(BX + dx, y - 2, "l2");
          }
        });
      } else if (stage === 3) g.set(BX + 3, 15, "w");
    },
    root(g, o, stage) {
      // 당근, 무: 잎은 위로, 뿌리 어깨가 살짝
      for (let i = -2; i <= 2; i++) g.line(BX, 22, BX + i * 2, 12 + Math.abs(i) * 2, i % 2 ? "l2" : "l");
      [[-4, 14], [0, 11], [4, 14], [-2, 12], [2, 12]].forEach(([dx, y]) => g.disc(BX + dx, y, 1, "l"));
      if (stage >= 4) { g.ell(BX, 24, 3, 2, "p"); g.set(BX - 1, 23, "h"); g.set(BX + 1, 25, "d"); }
    },
    cactus(g, o, stage) {
      g.rect(BX - 2, 10, 5, 16, "l");
      g.ell(BX, 10, 2, 2, "l");
      g.line(BX, 9, BX, 25, "l2");
      g.rect(BX - 5, 15, 3, 2, "l"); g.rect(BX - 5, 12, 2, 4, "l");
      g.rect(BX + 3, 18, 3, 2, "l"); g.rect(BX + 4, 14, 2, 5, "l");
      [[-1, 13], [1, 17], [-1, 21], [1, 24]].forEach(([dx, y]) => g.set(BX + dx, y, "w"));
      if (stage >= 4) { g.disc(BX, 7, 1.8, "p"); g.set(BX, 7, "c"); g.set(BX - 1, 6, "h"); }
    },
    succulent(g, o, stage) {
      g.ell(BX, 22, 6, 3, "l");
      g.ell(BX, 20, 4, 2.5, "l2");
      g.ell(BX, 18, 2.4, 2, "l");
      for (let i = 0; i < 6; i++) g.set(BX - 5 + i * 2, 21 + (i % 2), "d");
      if (stage >= 4) { g.line(BX + 2, 17, BX + 4, 10, "s"); g.disc(BX + 4, 9, 1.4, "p"); g.set(BX + 4, 9, "c"); }
    },
    grass(g, o, stage) {
      // 갈대, 억새, 부들, 목화
      [-4, -2, 0, 2, 4].forEach((dx, i) => g.line(BX + dx, BY, BX + dx * 1.4, 10 + (i % 2) * 3, i % 2 ? "l2" : "l"));
      if (stage >= 4) {
        [-4, 0, 4].forEach((dx, i) => {
          const x = BX + dx * 1.4, y = 9 + (i % 2) * 2;
          if (o.cattail) { g.rect(x - 1, y - 4, 2, 5, "p"); g.set(x - 1, y - 4, "h"); }
          else if (o.cotton) { g.disc(x, y - 1, 2, "p"); g.set(x - 1, y - 2, "h"); g.set(x + 1, y, "d"); }
          else { g.line(x, y, x + 2, y - 5, "p"); g.set(x + 1, y - 2, "d"); g.set(x + 2, y - 4, "h"); g.set(x - 1, y - 3, "p"); }
        });
      }
    },
    mushroom(g, o, stage) {
      g.rect(BX - 1, 18, 3, 8, "w");
      g.set(BX + 1, 20, "w2");
      g.ell(BX, 16, stage >= 4 ? 6 : 4, 3, "p");
      g.rect(BX - (stage >= 4 ? 6 : 4), 17, (stage >= 4 ? 13 : 9), 1, "d");
      if (stage >= 4) [[-3, 15], [2, 14], [4, 16], [-1, 13]].forEach(([dx, y]) => g.set(BX + dx, y, "c"));
      if (o.glow && stage >= 4) [[-7, 10], [7, 12], [5, 6], [-5, 5]].forEach(([dx, y]) => g.set(BX + dx, y, "c"));
      if (stage >= 4) { g.ell(BX + 6, 23, 2, 1.4, "p"); g.rect(BX + 6, 24, 1, 2, "w"); }
    },
    herb(g, o, stage) {
      for (let i = 0; i < 7; i++) {
        const dx = (i - 3) * 2, y = 14 + Math.abs(i - 3) * 2;
        g.line(BX, BY, BX + dx, y, "s");
        g.ell(BX + dx, y - 1, 1.5, 1.2, i % 2 ? "l2" : "l");
      }
      if (stage >= 4) [[-4, 13], [0, 11], [4, 13]].forEach(([dx, y]) => { g.set(BX + dx, y - 1, "p"); g.set(BX + dx, y - 2, "d"); });
    },
    fern(g, o, stage) {
      [-1, 1].forEach((side) => {
        for (let k = 0; k < 2; k++) {
          const ex = BX + side * (5 + k * 2), ey = 8 + k * 5;
          g.line(BX, BY, ex, ey, "s");
          for (let t = 0.2; t < 1; t += 0.12) {
            const x = BX + (ex - BX) * t, y = BY + (ey - BY) * t;
            g.set(x - 1, y, "l"); g.set(x + 1, y, "l2");
          }
        }
      });
      g.line(BX, BY, BX, 6, "s");
      for (let y = 8; y < 24; y += 2) { g.set(BX - 1, y, "l"); g.set(BX + 1, y, "l2"); }
      if (stage >= 4) { g.set(BX, 5, "p"); g.set(BX + 1, 4, "p"); g.set(BX + 1, 5, "d"); }
    },
    clover(g, o, stage) {
      stem(g, 14, { curve: 1 });
      const four = o.four;
      const pts = four ? [[-2, -2], [2, -2], [-2, 2], [2, 2]] : [[-2, -1], [2, -1], [0, 2]];
      pts.forEach(([dx, dy]) => g.disc(BX + dx, 12 + dy, 1.8, dx < 0 ? "l" : "l2"));
      g.set(BX, 12, "s");
      g.ell(BX - 4, 21, 2, 1.4, "l"); g.ell(BX + 4, 20, 2, 1.4, "l2");
      if (stage >= 4) { g.disc(BX + 5, 10, 1.6, "p"); g.set(BX + 5, 9, "h"); g.line(BX + 5, 11, BX + 3, 18, "s"); }
    },
  };

  // 꽃 머리를 쓰는 기본 모양: 줄기 + 잎 + 머리
  function flowerPlant(g, sp, stage) {
    const o = sp.o || {};
    const top = o.tall ? 5 : o.short ? 11 : 8;
    if (stage === 1) { sprout(g, 5); return; }
    if (stage === 2) { stem(g, top + 7); leafPair(g, BY - 4, 2); leafPair(g, top + 10, 1.5, true); return; }
    stem(g, top + 2, { curve: o.curve || 0 });
    leafPair(g, BY - 4, 2);
    leafPair(g, Math.round((BY + top) / 2) + 1, 1.6, true);
    if (o.lowLeaves) { g.ell(BX - 4, BY - 1, 3, 1, "l"); g.ell(BX + 4, BY - 1, 3, 1, "l2"); }
    const cx = BX, cy = top;
    if (stage === 3) {
      g.ell(cx, cy + 1, 1.6, 2.6, "p");
      g.set(cx, cy - 2, "p");
      g.set(cx - 2, cy + 3, "l"); g.set(cx + 2, cy + 3, "l"); g.set(cx - 1, cy + 3, "l"); g.set(cx + 1, cy + 3, "l");
      g.set(cx - 1, cy, "h");
      return;
    }
    (HEADS[sp.a] || HEADS.daisy)(g, cx, cy, o);
    if (o.twin) {
      g.line(BX, 16, BX - 5, 11, "s");
      const g2 = new Grid(W, HH);
      (HEADS[sp.a] || HEADS.daisy)(g2, BX - 5, 10, Object.assign({}, o, { r: (o.r || 3) * 0.7 }));
      g2.c.forEach((v, i) => { if (v && !g.c[i]) g.c[i] = v; });
    }
  }

  function seedGrid(g) {
    g.set(BX, BY, "t"); g.set(BX - 1, BY, "t"); g.set(BX, BY - 1, "l");
  }

  // sp: { a: 모양, p: 꽃잎색, c: 가운데색, l: 잎색, o: 옵션 }
  function plantGrid(sp, stage) {
    const g = new Grid(W, HH);
    if (stage <= 0) { seedGrid(g); g.outline(); return g; }
    const body = BODIES[sp.a];
    if (body) {
      if (stage === 1) sprout(g, 4);
      else if (stage === 2) {
        if (sp.a === "tree" || sp.a === "conifer") { stem(g, 14); g.disc(BX, 13, 3, "l"); g.set(BX - 1, 12, "l2"); }
        else if (sp.a === "cactus") { g.rect(BX - 1, 18, 3, 8, "l"); g.line(BX, 18, BX, 25, "l2"); }
        else if (sp.a === "mushroom") { g.rect(BX - 1, 22, 2, 4, "w"); g.ell(BX, 21, 2.4, 1.6, "p"); }
        else { stem(g, 16); leafPair(g, 20, 2); leafPair(g, 17, 1.5, true); }
      } else body(g, sp.o || {}, stage, sp);
    } else flowerPlant(g, sp, stage);
    g.outline();
    return g;
  }

  // 변종: 0 보통, 1 은빛, 2 금빛, 3 무지개
  function palette(sp, variant) {
    const p = sp.p || "#f4a3c0";
    const leaf = sp.l || "#7cc46e";
    const pal = {
      p, d: shade(p, -0.18), h: shade(p, 0.55),
      c: sp.c || "#ffd35c", c2: shade(sp.c || "#ffd35c", -0.25),
      l: leaf, l2: shade(leaf, -0.16), s: shade(leaf, -0.22),
      t: "#a97b55", t2: "#8a6244", w: "#fff8ec", w2: "#eadfcf",
    };
    if (variant === 1) Object.assign(pal, { p: "#dfe7f2", d: "#aab8cc", h: "#ffffff" });
    if (variant === 2) Object.assign(pal, { p: "#ffd34d", d: "#e3a524", h: "#fff4b0" });
    if (variant === 3) {
      return (role, x, y) => {
        if (role === "p" || role === "d" || role === "h") {
          const hue = ((x + y) * 26) % 360;
          return hsl(hue, role === "d" ? 70 : 85, role === "h" ? 88 : role === "d" ? 62 : 74);
        }
        return pal[role];
      };
    }
    return pal;
  }

  function plant(sp, stage, variant) {
    const key = "pl|" + sp.id + "|" + stage + "|" + (variant || 0);
    let r = cache.get(key);
    if (!r) {
      r = render(plantGrid(sp, stage), palette(sp, variant || 0));
      cache.set(key, r);
    }
    return r;
  }

  // ---------- 동물 친구 ----------
  // 둥근 머리 + 작은 몸 + 종류별 귀, 꼬리
  function critterGrid(kind) {
    const g = new Grid(18, 18);
    const cx = 9;
    const tail = { squirrel: 1, fox: 1, cat: 1 }[kind];
    if (tail) {
      if (kind === "squirrel") { g.ell(15, 10, 2.4, 4, "b"); g.set(14, 7, "b2"); g.set(15, 8, "b2"); }
      else g.ell(15, 14, 2.2, 1.4, kind === "fox" ? "b" : "b"), g.set(16, 13, kind === "fox" ? "w" : "b2");
    }
    if (kind === "turtle") {
      g.ell(cx + 1, 13, 6, 3.5, "s"); g.set(cx - 1, 12, "s2"); g.set(cx + 3, 12, "s2"); g.set(cx + 1, 14, "s2");
      g.ell(cx - 5, 11, 2.6, 2.2, "b");
      g.set(cx - 6, 10, "e"); g.set(cx - 7, 12, "k");
      g.set(cx - 3, 16, "b"); g.set(cx + 5, 16, "b");
      return g;
    }
    if (kind === "firefly") {
      g.ell(cx - 3, 7, 3, 2, "w", ""); g.ell(cx + 3, 7, 3, 2, "w");
      g.ell(cx, 12, 3, 4, "b"); g.ell(cx, 15, 2.4, 1.6, "g2");
      g.disc(cx, 8, 2.4, "b");
      g.line(cx - 1, 6, cx - 3, 3, "o"); g.line(cx + 1, 6, cx + 3, 3, "o");
      g.set(cx - 1, 8, "e"); g.set(cx + 1, 8, "e");
      return g;
    }
    // 몸
    g.ell(cx, 14, 4, 3, "b");
    g.ell(cx, 15, 2, 1.6, "w");
    // 머리
    g.ell(cx, 8, 5.2, 4.4, "b");
    // 귀
    if (kind === "dog") { g.ell(cx - 5, 8, 1.4, 2.6, "b2"); g.ell(cx + 5, 8, 1.4, 2.6, "b2"); }
    if (kind === "rabbit") { g.ell(cx - 2, 2, 1.1, 3, "b"); g.ell(cx + 2, 2, 1.1, 3, "b"); g.line(cx - 2, 0, cx - 2, 3, "k2"); g.line(cx + 2, 0, cx + 2, 3, "k2"); }
    if (kind === "bear") { g.disc(cx - 4, 4, 1.6, "b"); g.disc(cx + 4, 4, 1.6, "b"); g.set(cx - 4, 4, "b2"); g.set(cx + 4, 4, "b2"); }
    if (kind === "squirrel" || kind === "fox" || kind === "cat") {
      g.poly([[cx - 5, 6], [cx - 4, 1], [cx - 1, 4]], "b");
      g.poly([[cx + 5, 6], [cx + 4, 1], [cx + 1, 4]], "b");
      g.set(cx - 4, 3, "k2"); g.set(cx + 4, 3, "k2");
    }
    if (kind === "owl") { g.poly([[cx - 5, 5], [cx - 5, 1], [cx - 2, 4]], "b2"); g.poly([[cx + 5, 5], [cx + 5, 1], [cx + 2, 4]], "b2"); g.ell(cx - 5, 13, 1.4, 2.4, "b2"); g.ell(cx + 5, 13, 1.4, 2.4, "b2"); }
    if (kind === "sheep") { [[-5, 6], [-3, 4], [0, 3], [3, 4], [5, 6], [-5, 10], [5, 10]].forEach(([dx, y]) => g.disc(cx + dx, y, 1.8, "w")); g.ell(cx, 8, 3.6, 3, "b"); g.ell(cx - 6, 8, 1.4, 1, "b2"); g.ell(cx + 6, 8, 1.4, 1, "b2"); }
    if (kind === "frog") { g.disc(cx - 3, 4, 2, "b"); g.disc(cx + 3, 4, 2, "b"); g.set(cx - 3, 4, "e"); g.set(cx + 3, 4, "e"); g.set(cx - 3, 3, "w"); g.set(cx + 3, 3, "w"); }
    if (kind === "bird") { g.poly([[cx - 6, 8], [cx - 9, 9], [cx - 6, 10]], "k"); g.ell(cx + 4, 13, 2.6, 1.8, "b2"); g.ell(cx, 10, 3, 1.4, "w"); }
    if (kind === "mole") { g.set(cx - 2, 16, "k2"); g.set(cx + 2, 16, "k2"); }
    // 얼굴
    if (kind !== "frog") { g.set(cx - 2, 8, "e"); g.set(cx + 2, 8, "e"); }
    else { g.line(cx - 2, 10, cx + 2, 10, "e"); }
    if (kind === "mole") { g.set(cx - 2, 8, "b2"); g.set(cx + 2, 8, "b2"); g.line(cx - 3, 8, cx - 1, 8, "e"); g.line(cx + 1, 8, cx + 3, 8, "e"); }
    if (kind === "fox" || kind === "dog" || kind === "bear" || kind === "cat") g.ell(cx, 10, 1.6, 1, "w");
    if (kind === "owl") { g.disc(cx - 2, 8, 1.4, "w"); g.disc(cx + 2, 8, 1.4, "w"); g.set(cx - 2, 8, "e"); g.set(cx + 2, 8, "e"); g.set(cx, 10, "k"); }
    else if (kind !== "bird" && kind !== "frog") g.set(cx, 9, "k");
    if (kind === "mole") { g.disc(cx, 10, 1, "k2"); }
    g.set(cx - 4, 10, "r"); g.set(cx + 4, 10, "r");
    g.set(cx - 3, 6, "h");
    if (kind === "cat") { g.rect(cx - 4, 3, 9, 2, "x"); g.rect(cx - 3, 2, 7, 1, "x"); g.set(cx + 4, 4, "c"); }
    return g;
  }
  const CRITTER_PAL = {
    dog: { b: "#f2d1a4", b2: "#c9925e" },
    rabbit: { b: "#ffffff", b2: "#efe4dc", k2: "#f6b6c8" },
    frog: { b: "#8fd17c", b2: "#6bb35f" },
    squirrel: { b: "#d99a5f", b2: "#b77641", k2: "#f3c7a0" },
    bear: { b: "#c08a5c", b2: "#e9c39b" },
    fox: { b: "#f0995a", b2: "#d9783c", k2: "#ffe2c8" },
    mole: { b: "#8b7466", b2: "#6f5a4e", k2: "#f6a9b9" },
    owl: { b: "#b48a6a", b2: "#8e6a4f" },
    sheep: { b: "#f3e2d0", b2: "#e2cbb5" },
    firefly: { b: "#6e5a7e", g2: "#fff07a" },
    bird: { b: "#58a8e0", b2: "#3f86c0", k: "#f39a4a" },
    turtle: { b: "#a7cf86", s: "#9a7a52", s2: "#c7a46e" },
    cat: { b: "#f7f1e8", b2: "#d9cbbb", k2: "#f6b6c8", x: "#5a8bd0", c: "#ffd35c" },
  };
  function critter(kind) {
    const key = "cr|" + kind;
    let r = cache.get(key);
    if (!r) {
      const g = critterGrid(kind);
      g.outline();
      const pal = Object.assign({ e: "#3b2c25", k: "#3b2c25", w: "#ffffff", r: "#f6a9b9", h: "#ffffff", k2: "#f6b6c8", b2: "#d9c3a8", g2: "#fff07a" }, CRITTER_PAL[kind] || {});
      r = render(g, pal);
      cache.set(key, r);
    }
    return r;
  }

  // 기존 도트 그림(PIXEL)을 PNG 로 (색 바꾸기 가능)
  function fromPixel(name, colors) {
    const key = "px|" + name + "|" + JSON.stringify(colors || {});
    let r = cache.get(key);
    if (!r) {
      const s = window.PIXEL && PIXEL.rows(name);
      if (!s) return null;
      const g = new Grid(s.rows[0].length, s.rows.length);
      s.rows.forEach((row, y) => { for (let x = 0; x < row.length; x++) if (row[x] !== ".") g.c[y * g.w + x] = row[x]; });
      const pal = Object.assign({}, s.colors, colors || {});
      r = render(g, pal);
      cache.set(key, r);
    }
    return r;
  }

  function img(r, scale, cls) {
    if (!r) return "";
    return `<img class="px ${cls || ""}" src="${r.uri}" width="${r.w * scale}" height="${r.h * scale}" alt="" draggable="false">`;
  }

  window.GArt = {
    plant, critter, fromPixel, img, shade, hsl,
    plantImg(sp, stage, variant, scale, cls) { return img(plant(sp, stage, variant), scale || 3, cls); },
    critterImg(kind, scale, cls) { return img(critter(kind), scale || 3, cls); },
    pixImg(name, scale, colors, cls) { return img(fromPixel(name, colors), scale || 3, cls); },
    uri(sp, stage, variant) { return plant(sp, stage, variant).uri; },
    clear() { cache.clear(); },
  };
})();
