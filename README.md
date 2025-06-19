# RULE34-CLİ


##  Kurulum

### 1. Projeyi klonlayın
```bash
git clone https://github.com/erslly/rule34-cli.git
cd rule34-cli
```

### 2. Bağımlılıkları yükleyin
```bash
npm install
```

### 3. TypeScript'i derleyin
```bash
npm run build
```

##   Kullanım

### Development modunda çalıştırma
```bash
npm run dev
```

### Production modunda çalıştırma
```bash
npm start
```

### Watch modunda çalıştırma (otomatik derleme)
```bash
npm run watch
```



### API Endpoints
- Base URL: `https://api.rule34.xxx/index.php`
- Method: `GET`
- Parameters: `page=dapi&s=post&q=index&json=1`



##  Konfigürasyon

`src/config/categories.ts` dosyasından kategorileri düzenleyebilirsiniz:

```typescript
export const CATEGORIES: Category[] = [
  { id: 1, name: 'Anime', tags: ['anime', '1girl', 'solo'] },
  // ... 
];
```

##  Scripts

```json
{
  "build": "tsc",              // TypeScript derle
  "start": "node dist/index.js", // Uygulamayı çalıştır
  "dev": "ts-node src/index.ts", // Development mode
  "watch": "tsc -w"             // Watch mode
}
```
