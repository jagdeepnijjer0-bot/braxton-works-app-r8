import { Tabs } from "expo-router";
import { Home, Briefcase, MessageSquare, User } from "lucide-react-native";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { colors } from "@/lib/colors";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

const TABS = [
  { name: "index",    label: "Home",     Icon: Home         },
  { name: "jobs",     label: "My Jobs",  Icon: Briefcase    },
  { name: "messages", label: "Messages", Icon: MessageSquare },
  { name: "profile",  label: "Profile",  Icon: User         },
] as const;

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={pill.wrap}>
      <View style={pill.bar}>
        {state.routes.map((route, i) => {
          const { options }  = descriptors[route.key];
          const isFocused    = state.index === i;
          const tab          = TABS[i];
          const color        = isFocused ? colors.amber : "rgba(255,255,255,0.4)";

          const onPress = () => {
            const event = navigation.emit({ type: "tabPress", target: route.key, canPreventDefault: true });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              style={pill.item}
              onPress={onPress}
              activeOpacity={0.75}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
            >
              <tab.Icon color={color} size={22} strokeWidth={isFocused ? 2.2 : 1.8} />
              <Text style={[pill.label, { color }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"    options={{ title: "Home"     }} />
      <Tabs.Screen name="jobs"     options={{ title: "My Jobs"  }} />
      <Tabs.Screen name="messages" options={{ title: "Messages" }} />
      <Tabs.Screen name="profile"  options={{ title: "Profile"  }} />
    </Tabs>
  );
}

const pill = StyleSheet.create({
  wrap: {
    position:         "absolute",
    bottom:           20,
    left:             20,
    right:            20,
    alignItems:       "center",
  },
  bar: {
    flexDirection:    "row",
    backgroundColor:  "#1E293B",
    borderRadius:     40,
    paddingVertical:  14,
    paddingHorizontal: 8,
    width:            "100%",
    shadowColor:      "#000",
    shadowOpacity:    0.35,
    shadowRadius:     24,
    shadowOffset:     { width: 0, height: 8 },
    elevation:        12,
  },
  item: {
    flex:         1,
    alignItems:   "center",
    justifyContent: "center",
    gap:          4,
    paddingVertical: 2,
  },
  label: {
    fontSize:     10,
    fontWeight:   "600",
    letterSpacing: 0.2,
  },
});
