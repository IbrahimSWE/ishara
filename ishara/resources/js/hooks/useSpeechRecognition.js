import { useCallback, useRef, useState } from 'react';

const getRecognitionConstructor = () => window.SpeechRecognition || window.webkitSpeechRecognition || null;

export default function useSpeechRecognition() {
    const RecognitionConstructor = getRecognitionConstructor();
    const isSupported = RecognitionConstructor !== null;

    const recognitionRef = useRef(null);
    const [isListening, setIsListening] = useState(false);
    const [interimText, setInterimText] = useState('');
    const [finalText, setFinalText] = useState('');
    const [error, setError] = useState(null);

    const start = useCallback((lang) => {
        if (!isSupported) {
            return;
        }

        setError(null);
        setInterimText('');

        const recognition = new RecognitionConstructor();
        recognition.lang = lang;
        recognition.continuous = true;
        recognition.interimResults = true;

        recognition.onresult = (event) => {
            let interim = '';
            let finalChunk = '';

            for (let i = event.resultIndex; i < event.results.length; i += 1) {
                const transcript = event.results[i][0].transcript;
                if (event.results[i].isFinal) {
                    finalChunk += `${transcript} `;
                } else {
                    interim += transcript;
                }
            }

            if (finalChunk) {
                setFinalText((current) => current + finalChunk);
            }
            setInterimText(interim);
        };

        recognition.onerror = (event) => {
            setError(event.error);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
        setIsListening(true);
    }, [isSupported]);

    const stop = useCallback(() => {
        recognitionRef.current?.stop();
    }, []);

    const reset = useCallback(() => {
        setFinalText('');
        setInterimText('');
        setError(null);
    }, []);

    return { isSupported, isListening, interimText, finalText, error, start, stop, reset };
}
