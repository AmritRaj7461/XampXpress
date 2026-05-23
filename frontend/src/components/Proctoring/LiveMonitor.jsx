import { useRef, useEffect, useState, forwardRef, useImperativeHandle } from 'react';

const loadScript = (src) => {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = src;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = (err) => reject(err);
    document.head.appendChild(script);
  });
};

const distance = (p1, p2) => {
  return Math.sqrt(
    Math.pow(p1.x - p2.x, 2) +
    Math.pow(p1.y - p2.y, 2) +
    Math.pow(p1.z - p2.z, 2)
  );
};

const drawLandmarks = (ctx, landmarks, color) => {
  ctx.fillStyle = color;
  for (const landmark of landmarks) {
    const x = landmark.x * ctx.canvas.width;
    const y = landmark.y * ctx.canvas.height;
    ctx.beginPath();
    ctx.arc(x, y, 1.2, 0, 2 * Math.PI);
    ctx.fill();
  }
};

const LiveMonitor = forwardRef(({ onViolation, onDeviceDetect, isPaused }, ref) => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [statusText, setStatusText] = useState("🔄 Starting camera...");
  const [statusType, setStatusType] = useState("normal"); // normal, success, danger

  const noFaceStartTime = useRef(null);
  const multiFaceStartTime = useRef(null);
  const lookingAwayStartTime = useRef(null);

  const onViolationRef = useRef(onViolation);
  const onDeviceDetectRef = useRef(onDeviceDetect);
  const isPausedRef = useRef(isPaused);

  useImperativeHandle(ref, () => ({
    captureSnapshot: () => {
      if (videoRef.current) {
        const canvas = document.createElement('canvas');
        canvas.width = videoRef.current.videoWidth || 640;
        canvas.height = videoRef.current.videoHeight || 480;
        const ctx = canvas.getContext('2d');
        // Mirror the image to match the video element's scale-x[-1]
        ctx.translate(canvas.width, 0);
        ctx.scale(-1, 1);
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        return canvas.toDataURL('image/jpeg', 0.6);
      }
      return null;
    }
  }));

  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  useEffect(() => {
    onDeviceDetectRef.current = onDeviceDetect;
  }, [onDeviceDetect]);

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    let active = true;
    let stream = null;
    let faceMesh = null;
    let cocoSsdModel = null;
    let animationFrameId = null;
    let detectionFrameCount = 0;

    const processAIResults = (results) => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const hasFaces = results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0;

      if (!hasFaces) {
        // ── Case 1: No Face Detected ──
        setStatusText("🔴 AI: No Face Detected!");
        setStatusType("danger");
        
        if (!noFaceStartTime.current) {
          noFaceStartTime.current = Date.now();
        } else if (Date.now() - noFaceStartTime.current > 3000) {
          if (onViolationRef.current) onViolationRef.current("🔴 Face not detected in camera frame!");
          noFaceStartTime.current = Date.now(); // Reset warning timer to debounce
        }
        
        multiFaceStartTime.current = null;
        lookingAwayStartTime.current = null;
        return;
      }

      noFaceStartTime.current = null;

      if (results.multiFaceLandmarks.length > 1) {
        // ── Case 2: Multiple Faces Detected ──
        setStatusText("🔴 AI: Multiple Faces!");
        setStatusType("danger");

        // Draw landmarks in red
        results.multiFaceLandmarks.forEach(landmarks => {
          drawLandmarks(ctx, landmarks, '#EF4444');
        });

        if (!multiFaceStartTime.current) {
          multiFaceStartTime.current = Date.now();
        } else if (Date.now() - multiFaceStartTime.current > 2000) {
          if (onViolationRef.current) onViolationRef.current("🔴 Multiple faces detected in camera frame!");
          multiFaceStartTime.current = Date.now();
        }

        lookingAwayStartTime.current = null;
        return;
      }

      multiFaceStartTime.current = null;

      // ── Case 3: Single Face Detected ──
      const landmarks = results.multiFaceLandmarks[0];

      // Math for Gaze/Head rotation
      const nose = landmarks[1];
      const leftEdge = landmarks[234];
      const rightEdge = landmarks[454];
      const topEdge = landmarks[10];
      const bottomEdge = landmarks[152];

      const leftDist = distance(nose, leftEdge);
      const rightDist = distance(nose, rightEdge);
      const ratioH = leftDist / rightDist;

      const topDist = distance(nose, topEdge);
      const bottomDist = distance(nose, bottomEdge);
      const ratioV = topDist / bottomDist;

      // Determine if looking left/right or up/down
      const isLookingAway = ratioH < 0.45 || ratioH > 2.2 || ratioV < 0.55 || ratioV > 1.8;

      if (isLookingAway) {
        setStatusText("🔴 AI: Looking Away!");
        setStatusType("danger");
        drawLandmarks(ctx, landmarks, '#F59E0B'); // Orange for looking away

        if (!lookingAwayStartTime.current) {
          lookingAwayStartTime.current = Date.now();
        } else if (Date.now() - lookingAwayStartTime.current > 2500) {
          if (onViolationRef.current) onViolationRef.current("🔴 Please look straight at the screen (Face/Eyes turned away)!");
          lookingAwayStartTime.current = Date.now();
        }
      } else {
        setStatusText("🟢 AI Proctor: Active");
        setStatusType("success");
        drawLandmarks(ctx, landmarks, '#10B981'); // Green for normal
        lookingAwayStartTime.current = null;
      }
    };

    const initProctoring = async () => {
      try {
        // 1. Get user media stream
        stream = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480 } });
        if (!active) return;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // 2. Load MediaPipe script
        setStatusText("🔄 Loading AI Engine...");
        await loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/face_mesh.js');
        if (!active) return;

        // 3. Initialize FaceMesh
        faceMesh = new window.FaceMesh({
          locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });

        faceMesh.setOptions({
          maxNumFaces: 2,
          refineLandmarks: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5
        });

        faceMesh.onResults((results) => {
          if (!active) return;
          processAIResults(results);
        });

        setStatusText("🟢 AI Proctor: Active");
        setStatusType("success");

        // 3.5. Load Coco-SSD for Device Detection
        setStatusText("🔄 Loading Object Detection...");
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow/tfjs');
        await loadScript('https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd');
        if (!active) return;
        cocoSsdModel = await window.cocoSsd.load();

        setStatusText("🟢 Full AI Proctoring Active");
        setStatusType("success");

        // 4. Start detection loop
        const detect = async () => {
          if (!active) return;
          if (!isPausedRef.current && videoRef.current && videoRef.current.readyState === 4) {
            try {
              await faceMesh.send({ image: videoRef.current });
              
              detectionFrameCount++;
              // Run object detection every ~10 frames (1 second) to save CPU
              if (cocoSsdModel && detectionFrameCount % 10 === 0) {
                const predictions = await cocoSsdModel.detect(videoRef.current);
                const hasPhone = predictions.some(p => p.class === 'cell phone');
                if (hasPhone) {
                  if (onDeviceDetectRef.current) onDeviceDetectRef.current("🔴 Unauthorized Device (Cell Phone) Detected!");
                }
              }
            } catch (err) {
              console.error("AI processing error", err);
            }
          }
          // Schedule next detection after a small delay (100ms = 10 FPS, saves CPU)
          setTimeout(() => {
            animationFrameId = requestAnimationFrame(detect);
          }, 100);
        };

        detect();

      } catch (err) {
        console.error("Proctoring initialization failed", err);
        setStatusText("⚠️ Camera / AI Error");
        setStatusType("danger");
      }
    };

    initProctoring();

    return () => {
      active = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (faceMesh) {
        faceMesh.close();
      }
    };
  }, []);

  const handleVideoPlay = () => {
    if (videoRef.current && canvasRef.current) {
      canvasRef.current.width = videoRef.current.videoWidth || 640;
      canvasRef.current.height = videoRef.current.videoHeight || 480;
    }
  };

  return (
    <div className="aspect-video bg-gray-900 rounded-xl overflow-hidden border-2 border-gray-700 relative shadow-inner">
      <video 
        ref={videoRef} 
        autoPlay 
        playsInline 
        muted 
        onPlay={handleVideoPlay}
        className="w-full h-full object-cover transform scale-x-[-1] opacity-95 absolute inset-0" 
      />
      <canvas 
        ref={canvasRef} 
        className="w-full h-full object-cover transform scale-x-[-1] absolute inset-0 pointer-events-none z-10" 
      />
      {statusText && (
        <div className={`absolute bottom-3 left-3 px-3 py-1.5 rounded-lg text-xs font-bold z-20 transition-all duration-300 ${
          statusType === 'danger' 
            ? 'bg-red-600/90 text-white animate-pulse' 
            : statusType === 'success'
            ? 'bg-green-600/80 text-white'
            : 'bg-slate-800/80 text-gray-300'
        }`}>
          {statusText}
        </div>
      )}
      <div className="absolute inset-0 ring-1 ring-inset ring-black/20 pointer-events-none rounded-xl z-20"></div>
    </div>
  );
});

export default LiveMonitor;
