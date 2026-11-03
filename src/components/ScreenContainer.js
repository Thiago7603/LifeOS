import React from "react";
import { ScrollView, StyleSheet } from "react-native";
import { useTheme } from "../styles/ThemeContext";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ScreenContainer({ children }) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: colors.background,
      }}
      contentContainerStyle={[
        styles.container,
        {
          paddingTop: Math.max(insets.top, 18),
          paddingBottom: Math.max(insets.bottom, 30),
        },
      ]}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    paddingBottom: 30,
  },
});