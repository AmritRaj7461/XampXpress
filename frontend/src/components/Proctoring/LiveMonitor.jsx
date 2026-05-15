import { useRef, useEffect } from 'react';

const LiveMonitor = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    let stream = null;
    const enableMedia = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Proctoring feed error", err);
      }
    };
    enableMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden border-2 border-gray-700 relative shadow-inner">
      <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1] opacity-90" />
      <div className="absolute inset-0 ring-1 ring-inset ring-black/20 pointer-events-none rounded-xl"></div>
    </div>
  );
};

export default LiveMonitor;
