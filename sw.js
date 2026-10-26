/* Service Worker ของแอป EDUOneClass
   - เก็บหน้าเปิดแอป/ไอคอนไว้ในเครื่อง → เปิดไอคอนแล้วขึ้นทันที
   - ไม่แตะข้อมูลของระบบ (Google Apps Script) เลย ข้อมูลยังสดใหม่ทุกครั้ง
   แก้ไฟล์ใดในโฟลเดอร์นี้แล้ว ให้เปลี่ยนเลขเวอร์ชันด้านล่าง (v1 → v2) เพื่อให้เครื่องนักเรียนอัปเดต */
const CACHE = 'eduoneclass-v3';
const SHELL = [
  './', './index.html', './app.html', './config.js', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './maskable-512.png',
  './apple-touch-icon.png', './favicon-32.png', './logo-256.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;          // ข้อมูลภายนอก (Google) → ปล่อยผ่าน

  const fresh = req.mode === 'navigate' || /\.(html|js|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (fresh) {
    // หน้าเว็บ/ตั้งค่า: เอาของใหม่จากเน็ตก่อน ถ้าไม่มีเน็ตค่อยใช้ของในเครื่อง
    e.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || caches.match('./app.html')))
    );
  } else {
    // ไอคอน/รูป: ใช้ของในเครื่องก่อน
    e.respondWith(caches.match(req).then((r) => r || fetch(req)));
  }
});
