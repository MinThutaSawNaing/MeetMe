interface NotificationData {
  title: string;
  body: string;
  data?: {
    chatId?: string;
    senderId?: string;
    senderName?: string;
  };
}

class UnifiedNotificationService {
  private isNative: boolean;
  private initialized: boolean = false;

  constructor() {
    // Detect if running in native environment
    this.isNative = !!(window as any).Capacitor;
  }

  async initialize(): Promise<boolean> {
    if (this.initialized) {
      return true;
    }

    try {
      if (this.isNative) {
        await this.initializeNativeNotifications();
      } else {
        await this.initializeWebNotifications();
      }
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing notifications:', error);
      return false;
    }
  }

  private async initializeNativeNotifications() {
    // In a native app, this would be implemented with Capacitor plugins
    console.log('Native notification initialization would occur here');
    // Actual implementation would use:
    // import { PushNotifications } from '@capacitor/push-notifications';
    // import { LocalNotifications } from '@capacitor/local-notifications';
  }

  private async initializeWebNotifications() {
    try {
      if ('Notification' in window) {
        const permission = await Notification.requestPermission();
        if (permission === 'granted') {
          console.log('Web notifications permission granted');
        } else {
          console.log('Web notifications permission denied');
        }
      }
    } catch (error) {
      console.error('Error initializing web notifications:', error);
    }
  }

  async showNotification(notification: NotificationData): Promise<boolean> {
    try {
      if (this.isNative) {
        return await this.showNativeNotification(notification);
      } else {
        return await this.showWebNotification(notification);
      }
    } catch (error) {
      console.error('Error showing notification:', error);
      return false;
    }
  }

  private async showNativeNotification(notification: NotificationData): Promise<boolean> {
    // Placeholder for native notification implementation
    console.log('Native notification would be shown:', notification);
    // In a real native app, this would use Capacitor plugins
    return true;
  }

  private async showWebNotification(notification: NotificationData): Promise<boolean> {
    if ('Notification' in window && Notification.permission === 'granted') {
      try {
        const webNotification = new Notification(notification.title, {
          body: notification.body,
          icon: '/icon-72x72.png', // Your app icon
          badge: '/icon-72x72.png',
          data: notification.data || {},
          tag: notification.data?.chatId || 'general' // Group notifications
        });

        // Auto close after 5 seconds if not clicked
        setTimeout(() => {
          if (webNotification) {
            try {
              webNotification.close();
            } catch (e) {
              // Ignore error if notification already closed
            }
          }
        }, 5000);

        // Handle notification click
        webNotification.onclick = () => {
          console.log('Notification clicked');
          // Bring the app to foreground
          if (typeof window !== 'undefined' && window.focus) {
            window.focus();
          }
        };

        return true;
      } catch (error) {
        console.error('Error showing web notification:', error);
        return false;
      }
    }
    return false;
  }

  async isSupported(): Promise<boolean> {
    if (this.isNative) {
      // In native app, check if plugins are available
      return !!(window as any).Capacitor;
    } else {
      return 'Notification' in window && Notification.permission !== 'denied';
    }
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (this.isNative) {
        // In native app, request permission through Capacitor
        console.log('Requesting native notification permission');
        return true; // Placeholder
      } else {
        if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          return permission === 'granted';
        }
      }
      return false;
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  // Method to check if app is in foreground/background
  isAppFocused(): boolean {
    return typeof document !== 'undefined' && document.visibilityState === 'visible';
  }
}

export const notificationService = new UnifiedNotificationService();