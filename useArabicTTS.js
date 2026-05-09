import { useState, useEffect, useCallback } from 'react';

/**
 * useArabicTTS - A production-ready hook for Arabic and English speech synthesis.
 * Supports auto-voice detection, fallback logic, and state management.
 */
export const useArabicTTS = (initialLang = 'ar-SA') => {
    const [voices, setVoices] = useState([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Load available voices
    const loadVoices = useCallback(() => {
        const availableVoices = window.speechSynthesis.getVoices();
        if (availableVoices.length > 0) {
            setVoices(availableVoices);
            setIsLoading(false);
            console.log(`[useArabicTTS] ${availableVoices.length} voices loaded.`);
        }
    }, []);

    useEffect(() => {
        // Initial load
        loadVoices();

        // Handle async voice loading (required for Chrome/Edge)
        if (window.speechSynthesis.onvoiceschanged !== undefined) {
            window.speechSynthesis.onvoiceschanged = loadVoices;
        }

        // Cleanup on unmount
        return () => {
            window.speechSynthesis.cancel();
        };
    }, [loadVoices]);

    /**
     * speak - Pronounce text in the specified language
     * @param {string} text - The text to speak
     * @param {string} lang - Language code ('ar-SA', 'en-US', etc.)
     */
    const speak = useCallback((text, lang = initialLang) => {
        if (!text) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        
        // Find best voice match
        const isArabic = lang.startsWith('ar');
        const targetVoice = isArabic 
            ? (voices.find(v => v.lang === 'ar-SA') || 
               voices.find(v => v.lang === 'ar-EG') || 
               voices.find(v => v.lang.startsWith('ar')))
            : (voices.find(v => v.lang.startsWith('en-US')) || 
               voices.find(v => v.lang.startsWith('en')));

        if (targetVoice) {
            utterance.voice = targetVoice;
        } else if (isArabic) {
            console.warn("[useArabicTTS] No Arabic voice found. Using system default.");
            setError("No native Arabic voice found on this device.");
        }

        utterance.lang = lang;
        utterance.rate = 0.8; // Optimized for learning
        utterance.pitch = 1.0;
        utterance.volume = 1.0;

        utterance.onstart = () => {
            setIsSpeaking(true);
            setError(null);
            console.log(`[useArabicTTS] Started speaking: ${text}`);
        };

        utterance.onend = () => {
            setIsSpeaking(false);
            console.log("[useArabicTTS] Finished speaking.");
        };

        utterance.onerror = (e) => {
            setIsSpeaking(false);
            setError(e.error);
            console.error("[useArabicTTS] Speech error:", e);
        };

        window.speechSynthesis.speak(utterance);
    }, [voices, initialLang]);

    const stop = useCallback(() => {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
    }, []);

    return {
        speak,
        stop,
        isSpeaking,
        isLoading,
        error,
        voices
    };
};

export default useArabicTTS;
