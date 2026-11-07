// src/features/habits/hooks/useHabits.js
// Hook que gestiona la carga de hábitos, estadísticas y las acciones
// de completación y eliminación. Encapsula toda la lógica de datos
// de la pantalla HabitsScreen.

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import {
  getHabits,
  getHabitStatistics,
  toggleHabitCompletion,
  deleteHabit,
} from '../../../database/repositories/habitsRepository';

const EMPTY_STATISTICS = {
  consistency: null,
  hasConsistencyData: false,
  completedHabitDays: 0,
  possibleHabitDays: 0,
  dailyActivity: [],
  weekDays: [],
  categoryDistribution: [],
  currentWeek: null,
};

/**
 * Carga y gestiona el estado de los hábitos y las estadísticas.
 *
 * @returns {{
 *   habits: object[],
 *   statistics: object,
 *   loadHabits: () => void,
 *   handleToggle: (id: number, currentStatus: number) => void,
 *   handleDeleteWithConfirmation: (habit: object) => void,
 * }}
 */
export function useHabits() {
  const [habits, setHabits] = useState([]);
  const [statistics, setStatistics] = useState(EMPTY_STATISTICS);

  const loadHabits = useCallback(() => {
    try {
      const data = getHabits();
      const stats = getHabitStatistics();
      setHabits(data);
      setStatistics(stats);
    } catch (error) {
      console.error('Error al cargar hábitos desde SQLite:', error);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [loadHabits])
  );

  const handleToggle = useCallback((id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    toggleHabitCompletion(id, newStatus);
    loadHabits();
  }, [loadHabits]);

  const handleDeleteWithConfirmation = useCallback((habit) => {
    Alert.alert(
      'Eliminar Hábito',
      `¿Estás seguro de que deseas eliminar "${habit.title}"?\n\nEsta acción borrará permanentemente el hábito y todo su historial de cumplimiento.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            try {
              deleteHabit(habit.id);
              loadHabits();
            } catch (error) {
              Alert.alert('Error', 'No se pudo eliminar el hábito: ' + error.message);
            }
          },
        },
      ],
      { cancelable: true }
    );
  }, [loadHabits]);

  return {
    habits,
    statistics,
    loadHabits,
    handleToggle,
    handleDeleteWithConfirmation,
  };
}

