import inquirer from 'inquirer';
import chalk from 'chalk';
import boxen from 'boxen';
import ora from 'ora';
import { CATEGORIES } from '../config/categories';

export class MenuService {
  showHeader(source: string = 'Rule34'): void {
    console.clear();
    console.log(chalk.cyan('╔═════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║           https://github.com/erslly/rule34-cli                  ║'));
    console.log(chalk.cyan(`║                    ${source.padEnd(20)}                         ║`));
    console.log(chalk.cyan('╚═════════════════════════════════════════════════════════════════╝'));
    console.log();
  }


  showCategories(categories: any[] = CATEGORIES): void {
    console.log(chalk.yellow('📁 Kategoriler:'));
    console.log();

    categories.forEach(category => {
      console.log(chalk.green(`${category.id}. ${category.name}`));
    });

    console.log(chalk.red('0. Çıkış'));
    console.log();
  }

  async getSourceChoice(): Promise<'rule34' | 'phub'> {
    const answer = await inquirer.prompt([
      {
        type: 'list',
        name: 'source',
        message: 'Kaynak seçin:',
        choices: [
          { name: 'rule34', value: 'rule34' },
          { name: 'phub', value: 'phub' }
        ]
      }
    ]);

    return answer.source;
  }

  async getCategoryChoice(maxSpecial: number = 99, numCategories: number = 24): Promise<number> {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'category',
        message: `Kategori seçin (0-${numCategories} veya Özel Seçenekler):`,
        validate: (input) => {
          const num = parseInt(input);
          if (isNaN(num)) return 'Lütfen bir sayı girin!';

          const isValidCategory = num >= 0 && num <= numCategories;
          const isValidSpecial = num === 98 || num === 99;

          if (!isValidCategory && !isValidSpecial) {
            return `Lütfen 0-${numCategories} arası veya özel seçenekleri (98, 99) girin!`;
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
        message: 'İndirme türü seçin:',
        choices: [
          { name: '🖼️  Resim', value: 'image' },
          { name: '🎥 Video', value: 'video' }
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
        message: chalk.cyan('❯') + ' Kaç adet dosya indirmek istersiniz? (1-50):',
        default: '1',
        validate: (input) => {
          const num = parseInt(input);
          if (isNaN(num) || num < 1 || num > 50) {
            return chalk.red('✗ Lütfen 1-50 arasında bir sayı girin!');
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
        message: chalk.cyan('❯') + ' Etiketleri girin (boşlukla ayırın):',
        validate: (input) => {
          if (!input || input.trim().length === 0) {
            return chalk.red('✗ En az bir etiket girmelisiniz!');
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
        console.log(chalk.cyan('  Seçilen etiketler: ') + chalk.bold.yellow(selectedTags.join(' ')) + '\n');
      }

      const { searchTerm } = await inquirer.prompt([
        {
          type: 'input',
          name: 'searchTerm',
          message: chalk.cyan('❯') + ' Aramak istediğin kelimeyi gir (Bitirmek için boş bırak):',
        }
      ]);

      if (!searchTerm) {
        if (selectedTags.length > 0) return selectedTags.join(' ');
        return this.getCustomTags();
      }

      const spinner = ora('Hemen bakıyorum...').start();
      const suggestions = await apiService.suggestTags(searchTerm.trim());
      spinner.stop();

      if (suggestions.length === 0) {
        this.showWarning('Öneri bulamadım, başka bir kelime dene.');
        await this.pressEnterToContinue();
        continue;
      }

      const { choice } = await inquirer.prompt([
        {
          type: 'list',
          name: 'choice',
          message: 'İstediğin etiketi seç (Enter):',
          choices: [
            ...suggestions.map((tag: string) => ({ name: tag, value: tag })),
            { name: chalk.dim('⬅ Geri / Vazgeç'), value: 'BACK' }
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
            message: 'Yanına başka etiket de eklemek ister misin?',
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
        message: 'Devam etmek için Enter\'a basın...'
      }
    ]);
  }

  showStats(stats: any, statsService: any): void {
    console.clear();

    const box = boxen(
      chalk.bold.cyan('📊 İNDİRME İSTATİSTİKLERİ'),
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
      console.log(chalk.yellow('\n  Henüz indirme yapılmamış.\n'));
      return;
    }

    console.log(chalk.bold.green('  📦 Genel Bilgiler:'));
    console.log(chalk.dim('  ' + '─'.repeat(50)));
    console.log(chalk.white(`  Toplam İndirme: ${chalk.bold.cyan(stats.totalDownloads)} dosya`));
    console.log(chalk.white(`  Toplam Boyut: ${chalk.bold.cyan(statsService.formatBytes(stats.totalSize))}`));

    if (stats.firstDownload) {
      console.log(chalk.white(`  İlk İndirme: ${chalk.dim(statsService.getRelativeTime(stats.firstDownload))}`));
    }
    if (stats.lastDownload) {
      console.log(chalk.white(`  Son İndirme: ${chalk.dim(statsService.getRelativeTime(stats.lastDownload))}`));
    }

    console.log(chalk.bold.yellow('\n  🏆 Kategori Dağılımı:'));
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

    console.log(chalk.bold.magenta('\n  📸 Tip Dağılımı:'));
    console.log(chalk.dim('  ' + '─'.repeat(50)));

    const imageCount = stats.typeStats.image || 0;
    const videoCount = stats.typeStats.video || 0;
    const imagePercentage = ((imageCount / stats.totalDownloads) * 100).toFixed(1);
    const videoPercentage = ((videoCount / stats.totalDownloads) * 100).toFixed(1);

    console.log(chalk.white(`  Resim: ${chalk.bold.cyan(imageCount)} (${imagePercentage}%)`));
    console.log(chalk.white(`  Video: ${chalk.bold.cyan(videoCount)} (${videoPercentage}%)`));

    console.log();
  }
}