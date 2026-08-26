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
  name: '', deviceId: generateDeviceId(), favorites: ['megh'], downloads: ['nodi'], history: ['nodi', 'ghori'], positions: { 'nodi-1': 34 },
  bookmarks: [], searchHistory: [], settings: { dark: false, fontSize: 19, lineHeight: 32, notifications: true, wifiOnly: true, language: 'en' },
  readNotifications: [], reactions: {}, remoteBooks: [], online: false, lastSync: '',
};

export async function loadState(): Promise<LocalState> {
  try {
    const saved = await AsyncStorage.getItem(KEY);
    if (!saved) return initialState;
    const parsed = JSON.parse(saved);
    return { ...initialState, ...parsed, deviceId: parsed.deviceId || generateDeviceId(), settings: { ...initialState.settings, ...parsed.settings }, remoteBooks: parsed.remoteBooks || [], online: false };
  } catch { return initialState; }
}
export async function saveState(state: LocalState) {
  try {
    const toSave = { ...state, online: false, remoteBooks: [] };
    await AsyncStorage.setItem(KEY, JSON.stringify(toSave));
  } catch { /* The bundled catalog remains usable if storage is unavailable. */ }
}
