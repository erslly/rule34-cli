export interface Rule34Post {
  id: number;
  tags: string;
  created_at: string;
  updated_at: string;
  creator_id: number;
  author: string;
  change: number;
  source: string;
  score: number;
  md5: string;
  file_url: string;
  width: number;
  height: number;
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
}
