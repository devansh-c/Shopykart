import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { fcmToken, orderId, storeName } = await req.json();

    if (!fcmToken) {
      return NextResponse.json({ success: false, message: 'No FCM token' }, { status: 400 });
    }

    // High Priority Native FCM Notification Payload
    // Firebase Cloud Messaging Legacy / HTTP v1 compatible payload
    const fcmServerKey = process.env.FIREBASE_SERVER_KEY;
    
    if (!fcmServerKey) {
      console.warn('FIREBASE_SERVER_KEY is not defined in .env');
    }

    const payload = {
      to: fcmToken,
      priority: 'high',
      notification: {
        title: '🚨 NEW ORDER ARRIVED!',
        body: `New order #${orderId.slice(-4)} at ${storeName || 'your store'}. Accept now!`,
        sound: 'order_alert',
        android_channel_id: 'order_alerts',
      },
      data: {
        orderId: orderId,
        type: 'NEW_ORDER',
        click_action: 'FLUTTER_NOTIFICATION_CLICK',
      },
    };

    if (fcmServerKey) {
      await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${fcmServerKey}`,
        },
        body: JSON.stringify(payload),
      });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('Error sending order alert:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
