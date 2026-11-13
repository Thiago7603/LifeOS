// src/features/projects/hooks/useTasks.js

import { useCallback, useEffect, useState } from 'react';

import {
  getTasksByProject,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  getSubtasksByTask,
  createSubtask,
  updateSubtask,
  toggleSubtask,
  deleteSubtask,
} from '../../../database/repositories/projectsRepository';

export function useTasks(projectId, onTasksChanged) {
  const [tasks, setTasks] = useState([]);
  const [subtasks, setSubtasks] = useState([]);
  const [subtasksTaskId, setSubtasksTaskId] = useState(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // --------------------------------------------------
  // CONSULTAR TAREAS DEL PROYECTO
  // --------------------------------------------------

  const refresh = useCallback(() => {
    setError(null);

    if (!projectId) {
      setTasks([]);
      setLoading(false);
      return [];
    }

    setLoading(true);

    try {
      const tasksData = getTasksByProject(projectId);
      setTasks(tasksData);
      return tasksData;
    } catch (err) {
      console.error('Error consultando tareas:', err);
      setError(err.message || 'No se pudieron cargar las tareas.');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  // --------------------------------------------------
  // CREAR TAREA
  // --------------------------------------------------

  const addTask = useCallback((data) => {
    try {
      if (!projectId) {
        throw new Error('Selecciona un proyecto para crear una tarea.');
      }

      setError(null);

      const newTask = createTask({
        ...data,
        project_id: projectId,
      });

      refresh();
      onTasksChanged?.();

      return newTask;
    } catch (err) {
      console.error('Error creando tarea:', err);
      setError(err.message || 'No se pudo crear la tarea.');
      throw err;
    }
  }, [projectId, refresh, onTasksChanged]);

  // --------------------------------------------------
  // ACTUALIZAR TAREA
  // --------------------------------------------------

  const editTask = useCallback((id, data) => {
    try {
      setError(null);

      const updatedTask = updateTask(id, data);

      refresh();
      onTasksChanged?.();

      return updatedTask;
    } catch (err) {
      console.error('Error actualizando tarea:', err);
      setError(err.message || 'No se pudo actualizar la tarea.');
      throw err;
    }
  }, [refresh, onTasksChanged]);

  // --------------------------------------------------
  // CAMBIAR ESTADO DE TAREA
  // --------------------------------------------------

  const changeTaskStatus = useCallback((id, status) => {
    try {
      setError(null);

      const updatedTask = updateTaskStatus(id, status);

      refresh();
      onTasksChanged?.();

      return updatedTask;
    } catch (err) {
      console.error('Error cambiando estado de tarea:', err);
      setError(err.message || 'No se pudo cambiar el estado.');
      throw err;
    }
  }, [refresh, onTasksChanged]);

  // --------------------------------------------------
  // ELIMINAR TAREA
  // --------------------------------------------------

  const removeTask = useCallback((id) => {
    try {
      setError(null);

      const deleted = deleteTask(id);

      if (Number(subtasksTaskId) === Number(id)) {
        setSubtasks([]);
        setSubtasksTaskId(null);
      }

      refresh();
      onTasksChanged?.();

      return deleted;
    } catch (err) {
      console.error('Error eliminando tarea:', err);
      setError(err.message || 'No se pudo eliminar la tarea.');
      throw err;
    }
  }, [refresh, subtasksTaskId, onTasksChanged]);

  // --------------------------------------------------
  // CONSULTAR UNA TAREA
  // --------------------------------------------------

  const getTask = useCallback((id) => {
    try {
      return getTaskById(id);
    } catch (err) {
      console.error('Error consultando tarea:', err);
      setError(err.message || 'No se pudo consultar la tarea.');
      throw err;
    }
  }, []);

  // --------------------------------------------------
  // CONSULTAR SUBTAREAS
  // --------------------------------------------------

  const loadSubtasks = useCallback((taskId) => {
    try {
      const data = getSubtasksByTask(taskId);
      setSubtasks(data);
      setSubtasksTaskId(Number(taskId));
      return data;
    } catch (err) {
      console.error('Error consultando subtareas:', err);
      setError(err.message || 'No se pudieron cargar las subtareas.');
      throw err;
    }
  }, []);

  // --------------------------------------------------
  // CREAR SUBTAREA
  // --------------------------------------------------

  const addSubtask = useCallback((data) => {
    try {
      setError(null);
      const newSubtask = createSubtask(data);
      loadSubtasks(data.task_id);
      refresh();
      onTasksChanged?.();
      return newSubtask;
    } catch (err) {
      console.error('Error creando subtarea:', err);
      setError(err.message || 'No se pudo crear la subtarea.');
      throw err;
    }
  }, [loadSubtasks, refresh, onTasksChanged]);

  // --------------------------------------------------
  // ACTUALIZAR SUBTAREA
  // --------------------------------------------------

  const editSubtask = useCallback((id, data) => {
    try {
      setError(null);
      const updatedSubtask = updateSubtask(id, data);
      if (subtasksTaskId !== null) {
        loadSubtasks(subtasksTaskId);
      }
      refresh();
      onTasksChanged?.();
      return updatedSubtask;
    } catch (err) {
      console.error('Error actualizando subtarea:', err);
      setError(err.message || 'No se pudo actualizar la subtarea.');
      throw err;
    }
  }, [loadSubtasks, subtasksTaskId, refresh, onTasksChanged]);

  // --------------------------------------------------
  // MARCAR / DESMARCAR SUBTAREA
  // --------------------------------------------------

  const toggleSubtaskStatus = useCallback((id) => {
    try {
      setError(null);
      const updatedSubtask = toggleSubtask(id);
      if (subtasksTaskId !== null) {
        loadSubtasks(subtasksTaskId);
      }
      refresh();
      onTasksChanged?.();
      return updatedSubtask;
    } catch (err) {
      console.error('Error cambiando subtarea:', err);
      setError(err.message || 'No se pudo cambiar la subtarea.');
      throw err;
    }
  }, [loadSubtasks, subtasksTaskId, refresh, onTasksChanged]);

  // --------------------------------------------------
  // ELIMINAR SUBTAREA
  // --------------------------------------------------

  const removeSubtask = useCallback((id) => {
    try {
      setError(null);
      const deleted = deleteSubtask(id);
      if (subtasksTaskId !== null) {
        loadSubtasks(subtasksTaskId);
      }
      refresh();
      onTasksChanged?.();
      return deleted;
    } catch (err) {
      console.error('Error eliminando subtarea:', err);
      setError(err.message || 'No se pudo eliminar la subtarea.');
      throw err;
    }
  }, [loadSubtasks, subtasksTaskId, refresh, onTasksChanged]);

  // --------------------------------------------------
  // CARGA INICIAL Y CAMBIO DE PROYECTO
  // --------------------------------------------------

  useEffect(() => {
    setSubtasks([]);
    setSubtasksTaskId(null);

    try {
      refresh();
    } catch {
      // El error ya queda registrado en el estado del hook.
    }
  }, [refresh]);

  return {
    tasks,
    subtasks,
    subtasksTaskId,
    loading,
    error,

    refresh,
    addTask,
    editTask,
    changeTaskStatus,
    removeTask,
    getTask,

    loadSubtasks,
    addSubtask,
    editSubtask,
    toggleSubtaskStatus,
    removeSubtask,
  };
}
