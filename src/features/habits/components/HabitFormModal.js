import React from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  DAYS_OPTIONS,
  CATEGORIES_LIST,
  TIME_OPTIONS,
} from '../constants/habitConstants';

const FREQUENCY_TYPE_OPTIONS = [
  { label: 'Diario', value: 'daily' },
  { label: 'Días específicos', value: 'specific_days' },
  { label: 'Veces por semana', value: 'weekly' },
];

const WEEKLY_TARGET_OPTIONS = [1, 2, 3, 4, 5, 6, 7];

export default function HabitFormModal({
  visible,
  editingHabit,
  formState,
  onClose,
  onSave,
  onToggleDay,
  colors,
}) {
  const {
    title,
    description,
    category,
    frequencyType,
    selectedDays,
    weeklyTarget,
    targetMinutes,
    setTitle,
    setDescription,
    setCategory,
    setFrequencyType,
    setWeeklyTarget,
    setTargetMinutes,
  } = formState;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}
      >
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          {/* Header del modal con título dinámico y botón de cierre */}
          <View style={styles.modalHeaderRow}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {editingHabit ? 'Editar Hábito' : 'Nuevo Hábito'}
            </Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            style={styles.modalScroll}
          >
            {/* Nombre del hábito */}
            <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>
              Nombre del hábito:
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
              placeholder="Ej. Meditar, Lectura, Ejercicio"
              placeholderTextColor={colors.textSecondary}
              value={title}
              onChangeText={setTitle}
            />

            {/* Descripción breve */}
            <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>
              Descripción breve (opcional):
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
              placeholder="Ej. 20 páginas de desarrollo personal"
              placeholderTextColor={colors.textSecondary}
              value={description}
              onChangeText={setDescription}
            />

            {/* Selector de frecuencia */}
            <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>
              Frecuencia del hábito:
            </Text>
            <View style={styles.optionsRow}>
              {FREQUENCY_TYPE_OPTIONS.map((option) => {
                const selected = frequencyType === option.value;
                return (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: selected
                          ? colors.primary
                          : colors.surfaceSecondary,
                      },
                    ]}
                    onPress={() => setFrequencyType(option.value)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        { color: selected ? '#fff' : colors.text },
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selector de días específicos */}
            {frequencyType === 'specific_days' && (
              <>
                <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>
                  ¿Qué días debes cumplirlo?
                </Text>
                <View style={styles.optionsRow}>
                  {DAYS_OPTIONS.map((day) => {
                    const selected = selectedDays.includes(day.value);
                    return (
                      <TouchableOpacity
                        key={day.value}
                        style={[
                          styles.optionChip,
                          {
                            backgroundColor: selected
                              ? colors.primary
                              : colors.surfaceSecondary,
                          },
                        ]}
                        onPress={() => onToggleDay(day.value)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            { color: selected ? '#fff' : colors.text },
                          ]}
                        >
                          {day.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Selector de meta semanal */}
            {frequencyType === 'weekly' && (
              <>
                <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>
                  ¿Cuántas veces por semana?
                </Text>
                <View style={styles.optionsRow}>
                  {WEEKLY_TARGET_OPTIONS.map((num) => {
                    const selected = weeklyTarget === num;
                    return (
                      <TouchableOpacity
                        key={num}
                        style={[
                          styles.optionChip,
                          {
                            backgroundColor: selected
                              ? colors.primary
                              : colors.surfaceSecondary,
                          },
                        ]}
                        onPress={() => setWeeklyTarget(num)}
                      >
                        <Text
                          style={[
                            styles.optionChipText,
                            { color: selected ? '#fff' : colors.text },
                          ]}
                        >
                          {num}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </>
            )}

            {/* Selector de categoría */}
            <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>
              Selecciona la Categoría:
            </Text>
            <View style={styles.optionsRow}>
              {CATEGORIES_LIST.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surfaceSecondary,
                      },
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        { color: isSelected ? '#fff' : colors.text },
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selector de tiempo objetivo */}
            <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>
              Meta de Tiempo (minutos):
            </Text>
            <View style={styles.optionsRow}>
              {TIME_OPTIONS.map((min) => {
                const isSelected = targetMinutes === min;
                return (
                  <TouchableOpacity
                    key={min}
                    style={[
                      styles.optionChip,
                      {
                        backgroundColor: isSelected
                          ? colors.primary
                          : colors.surfaceSecondary,
                      },
                    ]}
                    onPress={() => setTargetMinutes(min)}
                  >
                    <Text
                      style={[
                        styles.optionChipText,
                        { color: isSelected ? '#fff' : colors.text },
                      ]}
                    >
                      {min} min
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botones de acción del modal */}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[
                  styles.cancelBtn,
                  { backgroundColor: colors.surfaceSecondary },
                ]}
                onPress={onClose}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>
                  Cancelar
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                onPress={onSave}
              >
                <Text style={styles.saveText}>
                  {editingHabit ? 'Guardar Cambios' : 'Guardar Hábito'}
                </Text>
              </TouchableOpacity>
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
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxHeight: '90%',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 8,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalScroll: {
    flexGrow: 0,
  },
  input: {
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    borderWidth: 1,
    fontSize: 14,
  },
  labelSelector: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
    marginTop: 4,
  },
  optionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 14,
    gap: 6,
  },
  optionChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  optionChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    marginBottom: 6,
  },
  cancelBtn: {
    flex: 1,
    padding: 13,
    alignItems: 'center',
    marginRight: 8,
    borderRadius: 10,
  },
  cancelText: {
    fontWeight: 'bold',
  },
  saveBtn: {
    flex: 1,
    padding: 13,
    alignItems: 'center',
    marginLeft: 8,
    borderRadius: 10,
  },
  saveText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

