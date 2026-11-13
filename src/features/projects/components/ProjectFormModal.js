// src/features/projects/components/ProjectFormModal.js

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
  PROJECT_STATUS,
  PRIORITY_OPTIONS,
  PROJECT_STATUS_OPTIONS,
} from '../constants/projectConstants';

const INITIAL_FORM = {
  title: '',
  description: '',
  priority: PRIORITY.MEDIUM,
  status: PROJECT_STATUS.ACTIVE,
  start_date: '',
  due_date: '',
};

export default function ProjectFormModal({
  visible,
  editingProject,
  onClose,
  onSave,
  saving = false,
}) {
  const { colors } = useTheme();
  const [form, setForm] = useState(INITIAL_FORM);

  useEffect(() => {
    if (editingProject) {
      setForm({
        title: editingProject.title || '',
        description: editingProject.description || '',
        priority: editingProject.priority || PRIORITY.MEDIUM,
        status: editingProject.status || PROJECT_STATUS.ACTIVE,
        start_date: editingProject.start_date || '',
        due_date: editingProject.due_date || '',
      });
    } else {
      setForm(INITIAL_FORM);
    }
  }, [editingProject, visible]);

  const updateField = (field, value) => {
    setForm(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = () => {
    const title = form.title.trim();
    if (!title) {
      Alert.alert('Campo requerido', 'Por favor ingresa un nombre para el proyecto.');
      return;
    }

    const startDate = form.start_date.trim();
    const dueDate = form.due_date.trim();
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

    if (startDate && !dateRegex.test(startDate)) {
      Alert.alert(
        'Formato inválido',
        'La fecha de inicio debe tener el formato AAAA-MM-DD (ej: 2026-11-20).'
      );
      return;
    }

    if (dueDate && !dateRegex.test(dueDate)) {
      Alert.alert(
        'Formato inválido',
        'La fecha límite debe tener el formato AAAA-MM-DD (ej: 2026-11-30).'
      );
      return;
    }

    if (startDate && dueDate && dueDate < startDate) {
      Alert.alert(
        'Fechas incongruentes',
        'La fecha límite no puede ser anterior a la fecha de inicio.'
      );
      return;
    }

    onSave({
      title,
      description: form.description.trim(),
      priority: form.priority,
      status: form.status,
      start_date: startDate || null,
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
                {editingProject ? 'Editar Proyecto' : 'Nuevo Proyecto'}
              </Text>
              <Text style={[styles.modalSubtitle, { color: colors.textSecondary }]}>
                {editingProject
                  ? 'Modifica los datos y fechas de tu proyecto'
                  : 'Define los detalles y objetivos de tu proyecto'}
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
              Nombre del proyecto *
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
              placeholder="Ej. Rediseño de LifeOS, Tesis Universitaria"
              placeholderTextColor={colors.textSecondary}
              value={form.title}
              onChangeText={val => updateField('title', val)}
              maxLength={100}
            />

            {/* DESCRIPCIÓN */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>
              Descripción breve
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
              placeholder="Explica el alcance u objetivo general del proyecto..."
              placeholderTextColor={colors.textSecondary}
              value={form.description}
              onChangeText={val => updateField('description', val)}
              multiline
              textAlignVertical="top"
              maxLength={500}
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
              {PROJECT_STATUS_OPTIONS.map(opt => {
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

            {/* FECHAS */}
            <View style={styles.datesRow}>
              <View style={styles.dateCol}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Fecha de inicio
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
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  value={form.start_date}
                  onChangeText={val => updateField('start_date', val)}
                  maxLength={10}
                />
              </View>

              <View style={styles.dateCol}>
                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Fecha límite
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
                  placeholder="AAAA-MM-DD"
                  placeholderTextColor={colors.textSecondary}
                  value={form.due_date}
                  onChangeText={val => updateField('due_date', val)}
                  maxLength={10}
                />
              </View>
            </View>

            <Text style={[styles.helperText, { color: colors.textSecondary }]}>
              Formato AAAA-MM-DD (ej: 2026-12-31). Las fechas son opcionales.
            </Text>

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
                      {editingProject ? 'Guardar Cambios' : 'Crear Proyecto'}
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
    minHeight: 80,
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
  datesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateCol: {
    flex: 1,
  },
  helperText: {
    fontSize: 11,
    marginTop: 8,
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

