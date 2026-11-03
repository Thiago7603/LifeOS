
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import {
  useColorScheme,
  ActivityIndicator,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { lightColors, darkColors } from "../constants/colors";

const ThemeContext = createContext(null);

const THEME_STORAGE_KEY = "@lifeos_theme";

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();

  const [themeMode, setThemeMode] = useState("system");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadTheme() {
      try {
        const savedTheme = await AsyncStorage.getItem(
          THEME_STORAGE_KEY
        );

        if (savedTheme) {
          setThemeMode(savedTheme);
        }
      } catch (error) {
        console.error("Error cargando tema:", error);
      } finally {
        setLoading(false);
      }
    }

    loadTheme();
  }, []);

  const changeTheme = async (mode) => {
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
      setThemeMode(mode);
    } catch (error) {
      console.error("Error guardando tema:", error);
    }
  };

  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && systemScheme === "dark");

  const colors = isDark ? darkColors : lightColors;

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <ThemeContext.Provider
      value={{
        colors,
        themeMode,
        isDark,
        changeTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error(
      "useTheme debe utilizarse dentro de ThemeProvider"
    );
  }

  return context;
}
