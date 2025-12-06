import { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import MobileHeader from '../components/MobileHeader'
import HandPoseGestureDetector from '../components/HandPoseGestureDetector'
import { useVoiceGesture } from '../context/VoiceGestureContext'
import { useHandPose } from '../hooks/useHandPose'

const GestureDebugScreen = () => {
  const navigate = useNavigate()
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const { isGestureActive, lastGesture } = useVoiceGesture()

  const location = useLocation()
  const isOnCookingPage = location.pathname.includes('/cooking/')
  
  // Only start detection on debug page if NOT on cooking page (to avoid conflicts)
  // If on cooking page, the HandPoseGestureDetector there will handle detection
  const shouldStartDetection = isGestureActive && !isOnCookingPage
  
  // Use HandPose hook for visualization
  const { isDetecting, isInitialized, hands, error: handPoseError, detectGesture, videoRef: hookVideoRef } = useHandPose({
    enabled: shouldStartDetection, // Only enable if not on cooking page
    onResults: (results) => {
      if (results.length > 0) {
        const gesture = detectGesture(results[0])
        setDetectedGesture(gesture)
      } else {
        setDetectedGesture(null)
      }
    },
  })

  // Get video element from the hook and display it
  useEffect(() => {
    if (hookVideoRef && hookVideoRef.current && videoRef.current && isDetecting) {
      // Copy the video stream to our display element
      const sourceVideo = hookVideoRef.current
      if (sourceVideo.srcObject) {
        videoRef.current.srcObject = sourceVideo.srcObject
        videoRef.current.play().catch(console.error)
      } else {
        // Wait for srcObject to be set
        const checkInterval = setInterval(() => {
          if (sourceVideo.srcObject && videoRef.current) {
            videoRef.current.srcObject = sourceVideo.srcObject
            videoRef.current.play().catch(console.error)
            clearInterval(checkInterval)
          }
        }, 100)
        return () => clearInterval(checkInterval)
      }
    }
  }, [hookVideoRef, isDetecting])

  // Draw hand keypoints on canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw video frame
      if (videoRef.current && videoRef.current.videoWidth > 0) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      }

      // Draw hand keypoints
      if (hands.length > 0) {
        hands.forEach((hand) => {
          // Draw keypoints
          hand.keypoints.forEach((keypoint) => {
            ctx.beginPath()
            ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI)
            ctx.fillStyle = '#00ff00'
            ctx.fill()
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2
            ctx.stroke()
          })

          // Draw connections (simplified - draw main finger connections)
          ctx.strokeStyle = '#00ff00'
          ctx.lineWidth = 2

          // Thumb
          if (hand.keypoints.length > 4) {
            drawConnection(ctx, hand.keypoints[0], hand.keypoints[1])
            drawConnection(ctx, hand.keypoints[1], hand.keypoints[2])
            drawConnection(ctx, hand.keypoints[2], hand.keypoints[3])
            drawConnection(ctx, hand.keypoints[3], hand.keypoints[4])
          }

          // Index finger
          if (hand.keypoints.length > 8) {
            drawConnection(ctx, hand.keypoints[0], hand.keypoints[5])
            drawConnection(ctx, hand.keypoints[5], hand.keypoints[6])
            drawConnection(ctx, hand.keypoints[6], hand.keypoints[7])
            drawConnection(ctx, hand.keypoints[7], hand.keypoints[8])
          }

          // Middle finger
          if (hand.keypoints.length > 12) {
            drawConnection(ctx, hand.keypoints[0], hand.keypoints[9])
            drawConnection(ctx, hand.keypoints[9], hand.keypoints[10])
            drawConnection(ctx, hand.keypoints[10], hand.keypoints[11])
            drawConnection(ctx, hand.keypoints[11], hand.keypoints[12])
          }

          // Ring finger
          if (hand.keypoints.length > 16) {
            drawConnection(ctx, hand.keypoints[0], hand.keypoints[13])
            drawConnection(ctx, hand.keypoints[13], hand.keypoints[14])
            drawConnection(ctx, hand.keypoints[14], hand.keypoints[15])
            drawConnection(ctx, hand.keypoints[15], hand.keypoints[16])
          }

          // Pinky
          if (hand.keypoints.length > 20) {
            drawConnection(ctx, hand.keypoints[0], hand.keypoints[17])
            drawConnection(ctx, hand.keypoints[17], hand.keypoints[18])
            drawConnection(ctx, hand.keypoints[18], hand.keypoints[19])
            drawConnection(ctx, hand.keypoints[19], hand.keypoints[20])
          }
        })
      }
    }

    const interval = setInterval(draw, 33) // ~30fps
    return () => clearInterval(interval)
  }, [hands])

  const drawConnection = (
    ctx: CanvasRenderingContext2D,
    point1: { x: number; y: number },
    point2: { x: number; y: number }
  ) => {
    ctx.beginPath()
    ctx.moveTo(point1.x, point1.y)
    ctx.lineTo(point2.x, point2.y)
    ctx.stroke()
  }

  // Setup canvas size when video is ready
  useEffect(() => {
    if (videoRef.current && canvasRef.current && isDetecting) {
      const updateCanvasSize = () => {
        if (videoRef.current && canvasRef.current) {
          canvasRef.current.width = videoRef.current.videoWidth || 640
          canvasRef.current.height = videoRef.current.videoHeight || 480
        }
      }
      videoRef.current.addEventListener('loadedmetadata', updateCanvasSize)
      updateCanvasSize()
      return () => {
        if (videoRef.current) {
          videoRef.current.removeEventListener('loadedmetadata', updateCanvasSize)
        }
      }
    }
  }, [isDetecting])

  useEffect(() => {
    if (handPoseError) {
      setError(handPoseError)
    } else {
      setError(null)
    }
  }, [handPoseError])

  return (
    <div className="h-screen bg-gray-900 flex flex-col overflow-hidden">
      {/* Only render detector if we're on the debug page (not cooking page) */}
      {!isOnCookingPage && <HandPoseGestureDetector enabled={isGestureActive} />}
      
      <MobileHeader
        title="Gesture Debug"
        showBack
        onBack={() => navigate(-1)}
      />

      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        {/* Video/Canvas Container */}
        <div className="relative bg-black rounded-lg overflow-hidden shadow-2xl max-w-4xl w-full">
          <canvas
            ref={canvasRef}
            className="w-full h-auto"
            style={{ display: 'block' }}
          />
          <video
            ref={videoRef}
            className="absolute top-0 left-0 w-full h-full opacity-0 pointer-events-none"
            playsInline
            muted
          />
        </div>

        {/* Control Panel */}
        <div className="bg-white rounded-lg p-6 shadow-lg max-w-4xl w-full">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Gesture Debug</h2>
          </div>

          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div
                className={`w-3 h-3 rounded-full ${
                  isGestureActive && isDetecting 
                    ? 'bg-green-500 animate-pulse' 
                    : isGestureActive && isInitialized
                    ? 'bg-yellow-500'
                    : isGestureActive
                    ? 'bg-gray-400 animate-pulse'
                    : 'bg-gray-400'
                }`}
              />
              <span className="text-sm text-gray-700">
                Status: {isGestureActive 
                  ? (isDetecting 
                      ? 'Detecting' 
                      : isInitialized 
                      ? 'Ready (waiting for camera)' 
                      : 'Initializing model...') 
                  : 'Gesture Control Disabled - Enable in Settings'}
              </span>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-sm text-red-700 font-medium">Error:</p>
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            {hands.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-700 font-medium">
                  Hands Detected: {hands.length}
                </p>
                {hands.map((hand, index) => (
                  <div key={index} className="mt-2">
                    <p className="text-xs text-green-600">
                      Hand {index + 1}: {hand.handedness} (confidence: {(hand.confidence * 100).toFixed(1)}%)
                    </p>
                    <p className="text-xs text-green-600">
                      Keypoints: {hand.keypoints.length}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {detectedGesture && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-700 font-medium">
                  Detected Gesture:
                </p>
                <p className="text-lg text-blue-900 font-bold capitalize">
                  {detectedGesture}
                </p>
              </div>
            )}

            {lastGesture && (
              <div className="bg-purple-50 border border-purple-200 rounded-lg p-3">
                <p className="text-sm text-purple-700 font-medium">
                  Last Processed Gesture:
                </p>
                <p className="text-lg text-purple-900 font-bold capitalize">
                  {lastGesture}
                </p>
              </div>
            )}

            {!isGestureActive && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-700">
                  ⚠️ Gesture control is disabled. Enable it in Settings to see the camera feed and detection.
                </p>
              </div>
            )}

            {isGestureActive && !isDetecting && !error && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-600">
                  Camera feed will appear automatically when gesture control is active. Make sure to allow camera access when prompted.
                </p>
              </div>
            )}
          </div>

          {/* Gesture Guide */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Supported Gestures:
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
              <div>→ Swipe Right → Next Step</div>
              <div>← Swipe Left → Previous Step</div>
              <div>👋 Wave → Show Steps</div>
              <div>🤘 Rock Sign → Ingredients</div>
              <div>👌 OK Sign → Timer Page</div>
              <div>✋ Open Palm → Start Timer (timer page)</div>
              <div>✊ Fist → Pause Timer (timer page)</div>
              <div>1 Finger → 5 min (timer page)</div>
              <div>2 Fingers → 10 min (timer page)</div>
              <div>3 Fingers → 15 min (timer page)</div>
              <div>5 Fingers → 30 min (timer page)</div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default GestureDebugScreen

