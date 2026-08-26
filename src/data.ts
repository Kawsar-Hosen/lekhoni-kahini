import { Book } from './types';

const prose = [
  `নদীর ওপারে তখনো কুয়াশা জমে আছে। ঘাটের পুরোনো বটগাছটির নিচে দাঁড়িয়ে অনিক ভাবল, এই শহরে প্রতিটি সকাল যেন একটি নতুন চিঠি। খাম নেই, ঠিকানা নেই, তবু তার ভাঁজে ভাঁজে কত কথা লুকানো।`,
  `মাঝির বৈঠা জলে পড়তেই গোল হয়ে ঢেউ ছড়িয়ে গেল। দূরের মসজিদ থেকে আজানের সুর ভেসে এলো, আর বাজারের প্রথম দোকানটি ঝাঁপ তুলল। জীবন এখানে কখনো থামে না; শুধু একটু ধীরে হাঁটে, যাতে মানুষ তার গল্পগুলো ভালো করে শুনতে পারে।`,
  `অনিক পকেট থেকে মায়ের দেওয়া নীল রুমালটি বের করল। বহু বছর আগের গন্ধ কি কাপড়ে থেকে যায়? সে জানে না। কিন্তু রুমালটি হাতে নিলেই তার মনে হয়, কেউ একজন এখনো বলছে, “ফিরতে দেরি করিস না।”`,
  `নৌকা ঘাট ছাড়ার পর শহরটাকে ছোট দেখাচ্ছিল। টিনের চাল, সরু গলি আর কৃষ্ণচূড়ার লাল ফুল একসঙ্গে মিশে যেন একটি জলরঙের ছবি। অনিক চোখ বন্ধ করল। সামনে কী আছে সে জানে না, তবে পেছনের পথ তাকে সাহস দিচ্ছে।`,
  `সেদিন বিকেলে বৃষ্টি নামল হঠাৎ। জানালার কাচে টুপটাপ শব্দের মধ্যে পুরোনো ডায়েরির পাতাগুলো খুলে গেল। প্রথম পাতায় লেখা ছিল, “যে গল্প বলা হয়নি, সে গল্পই সবচেয়ে বেশি মনে থাকে।” অনিক কলম তুলে নিল।`,
];
const chapters = (prefix: string) => prose.map((body, index) => ({ id: `${prefix}-${index + 1}`, title: ['ফিরে দেখা', 'নদীর ওপারে', 'নীল রুমাল', 'অচেনা পথ', 'শেষ চিঠি'][index], minutes: 6 + index, body: `${body}\n\n${prose[(index + 1) % prose.length]}\n\n${body}` }));

export const categories = [
  ['উপন্যাস', 'book-open', '#DDF5EC'], ['রোমান্টিক', 'heart', '#FBE7EB'], ['রহস্য', 'search', '#E8E5F8'],
  ['থ্রিলার', 'zap', '#FFF0D7'], ['ভৌতিক', 'moon', '#E4E9ED'], ['কবিতা', 'feather', '#E6F1FF'],
  ['ইতিহাস', 'archive', '#F7EAD7'], ['কিশোর', 'sun', '#FFF6CC'], ['মুক্তিযুদ্ধ', 'flag', '#E1F3E7'],
] as const;

export const books: Book[] = [
  { id: 'nodi', title: 'নদীর ওপারে আলো', author: 'আনিসুল হক', category: 'উপন্যাস', categoryIcon: 'book-open', color: '#123E39', accent: '#F5C660', views: '১৮.৪ হাজার', rating: 4.8, isNew: true, updated: 'আজ', description: 'হারানো শহর, স্মৃতি আর ফিরে আসার আকাঙ্ক্ষা নিয়ে এক মায়াময় উপন্যাস।', chapters: chapters('nodi') },
  { id: 'megh', title: 'মেঘের নিচে বাড়ি', author: 'সাদাত হোসাইন', category: 'রোমান্টিক', categoryIcon: 'heart', color: '#6D3B46', accent: '#F3B5B9', views: '১২.৯ হাজার', rating: 4.6, updated: '২ ঘণ্টা আগে', description: 'দূরত্বের ভেতরেও পাশাপাশি বেঁচে থাকা দুজন মানুষের কোমল গল্প।', chapters: chapters('megh') },
  { id: 'ghori', title: 'তিনটার ঘড়ি', author: 'মোহাম্মদ নাজিম উদ্দিন', category: 'থ্রিলার', categoryIcon: 'zap', color: '#292E3D', accent: '#DF6E52', views: '৯.৭ হাজার', rating: 4.7, isNew: true, updated: '৫ ঘণ্টা আগে', description: 'প্রতি রাত তিনটায় থেমে যাওয়া ঘড়ি এবং একটি অসমাপ্ত তদন্তের শ্বাসরুদ্ধকর কাহিনী।', chapters: chapters('ghori') },
  { id: 'jochona', title: 'জোছনার অন্ধকার', author: 'তানজিম রহমান', category: 'রহস্য', categoryIcon: 'search', color: '#383655', accent: '#C3B7EA', views: '৭.১ হাজার', rating: 4.5, updated: 'গতকাল', description: 'নির্জন পাহাড়ি বাড়ির বন্ধ দরজার পেছনে লুকিয়ে থাকা বহু বছরের রহস্য।', chapters: chapters('jochona') },
  { id: 'shohor', title: 'শহরের শেষ ট্রেন', author: 'নুসরাত জাহান', category: 'উপন্যাস', categoryIcon: 'book-open', color: '#185366', accent: '#EFAB62', views: '৬.৮ হাজার', rating: 4.4, updated: '২ দিন আগে', description: 'একটি ট্রেন, সাতজন যাত্রী এবং বদলে যাওয়া জীবনের গল্প।', chapters: chapters('shohor') },
  { id: 'kobita', title: 'বৃষ্টির কাছে চিঠি', author: 'শামীমা সুলতানা', category: 'কবিতা', categoryIcon: 'feather', color: '#276250', accent: '#D9DF91', views: '৫.৩ হাজার', rating: 4.9, isNew: true, updated: '৩ দিন আগে', description: 'প্রেম, প্রকৃতি ও নাগরিক নিঃসঙ্গতার পঞ্চাশটি কবিতার সংকলন।', chapters: chapters('kobita') },
  { id: 'ekattor', title: 'একাত্তরের দিনলিপি', author: 'রাশেদুল ইসলাম', category: 'মুক্তিযুদ্ধ', categoryIcon: 'flag', color: '#59412E', accent: '#D6A25E', views: '১১.২ হাজার', rating: 4.8, updated: '১ সপ্তাহ আগে', description: 'একটি পরিবারের চোখে দেখা স্বাধীনতার নয় মাসের অকপট দিনলিপি।', chapters: chapters('ekattor') },
  { id: 'chaya', title: 'উত্তরের ছায়া', author: 'মুনতাসীর মামুন', category: 'ভৌতিক', categoryIcon: 'moon', color: '#232F32', accent: '#A8C0B7', views: '৮.৬ হাজার', rating: 4.3, updated: '১ সপ্তাহ আগে', description: 'পুরোনো চা-বাগানের বাংলোয় কাটানো কয়েকটি অস্বাভাবিক রাত।', chapters: chapters('chaya') },
];

export const notices = [
  { id: 'n1', title: 'নতুন অধ্যায় এসেছে', body: 'নদীর ওপারে আলো • অধ্যায় ৫ এখন পড়ুন', time: '১০ মিনিট আগে', icon: 'book-open' },
  { id: 'n2', title: 'আপনার পছন্দের লেখক', body: 'নুসরাত জাহান নতুন গল্প প্রকাশ করেছেন', time: '২ ঘণ্টা আগে', icon: 'feather' },
  { id: 'n3', title: 'অফলাইন পড়ার জন্য প্রস্তুত', body: 'তিনটার ঘড়ি ডাউনলোড সম্পন্ন হয়েছে', time: 'গতকাল', icon: 'download-cloud' },
];
