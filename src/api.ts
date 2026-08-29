import { Book, Chapter } from './types';


const API_BASE = 'https://lekhoni-admin-api.smdkawsar2.workers.dev';
const TIMEOUT = 6000;

type RemoteBook = { id:string; title:string; author:string; cover_url:string|null; status:string; views:number|string; likes:number|string; dislikes:number|string; description:string|null; category:string|null; color:string; accent:string; is_new?:boolean; featured?:boolean; home_section?:string|null; views_visible?:boolean; display_status?:string; updated_at:string };
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
    return {
      id: b.id, title: b.title, author: b.author, category: b.category || 'উপন্যাস',
      categoryIcon: toCategoryIcon(b.category), color: b.color || toBookColor(b.id),
      accent: b.accent || toAccent(b.id),       views: `${b.views}`, rating: 4.5, likes: Number(b.likes) || 0,
      featured: Boolean(b.featured), homeSection: b.home_section || undefined, views_visible: b.views_visible !== false,
      description: b.description || '', updated: 'অনলাইন', isNew: Boolean(b.is_new), chapters: chs, cover_url: b.cover_url || null,
      display_status: b.display_status || undefined,
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
    accent: b.accent || toAccent(b.id), views: `${b.views}`, rating: 4.5, likes: Number(b.likes) || 0,
    featured: Boolean(b.featured), homeSection: b.home_section || undefined,
    description: b.description || '', updated: 'অনলাইন', isNew: Boolean(b.is_new), chapters: chs, cover_url: b.cover_url || null,
  };
}

export async function trackEvent(deviceId: string, bookId: string, eventType: 'view' | 'like' | 'dislike'): Promise<void> {
  await apiFetch('/api/public/events', {
    method: 'POST',
    body: JSON.stringify({ device_id: deviceId, book_id: bookId, event_type: eventType }),
  });
}

export async function toggleBookLike(deviceId: string, bookId: string, value: boolean): Promise<number> {
  const r = await apiFetch<{ ok: boolean; likes: number }>(`/api/public/books/${bookId}/like`, {
    method: 'POST',
    body: JSON.stringify({ device_id: deviceId, value }),
  });
  return typeof r?.likes === 'number' ? r.likes : -1;
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

export type HomeSectionConfig = { key: string; enabled: boolean; title?: string };
export async function fetchHomeConfig(): Promise<HomeSectionConfig[]> {
  return (await apiFetch<HomeSectionConfig[]>('/api/home-config')) || [];
}

export type HomeSectionsData = {
  sections: { key: string; title: string; books: RemoteBook[] }[];
  writers: { id: string; username: string; writer_name: string; bio: string; avatar_url: string | null; follower_count: number; badge: string }[];
  viewsVisible?: boolean;
};
export async function fetchHomeSections(): Promise<HomeSectionsData | null> {
  return await apiFetch<HomeSectionsData>('/api/home-sections');
}

export type UserStatePayload = {
  settings?: Record<string, unknown>;
  favorites?: string[];
  downloads?: string[];
  history?: string[];
  positions?: Record<string, number>;
  bookmarks?: unknown[];
};
export async function fetchUserState(deviceKey: string): Promise<{ synced: boolean; state?: UserStatePayload & Record<string, unknown> }> {
  return (await apiFetch<{ synced: boolean; state?: any }>(`/api/public/user-state?device_key=${encodeURIComponent(deviceKey)}`)) || { synced: false };
}
export async function saveUserState(deviceKey: string, payload: UserStatePayload): Promise<boolean> {
  const r = await apiFetch<{ ok?: boolean }>('/api/public/user-state', {
    method: 'PUT',
    body: JSON.stringify({ device_key: deviceKey, ...payload }),
  });
  return Boolean(r?.ok);
}

// --- Writer Auth ---
export type Writer = { id: string; username: string; writer_name: string; email?: string; bio?: string; avatar_url?: string | null; follower_count?: number; created_at?: string };

export async function writerSignup(username: string, writerName: string, email: string, password: string): Promise<{ writer: Writer; token: string } | null> {
  const r = await apiFetch<{ writer?: Writer; token?: string; error?: string }>('/api/public/writers/signup', {
    method: 'POST', body: JSON.stringify({ username, writer_name: writerName, email, password }),
  });
  if (r?.writer && r?.token) return { writer: r.writer, token: r.token };
  return null;
}

export async function writerLogin(emailOrUsername: string, password: string): Promise<{ writer: Writer; token: string } | null> {
  const r = await apiFetch<{ writer?: Writer; token?: string; error?: string }>('/api/public/writers/login', {
    method: 'POST', body: JSON.stringify({ email_or_username: emailOrUsername, password }),
  });
  if (r?.writer && r?.token) return { writer: r.writer, token: r.token };
  return null;
}

export async function writerGoogleAuth(credential: string): Promise<{ writer: Writer; token: string } | null> {
  const r = await apiFetch<{ writer?: Writer; token?: string; error?: string }>('/api/public/writers/google', {
    method: 'POST', body: JSON.stringify({ credential }),
  });
  if (r?.writer && r?.token) return { writer: r.writer, token: r.token };
  return null;
}

export async function verifyWriterToken(token: string): Promise<Writer | null> {
  const r = await apiFetch<{ writer?: Writer }>('/api/public/writers/verify', {
    method: 'POST', body: JSON.stringify({ token }),
  });
  return r?.writer || null;
}

export async function fetchPublicWriters(): Promise<Writer[]> {
  return (await apiFetch<Writer[]>('/api/public/writers')) || [];
}

// --- Follows ---
export async function fetchFollowedWriters(deviceId: string): Promise<Writer[]> {
  return (await apiFetch<Writer[]>(`/api/public/follows?device_id=${deviceId}`)) || [];
}

export async function followWriter(deviceId: string, writerId: string, followerWriterId?: string): Promise<boolean> {
  const r = await apiFetch<{ ok: boolean }>('/api/public/follows', {
    method: 'POST', body: JSON.stringify({ device_id: deviceId, writer_id: writerId, follower_writer_id: followerWriterId }),
  });
  return Boolean(r?.ok);
}

export async function unfollowWriter(deviceId: string, writerId: string): Promise<boolean> {
  const r = await apiFetch<{ ok: boolean }>(`/api/public/follows/${writerId}?device_id=${deviceId}`, {
    method: 'DELETE',
  });
  return Boolean(r?.ok);
}

// --- Writer Studio (authenticated) ---
export type Story = { id: string; title: string; description: string; status: string; cover_url: string | null; category: string; views: number; likes: number; chapters_count: number; created_at: string; updated_at: string };
export type StoryChapter = { id: string; title: string; body: string; position: number; minutes: number; created_at: string };
export type WriterStats = { stories: number; views: number; followers: number; activities: { id: string; type: string; data: any; created_at: string }[] };
export type WriterProfileFull = Writer & { email?: string; bio?: string };

async function writerApiFetch<T>(path: string, token: string, init?: RequestInit): Promise<T | null> {
  return apiFetch<T>(path, { ...init, headers: { Authorization: `Bearer ${token}`, ...init?.headers } });
}

export async function fetchWriterStats(token: string): Promise<WriterStats | null> {
  return writerApiFetch<WriterStats>('/api/writer/stats', token);
}

export async function fetchWriterStories(token: string): Promise<Story[]> {
  return (await writerApiFetch<Story[]>('/api/writer/stories', token)) || [];
}

export async function createWriterStory(token: string, title: string, description: string, category: string, coverUrl?: string, displayStatus?: string): Promise<Story | null> {
  return writerApiFetch<Story>('/api/writer/stories', token, {
    method: 'POST', body: JSON.stringify({ title, description, category, cover_url: coverUrl, display_status: displayStatus }),
  });
}

export async function updateWriterStory(token: string, storyId: string, patch: { title?: string; description?: string; status?: string; category?: string; display_status?: string }): Promise<boolean> {
  const r = await writerApiFetch<{ ok: boolean }>(`/api/writer/stories/${storyId}`, token, {
    method: 'PUT', body: JSON.stringify(patch),
  });
  return Boolean(r?.ok);
}

export async function deleteWriterStory(token: string, storyId: string): Promise<boolean> {
  const r = await writerApiFetch<{ ok: boolean }>(`/api/writer/stories/${storyId}`, token, {
    method: 'DELETE',
  });
  return Boolean(r?.ok);
}

export async function fetchWriterStoryDetail(token: string, storyId: string): Promise<(Story & { chapters: StoryChapter[] }) | null> {
  return writerApiFetch<Story & { chapters: StoryChapter[] }>(`/api/writer/stories/${storyId}`, token);
}

export async function createStoryChapter(token: string, storyId: string, title: string, body: string): Promise<StoryChapter | null> {
  return writerApiFetch<StoryChapter>(`/api/writer/stories/${storyId}/chapters`, token, {
    method: 'POST', body: JSON.stringify({ title, body }),
  });
}

export async function updateStoryChapter(token: string, storyId: string, chapterId: string, patch: { title?: string; body?: string }): Promise<boolean> {
  const r = await writerApiFetch<{ ok: boolean }>(`/api/writer/stories/${storyId}/chapters/${chapterId}`, token, {
    method: 'PUT', body: JSON.stringify(patch),
  });
  return Boolean(r?.ok);
}

export async function deleteStoryChapter(token: string, storyId: string, chapterId: string): Promise<boolean> {
  const r = await writerApiFetch<{ ok: boolean }>(`/api/writer/stories/${storyId}/chapters/${chapterId}`, token, {
    method: 'DELETE',
  });
  return Boolean(r?.ok);
}

export async function fetchWriterProfile(token: string): Promise<WriterProfileFull | null> {
  return writerApiFetch<WriterProfileFull>('/api/writer/profile', token);
}

export async function updateWriterProfile(token: string, patch: { writer_name?: string; bio?: string; avatar_url?: string; username?: string }): Promise<{ ok: boolean; error?: string }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    const res = await fetch(`${API_BASE}/api/writer/profile`, {
      method: 'PUT',
      signal: controller.signal,
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(patch),
    });
    clearTimeout(timer);
    const body = await res.json().catch(() => null);
    if (!res.ok) return { ok: false, error: body?.error || `HTTP ${res.status}` };
    return body || { ok: true };
  } catch { return { ok: false, error: 'Network error' }; }
}

export type WriterDashboard = { stories: number; totalViews: number; followers: number; published: number; pending: number; publishedStories: { id: string; title: string; views: number; cover_url?: string; created_at: string; updated_at: string }[]; todayViews: number; weekViews: number; monthViews: number };

export async function fetchWriterDashboard(token: string): Promise<WriterDashboard | null> {
  return writerApiFetch<WriterDashboard>('/api/writer/dashboard', token);
}

export type WriterNotification = { id: string; title: string; body: string; type: string; story_id?: string; is_read: boolean; url?: string; created_at: string };

export async function fetchWriterNotifications(token: string): Promise<WriterNotification[]> {
  return (await writerApiFetch<WriterNotification[]>('/api/writer/notifications', token)) || [];
}

export async function markWriterNotificationsRead(token: string, ids?: string[]): Promise<boolean> {
  const r = await writerApiFetch<{ ok: boolean }>('/api/writer/notifications/read', token, {
    method: 'POST', body: JSON.stringify({ ids }),
  });
  return Boolean(r?.ok);
}

export async function deleteWriterNotification(token: string, id: string): Promise<boolean> {
  const r = await writerApiFetch<{ ok: boolean }>(`/api/writer/notifications/${id}`, token, { method: 'DELETE' });
  return Boolean(r?.ok);
}

export type WriterFollower = { id: string; username: string; writer_name: string; bio?: string; avatar_url?: string; follower_count?: number; badge?: string };

export async function fetchWriterFollowers(token: string): Promise<WriterFollower[]> {
  return (await writerApiFetch<WriterFollower[]>('/api/writer/followers', token)) || [];
}

export async function submitStoryForReview(token: string, storyId: string): Promise<boolean> {
  const r = await writerApiFetch<{ ok: boolean; status: string }>(`/api/writer/stories/${storyId}/submit`, token, {
    method: 'POST',
  });
  return Boolean(r?.ok);
}
