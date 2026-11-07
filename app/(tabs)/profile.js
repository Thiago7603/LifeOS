
import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "../../src/components/common/ScreenContainer";
import { useTheme } from "../../src/styles/ThemeContext";

export default function ProfileScreen() {
  const { colors, themeMode, changeTheme } = useTheme();

  const options = [
    { value: "light", label: "Claro", icon: "sunny-outline" },
    { value: "dark", label: "Oscuro", icon: "moon-outline" },
    { value: "system", label: "Sistema", icon: "phone-portrait-outline" },
  ];

  return (
    <ScreenContainer>
      <Text style={[styles.title, { color: colors.text }]}>
        Mi perfil
      </Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Personaliza tu experiencia en LifeOS.
      </Text>

      <View
        style={[
          styles.profileCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primaryLight }]}>
          <Ionicons name="person" size={32} color={colors.primary} />
        </View>

        <Text style={[styles.name, { color: colors.text }]}>
          Usuario LifeOS
        </Text>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Tu espacio personal
        </Text>
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Apariencia
      </Text>

      <View
        style={[
          styles.settingsCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.label, { color: colors.text }]}>
          Tema de la aplicación
        </Text>

        {options.map((option) => {
          const selected = themeMode === option.value;

          return (
            <Pressable
              key={option.value}
              onPress={() => changeTheme(option.value)}
              style={[
                styles.option,
                {
                  backgroundColor: selected
                    ? colors.primaryLight
                    : colors.surface,
                },
              ]}
            >
              <Ionicons
                name={option.icon}
                size={21}
                color={selected ? colors.primary : colors.textSecondary}
              />

              <Text
                style={[
                  styles.optionText,
                  { color: colors.text },
                ]}
              >
                {option.label}
              </Text>

              {selected && (
                <Ionicons
                  name="checkmark-circle"
                  size={21}
                  color={colors.primary}
                  style={{ marginLeft: "auto" }}
                />
              )}
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        Aplicación
      </Text>

      <View
        style={[
          styles.settingsCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.infoRow}>
          <Ionicons name="layers-outline" size={21} color={colors.primary} />
          <Text style={[styles.optionText, { color: colors.text }]}>
            LifeOS
          </Text>
          <Text style={[styles.version, { color: colors.textSecondary }]}>
            v1.0.0
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  title: {
    fontSize: 27,
    fontWeight: "800",
    marginTop: 10,
  },

  subtitle: {
    fontSize: 13,
    marginTop: 5,
  },

  profileCard: {
    alignItems: "center",
    padding: 24,
    borderRadius: 18,
    borderWidth: 1,
    marginTop: 24,
    marginBottom: 28,
  },

  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 12,
  },

  name: {
    fontSize: 17,
    fontWeight: "800",
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 12,
  },

  settingsCard: {
    padding: 15,
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 25,
    gap: 10,
  },

  label: {
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 5,
  },

  option: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 12,
    gap: 12,
  },

  optionText: {
    fontSize: 14,
    fontWeight: "600",
  },

  version: {
    marginLeft: "auto",
    fontSize: 12,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
});
