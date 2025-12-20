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

export const PHUB_CATEGORIES: Category[] = [
  { id: 1, name: 'Hentai', tags: ['hentai'] },
  { id: 2, name: 'Ass', tags: ['ass'] },
  { id: 3, name: 'Porn GIF', tags: ['pgif'] },
  { id: 4, name: 'Thigh', tags: ['thigh'] },
  { id: 5, name: 'Hass', tags: ['hass'] },
  { id: 6, name: 'Boobs', tags: ['boobs'] },
  { id: 7, name: 'HBoobs', tags: ['hboobs'] },
  { id: 8, name: 'Pussy', tags: ['pussy'] },
  { id: 9, name: 'Paizuri', tags: ['paizuri'] },
  { id: 10, name: 'Lewd Neko', tags: ['lewdneko'] },
  { id: 11, name: 'Feet', tags: ['feet'] },
  { id: 12, name: 'Hyuri', tags: ['hyuri'] },
  { id: 13, name: 'HThigh', tags: ['hthigh'] },
  { id: 14, name: 'HMidriff', tags: ['hmidriff'] },
  { id: 15, name: 'Anal', tags: ['anal'] },
  { id: 16, name: 'Blowjob', tags: ['blowjob'] },
  { id: 17, name: 'Gonewild', tags: ['gonewild'] },
  { id: 18, name: 'HKitsune', tags: ['hkitsune'] },
  { id: 19, name: 'Tentacle', tags: ['tentacle'] },
  { id: 20, name: '4K NSFW', tags: ['4k'] },
  { id: 21, name: 'Hentai Anal', tags: ['hentai_anal'] },
  { id: 22, name: 'Pee', tags: ['pee'] },
  { id: 23, name: 'Yaoi', tags: ['yaoi'] },
  { id: 24, name: 'Neko', tags: ['neko'] },
  { id: 25, name: 'Futa', tags: ['futa'] },
  { id: 26, name: 'kemonomimi', tags: ['kemonomimi'] }
];

export const API_CONFIG = {
  BASE_URL: 'https://api.rule34.xxx/index.php',
  DEFAULT_LIMIT: 100,
  DOWNLOAD_DIR: 'downloads'
};

export const NEKOBOT_API_CONFIG = {
  BASE_URL: 'https://nekobot.xyz/api/image',
  DEFAULT_TYPE: 'hentai'
};