import React, { createContext, useContext, useEffect, useState } from 'react';
import translations from '../i18n/translations';

const LanguageContext = createContext(null);

const STORAGE_KEY = 'ishara_ui_language';

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState(() => (
        localStorage.getItem(STORAGE_KEY) === 'ar' ? 'ar' : 'en'
    ));

    useEffect(() => {
        document.documentElement.lang = language;
        document.documentElement.dir = language === 'ar' ? 'rtl' : 'ltr';
        localStorage.setItem(STORAGE_KEY, language);
    }, [language]);

    const toggleLanguage = () => {
        setLanguage((current) => (current === 'en' ? 'ar' : 'en'));
    };

    const t = (key) => translations[language][key] ?? key;

    return (
        <LanguageContext.Provider value={{ language, toggleLanguage, t }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}
