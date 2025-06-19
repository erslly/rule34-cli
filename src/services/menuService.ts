import inquirer from 'inquirer';
import chalk from 'chalk';
import { CATEGORIES } from '../config/categories';

export class MenuService {
  showHeader(): void {
    console.clear();
    console.log(chalk.cyan('╔═════════════════════════════════════════════════════════════════╗'));
    console.log(chalk.cyan('║           https://github.com/erslly/rule34-cli                  ║'));
    console.log(chalk.cyan('║                    Rule 34 Video Downloader                     ║'));
    console.log(chalk.cyan('╚═════════════════════════════════════════════════════════════════╝'));
    console.log();
}


  showCategories(): void {
    console.log(chalk.yellow('📁 Kategoriler:'));
    console.log();
    
    CATEGORIES.forEach(category => {
      console.log(chalk.green(`${category.id}. ${category.name}`));
    });
    
    console.log(chalk.red('0. Çıkış'));
    console.log();
  }

  async getCategoryChoice(): Promise<number> {
    const answer = await inquirer.prompt([
      {
        type: 'input',
        name: 'category',
        message: 'Kategori seçin (0-9):',
        validate: (input) => {
          const num = parseInt(input);
          if (isNaN(num) || num < 0 || num > 9) {
            return 'Lütfen 0-9 arasında bir sayı girin!';
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

  async pressEnterToContinue(): Promise<void> {
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: 'Devam etmek için Enter\'a basın...'
      }
    ]);
  }
}