import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform, Alert } from "react-native";
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

  if (!Device.isDevice) {
    Alert.alert("[push] skipped", "Not a physical device (Device.isDevice = false)");
    return null;
  }

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
  if (finalStatus !== "granted") {
    Alert.alert("[push] permission denied", `status: ${finalStatus}`);
    return null;
  }

  // projectId is required by getExpoPushTokenAsync in Expo SDK 49+.
  // It is injected by EAS Build into Constants.expoConfig.extra.eas.projectId
  // and also available via Constants.easConfig.projectId in managed workflow.
  const projectId: string | undefined =
    (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ??
    (Constants.easConfig?.projectId as string | undefined);

  let token: string;
  try {
    const tokenData = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    token = tokenData.data;
  } catch (e: any) {
    Alert.alert(
      "[push] getExpoPushTokenAsync failed",
      `projectId: ${projectId ?? "undefined"}\n\n${e?.message ?? String(e)}`
    );
    return null;
  }

  // Upsert one row per (token, job_id) pair so the server can find this device
  // for any of the user's jobs.
  if (jobIds && jobIds.length > 0) {
    const rows = jobIds.map((job_id) => ({ token, job_id }));
    const { error: upsertErr } = await withTimeout(
      supabase.from("push_tokens").upsert(rows, { onConflict: "token,job_id" }),
      10_000
    ).catch((e: any) => ({ error: e }));
    Alert.alert(
      "[push] token obtained",
      `token: ${token.slice(0, 40)}…\njobIds: ${jobIds.length}\nupsert error: ${upsertErr ? JSON.stringify(upsertErr) : "none"}`
    );
  } else {
    Alert.alert("[push] token obtained (no jobIds)", `token: ${token.slice(0, 40)}…\nNo DB upsert — no job IDs`);
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
