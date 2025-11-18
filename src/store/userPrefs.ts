import fs from 'fs';
import path from 'path';
import { DataSourceOption } from '../types';

export interface UserPreference {
  userId: string;
  dataSource: DataSourceOption;
  viewAsUserId?: string;
  selectedCanvasId?: string;
  selectedCanvasTitle?: string;
  updatedAt: string;
}

const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORAGE_PATH = path.join(DATA_DIR, 'user-preferences.json');

const defaultDataSource = (process.env.DATA_SOURCE_DEFAULT as DataSourceOption) || 'mock';
const cache = new Map<string, UserPreference>();

function ensureStorage() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (fs.existsSync(STORAGE_PATH)) {
    try {
      const raw = fs.readFileSync(STORAGE_PATH, 'utf-8');
      const parsed: UserPreference[] = JSON.parse(raw);
      parsed.forEach((pref) => cache.set(pref.userId, pref));
    } catch (error) {
      console.warn('[prefs] Failed to load user preferences, starting fresh.', error);
    }
  }
}

function persist() {
  fs.writeFileSync(
    STORAGE_PATH,
    JSON.stringify(Array.from(cache.values()), null, 2),
    'utf-8'
  );
}

ensureStorage();

function createFreshPreference(userId: string): UserPreference {
  return {
    userId,
    dataSource: defaultDataSource,
    updatedAt: new Date().toISOString(),
  };
}

export function getUserPreference(userId: string): UserPreference {
  const pref = cache.get(userId);
  if (pref) {
    return pref;
  }
  const fresh = createFreshPreference(userId);
  cache.set(userId, fresh);
  persist();
  return fresh;
}

export function updateUserPreference(
  userId: string,
  patch: Partial<Omit<UserPreference, 'userId'>>
): UserPreference {
  const current = getUserPreference(userId);
  const next: UserPreference = {
    ...current,
    ...patch,
    userId,
    updatedAt: new Date().toISOString(),
  };
  cache.set(userId, next);
  persist();
  return next;
}

export function resetUserPreference(userId: string): UserPreference {
  const fresh = createFreshPreference(userId);
  cache.set(userId, fresh);
  persist();
  return fresh;
}
