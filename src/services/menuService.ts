import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import { CATEGORIES } from '../config/categories';
import { LocalizationService } from './localizationService';

export class MenuService {
  private localizationService: LocalizationService;

  constructor(localizationService: LocalizationService) {
    this.localizationService = localizationService;
  }

  showHeader(source: string = 'Rule34'): void {
    console.clear();
    console.log(chalk.cyan('╔═════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║           https://github.com/erslly/rule34-cli                  ║'));
    console.log(chalk.cyan(`║                    ${source.padEnd(20)}                         ║`));
    console.log(chalk.cyan('╚═════════════════════════════════════════════════════════════════╝'));
    console.log();
  }


  showCategories(categories: any[] = CATEGORIES): void {
    console.log(chalk.yellow(this.localizationService.get('menu.categories_title')));
    console.log();

    categories.forEach(category => {
      const catKey = category.name.toLowerCase().replace(/\s+/g, '_');
      const translatedName = this.localizationService.get(`categories.${catKey}`);
      const displayName = translatedName.startsWith('categories.') ? category.name : translatedName;

      console.log(chalk.green(`${category.id}. ${displayName}`));
    });

    console.log(chalk.red(this.localizationService.get('menu.exit')));
    console.log();
  }

  async getSourceChoice(): Promise<'rule34' | 'phub'> {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'source',
        message: this.localizationService.get('menu.source_select'),
        choices: [
          { name: 'rule34', value: 'rule34' },
          { name: 'phub', value: 'phub' }
        ]
      }
    ]);

    return answer.source;
  }

  async getLanguageChoice(): Promise<'tr' | 'en'> {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'language',
        message: 'Select Language / Dil Seçin:',
        choices: [
          { name: 'Türkçe', value: 'tr' },
          { name: 'English', value: 'en' }
        ]
      }
    ]);

    return answer.language;
  }

  async getCategoryChoice(maxSpecial: number = 99, numCategories: number = 24): Promise<number> {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'category',
        message: this.localizationService.get('menu.category_select', { max: numCategories }),
        validate: (input) => {
          const num = parseInt(input);
          if (isNaN(num)) return this.localizationService.get('menu.invalid_number');

          const isValidCategory = num >= 0 && num <= numCategories;
          const isValidSpecial = num === 97 || num === 98 || num === 99;

          if (!isValidCategory && !isValidSpecial) {
            return this.localizationService.get('menu.invalid_category', { max: numCategories });
          }
          return true;
        }
      }
    ]);

    return parseInt(answer.category);
  }

  async getConfirmation(message: string): Promise<boolean> {
    const answer = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: message,
        default: false
      }
    ]);

    return answer.confirm;
  }

  async getDownloadType(): Promise<'image' | 'video'> {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'type',
        message: this.localizationService.get('menu.download_type_select'),
        choices: [
          { name: this.localizationService.get('menu.image'), value: 'image' },
          { name: this.localizationService.get('menu.video'), value: 'video' }
        ]
      }
    ]);

    return answer.type;
  }

  async getBatchCount(): Promise<number> {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'count',
        message: chalk.cyan('❯') + ' ' + this.localizationService.get('menu.batch_count'),
        default: '1',
        validate: (input) => {
          const num = parseInt(input);
          if (isNaN(num) || num < 1 || num > 50) {
            return chalk.red(this.localizationService.get('menu.invalid_batch_count'));
          }
          return true;
        }
      }
    ]);

    return parseInt(answer.count);
  }

  async getCustomTags(): Promise<string> {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'tags',
        message: chalk.cyan('❯') + ' ' + this.localizationService.get('menu.enter_tags'),
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return chalk.red(this.localizationService.get('menu.tags_required'));
          }
          return true;
        }
      }
    ]);

    return answer.tags.trim();
  }

  showSuccess(message: string): void {
    console.log(chalk.green(`✅ ${message}`));
  }

  showError(message: string): void {
    console.log(chalk.red(`❌ ${message}`));
  }

  showWarning(message: string): void {
    console.log(chalk.yellow(`⚠️  ${message}`));
  }

  showInfo(message: string): void {
    console.log(chalk.blue(`ℹ️  ${message}`));
  }

  async getCustomTagsWithSuggestions(apiService: any): Promise<string> {
    const selectedTags: string[] = [];

    while (true) {
      this.showHeader();
      if (selectedTags.length > 0) {
        console.log(chalk.cyan(this.localizationService.get('menu.selected_tags')) + chalk.bold.yellow(selectedTags.join(' ')) + '\n');
      }

      const { searchTerm } = await inquirer.prompt([
        {
          type: 'input',
          name: 'searchTerm',
          message: this.localizationService.get('menu.search_prompt'),
        }
      ]);

      if (!searchTerm) {
        if (selectedTags.length > 0) return selectedTags.join(' ');
        return this.getCustomTags();
      }

      const spinner = ora(this.localizationService.get('menu.searching_spinner')).start();
      const suggestions = await apiService.suggestTags(searchTerm.trim());
      spinner.stop();

      if (suggestions.length === 0) {
        this.showWarning(this.localizationService.get('menu.no_suggestions'));
        await this.pressEnterToContinue();
        continue;
      }

      const { choice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          message: this.localizationService.get('menu.select_tag'),
          choices: [
            ...suggestions.map((tag: string) => ({ name: tag, value: tag })),
            { name: chalk.dim(this.localizationService.get('menu.back_option')), value: 'BACK' }
          ]
        }
      ]);

      if (choice !== 'BACK') {
        if (!selectedTags.includes(choice)) {
          selectedTags.push(choice);
        }

        const { addMore } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'addMore',
            message: this.localizationService.get('menu.add_more_tags'),
            default: false
          }
        ]);

        if (!addMore) break;
      }
    }

    return selectedTags.join(' ');
  }

  async pressEnterToContinue(): Promise<void> {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: this.localizationService.get('menu.press_enter')
      }
    ]);
  }

  showStats(stats: any, statsService: any): void {
    console.clear();

    const box = boxen(
      chalk.bold.cyan(this.localizationService.get('stats.title')),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'double',
        borderColor: 'cyan',
        align: 'center'
      }
    );

    console.log(box);

    if (stats.totalDownloads === 0) {
      console.log(chalk.yellow(`\n${this.localizationService.get('stats.no_downloads')}\n`));
      return;
    }

    console.log(chalk.bold.green(this.localizationService.get('stats.general_info')));
    console.log(chalk.dim('  ' + '─'.repeat(50)));
    console.log(chalk.white(this.localizationService.get('stats.total_downloads', { count: stats.totalDownloads })));
    console.log(chalk.white(this.localizationService.get('stats.total_size', { size: statsService.formatBytes(stats.totalSize) })));

    if (stats.firstDownload) {
      console.log(chalk.white(this.localizationService.get('stats.first_download', { time: chalk.dim(statsService.getRelativeTime(stats.firstDownload)) })));
    }
    if (stats.lastDownload) {
      console.log(chalk.white(this.localizationService.get('stats.last_download', { time: chalk.dim(statsService.getRelativeTime(stats.lastDownload)) })));
    }

    console.log(chalk.bold.yellow(`\n${this.localizationService.get('stats.category_dist')}`));
    console.log(chalk.dim('  ' + '─'.repeat(50)));

    const sortedCategories = Object.entries(stats.categoryStats)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5);

    sortedCategories.forEach(([category, count]: any, index) => {
      const percentage = ((count / stats.totalDownloads) * 100).toFixed(1);
      const barLength = Math.floor((count / stats.totalDownloads) * 20);
      const bar = '█'.repeat(barLength) + '░'.repeat(20 - barLength);

      console.log(chalk.white(`  ${index + 1}. ${category.padEnd(15)} ${chalk.green(bar)} ${chalk.bold(count)} (${percentage}%)`));
    });

    console.log(chalk.bold.magenta(`\n${this.localizationService.get('stats.type_dist')}`));
    console.log(chalk.dim('  ' + '─'.repeat(50)));

    const imageCount = stats.typeStats.image || 0;
    const videoCount = stats.typeStats.video || 0;
    const imagePercentage = stats.totalDownloads > 0 ? ((imageCount / stats.totalDownloads) * 100).toFixed(1) : '0.0';
    const videoPercentage = stats.totalDownloads > 0 ? ((videoCount / stats.totalDownloads) * 100).toFixed(1) : '0.0';

    console.log(chalk.white(this.localizationService.get('stats.image_count', { count: imageCount, percentage: imagePercentage })));
    console.log(chalk.white(this.localizationService.get('stats.video_count', { count: videoCount, percentage: videoPercentage })));

    console.log();
  }
}