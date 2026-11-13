// src/features/projects/components/ProjectDetailView.js

import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  TextInput,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../styles/ThemeContext';
import { useTasks } from '../hooks/useTasks';
import TaskCard from './TaskCard';
import KanbanBoard from './KanbanBoard';
import TaskFormModal from './TaskFormModal';
import SubtasksManagerModal from './SubtasksManagerModal';
import {
  PRIORITY_LABELS,
  PROJECT_STATUS_LABELS,
  TASK_STATUS,
} from '../constants/projectConstants';

function formatDate(date) {
  if (!date) return 'No definida';
  const parts = date.split('-');
  if (parts.length !== 3) return date;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

export default function ProjectDetailView({
  project,
  onBack,
  onEditProject,
  onDeleteProject,
  onProjectUpdated,
}) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState('kanban'); // 'kanban' | 'list'
  const [taskSearch, setTaskSearch] = useState('');
  const [taskStatusFilter, setTaskStatusFilter] = useState('all');

  // Modales
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [savingTask, setSavingTask] = useState(false);

  // Subtareas checklist modal
  const [activeTaskForSubtasks, setActiveTaskForSubtasks] = useState(null);

  // Hook para tareas del proyecto
  const {
    tasks,
    subtasks,
    loading,
    error,
    refresh,
    addTask,
    editTask,
    changeTaskStatus,
    removeTask,
    loadSubtasks,
    addSubtask,
    editSubtask,
    toggleSubtaskStatus,
    removeSubtask,
  } = useTasks(project.id, onProjectUpdated);

  // Cálculos de resumen
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === TASK_STATUS.COMPLETED).length;
  const pendingTasks = tasks.filter(t => t.status === TASK_STATUS.PENDING).length;
  const inProgressTasks = tasks.filter(t => t.status === TASK_STATUS.IN_PROGRESS).length;
  const reviewTasks = tasks.filter(t => t.status === TASK_STATUS.REVIEW).length;

  const progress = totalTasks > 0
    ? Math.round((completedTasks / totalTasks) * 100)
    : 0;

  const priorityColor = {
    low: colors.success,
    medium: colors.project,
    high: colors.fitness,
    urgent: colors.danger,
  }[project.priority] || colors.project;

  // Filtrado de tareas para la vista de lista
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch =
        !taskSearch.trim() ||
        task.title?.toLowerCase().includes(taskSearch.toLowerCase()) ||
        task.description?.toLowerCase().includes(taskSearch.toLowerCase());

      const matchesStatus =
        taskStatusFilter === 'all' || task.status === taskStatusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [tasks, taskSearch, taskStatusFilter]);

  // Manejadores de Tareas
  const handleOpenCreateTask = () => {
    setEditingTask(null);
    setTaskModalVisible(true);
  };

  const handleOpenEditTask = (task) => {
    setEditingTask(task);
    setTaskModalVisible(true);
  };

  const handleOpenSubtasks = (task) => {
    setActiveTaskForSubtasks(task);
    loadSubtasks(task.id);
  };

  const handleSaveTask = async (taskData) => {
    try {
      setSavingTask(true);
      if (editingTask) {
        await editTask(editingTask.id, taskData);
      } else {
        await addTask(taskData);
      }
      setTaskModalVisible(false);
      setEditingTask(null);
    } catch (err) {
      Alert.alert(
        'Error',
        err?.message || 'No se pudo guardar la tarea en SQLite.'
      );
    } finally {
      setSavingTask(false);
    }
  };

  const handleDeleteTask = (task) => {
    Alert.alert(
      'Eliminar Tarea',
      `¿Deseas eliminar permanentemente "${task.title}" y sus subtareas?`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeTask(task.id);
              if (activeTaskForSubtasks?.id === task.id) {
                setActiveTaskForSubtasks(null);
              }
            } catch (err) {
              Alert.alert('Error', err?.message || 'No se pudo eliminar la tarea.');
            }
          },
        },
      ]
    );
  };

  const handleToggleTaskComplete = (task) => {
    const next = task.status === TASK_STATUS.COMPLETED
      ? TASK_STATUS.PENDING
      : TASK_STATUS.COMPLETED;
    changeTaskStatus(task.id, next);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* BARRA SUPERIOR DE NAVEGACIÓN */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: Math.max(insets.top, 14),
            borderBottomColor: colors.border,
            backgroundColor: colors.surface,
          },
        ]}
      >
        <Pressable
          style={[styles.backButton, { backgroundColor: colors.surfaceSecondary }]}
          onPress={onBack}
          hitSlop={8}
        >
          <Ionicons name="arrow-back" size={20} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Volver</Text>
        </Pressable>

        <View style={styles.topActions}>
          <Pressable
            style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => onEditProject(project)}
            hitSlop={8}
          >
            <Ionicons name="create-outline" size={19} color={colors.textSecondary} />
          </Pressable>

          <Pressable
            style={[styles.actionIconBtn, { backgroundColor: colors.surfaceSecondary }]}
            onPress={() => onDeleteProject(project)}
            hitSlop={8}
          >
            <Ionicons name="trash-outline" size={19} color={colors.danger} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollBody,
          { paddingBottom: Math.max(insets.bottom, 36) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* CABECERA DEL PROYECTO */}
        <View
          style={[
            styles.projectHeaderCard,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.badgesRow}>
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
                {PRIORITY_LABELS[project.priority] || project.priority}
              </Text>
            </View>

            <View
              style={[
                styles.badge,
                { backgroundColor: colors.surfaceSecondary },
              ]}
            >
              <Text style={[styles.badgeText, { color: colors.textSecondary }]}>
                {PROJECT_STATUS_LABELS[project.status] || project.status}
              </Text>
            </View>

            {project.is_overdue && (
              <View
                style={[styles.badge, { backgroundColor: colors.dangerLight }]}
              >
                <Ionicons name="alert-circle" size={12} color={colors.danger} />
                <Text style={[styles.badgeText, { color: colors.danger }]}>
                  Vencido
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.projectTitle, { color: colors.text }]}>
            {project.title}
          </Text>

          {!!project.description && (
            <Text
              style={[styles.projectDescription, { color: colors.textSecondary }]}
            >
              {project.description}
            </Text>
          )}

          {/* FECHAS */}
          <View style={styles.datesGrid}>
            <View style={styles.dateItem}>
              <Ionicons
                name="play-outline"
                size={14}
                color={colors.textSecondary}
              />
              <Text style={[styles.dateLabel, { color: colors.textSecondary }]}>
                Inicio: {formatDate(project.start_date)}
              </Text>
            </View>

            <View style={styles.dateItem}>
              <Ionicons
                name="calendar-outline"
                size={14}
                color={project.is_overdue ? colors.danger : colors.textSecondary}
              />
              <Text
                style={[
                  styles.dateLabel,
                  {
                    color: project.is_overdue
                      ? colors.danger
                      : colors.textSecondary,
                  },
                ]}
              >
                Límite: {formatDate(project.due_date)}
              </Text>
            </View>
          </View>

          {/* BARRA DE PROGRESO */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeaderRow}>
              <Text style={[styles.progressTitle, { color: colors.text }]}>
                Progreso del proyecto
              </Text>
              <Text style={[styles.progressPercent, { color: colors.project }]}>
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

            <Text style={[styles.tasksSummaryText, { color: colors.textSecondary }]}>
              {completedTasks} de {totalTasks} tareas completadas
            </Text>
          </View>
        </View>

        {/* RESUMEN NUMÉRICO DE TAREAS */}
        <View style={styles.taskCountersGrid}>
          <View
            style={[
              styles.counterCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.counterNumber, { color: colors.textSecondary }]}>
              {pendingTasks}
            </Text>
            <Text style={[styles.counterLabel, { color: colors.textSecondary }]}>
              Pendientes
            </Text>
          </View>

          <View
            style={[
              styles.counterCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.counterNumber, { color: colors.primary }]}>
              {inProgressTasks}
            </Text>
            <Text style={[styles.counterLabel, { color: colors.textSecondary }]}>
              En progreso
            </Text>
          </View>

          <View
            style={[
              styles.counterCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.counterNumber, { color: colors.fitness }]}>
              {reviewTasks}
            </Text>
            <Text style={[styles.counterLabel, { color: colors.textSecondary }]}>
              En revisión
            </Text>
          </View>

          <View
            style={[
              styles.counterCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.counterNumber, { color: colors.success }]}>
              {completedTasks}
            </Text>
            <Text style={[styles.counterLabel, { color: colors.textSecondary }]}>
              Completadas
            </Text>
          </View>
        </View>

        {/* SELECTOR DE VISTA Y BOTÓN AGREGAR TAREA */}
        <View style={styles.workspaceControls}>
          <View
            style={[
              styles.tabSelector,
              { backgroundColor: colors.surfaceSecondary },
            ]}
          >
            <Pressable
              style={[
                styles.tabButton,
                activeTab === 'kanban' && {
                  backgroundColor: colors.surface,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}
              onPress={() => setActiveTab('kanban')}
            >
              <Ionicons
                name="grid-outline"
                size={16}
                color={activeTab === 'kanban' ? colors.project : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  {
                    color:
                      activeTab === 'kanban'
                        ? colors.project
                        : colors.textSecondary,
                    fontWeight: activeTab === 'kanban' ? '700' : '500',
                  },
                ]}
              >
                Tablero Kanban
              </Text>
            </Pressable>

            <Pressable
              style={[
                styles.tabButton,
                activeTab === 'list' && {
                  backgroundColor: colors.surface,
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.1,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}
              onPress={() => setActiveTab('list')}
            >
              <Ionicons
                name="list-outline"
                size={16}
                color={activeTab === 'list' ? colors.project : colors.textSecondary}
              />
              <Text
                style={[
                  styles.tabButtonText,
                  {
                    color:
                      activeTab === 'list'
                        ? colors.project
                        : colors.textSecondary,
                    fontWeight: activeTab === 'list' ? '700' : '500',
                  },
                ]}
              >
                Lista ({totalTasks})
              </Text>
            </Pressable>
          </View>

          <Pressable
            style={[styles.addTaskBtn, { backgroundColor: colors.project }]}
            onPress={handleOpenCreateTask}
          >
            <Ionicons name="add" size={18} color="#FFFFFF" />
            <Text style={styles.addTaskBtnText}>Nueva Tarea</Text>
          </Pressable>
        </View>

        {/* CONTENIDO PRINCIPAL: KANBAN O LISTA */}
        {loading && tasks.length === 0 ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={colors.project} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Cargando tareas del proyecto...
            </Text>
          </View>
        ) : activeTab === 'kanban' ? (
          /* TABLERO KANBAN */
          <View style={styles.kanbanSection}>
            <KanbanBoard
              tasks={tasks}
              onTaskPress={handleOpenSubtasks}
              onTaskEdit={handleOpenEditTask}
              onTaskDelete={handleDeleteTask}
              onStatusChange={changeTaskStatus}
              onToggleComplete={handleToggleTaskComplete}
            />
          </View>
        ) : (
          /* VISTA EN LISTA */
          <View style={styles.listSection}>
            {/* BUSCADOR DE TAREAS */}
            <View
              style={[
                styles.taskSearchBar,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <Ionicons
                name="search-outline"
                size={17}
                color={colors.textSecondary}
              />
              <TextInput
                style={[styles.taskSearchInput, { color: colors.text }]}
                placeholder="Buscar tareas en este proyecto..."
                placeholderTextColor={colors.textSecondary}
                value={taskSearch}
                onChangeText={setTaskSearch}
              />
              {!!taskSearch && (
                <Pressable onPress={() => setTaskSearch('')} hitSlop={8}>
                  <Ionicons
                    name="close-circle"
                    size={17}
                    color={colors.textSecondary}
                  />
                </Pressable>
              )}
            </View>

            {/* CHIPS DE FILTRO DE ESTADO EN LISTA */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterChipsRow}
            >
              {[
                { label: 'Todas', value: 'all' },
                { label: 'Pendientes', value: TASK_STATUS.PENDING },
                { label: 'En progreso', value: TASK_STATUS.IN_PROGRESS },
                { label: 'En revisión', value: TASK_STATUS.REVIEW },
                { label: 'Completadas', value: TASK_STATUS.COMPLETED },
              ].map(opt => {
                const active = taskStatusFilter === opt.value;
                return (
                  <Pressable
                    key={opt.value}
                    style={[
                      styles.filterChip,
                      {
                        backgroundColor: active
                          ? colors.projectLight
                          : colors.surface,
                        borderColor: active ? colors.project : colors.border,
                      },
                    ]}
                    onPress={() => setTaskStatusFilter(opt.value)}
                  >
                    <Text
                      style={[
                        styles.filterChipText,
                        {
                          color: active ? colors.project : colors.textSecondary,
                          fontWeight: active ? '700' : '500',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            {/* LISTADO DE TARJETAS DE TAREA */}
            {filteredTasks.length === 0 ? (
              <View
                style={[
                  styles.emptyTasksCard,
                  { backgroundColor: colors.surface, borderColor: colors.border },
                ]}
              >
                <Ionicons
                  name="clipboard-outline"
                  size={38}
                  color={colors.textSecondary}
                />
                <Text style={[styles.emptyTasksTitle, { color: colors.text }]}>
                  {tasks.length === 0
                    ? 'No hay tareas creadas todavía'
                    : 'No hay tareas con estos filtros'}
                </Text>
                <Text
                  style={[
                    styles.emptyTasksSubtitle,
                    { color: colors.textSecondary },
                  ]}
                >
                  {tasks.length === 0
                    ? 'Comienza agregando las actividades necesarias para completar tu proyecto.'
                    : 'Prueba cambiando los filtros de búsqueda.'}
                </Text>

                {tasks.length === 0 && (
                  <Pressable
                    style={[styles.emptyActionBtn, { backgroundColor: colors.project }]}
                    onPress={handleOpenCreateTask}
                  >
                    <Ionicons name="add" size={17} color="#FFFFFF" />
                    <Text style={styles.emptyActionBtnText}>
                      Crear Primera Tarea
                    </Text>
                  </Pressable>
                )}
              </View>
            ) : (
              <View style={styles.tasksVerticalList}>
                {filteredTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onPress={() => handleOpenSubtasks(task)}
                    onEdit={handleOpenEditTask}
                    onDelete={handleDeleteTask}
                    onToggleComplete={handleToggleTaskComplete}
                    onStatusChange={changeTaskStatus}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* MODAL CREAR / EDITAR TAREA */}
      <TaskFormModal
        visible={taskModalVisible}
        editingTask={editingTask}
        onClose={() => setTaskModalVisible(false)}
        onSave={handleSaveTask}
        saving={savingTask}
      />

      {/* MODAL GESTOR DE SUBTAREAS / CHECKLIST */}
      <SubtasksManagerModal
        visible={Boolean(activeTaskForSubtasks)}
        task={activeTaskForSubtasks}
        subtasks={subtasks}
        onClose={() => setActiveTaskForSubtasks(null)}
        onToggleSubtask={toggleSubtaskStatus}
        onAddSubtask={addSubtask}
        onEditSubtask={editSubtask}
        onDeleteSubtask={removeSubtask}
        onEditTask={handleOpenEditTask}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
  },
  backText: {
    fontSize: 13,
    fontWeight: '700',
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollBody: {
    padding: 16,
    gap: 16,
  },
  projectHeaderCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    gap: 12,
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 7,
  },
  priorityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  projectTitle: {
    fontSize: 22,
    fontWeight: '800',
    lineHeight: 28,
  },
  projectDescription: {
    fontSize: 13,
    lineHeight: 19,
  },
  datesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    paddingTop: 4,
  },
  dateItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressSection: {
    gap: 7,
    paddingTop: 6,
  },
  progressHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: '800',
  },
  progressTrack: {
    height: 8,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
  },
  tasksSummaryText: {
    fontSize: 11,
  },
  taskCountersGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  counterCard: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    gap: 2,
  },
  counterNumber: {
    fontSize: 18,
    fontWeight: '800',
  },
  counterLabel: {
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
  },
  workspaceControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  tabSelector: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
    flex: 1,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    borderRadius: 10,
  },
  tabButtonText: {
    fontSize: 12,
  },
  addTaskBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 13,
    paddingVertical: 9,
    borderRadius: 12,
  },
  addTaskBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 13,
  },
  kanbanSection: {
    marginTop: 4,
  },
  listSection: {
    gap: 12,
  },
  taskSearchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 12,
    gap: 8,
  },
  taskSearchInput: {
    flex: 1,
    fontSize: 13,
  },
  filterChipsRow: {
    gap: 8,
    paddingRight: 6,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterChipText: {
    fontSize: 11,
  },
  emptyTasksCard: {
    padding: 30,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  emptyTasksTitle: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptyTasksSubtitle: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 8,
  },
  emptyActionBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  tasksVerticalList: {
    gap: 10,
  },
});
