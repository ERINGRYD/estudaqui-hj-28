import React, { createContext, useContext, useEffect, useState } from 'react';
import initSqlJs from 'sql.js';
import * as idbKeyval from 'idb-keyval';
import { setDB, setScheduleSave } from '../db/singleton';
import { migrateKeyIfNeeded } from '../db/keyMigration';
import schema from '../db/schema.sql?raw';

type DBContextType = {
  db: any;
  scheduleSave: () => void;
  isLoading: boolean;
  error: string | null;
};

const DBContext = createContext<DBContextType | null>(null);

const IDB_KEY = 'lovable_sqlite_db';

/**
 * Salva o banco de dados no IndexedDB
 */
async function saveDatabase(db: any): Promise<void> {
  if (!db) return;
  
  try {
    const data = db.export();
    await idbKeyval.set(IDB_KEY, data);
    console.log('Database saved to IndexedDB successfully');
  } catch (error) {
    console.error('Error saving database to IndexedDB:', error);
  }
}

/**
 * Carrega o banco de dados do IndexedDB ou cria um novo
 */
async function loadDatabase(SQL: any): Promise<any> {
  try {
    const buffer = await idbKeyval.get(IDB_KEY);
    if (buffer) {
      console.log('Loading existing database from IndexedDB');
      const arr = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
      return new SQL.Database(arr);
    } else {
      console.log('Creating new database with schema');
      const newDb = new SQL.Database();
      newDb.exec(schema);
      await saveDatabase(newDb);
      return newDb;
    }
  } catch (error) {
    console.error('Error loading database from IndexedDB:', error);
    console.log('Creating fallback database');
    const newDb = new SQL.Database();
    newDb.exec(schema);
    return newDb;
  }
}

/**
 * Provider do contexto do banco de dados SQLite
 * Inicializa o banco apenas uma vez e fornece acesso global
 */
export function DBProvider({ children }: { children: React.ReactNode }) {
  const [db, setLocalDb] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  let saveTimeout: NodeJS.Timeout;

  /**
   * Agenda o salvamento do banco com debounce de 1 segundo
   */
  function scheduleSave() {
    if (!db) return;
    
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      saveDatabase(db);
    }, 1000);
  }

  useEffect(() => {
    let mounted = true;
    
    const initializeDatabase = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Migrate old IndexedDB key if needed
        await migrateKeyIfNeeded();
        
        console.log('Initializing SQL.js...');
        const SQL = await initSqlJs({
          locateFile: (file: string) => `https://sql.js.org/dist/${file}`
        });
        
        if (!mounted) return;
        
        // Load database from IndexedDB or create new one
        const loadedDb = await loadDatabase(SQL);
        
        if (!mounted) return;
        
        setLocalDb(loadedDb);
        
        // Set the global database instance for the singleton
        setDB(loadedDb);
        
        // Inject scheduleSave function into singleton for global access
        setScheduleSave(() => scheduleSave());
        
        console.log('SQLite database initialized successfully via DBProvider');
      } catch (err) {
        if (!mounted) return;
        const errorMessage = err instanceof Error ? err.message : 'Unknown database error';
        setError(errorMessage);
        console.error('Failed to initialize SQLite database:', err);
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    initializeDatabase();
    
    return () => {
      mounted = false;
      if (saveTimeout) {
        clearTimeout(saveTimeout);
      }
    };
  }, []);

  return (
    <DBContext.Provider value={{ db, scheduleSave, isLoading, error }}>
      {children}
    </DBContext.Provider>
  );
}

/**
 * Hook para acessar o contexto do banco de dados
 */
export function useDB() {
  const ctx = useContext(DBContext);
  if (!ctx) {
    throw new Error('useDB must be used within DBProvider');
  }
  return ctx;
}