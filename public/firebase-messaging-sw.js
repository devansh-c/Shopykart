
// This script runs in the background even when the app is closed.
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// ShopyKart Firebase Config
firebase.initializeApp({
  apiKey: "AIzaSyAjal_rhfGwRe2_OuyJE7eJVvuGbZ-6J4Q",
  authDomain: "studio-4644410857-c7ed7.firebaseapp.com",
  projectId: "studio-4644410857-c7ed7",
  storageBucket: "studio-4644410857-c7ed7.firebasestorage.app",
  messagingSenderId: "78698058459",
  appId: "1:78698058459:web:9826a05410288f8eed32fe"
});

const messaging = firebase.messaging();

// Handle Background Messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background Message received: ', payload);

  const notificationTitle = payload.notification.title || 'New Order Arrived! 🚨';
  const notificationOptions = {
    body: payload.notification.body || 'You have a new order on ShopyKart.',
    icon: '/icon.png', // Ensure this exists in your public folder
    badge: '/icon.png',
    tag: 'shopykart-order',
    renotify: true,
    requireInteraction: true,
    vibrate: [500, 200, 500, 200, 500, 200, 1000],
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
