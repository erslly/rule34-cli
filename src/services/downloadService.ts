import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import { Rule34Post, DownloadResult } from '../types';
import { API_CONFIG } from '../config/categories';
import ffmpeg from 'fluent-ffmpeg';
import ffprobeInstaller from '@ffprobe-installer/ffprobe';
import cliProgress from 'cli-progress';
import chalk from 'chalk';

export class DownloadService {
  private downloadDir: string;
  private categoryName?: string;

  constructor(categoryName?: string, baseDir: string = API_CONFIG.DOWNLOAD_DIR) {
    this.categoryName = categoryName;
    this.downloadDir = this.buildDownloadPath(baseDir);
    this.ensureDownloadDir();
  }

  private buildDownloadPath(baseDir: string): string {
    if (this.categoryName) {
      const normalizedCategory = this.categoryName
        .toLowerCase()
        .replace(/\s+/g, '_')
        .replace(/[^a-z0-9_]/g, '');
      return path.join(baseDir, normalizedCategory);
    }
    return baseDir;
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

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }

  async downloadPost(post: Rule34Post): Promise<DownloadResult> {
    try {
      const filename = this.generateFilename(post);
      const filePath = path.join(this.downloadDir, filename);

      const response = await axios({
        method: 'GET',
        url: post.file_url,
        responseType: 'stream',
        timeout: 60000
      });

      const totalLength = parseInt(response.headers['content-length'] || '0', 10);
      let downloadedLength = 0;

      const progressBar = new cliProgress.SingleBar({
        format: chalk.cyan('İndiriliyor |') + chalk.green('{bar}') + chalk.cyan('| {percentage}% | {downloaded}/{total}'),
        barCompleteChar: '\u2588',
        barIncompleteChar: '\u2591',
        hideCursor: true
      });

      progressBar.start(totalLength, 0, {
        downloaded: this.formatBytes(0),
        total: this.formatBytes(totalLength)
      });

      const writer = fs.createWriteStream(filePath);

      response.data.on('data', (chunk: Buffer) => {
        downloadedLength += chunk.length;
        progressBar.update(downloadedLength, {
          downloaded: this.formatBytes(downloadedLength),
          total: this.formatBytes(totalLength)
        });
      });

      response.data.pipe(writer);

      return new Promise((resolve) => {
        writer.on('finish', async () => {
          progressBar.stop();

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
            audioChannel,
            fileSize: totalLength,
            post: post
          });
        });

        writer.on('error', (error) => {
          progressBar.stop();
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
