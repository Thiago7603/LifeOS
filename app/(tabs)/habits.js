// app/(tabs)/habits.js
import React, { useState, useEffect, useCallback } from 'react';
import { 
  StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useTheme } from '../../src/styles/ThemeContext';
import { getHabits, createHabit, toggleHabitCompletion, deleteHabit, getHabitStatistics } from '../../src/database/db';

export default function HabitsScreen() {
  const { colors, isDark } = useTheme();
  const [habits, setHabits] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Todos');

  // Form states dinámicos
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Desarrollo');
  const [frequency, setFrequency] = useState('Diario');
  const [targetMinutes, setTargetMinutes] = useState(25);

  const categoriesList = ['Desarrollo', 'Carrera', 'Salud', 'Mente'];
  const timeOptions = [5, 10, 15, 25, 45, 60];

  const [statistics, setStatistics] = useState({
    consistency:     0,
    completedHabitDays:     0,
    possibleHabitDays:     0,
    dailyActivity: [],
    weekDays: [],
    categoryDistribution: [],
  });

  const loadHabits = () => {
    const data = getHabits();
    const stats = getHabitStatistics();

    setHabits(data);
    setStatistics(stats);
  };

  useFocusEffect(
    useCallback(() => {
      loadHabits();
    }, [])
  );

  const handleCreate = () => {
    if (!title.trim()) return;
    createHabit({
      title,
      description,
      category,
      frequency,
      targetMinutes: Number(targetMinutes),
      reminderTime: '08:00'
    });
    setTitle('');
    setDescription('');
    setCategory('Desarrollo');
    setTargetMinutes(25);
    setModalVisible(false);
    loadHabits();
  };

  const handleToggle = (id, currentStatus) => {
    const newStatus = currentStatus === 1 ? 0 : 1;
    toggleHabitCompletion(id, newStatus);
    loadHabits();
  };

  const handleDelete = (id) => {
    deleteHabit(id);
    loadHabits();
  };

  const filteredHabits = selectedCategory === 'Todos' 
    ? habits 
    : habits.filter(h => h.category.toLowerCase() === selectedCategory.toLowerCase());

  // Métricas reales
  const maxStreak = habits.length >   0
    ? Math.max(...habits.map(h => h.streak ||   0))
    : 0;

  const completedCount = habits.filter(
    h => h.completed === 1
  ).length;

  const consistencyPercentage = statistics.consistency;

  const weekDays = statistics.weekDays;

  // Generador dinámico de los días de la semana actual
  const getCurrWeekDays = () => {
    const today = new Date();
    const currentDayOfWeek = today.getDay();
    const distanceToMonday = currentDayOfWeek === 0 ? -6 : 1 - currentDayOfWeek;
    
    const monday = new Date(today);
    monday.setDate(today.getDate() + distanceToMonday);

    const daysConfig = [
      { label: 'L', dayIndex: 1 },
      { label: 'M', dayIndex: 2 },
      { label: 'X', dayIndex: 3 },
      { label: 'J', dayIndex: 4 },
      { label: 'V', dayIndex: 5 },
      { label: 'S', dayIndex: 6 },
      { label: 'D', dayIndex: 0 },
    ];

    return daysConfig.map(({ label, dayIndex }) => {
      const targetDate = new Date(monday);
      const offset = dayIndex === 0 ? 6 : dayIndex - 1;
      targetDate.setDate(monday.getDate() + offset);

      const isToday = targetDate.toDateString() === today.toDateString();

      return {
        day: label,
        date: targetDate.getDate().toString(),
        selected: isToday,
        active: isToday && completedCount > 0
      };
    });
  };

  //const weekDays = getCurrWeekDays();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        {/* Header de Racha e Impulso Vital */}
        <View style={[styles.streakCard, { backgroundColor: colors.surface }]}>
          <View style={styles.streakHeaderRow}>
            <Ionicons name="flame" size={22} color={colors.fitness} />
            <Text style={[styles.streakTitle, { color: colors.text }]}>
              Racha actual: {maxStreak} días seguidos 🔥
            </Text>
            <View style={[styles.offlineBadge, { backgroundColor: colors.surfaceSecondary }]}>
              <View style={[styles.dot, { backgroundColor: colors.success }]} />
              <Text style={[styles.offlineText, { color: colors.textSecondary }]}>Offline activo</Text>
            </View>
          </View>

          {/* Selector de Semana Actual Dinámico */}
          <View style={styles.weekContainer}>
            <View style={styles.weekHeaderRow}>
              <Text style={[styles.weekTitle, { color: colors.text }]}>Semana actual</Text>
              <Text style={[styles.consistencyText, { color: colors.success }]}>{consistencyPercentage}% consistencia</Text>
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
                  <Text style={[
                    styles.dayLabel,
                    { color: item.isToday ? '#fff' : colors.textSecondary },
                  ]}>
                    {item.label}
                  </Text>

                  <Text style={[
                    styles.dateLabel,
                    { color: item.isToday ? '#fff' : colors.text },
                  ]}>
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
            <View style={[styles.progressBarBg, { backgroundColor: colors.surfaceSecondary }]}>
              <View style={[styles.progressBarFill, { width: `${consistencyPercentage}%`, backgroundColor: colors.success }]} />
            </View>
          </View>

          <TouchableOpacity 
            style={[styles.createButton, { backgroundColor: colors.primary }]} 
            onPress={() => setModalVisible(true)}
          >
            <Ionicons name="add-circle-outline" size={20} color="#fff" />
            <Text style={styles.createButtonText}>Crear hábito</Text>
          </TouchableOpacity>
        </View>

        {/* Filtros de Categoría */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersContainer}>
          {['Todos', 'Carrera', 'Salud', 'Mente', 'Desarrollo'].map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <TouchableOpacity 
                key={cat} 
                style={[
                  styles.filterChip, 
                  { backgroundColor: isActive ? colors.primary : colors.surface }
                ]}
                onPress={() => setSelectedCategory(cat)}
              >
                <Text style={[
                  styles.filterText, 
                  { color: isActive ? '#fff' : colors.textSecondary }
                ]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Lista de Rutinas de Hoy */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Rutina de hoy</Text>
          <Text style={[styles.syncText, { color: colors.textSecondary }]}>Sincronización local lista</Text>
        </View>

        {filteredHabits.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No hay hábitos registrados en esta categoría. Crea uno nuevo para empezar.
          </Text>
        ) : (
          filteredHabits.map((item) => (
            <View key={item.id} style={[styles.habitCard, { backgroundColor: colors.surface }]}>
              <View style={styles.habitInfo}>
                <View style={styles.habitMetaRow}>
                  <Text style={[styles.habitCategory, { color: colors.primary }]}>
                    {item.category.toUpperCase()} - {item.frequency}
                  </Text>
                  <TouchableOpacity onPress={() => handleDelete(item.id)}>
                    <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  </TouchableOpacity>
                </View>
                <Text style={[styles.habitName, { color: colors.text }]}>{item.title}</Text>
                <Text style={[styles.habitDetails, { color: colors.textSecondary }]}>
                  Meta: {item.target_minutes} minutos
                </Text>
                <Text style={[styles.habitStreak, { color: colors.fitness }]}>
                  🔥 {item.streak} días de racha
                </Text>
              </View>

              <TouchableOpacity 
                style={[
                  styles.checkButton, 
                  { borderColor: colors.border },
                  item.completed === 1 && { backgroundColor: colors.success, borderColor: colors.success }
                ]}
                onPress={() => handleToggle(item.id, item.completed)}
              >
                {item.completed === 1 && <Ionicons name="checkmark" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>
          ))
        )}

        {/* Consistencia Mensual */}
        <View style={[styles.monthlyCard, { backgroundColor: colors.surface }]}>
          <View style={styles.monthlyHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="calendar-outline" size={18} color={colors.primary} />
              <Text style={[styles.monthlyTitle, { color: colors.text }]}>Consistencia Mensual</Text>
            </View>
            <Text style={[styles.monthlySub, { color: colors.textSecondary }]}>Últimos 28 días</Text>
          </View>

          <View style={styles.heatmapGrid}>
            {statistics.dailyActivity.map((item) => (
              <View
                key={item.date}
                style={[
                  styles.heatmapCell,
                  {
                    backgroundColor:
                      item.count === 0
                        ? colors.surfaceSecondary
                        : item.count === 1
                          ? colors.successLight
                          : colors.success,
                  },
                ]}
              />
            ))}
          </View>

          <View style={styles.heatmapFooter}>
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Menos activo</Text>
            <Text style={[styles.footerLabel, { color: colors.textSecondary }]}>Consistente</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.distributionRow}>
            <Text style={[styles.distTitle, { color: colors.text }]}>
              Distribución por áreas
            </Text>
            <Text style={[styles.distPillars, { color: colors.textSecondary }]}>
              Últimos 28 días
            </Text>
          </View>

          {categoriesList.map((cat) => {
            const item = statistics.categoryDistribution.find(
              entry => entry.category === cat
            );

            const percentage = item?.percentage || 0;
            const count = item?.count || 0;

            return (
              <View key={cat} style={styles.pillarItem}>
                <View style={styles.pillarLabelRow}>
                  <Text style={[styles.pillarName, { color: colors.text }]}>
                    {cat}
                  </Text>

                  <Text style={[styles.pillarPerc, { color: colors.textSecondary }]}>
                    {percentage}% ({count})
                  </Text>
                </View>

                <View style={[
                  styles.pillarBarBg,
                  { backgroundColor: colors.surfaceSecondary },
                ]}>
                  <View
                    style={[
                      styles.pillarBarFill,
                      {
                        width: `${percentage}%`,
                        backgroundColor: colors.primary,
                      },
                    ]}
                  />
                </View>
              </View>
            );
          })}

          <View style={styles.pillarItem}>
            <View style={styles.pillarLabelRow}>
              <Text style={[styles.pillarName, { color: colors.text }]}>Desarrollo & Mente</Text>
              <Text style={[styles.pillarPerc, { color: colors.textSecondary }]}>0%</Text>
            </View>
            <View style={[styles.pillarBarBg, { backgroundColor: colors.surfaceSecondary }]}>
              <View style={[styles.pillarBarFill, { width: '0%', backgroundColor: colors.primary }]} />
            </View>
          </View>

          <View style={styles.pillarItem}>
            <View style={styles.pillarLabelRow}>
              <Text style={[styles.pillarName, { color: colors.text }]}>Carrera TI & Proyectos</Text>
              <Text style={[styles.pillarPerc, { color: colors.textSecondary }]}>0%</Text>
            </View>
            <View style={[styles.pillarBarBg, { backgroundColor: colors.surfaceSecondary }]}>
              <View style={[styles.pillarBarFill, { width: '0%', backgroundColor: colors.project }]} />
            </View>
          </View>

          <View style={styles.pillarItem}>
            <View style={styles.pillarLabelRow}>
              <Text style={[styles.pillarName, { color: colors.text }]}>Salud & Fitness</Text>
              <Text style={[styles.pillarPerc, { color: colors.textSecondary }]}>0%</Text>
            </View>
            <View style={[styles.pillarBarBg, { backgroundColor: colors.surfaceSecondary }]}>
              <View style={[styles.pillarBarFill, { width: '0%', backgroundColor: colors.success }]} />
            </View>
          </View>
        </View>

      </ScrollView>

      {/* Modal Dinámico para Crear Hábito */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={[styles.modalOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Nuevo Hábito</Text>
            
            <TextInput 
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} 
              placeholder="Nombre del hábito (ej. Estudiar)" 
              placeholderTextColor={colors.textSecondary}
              value={title} 
              onChangeText={setTitle} 
            />

            <TextInput 
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]} 
              placeholder="Descripción breve (opcional)" 
              placeholderTextColor={colors.textSecondary}
              value={description} 
              onChangeText={setDescription} 
            />

            {/* Selector Dinámico de Categoría */}
            <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>Selecciona la Categoría:</Text>
            <View style={styles.optionsRow}>
              {categoriesList.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.optionChip,
                      { backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary }
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text style={[styles.optionChipText, { color: isSelected ? '#fff' : colors.text }]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Selector Dinámico de Minutos Objetivo */}
            <Text style={[styles.labelSelector, { color: colors.textSecondary }]}>Meta de Tiempo (minutos):</Text>
            <View style={styles.optionsRow}>
              {timeOptions.map((min) => {
                const isSelected = targetMinutes === min;
                return (
                  <TouchableOpacity
                    key={min}
                    style={[
                      styles.optionChip,
                      { backgroundColor: isSelected ? colors.primary : colors.surfaceSecondary }
                    ]}
                    onPress={() => setTargetMinutes(min)}
                  >
                    <Text style={[styles.optionChipText, { color: isSelected ? '#fff' : colors.text }]}>
                      {min} min
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.cancelBtn, { backgroundColor: colors.surfaceSecondary }]} 
                onPress={() => setModalVisible(false)}
              >
                <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.saveBtn, { backgroundColor: colors.primary }]} 
                onPress={handleCreate}
              >
                <Text style={styles.saveText}>Guardar Hábito</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
  streakCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
  streakHeaderRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  streakTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8, flex: 1 },
  offlineBadge: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12 },
  dot: { width: 6, height: 6, borderRadius: 3, marginRight: 4 },
  offlineText: { fontSize: 10 },
  
  weekContainer: { marginVertical: 12, paddingVertical: 8 },
  weekHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  weekTitle: { fontSize: 14, fontWeight: 'bold' },
  consistencyText: { fontSize: 12, fontWeight: '600' },
  daysRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  dayColumn: { alignItems: 'center', paddingVertical: 8, paddingHorizontal: 6, borderRadius: 12, width: 40 },
  dayLabel: { fontSize: 10, fontWeight: '600' },
  dateLabel: { fontSize: 14, fontWeight: 'bold', marginVertical: 2 },
  progressBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', borderRadius: 3 },

  createButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, borderRadius: 12, marginTop: 8 },
  createButtonText: { color: '#fff', fontWeight: 'bold', marginLeft: 8 },
  
  filtersContainer: { flexDirection: 'row', marginBottom: 20 },
  filterChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
  filterText: { fontWeight: '500' },
  
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold' },
  syncText: { fontSize: 12 },
  
  habitCard: { borderRadius: 16, padding: 16, marginBottom: 12, flexDirection: 'row', alignItems: 'center' },
  habitInfo: { flex: 1 },
  habitMetaRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  habitCategory: { fontSize: 10, fontWeight: 'bold' },
  habitName: { fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  habitDetails: { fontSize: 12, marginBottom: 4 },
  habitStreak: { fontSize: 12, fontWeight: '600' },
  checkButton: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginLeft: 12 },
  emptyText: { textAlign: 'center', marginTop: 20, marginBottom: 20 },

  monthlyCard: { borderRadius: 16, padding: 16, marginTop: 12 },
  monthlyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  monthlyTitle: { fontSize: 16, fontWeight: 'bold', marginLeft: 8 },
  monthlySub: { fontSize: 12 },
  heatmapGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, justifyContent: 'space-between', marginVertical: 8 },
  heatmapCell: { width: 28, height: 22, borderRadius: 4 },
  heatmapFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 4, marginBottom: 12 },
  footerLabel: { fontSize: 10 },
  divider: { height: 1, backgroundColor: 'rgba(150,150,150,0.15)', marginVertical: 12 },
  distributionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  distTitle: { fontSize: 14, fontWeight: 'bold' },
  distPillars: { fontSize: 12 },
  pillarItem: { marginBottom: 10 },
  pillarLabelRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  pillarName: { fontSize: 12, fontWeight: '500' },
  pillarPerc: { fontSize: 12, fontWeight: 'bold' },
  pillarBarBg: { height: 6, borderRadius: 3, overflow: 'hidden' },
  pillarBarFill: { height: '100%', borderRadius: 3 },

  modalOverlay: { flex: 1, justifyContent: 'center', padding: 20 },
  modalContent: { borderRadius: 20, padding: 20 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 16, textAlign: 'center' },
  input: { padding: 12, borderRadius: 10, marginBottom: 12, borderWidth: 1 },
  labelSelector: { fontSize: 12, fontWeight: '600', marginBottom: 6, marginTop: 4 },
  optionsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14, gap: 6 },
  optionChip: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10 },
  optionChipText: { fontSize: 12, fontWeight: '600' },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  cancelBtn: { flex: 1, padding: 12, alignItems: 'center', marginRight: 8, borderRadius: 10 },
  cancelText: { fontWeight: 'bold' },
  saveBtn: { flex: 1, padding: 12, alignItems: 'center', marginLeft: 8, borderRadius: 10 },
  saveText: { color: '#fff', fontWeight: 'bold' }
});