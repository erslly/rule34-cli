import axios, { AxiosResponse } from 'axios';
import { Rule34Post, ApiResponse } from '../types';
import { API_CONFIG } from '../config/categories';

export class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  async getPosts(tags: string, limit: number = API_CONFIG.DEFAULT_LIMIT): Promise<Rule34Post[]> {
    try {
      const params = {
        page: 'dapi',
        s: 'post',
        q: 'index',
        tags: tags,
        limit: limit.toString(),
        json: '1'
      };

      const response: AxiosResponse<Rule34Post[]> = await axios.get(this.baseUrl, {
        params,
        timeout: 30000
      });

      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data;
      }

      return [];
    } catch (error) {
      console.error('API Hatası:', error);
      throw new Error('API\'den veri alınamadı');
    }
  }

  async getRandomPost(tags: string): Promise<Rule34Post | null> {
    try {
      const posts = await this.getPosts(tags, 50);
      
      if (posts.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * posts.length);
      return posts[randomIndex];
    } catch (error) {
      console.error('Rastgele post alınamadı:', error);
      return null;
    }
  }

  async getVideoPost(tags: string): Promise<Rule34Post | null> {
    try {
      const videoTags = `${tags} video animated`;
      const posts = await this.getPosts(videoTags, 30);

      const videoPosts = posts.filter(post => 
        post.file_url.match(/\.(mp4|webm|mov|avi)$/i)
      );

      if (videoPosts.length === 0) {
        return null;
      }

      const randomIndex = Math.floor(Math.random() * videoPosts.length);
      return videoPosts[randomIndex];
    } catch (error) {
      console.error('Video alınamadı:', error);
      return null;
    }
  }
}