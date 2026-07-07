import { Tabs } from "expo-router";
import { Home, Briefcase, MessageSquare, User } from "lucide-react-native";
import { colors } from "@/lib/colors";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown:   false,
        tabBarStyle: {
          backgroundColor:  colors.navy,
          borderTopColor:   "rgba(255,255,255,0.1)",
          borderTopWidth:   1,
          height:           72,
          paddingBottom:    12,
          paddingTop:       8,
        },
        tabBarActiveTintColor:   colors.amber,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: {
          fontSize:   10,
          fontWeight: "500",
          marginTop:  2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:    "Home",
          tabBarIcon: ({ color, size }) => <Home color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="jobs"
        options={{
          title:    "My Jobs",
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title:    "Messages",
          tabBarIcon: ({ color, size }) => <MessageSquare color={color} size={size - 2} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title:    "Profile",
          tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} />,
        }}
      />
    </Tabs>
  );
}
