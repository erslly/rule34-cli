import { Category } from '../types';

export const CATEGORIES: Category[] = [
  { id: 1, name: 'Anime', tags: ['anime', '1girl', 'solo'] },
  { id: 2, name: 'Manga', tags: ['manga', 'monochrome'] },
  { id: 3, name: 'Original', tags: ['original', 'artist'] },
  { id: 4, name: 'Video Games', tags: ['video_games', 'game'] },
  { id: 5, name: 'Western', tags: ['western', 'cartoon'] },
  { id: 6, name: 'Furry', tags: ['furry', 'anthro'] },
  { id: 7, name: 'Misc', tags: ['misc'] },
  { id: 8, name: 'Hentai', tags: ['hentai', 'nsfw'] },
  { id: 9, name: 'Video', tags: ['video', 'animated'] }
];

export const API_CONFIG = {
  BASE_URL: 'https://api.rule34.xxx/index.php',
  DEFAULT_LIMIT: 100,
  DOWNLOAD_DIR: 'downloads'
};