// 서비스 워커: 홈 화면 앱으로 설치할 수 있게 하고, 인터넷이 없을 때는 마지막으로 본 화면을 보여 줘요.
// 항상 인터넷에서 먼저 받아 오기 때문에 새로 배포한 내용이 바로 보여요.
const CACHE = "hsd-v56";

self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // 깃 저장소(API, 사진)로 가는 요청은 건드리지 않아요.
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy)).catch(() => {});
        }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("./", { ignoreSearch: true })))
  );
});

// 폰 알림: 서버가 보낸 알림을 띄워요. 누르면 앱을 열어요.
self.addEventListener("push", (e) => {
  let d = {};
  try { d = e.data ? e.data.json() : {}; } catch (err) { d = { title: "석영이와 예은이", body: e.data ? e.data.text() : "" }; }
  e.waitUntil(self.registration.showNotification(d.title || "석영이와 예은이", { body: d.body || "", tag: d.tag || undefined, icon: "icons/icon-192.png", badge: "icons/badge-96.png", data: { url: d.url || "" } }));
});
self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  e.waitUntil(self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
    for (const c of list) { if ("focus" in c) return c.focus(); }
    return self.clients.openWindow("./");
  }));
});
