import * as fs from 'fs';
import { Stats, DownloadRecord } from '../types';

export class StatsService {
    private statsFile: string;

    constructor(statsFile: string = 'stats.json') {
        this.statsFile = statsFile;
    }

    async recordDownload(record: DownloadRecord): Promise<void> {
        const stats = this.loadStats();

        stats.downloads.push(record);
        stats.totalDownloads++;
        stats.totalSize += record.size;
        stats.lastDownload = record.timestamp;

        if (!stats.firstDownload) {
            stats.firstDownload = record.timestamp;
        }

        if (!stats.categoryStats[record.category]) {
            stats.categoryStats[record.category] = 0;
        }
        stats.categoryStats[record.category]++;

        stats.typeStats[record.type]++;

        this.saveStats(stats);
    }

    getStats(): Stats {
        return this.loadStats();
    }

    private loadStats(): Stats {
        if (!fs.existsSync(this.statsFile)) {
            return {
                downloads: [],
                totalDownloads: 0,
                totalSize: 0,
                categoryStats: {},
                typeStats: { image: 0, video: 0 }
            };
        }

        try {
            const data = fs.readFileSync(this.statsFile, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error('Stats dosyası okunamadı, yeni oluşturuluyor...');
            return {
                downloads: [],
                totalDownloads: 0,
                totalSize: 0,
                categoryStats: {},
                typeStats: { image: 0, video: 0 }
            };
        }
    }

    private saveStats(stats: Stats): void {
        try {
            fs.writeFileSync(this.statsFile, JSON.stringify(stats, null, 2), 'utf-8');
        } catch (error) {
            console.error('Stats kaydedilemedi:', error);
        }
    }

    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
    }

    getRelativeTime(timestamp: string): string {
        const now = new Date();
        const then = new Date(timestamp);
        const diffMs = now.getTime() - then.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Az önce';
        if (diffMins < 60) return `${diffMins} dakika önce`;
        if (diffHours < 24) return `${diffHours} saat önce`;
        if (diffDays < 30) return `${diffDays} gün önce`;

        return then.toLocaleDateString('tr-TR');
    }
}
