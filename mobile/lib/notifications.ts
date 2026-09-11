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
    Alert.alert("[push] getExpoPushTokenAsync failed", String(e));
    return null;
  }

  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  if (!user) {
    Alert.alert("[push] no user", `token: ${token.slice(0, 30)}…\nsession: ${session ? "present but no user" : "null"}`);
    return token;
  }

  const { error: upsertErr } = await withTimeout(
    supabase.from("push_tokens").upsert(
      { token, user_id: user.id },
      { onConflict: "token,user_id" }
    ),
    10_000
  ).catch((e: any) => ({ error: e }));

  Alert.alert(
    "[push] upsert result",
    `user_id: ${user.id}\ntoken: ${token.slice(0, 30)}…\nerror: ${upsertErr ? JSON.stringify(upsertErr) : "none"}`
  );

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