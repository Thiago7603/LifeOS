// src/database/db.js
// Punto de entrada único de SQLite para LifeOS.
//
// Responsabilidades exclusivas de este archivo:
//   1. Crear y exportar la instancia singleton SQLite.
//   2. Inicializar la base de datos (esquema, índices y tablas).
//   3. Ejecutar migraciones automáticas.
//
// No contiene lógica de negocio, repositorios ni utilidades de fecha.

import * as SQLite from 'expo-sqlite';

// Singleton: una única conexión para toda la app.
export const db = SQLite.openDatabaseSync('lifeos.db');

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
  addColumnIfMissing('habits', 'frequency_type', "TEXT NOT NULL DEFAULT 'daily'");
  addColumnIfMissing('habits', 'frequency_days', "TEXT NOT NULL DEFAULT '[]'");
  addColumnIfMissing('habits', 'weekly_target', 'INTEGER NOT NULL DEFAULT 3');

  // Normalizar registros anteriores
  db.runSync(`
    UPDATE habits
    SET frequency_type = 'daily',
        frequency_days = '[]',
        weekly_target = 3
    WHERE frequency_type IS NULL OR frequency_type = ''
  `);
}
