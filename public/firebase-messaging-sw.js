
// Give the service worker access to Firebase Messaging.
// Note that you can only use Firebase Messaging here, other Firebase libraries are not available in the service worker.
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Initialize the Firebase app in the service worker by passing in the messagingSenderId.
firebase.initializeApp({
  apiKey: "AIzaSyAjal_rhfGwRe2_OuyJE7eJVvuGbZ-6J4Q",
  authDomain: "studio-4644410857-c7ed7.firebaseapp.com",
  projectId: "studio-4644410857-c7ed7",
  storageBucket: "studio-4644410857-c7ed7.firebasestorage.app",
  messagingSenderId: "78698058459",
  appId: "1:78698058459:web:9826a05410288f8eed32fe"
});

// Retrieve an instance of Firebase Messaging so that it can handle background messages.
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  const notificationTitle = payload.notification.title || 'ShopyKart Alert';
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/favicon.ico', // Update this with your real logo path if needed
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/orders')
  );
});
