import React, { useRef, useState, useCallback, useEffect } from 'react';

interface CameraViewProps {
  onCapture: (base64Image: string) => void;
  onClose: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ onCapture, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string>("");

  const startCamera = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      setError("Kamera konnte nicht gestartet werden. Bitte überprüfe die Berechtigungen.");
    }
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleCapture = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      
      // Set canvas dimensions to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const context = canvas.getContext('2d');
      if (context) {
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        // Get high quality jpeg
        const imageBase64 = canvas.toDataURL('image/jpeg', 0.8).split(',')[1];
        onCapture(imageBase64);
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        const base64 = result.split(',')[1];
        onCapture(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    // Use 100dvh for mobile
    <div className="fixed top-0 left-0 w-full h-[100dvh] z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 pt-[max(24px,env(safe-area-inset-top))] flex justify-between items-center z-10 bg-gradient-to-b from-black/60 to-transparent">
        <button 
          onClick={onClose}
          className="text-white bg-red-600 hover:bg-red-700 px-6 py-3 rounded-2xl font-black shadow-lg border-2 border-red-400 text-lg flex items-center gap-2 active:scale-95 transition-transform"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
          Schließen
        </button>
      </div>

      {/* Main View */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-gray-900">
        {error ? (
          <div className="text-white text-center p-6 max-w-sm">
            <p className="mb-6 text-xl font-bold text-red-400">{error}</p>
            <label className="bg-white text-gray-900 px-8 py-4 rounded-3xl font-black text-xl cursor-pointer shadow-xl hover:bg-gray-100 transition-colors block active:scale-95">
              Bild hochladen
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                onChange={handleFileUpload}
              />
            </label>
          </div>
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}
        
        {/* Overlay Grid */}
        {!error && (
          <div className="absolute inset-0 pointer-events-none opacity-40">
            <div className="w-full h-full border-[24px] border-black/30 relative">
               <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 border-4 border-white/50 rounded-2xl dashed"></div>
               <div className="absolute bottom-10 w-full text-center text-white font-bold text-lg drop-shadow-md">
                 Pokemon hier scannen
               </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls with Safe Area Padding */}
      <div className="h-40 bg-black flex items-center justify-center gap-10 pb-[max(32px,env(safe-area-inset-bottom))] pt-6">
        {/* Gallery Button */}
        <label className="w-16 h-16 flex items-center justify-center bg-gray-800 rounded-2xl cursor-pointer hover:bg-gray-700 active:scale-95 transition-all border-2 border-gray-700">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            onChange={handleFileUpload}
          />
        </label>

        {/* Shutter Button (Massive) */}
        {!error && (
          <button 
            onClick={handleCapture}
            className="w-24 h-24 rounded-full bg-white border-4 border-gray-300 flex items-center justify-center focus:outline-none transform active:scale-90 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)]"
          >
            <div className="w-20 h-20 rounded-full bg-red-600 border-[3px] border-black"></div>
          </button>
        )}

        <div className="w-16"></div> {/* Spacer for symmetry */}
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};