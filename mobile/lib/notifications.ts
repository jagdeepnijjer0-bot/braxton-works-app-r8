import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";
import { supabase, withTimeout } from "./supabase";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge:  true,
    shouldShowBanner: true,
    shouldShowList:   true,
  }),
});

export async function registerPushToken(jobIds?: string[]): Promise<string | null> {
  if (Platform.OS === "web") return null;
  if (!Device.isDevice) return null;

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let finalStatus = existing;
  if (existing !== "granted") {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== "granted") return null;

  const tokenData = await Notifications.getExpoPushTokenAsync();
  const token = tokenData.data;

  // Upsert one row per (token, job_id) pair so the server can find this device
  // for any of the user's jobs.
  if (jobIds && jobIds.length > 0) {
    const rows = jobIds.map((job_id) => ({ token, job_id }));
    await withTimeout(
      supabase.from("push_tokens").upsert(rows, { onConflict: "token,job_id" }),
      10_000
    ).catch(() => {});
  }

  return token;
}

export function addNotificationResponseListener(
  handler: (jobId: string | null) => void
) {
  if (Platform.OS === "web") {
    return { remove: () => {} };
  }
  return Notifications.addNotificationResponseReceivedListener((response) => {
    const data = response.notification.request.content.data as Record<string, string>;
    handler(data?.jobId ?? null);
  });
}
