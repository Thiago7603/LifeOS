// src/features/projects/components/SubtasksManagerModal.js

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../styles/ThemeContext';
import {
  PRIORITY_LABELS,
  TASK_STATUS_LABELS,
} from '../constants/projectConstants';

export default function SubtasksManagerModal({
  visible,
  task,
  subtasks = [],
  onClose,
  onToggleSubtask,
  onAddSubtask,
  onEditSubtask,
  onDeleteSubtask,
  onEditTask,
}) {
  const { colors } = useTheme();
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [editingSubtaskId, setEditingSubtaskId] = useState(null);
  const [editingSubtaskText, setEditingSubtaskText] = useState('');

  if (!task) return null;

  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((s) => s.completed === 1).length;
  const progress =
    totalSubtasks > 0
      ? Math.round((completedSubtasks / totalSubtasks) * 100)
      : 0;

  const priorityColor = {
    low: colors.success,
    medium: colors.project,
    high: colors.fitness,
    urgent: colors.danger,
  }[task.priority] || colors.project;

  const handleAdd = () => {
    const text = newSubtaskTitle.trim();
    if (!text) {
      Alert.alert('Campo requerido', 'Escribe el nombre de la subtarea.');
      return;
    }

    onAddSubtask({
      task_id: task.id,
      title: text,
    });

    setNewSubtaskTitle('');
  };

  const handleStartEdit = (subtask) => {
    setEditingSubtaskId(subtask.id);
    setEditingSubtaskText(subtask.title);
  };

  const handleSaveEdit = (subtaskId) => {
    const text = editingSubtaskText.trim();
    if (!text) {
      Alert.alert('Campo requerido', 'El nombre no puede estar vacío.');
      return;
    }

    onEditSubtask(subtaskId, { title: text });
    setEditingSubtaskId(null);
    setEditingSubtaskText('');
  };

  const handleCancelEdit = () => {
    setEditingSubtaskId(null);
    setEditingSubtaskText('');
  };

  const handleDelete = (subtask) => {
    Alert.alert(
      'Eliminar Subtarea',
      `¿Deseas eliminar "${subtask.title}"?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => onDeleteSubtask(subtask.id),
        },
      ]
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {/* HEADER */}
          <View style={styles.header}>
            <View style={styles.headerTitleArea}>
              <View style={styles.badgesRow}>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: `${priorityColor}18` },
                  ]}
                >
                  <View
                    style={[
                      styles.priorityDot,
                      { backgroundColor: priorityColor },
                    ]}
                  />
                  <Text style={[styles.badgeText, { color: priorityColor }]}>
                    {PRIORITY_LABELS[task.priority] || task.priority}
                  </Text>
                </View>

                <View
                  style={[
                    styles.badge,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                >
                  <Text
                    style={[styles.badgeText, { color: colors.textSecondary }]}
                  >
                    {TASK_STATUS_LABELS[task.status] || task.status}
                  </Text>
                </View>
              </View>

              <Text style={[styles.taskTitle, { color: colors.text }]}>
                {task.title}
              </Text>
            </View>

            <View style={styles.headerActions}>
              {onEditTask && (
                <Pressable
                  style={[
                    styles.iconButton,
                    { backgroundColor: colors.surfaceSecondary },
                  ]}
                  onPress={() => {
                    onClose();
                    onEditTask(task);
                  }}
                  hitSlop={8}
                >
                  <Ionicons
                    name="create-outline"
                    size={18}
                    color={colors.textSecondary}
                  />
                </Pressable>
              )}

              <Pressable
                style={[
                  styles.iconButton,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
                onPress={onClose}
                hitSlop={8}
              >
                <Ionicons name="close" size={20} color={colors.textSecondary} />
              </Pressable>
            </View>
          </View>

          {/* DESCRIPCIÓN SI EXISTE */}
          {!!task.description && (
            <Text
              style={[
                styles.taskDescription,
                { color: colors.textSecondary },
              ]}
            >
              {task.description}
            </Text>
          )}

          {/* BARRA DE PROGRESO DE SUBTAREAS */}
          <View
            style={[
              styles.progressBox,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
            ]}
          >
            <View style={styles.progressTextRow}>
              <Text
                style={[styles.progressCountText, { color: colors.text }]}
              >
                {completedSubtasks} de {totalSubtasks} subtareas completadas
              </Text>
              <Text
                style={[styles.progressPercentText, { color: colors.project }]}
              >
                {progress}%
              </Text>
            </View>

            <View
              style={[
                styles.progressTrack,
                { backgroundColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${progress}%`,
                    backgroundColor:
                      progress === 100 ? colors.success : colors.project,
                  },
                ]}
              />
            </View>
          </View>

          {/* LISTA DE SUBTAREAS */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.subtasksList}
          >
            {totalSubtasks === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons
                  name="checkbox-outline"
                  size={32}
                  color={colors.textSecondary}
                />
                <Text
                  style={[styles.emptyStateTitle, { color: colors.text }]}
                >
                  No hay subtareas en esta tarea
                </Text>
                <Text
                  style={[
                    styles.emptyStateText,
                    { color: colors.textSecondary },
                  ]}
                >
                  Divide esta actividad en pasos más pequeños para facilitar su seguimiento.
                </Text>
              </View>
            ) : (
              subtasks.map((subtask) => {
                const isItemCompleted = subtask.completed === 1;
                const isEditing = editingSubtaskId === subtask.id;

                return (
                  <View
                    key={subtask.id}
                    style={[
                      styles.subtaskItem,
                      {
                        backgroundColor: colors.surface,
                        borderColor: colors.border,
                      },
                    ]}
                  >
                    {/* CHECKBOX */}
                    <Pressable
                      style={[
                        styles.checkbox,
                        {
                          borderColor: isItemCompleted
                            ? colors.success
                            : colors.border,
                          backgroundColor: isItemCompleted
                            ? colors.success
                            : 'transparent',
                        },
                      ]}
                      onPress={() => onToggleSubtask(subtask.id)}
                      hitSlop={8}
                    >
                      {isItemCompleted && (
                        <Ionicons
                          name="checkmark"
                          size={14}
                          color="#FFFFFF"
                        />
                      )}
                    </Pressable>

                    {/* TÍTULO O INPUT DE EDICIÓN */}
                    {isEditing ? (
                      <View style={styles.editRow}>
                        <TextInput
                          style={[
                            styles.editInput,
                            {
                              color: colors.text,
                              borderColor: colors.project,
                              backgroundColor: colors.background,
                            },
                          ]}
                          value={editingSubtaskText}
                          onChangeText={setEditingSubtaskText}
                          autoFocus
                          maxLength={120}
                        />
                        <Pressable
                          onPress={() => handleSaveEdit(subtask.id)}
                          style={[
                            styles.saveEditBtn,
                            { backgroundColor: colors.project },
                          ]}
                        >
                          <Ionicons
                            name="checkmark"
                            size={16}
                            color="#FFFFFF"
                          />
                        </Pressable>
                        <Pressable
                          onPress={handleCancelEdit}
                          style={[
                            styles.cancelEditBtn,
                            { backgroundColor: colors.surfaceSecondary },
                          ]}
                        >
                          <Ionicons
                            name="close"
                            size={16}
                            color={colors.textSecondary}
                          />
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        style={styles.textContainer}
                        onPress={() => onToggleSubtask(subtask.id)}
                      >
                        <Text
                          style={[
                            styles.subtaskText,
                            {
                              color: colors.text,
                              textDecorationLine: isItemCompleted
                                ? 'line-through'
                                : 'none',
                              opacity: isItemCompleted ? 0.6 : 1,
                            },
                          ]}
                        >
                          {subtask.title}
                        </Text>
                      </Pressable>
                    )}

                    {/* ACCIONES DE LA SUBTAREA */}
                    {!isEditing && (
                      <View style={styles.itemActions}>
                        <Pressable
                          onPress={() => handleStartEdit(subtask)}
                          hitSlop={6}
                          style={styles.itemActionBtn}
                        >
                          <Ionicons
                            name="create-outline"
                            size={16}
                            color={colors.textSecondary}
                          />
                        </Pressable>

                        <Pressable
                          onPress={() => handleDelete(subtask)}
                          hitSlop={6}
                          style={styles.itemActionBtn}
                        >
                          <Ionicons
                            name="trash-outline"
                            size={16}
                            color={colors.danger}
                          />
                        </Pressable>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* INPUT PARA AGREGAR NUEVA SUBTAREA */}
          <View
            style={[
              styles.addBar,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
              },
            ]}
          >
            <TextInput
              style={[styles.addInput, { color: colors.text }]}
              placeholder="Nueva subtarea o paso..."
              placeholderTextColor={colors.textSecondary}
              value={newSubtaskTitle}
              onChangeText={setNewSubtaskTitle}
              onSubmitEditing={handleAdd}
              returnKeyType="done"
              maxLength={120}
            />

            <Pressable
              style={[
                styles.addBtn,
                {
                  backgroundColor: newSubtaskTitle.trim()
                    ? colors.project
                    : colors.surfaceSecondary,
                },
              ]}
              onPress={handleAdd}
              disabled={!newSubtaskTitle.trim()}
            >
              <Ionicons
                name="add"
                size={20}
                color={newSubtaskTitle.trim() ? '#FFFFFF' : colors.textSecondary}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 24,
    padding: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  headerTitleArea: {
    flex: 1,
    gap: 6,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badge: {
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
  taskTitle: {
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 24,
  },
  taskDescription: {
    fontSize: 12,
    lineHeight: 18,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  iconButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressBox: {
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 7,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  progressPercentText: {
    fontSize: 12,
    fontWeight: '800',
  },
  progressTrack: {
    height: 6,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  subtasksList: {
    gap: 8,
    paddingVertical: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 28,
    gap: 6,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: 16,
  },
  subtaskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 11,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    flex: 1,
  },
  subtaskText: {
    fontSize: 13,
    fontWeight: '600',
  },
  editRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  editInput: {
    flex: 1,
    fontSize: 13,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  saveEditBtn: {
    padding: 7,
    borderRadius: 8,
  },
  cancelEditBtn: {
    padding: 7,
    borderRadius: 8,
  },
  itemActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemActionBtn: {
    padding: 4,
  },
  addBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 8,
  },
  addInput: {
    flex: 1,
    fontSize: 13,
    paddingVertical: 8,
  },
  addBtn: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

