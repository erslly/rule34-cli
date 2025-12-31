import fs from 'fs';
import path from 'path';
import os from 'os';
import { tr } from '../locales/tr';
import { en } from '../locales/en';
import { Language } from '../types';

export class LocalizationService {
    private currentLang: Language = 'tr';
    private translations: Record<Language, any> = { tr, en };
    private configPath: string;

    constructor() {
        this.configPath = path.join(os.homedir(), '.rule34-cli-config.json');
        this.loadConfig();
    }

    private loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const config = JSON.parse(fs.readFileSync(this.configPath, 'utf-8'));
                if (config.language && ['tr', 'en'].includes(config.language)) {
                    this.currentLang = config.language;
                }
            }
        } catch (error) {
            // Ignored
        }
    }

    public setLanguage(lang: Language) {
        this.currentLang = lang;
        this.saveConfig();
    }

    public getLanguage(): Language {
        return this.currentLang;
    }

    public isConfigured(): boolean {
        return fs.existsSync(this.configPath);
    }

    private saveConfig() {
        try {
            const config = { language: this.currentLang };
            fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
        } catch (error) {
            console.error('Config could not be saved:', error);
        }
    }

    public get(key: string, params?: Record<string, string | number>): string {
        const keys = key.split('.');
        let value: any = this.translations[this.currentLang];

        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return key;
            }
        }

        if (typeof value === 'string' && params) {
            return value.replace(/{(\w+)}/g, (_, match) => {
                return params[match] !== undefined ? String(params[match]) : match;
            });
        }

        return typeof value === 'string' ? value : key;
    }
}