import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import commonPtBR from './pt-BR/common.json';
import lineCardPtBR from './pt-BR/line-card.json';
import lineDetailsPtBR from './pt-BR/line-details.json';
import menuPtBR from './pt-BR/menu.json';
import modalsPtBR from './pt-BR/modals.json';
import systemBannerPtBR from './pt-BR/system-banner.json';

export const DEFAULT_LOCALE = 'pt-BR' as const;

if (!i18next.isInitialized) {
  void i18next.use(initReactI18next).init({
    lng: DEFAULT_LOCALE,
    fallbackLng: DEFAULT_LOCALE,
    supportedLngs: [DEFAULT_LOCALE],
    ns: ['common', 'line-card', 'line-details', 'menu', 'modals', 'system-banner'],
    defaultNS: 'menu',
    interpolation: {
      escapeValue: false,
    },
    resources: {
      [DEFAULT_LOCALE]: {
        'line-card': lineCardPtBR,
        'line-details': lineDetailsPtBR,
        common: commonPtBR,
        menu: menuPtBR,
        modals: modalsPtBR,
        'system-banner': systemBannerPtBR,
      },
    },
  });
}

export default i18next;
