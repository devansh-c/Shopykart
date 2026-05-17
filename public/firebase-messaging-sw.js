
// Scripts for firebase messaging
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// These values must match your src/firebase/config.ts
firebase.initializeApp({
  apiKey: "AIzaSyAjal_rhfGwRe2_OuyJE7eJVvuGbZ-6J4Q",
  authDomain: "studio-4644410857-c7ed7.firebaseapp.com",
  projectId: "studio-4644410857-c7ed7",
  storageBucket: "studio-4644410857-c7ed7.firebasestorage.app",
  messagingSenderId: "78698058459",
  appId: "1:78698058459:web:9826a05410288f8eed32fe"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification.title || 'ShopyKart Update';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico', // Update this to your brand icon path
    badge: '/favicon.ico',
    tag: payload.data?.tag || 'shopykart-alert',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click to navigate
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const urlToOpen = event.notification.data?.url || '/orders';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
