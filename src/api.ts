import { Book, Chapter } from './types';
import { books as bundledBooks, categories as bundledCategories, notices as bundledNotices } from './data';

const API_BASE = 'https://lekhoni-admin-api.smdkawsar2.workers.dev';
const TIMEOUT = 6000;

type RemoteBook = { id:string; title:string; author:string; cover_url:string|null; status:string; views:number|string; likes:number|string; dislikes:number|string; description:string|null; category:string|null; color:string; accent:string; is_new?:boolean; featured?:boolean; updated_at:string };
type RemoteChapter = { id:string; book_id:string; title:string; body:string; position:number; sort_order?:number; minutes?:number };
type RemoteComment = { id:string; book_id:string; display_name:string; body:string; status:string; created_at:string };
type RemoteNotification = { id:string; title:string; body:string; icon:string|null; url:string|null; created_at:string };
type RemoteEvent = { device_id:string; book_id:string; event_type:'view'|'like'|'dislike'; created_at:string };

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    const response = await fetch(`${API_BASE}${path}`, { ...init, signal: controller.signal, headers: { 'content-type': 'application/json', ...init?.headers } });
    clearTimeout(timer);
    if (!response.ok) return null;
    return await response.json() as T;
  } catch { return null; }
}

function toBookColor(id: string): string {
  const palette: Record<string, string> = { nodi: '#123E39', megh: '#6D3B46', ghori: '#292E3D', jochona: '#383655', shohor: '#185366', kobita: '#276250', ekattor: '#59412E', chaya: '#232F32' };
  return palette[id] || `#${id.split('').reduce((a, c) => a + c.charCodeAt(0), 0).toString(16).slice(-6).padStart(6, '0')}`;
}

function toAccent(id: string): string {
  const accents: Record<string, string> = { nodi: '#F5C660', megh: '#F3B5B9', ghori: '#DF6E52', jochona: '#C3B7EA', shohor: '#EFAB62', kobita: '#D9DF91', ekattor: '#D6A25E', chaya: '#A8C0B7' };
  return accents[id] || '#F5C660';
}

function toCategoryIcon(cat: string | null): string {
  const icons: Record<string, string> = { 'উপন্যাস': 'book-open', 'রোমান্টিক': 'heart', 'রহস্য': 'search', 'থ্রিলার': 'zap', 'ভৌতিক': 'moon', 'কবিতা': 'feather', 'ইতিহাস': 'archive', 'কিশোর': 'sun', 'মুক্তিযুদ্ধ': 'flag' };
  return icons[cat || ''] || 'book-open';
}

function mergeRemoteBooks(remote: RemoteBook[], chaptersByBook: Record<string, RemoteChapter[]>): Book[] {
  return remote.filter(b => b.status === 'published').map(b => {
    const chs = (chaptersByBook[b.id] || [])
      .sort((a, c) => (a.sort_order ?? a.position) - (c.sort_order ?? c.position))
      .map(c => ({ id: c.id, title: c.title, body: c.body, minutes: c.minutes || 5 }));
    if (!chs.length) return null;
    return {
      id: b.id, title: b.title, author: b.author, category: b.category || 'উপন্যাস',
      categoryIcon: toCategoryIcon(b.category), color: b.color || toBookColor(b.id),
      accent: b.accent || toAccent(b.id), views: `${b.views}`, rating: 4.5,
      description: b.description || '', updated: 'অনলাইন', isNew: Boolean(b.is_new), chapters: chs, cover_url: b.cover_url || null,
    };
  }).filter(Boolean) as Book[];
}

export async function fetchRemoteBooks(): Promise<Book[]> {
  const booksData = await apiFetch<RemoteBook[]>('/api/public/books');
  if (!booksData || !booksData.length) return [];
  const chaptersData = await apiFetch<RemoteChapter[]>('/api/public/chapters');
  const chaptersByBook: Record<string, RemoteChapter[]> = {};
  if (chaptersData) {
    for (const ch of chaptersData) {
      if (!chaptersByBook[ch.book_id]) chaptersByBook[ch.book_id] = [];
      chaptersByBook[ch.book_id].push(ch);
    }
  }
  return mergeRemoteBooks(booksData, chaptersByBook);
}

export async function fetchRemoteBook(id: string): Promise<Book | null> {
  const b = await apiFetch<RemoteBook & { chapters: RemoteChapter[] }>(`/api/public/books/${id}`);
  if (!b) return null;
  const chs = (b.chapters || []).sort((a, c) => (a.sort_order ?? a.position) - (c.sort_order ?? c.position)).map(c => ({ id: c.id, title: c.title, body: c.body, minutes: c.minutes || 5 }));
  return {
    id: b.id, title: b.title, author: b.author, category: b.category || 'উপন্যাস',
    categoryIcon: toCategoryIcon(b.category), color: b.color || toBookColor(b.id),
    accent: b.accent || toAccent(b.id), views: `${b.views}`, rating: 4.5,
    description: b.description || '', updated: 'অনলাইন', isNew: Boolean(b.is_new), chapters: chs, cover_url: b.cover_url || null,
  };
}

export async function trackEvent(deviceId: string, bookId: string, eventType: 'view' | 'like' | 'dislike'): Promise<void> {
  await apiFetch('/api/public/events', {
    method: 'POST',
    body: JSON.stringify({ device_id: deviceId, book_id: bookId, event_type: eventType }),
  });
}

export async function fetchRemoteComments(bookId: string): Promise<RemoteComment[]> {
  return (await apiFetch<RemoteComment[]>(`/api/public/books/${bookId}/comments`)) || [];
}

export async function submitComment(bookId: string, deviceId: string, name: string, body: string): Promise<boolean> {
  const result = await apiFetch<{ ok: boolean }>(`/api/public/books/${bookId}/comments`, {
    method: 'POST',
    body: JSON.stringify({ device_id: deviceId, name, body }),
  });
  return Boolean(result?.ok);
}

export async function fetchRemoteNotifications(): Promise<RemoteNotification[]> {
  return (await apiFetch<RemoteNotification[]>('/api/public/notifications')) || [];
}

type RemoteCategory = { id: string; name: string; icon: string; color: string; cover_url: string | null };
export async function fetchRemoteCategories(): Promise<RemoteCategory[]> {
  return (await apiFetch<RemoteCategory[]>('/api/public/categories')) || [];
}

export function getOfflineBooks(): Book[] { return bundledBooks; }
export function getOfflineCategories() { return bundledCategories; }
export function getOfflineNotices() { return bundledNotices; }
export { bundledBooks, bundledCategories, bundledNotices };
