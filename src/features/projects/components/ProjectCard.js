
// src/features/projects/components/ProjectCard.js

import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../styles/ThemeContext';

const PRIORITY_LABELS = {
  low: 'Baja',
  medium: 'Media',
  high: 'Alta',
  urgent: 'Urgente',
};

const STATUS_LABELS = {
  active: 'Activo',
  paused: 'Pausado',
  completed: 'Completado',
  archived: 'Archivado',
};

function formatDate(date) {
  if (!date) return 'Sin fecha límite';

  const parts = date.split('-');

  if (parts.length !== 3) return date;

  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function ProjectCard({
  project,
  onPress,
  onEdit,
  onDelete,
}) {
  const { colors } = useTheme();

  if (!project) return null;

  const progress = Math.max(
    0,
    Math.min(Number(project.progress || 0), 100)
  );

  const priority = project.priority || 'medium';
  const status = project.status || 'active';
  const totalTasks = Number(project.total_tasks || 0);
  const completedTasks = Number(project.completed_tasks || 0);

  const isOverdue = !!project.is_overdue;
  const isUpcoming = !!project.is_upcoming && !isOverdue;
  const isCompleted = status === 'completed';
  const hasNoTasks = totalTasks === 0;

  const priorityColor = {
    low: colors.success,
    medium: colors.project,
    high: colors.fitness,
    urgent: colors.danger,
  }[priority] || colors.project;

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.titleContainer}>
          <View
            style={[
              styles.projectIcon,
              { backgroundColor: colors.projectLight },
            ]}
          >
            <Ionicons
              name="folder-outline"
              size={21}
              color={colors.project}
            />
          </View>

          <View style={styles.titleContent}>
            <Text
              style={[styles.title, { color: colors.text }]}
              numberOfLines={1}
            >
              {project.title}
            </Text>

            <Text
              style={[styles.status, { color: colors.textSecondary }]}
            >
              {STATUS_LABELS[status] || status}
            </Text>
          </View>
        </View>

        <View style={styles.actions}>
          {onEdit && (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onEdit(project);
              }}
              hitSlop={8}
              style={styles.actionButton}
            >
              <Ionicons
                name="create-outline"
                size={19}
                color={colors.textSecondary}
              />
            </Pressable>
          )}

          {onDelete && (
            <Pressable
              onPress={(event) => {
                event.stopPropagation();
                onDelete(project);
              }}
              hitSlop={8}
              style={styles.actionButton}
            >
              <Ionicons
                name="trash-outline"
                size={18}
                color={colors.danger}
              />
            </Pressable>
          )}
        </View>
      </View>

      {!!project.description && (
        <Text
          style={[styles.description, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {project.description}
        </Text>
      )}

      <View style={styles.badges}>
        <View
          style={[
            styles.badge,
            { backgroundColor: `${priorityColor}18` },
          ]}
        >
          <View
            style={[styles.priorityDot, { backgroundColor: priorityColor }]}
          />
          <Text style={[styles.badgeText, { color: priorityColor }]}>
            {PRIORITY_LABELS[priority] || priority}
          </Text>
        </View>

        <View
          style={[
            styles.badge,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <Ionicons
            name="calendar-outline"
            size={12}
            color={colors.textSecondary}
          />
          <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
            {formatDate(project.due_date)}
          </Text>
        </View>

        {isOverdue && (
          <View
            style={[
              styles.badge,
              { backgroundColor: `${colors.danger}18` },
            ]}
          >
            <Ionicons name="alert-circle" size={12} color={colors.danger} />
            <Text style={[styles.badgeText, { color: colors.danger }]}>
              Vencido
            </Text>
          </View>
        )}

        {isUpcoming && (
          <View
            style={[
              styles.badge,
              { backgroundColor: `${colors.fitness}18` },
            ]}
          >
            <Ionicons name="time" size={12} color={colors.fitness} />
            <Text style={[styles.badgeText, { color: colors.fitness }]}>
              Próximo
            </Text>
          </View>
        )}

        {isCompleted && (
          <View
            style={[
              styles.badge,
              { backgroundColor: `${colors.success}18` },
            ]}
          >
            <Ionicons name="checkmark-circle" size={12} color={colors.success} />
            <Text style={[styles.badgeText, { color: colors.success }]}>
              Completado
            </Text>
          </View>
        )}

        {hasNoTasks && (
          <View
            style={[
              styles.badge,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={12}
              color={colors.textSecondary}
            />
            <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
              Sin tareas
            </Text>
          </View>
        )}
      </View>

      <View style={styles.progressHeader}>
        <Text style={[styles.progressLabel, { color: colors.textSecondary }]}>
          Progreso
        </Text>

        <Text style={[styles.progressValue, { color: colors.project }]}>
          {progress}%
        </Text>
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

      <View style={styles.footer}>
        <View style={styles.taskCount}>
          <Ionicons
            name="checkbox-outline"
            size={15}
            color={colors.textSecondary}
          />
          <Text style={[styles.footerText, { color: colors.textSecondary }]}>
            {Number(project.completed_tasks || 0)} de{' '}
            {Number(project.total_tasks || 0)} tareas
          </Text>
        </View>

        <Ionicons
          name="chevron-forward"
          size={17}
          color={colors.textSecondary}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    gap: 13,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  projectIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
  },
  status: {
    fontSize: 11,
    marginTop: 3,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionButton: {
    padding: 3,
  },
  description: {
    fontSize: 12,
    lineHeight: 18,
  },
  badges: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 6,
    borderRadius: 8,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 11,
  },
  progressValue: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressTrack: {
    height: 7,
    borderRadius: 8,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 8,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  taskCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  footerText: {
    fontSize: 11,
  },
});