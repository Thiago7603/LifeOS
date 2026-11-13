// src/features/projects/hooks/useProjects.js

import { useCallback, useEffect, useState } from 'react';

import {
  getProjects,
  getProjectStatistics,
  getRecentProjects,
  getUpcomingDueProjects,
  getOverdueProjects,
  createProject,
  updateProject,
  deleteProject,
} from '../../../database/repositories/projectsRepository';

const INITIAL_STATISTICS = {
  total_projects: 0,
  active_projects: 0,
  paused_projects: 0,
  completed_projects: 0,
  archived_projects: 0,
  total_tasks: 0,
  completed_tasks: 0,
  pending_tasks: 0,
  in_progress_tasks: 0,
  review_tasks: 0,
  overdue_tasks: 0,
  overall_progress: 0,
};

export function useProjects() {
  const [projects, setProjects] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [upcomingProjects, setUpcomingProjects] = useState([]);
  const [overdueProjects, setOverdueProjects] = useState([]);
  const [statistics, setStatistics] = useState(INITIAL_STATISTICS);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --------------------------------------------------
  // CONSULTAR PROYECTOS Y ESTADÍSTICAS
  // --------------------------------------------------

  const refresh = useCallback(() => {
    setLoading(true);
    setError(null);

    try {
      const projectsData = getProjects();
      const statisticsData = getProjectStatistics();
      const recent = getRecentProjects(4);
      const upcoming = getUpcomingDueProjects(4);
      const overdue = getOverdueProjects();

      setProjects(projectsData);
      setStatistics(statisticsData);
      setRecentProjects(recent);
      setUpcomingProjects(upcoming);
      setOverdueProjects(overdue);

      return projectsData;
    } catch (err) {
      console.error('Error consultando proyectos:', err);
      setError(err.message || 'No se pudieron cargar los proyectos.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  // --------------------------------------------------
  // CREAR PROYECTO
  // --------------------------------------------------

  const addProject = useCallback((data) => {
    try {
      setError(null);
      const newProject = createProject(data);
      refresh();
      return newProject;
    } catch (err) {
      console.error('Error creando proyecto:', err);
      setError(err.message || 'No se pudo crear el proyecto.');
      throw err;
    }
  }, [refresh]);

  // --------------------------------------------------
  // ACTUALIZAR PROYECTO
  // --------------------------------------------------

  const editProject = useCallback((id, data) => {
    try {
      setError(null);
      const updatedProject = updateProject(id, data);
      refresh();
      return updatedProject;
    } catch (err) {
      console.error('Error actualizando proyecto:', err);
      setError(err.message || 'No se pudo actualizar el proyecto.');
      throw err;
    }
  }, [refresh]);

  // --------------------------------------------------
  // ELIMINAR PROYECTO
  // --------------------------------------------------

  const removeProject = useCallback((id) => {
    try {
      setError(null);
      const deleted = deleteProject(id);
      refresh();
      return deleted;
    } catch (err) {
      console.error('Error eliminando proyecto:', err);
      setError(err.message || 'No se pudo eliminar el proyecto.');
      throw err;
    }
  }, [refresh]);

  // --------------------------------------------------
  // CARGA INICIAL
  // --------------------------------------------------

  useEffect(() => {
    try {
      refresh();
    } catch {
      // El error ya queda registrado en el estado del hook.
    }
  }, [refresh]);

  return {
    projects,
    recentProjects,
    upcomingProjects,
    overdueProjects,
    statistics,
    loading,
    error,

    refresh,
    addProject,
    editProject,
    removeProject,
  };
}
