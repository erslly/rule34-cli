import axios from 'axios';
import { Rule34Post } from '../types';
import { API_CONFIG } from '../config/categories';

export class ApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = API_CONFIG.BASE_URL;
  }

  async getPosts(tags: string, limit: number = API_CONFIG.DEFAULT_LIMIT): Promise<Rule34Post[]> {
    try {
      const userId = process.env.RULE34_USER_ID;
      const apiKey = process.env.RULE34_API_KEY;

      if (!userId || !apiKey) {
        throw new Error('apı key bulunamadi');
      }

      const params = {
        page: 'dapi',
        s: 'post',
        q: 'index',
        tags: tags,
        limit: limit.toString(),
        user_id: userId,
        api_key: apiKey
      };

      const response = await axios.get(this.baseUrl, {
        params,
        timeout: 30000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
      });

      if (response.status === 200 && response.data) {
        if (typeof response.data === 'string') {
          const posts: Rule34Post[] = [];
          const postMatches = response.data.match(/<post\s+[^>]*\/>/g);

          if (postMatches) {
            postMatches.forEach(postStr => {
              const post: any = {};
              const attributes = postStr.match(/(\w+)="([^"]*)"/g);
              if (attributes) {
                attributes.forEach(attr => {
                  const [key, value] = attr.split('=');
                  const cleanValue = value.replace(/"/g, '');
                  post[key] = cleanValue;
                });

                post.id = parseInt(post.id);
                post.width = parseInt(post.width);
                post.height = parseInt(post.height);
                post.sample_width = parseInt(post.sample_width);
                post.sample_height = parseInt(post.sample_height);
                post.preview_width = parseInt(post.preview_width);
                post.preview_height = parseInt(post.preview_height);
                post.score = parseInt(post.score);
                post.creator_id = parseInt(post.creator_id);

                posts.push(post as Rule34Post);
              }
            });
          }
          return posts;
        }
      }

      return [];
    } catch (error) {
      console.error('api hatasi:', error);
      throw new Error("api'den veri alınamadı");
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
      console.error('post alinamadi:', error);
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
      console.error('video alinamadi:', error);
      return null;
    }
  }

  async suggestTags(term: string): Promise<string[]> {
    try {
      const response = await axios.get('https://ac.rule34.xxx/autocomplete.php', {
        params: { q: term },
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://rule34.xxx/'
        }
      });

      if (response.status === 200 && Array.isArray(response.data)) {
        return response.data.map((item: any) => item.value);
      }
      return [];
    } catch (error) {
      console.error('etiket onerisi alinamadi:', error);
      return [];
    }
  }
}