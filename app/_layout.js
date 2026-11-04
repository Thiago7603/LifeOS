import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { View, ActivityIndicator } from 'react-native';
import { ThemeProvider, useTheme } from '../src/styles/ThemeContext';
import { StatusBar } from 'expo-status-bar';
import { initDatabase } from '../src/database/db';

function RootNavigation() {
  const { isDark, colors } = useTheme();
  const [databaseReady, setDatabaseReady] = useState(false);
  const [databaseError, setDatabaseError] = useState(false);

  useEffect(() => {
    try {
      initDatabase();
      console.log('Base de datos SQLite inicializada correctamente.');
      setDatabaseReady(true);
    } catch (error) {
      console.error('Error al inicializar SQLite:', error);
      setDatabaseError(true);
    }
  }, []);

  if (!databaseReady) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          backgroundColor: colors.background,
        }}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />

      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigation />
    </ThemeProvider>
  );
}