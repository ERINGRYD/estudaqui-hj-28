/**
 * Utilitários para operações seguras com o banco SQLite
 * Agora usa apenas o singleton DBProvider
 */

import { getDBSync } from '@/db/singleton';

/**
 * Verifica se o banco está inicializado antes de executar operações
 * @param operation - Função que será executada se o banco estiver pronto
 * @param fallback - Valor de retorno caso o banco não esteja pronto
 */
export function withDatabase<T>(
  operation: () => T,
  fallback: T
): T {
  try {
    const db = getDBSync();
    if (!db) {
      console.warn('Database not ready, returning fallback');
      return fallback;
    }
    return operation();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Database not initialized')) {
      console.warn('Database operation attempted before initialization, returning fallback');
      return fallback;
    }
    throw error;
  }
}

/**
 * Executa uma operação assíncrona com o banco de forma segura
 * @param operation - Função assíncrona que será executada se o banco estiver pronto
 * @param fallback - Valor de retorno caso o banco não esteja pronto
 */
export async function withDatabaseAsync<T>(
  operation: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    const db = getDBSync();
    if (!db) {
      console.warn('Database not ready, returning fallback');
      return fallback;
    }
    return await operation();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Database not initialized')) {
      console.warn('Database async operation attempted before initialization, returning fallback');
      return fallback;
    }
    throw error;
  }
}

/**
 * Executa uma operação silenciosa (sem logs de erro) caso o banco não esteja pronto
 * @param operation - Função que será executada se o banco estiver pronto
 */
export function safeDatabaseOperation(operation: () => void): void {
  try {
    const db = getDBSync();
    if (!db) {
      // Silently ignore if database is not ready
      return;
    }
    operation();
  } catch (error) {
    if (error instanceof Error && error.message.includes('Database not initialized')) {
      // Silently ignore if database is not ready
      return;
    }
    throw error;
  }
}