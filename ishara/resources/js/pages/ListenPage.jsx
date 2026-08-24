import React, {
    useEffect, useRef, useState,
} from 'react';
import { useLanguage } from '../context/LanguageContext';
import useSpeechRecognition from '../hooks/useSpeechRecognition';

const LANGUAGE_OPTIONS = [
    { value: 'en-US', label: 'English' },
    { value: 'ar-SA', label: 'العربية' },
];

export default function ListenPage() {
    const { t } = useLanguage();
    const {
        isSupported, isListening, interimText, finalText, error, start, stop, reset,
    } = useSpeechRecognition();

    const [spokenLanguage, setSpokenLanguage] = useState('en-US');
    const [startedAt, setStartedAt] = useState(null);
    const [saveState, setSaveState] = useState('idle');
    const stopRequestedRef = useRef(false);

    const handleStart = () => {
        if (error) {
            // Resuming after a recognition error — keep the transcript captured so far.
            start(spokenLanguage);
            return;
        }

        reset();
        setSaveState('idle');
        setStartedAt(new Date().toISOString());
        start(spokenLanguage);
    };

    const saveSession = async () => {
        setSaveState('saving');
        try {
            const response = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
                body: JSON.stringify({
                    spoken_language: spokenLanguage,
                    full_text: finalText.trim(),
                    started_at: startedAt,
                    ended_at: new Date().toISOString(),
                }),
            });

            if (!response.ok) {
                throw new Error('save failed');
            }

            setSaveState('saved');
        } catch (err) {
            setSaveState('error');
        }
    };

    useEffect(() => {
        if (stopRequestedRef.current && !isListening) {
            stopRequestedRef.current = false;
            if (finalText.trim().length > 0) {
                saveSession();
            }
        }
    }, [isListening]);

    const handleStop = () => {
        stopRequestedRef.current = true;
        stop();
    };

    if (!isSupported) {
        return <p className="listen-page__unsupported">{t('unsupportedBrowser')}</p>;
    }

    return (
        <div className="listen-page">
            <label className="listen-page__language-picker">
                {t('spokenLanguageLabel')}
                <select
                    value={spokenLanguage}
                    onChange={(e) => setSpokenLanguage(e.target.value)}
                    disabled={isListening}
                >
                    {LANGUAGE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                </select>
            </label>

            <button type="button" onClick={isListening ? handleStop : handleStart}>
                {isListening ? t('stopListening') : t('startListening')}
            </button>

            <div className="listen-page__transcript">
                <span>{finalText}</span>
                <span className="listen-page__interim">{interimText}</span>
            </div>

            {error && (
                <p className="listen-page__error">
                    {error === 'not-allowed' ? t('micPermissionDenied') : `${t('recognitionError')}: ${error}`}
                </p>
            )}
            {saveState === 'saved' && <p className="listen-page__saved">{t('sessionSaved')}</p>}
            {saveState === 'error' && (
                <p className="listen-page__save-error">
                    {t('saveFailed')}{' '}
                    <button type="button" onClick={saveSession}>{t('retry')}</button>
                </p>
            )}
        </div>
    );
}
