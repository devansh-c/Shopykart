importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.0.0/firebase-messaging-compat.js');

// These credentials should match your firebaseConfig in config.ts
firebase.initializeApp({
  apiKey: "AIzaSyAjal_rhfGwRe2_OuyJE7eJVvuGbZ-6J4Q",
  authDomain: "studio-4644410857-c7ed7.firebaseapp.com",
  projectId: "studio-4644410857-c7ed7",
  storageBucket: "studio-4644410857-c7ed7.firebasestorage.app",
  messagingSenderId: "78698058459",
  appId: "1:78698058459:web:9826a05410288f8eed32fe"
});

const messaging = firebase.messaging();

// Background notification handler
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/logo.png' // Replace with your actual logo path
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Click action handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/') // Opens home page, can be customized to /orders or specific IDs
  );
});
