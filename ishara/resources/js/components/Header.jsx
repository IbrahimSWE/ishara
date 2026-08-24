import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

export default function Header() {
    const { t, toggleLanguage } = useLanguage();

    return (
        <header className="app-header">
            <span className="app-header__title">{t('appName')}</span>
            <nav className="app-header__nav">
                <Link to="/">{t('navListen')}</Link>
                <Link to="/history">{t('navHistory')}</Link>
            </nav>
            <button type="button" onClick={toggleLanguage} className="app-header__lang-toggle">
                {t('toggleLanguageLabel')}
            </button>
        </header>
    );
}
