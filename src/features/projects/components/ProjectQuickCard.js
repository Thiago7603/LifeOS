// src/features/projects/components/ProjectQuickCard.js

import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../styles/ThemeContext';
import { PRIORITY_LABELS } from '../constants/projectConstants';

function formatDate(date) {
  if (!date) return 'Sin fecha';
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  return `${parts[2]}/${parts[1]}`;
}

export default function ProjectQuickCard({ project, onPress }) {
  const { colors } = useTheme();

  if (!project) return null;

  const priority = project.priority || 'medium';
  const progress = Math.max(0, Math.min(Number(project.progress || 0), 100));

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
          borderColor: project.is_overdue ? colors.danger : colors.border,
          borderWidth: project.is_overdue ? 1.5 : 1,
        },
      ]}
    >
      <View style={styles.header}>
        <View style={styles.titleArea}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {project.title}
          </Text>
        </View>

        <View
          style={[
            styles.priorityPill,
            { backgroundColor: `${priorityColor}18` },
          ]}
        >
          <Text style={[styles.priorityText, { color: priorityColor }]}>
            {PRIORITY_LABELS[priority] || priority}
          </Text>
        </View>
      </View>

      <View style={styles.metaRow}>
        <View style={styles.dateBadge}>
          <Ionicons
            name={project.is_overdue ? 'alert-circle' : 'calendar-outline'}
            size={12}
            color={project.is_overdue ? colors.danger : colors.textSecondary}
          />
          <Text
            style={[
              styles.dateText,
              { color: project.is_overdue ? colors.danger : colors.textSecondary },
            ]}
          >
            {project.is_overdue ? 'Vencido' : formatDate(project.due_date)}
          </Text>
        </View>

        <Text style={[styles.tasksCount, { color: colors.textSecondary }]}>
          {Number(project.completed_tasks || 0)}/{Number(project.total_tasks || 0)}
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
              backgroundColor: project.is_overdue ? colors.danger : colors.project,
            },
          ]}
        />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 200,
    padding: 13,
    borderRadius: 16,
    gap: 9,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
  },
  titleArea: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '700',
  },
  priorityPill: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 9,
    fontWeight: '700',
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  tasksCount: {
    fontSize: 11,
    fontWeight: '600',
  },
  progressTrack: {
    height: 5,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});

