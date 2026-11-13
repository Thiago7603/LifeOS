// src/features/projects/components/TaskFormModal.js

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../styles/ThemeContext';
import {
  PRIORITY,
  TASK_STATUS,
  PRIORITY_OPTIONS,
  TASK_STATUS_OPTIONS,
} from '../constants/projectConstants';

const INITIAL_TASK_FORM = {
  title: '',
  description: '',
  priority: PRIORITY.MEDIUM,
  status: TASK_STATUS.PENDING,
  due_date: '',
};

export default function TaskFormModal({
  visible,
  editingTask,
  onClose,
  onSave,
  saving = false,
}) {
  const { colors } = useTheme();
  const [form, setForm] = useState(INITIAL_TASK_FORM);

  useEffect(() => {
    if (editingTask) {
      setForm({
        title: editingTask.title || '',
        description: editingTask.description || '',
        priority: editingTask.priority || PRIORITY.MEDIUM,
        status: editingTask.status || TASK_STATUS.PENDING,
        due_date: editingTask.due_date || '',
      });
    } else {
      setForm(INITIAL_TASK_FORM);
    }
  }, [editingTask, visible]);

  const updateField = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    const title = form.title.trim();
    if (!title) {
      Alert.alert('Campo requerido', 'Por favor ingresa un título para la tarea.');
      return;
    }

    const dueDate = form.due_date.trim();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (dueDate && !dateRegex.test(dueDate)) {
      Alert.alert(
        'Formato inválido',
        'La fecha límite debe tener el formato AAAA-MM-DD (ej: 2026-11-30).'
      );
      return;
    }

    onSave({
      title,
      description: form.description.trim(),
      priority: form.priority,
      status: form.status,
      due_date: dueDate || null,
    });
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
          <View style={styles.modalHeader}>
            <View>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingTask ? 'Editar Tarea' : 'Nueva Tarea'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {editingTask
                  ? 'Modifica los detalles, prioridad o estado'
                  : 'Agrega una actividad o entregable a tu proyecto'}
              </Text>
            </View>

            <Pressable
              onPress={onClose}
              disabled={saving}
              style={[styles.closeButton, { backgroundColor: colors.surfaceSecondary }]}
              hitSlop={8}
            >
              <Ionicons name="close" size={22} color={colors.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollBody}
          >
            {/* TÍTULO */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Título de la tarea *
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
              placeholder="Ej. Diseñar wireframes, Implementar endpoint"
              placeholderTextColor={colors.textSecondary}
              value={form.title}
              onChangeText={val => updateField('title', val)}
              maxLength={120}
            />

            {/* DESCRIPCIÓN */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Descripción (opcional)
            </Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                {
                  backgroundColor: colors.background,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              placeholder="Detalla los requisitos o criterios de aceptación..."
              placeholderTextColor={colors.textSecondary}
              value={form.description}
              onChangeText={val => updateField('description', val)}
              multiline
              textAlignVertical="top"
              maxLength={400}
            />

            {/* PRIORIDAD */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Prioridad
            </Text>
            <View style={styles.optionsRow}>
              {PRIORITY_OPTIONS.map(opt => {
                const selected = form.priority === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => updateField('priority', opt.value)}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: selected
                          ? colors.projectLight
                          : colors.surfaceSecondary,
                        borderColor: selected ? colors.project : 'transparent',
                        borderWidth: 1.5,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        {
                          color: selected ? colors.project : colors.textSecondary,
                          fontWeight: selected ? '700' : '500',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* ESTADO */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Estado
            </Text>
            <View style={styles.optionsRow}>
              {TASK_STATUS_OPTIONS.map(opt => {
                const selected = form.status === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    onPress={() => updateField('status', opt.value)}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: selected
                          ? colors.projectLight
                          : colors.surfaceSecondary,
                        borderColor: selected ? colors.project : 'transparent',
                        borderWidth: 1.5,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        {
                          color: selected ? colors.project : colors.textSecondary,
                          fontWeight: selected ? '700' : '500',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* FECHA LÍMITE */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Fecha límite (opcional)
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
              placeholder="AAAA-MM-DD (ej: 2026-12-15)"
              placeholderTextColor={colors.textSecondary}
              value={form.due_date}
              onChangeText={val => updateField('due_date', val)}
              maxLength={10}
            />

            {/* BOTONES */}
            <View style={styles.modalButtons}>
              <Pressable
                style={[styles.cancelBtn, { backgroundColor: colors.surfaceSecondary }]}
                onPress={onClose}
                disabled={saving}
              >
                <Text style={[styles.cancelText, { color: colors.text }]}>
                  Cancelar
                </Text>
              </Pressable>

              <Pressable
                style={[
                  styles.saveBtn,
                  { backgroundColor: colors.project },
                  saving && { opacity: 0.7 },
                ]}
                onPress={handleSubmit}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <>
                    <Ionicons name="checkmark" size={18} color="#FFFFFF" />
                    <Text style={styles.saveText}>
                      {editingTask ? 'Guardar Cambios' : 'Crear Tarea'}
                    </Text>
                  </>
                )}
              </Pressable>
            </View>
          </ScrollView>
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
    maxHeight: '90%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '800',
  },
  modalSubtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    paddingBottom: 10,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
  },
  textArea: {
    minHeight: 75,
  },
  optionsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionChip: {
    flex: 1,
    minWidth: '22%',
    paddingVertical: 9,
    alignItems: 'center',
    borderRadius: 10,
  },
  optionChipText: {
    fontSize: 12,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 22,
    marginBottom: 6,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 13,
    alignItems: 'center',
    borderRadius: 12,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '700',
  },
  saveBtn: {
    flex: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 13,
    borderRadius: 12,
  },
  saveText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

