import axios from 'axios';
import chalk from 'chalk';
import { Post } from '../types';
import { NEKOBOT_API_CONFIG } from '../config/categories';

export class PhubService {
    private baseUrl: string;

    constructor() {
        this.baseUrl = NEKOBOT_API_CONFIG.BASE_URL;
    }

    async getPosts(type: string, limit: number = 1): Promise<Post[]> {
        try {
            const fetchPromises = Array.from({ length: limit }, () =>
                axios.get(this.baseUrl, {
                    params: { type },
                    timeout: 30000
                })
            );

            const responses = await Promise.all(fetchPromises);
            const posts: Post[] = [];

            for (const response of responses) {
                if (response.status === 200 && response.data && response.data.success) {
                    posts.push({
                        id: Math.floor(Math.random() * 1000000),
                        file_url: response.data.message,
                        width: 0,
                        height: 0,
                        tags: type,
                        source: 'phub'
                    });
                }
            }

            return posts;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : 'Bilinmeyen hata';
            console.error(chalk.red(`\nPHub API hatası: ${errorMsg}`));
            throw new Error("PHub'dan içerik alınamadı");
        }
    }

    async getRandomPost(type: string): Promise<Post | null> {
        const posts = await this.getPosts(type, 1);
        return posts.length > 0 ? posts[0] : null;
    }

    async getVideoPost(type: string): Promise<Post | null> {
        return this.getRandomPost(type);
    }
}
