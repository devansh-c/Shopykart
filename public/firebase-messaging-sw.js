// ShopyKart Eats Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAjal_rhfGwRe2_OuyJE7eJVvuGbZ-6J4Q",
  authDomain: "studio-4644410857-c7ed7.firebaseapp.com",
  projectId: "studio-4644410857-c7ed7",
  storageBucket: "studio-4644410857-c7ed7.firebasestorage.app",
  messagingSenderId: "78698058459",
  appId: "1:78698058459:web:9826a05410288f8eed32fe"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Background message received: ', payload);
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: 'https://picsum.photos/seed/shopykart-eats/200/200',
    badge: 'https://picsum.photos/seed/shopykart-eats/200/200',
    data: payload.data
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
