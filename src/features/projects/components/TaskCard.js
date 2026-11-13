// src/features/projects/components/TaskCard.js

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../styles/ThemeContext';
import { getLocalDate } from '../../../utils/dateUtils';
import {
  PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  TASK_STATUS,
} from '../constants/projectConstants';

function formatDate(date) {
  if (!date) return null;
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function TaskCard({
  task,
  onPress,
  onEdit,
  onDelete,
  onToggleComplete,
  onStatusChange,
}) {
  const { colors } = useTheme();

  if (!task) return null;

  const priority = task.priority || 'medium';
  const status = task.status || TASK_STATUS.PENDING;
  const isCompleted = status === TASK_STATUS.COMPLETED;

  const priorityColor = {
    low: colors.success,
    medium: colors.project,
    high: colors.fitness,
    urgent: colors.danger,
  }[priority] || colors.project;

  const statusColor = {
    [TASK_STATUS.PENDING]: colors.textSecondary,
    [TASK_STATUS.IN_PROGRESS]: colors.primary,
    [TASK_STATUS.REVIEW]: colors.fitness,
    [TASK_STATUS.COMPLETED]: colors.success,
  }[status] || colors.textSecondary;

  const totalSubtasks = Number(task.total_subtasks || 0);
  const completedSubtasks = Number(task.completed_subtasks || 0);

  const today = getLocalDate();
  const isOverdue =
    Boolean(task.due_date && task.due_date < today && !isCompleted);

  const handleToggle = (e) => {
    e?.stopPropagation?.();
    if (onToggleComplete) {
      onToggleComplete(task);
    } else if (onStatusChange) {
      onStatusChange(
        task.id,
        isCompleted ? TASK_STATUS.PENDING : TASK_STATUS.COMPLETED
      );
    }
  };

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.card,
        {
          backgroundColor: colors.surface,
          borderColor: isOverdue ? colors.danger : colors.border,
          borderWidth: isOverdue ? 1.5 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        {/* BOTÓN CHECKBOX RÁPIDO */}
        <Pressable
          onPress={handleToggle}
          hitSlop={8}
          style={[
            styles.checkButton,
            {
              borderColor: isCompleted ? colors.success : colors.border,
              backgroundColor: isCompleted ? colors.success : 'transparent',
            },
          ]}
        >
          {isCompleted && <Ionicons name="checkmark" size={13} color="#FFFFFF" />}
        </Pressable>

        {/* TÍTULO */}
        <View style={styles.titleContainer}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                textDecorationLine: isCompleted ? 'line-through' : 'none',
                opacity: isCompleted ? 0.6 : 1,
              },
            ]}
            numberOfLines={2}
          >
            {task.title}
          </Text>
        </View>

        {/* ACCIONES */}
        <View style={styles.actionsRow}>
          {onEdit && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onEdit(task);
              }}
              hitSlop={8}
              style={styles.iconButton}
            >
              <Ionicons
                name="create-outline"
                size={16}
                color={colors.textSecondary}
              />
            </Pressable>
          )}

          {onDelete && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                onDelete(task);
              }}
              hitSlop={8}
              style={styles.iconButton}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={colors.danger}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* DESCRIPCIÓN */}
      {!!task.description && (
        <Text
          style={[styles.description, { color: colors.textSecondary }]}
          numberOfLines={2}
        >
          {task.description}
        </Text>
      )}

      {/* METADATOS Y BADGES */}
      <View style={styles.footerRow}>
        <View style={styles.badgesGroup}>
          {/* BADGE DE ESTADO */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: `${statusColor}18` },
            ]}
          >
            <Text style={[styles.badgeText, { color: statusColor }]}>
              {TASK_STATUS_LABELS[status] || status}
            </Text>
          </View>

          {/* BADGE DE PRIORIDAD */}
          <View
            style={[
              styles.priorityBadge,
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
        </View>

        {/* FECHA O VENCIMIENTO */}
        {task.due_date && (
          <View style={styles.dateBadge}>
            <Ionicons
              name={isOverdue ? 'alert-circle' : 'calendar-outline'}
              size={12}
              color={isOverdue ? colors.danger : colors.textSecondary}
            />
            <Text
              style={[
                styles.dateText,
                { color: isOverdue ? colors.danger : colors.textSecondary },
              ]}
            >
              {isOverdue ? 'Vencida' : formatDate(task.due_date)}
            </Text>
          </View>
        )}
      </View>

      {/* SUBTAREAS INDICADOR */}
      {totalSubtasks > 0 && (
        <View
          style={[
            styles.subtasksRow,
            { backgroundColor: colors.surfaceSecondary },
          ]}
        >
          <Ionicons
            name="checkbox-outline"
            size={13}
            color={colors.textSecondary}
          />
          <Text style={[styles.subtaskText, { color: colors.textSecondary }]}>
            {completedSubtasks} de {totalSubtasks} subtareas completadas
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: 13,
    borderRadius: 16,
    gap: 9,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkButton: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 19,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    padding: 3,
  },
  description: {
    fontSize: 12,
    lineHeight: 17,
    paddingLeft: 32,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 32,
    flexWrap: 'wrap',
    gap: 6,
  },
  badgesGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subtasksRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 32,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 8,
  },
  subtaskText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
