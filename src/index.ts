import 'dotenv/config';
import { Rule34App } from './app';

async function main() {
  try {
    const app = new Rule34App();
    await app.run();
  } catch (error) {
    console.error('Uygulama hatası:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}