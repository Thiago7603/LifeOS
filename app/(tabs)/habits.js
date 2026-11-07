import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/styles/ThemeContext';
import { useHabits } from '../../src/features/habits/hooks/useHabits';
import { useHabitForm } from '../../src/features/habits/hooks/useHabitForm';
import HabitCard from '../../src/features/habits/components/HabitCard';
import WeekStrip from '../../src/features/habits/components/WeekStrip';
import HabitStatsPanel from '../../src/features/habits/components/HabitStatsPanel';
import HabitFormModal from '../../src/features/habits/components/HabitFormModal';
import { FILTER_CATEGORIES } from '../../src/features/habits/constants/habitConstants';

export default function HabitsScreen() {
  const { colors } = useTheme();
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  const {
    habits,
    statistics,
    loadHabits,
    handleToggle,
    handleDeleteWithConfirmation,
  } = useHabits();

  const {
    modalVisible,
    editingHabit,
    formState,
    handleOpenCreateModal,
    handleOpenEditModal,
    handleCloseModal,
    toggleSelectedDay,
    handleSaveHabit,
  } = useHabitForm({ onSaved: loadHabits });

  // Filtrado inteligente: Rutina de hoy vs otros días
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header de Racha y Semana Actual */}
        <WeekStrip
          maxStreak={maxStreak}
          consistencyPercentage={consistencyPercentage}
          weekDays={weekDays}
          onCreateHabit={handleOpenCreateModal}
          colors={colors}
        />

        {/* Filtros de Categoría */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filtersContainer}
        >
          {FILTER_CATEGORIES.map((cat) => {
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

        {/* Sección 1: Rutina de hoy */}
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
          todayHabits.map((item) => (
            <HabitCard
              key={item.id}
              item={item}
              isTodayRoutine={true}
              colors={colors}
              onEdit={handleOpenEditModal}
              onDelete={handleDeleteWithConfirmation}
              onToggle={handleToggle}
            />
          ))
        )}

        {/* Sección 2: No programados para hoy */}
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

            {otherHabits.map((item) => (
              <HabitCard
                key={item.id}
                item={item}
                isTodayRoutine={false}
                colors={colors}
                onEdit={handleOpenEditModal}
                onDelete={handleDeleteWithConfirmation}
                onToggle={handleToggle}
              />
            ))}
          </View>
        )}

        {/* Sección 3: Consistencia mensual y estadísticas */}
        <HabitStatsPanel statistics={statistics} colors={colors} />
      </ScrollView>

      {/* Modal Crear / Editar Hábito */}
      <HabitFormModal
        visible={modalVisible}
        editingHabit={editingHabit}
        formState={formState}
        onClose={handleCloseModal}
        onSave={handleSaveHabit}
        onToggleDay={toggleSelectedDay}
        colors={colors}
      />
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
  otherSectionWrapper: {
    marginTop: 12,
    marginBottom: 4,
  },
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
});
