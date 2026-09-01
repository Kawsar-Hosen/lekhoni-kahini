import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocalState } from './types';

const KEY = '@lekhoni/state/v1';

function generateDeviceId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  const hex = '0123456789abcdef';
  const s = (n: number) => Array.from({ length: n }, () => hex[Math.floor(Math.random() * 16)]).join('');
  return `${s(8)}-${s(4)}-4${s(3)}-${['8','9','a','b'][Math.floor(Math.random()*4)]}${s(3)}-${s(12)}`;
}

export const initialState: LocalState = {
  name: '', deviceId: generateDeviceId(), favorites: [], downloads: [], history: [], positions: {},
  bookmarks: [], searchHistory: [], settings: { dark: false, fontSize: 19, lineHeight: 32, lineSpacing: 1.0, fontFamily: 'default', pageMode: 'scroll', notifications: true, wifiOnly: true, language: 'bn', themeId: 'katagolap', readerTheme: 'default', keepScreenOn: true, autoScroll: false, autoScrollSpeed: 2, volumeScroll: false, eyeComfort: 0, brightness: 100 },
  readNotifications: [], reactions: {}, remoteBooks: [], online: false, lastSync: '',
  writer: null, writerToken: null, user: null, userToken: null, followedWriters: [],
  readingActivity: {},
};

export async function loadState(): Promise<LocalState> {
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if (!saved) return initialState;
    const parsed = JSON.parse(saved);
    const loadedSettings = { ...initialState.settings, ...parsed.settings };
    if (typeof loadedSettings.eyeComfort === 'boolean') loadedSettings.eyeComfort = loadedSettings.eyeComfort ? 50 : 0;
    return { ...initialState, ...parsed, deviceId: parsed.deviceId || generateDeviceId(), settings: loadedSettings, remoteBooks: parsed.remoteBooks || [], online: false, writer: parsed.writer || null, writerToken: parsed.writerToken || null, user: parsed.user || null, userToken: parsed.userToken || null, followedWriters: parsed.followedWriters || [], readingActivity: parsed.readingActivity || {} };
  } catch { return initialState; }
}
export async function saveState(state: LocalState) {
  try {
    const toSave = { ...state, online: false, remoteBooks: [] };
    await AsyncStorage.setItem(KEY, JSON.stringify(toSave));
  } catch { /* The bundled catalog remains usable if storage is unavailable. */ }
}
export async function clearState() {
  try { await AsyncStorage.removeItem(KEY); } catch { /* ignore */ }
}
