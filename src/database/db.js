// src/database/db.js
import * as SQLite from 'expo-sqlite';

// ======================================================
// CONEXIÓN ÚNICA A SQLITE
// ======================================================

export const db = SQLite.openDatabaseSync('lifeos.db');

// ======================================================
// UTILIDAD PARA MIGRACIONES
// Comprueba si una columna existe antes de agregarla.
// ======================================================

function addColumnIfMissing(tableName, columnName, definition) {
  try {
    const columns = db.getAllSync(`PRAGMA table_info(${tableName})`);

    const exists = columns.some(
      column => column.name === columnName
    );

    if (!exists) {
      db.execSync(
        `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`
      );

      console.log(
        `Columna agregada: ${tableName}.${columnName}`
      );
    }
  } catch (error) {
    console.error(
      `Error migrando ${tableName}.${columnName}:`,
      error
    );

    throw error;
  }
}

// ======================================================
// VERIFICAR COLUMNAS OBLIGATORIAS
// ======================================================

function verifyRequiredColumns(tableName, requiredColumns) {
  const columns = db.getAllSync(`PRAGMA table_info(${tableName})`);

  const existingColumns = columns.map(column => column.name);

  const missingColumns = requiredColumns.filter(
    column => !existingColumns.includes(column)
  );

  if (missingColumns.length > 0) {
    throw new Error(
      `La tabla ${tableName} tiene una estructura incompleta. ` +
      `Faltan: ${missingColumns.join(', ')}`
    );
  }
}

// ======================================================
// INICIALIZACIÓN DE BASE DE DATOS
// ======================================================

export function initDatabase() {
  try {
    // --------------------------------------------------
    // 1. CONFIGURACIÓN SQLITE
    // --------------------------------------------------

    db.execSync(`
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;
    `);

    // --------------------------------------------------
    // 2. TABLAS DE HÁBITOS
    // --------------------------------------------------

    db.execSync(`
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
    `);

    // --------------------------------------------------
    // 3. MIGRACIONES DE HÁBITOS
    // --------------------------------------------------

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

    db.runSync(`
      UPDATE habits
      SET
        frequency_type = 'daily',
        frequency_days = '[]',
        weekly_target = 3
      WHERE frequency_type IS NULL
         OR frequency_type = ''
    `);

    // --------------------------------------------------
    // 4. TABLAS DE PROYECTOS
    // --------------------------------------------------

    db.execSync(`
      CREATE TABLE IF NOT EXISTS projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT,
        priority TEXT NOT NULL DEFAULT 'medium',
        status TEXT NOT NULL DEFAULT 'active',
        start_date TEXT,
        due_date TEXT,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT
      );

      CREATE TABLE IF NOT EXISTS project_tasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        status TEXT NOT NULL DEFAULT 'pending',
        priority TEXT NOT NULL DEFAULT 'medium',
        due_date TEXT,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT,
        FOREIGN KEY (project_id)
          REFERENCES projects(id)
          ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS project_subtasks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        task_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        completed INTEGER NOT NULL DEFAULT 0,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (task_id)
          REFERENCES project_tasks(id)
          ON DELETE CASCADE
      );
    `);

    // --------------------------------------------------
    // 5. MIGRACIONES DE PROYECTOS
    // Se ejecutan ANTES de crear los índices.
    // --------------------------------------------------

    // Tabla projects

    addColumnIfMissing(
      'projects',
      'description',
      'TEXT'
    );

    addColumnIfMissing(
      'projects',
      'priority',
      "TEXT NOT NULL DEFAULT 'medium'"
    );

    addColumnIfMissing(
      'projects',
      'status',
      "TEXT NOT NULL DEFAULT 'active'"
    );

    addColumnIfMissing(
      'projects',
      'start_date',
      'TEXT'
    );

    addColumnIfMissing(
      'projects',
      'due_date',
      'TEXT'
    );

    addColumnIfMissing(
      'projects',
      'created_at',
      'TEXT'
    );

    addColumnIfMissing(
      'projects',
      'updated_at',
      'TEXT'
    );

    // Tabla project_tasks

    addColumnIfMissing(
      'project_tasks',
      'description',
      'TEXT'
    );

    addColumnIfMissing(
      'project_tasks',
      'status',
      "TEXT NOT NULL DEFAULT 'pending'"
    );

    addColumnIfMissing(
      'project_tasks',
      'priority',
      "TEXT NOT NULL DEFAULT 'medium'"
    );

    addColumnIfMissing(
      'project_tasks',
      'due_date',
      'TEXT'
    );

    addColumnIfMissing(
      'project_tasks',
      'position',
      'INTEGER NOT NULL DEFAULT 0'
    );

    addColumnIfMissing(
      'project_tasks',
      'created_at',
      'TEXT'
    );

    addColumnIfMissing(
      'project_tasks',
      'updated_at',
      'TEXT'
    );

    // Tabla project_subtasks

    addColumnIfMissing(
      'project_subtasks',
      'completed',
      'INTEGER NOT NULL DEFAULT 0'
    );

    addColumnIfMissing(
      'project_subtasks',
      'position',
      'INTEGER NOT NULL DEFAULT 0'
    );

    addColumnIfMissing(
      'project_subtasks',
      'created_at',
      'TEXT'
    );

    // --------------------------------------------------
    // 6. COMPLETAR FECHAS DE REGISTROS EXISTENTES
    // --------------------------------------------------

    db.runSync(`
      UPDATE projects
      SET created_at = CURRENT_TIMESTAMP
      WHERE created_at IS NULL OR created_at = '';
    `);

    db.runSync(`
      UPDATE projects
      SET updated_at = CURRENT_TIMESTAMP
      WHERE updated_at IS NULL OR updated_at = '';
    `);

    db.runSync(`
      UPDATE project_tasks
      SET created_at = CURRENT_TIMESTAMP
      WHERE created_at IS NULL OR created_at = '';
    `);

    db.runSync(`
      UPDATE project_tasks
      SET updated_at = CURRENT_TIMESTAMP
      WHERE updated_at IS NULL OR updated_at = '';
    `);

    db.runSync(`
      UPDATE project_subtasks
      SET created_at = CURRENT_TIMESTAMP
      WHERE created_at IS NULL OR created_at = '';
    `);

    // --------------------------------------------------
    // 7. VERIFICAR COLUMNAS ESTRUCTURALES
    // --------------------------------------------------

    verifyRequiredColumns('projects', [
      'id',
      'title',
      'description',
      'priority',
      'status',
      'start_date',
      'due_date',
      'created_at',
      'updated_at'
    ]);

    verifyRequiredColumns('project_tasks', [
      'id',
      'project_id',
      'title',
      'description',
      'status',
      'priority',
      'due_date',
      'position',
      'created_at',
      'updated_at'
    ]);

    verifyRequiredColumns('project_subtasks', [
      'id',
      'task_id',
      'title',
      'completed',
      'position',
      'created_at'
    ]);

    // --------------------------------------------------
    // 8. ÍNDICES DE HÁBITOS
    // --------------------------------------------------

    db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_habit_completions_date
      ON habit_completions(completion_date);

      CREATE INDEX IF NOT EXISTS idx_habit_completions_habit
      ON habit_completions(habit_id);
    `);

    // --------------------------------------------------
    // 9. ÍNDICES DE PROYECTOS
    // --------------------------------------------------

    db.execSync(`
      CREATE INDEX IF NOT EXISTS idx_projects_status
      ON projects(status);

      CREATE INDEX IF NOT EXISTS idx_projects_due_date
      ON projects(due_date);

      CREATE INDEX IF NOT EXISTS idx_project_tasks_project
      ON project_tasks(project_id);

      CREATE INDEX IF NOT EXISTS idx_project_tasks_status
      ON project_tasks(status);

      CREATE INDEX IF NOT EXISTS idx_project_tasks_due_date
      ON project_tasks(due_date);

      CREATE INDEX IF NOT EXISTS idx_project_subtasks_task
      ON project_subtasks(task_id);
    `);

    console.log('SQLite inicializada correctamente.');
  } catch (error) {
    console.error('Error al inicializar SQLite:', error);
    throw error;
  }
}
