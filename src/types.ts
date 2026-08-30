export type Chapter = { id: string; title: string; minutes: number; body: string };
export type Book = {
  id: string; title: string; author: string; category: string; categoryIcon: string;
  color: string; accent: string; views: string; rating: number; likes?: number; isNew?: boolean;
  featured?: boolean; homeSection?: string; views_visible?: boolean; display_status?: string; writer_status?: string;
  description: string; updated: string; chapters: Chapter[]; cover_url?: string | null;
};
export type Language = 'en' | 'bn' | 'hi';
export type ThemeId = 'katagolap' | 'sepia' | 'midnight' | 'godhuli' | 'sagar' | 'oronno' | 'lavender' | 'golapi' | 'shapla' | 'golap';
export type FontFamily = 'default' | 'serif' | 'loose';
export type PageMode = 'scroll' | 'page';
export type Settings = { dark: boolean; fontSize: number; lineHeight: number; lineSpacing: number; fontFamily: FontFamily; pageMode: PageMode; notifications: boolean; wifiOnly: boolean; language: Language; themeId: ThemeId };
export type Comment = { id: string; book_id: string; device_id: string; name: string; body: string; status: string; created_at: string };
export type WriterProfile = { id: string; username: string; writer_name: string; bio?: string; avatar_url?: string | null; follower_count?: number; badge?: string; followed_at?: string };
export type LocalState = {
  name: string; deviceId: string; favorites: string[]; downloads: string[]; history: string[];
  positions: Record<string, number>; bookmarks: string[]; searchHistory: string[];
  settings: Settings; readNotifications: string[]; reactions: Record<string, 'like' | 'dislike'>;
  remoteBooks: Book[]; online: boolean; lastSync: string;
  writer?: { id: string; username: string; writer_name: string; avatar_url?: string; bio?: string } | null;
  writerToken?: string | null;
  followedWriters: WriterProfile[];
  readingActivity: Record<string, { minutes: number; episodes: number }>;
  ageVerified?: boolean;
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
