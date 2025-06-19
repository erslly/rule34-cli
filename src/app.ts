import ora from 'ora';
import { ApiService } from './services/apiService';
import { DownloadService } from './services/downloadService';
import { MenuService } from './services/menuService';
import { CATEGORIES } from './config/categories';

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
        this.menuService.showHeader();
        this.menuService.showCategories();

        const choice = await this.menuService.getCategoryChoice();

        if (choice === 0) {
          this.menuService.showInfo('Çıkış yapılıyor...');
          break;
        }

        const selectedCategory = CATEGORIES.find(cat => cat.id === choice);
        if (!selectedCategory) {
          this.menuService.showError('Geçersiz kategori!');
          await this.menuService.pressEnterToContinue();
          continue;
        }

        this.menuService.showInfo(`Seçilen kategori: ${selectedCategory.name}`);

        const confirmed = await this.menuService.getConfirmation(
          'Bu kategori için içerik indirmek istiyor musunuz?'
        );

        if (!confirmed) {
          continue;
        }

        const downloadType = await this.menuService.getDownloadType();

        await this.processDownload(selectedCategory.name, selectedCategory.tags, downloadType);

      } catch (error) {
        this.menuService.showError(`Hata: ${error instanceof Error ? error.message : 'Bilinmeyen hata'}`);
        await this.menuService.pressEnterToContinue();
      }
    }
  }

  private async processDownload(categoryName: string, tags: string[], downloadType: 'image' | 'video'): Promise<void> {
    const spinner = ora('İçerik aranıyor...').start();

    try {
      const searchTags = tags.join(' ');
      let post;

      if (downloadType === 'video') {
        post = await this.apiService.getVideoPost(searchTags);
      } else {
        post = await this.apiService.getRandomPost(searchTags);
      }

      spinner.stop();

      if (!post) {
        this.menuService.showWarning('Bu kategori için uygun içerik bulunamadı!');
        await this.menuService.pressEnterToContinue();
        return;
      }

      this.menuService.showInfo(`Bulunan içerik: ${post.file_url}`);
      this.menuService.showInfo(`Boyut: ${post.width}x${post.height}`);
      this.menuService.showInfo(`Etiketler: ${post.tags}`);

      const downloadConfirm = await this.menuService.getConfirmation('Bu dosyayı indirmek istiyor musunuz?');
      
      if (!downloadConfirm) {
        return;
      }

      const downloadSpinner = ora('Dosya indiriliyor...').start();

      let result;
      if (downloadType === 'video') {
        result = await this.downloadService.downloadVideo(post);
      } else {
        result = await this.downloadService.downloadPost(post);
      }

      downloadSpinner.stop();

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

    await this.menuService.pressEnterToContinue();
  }
}