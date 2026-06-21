/* 우리집 예산노트 서비스 워커
   - network-first: 온라인이면 항상 최신을 받아오고, 받은 걸 캐시에 저장
   - 오프라인이면 캐시로 보여줌 → 홈화면 바로가기에서도 업데이트가 잘 반영됨 */
const CACHE = 'honeybudget-cache-v2';

self.addEventListener('install', (e) => { self.skipWaiting(); });
self.addEventListener('activate', (e) => {
  e.waitUntil((async () => {
    // 옛 캐시 정리
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  e.respondWith(
    fetch(req)
      .then((res) => {
        // 정상 응답이면 캐시에 최신본 저장
        if (res && res.status === 200 && res.type === 'basic') {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req))   // 네트워크 실패(오프라인) 시 캐시 사용
  );
});
