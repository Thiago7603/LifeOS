import React from 'react';
import { StyleSheet, Text, View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function WeekStrip({
  maxStreak,
  consistencyPercentage,
  weekDays = [],
  onCreateHabit,
  colors,
}) {
  return (
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
        onPress={onCreateHabit}
      >
        <Ionicons name="add-circle-outline" size={20} color="#fff" />
        <Text style={styles.createButtonText}>Crear hábito</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
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
});

