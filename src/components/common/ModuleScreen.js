
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "./ScreenContainer";
import { useTheme } from "../../styles/ThemeContext";

export default function ModuleScreen({
  title,
  description,
  icon,
  color,
  children,
}) {
  const { colors } = useTheme();

  return (
    <ScreenContainer>
      <View style={styles.header}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: color + "20" },
          ]}
        >
          <Ionicons name={icon} size={28} color={color} />
        </View>

        <Text style={[styles.title, { color: colors.text }]}>
          {title}
        </Text>

        <Text
          style={[
            styles.description,
            { color: colors.textSecondary },
          ]}
        >
          {description}
        </Text>
      </View>

      {children}
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: 20,
    marginBottom: 25,
    alignItems: "flex-start",
    gap: 12,
  },

  iconContainer: {
    width: 58,
    height: 58,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },

  title: {
    fontSize: 26,
    fontWeight: "800",
  },

  description: {
    fontSize: 13,
    lineHeight: 20,
  },
});