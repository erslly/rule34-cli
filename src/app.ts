import ora from 'ora';
import chalk from 'chalk';
import { ApiService } from './services/apiService';
import { PhubService } from './services/phubService';
import { DownloadService } from './services/downloadService';
import { MenuService } from './services/menuService';
import { StatsService } from './services/statsService';
import { CATEGORIES, PHUB_CATEGORIES } from './config/categories';
import { Rule34Post, DownloadResult, DownloadRecord, Source, Post } from './types';

export class Rule34App {
  private apiService: ApiService;
  private phubService: PhubService;
  private menuService: MenuService;
  private statsService: StatsService;
  private currentSource: Source = 'rule34';

  constructor() {
    this.apiService = new ApiService();
    this.phubService = new PhubService();
    this.menuService = new MenuService();
    this.statsService = new StatsService();
  }

  async run(): Promise<void> {
    this.currentSource = await this.menuService.getSourceChoice();

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
    const sourceName = this.currentSource === 'rule34' ? 'Rule34.xxx' : 'PHub (Nekobot)';
    const categories = this.currentSource === 'rule34' ? CATEGORIES : PHUB_CATEGORIES;

    this.menuService.showHeader(sourceName);
    this.menuService.showCategories(categories);

    console.log('  ' + chalk.magenta.bold('98. İstatistikler 📊'));
    if (this.currentSource === 'rule34') {
      console.log('  ' + chalk.cyan.bold('99. Özel Tag Arama 🔍'));
    }
    console.log();

    const maxChoice = this.currentSource === 'rule34' ? 99 : 98;
    const choice = await this.menuService.getCategoryChoice(maxChoice, categories.length);

    if (choice === 0) {
      this.menuService.showInfo('Çıkış yapılıyor...');
      return true;
    }

    if (choice === 98) {
      await this.showStatistics();
      return false;
    }

    if (choice === 99 && this.currentSource === 'rule34') {
      await this.handleCustomTagSearch();
      return false;
    }

    const selectedCategory = categories.find(cat => cat.id === choice);
    if (!selectedCategory) {
      this.menuService.showError('Geçersiz kategori!');
      await this.menuService.pressEnterToContinue();
      return false;
    }

    await this.handleCategorySelection(selectedCategory.name, selectedCategory.tags);
    return false;
  }

  private async showStatistics(): Promise<void> {
    const stats = this.statsService.getStats();
    this.menuService.showStats(stats, this.statsService);
    await this.menuService.pressEnterToContinue();
  }

  private async handleCustomTagSearch(): Promise<void> {
    const customTags = await this.menuService.getCustomTagsWithSuggestions(this.apiService);
    this.menuService.showInfo(`Etiketler: ${customTags}`);

    const downloadType = await this.menuService.getDownloadType();
    const batchCount = await this.menuService.getBatchCount();

    const confirmed = await this.menuService.getConfirmation(
      `${batchCount} adet ${downloadType === 'video' ? 'video' : 'resim'} indirmek istiyor musunuz?`
    );

    if (!confirmed) return;

    const tags = customTags.split(/\s+/).filter(t => t.length > 0);
    await this.processBatchDownload('Custom', tags, downloadType, batchCount);
  }

  private async handleCategorySelection(categoryName: string, tags: string[]): Promise<void> {
    this.menuService.showInfo(`Seçilen kategori: ${categoryName}`);

    let downloadType: 'image' | 'video' = 'image';

    if (this.currentSource === 'rule34') {
      downloadType = await this.menuService.getDownloadType();
    } else {
      this.menuService.showInfo('PHub içeriği hazırlanıyor...');
    }

    const batchCount = await this.menuService.getBatchCount();

    const confirmed = await this.menuService.getConfirmation(
      `${batchCount} adet içerik indirmek istiyor musunuz?`
    );

    if (!confirmed) return;

    await this.processBatchDownload(categoryName, tags, downloadType, batchCount);
  }

  private async processBatchDownload(
    categoryName: string,
    tags: string[],
    downloadType: 'image' | 'video',
    count: number
  ): Promise<void> {
    const downloadService = new DownloadService(categoryName || 'General');
    const results: DownloadResult[] = [];
    const downloadedIds = new Set<number>();

    console.log(chalk.cyan(`\n📦 Toplu indirme başlatılıyor: ${count} dosya\n`));

    for (let i = 0; i < count; i++) {
      console.log(chalk.yellow(`\n[${i + 1}/${count}] İçerik aranıyor...`));

      const post = await this.fetchUniquePost(tags, downloadType, downloadedIds);

      if (!post) {
        console.log(chalk.red(`[${i + 1}/${count}] Uygun içerik bulunamadı, atlanıyor...`));
        results.push({ success: false, error: 'İçerik bulunamadı' });
        continue;
      }

      downloadedIds.add(post.id);
      console.log(chalk.dim(`[${i + 1}/${count}] ID: ${post.id}`));

      try {
        const result = downloadType === 'video'
          ? await downloadService.downloadVideo(post)
          : await downloadService.downloadPost(post);

        results.push(result);

        if (result.success && result.post && result.filePath && result.fileSize) {
          const record: DownloadRecord = {
            id: result.post.id,
            category: categoryName,
            type: downloadType,
            size: result.fileSize,
            width: result.post.width,
            height: result.post.height,
            timestamp: new Date().toISOString(),
            filePath: result.filePath
          };
          await this.statsService.recordDownload(record);

          console.log(chalk.green(`[${i + 1}/${count}] ✅ Başarılı\n`));
        } else {
          console.log(chalk.red(`[${i + 1}/${count}] ❌ Hata: ${result.error}\n`));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'Bilinmeyen hata';
        console.log(chalk.red(`[${i + 1}/${count}] ❌ Hata: ${errorMsg}\n`));
        results.push({ success: false, error: errorMsg });
      }
    }

    this.showBatchSummary(results, downloadService.getDownloadPath());
    await this.menuService.pressEnterToContinue();
  }

  private async fetchUniquePost(
    tags: string[],
    downloadType: 'image' | 'video',
    downloadedIds: Set<number>
  ): Promise<Post | null> {
    const maxAttempts = 10;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const searchTags = tags.join(' ');
        let post: Post | null = null;

        if (this.currentSource === 'rule34') {
          post = downloadType === 'video'
            ? await this.apiService.getVideoPost(searchTags)
            : await this.apiService.getRandomPost(searchTags);
        } else {
          const type = tags[0] || 'hentai';
          post = downloadType === 'video'
            ? await this.phubService.getVideoPost(type)
            : await this.phubService.getRandomPost(type);
        }

        if (!post) return null;

        if (!downloadedIds.has(post.id)) {
          return post;
        }
      } catch (error) {
        return null;
      }
    }

    return null;
  }

  private showBatchSummary(results: DownloadResult[], downloadPath: string): void {
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(chalk.cyan('\n' + '='.repeat(60)));
    console.log(chalk.bold.cyan('📊 İndirme Özeti'));
    console.log(chalk.cyan('='.repeat(60)));
    console.log(chalk.green(`✅ Başarılı: ${successful}`));
    console.log(chalk.red(`❌ Başarısız: ${failed}`));
    console.log(chalk.blue(`📁 Klasör: ${downloadPath}`));
    console.log(chalk.cyan('='.repeat(60) + '\n'));
  }

  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : 'Bilinmeyen hata';
    this.menuService.showError(`Hata: ${errorMessage}`);
  }
}