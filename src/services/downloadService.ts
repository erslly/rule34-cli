import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { Rule34Post, DownloadResult } from '../types';
import { API_CONFIG } from '../config/categories';
import ffmpeg from 'fluent-ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';

export class DownloadService {
  private downloadDir: string;

  constructor(downloadDir: string = API_CONFIG.DOWNLOAD_DIR) {
    this.downloadDir = downloadDir;
    this.ensureDownloadDir();
  }

  private ensureDownloadDir(): void {
    if (!fs.existsSync(this.downloadDir)) {
      fs.mkdirSync(this.downloadDir, { recursive: true });
    }
  }

  private getFileExtension(url: string): string {
    const urlPath = new URL(url).pathname;
    const extension = path.extname(urlPath);
    return extension || '.jpg';
  }

  private generateFilename(post: Rule34Post): string {
    const extension = this.getFileExtension(post.file_url);
    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substring(2, 8);
    
    return `rule34_${post.id}_${timestamp}_${randomId}${extension}`;
  }

  async downloadPost(post: Rule34Post): Promise<DownloadResult> {
    try {
      const filename = this.generateFilename(post);
      const filePath = path.join(this.downloadDir, filename);

      console.log(`İndiriliyor: ${post.file_url}`);

      const response = await axios({
        method: 'GET',
        url: post.file_url,
        responseType: 'stream',
        timeout: 60000
      });

      const writer = fs.createWriteStream(filePath);
      response.data.pipe(writer);

      return new Promise((resolve) => {
        writer.on('finish', async () => {
          let audioChannel = undefined;
          if (filePath.match(/\.(mp4|webm|mov|avi)$/i)) {
            ffmpeg.setFfprobePath(ffprobeInstaller.path);
            try {
              const metadata = await new Promise<any>((res, rej) => {
                ffmpeg.ffprobe(filePath, (err, data) => {
                  if (err) rej(err);
                  else res(data);
                });
              });
              audioChannel = Array.isArray(metadata.streams)
                ? metadata.streams.some((s: any) => s.codec_type === 'audio')
                : false;
            } catch {
              audioChannel = false;
            }
          }
          resolve({
            success: true,
            filePath: filePath,
            audioChannel
          });
        });

        writer.on('error', (error) => {
          resolve({
            success: false,
            error: error.message
          });
        });
      });

    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Bilinmeyen hata'
      };
    }
  }

  async downloadVideo(post: Rule34Post): Promise<DownloadResult> {
    if (!post.file_url.match(/\.(mp4|webm|mov|avi)$/i)) {
      return {
        success: false,
        error: 'Bu dosya video formatında değil'
      };
    }

    return this.downloadPost(post);
  }

  getDownloadPath(): string {
    return path.resolve(this.downloadDir);
  }
}
