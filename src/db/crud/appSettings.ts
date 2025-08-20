import { getDBOrThrow, getScheduleSave } from '../singleton';

export interface AppSetting {
  id: string;
  settingKey: string;
  settingValue: string;
  settingType: 'string' | 'number' | 'boolean' | 'json';
  category: 'pomodoro' | 'theme' | 'notifications' | 'general';
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Salva uma configuração da aplicação no banco de dados.
 * Automaticamente persiste no IndexedDB.
 */
export const saveAppSetting = (setting: Omit<AppSetting, 'createdAt' | 'updatedAt'>): void => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();

  try {
    database.run(`
      INSERT OR REPLACE INTO app_settings (
        id, setting_key, setting_value, setting_type, category, description
      ) VALUES (?, ?, ?, ?, ?, ?)
    `, [
      setting.id,
      setting.settingKey,
      setting.settingValue,
      setting.settingType,
      setting.category,
      setting.description || null
    ]);

    scheduleSave();
  } catch (error) {
    console.error('Error saving app setting:', error);
    throw error;
  }
};

/**
 * Carrega uma configuração específica por chave.
 */
export const loadAppSetting = (settingKey: string): AppSetting | null => {
  const database = getDBOrThrow();

  try {
    const stmt = database.prepare('SELECT * FROM app_settings WHERE setting_key = ?');
    const result = stmt.getAsObject([settingKey]);
    stmt.free();

    if (!result.id) return null;

    return {
      id: result.id as string,
      settingKey: result.setting_key as string,
      settingValue: result.setting_value as string,
      settingType: result.setting_type as AppSetting['settingType'],
      category: result.category as AppSetting['category'],
      description: result.description as string || undefined,
      createdAt: new Date(result.created_at as string),
      updatedAt: new Date(result.updated_at as string)
    };
  } catch (error) {
    console.error('Error loading app setting:', error);
    return null;
  }
};

/**
 * Carrega todas as configurações ou por categoria.
 */
export const loadAppSettings = (category?: AppSetting['category']): AppSetting[] => {
  const database = getDBOrThrow();

  try {
    const query = category 
      ? 'SELECT * FROM app_settings WHERE category = ? ORDER BY setting_key'
      : 'SELECT * FROM app_settings ORDER BY category, setting_key';
    
    const stmt = database.prepare(query);
    const results: AppSetting[] = [];
    
    if (category) {
      stmt.bind([category]);
    }

    while (stmt.step()) {
      const row = stmt.getAsObject();
      results.push({
        id: row.id as string,
        settingKey: row.setting_key as string,
        settingValue: row.setting_value as string,
        settingType: row.setting_type as AppSetting['settingType'],
        category: row.category as AppSetting['category'],
        description: row.description as string || undefined,
        createdAt: new Date(row.created_at as string),
        updatedAt: new Date(row.updated_at as string)
      });
    }
    stmt.free();

    return results;
  } catch (error) {
    console.error('Error loading app settings:', error);
    return [];
  }
};

/**
 * Remove uma configuração por chave.
 */
export const deleteAppSetting = (settingKey: string): boolean => {
  const database = getDBOrThrow();
  const scheduleSave = getScheduleSave();

  try {
    database.run('DELETE FROM app_settings WHERE setting_key = ?', [settingKey]);
    scheduleSave();
    return true;
  } catch (error) {
    console.error('Error deleting app setting:', error);
    return false;
  }
};

/**
 * Utilitário para salvar configuração tipada (converte valor automaticamente).
 */
export const saveTypedSetting = (
  settingKey: string,
  value: string | number | boolean | object,
  category: AppSetting['category'],
  description?: string
): void => {
  let settingType: AppSetting['settingType'];
  let settingValue: string;

  if (typeof value === 'string') {
    settingType = 'string';
    settingValue = value;
  } else if (typeof value === 'number') {
    settingType = 'number';
    settingValue = value.toString();
  } else if (typeof value === 'boolean') {
    settingType = 'boolean';
    settingValue = value.toString();
  } else {
    settingType = 'json';
    settingValue = JSON.stringify(value);
  }

  saveAppSetting({
    id: `setting_${settingKey}`,
    settingKey,
    settingValue,
    settingType,
    category,
    description
  });
};

/**
 * Utilitário para carregar configuração tipada (converte valor automaticamente).
 */
export const loadTypedSetting = <T = any>(settingKey: string, defaultValue: T): T => {
  const setting = loadAppSetting(settingKey);
  if (!setting) return defaultValue;

  try {
    switch (setting.settingType) {
      case 'string':
        return setting.settingValue as T;
      case 'number':
        return parseFloat(setting.settingValue) as T;
      case 'boolean':
        return (setting.settingValue === 'true') as T;
      case 'json':
        return JSON.parse(setting.settingValue) as T;
      default:
        return defaultValue;
    }
  } catch (error) {
    console.error('Error parsing setting value:', error);
    return defaultValue;
  }
};