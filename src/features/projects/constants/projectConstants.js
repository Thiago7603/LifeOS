// src/features/projects/constants/projectConstants.js

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

export const PROJECT_STATUS_LABELS = {
  [PROJECT_STATUS.ACTIVE]: 'Activo',
  [PROJECT_STATUS.PAUSED]: 'Pausado',
  [PROJECT_STATUS.COMPLETED]: 'Completado',
  [PROJECT_STATUS.ARCHIVED]: 'Archivado',
};

export const TASK_STATUS_LABELS = {
  [TASK_STATUS.PENDING]: 'Pendiente',
  [TASK_STATUS.IN_PROGRESS]: 'En progreso',
  [TASK_STATUS.REVIEW]: 'En revisión',
  [TASK_STATUS.COMPLETED]: 'Completada',
};

export const PRIORITY_LABELS = {
  [PRIORITY.LOW]: 'Baja',
  [PRIORITY.MEDIUM]: 'Media',
  [PRIORITY.HIGH]: 'Alta',
  [PRIORITY.URGENT]: 'Urgente',
};

export const PROJECT_STATUS_OPTIONS = [
  { value: PROJECT_STATUS.ACTIVE, label: 'Activo' },
  { value: PROJECT_STATUS.PAUSED, label: 'Pausado' },
  { value: PROJECT_STATUS.COMPLETED, label: 'Completado' },
  { value: PROJECT_STATUS.ARCHIVED, label: 'Archivado' },
];

export const TASK_STATUS_OPTIONS = [
  { value: TASK_STATUS.PENDING, label: 'Pendiente' },
  { value: TASK_STATUS.IN_PROGRESS, label: 'En progreso' },
  { value: TASK_STATUS.REVIEW, label: 'En revisión' },
  { value: TASK_STATUS.COMPLETED, label: 'Completada' },
];

export const PRIORITY_OPTIONS = [
  { value: PRIORITY.LOW, label: 'Baja' },
  { value: PRIORITY.MEDIUM, label: 'Media' },
  { value: PRIORITY.HIGH, label: 'Alta' },
  { value: PRIORITY.URGENT, label: 'Urgente' },
];

export const DUE_FILTER_OPTIONS = [
  { value: 'all', label: 'Todas las fechas' },
  { value: 'overdue', label: 'Vencidos' },
  { value: 'upcoming', label: 'Próximos 7 días' },
  { value: 'has_due', label: 'Con fecha' },
  { value: 'no_due', label: 'Sin fecha' },
];

export const SORT_OPTIONS = [
  { value: 'created_desc', label: 'Más recientes' },
  { value: 'created_asc', label: 'Más antiguos' },
  { value: 'due_asc', label: 'Próximos a vencer' },
  { value: 'priority_desc', label: 'Mayor prioridad' },
  { value: 'progress_desc', label: 'Mayor progreso' },
  { value: 'title_asc', label: 'Alfabético (A-Z)' },
];

export const KANBAN_COLUMNS = [
  {
    id: TASK_STATUS.PENDING,
    title: 'Pendientes',
    icon: 'ellipse-outline',
  },
  {
    id: TASK_STATUS.IN_PROGRESS,
    title: 'En progreso',
    icon: 'time-outline',
  },
  {
    id: TASK_STATUS.REVIEW,
    title: 'En revisión',
    icon: 'eye-outline',
  },
  {
    id: TASK_STATUS.COMPLETED,
    title: 'Completadas',
    icon: 'checkmark-circle-outline',
  },
];

export const KANBAN_NEXT_STATUS = {
  [TASK_STATUS.PENDING]: TASK_STATUS.IN_PROGRESS,
  [TASK_STATUS.IN_PROGRESS]: TASK_STATUS.REVIEW,
  [TASK_STATUS.REVIEW]: TASK_STATUS.COMPLETED,
  [TASK_STATUS.COMPLETED]: null,
};

export const KANBAN_PREV_STATUS = {
  [TASK_STATUS.PENDING]: null,
  [TASK_STATUS.IN_PROGRESS]: TASK_STATUS.PENDING,
  [TASK_STATUS.REVIEW]: TASK_STATUS.IN_PROGRESS,
  [TASK_STATUS.COMPLETED]: TASK_STATUS.REVIEW,
};
