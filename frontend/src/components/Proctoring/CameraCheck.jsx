import { useState, useRef, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Camera, Mic, ShieldCheck, AlertCircle } from 'lucide-react';

const CameraCheck = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [error, setError] = useState('');
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  useEffect(() => {
    const enableMedia = async () => {
      try {
        const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(mediaStream);
        if (videoRef.current) {
          videoRef.current.srcObject = mediaStream;
        }
        setPermissionsGranted(true);
      } catch (err) {
        setError('Camera and microphone access is required to take this exam. Please allow permissions in your browser.');
        console.error("Error accessing media devices.", err);
      }
    };
    enableMedia();

    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleStartExam = () => {
    // Navigate without stopping the stream, or let the ExamPage request it again.
    // Usually it's better to request it again in the ExamPage for simplicity.
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }
    navigate(`/student/exam/${id}`);
  };

  return (
    <div className="h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full glass p-8 rounded-2xl bg-white/10 border-white/20">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full mx-auto flex items-center justify-center mb-4">
            <ShieldCheck size={32} />
          </div>
          <h1 className="text-3xl font-bold mb-2">System Check</h1>
          <p className="text-gray-300">AI Proctoring requires camera and microphone access.</p>
        </div>

        <div className="aspect-video bg-black rounded-xl overflow-hidden relative mb-8 border-2 border-gray-700">
          {error ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-6 text-center">
              <AlertCircle size={48} className="mb-4" />
              <p>{error}</p>
            </div>
          ) : (
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover transform scale-x-[-1]" />
          )}
          
          {permissionsGranted && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-between">
              <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm text-green-400 border border-white/10">
                <Camera size={16} /> Video OK
              </div>
              <div className="bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm text-green-400 border border-white/10">
                <Mic size={16} /> Audio OK
              </div>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="bg-blue-900/30 border border-blue-500/30 p-4 rounded-xl text-sm text-blue-200 flex gap-3">
            <AlertCircle size={20} className="shrink-0 text-blue-400" />
            <p>During the exam, your webcam and microphone will be continuously monitored by our AI proctoring system. Do not switch tabs or leave the camera view.</p>
          </div>
          
          <button 
            onClick={handleStartExam}
            disabled={!permissionsGranted}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:text-gray-400 disabled:cursor-not-allowed text-white rounded-xl font-bold text-lg transition shadow-lg shadow-blue-500/30"
          >
            Start Exam Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default CameraCheck;
