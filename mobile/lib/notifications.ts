import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
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

export async function registerPushToken(): Promise<string | null> {
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
  } catch (e) {
    console.error("[push] getExpoPushTokenAsync failed:", e);
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // Guest, not signed in — the token is returned to the caller, who is
    // responsible for associating it with a job_id directly.
    return token;
  }

  await withTimeout(
    supabase.from("push_tokens").upsert(
      { token, user_id: user.id },
      { onConflict: "token,user_id" }
    ),
    10_000
  ).catch((e) => {
    console.error("[push] token upsert failed:", e);
  });

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