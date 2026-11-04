// src/database/db.js

import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('lifeos.db');

// Fecha local en formato YYYY-MM-DD
function getLocalDate(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
}

// Evita problemas al calcular días consecutivos
function addDays(dateString, amount) {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + amount);

  return getLocalDate(date);
}

// Inicializar y actualizar la estructura de la base de datos
export function initDatabase() {
  db.execSync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS habits (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      frequency TEXT NOT NULL,
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
}

// Calcular racha consecutiva de un hábito
function calculateStreak(completionDates) {
  if (!completionDates.length) return 0;

  const completedDates = new Set(completionDates);
  const today = getLocalDate();

  // Si hoy no está completado, la racha puede continuar desde ayer.
  let currentDate = completedDates.has(today)
    ? today
    : addDays(today, -1);

  if (!completedDates.has(currentDate)) return 0;

  let streak = 0;

  while (completedDates.has(currentDate)) {
    streak++;
    currentDate = addDays(currentDate, -1);
  }

  return streak;
}

// Consultar todos los hábitos con su estado de hoy y racha real
export function getHabits() {
  const habits = db.getAllSync(
    'SELECT * FROM habits ORDER BY id DESC'
  );

  const today = getLocalDate();

  return habits.map((habit) => {
    const completions = db.getAllSync(
      `SELECT completion_date
       FROM habit_completions
       WHERE habit_id = ?
       ORDER BY completion_date DESC`,
      [habit.id]
    );

    const completionDates = completions.map(
      (item) => item.completion_date
    );

    return {
      ...habit,
      completed: completionDates.includes(today) ? 1 : 0,
      streak: calculateStreak(completionDates),
    };
  });
}

// Crear un hábito
export function createHabit(habit) {
  const statement = db.prepareSync(`
    INSERT INTO habits (
      title,
      description,
      category,
      frequency,
      target_minutes,
      reminder_time
    )
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  try {
    const result = statement.executeSync([
      habit.title.trim(),
      habit.description?.trim() || '',
      habit.category,
      habit.frequency || 'Diario',
      Number(habit.targetMinutes) || 0,
      habit.reminderTime || null,
    ]);

    return result.lastInsertRowId;
  } finally {
    statement.finalizeSync();
  }
}

// Marcar o desmarcar el cumplimiento de hoy
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

// Consultar historial de un hábito
export function getHabitHistory(id) {
  return db.getAllSync(
    `SELECT completion_date
     FROM habit_completions
     WHERE habit_id = ?
     ORDER BY completion_date DESC`,
    [id]
  );
}

// Consultar cumplimiento de los últimos 28 días
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

// Editar un hábito
export function updateHabit(id, habit) {
  db.runSync(
    `UPDATE habits
     SET title = ?,
         description = ?,
         category = ?,
         frequency = ?,
         target_minutes = ?,
         reminder_time = ?
     WHERE id = ?`,
    [
      habit.title.trim(),
      habit.description?.trim() || '',
      habit.category,
      habit.frequency,
      Number(habit.targetMinutes) || 0,
      habit.reminderTime || null,
      id,
    ]
  );
}

// Eliminar un hábito y sus registros asociados
export function deleteHabit(id) {
  db.runSync(
    'DELETE FROM habits WHERE id = ?',
    [id]
  );
}

// Estadísticas generales de hábitos
export function getHabitStatistics() {
  const today = getLocalDate();
  const startDate = addDays(today, -27);

  const habits = db.getAllSync(
    'SELECT id, category, created_at FROM habits'
  );

  const completions = db.getAllSync(
    `SELECT habit_id, completion_date
     FROM habit_completions
     WHERE completion_date BETWEEN ? AND ?
     ORDER BY completion_date ASC`,
    [startDate, today]
  );

  // Actividad de cada uno de los últimos 28 días
  const dailyActivity = [];

  for (let i = 0; i < 28; i++) {
    const date = addDays(startDate, i);

    const count = completions.filter(
      item => item.completion_date === date
    ).length;

    dailyActivity.push({
      date,
      count,
    });
  }

  // Calcular días posibles de cumplimiento desde la creación
  let possibleHabitDays = 0;

  habits.forEach(habit => {
    const createdDate = habit.created_at
      ? habit.created_at.slice(0, 10)
      : startDate;

    const effectiveStart =
      createdDate > startDate ? createdDate : startDate;

    if (effectiveStart > today) return;

    const start = new Date(`${effectiveStart}T12:00:00`);
    const end = new Date(`${today}T12:00:00`);

    const days =
      Math.round((end - start) / 86400000) + 1;

    possibleHabitDays += days;
  });

  const completedHabitDays = completions.length;

  const consistency = possibleHabitDays > 0
    ? Math.round(
        (completedHabitDays / possibleHabitDays) * 100
      )
    : 0;

  // Semana actual: lunes a domingo
  const currentDay = new Date().getDay();
  const distanceToMonday = currentDay === 0
    ? -6
    : 1 - currentDay;

  const monday = addDays(today, distanceToMonday);

  const weekDays = [];

  const labels = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  for (let i = 0; i < 7; i++) {
    const date = addDays(monday, i);

    const count = completions.filter(
      item => item.completion_date === date
    ).length;

    weekDays.push({
      label: labels[i],
      date,
      dayNumber: Number(date.slice(8, 10)),
      completed: count > 0,
      count,
      isToday: date === today,
    });
  }

  // Distribución de cumplimientos por categoría
  const categoryCounts = {};

  completions.forEach(item => {
    const habit = habits.find(
      h => h.id === item.habit_id
    );

    if (!habit) return;

    const category = habit.category || 'Sin categoría';

    categoryCounts[category] =
      (categoryCounts[category] || 0) + 1;
  });

  const totalCategoryCompletions = Object.values(
    categoryCounts
  ).reduce((total, count) => total + count, 0);

  const categoryDistribution = Object.entries(
    categoryCounts
  ).map(([category, count]) => ({
    category,
    count,
    percentage: totalCategoryCompletions > 0
      ? Math.round(
          (count / totalCategoryCompletions) * 100
        )
      : 0,
  }));

  return {
    consistency,
    completedHabitDays,
    possibleHabitDays,
    dailyActivity,
    weekDays,
    categoryDistribution,
  };
}