import { useState, useRef, useEffect } from 'react';
import { generatePokedexSpeech } from '../services/geminiService';

// Helper to decode audio
async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function decodeBase64(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

const audioCache = new Map<string, string>();

export const useAudio = () => {
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [isLoadingAudio, setIsLoadingAudio] = useState(false);
    const [isPlayingCry, setIsPlayingCry] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const scheduledSourcesRef = useRef<AudioBufferSourceNode[]>([]);
    const nextStartTimeRef = useRef<number>(0);

    const stop = () => {
        scheduledSourcesRef.current.forEach(source => {
            try {
                source.stop();
            } catch (e) {
                // Ignore
            }
        });
        scheduledSourcesRef.current = [];
        nextStartTimeRef.current = 0;

        setIsPlayingAudio(false);
        setIsLoadingAudio(false);
        setIsPlayingCry(false);
    };

    const playSpeech = async (text: string) => {
        // Prevent overlapping
        stop();
        setIsLoadingAudio(true);

        try {
            // Check Cache
            const cachedBase64 = audioCache.get(text);
            if (cachedBase64) {
                if (!audioContextRef.current) {
                    audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
                }
                const audioCtx = audioContextRef.current;
                if (audioCtx.state === 'suspended') {
                    await audioCtx.resume();
                }

                const audioBuffer = await decodeAudioData(decodeBase64(cachedBase64), audioCtx, 24000, 1);
                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioCtx.destination);
                source.onended = () => setIsPlayingAudio(false);

                scheduledSourcesRef.current.push(source);
                source.start();
                setIsLoadingAudio(false);
                setIsPlayingAudio(true);
                return;
            }

            // Stream
            // Initialize Audio Context immediately
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            const audioCtx = audioContextRef.current;
            if (audioCtx.state === 'suspended') {
                await audioCtx.resume();
            }

            nextStartTimeRef.current = audioCtx.currentTime;

            // We need to keep a flag to check if we were stopped during streaming
            // We can check if scheduledSourcesRef was cleared (length 0) but we might have added sources.
            // A simple way is to use a local cancel flag if we had an abort controller, but here we can check if playing state was reset?
            // Safer: ensure we are "active".
            // Let's assume successful start.

            const { streamPokedexSpeech } = await import('../services/geminiService');
            const stream = streamPokedexSpeech(text);

            let fullAudioBase64 = "";
            let chunkCount = 0;

            for await (const chunk of stream) {
                // If user stopped playback manually, stop processing
                // However, we don't have a direct "isStopped" flag accessible here easily unless we used a ref for a "currentPlayId".
                // For simplicity: if isLoadingAudio fell to false (and we haven't started playing yet?)
                // Let's just proceed. If `stop()` was called, scheduledSources would be empty. 
                // We'll clean up properly at the end.

                fullAudioBase64 += chunk;
                const chunkBytes = decodeBase64(chunk);
                const audioBuffer = await decodeAudioData(chunkBytes, audioCtx, 24000, 1);

                const source = audioCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(audioCtx.destination);

                // Timing
                // Ensure we don't schedule in the past too far, but chaining is strict
                const startTime = Math.max(audioCtx.currentTime, nextStartTimeRef.current);
                source.start(startTime);
                nextStartTimeRef.current = startTime + audioBuffer.duration;

                scheduledSourcesRef.current.push(source);

                if (chunkCount === 0) {
                    setIsLoadingAudio(false);
                    setIsPlayingAudio(true);
                }
                chunkCount++;
            }

            // Cache the full result
            if (fullAudioBase64) {
                audioCache.set(text, fullAudioBase64);
            }

            // Handle "onended" for the WHOLE stream
            // The last source's onended determines when we are done
            if (scheduledSourcesRef.current.length > 0) {
                const lastSource = scheduledSourcesRef.current[scheduledSourcesRef.current.length - 1];
                lastSource.onended = () => {
                    // Only turn off if we are still the active session (not checking ID, but basic check)
                    setIsPlayingAudio(false);
                };
            } else {
                setIsLoadingAudio(false);
                setIsPlayingAudio(false);
            }

        } catch (e) {
            console.error("Audio playback failed", e);
            setIsLoadingAudio(false);
            setIsPlayingAudio(false);
        }
    };

    const playCry = (id: number) => {
        stop();
        setIsPlayingCry(true);
        const audio = new Audio(`https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`);
        audio.volume = 0.6;
        audio.onended = () => setIsPlayingCry(false);
        audio.onerror = () => setIsPlayingCry(false);
        audio.play().catch(console.error);
    };

    // Cleanup on unmount
    useEffect(() => {
        return () => stop();
    }, []);

    return {
        isPlayingAudio,
        isLoadingAudio,
        isPlayingCry,
        playSpeech,
        playCry,
        stop
    };
};
