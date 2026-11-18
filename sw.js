// 서비스 워커: 홈 화면 앱으로 설치할 수 있게 하고, 인터넷이 없을 때는 마지막으로 본 화면을 보여 줘요.
// 항상 인터넷에서 먼저 받아 오기 때문에 새로 배포한 내용이 바로 보여요.
const CACHE = "hsd-v11";

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
