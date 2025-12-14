import ora, { Ora } from 'ora';
import { ApiService } from './services/apiService';
import { DownloadService } from './services/downloadService';
import { MenuService } from './services/menuService';
import { CATEGORIES } from './config/categories';
import { Rule34Post } from './types';

export class Rule34App {
  private apiService: ApiService;
  private downloadService: DownloadService;
  private menuService: MenuService;

  constructor() {
    this.apiService = new ApiService();
    this.downloadService = new DownloadService();
    this.menuService = new MenuService();
  }

  async run(): Promise<void> {
    while (true) {
      try {
        const shouldExit = await this.handleMainMenu();
        if (shouldExit) break;
      } catch (error) {
        this.handleError(error);
        await this.menuService.pressEnterToContinue();
      }
    }
  }

  private async handleMainMenu(): Promise<boolean> {
    this.menuService.showHeader();
    this.menuService.showCategories();

    const choice = await this.menuService.getCategoryChoice();

    if (choice === 0) {
      this.menuService.showInfo('Çıkış yapılıyor...');
      return true;
    }

    const selectedCategory = CATEGORIES.find(cat => cat.id === choice);
    if (!selectedCategory) {
      this.menuService.showError('Geçersiz kategori!');
      await this.menuService.pressEnterToContinue();
      return false;
    }

    await this.handleCategorySelection(selectedCategory.name, selectedCategory.tags);
    return false;
  }

  private async handleCategorySelection(categoryName: string, tags: string[]): Promise<void> {
    this.menuService.showInfo(`Seçilen kategori: ${categoryName}`);

    const confirmed = await this.menuService.getConfirmation(
      'Bu kategori için içerik indirmek istiyor musunuz?'
    );

    if (!confirmed) return;

    const downloadType = await this.menuService.getDownloadType();
    await this.processDownload(tags, downloadType);
  }

  private async processDownload(tags: string[], downloadType: 'image' | 'video'): Promise<void> {
    const post = await this.fetchPost(tags, downloadType);
    if (!post) return;

    this.displayPostInfo(post);

    const downloadConfirm = await this.menuService.getConfirmation(
      'Bu dosyayı indirmek istiyor musunuz?'
    );

    if (!downloadConfirm) return;

    await this.downloadPost(post, downloadType);
    await this.menuService.pressEnterToContinue();
  }

  private async fetchPost(tags: string[], downloadType: 'image' | 'video'): Promise<Rule34Post | null> {
    const spinner = ora('İçerik aranıyor...').start();

    try {
      const searchTags = tags.join(' ');
      const post = downloadType === 'video'
        ? await this.apiService.getVideoPost(searchTags)
        : await this.apiService.getRandomPost(searchTags);

      spinner.stop();

      if (!post) {
        this.menuService.showWarning('Bu kategori için uygun içerik bulunamadı!');
        await this.menuService.pressEnterToContinue();
        return null;
      }

      return post;
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private displayPostInfo(post: Rule34Post): void {
    this.menuService.showInfo(`Bulunan içerik: ${post.file_url}`);
    this.menuService.showInfo(`Boyut: ${post.width}x${post.height}`);
    this.menuService.showInfo(`Etiketler: ${post.tags}`);
  }

  private async downloadPost(post: Rule34Post, downloadType: 'image' | 'video'): Promise<void> {
    const spinner = ora('Dosya indiriliyor...').start();

    try {
      const result = downloadType === 'video'
        ? await this.downloadService.downloadVideo(post)
        : await this.downloadService.downloadPost(post);

      spinner.stop();

      if (result.success) {
        this.menuService.showSuccess(`Dosya başarıyla indirildi: ${result.filePath}`);
        this.menuService.showInfo(`İndirme klasörü: ${this.downloadService.getDownloadPath()}`);
      } else {
        this.menuService.showError(`İndirme hatası: ${result.error}`);
      }
    } catch (error) {
      spinner.stop();
      throw error;
    }
  }

  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    this.menuService.showError(`Hata: ${errorMessage}`);
  }
}