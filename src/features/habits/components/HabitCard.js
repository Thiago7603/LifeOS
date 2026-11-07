import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function HabitCard({
  item,
  isTodayRoutine,
  colors,
  onEdit,
  onDelete,
  onToggle,
}) {
  const isWeekly = item.frequency_type === 'weekly';
  const isSpecificDays = item.frequency_type === 'specific_days';
  const weeklyPercent = isWeekly
    ? Math.min(
        100,
        Math.round(((item.weeklyCompletionsCount || 0) / (item.weeklyTarget || 1)) * 100)
      )
    : 0;

  return (
    <View
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
              onPress={() => onEdit(item)}
              style={styles.actionIconButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Editar hábito"
            >
              <Ionicons name="create-outline" size={18} color={colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => onDelete(item)}
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

        {/* Progreso de metas semanales */}
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
        onPress={() => onToggle(item.id, item.completed)}
        accessibilityLabel={`Marcar hábito ${item.title} como ${
          item.completed === 1 ? 'pendiente' : 'completado'
        }`}
      >
        {item.completed === 1 && <Ionicons name="checkmark" size={18} color="#fff" />}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
});

