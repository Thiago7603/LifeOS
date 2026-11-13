// src/database/repositories/projectsRepository.js
import { db } from '../db';
import { getLocalDate, addDays } from '../../utils/dateUtils';

// ======================================================
// 1. CONSTANTES
// ======================================================

export const PROJECT_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  ARCHIVED: 'archived',
};

export const TASK_STATUS = {
  PENDING: 'pending',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
};

export const PRIORITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent',
};

// ======================================================
// 2. UTILIDADES Y VALIDACIONES
// ======================================================

function validateTitle(title, entity = 'El registro') {
  if (typeof title !== 'string' || !title.trim()) {
    throw new Error(`${entity} necesita un título.`);
  }

  return title.trim();
}

function validateDate(date, fieldName) {
  if (date === null || date === undefined || date === '') {
    return null;
  }

  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date)
  ) {
    throw new Error(`${fieldName} debe tener formato YYYY-MM-DD.`);
  }

  const parsedDate = new Date(`${date}T00:00:00.000Z`);

  if (
    Number.isNaN(parsedDate.getTime()) ||
    parsedDate.toISOString().slice(0, 10) !== date
  ) {
    throw new Error(`${fieldName} no es una fecha válida.`);
  }

  return date;
}

function validatePriority(priority = PRIORITY.MEDIUM) {
  const allowed = Object.values(PRIORITY);

  if (!allowed.includes(priority)) {
    throw new Error('La prioridad seleccionada no es válida.');
  }

  return priority;
}

function validateProjectStatus(status = PROJECT_STATUS.ACTIVE) {
  const allowed = Object.values(PROJECT_STATUS);

  if (!allowed.includes(status)) {
    throw new Error('El estado del proyecto no es válido.');
  }

  return status;
}

function validateTaskStatus(status = TASK_STATUS.PENDING) {
  const allowed = Object.values(TASK_STATUS);

  if (!allowed.includes(status)) {
    throw new Error('El estado de la tarea no es válido.');
  }

  return status;
}

function validateId(id, entity = 'Registro') {
  const parsedId = Number(id);

  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    throw new Error(`${entity}: identificador no válido.`);
  }

  return parsedId;
}

function validatePosition(position, currentPosition = 0) {
  if (position === undefined || position === null) {
    return Number(currentPosition || 0);
  }

  const parsedPosition = Number(position);

  if (!Number.isInteger(parsedPosition) || parsedPosition < 0) {
    throw new Error('La posición no es válida.');
  }

  return parsedPosition;
}

function enrichProject(project) {
  if (!project) return null;

  const today = getLocalDate();
  const totalTasks = Number(project.total_tasks || 0);
  const completedTasks = Number(project.completed_tasks || 0);
  const dueDate = project.due_date;
  const isCompleted = project.status === PROJECT_STATUS.COMPLETED;

  const isOverdue = Boolean(dueDate && dueDate < today && !isCompleted);
  const isUpcoming = Boolean(
    dueDate &&
    dueDate >= today &&
    dueDate <= addDays(today, 7) &&
    !isCompleted
  );

  return {
    ...project,
    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    progress: totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0,
    is_overdue: isOverdue,
    is_upcoming: isUpcoming,
  };
}

// ======================================================
// 3. PROYECTOS: CONSULTAS
// ======================================================

export function getProjects() {
  const projects = db.getAllSync(`
    SELECT
      p.*,
      COUNT(t.id) AS total_tasks,
      SUM(
        CASE
          WHEN t.status = 'completed' THEN 1
          ELSE 0
        END
      ) AS completed_tasks
    FROM projects p
    LEFT JOIN project_tasks t
      ON t.project_id = p.id
    GROUP BY p.id
    ORDER BY
      CASE p.status
        WHEN 'active' THEN 1
        WHEN 'paused' THEN 2
        WHEN 'completed' THEN 3
        ELSE 4
      END,
      p.created_at DESC
  `);

  return projects.map(enrichProject);
}

export function getProjectById(id) {
  const projectId = validateId(id, 'Proyecto');

  const project = db.getFirstSync(`
    SELECT
      p.*,
      COUNT(t.id) AS total_tasks,
      SUM(
        CASE
          WHEN t.status = 'completed' THEN 1
          ELSE 0
        END
      ) AS completed_tasks
    FROM projects p
    LEFT JOIN project_tasks t
      ON t.project_id = p.id
    WHERE p.id = ?
    GROUP BY p.id
  `, [projectId]);

  return enrichProject(project);
}

export function getRecentProjects(limit = 4) {
  const projects = db.getAllSync(`
    SELECT
      p.*,
      COUNT(t.id) AS total_tasks,
      SUM(
        CASE
          WHEN t.status = 'completed' THEN 1
          ELSE 0
        END
      ) AS completed_tasks
    FROM projects p
    LEFT JOIN project_tasks t
      ON t.project_id = p.id
    GROUP BY p.id
    ORDER BY p.created_at DESC
    LIMIT ?
  `, [limit]);

  return projects.map(enrichProject);
}

export function getUpcomingDueProjects(limit = 4) {
  const today = getLocalDate();

  const projects = db.getAllSync(`
    SELECT
      p.*,
      COUNT(t.id) AS total_tasks,
      SUM(
        CASE
          WHEN t.status = 'completed' THEN 1
          ELSE 0
        END
      ) AS completed_tasks
    FROM projects p
    LEFT JOIN project_tasks t
      ON t.project_id = p.id
    WHERE p.due_date IS NOT NULL
      AND p.due_date >= ?
      AND p.status != 'completed'
    GROUP BY p.id
    ORDER BY p.due_date ASC
    LIMIT ?
  `, [today, limit]);

  return projects.map(enrichProject);
}

export function getOverdueProjects() {
  const today = getLocalDate();

  const projects = db.getAllSync(`
    SELECT
      p.*,
      COUNT(t.id) AS total_tasks,
      SUM(
        CASE
          WHEN t.status = 'completed' THEN 1
          ELSE 0
        END
      ) AS completed_tasks
    FROM projects p
    LEFT JOIN project_tasks t
      ON t.project_id = p.id
    WHERE p.due_date IS NOT NULL
      AND p.due_date < ?
      AND p.status != 'completed'
    GROUP BY p.id
    ORDER BY p.due_date ASC
  `, [today]);

  return projects.map(enrichProject);
}

// ======================================================
// 4. PROYECTOS: CREAR, EDITAR Y ELIMINAR
// ======================================================

export function createProject(data) {
  const title = validateTitle(data?.title, 'El proyecto');
  const description = data?.description?.trim() || null;
  const priority = validatePriority(data?.priority);
  const status = validateProjectStatus(data?.status);
  const startDate = validateDate(data?.start_date, 'La fecha de inicio');
  const dueDate = validateDate(data?.due_date, 'La fecha límite');

  if (startDate && dueDate && dueDate < startDate) {
    throw new Error(
      'La fecha límite no puede ser anterior a la fecha de inicio.'
    );
  }

  const result = db.runSync(`
    INSERT INTO projects (
      title,
      description,
      priority,
      status,
      start_date,
      due_date
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `, [
    title,
    description,
    priority,
    status,
    startDate,
    dueDate,
  ]);

  return getProjectById(result.lastInsertRowId);
}

export function updateProject(id, data = {}) {
  data = data ?? {};
  const projectId = validateId(id, 'Proyecto');

  const current = getProjectById(projectId);
  if (!current) {
    throw new Error('El proyecto no existe.');
  }

  const title = data.title !== undefined
    ? validateTitle(data.title, 'El proyecto')
    : current.title;

  const description = data.description !== undefined
    ? (data.description?.trim() || null)
    : current.description;

  const priority = data.priority !== undefined
    ? validatePriority(data.priority)
    : current.priority;

  const status = data.status !== undefined
    ? validateProjectStatus(data.status)
    : current.status;

  const startDate = data.start_date !== undefined
    ? validateDate(data.start_date, 'La fecha de inicio')
    : current.start_date;

  const dueDate = data.due_date !== undefined
    ? validateDate(data.due_date, 'La fecha límite')
    : current.due_date;

  if (startDate && dueDate && dueDate < startDate) {
    throw new Error(
      'La fecha límite no puede ser anterior a la fecha de inicio.'
    );
  }

  db.runSync(`
    UPDATE projects
    SET
      title = ?,
      description = ?,
      priority = ?,
      status = ?,
      start_date = ?,
      due_date = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    title,
    description,
    priority,
    status,
    startDate,
    dueDate,
    projectId,
  ]);

  return getProjectById(projectId);
}

export function deleteProject(id) {
  const projectId = validateId(id, 'Proyecto');

  const result = db.runSync(
    'DELETE FROM projects WHERE id = ?',
    [projectId]
  );

  return result.changes > 0;
}

// ======================================================
// 5. TAREAS: CONSULTAS
// ======================================================

export function getTasksByProject(projectId) {
  const id = validateId(projectId, 'Proyecto');

  const tasks = db.getAllSync(`
    SELECT
      t.*,
      COUNT(s.id) AS total_subtasks,
      SUM(
        CASE
          WHEN s.completed = 1 THEN 1
          ELSE 0
        END
      ) AS completed_subtasks
    FROM project_tasks t
    LEFT JOIN project_subtasks s
      ON s.task_id = t.id
    WHERE t.project_id = ?
    GROUP BY t.id
    ORDER BY t.position ASC, t.created_at ASC
  `, [id]);

  const today = getLocalDate();

  return tasks.map(task => ({
    ...task,
    total_subtasks: Number(task.total_subtasks || 0),
    completed_subtasks: Number(task.completed_subtasks || 0),
    is_overdue: Boolean(
      task.due_date &&
      task.due_date < today &&
      task.status !== TASK_STATUS.COMPLETED
    ),
  }));
}

export function getTaskById(id) {
  const taskId = validateId(id, 'Tarea');

  const task = db.getFirstSync(`
    SELECT
      t.*,
      COUNT(s.id) AS total_subtasks,
      SUM(
        CASE
          WHEN s.completed = 1 THEN 1
          ELSE 0
        END
      ) AS completed_subtasks
    FROM project_tasks t
    LEFT JOIN project_subtasks s
      ON s.task_id = t.id
    WHERE t.id = ?
    GROUP BY t.id
  `, [taskId]);

  if (!task) return null;

  const today = getLocalDate();

  return {
    ...task,
    total_subtasks: Number(task.total_subtasks || 0),
    completed_subtasks: Number(task.completed_subtasks || 0),
    is_overdue: Boolean(
      task.due_date &&
      task.due_date < today &&
      task.status !== TASK_STATUS.COMPLETED
    ),
  };
}

// ======================================================
// 6. TAREAS: CREAR, EDITAR Y ELIMINAR
// ======================================================

export function createTask(data) {
  const projectId = validateId(data?.project_id, 'Proyecto');
  const project = getProjectById(projectId);

  if (!project) {
    throw new Error(
      'No se puede crear una tarea: el proyecto no existe.'
    );
  }

  const title = validateTitle(data?.title, 'La tarea');
  const description = data?.description?.trim() || null;
  const status = validateTaskStatus(data?.status);
  const priority = validatePriority(data?.priority);
  const dueDate = validateDate(data?.due_date, 'La fecha límite');
  const position = validatePosition(data?.position);

  const result = db.runSync(`
    INSERT INTO project_tasks (
      project_id,
      title,
      description,
      status,
      priority,
      due_date,
      position
    )
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `, [
    projectId,
    title,
    description,
    status,
    priority,
    dueDate,
    position,
  ]);

  return getTaskById(result.lastInsertRowId);
}

export function updateTask(id, data = {}) {
  data = data ?? {};
  const taskId = validateId(id, 'Tarea');

  const current = getTaskById(taskId);
  if (!current) {
    throw new Error('La tarea no existe.');
  }

  const title = data.title !== undefined
    ? validateTitle(data.title, 'La tarea')
    : current.title;

  const description = data.description !== undefined
    ? (data.description?.trim() || null)
    : current.description;

  const status = data.status !== undefined
    ? validateTaskStatus(data.status)
    : current.status;

  const priority = data.priority !== undefined
    ? validatePriority(data.priority)
    : current.priority;

  const dueDate = data.due_date !== undefined
    ? validateDate(data.due_date, 'La fecha límite')
    : current.due_date;

  const position = validatePosition(
    data.position,
    current.position
  );

  db.runSync(`
    UPDATE project_tasks
    SET
      title = ?,
      description = ?,
      status = ?,
      priority = ?,
      due_date = ?,
      position = ?,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `, [
    title,
    description,
    status,
    priority,
    dueDate,
    position,
    taskId,
  ]);

  return getTaskById(taskId);
}

export function updateTaskStatus(id, status) {
  return updateTask(id, { status });
}

export function deleteTask(id) {
  const taskId = validateId(id, 'Tarea');

  const result = db.runSync(
    'DELETE FROM project_tasks WHERE id = ?',
    [taskId]
  );

  return result.changes > 0;
}

// ======================================================
// 7. SUBTAREAS: CONSULTAS
// ======================================================

export function getSubtasksByTask(taskId) {
  const id = validateId(taskId, 'Tarea');

  return db.getAllSync(`
    SELECT *
    FROM project_subtasks
    WHERE task_id = ?
    ORDER BY position ASC, created_at ASC
  `, [id]);
}

// ======================================================
// 8. SUBTAREAS: CREAR, EDITAR Y ELIMINAR
// ======================================================

export function createSubtask(data) {
  const taskId = validateId(data?.task_id, 'Tarea');
  const task = getTaskById(taskId);

  if (!task) {
    throw new Error(
      'No se puede crear la subtarea: la tarea no existe.'
    );
  }

  const title = validateTitle(data?.title, 'La subtarea');
  const position = validatePosition(data?.position);

  const result = db.runSync(`
    INSERT INTO project_subtasks (
      task_id,
      title,
      position
    )
    VALUES (?, ?, ?)
  `, [
    taskId,
    title,
    position,
  ]);

  return db.getFirstSync(
    'SELECT * FROM project_subtasks WHERE id = ?',
    [result.lastInsertRowId]
  );
}

export function updateSubtask(id, data = {}) {
  data = data ?? {};
  const subtaskId = validateId(id, 'Subtarea');

  const current = db.getFirstSync(
    'SELECT * FROM project_subtasks WHERE id = ?',
    [subtaskId]
  );

  if (!current) {
    throw new Error('La subtarea no existe.');
  }

  const title = data.title !== undefined
    ? validateTitle(data.title, 'La subtarea')
    : current.title;

  const completed = data.completed !== undefined
    ? (data.completed ? 1 : 0)
    : current.completed;

  const position = validatePosition(
    data.position,
    current.position
  );

  db.runSync(`
    UPDATE project_subtasks
    SET
      title = ?,
      completed = ?,
      position = ?
    WHERE id = ?
  `, [
    title,
    completed,
    position,
    subtaskId,
  ]);

  return db.getFirstSync(
    'SELECT * FROM project_subtasks WHERE id = ?',
    [subtaskId]
  );
}

export function toggleSubtask(id) {
  const subtaskId = validateId(id, 'Subtarea');

  const result = db.runSync(`
    UPDATE project_subtasks
    SET completed =
      CASE
        WHEN completed = 1 THEN 0
        ELSE 1
      END
    WHERE id = ?
  `, [subtaskId]);

  if (result.changes === 0) {
    throw new Error('La subtarea no existe.');
  }

  return db.getFirstSync(
    'SELECT * FROM project_subtasks WHERE id = ?',
    [subtaskId]
  );
}

export function deleteSubtask(id) {
  const subtaskId = validateId(id, 'Subtarea');

  const result = db.runSync(
    'DELETE FROM project_subtasks WHERE id = ?',
    [subtaskId]
  );

  return result.changes > 0;
}

// ======================================================
// 9. ESTADÍSTICAS GENERALES
// ======================================================

export function getProjectStatistics() {
  const projects = db.getFirstSync(`
    SELECT
      COUNT(*) AS total_projects,
      SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END) AS active_projects,
      SUM(CASE WHEN status = 'paused' THEN 1 ELSE 0 END) AS paused_projects,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_projects,
      SUM(CASE WHEN status = 'archived' THEN 1 ELSE 0 END) AS archived_projects
    FROM projects
  `);

  const tasks = db.getFirstSync(`
    SELECT
      COUNT(*) AS total_tasks,
      SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_tasks,
      SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) AS pending_tasks,
      SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) AS in_progress_tasks,
      SUM(CASE WHEN status = 'review' THEN 1 ELSE 0 END) AS review_tasks,
      SUM(
        CASE
          WHEN due_date IS NOT NULL
            AND due_date < ?
            AND status != 'completed'
          THEN 1
          ELSE 0
        END
      ) AS overdue_tasks
    FROM project_tasks
  `, [getLocalDate()]);

  const totalProjects = Number(projects?.total_projects || 0);
  const totalTasks = Number(tasks?.total_tasks || 0);
  const completedTasks = Number(tasks?.completed_tasks || 0);

  return {
    total_projects: totalProjects,
    active_projects: Number(projects?.active_projects || 0),
    paused_projects: Number(projects?.paused_projects || 0),
    completed_projects: Number(projects?.completed_projects || 0),
    archived_projects: Number(projects?.archived_projects || 0),

    total_tasks: totalTasks,
    completed_tasks: completedTasks,
    pending_tasks: Number(tasks?.pending_tasks || 0),
    in_progress_tasks: Number(tasks?.in_progress_tasks || 0),
    review_tasks: Number(tasks?.review_tasks || 0),
    overdue_tasks: Number(tasks?.overdue_tasks || 0),

    overall_progress: totalTasks > 0
      ? Math.round((completedTasks / totalTasks) * 100)
      : 0,
  };
}
