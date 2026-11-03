import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../src/styles/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  // Adaptación al área inferior del dispositivo
  const paddingBottom = insets.bottom > 0 ? insets.bottom : 7;
  const tabBarHeight = 58 + paddingBottom;

  const screens = [
    {
      name: "index",
      title: "Inicio",
      icon: "home-outline",
      activeIcon: "home",
    },
    {
      name: "habits",
      title: "Hábitos",
      icon: "checkmark-circle-outline",
      activeIcon: "checkmark-circle",
    },
    {
      name: "projects",
      title: "Proyectos",
      icon: "folder-outline",
      activeIcon: "folder",
    },
    {
      name: "fitness",
      title: "Fitness",
      icon: "barbell-outline",
      activeIcon: "barbell",
    },
    {
      name: "profile",
      title: "Perfil",
      icon: "person-outline",
      activeIcon: "person",
    },
  ];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,

        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.tabInactive,

        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          height: tabBarHeight,
          paddingTop: 7,
          paddingBottom: paddingBottom,
          elevation: 0,
        },

        tabBarItemStyle: {
          flex: 1,
          minWidth: 0,
        },

        tabBarIconStyle: {
          marginTop: 0,
        },

        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
          marginTop: 2,
        },
      }}
    >
      {screens.map((screen) => (
        <Tabs.Screen
          key={screen.name}
          name={screen.name}
          options={{
            title: screen.title,

            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? screen.activeIcon : screen.icon}
                size={22}
                color={color}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
