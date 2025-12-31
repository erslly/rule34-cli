import ora from 'ora';
import chalk from 'chalk';
import { ApiService } from './services/apiService';
import { PhubService } from './services/phubService';
import { DownloadService } from './services/downloadService';
import { MenuService } from './services/menuService';
import { StatsService } from './services/statsService';
import { LocalizationService } from './services/localizationService';
import { CATEGORIES, PHUB_CATEGORIES } from './config/categories';
import { Rule34Post, DownloadResult, DownloadRecord, Source, Post, Language } from './types';

export class Rule34App {
  private apiService: ApiService;
  private phubService: PhubService;
  private menuService: MenuService;
  private statsService: StatsService;
  private localizationService: LocalizationService;
  private currentSource: Source = 'rule34';

  constructor() {
    this.apiService = new ApiService();
    this.phubService = new PhubService();
    this.statsService = new StatsService();
    this.localizationService = new LocalizationService();
    this.menuService = new MenuService(this.localizationService);
  }

  async run(): Promise<void> {
    if (!this.localizationService.isConfigured()) {
      const lang = await this.menuService.getLanguageChoice();
      this.localizationService.setLanguage(lang);
    }

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

    console.log('  ' + chalk.yellow.bold(`97. ${this.localizationService.get('menu.change_language') || 'Change Language/Dil Değiştir'}`));
    console.log('  ' + chalk.magenta.bold(this.localizationService.get('menu.stats')));
    if (this.currentSource === 'rule34') {
      console.log('  ' + chalk.cyan.bold(this.localizationService.get('menu.custom_search')));
    }
    console.log();

    const maxChoice = this.currentSource === 'rule34' ? 99 : 98;
    const choice = await this.menuService.getCategoryChoice(maxChoice, categories.length);

    if (choice === 0) {
      this.menuService.showInfo(this.localizationService.get('menu.exiting'));
      return true;
    }

    if (choice === 97) {
      await this.handleChangeLanguage();
      return false;
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
      this.menuService.showError(this.localizationService.get('menu.invalid_category_error'));
      await this.menuService.pressEnterToContinue();
      return false;
    }

    await this.handleCategorySelection(selectedCategory.name, selectedCategory.tags);
    return false;
  }

  private async handleChangeLanguage(): Promise<void> {
    const lang = await this.menuService.getLanguageChoice();
    this.localizationService.setLanguage(lang);
    this.menuService.showSuccess('Language changed / Dil değiştirildi');
    await this.menuService.pressEnterToContinue();
  }

  private async showStatistics(): Promise<void> {
    const stats = this.statsService.getStats();
    this.menuService.showStats(stats, this.statsService);
    await this.menuService.pressEnterToContinue();
  }

  private async handleCustomTagSearch(): Promise<void> {
    const customTags = await this.menuService.getCustomTagsWithSuggestions(this.apiService);
    this.menuService.showInfo(this.localizationService.get('menu.custom_tags_label', { tags: customTags }));

    const downloadType = await this.menuService.getDownloadType();
    const batchCount = await this.menuService.getBatchCount();

    const confirmed = await this.menuService.getConfirmation(
      this.localizationService.get('menu.confirm_download', {
        count: batchCount.toString(),
        type: downloadType === 'video' ? 'video' : (this.localizationService.getLanguage() === 'tr' ? 'resim' : 'image')
      })
    );

    if (!confirmed) return;

    const tags = customTags.split(/\s+/).filter(t => t.length > 0);
    await this.processBatchDownload('Custom', tags, downloadType, batchCount);
  }

  private async handleCategorySelection(categoryName: string, tags: string[]): Promise<void> {
    this.menuService.showInfo(this.localizationService.get('menu.selected_category', { category: categoryName }));

    let downloadType: 'image' | 'video' = 'image';

    if (this.currentSource === 'rule34') {
      downloadType = await this.menuService.getDownloadType();
    } else {
      this.menuService.showInfo(this.localizationService.get('menu.phub_preparing'));
    }

    const batchCount = await this.menuService.getBatchCount();

    const confirmed = await this.menuService.getConfirmation(
      this.localizationService.get('menu.confirm_content_download', { count: batchCount.toString() })
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

    console.log(chalk.cyan(this.localizationService.get('download.batch_start', { count: count.toString() })));

    for (let i = 0; i < count; i++) {
      console.log(chalk.yellow(this.localizationService.get('download.searching', {
        current: (i + 1).toString(),
        total: count.toString()
      })));

      const post = await this.fetchUniquePost(tags, downloadType, downloadedIds);

      if (!post) {
        console.log(chalk.red(this.localizationService.get('download.not_found_skip', {
          current: (i + 1).toString(),
          total: count.toString()
        })));
        results.push({ success: false, error: this.localizationService.get('download.content_not_found') });
        continue;
      }

      downloadedIds.add(post.id);
      console.log(chalk.dim(this.localizationService.get('download.found_id', {
        current: (i + 1).toString(),
        total: count.toString(),
        id: post.id.toString()
      })));

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

          console.log(chalk.green(this.localizationService.get('download.success', {
            current: (i + 1).toString(),
            total: count.toString()
          })));
        } else {
          console.log(chalk.red(this.localizationService.get('download.error', {
            current: (i + 1).toString(),
            total: count.toString(),
            error: result.error || 'Unknown'
          })));
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : this.localizationService.get('system.unknown_error');
        console.log(chalk.red(this.localizationService.get('download.error', {
          current: (i + 1).toString(),
          total: count.toString(),
          error: errorMsg
        })));
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
    console.log(chalk.bold.cyan(this.localizationService.get('download.summary_title')));
    console.log(chalk.cyan('='.repeat(60)));
    console.log(chalk.green(this.localizationService.get('download.summary_success', { count: successful.toString() })));
    console.log(chalk.red(this.localizationService.get('download.summary_failed', { count: failed.toString() })));
    console.log(chalk.blue(this.localizationService.get('download.folder', { path: downloadPath })));
    console.log(chalk.cyan('='.repeat(60) + '\n'));
  }

  private handleError(error: unknown): void {
    const errorMessage = error instanceof Error ? error.message : this.localizationService.get('system.unknown_error');
    this.menuService.showError(this.localizationService.get('system.error', { message: errorMessage }));
  }
}