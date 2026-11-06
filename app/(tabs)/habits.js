import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/styles/ThemeContext';
import {
  getHabits,
  createHabit,
  updateHabit,
  deleteHabit,
  toggleHabitCompletion,
  getHabitStatistics,
  DAY_NAMES,
} from '../../src/database/db';

export default function HabitsScreen() {
  const { colors, isDark } = useTheme();

  // Estados de datos
  const [habits, setHabits] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [statistics, setStatistics] = useState({
    consistency: null,
    hasConsistencyData: false,
    completedHabitDays: 0,
    possibleHabitDays: 0,
    dailyActivity: [],
    weekDays: [],
    categoryDistribution: [],
    currentWeek: null,
  });

  // Modal y modo edición
  const [modalVisible, setModalVisible] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);

  // Estados del formulario
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Desarrollo');
  const [frequencyType, setFrequencyType] = useState('daily');
  const [selectedDays, setSelectedDays] = useState([1, 3, 5]);
  const [weeklyTarget, setWeeklyTarget] = useState(3);
  const [targetMinutes, setTargetMinutes] = useState(25);

  const daysOptions = [
    { label: 'L', value: 1 },
    { label: 'M', value: 2 },
    { label: 'X', value: 3 },
    { label: 'J', value: 4 },
    { label: 'V', value: 5 },
    { label: 'S', value: 6 },
    { label: 'D', value: 7 },
  ];

  const categoriesList = ['Desarrollo', 'Carrera', 'Salud', 'Mente'];
  const filterCategories = ['Todos', 'Desarrollo', 'Carrera', 'Salud', 'Mente'];
  const timeOptions = [5, 10, 15, 25, 45, 60];

  // --------------------------------------------------
  // CARGA DE DATOS LOCALES (OFFLINE-FIRST)
  // --------------------------------------------------

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

  // --------------------------------------------------
  // ACCIONES DEL FORMULARIO Y MODAL (CREAR / EDITAR)
  // --------------------------------------------------

  const handleOpenCreateModal = () => {
    setEditingHabit(null);
    setTitle('');
    setDescription('');
    setCategory('Desarrollo');
    setFrequencyType('daily');
    setSelectedDays([1, 3, 5]);
    setWeeklyTarget(3);
    setTargetMinutes(25);
    setModalVisible(true);
  };

  const handleOpenEditModal = (habit) => {
    setEditingHabit(habit);
    setTitle(habit.title || '');
    setDescription(habit.description || '');
    setCategory(habit.category || 'Desarrollo');
    setFrequencyType(habit.frequency_type || 'daily');
    setSelectedDays(
      Array.isArray(habit.frequency_days) && habit.frequency_days.length > 0
        ? habit.frequency_days
        : [1, 3, 5]
    );
    setWeeklyTarget(habit.weekly_target || 3);
    setTargetMinutes(habit.target_minutes || 25);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setEditingHabit(null);
  };

  const toggleSelectedDay = (day) => {
    setSelectedDays((current) =>
      current.includes(day)
        ? current.filter((item) => item !== day)
        : [...current, day].sort((a, b) => a - b)
    );
  };

  const handleSaveHabit = () => {
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
        weeklyTarget: Number(weeklyTarget) || 3,
        targetMinutes: Number(targetMinutes) || 25,
        reminderTime: editingHabit?.reminder_time || '08:00',
      };

      if (editingHabit) {
        updateHabit(editingHabit.id, habitPayload);
      } else {
        createHabit(habitPayload);
      }

      handleCloseModal();
      loadHabits();
    } catch (error) {
      Alert.alert('Error', error.message || 'No se pudo guardar el hábito.');
    }
  };

  // --------------------------------------------------
  // ACCIONES DE COMPLETACIÓN Y ELIMINACIÓN CON CONFIRMACIÓN
  // --------------------------------------------------

  const handleToggle = (id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    toggleHabitCompletion(id, newStatus);
    loadHabits();
  };

  const handleDeleteWithConfirmation = (habit) => {
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
  };

  // --------------------------------------------------
  // FILTRADO INTELIGENTE: RUTINA DE HOY VS OTROS DÍAS
  // --------------------------------------------------

  const filteredHabits = selectedCategory === 'Todos'
    ? habits
    : habits.filter((h) => h.category.toLowerCase() === selectedCategory.toLowerCase());

  const todayHabits = filteredHabits.filter((h) => h.isScheduledToday);
  const otherHabits = filteredHabits.filter((h) => !h.isScheduledToday);

  // Métricas de cabecera
  const maxStreak = habits.length > 0
    ? Math.max(...habits.map((h) => h.streak || 0))
    : 0;

  const todayCompletedCount = todayHabits.filter((h) => h.completed === 1).length;

  const consistencyPercentage = statistics.hasConsistencyData
    ? statistics.consistency
    : null;

  const weekDays = statistics.weekDays || [];

  // --------------------------------------------------
  // RENDERIZADO MODULAR DE TARJETA DE HÁBITO
  // --------------------------------------------------

  const renderHabitCard = (item, isTodayRoutine) => {
    const isWeekly = item.frequency_type === 'weekly';
    const isSpecificDays = item.frequency_type === 'specific_days';
    const weeklyPercent = isWeekly
      ? Math.min(100, Math.round(((item.weeklyCompletionsCount || 0) / (item.weeklyTarget || 1)) * 100))
      : 0;

    return (
      <View
        key={item.id}
        style={[
          styles.habitCard,
          {
            backgroundColor: colors.surface,
            borderColor: isTodayRoutine ? 'transparent' : colors.border,
            borderWidth: isTodayRoutine ? 0 : 1,
          },
        ]}
      >
        <View style={styles.habitInfo}>
          {/* Cabecera de la tarjeta: Categoría, frecuencia y acciones */}
          <View style={styles.habitMetaRow}>
            <View style={styles.habitHeaderLeft}>
              <Text style={[styles.habitCategory, { color: colors.primary }]}>
                {item.category.toUpperCase()}
              </Text>
              <Text style={[styles.habitFrequencyPill, { color: colors.textSecondary }]}>
                • {item.frequency}
              </Text>
            </View>

            <View style={styles.habitActionsRow}>
              <TouchableOpacity
                onPress={() => handleOpenEditModal(item)}
                style={styles.actionIconButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Editar hábito"
              >
                <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleDeleteWithConfirmation(item)}
                style={styles.actionIconButton}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                accessibilityLabel="Eliminar hábito"
              >
                <Ionicons name="trash-outline" size={18} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Nombre y descripción */}
          <Text style={[styles.habitName, { color: colors.text }]}>{item.title}</Text>
          {item.description ? (
            <Text
              style={[styles.habitDescription, { color: colors.textSecondary }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
          ) : null}

          {/* Meta diaria en minutos */}
          <Text style={[styles.habitDetails, { color: colors.textSecondary }]}>
            Meta diaria: {item.target_minutes} min
          </Text>

          {/* Progreso de metas semanales (Requisito 4) */}
          {isWeekly && (
            <View
              style={[
                styles.weeklyProgressContainer,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <View style={styles.weeklyProgressHeader}>
                <Text
                  style={[
                    styles.weeklyProgressText,
                    {
                      color: item.isWeeklyGoalMet ? colors.success : colors.text,
                    },
                  ]}
                >
                  {item.weeklyCompletionsCount} de {item.weeklyTarget} veces completadas
                </Text>

                {item.isWeeklyGoalMet && (
                  <View
                    style={[
                      styles.goalMetBadge,
                      { backgroundColor: colors.successLight },
                    ]}
                  >
                    <Ionicons name="checkmark-done" size={12} color={colors.success} />
                    <Text style={[styles.goalMetText, { color: colors.success }]}>
                      Meta alcanzada
                    </Text>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.weeklyProgressBarBg,
                  { backgroundColor: colors.border },
                ]}
              >
                <View
                  style={[
                    styles.weeklyProgressBarFill,
                    {
                      width: `${weeklyPercent}%`,
                      backgroundColor: item.isWeeklyGoalMet ? colors.success : colors.primary,
                    },
                  ]}
                />
              </View>
            </View>
          )}

          {/* Badge informativo para hábitos fuera de la rutina de hoy */}
          {!isTodayRoutine && (
            <View
              style={[
                styles.scheduleBadge,
                {
                  backgroundColor: item.isWeeklyGoalMet
                    ? colors.successLight
                    : colors.surfaceSecondary,
                },
              ]}
            >
              <Ionicons
                name={item.isWeeklyGoalMet ? 'trophy-outline' : 'calendar-outline'}
                size={13}
                color={item.isWeeklyGoalMet ? colors.success : colors.textSecondary}
              />
              <Text
                style={[
                  styles.scheduleBadgeText,
                  {
                    color: item.isWeeklyGoalMet ? colors.success : colors.textSecondary,
                  },
                ]}
              >
                {item.isWeeklyGoalMet
                  ? `Meta semanal cumplida (${item.weeklyCompletionsCount}/${item.weeklyTarget})`
                  : isSpecificDays
                    ? `Programado: ${item.frequency}`
                    : 'No programado para hoy'}
              </Text>
            </View>
          )}

          {/* Contador de racha */}
          <Text style={[styles.habitStreak, { color: colors.fitness }]}>
            🔥 {item.streak}{' '}
            {item.frequency_type === 'weekly'
              ? 'semanas seguidas'
              : item.frequency_type === 'specific_days'
                ? 'cumplimientos seguidos'
                : 'días de racha'}
          </Text>
        </View>

        {/* Botón de cumplimiento diario */}
        <TouchableOpacity
          style={[
            styles.checkButton,
            { borderColor: colors.border },
            item.completed === 1 && {
              backgroundColor: colors.success,
              borderColor: colors.success,
            },
          ]}
          onPress={() => handleToggle(item.id, item.completed)}
          accessibilityLabel={`Marcar hábito ${item.title} como ${
            item.completed === 1 ? 'pendiente' : 'completado'
          }`}
        >
          {item.completed === 1 && <Ionicons name="checkmark" size={18} color="#fff" />}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* -------------------------------------------------- */}
        {/* HEADER DE RACHA Y SEMANA ACTUAL                    */}
        {/* -------------------------------------------------- */}
        <View style={[styles.streakCard, { backgroundColor: colors.surface }]}>
          <View style={styles.streakHeaderRow}>
            <Ionicons name="flame" size={24} color={colors.fitness} />
            <Text style={[styles.streakTitle, { color: colors.text }]}>
              Mejor Racha: {maxStreak} 🔥
            </Text>
            <View
              style={[
                styles.offlineBadge,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text style={[styles.offlineText, { color: colors.textSecondary }]}>
                Offline activo
              </Text>
            </View>
          </View>

          {/* Días de la semana actual */}
          <View style={styles.weekContainer}>
            <View style={styles.weekHeaderRow}>
              <Text style={[styles.weekTitle, { color: colors.text }]}>Semana actual</Text>
              <Text style={[styles.consistencyText, { color: colors.success }]}>
                {consistencyPercentage !== null
                  ? `${consistencyPercentage}% consistencia`
                  : 'Sin datos suficientes'}
              </Text>
            </View>

            <View style={styles.daysRow}>
              {weekDays.map((item) => (
                <View
                  key={item.date}
                  style={[
                    styles.dayColumn,
                    {
                      backgroundColor: item.isToday
                        ? colors.primary
                        : colors.surfaceSecondary,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.dayLabel,
                      { color: item.isToday ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {item.label}
                  </Text>

                  <Text
                    style={[
                      styles.dateLabel,
                      { color: item.isToday ? '#fff' : colors.text },
                    ]}
                  >
                    {item.dayNumber}
                  </Text>

                  <Ionicons
                    name={item.completed ? 'checkmark-circle' : 'ellipse'}
                    size={12}
                    color={
                      item.isToday
                        ? '#fff'
                        : item.completed
                          ? colors.success
                          : colors.border
                    }
                    style={{ marginTop: 4 }}
                  />
                </View>
              ))}
            </View>

            {/* Barra de consistencia */}
            <View
              style={[
                styles.progressBarBg,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <View
                style={[
                  styles.progressBarFill,
                  {
                    width: `${consistencyPercentage ?? 0}%`,
                    backgroundColor: colors.success,
                  },
                ]}
              />
            </View>
          </View>

          {/* Botón para abrir modal de creación */}
          <TouchableOpacity
            style={[styles.createButton, { backgroundColor: colors.primary }]}
            onPress={handleOpenCreateModal}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Crear hábito</Text>
          </TouchableOpacity>
        </View>

        {/* -------------------------------------------------- */}
        {/* FILTROS DE CATEGORÍA                               */}
        {/* -------------------------------------------------- */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          {filterCategories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                style={[
                  styles.filterChip,
                  { backgroundColor: isActive ? colors.primary : colors.surface },
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text
                  style={[
                    styles.filterText,
                    { color: isActive ? '#fff' : colors.textSecondary },
                  ]}
                >
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* -------------------------------------------------- */}
        {/* SECCIÓN 1: RUTINA DE HOY (PROGRAMADOS PARA HOY)    */}
        {/* -------------------------------------------------- */}
        <View style={styles.sectionHeader}>
          <View>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Rutina de hoy</Text>
            <Text style={[styles.syncText, { color: colors.textSecondary }]}>
              {todayHabits.length > 0
                ? `${todayCompletedCount} de ${todayHabits.length} completados hoy`
                : 'Sincronización local activa'}
            </Text>
          </View>

          <View
            style={[
              styles.badgePill,
              { backgroundColor: colors.primaryLight },
            ]}
          >
            <Ionicons name="today-outline" size={13} color={colors.primary} />
            <Text style={[styles.badgePillText, { color: colors.primary, marginLeft: 4 }]}>
              Hoy ({todayHabits.length})
            </Text>
          </View>
        </View>

        {todayHabits.length === 0 ? (
          <View
            style={[
              styles.emptyStateCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="sunny-outline" size={32} color={colors.fitness} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {selectedCategory === 'Todos'
                ? 'Sin hábitos para hoy'
                : `Sin hábitos de "${selectedCategory}" para hoy`}
            </Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {habits.length === 0
                ? 'Comienza agregando tu primer hábito con el botón superior.'
                : 'No tienes hábitos programados para el día en curso en esta categoría.'}
            </Text>
          </View>
        ) : (
          todayHabits.map((item) => renderHabitCard(item, true))
        )}

        {/* -------------------------------------------------- */}
        {/* SECCIÓN 2: NO PROGRAMADOS PARA HOY                 */}
        {/* -------------------------------------------------- */}
        {otherHabits.length > 0 && (
          <View style={styles.otherSectionWrapper}>
            <View style={styles.sectionHeader}>
              <View>
                <Text style={[styles.sectionTitleSecondary, { color: colors.text }]}>
                  No programados para hoy
                </Text>
                <Text style={[styles.syncText, { color: colors.textSecondary }]}>
                  Otros días de la semana o meta semanal completada
                </Text>
              </View>

              <View
                style={[
                  styles.badgePill,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
              >
                <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
                <Text
                  style={[
                    styles.badgePillText,
                    { color: colors.textSecondary, marginLeft: 4 },
                  ]}
                >
                  {otherHabits.length}
                </Text>
              </View>
            </View>

            {otherHabits.map((item) => renderHabitCard(item, false))}
          </View>
        )}

        {/* -------------------------------------------------- */}
        {/* SECCIÓN 3: CONSISTENCIA MENSUAL Y ESTADÍSTICAS     */}
        {/* -------------------------------------------------- */}
        <View style={[styles.monthlyCard, { backgroundColor: colors.surface }]}>
          <View style={styles.monthlyHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={[styles.monthlyTitle, { color: colors.text }]}>
                Consistencia Mensual
              </Text>
            </View>
            <Text style={[styles.monthlySub, { color: colors.textSecondary }]}>
              Últimos 28 días
            </Text>
          </View>

          {/* Grilla heatmap */}
          <View style={styles.heatmapGrid}>
            {statistics.dailyActivity.map((item) => (
              <View
                key={item.date}
                style={[
                  styles.heatmapCell,
                  {
                    backgroundColor:
                      item.count === 0
                        ? colors.surfaceSecondary
                        : item.count === 1
                          ? colors.successLight
                          : colors.success,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.heatmapFooter}>
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
              Menos activo
            </Text>
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>
              Consistente
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Distribución por áreas */}
          <View style={styles.distributionRow}>
            <Text style={[styles.distTitle, { color: colors.text }]}>
              Distribución por áreas
            </Text>
            <Text style={[styles.distPillars, { color: colors.textSecondary }]}>
              Últimos 28 días
            </Text>
          </View>

          {categoriesList.map((cat) => {
            const item = statistics.categoryDistribution.find(
              (entry) => entry.category === cat
            );
            const percentage = item?.percentage || 0;
            const count = item?.count || 0;

            return (
              <View key={cat} style={styles.pillarItem}>
                <View style={styles.pillarLabelRow}>
                  <Text style={[styles.pillarName, { color: colors.text }]}>{cat}</Text>
                  <Text style={[styles.pillarPerc, { color: colors.textSecondary }]}>
                    {percentage}% ({count})
                  </Text>
                </View>

                <View
                  style={[
                    styles.pillarBarBg,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                >
                  <View
                    style={[
                      styles.pillarBarFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* -------------------------------------------------- */}
      {/* MODAL REUTILIZABLE: CREAR Y EDITAR HÁBITO          */}
      {/* -------------------------------------------------- */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={handleCloseModal}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            {/* Header del modal con título dinámico y botón de cierre */}
            <View style={styles.modalHeaderRow}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingHabit ? 'Editar Hábito' : 'Nuevo Hábito'}
              </Text>
              <TouchableOpacity
                onPress={handleCloseModal}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              style={styles.modalScroll}
            >
              {/* Nombre del hábito */}
              <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>
                Nombre del hábito:
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Ej. Meditar, Lectura, Ejercicio"
                placeholderTextColor={colors.textSecondary}
                value={title}
                onChangeText={setTitle}
              />

              {/* Descripción breve */}
              <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>
                Descripción breve (opcional):
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                    borderColor: colors.border,
                  },
                ]}
                placeholder="Ej. 20 páginas de desarrollo personal"
                placeholderTextColor={colors.textSecondary}
                value={description}
                onChangeText={setDescription}
              />

              {/* Selector de frecuencia */}
              <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>
                Frecuencia del hábito:
              </Text>
              <View style={styles.optionsRow}>
                {[
                  { label: 'Diario', value: 'daily' },
                  { label: 'Días específicos', value: 'specific_days' },
                  { label: 'Veces por semana', value: 'weekly' },
                ].map((option) => {
                  const selected = frequencyType === option.value;
                  return (
                    <TouchableOpacity
                      key={option.value}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: selected
                            ? colors.primary
                            : colors.surfaceSecondary,
                        },
                      ]}
                      onPress={() => setFrequencyType(option.value)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          { color: selected ? '#fff' : colors.text },
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Selector de días específicos */}
              {frequencyType === 'specific_days' && (
                <>
                  <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>
                    ¿Qué días debes cumplirlo?
                  </Text>
                  <View style={styles.optionsRow}>
                    {daysOptions.map((day) => {
                      const selected = selectedDays.includes(day.value);
                      return (
                        <TouchableOpacity
                          key={day.value}
                          style={[
                            styles.optionChip,
                            {
                              backgroundColor: selected
                                ? colors.primary
                                : colors.surfaceSecondary,
                            },
                          ]}
                          onPress={() => toggleSelectedDay(day.value)}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              { color: selected ? '#fff' : colors.text },
                            ]}
                          >
                            {day.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Selector de meta semanal */}
              {frequencyType === 'weekly' && (
                <>
                  <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>
                    ¿Cuántas veces por semana?
                  </Text>
                  <View style={styles.optionsRow}>
                    {[1, 2, 3, 4, 5, 6, 7].map((num) => {
                      const selected = weeklyTarget === num;
                      return (
                        <TouchableOpacity
                          key={num}
                          style={[
                            styles.optionChip,
                            {
                              backgroundColor: selected
                                ? colors.primary
                                : colors.surfaceSecondary,
                            },
                          ]}
                          onPress={() => setWeeklyTarget(num)}
                        >
                          <Text
                            style={[
                              styles.optionChipText,
                              { color: selected ? '#fff' : colors.text },
                            ]}
                          >
                            {num}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </>
              )}

              {/* Selector de categoría */}
              <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>
                Selecciona la Categoría:
              </Text>
              <View style={styles.optionsRow}>
                {categoriesList.map((cat) => {
                  const isSelected = category === cat;
                  return (
                    <TouchableOpacity
                      key={cat}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.surfaceSecondary,
                        },
                      ]}
                      onPress={() => setCategory(cat)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          { color: isSelected ? '#fff' : colors.text },
                        ]}
                      >
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Selector de tiempo objetivo */}
              <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>
                Meta de Tiempo (minutos):
              </Text>
              <View style={styles.optionsRow}>
                {timeOptions.map((min) => {
                  const isSelected = targetMinutes === min;
                  return (
                    <TouchableOpacity
                      key={min}
                      style={[
                        styles.optionChip,
                        {
                          backgroundColor: isSelected
                            ? colors.primary
                            : colors.surfaceSecondary,
                        },
                      ]}
                      onPress={() => setTargetMinutes(min)}
                    >
                      <Text
                        style={[
                          styles.optionChipText,
                          { color: isSelected ? '#fff' : colors.text },
                        ]}
                      >
                        {min} min
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Botones de acción del modal */}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[
                    styles.cancelBtn,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                  onPress={handleCloseModal}
                >
                  <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                    Cancelar
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                  onPress={handleSaveHabit}
                >
                  <Text style={styles.saveText}>
                    {editingHabit ? 'Guardar Cambios' : 'Guardar Hábito'}
                  </Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 48,
  },

  // Tarjeta de cabecera (racha y semana)
  streakCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  streakHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  streakTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
    flex: 1,
  },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  offlineText: {
    fontSize: 10,
    fontWeight: '600',
  },

  weekContainer: {
    marginVertical: 12,
    paddingVertical: 8,
  },
  weekHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  weekTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  consistencyText: {
    fontSize: 12,
    fontWeight: '600',
  },
  daysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  dayColumn: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 12,
    width: 40,
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  dateLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginVertical: 2,
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  createButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    marginLeft: 8,
  },

  // Filtros de categoría
  filtersContainer: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontWeight: '600',
    fontSize: 13,
  },

  // Cabecera de secciones
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sectionTitleSecondary: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  syncText: {
    fontSize: 12,
    marginTop: 2,
  },
  badgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgePillText: {
    fontSize: 11,
    fontWeight: 'bold',
  },

  // Tarjetas de hábito
  habitCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitInfo: {
    flex: 1,
  },
  habitMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  habitHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    flex: 1,
    marginRight: 8,
  },
  habitCategory: {
    fontSize: 11,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  habitFrequencyPill: {
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 4,
  },
  habitActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconButton: {
    padding: 4,
  },
  habitName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  habitDescription: {
    fontSize: 13,
    marginBottom: 6,
    lineHeight: 18,
  },
  habitDetails: {
    fontSize: 12,
    marginBottom: 6,
  },
  habitStreak: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  checkButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 14,
  },

  // Progreso de metas semanales
  weeklyProgressContainer: {
    borderRadius: 8,
    padding: 8,
    marginVertical: 4,
  },
  weeklyProgressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  weeklyProgressText: {
    fontSize: 12,
    fontWeight: '700',
  },
  goalMetBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    gap: 3,
  },
  goalMetText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  weeklyProgressBarBg: {
    height: 5,
    borderRadius: 3,
    overflow: 'hidden',
  },
  weeklyProgressBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Badge para hábitos no programados hoy
  scheduleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
    marginVertical: 4,
  },
  scheduleBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },

  // Wrapper para la sección de otros hábitos
  otherSectionWrapper: {
    marginTop: 12,
    marginBottom: 4,
  },

  // Estado vacío
  emptyStateCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 4,
  },
  emptyText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },

  // Consistencia Mensual (Heatmap y distribución)
  monthlyCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 12,
  },
  monthlyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthlyTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  monthlySub: {
    fontSize: 12,
  },
  heatmapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'space-between',
    marginVertical: 8,
  },
  heatmapCell: {
    width: 28,
    height: 22,
    borderRadius: 4,
  },
  heatmapFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
    marginBottom: 12,
  },
  footerLabel: {
    fontSize: 10,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  distributionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  distTitle: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  distPillars: {
    fontSize: 12,
  },
  pillarItem: {
    marginBottom: 10,
  },
  pillarLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  pillarName: {
    fontSize: 12,
    fontWeight: '500',
  },
  pillarPerc: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  pillarBarBg: {
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
  },
  pillarBarFill: {
    height: '100%',
    borderRadius: 3,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScroll: {
    flexGrow: 0,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    fontSize: 14,
  },
  labelSelector: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 6,
  },
  optionChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6,
  },
  cancelBtn: {
    flex: 1,
    padding: 13,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 10,
  },
  cancelText: {
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 1,
    padding: 13,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 10,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
