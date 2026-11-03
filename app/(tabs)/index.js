
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import ScreenContainer from "../../src/components/ScreenContainer";
import { useTheme } from "../../src/styles/ThemeContext";

export default function HomeScreen() {
  const { colors } = useTheme();

  const styles = createStyles(colors);

  return (
    <ScreenContainer>
      {/* Encabezado */}
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.logo}>
            <Ionicons name="layers" size={23} color="#FFFFFF" />
          </View>

          <View>
            <Text style={styles.brandName}>LifeOS</Text>
            <Text style={styles.subtitle}>Tu espacio personal</Text>
          </View>
        </View>

        <Ionicons
          name="notifications-outline"
          size={25}
          color={colors.text}
        />
      </View>

      {/* Saludo */}
      <View style={styles.greeting}>
        <Text style={styles.date}>MARTES, 3 DE NOVIEMBRE</Text>
        <Text style={styles.title}>¡Hola! 👋</Text>
        <Text style={styles.description}>
          Cada pequeño avance cuenta. ¿Qué construiremos hoy?
        </Text>
      </View>

      {/* Progreso diario */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Text style={styles.cardTitle}>Progreso del día</Text>
          <Text style={styles.percentage}>0%</Text>
        </View>

        <View style={styles.progressBackground}>
          <View style={[styles.progressFill, { width: "0%" }]} />
        </View>

        <Text style={styles.muted}>
          Todavía no has registrado actividades.
        </Text>
      </View>

      {/* Mi día */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mi día</Text>
        <View style={styles.emptyCard}>
          <Ionicons
            name="calendar-outline"
            size={30}
            color={colors.primary}
          />
          <Text style={styles.emptyTitle}>
            Tu día está por comenzar
          </Text>
          <Text style={styles.muted}>
            Aquí aparecerán tus tareas y actividades programadas.
          </Text>
        </View>
      </View>

      {/* Hábitos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Hábitos</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.row}>
              <Ionicons
                name="checkmark-circle"
                size={23}
                color={colors.success}
              />
              <Text style={styles.cardTitle}> Hábitos activos</Text>
            </View>

            <Text style={styles.muted}>0 / 0</Text>
          </View>

          <Text style={styles.muted}>
            Tus hábitos aparecerán aquí cuando los crees.
          </Text>
        </View>
      </View>

      {/* Proyectos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Proyectos activos</Text>

        <View style={styles.card}>
          <View style={styles.row}>
            <Ionicons
              name="folder-open-outline"
              size={23}
              color={colors.project}
            />
            <Text style={styles.cardTitle}> Mis proyectos</Text>
          </View>

          <Text style={styles.muted}>
            Organiza tus ideas y convierte tus objetivos en proyectos.
          </Text>
        </View>
      </View>

      {/* Asistente IA */}
      <View style={styles.aiCard}>
        <View style={styles.row}>
          <Ionicons name="sparkles" size={24} color="#FFFFFF" />
          <Text style={styles.aiTitle}> Asistente LifeOS</Text>
        </View>

        <Text style={styles.aiDescription}>
          Tu asistente inteligente estará disponible próximamente.
        </Text>

        <Text style={styles.aiStatus}>
          <Ionicons name="cloud-outline" size={13} /> Requiere conexión a Internet
        </Text>
      </View>
    </ScreenContainer>
  );
}

function createStyles(colors) {
  return StyleSheet.create({
    header: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      marginBottom: 28,
    },

    brand: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },

    logo: {
      width: 43,
      height: 43,
      borderRadius: 13,
      backgroundColor: colors.primary,
      alignItems: "center",
      justifyContent: "center",
    },

    brandName: {
      color: colors.text,
      fontSize: 20,
      fontWeight: "800",
    },

    subtitle: {
      color: colors.textSecondary,
      fontSize: 11,
    },

    greeting: {
      marginBottom: 22,
    },

    date: {
      color: colors.primary,
      fontSize: 10,
      fontWeight: "700",
      letterSpacing: 1,
    },

    title: {
      color: colors.text,
      fontSize: 27,
      fontWeight: "800",
      marginTop: 7,
    },

    description: {
      color: colors.textSecondary,
      fontSize: 13,
      marginTop: 5,
      lineHeight: 20,
    },

    card: {
      backgroundColor: colors.surface,
      padding: 17,
      borderRadius: 18,
      marginBottom: 14,
      borderWidth: 1,
      borderColor: colors.border,
      gap: 12,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },

    cardTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
    },

    percentage: {
      color: colors.primary,
      fontSize: 20,
      fontWeight: "800",
    },

    progressBackground: {
      height: 8,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 10,
      overflow: "hidden",
    },

    progressFill: {
      height: "100%",
      backgroundColor: colors.primary,
      borderRadius: 10,
    },

    muted: {
      color: colors.textSecondary,
      fontSize: 12,
      lineHeight: 19,
    },

    section: {
      marginTop: 12,
      marginBottom: 8,
    },

    sectionTitle: {
      color: colors.text,
      fontSize: 17,
      fontWeight: "800",
      marginBottom: 12,
    },

    emptyCard: {
      backgroundColor: colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.border,
      padding: 22,
      alignItems: "center",
      gap: 9,
    },

    emptyTitle: {
      color: colors.text,
      fontSize: 14,
      fontWeight: "700",
    },

    aiCard: {
      backgroundColor: colors.primary,
      borderRadius: 18,
      padding: 18,
      marginTop: 15,
      gap: 12,
    },

    aiTitle: {
      color: "#FFFFFF",
      fontSize: 15,
      fontWeight: "800",
    },

    aiDescription: {
      color: "#FFFFFF",
      fontSize: 12,
      lineHeight: 19,
    },

    aiStatus: {
      color: "#E5E7FF",
      fontSize: 11,
    },
  });
}
