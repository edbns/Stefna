// hooks/usePromptPersistence.ts
import { useState, useEffect, useCallback } from 'react';
const LAST_PROMPT_KEY = 'lastPrompt';
const DEFAULT_PROMPT = '';
export function usePromptPersistence() {
    const [prompt, setPrompt] = useState(() => {
        const stored = localStorage.getItem(LAST_PROMPT_KEY);
        return stored || DEFAULT_PROMPT;
    });
    // Persist prompt changes to localStorage
    useEffect(() => {
        if (prompt !== DEFAULT_PROMPT) {
            localStorage.setItem(LAST_PROMPT_KEY, prompt);
        }
        else {
            localStorage.removeItem(LAST_PROMPT_KEY);
        }
    }, [prompt]);
    // Clear stored prompt
    const clearPrompt = useCallback(() => {
        setPrompt(DEFAULT_PROMPT);
        localStorage.removeItem(LAST_PROMPT_KEY);
    }, []);
    // Restore last prompt
    const restoreLastPrompt = useCallback(() => {
        const stored = localStorage.getItem(LAST_PROMPT_KEY);
        if (stored) {
            setPrompt(stored);
            return stored;
        }
        return null;
    }, []);
    // Check if there's a stored prompt
    const hasStoredPrompt = useCallback(() => {
        return !!localStorage.getItem(LAST_PROMPT_KEY);
    }, []);
    return {
        prompt,
        setPrompt,
        clearPrompt,
        restoreLastPrompt,
        hasStoredPrompt
    };
}
