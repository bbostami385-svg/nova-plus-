import i18n from 'i18n';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure i18n
i18n.configure({
  locales: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'zh', 'ar', 'hi', 'bn'],
  defaultLocale: 'en',
  cookie: 'language',
  queryParameter: 'lang',
  directory: path.join(__dirname, '../locales'),
  updateFiles: false,
  syncFiles: false,
  indent: '\t',
  extension: '.json',
  prefix: '',
  autoReload: true,
  preserveLegacyCase: false,
  api: {
    __: 't',
    __n: 'tn',
  },
});

export default i18n;
