const CACHE_NAME = 'h5-cache-v1';
const urlsToCache = [];

self.addEventListener('install', event => {
  event.waitUntil(Promise.resolve());
});

self.addEventListener('activate', event => {
  event.waitUntil(Promise.resolve());
});

self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});

self.addEventListener('notificationclick', event => {
  console.log('通知被点击');
  event.notification.close();
});

self.addEventListener('push', event => {
  console.log('接收到推送消息');
});