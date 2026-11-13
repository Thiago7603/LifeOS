// src/features/projects/components/ProjectStats.js

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../styles/ThemeContext';

function MiniMetric({ icon, label, value, color, background, colors }) {
  return (
    <View
      style={[
        styles.miniCard,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={[styles.miniIcon, { backgroundColor: background }]}>
        <Ionicons name={icon} size={15} color={color} />
      </View>
      <Text style={[styles.miniValue, { color: colors.text }]}>{value}</Text>
      <Text style={[styles.miniLabel, { color: colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

export default function ProjectStats({ statistics = {} }) {
  const { colors } = useTheme();

  const totalProjects = Number(statistics.total_projects || 0);
  const activeProjects = Number(statistics.active_projects || 0);
  const pausedProjects = Number(statistics.paused_projects || 0);
  const completedProjects = Number(statistics.completed_projects || 0);

  const totalTasks = Number(statistics.total_tasks || 0);
  const completedTasks = Number(statistics.completed_tasks || 0);
  const pendingTasks = Number(statistics.pending_tasks || 0);
  const inProgressTasks = Number(statistics.in_progress_tasks || 0);
  const overdueTasks = Number(statistics.overdue_tasks || 0);

  const progress = Math.max(
    0,
    Math.min(Number(statistics.overall_progress || 0), 100)
  );

  return (
    <View style={styles.container}>
      {/* TARJETA PRINCIPAL DE PROGRESO GLOBAL */}
      <View
        style={[
          styles.progressCard,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
      >
        <View style={styles.progressHeader}>
          <View style={styles.progressInfo}>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.totalProjectsBadge,
                  { backgroundColor: colors.projectLight },
                ]}
              >
                <Ionicons name="folder-outline" size={13} color={colors.project} />
                <Text style={[styles.totalProjectsText, { color: colors.project }]}>
                  {totalProjects} {totalProjects === 1 ? 'Proyecto' : 'Proyectos'}
                </Text>
              </View>

              {overdueTasks > 0 && (
                <View
                  style={[
                    styles.overdueBadge,
                    { backgroundColor: colors.dangerLight },
                  ]}
                >
                  <Ionicons name="alert-circle" size={13} color={colors.danger} />
                  <Text style={[styles.overdueText, { color: colors.danger }]}>
                    {overdueTasks} {overdueTasks === 1 ? 'vencida' : 'vencidas'}
                  </Text>
                </View>
              )}
            </View>

            <Text style={[styles.progressTitle, { color: colors.text }]}>
              Progreso General
            </Text>
            <Text style={[styles.progressSubtitle, { color: colors.textSecondary }]}>
              {completedTasks} de {totalTasks} tareas completadas
            </Text>
          </View>

          <View style={styles.percentageContainer}>
            <Text style={[styles.progressPercentage, { color: colors.project }]}>
              {progress}%
            </Text>
            <Text style={[styles.percentageLabel, { color: colors.textSecondary }]}>
              Completado
            </Text>
          </View>
        </View>

        <View
          style={[
            styles.progressTrack,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <View
            style={[
              styles.progressFill,
              {
                width: `${progress}%`,
                backgroundColor: colors.project,
              },
            ]}
          />
        </View>
      </View>

      {/* MÉTRICAS DE PROYECTOS */}
      <View style={styles.sectionBlock}>
        <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>
          ESTADO DE PROYECTOS
        </Text>
        <View style={styles.metricsGrid}>
          <MiniMetric
            icon="play-circle-outline"
            label="Activos"
            value={activeProjects}
            color={colors.project}
            background={colors.projectLight}
            colors={colors}
          />
          <MiniMetric
            icon="pause-circle-outline"
            label="Pausados"
            value={pausedProjects}
            color={colors.fitness}
            background={colors.fitnessLight}
            colors={colors}
          />
          <MiniMetric
            icon="checkmark-done-circle-outline"
            label="Completados"
            value={completedProjects}
            color={colors.success}
            background={colors.successLight}
            colors={colors}
          />
        </View>
      </View>

      {/* MÉTRICAS DE TAREAS */}
      <View style={styles.sectionBlock}>
        <Text style={[styles.subSectionTitle, { color: colors.textSecondary }]}>
          RESUMEN DE TAREAS
        </Text>
        <View style={styles.metricsGrid}>
          <MiniMetric
            icon="time-outline"
            label="Pendientes"
            value={pendingTasks}
            color={colors.textSecondary}
            background={colors.surfaceSecondary}
            colors={colors}
          />
          <MiniMetric
            icon="flash-outline"
            label="En progreso"
            value={inProgressTasks}
            color={colors.primary}
            background={colors.primaryLight}
            colors={colors}
          />
          <MiniMetric
            icon="checkmark-circle-outline"
            label="Completadas"
            value={completedTasks}
            color={colors.success}
            background={colors.successLight}
            colors={colors}
          />
          <MiniMetric
            icon="alert-circle-outline"
            label="Vencidas"
            value={overdueTasks}
            color={colors.danger}
            background={colors.dangerLight}
            colors={colors}
          />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 16,
  },
  progressCard: {
    padding: 18,
    borderRadius: 20,
    borderWidth: 1,
    gap: 14,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  progressInfo: {
    flex: 1,
    marginRight: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  totalProjectsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  totalProjectsText: {
    fontSize: 11,
    fontWeight: '700',
  },
  overdueBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  overdueText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  progressSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  percentageContainer: {
    alignItems: 'flex-end',
  },
  progressPercentage: {
    fontSize: 28,
    fontWeight: '900',
    lineHeight: 32,
  },
  percentageLabel: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  progressTrack: {
    height: 8,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  sectionBlock: {
    gap: 8,
  },
  subSectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  miniCard: {
    flex: 1,
    minWidth: '22%',
    padding: 10,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 4,
  },
  miniIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniValue: {
    fontSize: 16,
    fontWeight: '800',
  },
  miniLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
});
