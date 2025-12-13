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

export const useAudio = () => {
    const [isPlayingAudio, setIsPlayingAudio] = useState(false);
    const [isPlayingCry, setIsPlayingCry] = useState(false);
    const audioContextRef = useRef<AudioContext | null>(null);
    const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);

    const stop = () => {
        if (audioSourceRef.current) {
            try {
                audioSourceRef.current.stop();
            } catch (e) {
                // Ignore
            }
            audioSourceRef.current = null;
        }
        setIsPlayingAudio(false);
        setIsPlayingCry(false);
    };

    const playSpeech = async (text: string) => {
        stop();
        try {
            const base64Audio = await generatePokedexSpeech(text);
            if (!base64Audio) return;

            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
            }
            if (audioContextRef.current.state === 'suspended') {
                await audioContextRef.current.resume();
            }

            const audioCtx = audioContextRef.current;
            const audioBuffer = await decodeAudioData(decodeBase64(base64Audio), audioCtx, 24000, 1);

            const source = audioCtx.createBufferSource();
            source.buffer = audioBuffer;
            source.connect(audioCtx.destination);
            source.onended = () => setIsPlayingAudio(false);

            audioSourceRef.current = source;
            source.start();
            setIsPlayingAudio(true);
        } catch (e) {
            console.error("Audio playback failed", e);
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
        isPlayingCry,
        playSpeech,
        playCry,
        stop
    };
};
