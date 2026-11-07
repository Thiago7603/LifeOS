// src/features/habits/hooks/useHabitForm.js
// Hook que gestiona el estado del formulario de creación/edición de hábitos
// y la lógica de guardado. Separa completamente la lógica del formulario
// del componente de pantalla.

import { useState, useCallback } from 'react';
import { Alert } from 'react-native';
import {
  createHabit,
  updateHabit,
} from '../../../database/repositories/habitsRepository';

const DEFAULT_FORM = {
  title: '',
  description: '',
  category: 'Desarrollo',
  frequencyType: 'daily',
  selectedDays: [1, 3, 5],
  weeklyTarget: 3,
  targetMinutes: 25,
};

/**
 * Gestiona el formulario modal de creación y edición de hábitos.
 *
 * @param {{ onSaved: () => void }} options
 *   `onSaved` se llama tras guardar con éxito para que el caller recargue datos.
 *
 * @returns {{
 *   modalVisible: boolean,
 *   editingHabit: object|null,
 *   formState: {
 *     title, description, category,
 *     frequencyType, selectedDays, weeklyTarget, targetMinutes,
 *     setTitle, setDescription, setCategory,
 *     setFrequencyType, setWeeklyTarget, setTargetMinutes,
 *   },
 *   handleOpenCreateModal: () => void,
 *   handleOpenEditModal: (habit: object) => void,
 *   handleCloseModal: () => void,
 *   toggleSelectedDay: (day: number) => void,
 *   handleSaveHabit: () => void,
 * }}
 */
export function useHabitForm({ onSaved }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  const [title, setTitle] = useState(DEFAULT_FORM.title);
  const [description, setDescription] = useState(DEFAULT_FORM.description);
  const [category, setCategory] = useState(DEFAULT_FORM.category);
  const [frequencyType, setFrequencyType] = useState(DEFAULT_FORM.frequencyType);
  const [selectedDays, setSelectedDays] = useState(DEFAULT_FORM.selectedDays);
  const [weeklyTarget, setWeeklyTarget] = useState(DEFAULT_FORM.weeklyTarget);
  const [targetMinutes, setTargetMinutes] = useState(DEFAULT_FORM.targetMinutes);

  const resetForm = useCallback(() => {
    setTitle(DEFAULT_FORM.title);
    setDescription(DEFAULT_FORM.description);
    setCategory(DEFAULT_FORM.category);
    setFrequencyType(DEFAULT_FORM.frequencyType);
    setSelectedDays(DEFAULT_FORM.selectedDays);
    setWeeklyTarget(DEFAULT_FORM.weeklyTarget);
    setTargetMinutes(DEFAULT_FORM.targetMinutes);
  }, []);

  const handleOpenCreateModal = useCallback(() => {
    setEditingHabit(null);
    resetForm();
    setModalVisible(true);
  }, [resetForm]);

  const handleOpenEditModal = useCallback((habit) => {
    setEditingHabit(habit);
    setTitle(habit.title || '');
    setDescription(habit.description || '');
    setCategory(habit.category || DEFAULT_FORM.category);
    setFrequencyType(habit.frequency_type || DEFAULT_FORM.frequencyType);
    setSelectedDays(
      Array.isArray(habit.frequency_days) && habit.frequency_days.length > 0
        ? habit.frequency_days
        : DEFAULT_FORM.selectedDays
    );
    setWeeklyTarget(habit.weekly_target || DEFAULT_FORM.weeklyTarget);
    setTargetMinutes(habit.target_minutes || DEFAULT_FORM.targetMinutes);
    setModalVisible(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setModalVisible(false);
    setEditingHabit(null);
  }, []);

  const toggleSelectedDay = useCallback((day) => {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort((a, b) => a - b)
    );
  }, []);

  const handleSaveHabit = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('Campo requerido', 'Por favor ingresa un nombre para el hábito.');
      return;
    }

    if (frequencyType === 'specific_days' && selectedDays.length === 0) {
      Alert.alert(
        'Días requeridos',
        'Selecciona al menos un día de la semana para programar este hábito.'
      );
      return;
    }

    try {
      const habitPayload = {
        title: title.trim(),
        description: description.trim(),
        category,
        frequencyType,
        frequencyDays: selectedDays,
        weeklyTarget: Number(weeklyTarget) || DEFAULT_FORM.weeklyTarget,
        targetMinutes: Number(targetMinutes) || DEFAULT_FORM.targetMinutes,
        reminderTime: editingHabit?.reminder_time || '08:00',
      };

      if (editingHabit) {
        updateHabit(editingHabit.id, habitPayload);
      } else {
        createHabit(habitPayload);
      }

      handleCloseModal();
      onSaved();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar el hábito.');
    }
  }, [
    title,
    description,
    category,
    frequencyType,
    selectedDays,
    weeklyTarget,
    targetMinutes,
    editingHabit,
    handleCloseModal,
    onSaved,
  ]);

  return {
    modalVisible,
    editingHabit,
    formState: {
      title,
      description,
      category,
      frequencyType,
      selectedDays,
      weeklyTarget,
      targetMinutes,
      setTitle,
      setDescription,
      setCategory,
      setFrequencyType,
      setWeeklyTarget,
      setTargetMinutes,
    },
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseModal,
    toggleSelectedDay,
    handleSaveHabit,
  };
}

