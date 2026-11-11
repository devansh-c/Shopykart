import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { fcmToken, orderId, storeName } = await req.json();

    if (!fcmToken) {
      return NextResponse.json({ success: false, message: 'No FCM token' }, { status: 400 });
    }

    const fcmServerKey = process.env.FIREBASE_SERVER_KEY;
    if (!fcmServerKey) {
      console.warn('FIREBASE_SERVER_KEY is missing in env!');
    }

    // High Priority Data Payload to Wake Up App & Trigger Truecaller-style Popup
    const payload = {
      to: fcmToken,
      priority: 'high',
      content_available: true,
      notification: {
        title: '🚨 NEW ORDER ARRIVED!',
        body: `New order #${orderId.slice(-4)} at ${storeName || 'Store'}. Open to accept!`,
        sound: 'order_alert',
        android_channel_id: 'order_alerts',
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      data: {
        orderId: orderId,
        type: 'NEW_ORDER_ALERT',
        fullScreenIntent: 'true',
        sound: 'order_alert'
      }
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
