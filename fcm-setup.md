# Firebase Cloud Messaging (FCM) Setup Guide for MeetMe

This guide provides detailed step-by-step instructions for setting up Firebase Cloud Messaging for your MeetMe application, including both Android and iOS configurations.

## Table of Contents
1. [Firebase Project Configuration](#firebase-project-configuration)
2. [Android Setup](#android-setup)
3. [iOS Setup](#ios-setup)
4. [Server-Side Implementation](#server-side-implementation)
5. [Integration with Supabase](#integration-with-supabase)
6. [Client-Side Implementation](#client-side-implementation)
7. [Testing and Troubleshooting](#testing-and-troubleshooting)

## Firebase Project Configuration

### 1. Create Firebase Project
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and enter "MeetMe" as the project name
3. Select your Google Analytics account (or create a new one)
4. Click "Create project"

### 2. Enable Firebase Cloud Messaging
1. In your Firebase project dashboard, navigate to "Cloud Messaging"
2. Take note of your **Server Key** and **Sender ID** - you'll need these for server configuration
3. Enable "Automatic data collection" if you want analytics

### 3. Register Your Apps
#### For Android:
1. Click "Add app" → Android icon
2. Enter package name: `com.yourcompany.meetme` (or your actual package name)
3. Download the `google-services.json` file
4. Place it in your Android project's `app/` directory

#### For iOS:
1. Click "Add app" → iOS icon
2. Enter bundle ID: `com.yourcompany.MeetMe` (or your actual bundle ID)
3. Download the `GoogleService-Info.plist` file
4. Add it to your iOS project

## Android Setup

### 1. Update build.gradle (Project Level)
```gradle
buildscript {
  dependencies {
    classpath 'com.google.gms:google-services:4.3.15'
  }
}
```

### 2. Update build.gradle (App Level)
```gradle
plugins {
  id 'com.google.gms.google-services'
}

dependencies {
  implementation 'com.google.firebase:firebase-messaging:23.2.1'
  implementation 'com.google.firebase:firebase-analytics:21.3.0'
}
```

### 3. Update AndroidManifest.xml
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.WAKE_LOCK" />

<application>
  <!-- Other application components -->
  
  <service
    android:name=".MyFirebaseMessagingService"
    android:exported="false">
    <intent-filter>
      <action android:name="com.google.firebase.MESSAGING_EVENT" />
    </intent-filter>
  </service>
</application>
```

### 4. Create MyFirebaseMessagingService.java
```java
package com.yourcompany.meetme;

import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.os.Build;
import androidx.core.app.NotificationCompat;
import com.google.firebase.messaging.FirebaseMessagingService;
import com.google.firebase.messaging.RemoteMessage;

public class MyFirebaseMessagingService extends FirebaseMessagingService {
    private static final String CHANNEL_ID = "meetme_notifications";

    @Override
    public void onMessageReceived(RemoteMessage remoteMessage) {
        super.onMessageReceived(remoteMessage);

        if (remoteMessage.getNotification() != null) {
            sendNotification(
                remoteMessage.getNotification().getTitle(),
                remoteMessage.getNotification().getBody(),
                remoteMessage.getData()
            );
        }
    }

    @Override
    public void onNewToken(String token) {
        // Send token to your server
        sendTokenToServer(token);
    }

    private void sendNotification(String title, String messageBody, Map<String, String> data) {
        Intent intent = new Intent(this, MainActivity.class);
        intent.addFlags(Intent.FLAG_ACTIVITY_CLEAR_TOP);
        intent.putExtra("notification_data", new Gson().toJson(data));
        
        PendingIntent pendingIntent = PendingIntent.getActivity(
            this, 0, intent, PendingIntent.FLAG_IMMUTABLE);

        NotificationCompat.Builder notificationBuilder =
            new NotificationCompat.Builder(this, CHANNEL_ID)
                .setSmallIcon(R.drawable.ic_notification)
                .setContentTitle(title)
                .setContentText(messageBody)
                .setAutoCancel(true)
                .setContentIntent(pendingIntent);

        NotificationManager notificationManager =
            (NotificationManager) getSystemService(Context.NOTIFICATION_SERVICE);

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel channel = new NotificationChannel(
                CHANNEL_ID,
                "MeetMe Notifications",
                NotificationManager.IMPORTANCE_DEFAULT);
            notificationManager.createNotificationChannel(channel);
        }

        notificationManager.notify(0, notificationBuilder.build());
    }

    private void sendTokenToServer(String token) {
        // Implement API call to send token to your backend
        // This is crucial for sending targeted notifications
    }
}
```

## iOS Setup

### 1. Update Podfile
```ruby
pod 'Firebase/Messaging'
pod 'Firebase/Analytics'
```

### 2. Update AppDelegate.swift
```swift
import UIKit
import Firebase
import FirebaseMessaging
import UserNotifications

@UIApplicationMain
class AppDelegate: UIResponder, UIApplicationDelegate, UNUserNotificationCenterDelegate, MessagingDelegate {

    func application(_ application: UIApplication, didFinishLaunchingWithOptions launchOptions: [UIApplication.LaunchOptionsKey: Any]?) -> Bool {
        
        FirebaseApp.configure()
        
        // Messaging
        Messaging.messaging().delegate = self
        
        // Notifications
        if #available(iOS 10.0, *) {
            UNUserNotificationCenter.current().delegate = self
            
            let authOptions: UNAuthorizationOptions = [.alert, .badge, .sound]
            UNUserNotificationCenter.current().requestAuthorization(
                options: authOptions,
                completionHandler: {_, _ in })
        } else {
            let settings: UIUserNotificationSettings =
            UIUserNotificationSettings(types: [.alert, .badge, .sound], categories: nil)
            application.registerUserNotificationSettings(settings)
        }
        
        application.registerForRemoteNotifications()
        
        return true
    }
    
    // Receive Device Token
    func application(_ application: UIApplication, didRegisterForRemoteNotificationsWithDeviceToken deviceToken: Data) {
        Messaging.messaging().apnsToken = deviceToken
    }
    
    // Messaging Delegate
    func messaging(_ messaging: Messaging, didReceiveRegistrationToken fcmToken: String?) {
        print("Firebase registration token: \(String(describing: fcmToken))")
        
        let dataDict:[String: String] = ["token": fcmToken ?? ""]
        NotificationCenter.default.post(name: Notification.Name("FCMToken"), object: nil, userInfo: dataDict)
        
        // Send token to your server
        sendTokenToServer(token: fcmToken ?? "")
    }
    
    // Notification received in foreground
    @available(iOS 10.0, *)
    func userNotificationCenter(_ center: UNUserNotificationCenter, willPresent notification: UNNotification, withCompletionHandler completionHandler: @escaping (UNNotificationPresentationOptions) -> Void) {
        completionHandler([[.alert, .badge, .sound]])
    }
    
    // Notification tapped
    @available(iOS 10.0, *)
    func userNotificationCenter(_ center: UNUserNotificationCenter, didReceive response: UNNotificationResponse, withCompletionHandler completionHandler: @escaping () -> Void) {
        print("Notification tapped: \(response)")
        // Handle notification tap
        completionHandler()
    }
    
    private func sendTokenToServer(token: String) {
        // Implement API call to send token to your backend
    }
}
```

## Server-Side Implementation

### 1. Install Required Dependencies
```bash
npm install firebase-admin axios
```

### 2. Create Notification Service
```javascript
// services/pushNotificationService.js
const admin = require('firebase-admin');
const axios = require('axios');

// Initialize Firebase Admin SDK
const serviceAccount = require('./path/to/serviceAccountKey.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

class PushNotificationService {
  constructor() {
    this.fcmEndpoint = 'https://fcm.googleapis.com/fcm/send';
  }

  // Send notification to single device
  async sendToDevice(deviceToken, title, body, data = {}) {
    const message = {
      token: deviceToken,
      notification: {
        title: title,
        body: body
      },
      data: data,
      android: {
        notification: {
          icon: 'ic_notification',
          color: '#488AFF',
          sound: 'default'
        }
      },
      apns: {
        payload: {
          aps: {
            alert: {
              title: title,
              body: body
            },
            sound: 'default'
          }
        }
      }
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent message:', response);
      return response;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  // Send notification to multiple devices
  async sendToMultipleDevices(deviceTokens, title, body, data = {}) {
    const message = {
      notification: {
        title: title,
        body: body
      },
      data: data,
      tokens: deviceTokens
    };

    try {
      const response = await admin.messaging().sendMulticast(message);
      console.log('Successfully sent multicast message:', response);
      return response;
    } catch (error) {
      console.error('Error sending multicast message:', error);
      throw error;
    }
  }

  // Send to topic
  async sendToTopic(topic, title, body, data = {}) {
    const message = {
      notification: {
        title: title,
        body: body
      },
      data: data,
      topic: topic
    };

    try {
      const response = await admin.messaging().send(message);
      console.log('Successfully sent topic message:', response);
      return response;
    } catch (error) {
      console.error('Error sending topic message:', error);
      throw error;
    }
  }
}

module.exports = new PushNotificationService();
```

### 3. Express.js Endpoint for Sending Notifications
```javascript
// routes/notifications.js
const express = require('express');
const router = express.Router();
const pushService = require('../services/pushNotificationService');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Send notification to user
router.post('/send', async (req, res) => {
  try {
    const { userId, title, body, data } = req.body;

    // Get user's push token from Supabase
    const { data: user, error } = await supabase
      .from('users')
      .select('push_token')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(400).json({ error: 'User not found' });
    }

    if (!user.push_token) {
      return res.status(400).json({ error: 'User has no push token' });
    }

    // Send notification
    const result = await pushService.sendToDevice(
      user.push_token,
      title,
      body,
      data
    );

    res.json({ success: true, result });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
```

## Integration with Supabase

### 1. Update Users Table Schema
Add a column to store push tokens:

```sql
ALTER TABLE users ADD COLUMN push_token TEXT;
ALTER TABLE users ADD COLUMN notification_preferences JSONB DEFAULT '{}';
```

### 2. Create Database Function for Storing Tokens
```sql
-- Function to store push token
CREATE OR REPLACE FUNCTION store_push_token(user_id UUID, token TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE users 
  SET push_token = token 
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;
```

### 3. Update User Profile with Push Token
```javascript
// In your client-side code when registering for notifications
async function registerPushToken(userId, token) {
  const { error } = await supabase
    .from('users')
    .update({ push_token: token })
    .eq('id', userId);
    
  if (error) {
    console.error('Error storing push token:', error);
  } else {
    console.log('Push token stored successfully');
  }
}
```

## Client-Side Implementation

### 1. Capacitor Push Notifications Plugin
```bash
npm install @capacitor/push-notifications
npx cap sync
```

### 2. Update Capacitor Configuration (capacitor.config.ts)
```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.yourcompany.meetme',
  appName: 'MeetMe',
  webDir: 'dist',
  bundledWebRuntime: false,
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;
```

### 3. Enhanced Notification Service for Native Apps
```typescript
// services/nativeNotificationService.ts
import { PushNotifications, Token, PushNotificationSchema } from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { supabase } from './supabaseClient';

interface NotificationData {
  title: string;
  body: string;
  data?: {
    chatId?: string;
    senderId?: string;
    senderName?: string;
  };
}

class NativeNotificationService {
  async initialize() {
    // Request permission
    const permissionResult = await PushNotifications.requestPermissions();
    
    if (permissionResult.receive === 'granted') {
      // Register for push notifications
      await PushNotifications.register();
      
      // Handle registration
      PushNotifications.addListener('registration', (token: Token) => {
        console.log('Push registration success, token:', token.value);
        this.storePushToken(token.value);
      });

      // Handle incoming notifications
      PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
        console.log('Push notification received:', notification);
        
        // Show local notification when app is in foreground
        this.showLocalNotification({
          title: notification.title || 'New Message',
          body: notification.body || 'You have a new message',
          data: notification.data as any
        });
      });

      // Handle notification tap
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        console.log('Push notification action performed:', action);
        // Navigate to the appropriate chat
        if (action.notification.data && action.notification.data.chatId) {
          // Trigger navigation in your app
          console.log('Navigate to chat:', action.notification.data.chatId);
        }
      });
    } else {
      console.log('Push notification permission denied');
    }
  }

  private async storePushToken(token: string) {
    try {
      const currentUser = sessionStorage.getItem('currentUser');
      if (currentUser) {
        const user = JSON.parse(currentUser);
        
        const { error } = await supabase
          .from('users')
          .update({ push_token: token })
          .eq('id', user.id);
        
        if (error) {
          console.error('Error storing push token:', error);
        } else {
          console.log('Push token stored successfully');
        }
      }
    } catch (error) {
      console.error('Error storing push token:', error);
    }
  }

  private async showLocalNotification(notification: NotificationData) {
    try {
      await LocalNotifications.schedule({
        notifications: [{
          id: Math.floor(Math.random() * 1000000),
          title: notification.title,
          body: notification.body,
          data: notification.data || {},
          smallIcon: 'ic_notification',
          iconColor: '#488AFF',
          sound: 'beep.wav'
        }]
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }
}

export const nativeNotificationService = new NativeNotificationService();
```

## Testing and Troubleshooting

### 1. Testing Push Notifications
1. **Get Device Token**: Ensure your app successfully registers and stores the device token
2. **Test on Device**: Always test push notifications on physical devices, not simulators
3. **Background State**: Test notifications when app is in background/foreground/killed states

### 2. Common Issues and Solutions

#### Android:
- **Notification not showing**: Check if notification channel is properly created
- **Token not registered**: Ensure `google-services.json` is in the correct location
- **Permission denied**: Check if notifications are enabled in device settings

#### iOS:
- **Token not registered**: Ensure proper entitlements in `Entitlements-Debug.plist`
- **Silent notifications**: Check if proper background modes are enabled
- **App not receiving**: Verify APNs certificate configuration

#### Server:
- **Invalid registration token**: Token may have expired or changed
- **Mismatched credential**: Check if the server key matches the project

### 3. Debugging Commands
```bash
# Check if push notifications are enabled in Capacitor
npx cap doctor

# Sync plugins after installation
npx cap sync

# Copy web assets to native projects
npx cap copy
```

### 4. Monitoring and Analytics
Consider implementing analytics to track:
- Notification delivery rates
- Open rates
- User engagement metrics
- Error rates and common issues

This setup provides a complete push notification system that works across both Android and iOS platforms, integrated with your Supabase backend and the MeetMe application.