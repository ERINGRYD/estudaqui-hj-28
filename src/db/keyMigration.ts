import * as idbKeyval from 'idb-keyval';

const OLD_KEY = 'my_sqlite_db';
const NEW_KEY = 'lovable_sqlite_db';

/**
 * Migra dados do IndexedDB da chave antiga para a nova, se necessário
 * Executa apenas uma vez na primeira inicialização
 */
export async function migrateKeyIfNeeded(): Promise<void> {
  try {
    const oldData = await idbKeyval.get(OLD_KEY);
    const newData = await idbKeyval.get(NEW_KEY);
    
    if (oldData && !newData) {
      await idbKeyval.set(NEW_KEY, oldData);
      await idbKeyval.del(OLD_KEY);
      console.log('Database key migrated from old to new format');
    }
  } catch (error) {
    console.warn('Failed to migrate database key:', error);
  }
}