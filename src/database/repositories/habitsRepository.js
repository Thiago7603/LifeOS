// src/database/repositories/habitsRepository.js
// Repositorio de Hábitos: lógica de negocio, normalización, cálculo de rachas,
// CRUD y motor de estadísticas. Importa la conexión singleton desde db.js.

import { db } from '../db';
import {
  DAY_NAMES,
  getLocalDate,
  addDays,
  getDayNumber,
  getMonday,
} from '../../utils/dateUtils';

// --------------------------------------------------
// NORMALIZACIÓN DE HÁBITOS
// --------------------------------------------------

export function normalizeHabit(habit) {
  let days = [];

  try {
    days = typeof habit.frequency_days === 'string'
      ? JSON.parse(habit.frequency_days || '[]')
      : Array.isArray(habit.frequency_days)
        ? habit.frequency_days
        : [];
  } catch {
    days = [];
  }

  days = [...new Set(
    days.map(Number).filter(day => day >= 1 && day <= 7)
  )].sort((a, b) => a - b);

  const frequencyType = [
    'daily',
    'specific_days',
    'weekly',
  ].includes(habit.frequency_type)
    ? habit.frequency_type
    : 'daily';

  const weeklyTarget = Math.max(
    1,
    Math.min(7, Number(habit.weekly_target) || 3)
  );

  return {
    ...habit,
    frequency_type: frequencyType,
    frequency_days: days,
    weekly_target: weeklyTarget,
  };
}

export function getExpectedDates(habit, startDate, endDate) {
  const dates = [];
  const normalized = normalizeHabit(habit);

  for (
    let date = startDate;
    date <= endDate;
    date = addDays(date, 1)
  ) {
    if (normalized.frequency_type === 'daily') {
      dates.push(date);
    } else if (
      normalized.frequency_type === 'specific_days' &&
      normalized.frequency_days.includes(getDayNumber(date))
    ) {
      dates.push(date);
    }
  }

  return dates;
}

// --------------------------------------------------
// HELPERS PRIVADOS: evitar duplicación en getHabits / getHabitById
// --------------------------------------------------

/**
 * Enriquece un hábito crudo con completaciones, racha, estado semanal y
 * bandera `isScheduledToday`.
 * @param {object} habit  Fila cruda de la tabla `habits`.
 * @returns {object}
 */
function enrichHabit(habit) {
  const today = getLocalDate();
  const currentMonday = getMonday(today);
  const currentSunday = addDays(currentMonday, 6);
  const todayDayNumber = getDayNumber(today);

  const completions = db.getAllSync(
    `SELECT completion_date
     FROM habit_completions
     WHERE habit_id = ?
     ORDER BY completion_date DESC`,
    [habit.id]
  );

  const completionDates = completions.map(item => item.completion_date);
  const normalized = normalizeHabit(habit);
  const completedToday = completionDates.includes(today) ? 1 : 0;

  const weekCompletions = completionDates.filter(
    date => date >= currentMonday && date <= currentSunday
  );
  const weeklyCompletionsCount = weekCompletions.length;
  const weeklyTarget = normalized.weekly_target;
  const isWeeklyGoalMet = weeklyCompletionsCount >= weeklyTarget;

  let isScheduledToday = false;
  if (normalized.frequency_type === 'daily') {
    isScheduledToday = true;
  } else if (normalized.frequency_type === 'specific_days') {
    isScheduledToday =
      normalized.frequency_days.includes(todayDayNumber) || completedToday === 1;
  } else if (normalized.frequency_type === 'weekly') {
    isScheduledToday = completedToday === 1 || !isWeeklyGoalMet;
  }

  return {
    ...normalized,
    completed: completedToday,
    streak: calculateHabitStreak(habit, completionDates),
    weeklyCompletionsCount,
    weeklyTarget,
    isWeeklyGoalMet,
    isScheduledToday,
    completionDates,
  };
}

/**
 * Construye los parámetros de frecuencia comunes a createHabit y updateHabit.
 * Lanza Error si se selecciona `specific_days` sin ningún día.
 * @param {object} habit  Payload del formulario.
 * @returns {{ frequencyType, frequencyDays, weeklyTarget, frequencyLabel }}
 */
function buildFrequencyParams(habit) {
  const frequencyType = habit.frequencyType || habit.frequency_type || 'daily';
  const rawDays = habit.frequencyDays || habit.frequency_days || [];
  const frequencyDays = frequencyType === 'specific_days'
    ? [...new Set(rawDays.map(Number).filter(d => d >= 1 && d <= 7))].sort((a, b) => a - b)
    : [];

  if (frequencyType === 'specific_days' && frequencyDays.length === 0) {
    throw new Error('Selecciona al menos un día de la semana.');
  }

  const weeklyTarget = Math.max(
    1,
    Math.min(7, Number(habit.weeklyTarget ?? habit.weekly_target) || 3)
  );

  const frequencyLabel =
    frequencyType === 'daily'
      ? 'Diario'
      : frequencyType === 'specific_days'
        ? `Días: ${frequencyDays.map(day => DAY_NAMES[day - 1]).join(', ')}`
        : `${weeklyTarget} veces por semana`;

  return { frequencyType, frequencyDays, weeklyTarget, frequencyLabel };
}

// --------------------------------------------------
// CÁLCULO DE RACHAS (MOTOR BLINDADO)
// --------------------------------------------------

function calculateDailyOrSpecificStreak(habit, completionDates) {
  const completed = new Set(completionDates);
  const today = getLocalDate();
  const normalized = normalizeHabit(habit);
  const createdDate = habit.created_at ? habit.created_at.slice(0, 10) : '2000-01-01';

  let currentDate = today;

  if (!completed.has(today)) {
    currentDate = addDays(today, -1);
  }

  let streak = 0;

  while (currentDate >= createdDate) {
    const scheduled =
      normalized.frequency_type === 'daily' ||
      normalized.frequency_days.includes(getDayNumber(currentDate));

    if (scheduled) {
      if (completed.has(currentDate)) {
        streak++;
      } else {
        break;
      }
    }

    currentDate = addDays(currentDate, -1);
  }

  return streak;
}

function calculateWeeklyStreak(habit, completionDates) {
  const normalized = normalizeHabit(habit);
  const completed = new Set(completionDates);
  const today = getLocalDate();
  const currentMonday = getMonday(today);
  const createdDate = habit.created_at ? habit.created_at.slice(0, 10) : '2000-01-01';

  let weekStart = currentMonday;
  let streak = 0;

  const currentWeekDates = [];
  for (let i = 0; i < 7; i++) {
    const date = addDays(currentMonday, i);
    if (date <= today && date >= createdDate) {
      currentWeekDates.push(date);
    }
  }

  const currentWeekCount = currentWeekDates.filter(
    date => completed.has(date)
  ).length;

  if (currentWeekCount < normalized.weekly_target) {
    weekStart = addDays(currentMonday, -7);
  }

  while (weekStart >= getMonday(createdDate)) {
    let count = 0;

    for (let i = 0; i < 7; i++) {
      const date = addDays(weekStart, i);

      if (
        date >= createdDate &&
        date <= today &&
        completed.has(date)
      ) {
        count++;
      }
    }

    if (count >= normalized.weekly_target) {
      streak++;
      weekStart = addDays(weekStart, -7);
    } else {
      break;
    }
  }

  return streak;
}

export function calculateHabitStreak(habit, completionDates) {
  const normalized = normalizeHabit(habit);

  if (normalized.frequency_type === 'weekly') {
    return calculateWeeklyStreak(habit, completionDates);
  }

  return calculateDailyOrSpecificStreak(habit, completionDates);
}

// --------------------------------------------------
// CONSULTA DE HÁBITOS
// --------------------------------------------------

export function getHabits() {
  const habits = db.getAllSync('SELECT * FROM habits ORDER BY id DESC');
  return habits.map(habit => enrichHabit(habit));
}

export function getHabitById(id) {
  const habits = db.getAllSync('SELECT * FROM habits WHERE id = ?', [id]);
  if (!habits || habits.length === 0) return null;
  return enrichHabit(habits[0]);
}

// --------------------------------------------------
// CREAR HÁBITO
// --------------------------------------------------

export function createHabit(habit) {
  const { frequencyType, frequencyDays, weeklyTarget, frequencyLabel } =
    buildFrequencyParams(habit);

  const statement = db.prepareSync(`
    INSERT INTO habits (
      title,
      description,
      category,
      frequency,
      frequency_type,
      frequency_days,
      weekly_target,
      target_minutes,
      reminder_time
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  try {
    const result = statement.executeSync([
      habit.title.trim(),
      habit.description ? habit.description.trim() : '',
      habit.category,
      frequencyLabel,
      frequencyType,
      JSON.stringify(frequencyDays),
      weeklyTarget,
      Number(habit.targetMinutes ?? habit.target_minutes) || 0,
      habit.reminderTime || habit.reminder_time || null,
    ]);

    return result.lastInsertRowId;
  } finally {
    statement.finalizeSync();
  }
}

// --------------------------------------------------
// ACTUALIZAR HÁBITO
// --------------------------------------------------

export function updateHabit(id, habit) {
  const { frequencyType, frequencyDays, weeklyTarget, frequencyLabel } =
    buildFrequencyParams(habit);

  db.runSync(
    `UPDATE habits
     SET title = ?,
         description = ?,
         category = ?,
         frequency = ?,
         frequency_type = ?,
         frequency_days = ?,
         weekly_target = ?,
         target_minutes = ?,
         reminder_time = ?
     WHERE id = ?`,
    [
      habit.title.trim(),
      habit.description ? habit.description.trim() : '',
      habit.category,
      frequencyLabel,
      frequencyType,
      JSON.stringify(frequencyDays),
      weeklyTarget,
      Number(habit.targetMinutes ?? habit.target_minutes) || 0,
      habit.reminderTime || habit.reminder_time || null,
      id,
    ]
  );
}

// --------------------------------------------------
// ELIMINAR HÁBITO (con cascada manual de completaciones)
// --------------------------------------------------

export function deleteHabit(id) {
  db.runSync('DELETE FROM habit_completions WHERE habit_id = ?', [id]);
  db.runSync('DELETE FROM habits WHERE id = ?', [id]);
}

// --------------------------------------------------
// ALTERNAR CUMPLIMIENTO
// --------------------------------------------------

export function toggleHabitCompletion(id, completed) {
  const today = getLocalDate();

  if (completed === 1 || completed === true) {
    db.runSync(
      `INSERT OR IGNORE INTO habit_completions
       (habit_id, completion_date)
       VALUES (?, ?)`,
      [id, today]
    );
  } else {
    db.runSync(
      `DELETE FROM habit_completions
       WHERE habit_id = ? AND completion_date = ?`,
      [id, today]
    );
  }
}

// --------------------------------------------------
// HISTORIAL DE COMPLETACIONES
// --------------------------------------------------

export function getHabitHistory(id) {
  return db.getAllSync(
    `SELECT completion_date
     FROM habit_completions
     WHERE habit_id = ?
     ORDER BY completion_date DESC`,
    [id]
  );
}

export function getHabitMonthlyHistory(id) {
  const today = getLocalDate();
  const startDate = addDays(today, -27);

  return db.getAllSync(
    `SELECT completion_date
     FROM habit_completions
     WHERE habit_id = ?
       AND completion_date BETWEEN ? AND ?
     ORDER BY completion_date ASC`,
    [id, startDate, today]
  );
}

// --------------------------------------------------
// MOTOR DE ESTADÍSTICAS GENERALES (BLINDADO)
// --------------------------------------------------

export function getHabitStatistics() {
  const today = getLocalDate();
  const startDate = addDays(today, -27);

  const habits = db.getAllSync('SELECT * FROM habits').map(normalizeHabit);

  const completions = db.getAllSync(
    `SELECT habit_id, completion_date
     FROM habit_completions
     WHERE completion_date BETWEEN ? AND ?
     ORDER BY completion_date ASC`,
    [startDate, today]
  );

  // 1. Agrupar cumplimientos por hábito en memoria
  const completionsByHabit = new Map();

  habits.forEach(habit => {
    completionsByHabit.set(habit.id, new Set());
  });

  completions.forEach(item => {
    if (completionsByHabit.has(item.habit_id)) {
      completionsByHabit
        .get(item.habit_id)
        .add(item.completion_date);
    }
  });

  // 2. Actividad diaria de los últimos 28 días (Heatmap)
  const dailyActivity = [];

  for (let i = 0; i < 28; i++) {
    const date = addDays(startDate, i);

    const count = completions.filter(
      item => item.completion_date === date
    ).length;

    dailyActivity.push({ date, count });
  }

  // 3. Consistencia: semanas completas (Lunes a Domingo)
  const currentMonday = getMonday(today);
  const lastCompletedSunday = addDays(currentMonday, -1);

  let firstCompleteMonday = getMonday(startDate);
  if (firstCompleteMonday < startDate) {
    firstCompleteMonday = addDays(firstCompleteMonday, 7);
  }

  const lastCompleteMonday = addDays(lastCompletedSunday, -6);

  let completedOpportunities = 0;
  let possibleOpportunities = 0;
  let weeksEvaluated = 0;
  let habitWeeksEvaluated = 0;

  const completeWeeks = [];

  for (
    let monday = firstCompleteMonday;
    monday <= lastCompleteMonday;
    monday = addDays(monday, 7)
  ) {
    const sunday = addDays(monday, 6);
    completeWeeks.push({ startDate: monday, endDate: sunday });
    weeksEvaluated++;
  }

  habits.forEach(habit => {
    const createdDate = habit.created_at
      ? habit.created_at.slice(0, 10)
      : startDate;

    const completedDates =
      completionsByHabit.get(habit.id) || new Set();

    completeWeeks.forEach(week => {
      if (createdDate > week.startDate) return;

      habitWeeksEvaluated++;

      if (habit.frequency_type === 'weekly') {
        const completedThisWeek = [...completedDates].filter(
          date => date >= week.startDate && date <= week.endDate
        ).length;

        const target = habit.weekly_target;
        possibleOpportunities += target;
        completedOpportunities += Math.min(completedThisWeek, target);
      } else {
        const expectedDates = getExpectedDates(
          habit,
          week.startDate,
          week.endDate
        );

        possibleOpportunities += expectedDates.length;

        expectedDates.forEach(date => {
          if (completedDates.has(date)) {
            completedOpportunities++;
          }
        });
      }
    });
  });

  const consistency = possibleOpportunities > 0
    ? Math.round((completedOpportunities / possibleOpportunities) * 100)
    : 0;

  const hasConsistencyData = possibleOpportunities > 0;

  // 4. Progreso de la semana actual
  let currentWeekCompleted = 0;
  let currentWeekPossible = 0;

  const currentWeekHabits = habits.map(habit => {
    const createdDate = habit.created_at
      ? habit.created_at.slice(0, 10)
      : today;

    const completedDates =
      completionsByHabit.get(habit.id) || new Set();

    const effectiveStart =
      createdDate > currentMonday
        ? createdDate
        : currentMonday;

    let completedCount = 0;
    let targetCount = 0;

    if (effectiveStart > today) {
      return {
        habitId: habit.id,
        title: habit.title,
        frequencyType: habit.frequency_type,
        completedCount: 0,
        targetCount: 0,
        progress: 0,
      };
    }

    if (habit.frequency_type === 'weekly') {
      targetCount = habit.weekly_target;

      completedCount = [...completedDates].filter(
        date => date >= currentMonday && date <= today
      ).length;

      currentWeekPossible += targetCount;
      currentWeekCompleted += Math.min(completedCount, targetCount);
    } else {
      const expectedDates = getExpectedDates(
        habit,
        effectiveStart,
        today
      );

      targetCount = expectedDates.length;

      completedCount = expectedDates.filter(
        date => completedDates.has(date)
      ).length;

      currentWeekPossible += targetCount;
      currentWeekCompleted += completedCount;
    }

    const progress = targetCount > 0
      ? Math.min(100, Math.round((completedCount / targetCount) * 100))
      : 0;

    return {
      habitId: habit.id,
      title: habit.title,
      frequencyType: habit.frequency_type,
      completedCount,
      targetCount,
      progress,
    };
  });

  const currentWeekProgress = currentWeekPossible > 0
    ? Math.min(100, Math.round((currentWeekCompleted / currentWeekPossible) * 100))
    : 0;

  // 5. Resumen de los 7 días de la semana actual
  const weekDays = [];

  for (let i = 0; i < 7; i++) {
    const date = addDays(currentMonday, i);

    const count = completions.filter(
      item => item.completion_date === date
    ).length;

    weekDays.push({
      label: DAY_NAMES[i],
      date,
      dayNumber: Number(date.slice(8, 10)),
      completed: count > 0,
      count,
      isToday: date === today,
    });
  }

  // 6. Distribución por categorías / pilares
  const categoryCounts = {};

  completions.forEach(item => {
    const habit = habits.find(h => h.id === item.habit_id);
    if (!habit) return;

    const category = habit.category || 'Sin categoría';
    categoryCounts[category] = (categoryCounts[category] || 0) + 1;
  });

  const totalCategoryCompletions = Object.values(categoryCounts).reduce(
    (total, count) => total + count,
    0
  );

  const categoryDistribution = Object.entries(categoryCounts).map(
    ([category, count]) => ({
      category,
      count,
      percentage: totalCategoryCompletions > 0
        ? Math.round((count / totalCategoryCompletions) * 100)
        : 0,
    })
  );

  return {
    consistency,
    hasConsistencyData,
    completedHabitDays: completions.length,
    possibleHabitDays: possibleOpportunities,
    completedOpportunities,
    possibleOpportunities,
    weeksEvaluated,
    habitWeeksEvaluated,
    dailyActivity,
    weekDays,
    categoryDistribution,
    currentWeek: {
      startDate: currentMonday,
      endDate: addDays(currentMonday, 6),
      completedOpportunities: currentWeekCompleted,
      possibleOpportunities: currentWeekPossible,
      progress: currentWeekProgress,
      habits: currentWeekHabits,
    },
  };
}

