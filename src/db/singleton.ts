import type { Database } from 'sql.js';

let _db: Database | null = null;
let _resolveReady: ((db: Database) => void) | null = null;
let _scheduleSave: (() => void) | null = null;

/**
 * Promise que resolve quando o DB for inicializado pelo DBProvider.
 * Outros módulos podem `await dbReady` para garantir que o DB esteja pronto.
 */
export const dbReady: Promise<Database> = new Promise<Database>((resolve) => {
  _resolveReady = resolve;
});

/** Use setDB() apenas uma vez — idealmente pelo DBProvider. */
export function setDB(db: Database) {
  _db = db;
  if (_resolveReady) {
    _resolveReady(db);
    _resolveReady = null; // Prevent multiple calls
  }
}

/** Injeta a função scheduleSave para ser usada pelas operações de banco. */
export function setScheduleSave(scheduleSave: () => void) {
  _scheduleSave = scheduleSave;
}

/** Retorna a função scheduleSave ou lança erro se não definida. */
export function getScheduleSave(): () => void {
  if (!_scheduleSave) {
    throw new Error('scheduleSave not initialized. Use setScheduleSave() from DBProvider.');
  }
  return _scheduleSave;
}

/** Retorna a instância se já existir (síncrono). */
export function getDBSync(): Database | null {
  return _db;
}

/** Retorna a instância ou lança se não inicializado (síncrono). */
export function getDBOrThrow(): Database {
  if (!_db) {
    throw new Error('Database not initialized. Use DBProvider or await dbReady.');
  }
  return _db;
}