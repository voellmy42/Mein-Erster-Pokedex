import { useState, useRef, useCallback } from 'react';

export const useProgress = () => {
    const [progress, setProgress] = useState(0);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const start = useCallback(() => {
        setProgress(0);
        if (progressIntervalRef.current) clearInterval(progressIntervalRef.current);

        let currentProgress = 0;
        progressIntervalRef.current = setInterval(() => {
            currentProgress += (90 - currentProgress) * 0.1; // Approach 90%
            // If we are very close to 90, just creep slowly
            if (currentProgress > 89) {
                currentProgress += 0.1;
            }
            if (currentProgress > 95) currentProgress = 95; // Hard cap at 95 until real data

            setProgress(Math.round(currentProgress));
        }, 200);
    }, []);

    const complete = useCallback(() => {
        setProgress(100);
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
    }, []);

    const stop = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
        setProgress(0);
    }, []);

    return { progress, start, complete, stop };
};
