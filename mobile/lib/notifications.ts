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
    return null;
  }

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    // guest, not signed in yet — nothing to attach the token to
    return token;
  }

  await withTimeout(
    supabase.from("push_tokens").upsert(
      { token, user_id: user.id },
      { onConflict: "token,user_id" }
    ),
    10_000
  ).catch(() => {});

  return token;
}
