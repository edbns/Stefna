// hooks/useGenerateDebounce.ts
import { useRef, useCallback } from 'react';
export function useGenerateDebounce() {
    const inFlight = useRef(false);
    const queue = useRef([]);
    const debouncedGenerate = useCallback(async (generateFn, options) => {
        // If already running and queuing is disabled, reject
        if (inFlight.current && !options?.queueIfBusy) {
            console.warn('Generation already in flight, request rejected');
            return false;
        }
        // If already running and queuing is enabled, add to queue
        if (inFlight.current && options?.queueIfBusy) {
            const maxSize = options.maxQueueSize || 3;
            if (queue.current.length >= maxSize) {
                console.warn('Generation queue full, request rejected');
                return false;
            }
            queue.current.push(generateFn);
            console.log(`Generation queued (${queue.current.length}/${maxSize})`);
            return true;
        }
        // Start generation
        inFlight.current = true;
        console.log('Starting generation...');
        try {
            await generateFn();
            console.log('Generation completed successfully');
        }
        catch (error) {
            console.error('Generation failed:', error);
        }
        finally {
            inFlight.current = false;
            // Process next item in queue
            if (queue.current.length > 0) {
                const nextFn = queue.current.shift();
                console.log(`Processing queued generation (${queue.current.length} remaining)`);
                // Recursively call to process the next item
                setTimeout(() => debouncedGenerate(nextFn, options), 100);
            }
        }
        return true;
    }, []);
    const clearQueue = useCallback(() => {
        queue.current = [];
        console.log('Generation queue cleared');
    }, []);
    const getQueueStatus = useCallback(() => ({
        inFlight: inFlight.current,
        queued: queue.current.length
    }), []);
    return {
        debouncedGenerate,
        clearQueue,
        getQueueStatus,
        isGenerating: inFlight.current
    };
}
