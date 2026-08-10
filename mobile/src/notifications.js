import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermission() {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('medicine-reminders', {
      name: 'Medicine Reminders',
      importance: Notifications.AndroidImportance.HIGH,
    });
  }

  return finalStatus === 'granted';
}

export async function scheduleMedicineNotifications(medicineName, dosage, times) {
  const scheduled = [];

  for (const time of times) {
    const [hour, minute] = time.split(':').map(Number);

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Medicine Reminder',
        body: dosage ? `Time to take ${medicineName} (${dosage})` : `Time to take ${medicineName}`,
        sound: true,
      },
      trigger: {
        hour,
        minute,
        repeats: true,
      },
    });

    scheduled.push({ time, notificationId });
  }

  return scheduled;
}

export async function cancelMedicineNotifications(notificationIds) {
  for (const id of notificationIds) {
    await Notifications.cancelScheduledNotificationAsync(id);
  }
}