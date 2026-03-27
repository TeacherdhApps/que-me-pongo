import { useI18n } from '../i18n/I18nContext';

export function LanguageToggle() {
  const { locale, toggleLocale } = useI18n();

  return (
    <button
      onClick={toggleLocale}
      className="language-toggle"
      title={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
      aria-label={locale === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      <span className={`lang-option ${locale === 'es' ? 'active' : ''}`}>Spa</span>
      <span className="lang-divider">|</span>
      <span className={`lang-option ${locale === 'en' ? 'active' : ''}`}>Eng</span>
    </button>
  );
}
