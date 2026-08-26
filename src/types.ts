export type Chapter = { id: string; title: string; minutes: number; body: string };
export type Book = {
  id: string; title: string; author: string; category: string; categoryIcon: string;
  color: string; accent: string; views: string; rating: number; isNew?: boolean;
  description: string; updated: string; chapters: Chapter[]; cover_url?: string | null;
};
export type Language = 'en' | 'bn' | 'hi';
export type Settings = { dark: boolean; fontSize: number; lineHeight: number; notifications: boolean; wifiOnly: boolean; language: Language };
export type Comment = { id: string; book_id: string; device_id: string; name: string; body: string; status: string; created_at: string };
export type LocalState = {
  name: string; deviceId: string; favorites: string[]; downloads: string[]; history: string[];
  positions: Record<string, number>; bookmarks: string[]; searchHistory: string[];
  settings: Settings; readNotifications: string[]; reactions: Record<string, 'like' | 'dislike'>;
  remoteBooks: Book[]; online: boolean; lastSync: string;
};
export type Route =
  | { name: 'main' }
  | { name: 'search' }
  | { name: 'notifications' }
  | { name: 'category'; category: string }
  | { name: 'book'; bookId: string }
  | { name: 'reader'; bookId: string; chapterIndex: number }
  | { name: 'settings' }
  | { name: 'writer' }
  | { name: 'list'; title: string; ids: string[] };
