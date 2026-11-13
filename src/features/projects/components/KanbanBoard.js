// src/features/projects/components/KanbanBoard.js

import React from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../styles/ThemeContext';
import TaskCard from './TaskCard';
import {
  KANBAN_COLUMNS,
  KANBAN_NEXT_STATUS,
  KANBAN_PREV_STATUS,
  TASK_STATUS_LABELS,
} from '../constants/projectConstants';

export default function KanbanBoard({
  tasks = [],
  onTaskPress,
  onTaskEdit,
  onTaskDelete,
  onStatusChange,
  onToggleComplete,
}) {
  const { colors } = useTheme();

  const getColumnTasks = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  const handleAdvance = (task) => {
    const nextStatus = KANBAN_NEXT_STATUS[task.status];
    if (nextStatus && onStatusChange) {
      onStatusChange(task.id, nextStatus);
    }
  };

  const handleRegress = (task) => {
    const prevStatus = KANBAN_PREV_STATUS[task.status];
    if (prevStatus && onStatusChange) {
      onStatusChange(task.id, prevStatus);
    }
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.board}
    >
      {KANBAN_COLUMNS.map((column) => {
        const columnTasks = getColumnTasks(column.id);

        return (
          <View
            key={column.id}
            style={[
              styles.column,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            {/* CABECERA DE COLUMNA */}
            <View style={styles.columnHeader}>
              <View style={styles.columnTitleRow}>
                <Ionicons name={column.icon} size={16} color={colors.project} />
                <Text style={[styles.columnTitle, { color: colors.text }]}>
                  {column.title}
                </Text>
              </View>

              <View
                style={[
                  styles.countBadge,
                  { backgroundColor: colors.projectLight },
                ]}
              >
                <Text style={[styles.countText, { color: colors.project }]}>
                  {columnTasks.length}
                </Text>
              </View>
            </View>

            {/* LISTA DE TAREAS EN LA COLUMNA */}
            <ScrollView
              nestedScrollEnabled
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.taskList}
            >
              {columnTasks.length === 0 ? (
                <View
                  style={[
                    styles.emptyColumn,
                    { borderColor: colors.border },
                  ]}
                >
                  <Ionicons
                    name="file-tray-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                  <Text
                    style={[styles.emptyText, { color: colors.textSecondary }]}
                  >
                    Sin tareas {column.title.toLowerCase()}
                  </Text>
                </View>
              ) : (
                columnTasks.map((task) => {
                  const hasPrev = Boolean(KANBAN_PREV_STATUS[task.status]);
                  const hasNext = Boolean(KANBAN_NEXT_STATUS[task.status]);

                  return (
                    <View key={task.id} style={styles.taskWrapper}>
                      <TaskCard
                        task={task}
                        onPress={() => onTaskPress?.(task)}
                        onEdit={onTaskEdit}
                        onDelete={onTaskDelete}
                        onToggleComplete={onToggleComplete}
                        onStatusChange={onStatusChange}
                      />

                      {/* CONTROLES BIDIRECCIONALES KANBAN */}
                      {(hasPrev || hasNext) && (
                        <View style={styles.kanbanControlsRow}>
                          {hasPrev ? (
                            <Pressable
                              onPress={() => handleRegress(task)}
                              style={[
                                styles.moveButton,
                                {
                                  backgroundColor: colors.surface,
                                  borderColor: colors.border,
                                },
                              ]}
                              hitSlop={6}
                            >
                              <Ionicons
                                name="arrow-back"
                                size={12}
                                color={colors.textSecondary}
                              />
                              <Text
                                style={[
                                  styles.moveButtonText,
                                  { color: colors.textSecondary },
                                ]}
                              >
                                {TASK_STATUS_LABELS[KANBAN_PREV_STATUS[task.status]]}
                              </Text>
                            </Pressable>
                          ) : (
                            <View style={{ flex: 1 }} />
                          )}

                          {hasNext ? (
                            <Pressable
                              onPress={() => handleAdvance(task)}
                              style={[
                                styles.moveButton,
                                styles.advanceButton,
                                {
                                  backgroundColor: colors.projectLight,
                                  borderColor: colors.project,
                                },
                              ]}
                              hitSlop={6}
                            >
                              <Text
                                style={[
                                  styles.moveButtonText,
                                  { color: colors.project, fontWeight: '700' },
                                ]}
                              >
                                {TASK_STATUS_LABELS[KANBAN_NEXT_STATUS[task.status]]}
                              </Text>
                              <Ionicons
                                name="arrow-forward"
                                size={12}
                                color={colors.project}
                              />
                            </Pressable>
                          ) : (
                            <View style={{ flex: 1 }} />
                          )}
                        </View>
                      )}
                    </View>
                  );
                })
              )}
            </ScrollView>
          </View>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  board: {
    gap: 12,
    paddingBottom: 16,
    paddingRight: 8,
  },
  column: {
    width: 290,
    maxHeight: 620,
    borderRadius: 18,
    borderWidth: 1,
    padding: 12,
  },
  columnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  columnTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  columnTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  countBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  countText: {
    fontSize: 11,
    fontWeight: '800',
  },
  taskList: {
    gap: 12,
    paddingBottom: 8,
  },
  taskWrapper: {
    gap: 6,
  },
  kanbanControlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 2,
  },
  moveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 5,
    paddingHorizontal: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  advanceButton: {
    borderWidth: 1,
  },
  moveButtonText: {
    fontSize: 10,
    fontWeight: '600',
  },
  emptyColumn: {
    minHeight: 120,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyText: {
    fontSize: 11,
  },
});
