// app/(tabs)/projects.js

import React, { useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/styles/ThemeContext';
import { useProjects } from '../../src/features/projects/hooks/useProjects';
import { getProjectById } from '../../src/database/repositories/projectsRepository';

import ProjectStats from '../../src/features/projects/components/ProjectStats';
import ProjectCard from '../../src/features/projects/components/ProjectCard';
import ProjectQuickCard from '../../src/features/projects/components/ProjectQuickCard';
import ProjectFilters from '../../src/features/projects/components/ProjectFilters';
import ProjectFormModal from '../../src/features/projects/components/ProjectFormModal';
import ProjectDetailView from '../../src/features/projects/components/ProjectDetailView';

const PRIORITY_WEIGHTS = {
  urgent: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export default function ProjectsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const {
    projects,
    recentProjects,
    upcomingProjects,
    overdueProjects,
    statistics,
    loading,
    error,
    addProject,
    editProject,
    removeProject,
    refresh,
  } = useProjects();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [dueFilter, setDueFilter] = useState('all');
  const [sortBy, setSortBy] = useState('created_desc');

  const [modalVisible, setModalVisible] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [saving, setSaving] = useState(false);

  // Proyecto seleccionado para ver en detalle
  const [selectedProject, setSelectedProject] = useState(null);

  // =====================================================
  // FILTRADO Y ORDENAMIENTO
  // =====================================================

  const filteredProjects = useMemo(() => {
    let result = projects.filter((project) => {
      const matchesSearch =
        !searchQuery.trim() ||
        project.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || project.status === statusFilter;

      const matchesPriority =
        priorityFilter === 'all' || project.priority === priorityFilter;

      let matchesDue = true;
      if (dueFilter === 'overdue') {
        matchesDue = !!project.is_overdue;
      } else if (dueFilter === 'upcoming') {
        matchesDue = !!project.is_upcoming;
      } else if (dueFilter === 'no_due') {
        matchesDue = !project.due_date;
      } else if (dueFilter === 'has_due') {
        matchesDue = !!project.due_date;
      }

      return matchesSearch && matchesStatus && matchesPriority && matchesDue;
    });

    result.sort((a, b) => {
      if (sortBy === 'created_desc') {
        return (b.created_at || '').localeCompare(a.created_at || '');
      }
      if (sortBy === 'created_asc') {
        return (a.created_at || '').localeCompare(b.created_at || '');
      }
      if (sortBy === 'due_asc') {
        const dateA = a.due_date || '9999-99-99';
        const dateB = b.due_date || '9999-99-99';
        return dateA.localeCompare(dateB);
      }
      if (sortBy === 'priority_desc') {
        const weightA = PRIORITY_WEIGHTS[a.priority] || 2;
        const weightB = PRIORITY_WEIGHTS[b.priority] || 2;
        return weightB - weightA;
      }
      if (sortBy === 'progress_desc') {
        return (b.progress || 0) - (a.progress || 0);
      }
      if (sortBy === 'title_asc') {
        return (a.title || '').localeCompare(b.title || '');
      }
      return 0;
    });

    return result;
  }, [projects, searchQuery, statusFilter, priorityFilter, dueFilter, sortBy]);

  // =====================================================
  // GESTIÓN DE MODALES
  // =====================================================

  const openCreateModal = useCallback(() => {
    setEditingProject(null);
    setModalVisible(true);
  }, []);

  const openEditModal = useCallback((project) => {
    setEditingProject(project);
    setModalVisible(true);
  }, []);

  const handleSaveProject = async (projectData) => {
    try {
      setSaving(true);
      let updated;
      if (editingProject) {
        updated = await editProject(editingProject.id, projectData);
      } else {
        updated = await addProject(projectData);
      }

      if (selectedProject && updated && selectedProject.id === updated.id) {
        setSelectedProject(updated);
      }

      setModalVisible(false);
      setEditingProject(null);
    } catch (err) {
      Alert.alert(
        'Error al guardar',
        err?.message || 'No se pudo guardar el proyecto en SQLite.'
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProject = (project) => {
    Alert.alert(
      'Eliminar Proyecto',
      `¿Estás seguro de que deseas eliminar permanentemente "${project.title}"?\n\nEsta acción borrará todas sus tareas y subtareas asociadas en cascada.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: async () => {
            try {
              await removeProject(project.id);
              if (selectedProject?.id === project.id) {
                setSelectedProject(null);
              }
            } catch (err) {
              Alert.alert(
                'Error al eliminar',
                err?.message || 'No se pudo eliminar el proyecto.'
              );
            }
          },
        },
      ]
    );
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
  };

  const handleProjectUpdated = useCallback(() => {
    if (selectedProject) {
      const latest = getProjectById(selectedProject.id);
      setSelectedProject(latest);
    }
    refresh();
  }, [selectedProject, refresh]);

  // =====================================================
  // RENDERIZADO: VISTA DETALLE O DASHBOARD
  // =====================================================

  if (selectedProject) {
    return (
      <ProjectDetailView
        project={selectedProject}
        onBack={() => {
          setSelectedProject(null);
          refresh();
        }}
        onEditProject={openEditModal}
        onDeleteProject={handleDeleteProject}
        onProjectUpdated={handleProjectUpdated}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 18),
            paddingBottom: Math.max(insets.bottom, 32),
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ENCABEZADO PRINCIPAL */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <View
              style={[
                styles.headerIconContainer,
                { backgroundColor: colors.projectLight },
              ]}
            >
              <Ionicons name="folder-open" size={24} color={colors.project} />
            </View>
            <View>
              <Text style={[styles.mainTitle, { color: colors.text }]}>
                Proyectos
              </Text>
              <Text style={[styles.mainSubtitle, { color: colors.textSecondary }]}>
                Gestión, planificación y tareas
              </Text>
            </View>
          </View>

          <View style={styles.headerActions}>
            <Pressable
              style={[
                styles.iconBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={refresh}
              disabled={loading}
              hitSlop={8}
            >
              <Ionicons
                name="refresh-outline"
                size={20}
                color={colors.textSecondary}
              />
            </Pressable>

            <Pressable
              style={[styles.createBtn, { backgroundColor: colors.project }]}
              onPress={openCreateModal}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
              <Text style={styles.createBtnText}>Nuevo</Text>
            </Pressable>
          </View>
        </View>

        {/* DASHBOARD PRINCIPAL DE ESTADÍSTICAS */}
        <ProjectStats statistics={statistics} />

        {/* SECCIÓN 1: PRÓXIMOS A VENCER O VENCIDOS */}
        {(upcomingProjects.length > 0 || overdueProjects.length > 0) && (
          <View style={styles.carouselSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWithBadge}>
                <Ionicons
                  name={overdueProjects.length > 0 ? 'alert-circle' : 'time-outline'}
                  size={18}
                  color={overdueProjects.length > 0 ? colors.danger : colors.fitness}
                />
                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                  {overdueProjects.length > 0 ? 'Atención Requerida' : 'Próximos a Vencer'}
                </Text>
              </View>

              <Text style={[styles.sectionCountText, { color: colors.textSecondary }]}>
                {overdueProjects.length + upcomingProjects.length}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {[...overdueProjects, ...upcomingProjects].map((proj) => (
                <ProjectQuickCard
                  key={proj.id}
                  project={proj}
                  onPress={() => handleSelectProject(proj)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* SECCIÓN 2: PROYECTOS RECIENTES */}
        {recentProjects.length > 0 && (
          <View style={styles.carouselSection}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionTitleWithBadge}>
                <Ionicons name="sparkles-outline" size={17} color={colors.primary} />
                <Text style={[styles.sectionHeading, { color: colors.text }]}>
                  Proyectos Recientes
                </Text>
              </View>
              <Text style={[styles.sectionCountText, { color: colors.textSecondary }]}>
                {recentProjects.length}
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontalList}
            >
              {recentProjects.map((proj) => (
                <ProjectQuickCard
                  key={proj.id}
                  project={proj}
                  onPress={() => handleSelectProject(proj)}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* SECCIÓN 3: LISTADO COMPLETO Y FILTROS */}
        <View style={styles.listSectionHeader}>
          <View>
            <Text style={[styles.sectionHeading, { color: colors.text }]}>
              Todos los Proyectos
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              {filteredProjects.length} de {projects.length} proyecto(s)
            </Text>
          </View>
        </View>

        <ProjectFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          dueFilter={dueFilter}
          onDueFilterChange={setDueFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />

        {/* ESTADOS DE CARGA, ERROR O VACÍO */}
        {loading && projects.length === 0 ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={colors.project} />
            <Text style={[styles.stateText, { color: colors.textSecondary }]}>
              Cargando proyectos desde SQLite...
            </Text>
          </View>
        ) : error && projects.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons name="alert-circle-outline" size={44} color={colors.danger} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              Error al consultar proyectos
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {error}
            </Text>
            <Pressable
              style={[styles.actionBtn, { backgroundColor: colors.project }]}
              onPress={refresh}
            >
              <Text style={styles.actionBtnText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : filteredProjects.length === 0 ? (
          <View
            style={[
              styles.emptyCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Ionicons
              name="folder-open-outline"
              size={44}
              color={colors.textSecondary}
            />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>
              {projects.length === 0
                ? 'Aún no tienes proyectos'
                : 'No se encontraron resultados'}
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              {projects.length === 0
                ? 'Organiza tus metas y actividades creando tu primer proyecto.'
                : 'Intenta ajustar los filtros de búsqueda o restablecerlos.'}
            </Text>
            {projects.length === 0 && (
              <Pressable
                style={[styles.actionBtn, { backgroundColor: colors.project }]}
                onPress={openCreateModal}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" />
                <Text style={styles.actionBtnText}>Crear Primer Proyecto</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.projectsVerticalList}>
            {filteredProjects.map((project) => (
              <ProjectCard
                key={project.id}
                project={project}
                onPress={() => handleSelectProject(project)}
                onEdit={() => openEditModal(project)}
                onDelete={() => handleDeleteProject(project)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      {/* MODAL CREAR / EDITAR PROYECTO */}
      <ProjectFormModal
        visible={modalVisible}
        editingProject={editingProject}
        onClose={() => setModalVisible(false)}
        onSave={handleSaveProject}
        saving={saving}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 20,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  mainSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  createBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  carouselSection: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  sectionCountText: {
    fontSize: 12,
    fontWeight: '700',
  },
  horizontalList: {
    gap: 10,
    paddingRight: 8,
  },
  listSectionHeader: {
    marginTop: 4,
    marginBottom: -6,
  },
  projectsVerticalList: {
    gap: 12,
  },
  stateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  stateText: {
    fontSize: 13,
  },
  emptyCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 36,
    paddingHorizontal: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 12,
    marginTop: 8,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});
