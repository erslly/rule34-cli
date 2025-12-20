export type Source = 'rule34' | 'phub';

export interface Post {
  id: number;
  file_url: string;
  width: number;
  height: number;
  tags?: string;
  source?: string;
}

export interface Rule34Post extends Post {
  created_at: string;
  updated_at: string;
  creator_id: number;
  author: string;
  change: number;
  source: string;
  score: number;
  md5: string;
  parent_id?: number;
  sample_url: string;
  sample_width: number;
  sample_height: number;
  preview_url: string;
  rating: string;
  has_notes: boolean;
  has_comments: boolean;
  preview_width: number;
  preview_height: number;
}

export interface ApiResponse {
  posts?: Rule34Post[];
  const?: number;
}

export interface Category {
  id: number;
  name: string;
  tags: string[];
}

export interface DownloadOptions {
  category: string;
  limit: number;
  outputDir: string;
}

export interface DownloadResult {
  success: boolean;
  filePath?: string;
  error?: string;
  audioChannel?: boolean;
  fileSize?: number;
  post?: Post;
}

export interface BatchDownloadResult {
  total: number;
  successful: number;
  failed: number;
  downloads: DownloadResult[];
}

export interface DownloadRecord {
  id: number;
  category: string;
  type: 'image' | 'video';
  size: number;
  width: number;
  height: number;
  timestamp: string;
  filePath: string;
}

export interface Stats {
  downloads: DownloadRecord[];
  totalDownloads: number;
  totalSize: number;
  firstDownload?: string;
  lastDownload?: string;
  categoryStats: { [key: string]: number };
  typeStats: { image: number; video: number };
}
