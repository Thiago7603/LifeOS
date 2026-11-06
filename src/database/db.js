// src/database/db.js
import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('lifeos.db');

export const DAY_MS = 86400000;
export const DAY_NAMES = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

// --------------------------------------------------
// UTILIDADES DE FECHAS LOCALES
// --------------------------------------------------

export function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

export function parseLocalDate(dateString) {
  if (!dateString) return new Date();
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 12, 0, 0);
}

export function addDays(dateString, amount) {
  const date = parseLocalDate(dateString);
  date.setDate(date.getDate() + amount);
  return getLocalDate(date);
}

// Lunes = 1, Martes = 2 ... Domingo = 7
export function getDayNumber(dateString) {
  const day = parseLocalDate(dateString).getDay();
  return day === 0 ? 7 : day;
}

export function getMonday(dateString) {
  const day = getDayNumber(dateString);
  return addDays(dateString, 1 - day);
}

export function getWeekKey(dateString) {
  return getMonday(dateString);
}

// --------------------------------------------------
// MIGRACIÓN Y ESQUEMA DE BASE DE DATOS
// --------------------------------------------------

function addColumnIfMissing(tableName, columnName, definition) {
  try {
    const columns = db.getAllSync(`PRAGMA table_info(${tableName})`);
    const exists = columns.some(column => column.name === columnName);

    if (!exists) {
      db.execSync(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`
      );
    }
  } catch (error) {
    console.error(`Error verificando columna ${columnName} en ${tableName}:`, error);
  }
}

export function initDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      frequency TEXT NOT NULL DEFAULT 'Diario',
      target_minutes INTEGER,
      current_minutes INTEGER DEFAULT 0,
      streak INTEGER DEFAULT 0,
      completed INTEGER DEFAULT 0,
      reminder_time TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS habit_completions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      habit_id INTEGER NOT NULL,
      completion_date TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,

      FOREIGN KEY (habit_id)
        REFERENCES habits(id)
        ON DELETE CASCADE,

      UNIQUE (habit_id, completion_date)
    );

    CREATE INDEX IF NOT EXISTS idx_habit_completions_date
    ON habit_completions(completion_date);

    CREATE INDEX IF NOT EXISTS idx_habit_completions_habit
    ON habit_completions(habit_id);
  `);

  // Columnas dinámicas para soporte de frecuencias avanzadas
  addColumnIfMissing(
    'habits',
    'frequency_type',
    "TEXT NOT NULL DEFAULT 'daily'"
  );

  addColumnIfMissing(
    'habits',
    'frequency_days',
    "TEXT NOT NULL DEFAULT '[]'"
  );

  addColumnIfMissing(
    'habits',
    'weekly_target',
    'INTEGER NOT NULL DEFAULT 3'
  );

  // Normalizar registros anteriores
  db.runSync(`
    UPDATE habits
    SET frequency_type = 'daily',
        frequency_days = '[]',
        weekly_target = 3
    WHERE frequency_type IS NULL OR frequency_type = ''
  `);
}

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
// CÁLCULO DE RACHAS (MOTOR BLINDADO)
// --------------------------------------------------

function calculateDailyOrSpecificStreak(habit, completionDates) {
  const completed = new Set(completionDates);
  const today = getLocalDate();
  const normalized = normalizeHabit(habit);
  const createdDate = habit.created_at ? habit.created_at.slice(0, 10) : '2000-01-01';

  let currentDate = today;

  // Si hoy todavía no se ha cumplido, se permite continuar
  // evaluando la racha desde el día anterior programado.
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

  // Evaluamos el conteo de la semana en curso
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

  // Si la semana actual aún no alcanza la meta semanal,
  // la racha histórica no se rompe y se evalúa a partir de la semana anterior.
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
  const habits = db.getAllSync(
    'SELECT * FROM habits ORDER BY id DESC'
  );

  const today = getLocalDate();
  const currentMonday = getMonday(today);
  const currentSunday = addDays(currentMonday, 6);
  const todayDayNumber = getDayNumber(today);

  return habits.map(habit => {
    const completions = db.getAllSync(
      `SELECT completion_date
       FROM habit_completions
       WHERE habit_id = ?
       ORDER BY completion_date DESC`,
      [habit.id]
    );

    const completionDates = completions.map(
      item => item.completion_date
    );

    const normalized = normalizeHabit(habit);
    const completedToday = completionDates.includes(today) ? 1 : 0;

    // Cumplimientos registrados dentro de la semana actual (Lunes a Domingo)
    const weekCompletions = completionDates.filter(
      date => date >= currentMonday && date <= currentSunday
    );
    const weeklyCompletionsCount = weekCompletions.length;
    const weeklyTarget = normalized.weekly_target;
    const isWeeklyGoalMet = weeklyCompletionsCount >= weeklyTarget;

    // Determinar si corresponde a la rutina de hoy según su frecuencia
    let isScheduledToday = false;
    if (normalized.frequency_type === 'daily') {
      isScheduledToday = true;
    } else if (normalized.frequency_type === 'specific_days') {
      // Corresponde hoy si hoy es uno de sus días programados o si ya fue completado hoy
      isScheduledToday = normalized.frequency_days.includes(todayDayNumber) || completedToday === 1;
    } else if (normalized.frequency_type === 'weekly') {
      // Hábito semanal:
      // Está en la rutina de hoy si ya se completó hoy, O si aún no se ha alcanzado la meta semanal
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
  });
}

export function getHabitById(id) {
  const habits = db.getAllSync('SELECT * FROM habits WHERE id = ?', [id]);
  if (!habits || habits.length === 0) return null;

  const habit = habits[0];
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
    isScheduledToday = normalized.frequency_days.includes(todayDayNumber) || completedToday === 1;
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

// --------------------------------------------------
// CREAR HÁBITO
// --------------------------------------------------

export function createHabit(habit) {
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
// ELIMINAR HÁBITO (CON CASCADA DE COMPLETACIONES)
// --------------------------------------------------

export function deleteHabit(id) {
  db.runSync(
    'DELETE FROM habit_completions WHERE habit_id = ?',
    [id]
  );
  db.runSync(
    'DELETE FROM habits WHERE id = ?',
    [id]
  );
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

  const habits = db.getAllSync(
    'SELECT * FROM habits'
  ).map(normalizeHabit);

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

  // 3. Consistencia: evaluación estricta de semanas completas (Lunes a Domingo)
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

    completeWeeks.push({
      startDate: monday,
      endDate: sunday,
    });

    weeksEvaluated++;
  }

  habits.forEach(habit => {
    const createdDate = habit.created_at
      ? habit.created_at.slice(0, 10)
      : startDate;

    const completedDates =
      completionsByHabit.get(habit.id) || new Set();

    completeWeeks.forEach(week => {
      // El hábito debe existir desde el inicio de la semana para evaluarse
      if (createdDate > week.startDate) {
        return;
      }

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

  // 4. Progreso de la semana actual (no distorsiona consistencia consolidada)
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

  // 5. Resumen de los 7 días de la semana actual (Lunes a Domingo)
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
