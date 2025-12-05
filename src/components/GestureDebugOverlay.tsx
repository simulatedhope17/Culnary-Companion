import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { useHandPose } from '../hooks/useHandPose'
import { useVoiceGesture } from '../context/VoiceGestureContext'

interface HandPoseKeypoint {
  x: number
  y: number
  z?: number
  confidence?: number
  name?: string
}

interface GestureDebugOverlayProps {
  isOpen: boolean
  onClose: () => void
}

const GestureDebugOverlay = ({ isOpen, onClose }: GestureDebugOverlayProps) => {
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [detectedGesture, setDetectedGesture] = useState<string | null>(null)
  const { isGestureActive, lastGesture } = useVoiceGesture()

  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null)
  const [cameraError, setCameraError] = useState<string | null>(null)
  const [videoReady, setVideoReady] = useState(false)

  // Create HandPose instance that uses our video element
  const { isDetecting, isInitialized, hands, error: handPoseError, detectGesture, startDetection, stopDetection } = useHandPose({
    enabled: false, // We'll manually start detection with our video element
    onResults: (results) => {
      if (results.length > 0) {
        const gesture = detectGesture(results[0])
        setDetectedGesture(gesture)
      } else {
        setDetectedGesture(null)
      }
    },
  })

  // Get camera stream and display it, then start HandPose detection with it
  useEffect(() => {
    let stream: MediaStream | null = null
    let mounted = true

    const setupCamera = async () => {
      if (!isOpen || !isGestureActive) {
        // Stop detection when overlay closes
        stopDetection()
        if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop())
          setCameraStream(null)
        }
        return
      }

      try {
        setCameraError(null)
        
        // Request camera access directly for the overlay
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            width: { ideal: 640 }, 
            height: { ideal: 480 },
            facingMode: 'user' 
          },
        })

        if (!mounted || !videoRef.current) {
          stream.getTracks().forEach(track => track.stop())
          return
        }

        setCameraStream(stream)
        videoRef.current.srcObject = stream
        videoRef.current.autoplay = true
        videoRef.current.playsInline = true
        videoRef.current.muted = true
        setVideoReady(false)

        // Wait for video to be ready and play
        await new Promise<void>((resolve, reject) => {
          if (!videoRef.current) {
            reject(new Error('Video element not available'))
            return
          }
          
          const handleLoadedMetadata = () => {
            if (!videoRef.current || !mounted) {
              reject(new Error('Video element lost'))
              return
            }
            videoRef.current.play()
              .then(() => {
                // Wait for video to actually be rendering
                return new Promise<void>((waitResolve) => {
                  const checkReady = () => {
                    if (videoRef.current && videoRef.current.readyState >= 2 && 
                        videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0) {
                      // Mark video as ready
                      if (mounted) {
                        setVideoReady(true)
                      }
                      waitResolve()
                    } else {
                      setTimeout(checkReady, 100)
                    }
                  }
                  checkReady()
                })
              })
              .then(() => {
                // Set canvas size after video is ready
                if (canvasRef.current && videoRef.current && videoRef.current.videoWidth > 0) {
                  canvasRef.current.width = videoRef.current.videoWidth
                  canvasRef.current.height = videoRef.current.videoHeight
                }
                
                // Start HandPose detection with this video element only if it's ready
                if (videoRef.current && videoRef.current.videoWidth > 0 && 
                    videoRef.current.videoHeight > 0 && startDetection && mounted && stream) {
                  // Store references to ensure they persist through the timeout
                  const currentVideo = videoRef.current
                  const streamToUse = stream // Use the stream from closure, not from video element
                  
                  // Ensure stream is attached to video
                  if (!currentVideo.srcObject) {
                    currentVideo.srcObject = streamToUse
                  }
                  
                  // Define function to try starting detection
                  const tryStartDetection = () => {
                    // Verify video is still ready
                    if (!mounted || !videoRef.current || videoRef.current !== currentVideo) {
                      return
                    }
                    
                    // Ensure stream is attached
                    if (!videoRef.current.srcObject) {
                      videoRef.current.srcObject = streamToUse
                    }
                    
                    if (videoRef.current.videoWidth > 0 && videoRef.current.videoHeight > 0 && 
                        videoRef.current.srcObject && startDetection) {
                      try {
                        console.log('Starting detection with video element:', {
                          hasSrcObject: !!videoRef.current.srcObject,
                          videoWidth: videoRef.current.videoWidth,
                          videoHeight: videoRef.current.videoHeight,
                          readyState: videoRef.current.readyState
                        })
                        startDetection(videoRef.current)
                      } catch (err) {
                        console.error('Error calling startDetection:', err)
                        setCameraError('Failed to start hand detection')
                      }
                    } else {
                      console.warn('Video not ready for detection:', {
                        videoWidth: videoRef.current.videoWidth,
                        videoHeight: videoRef.current.videoHeight,
                        hasSrcObject: !!videoRef.current.srcObject,
                        readyState: videoRef.current.readyState
                      })
                    }
                  }
                  
                  // Small delay to ensure GPU texture is ready
                  setTimeout(() => {
                    // Double-check everything is still valid
                    if (!mounted || !videoRef.current || videoRef.current !== currentVideo) {
                      console.warn('Video element changed or component unmounted')
                      return
                    }
                    
                    // Ensure stream is still attached (re-attach if needed)
                    if (!videoRef.current.srcObject) {
                      console.warn('Re-attaching stream to video element')
                      videoRef.current.srcObject = streamToUse
                      // Wait a moment for the stream to attach
                      setTimeout(() => {
                        if (mounted && videoRef.current && videoRef.current === currentVideo) {
                          tryStartDetection()
                        }
                      }, 100)
                      return
                    }
                    
                    tryStartDetection()
                  }, 300)
                }
                
                resolve()
              })
              .catch(reject)
            if (videoRef.current) {
              videoRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata)
            }
          }
          
          videoRef.current.addEventListener('loadedmetadata', handleLoadedMetadata)
          
          // Also listen for playing event as a fallback
          const handlePlaying = () => {
            if (videoRef.current && mounted && videoRef.current.videoWidth > 0) {
              setVideoReady(true)
            }
          }
          videoRef.current.addEventListener('playing', handlePlaying)
          
          // Fallback timeout
          setTimeout(() => {
            if (videoRef.current && videoRef.current.readyState >= 2 && mounted) {
              handleLoadedMetadata()
            }
          }, 1000)
        })
      } catch (err: any) {
        console.error('Error accessing camera in debug overlay:', err)
        setCameraError(err.message || 'Failed to access camera')
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setCameraError('Camera permission denied. Please allow camera access in your browser settings.')
        } else if (err.name === 'NotFoundError') {
          setCameraError('No camera found. Please connect a camera device.')
        }
      }
    }

    if (isOpen && isGestureActive) {
      setupCamera()
    }

    return () => {
      mounted = false
      setVideoReady(false)
      stopDetection()
      if (stream) {
        stream.getTracks().forEach(track => track.stop())
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null
      }
      setCameraStream(null)
    }
  }, [isOpen, isGestureActive, startDetection, stopDetection])

  // Update canvas size when video metadata loads
  useEffect(() => {
    if (videoRef.current && canvasRef.current) {
      const updateCanvasSize = () => {
        if (videoRef.current && canvasRef.current && videoRef.current.videoWidth > 0) {
          canvasRef.current.width = videoRef.current.videoWidth
          canvasRef.current.height = videoRef.current.videoHeight
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
  }, [isOpen])

  // Draw hand keypoints on canvas
  useEffect(() => {
    if (!canvasRef.current || !videoRef.current || !isOpen || !videoReady) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    let animationFrameId: number
    let lastTime = 0
    const targetFPS = 30
    const frameInterval = 1000 / targetFPS

    const draw = (currentTime: number) => {
      // Throttle to target FPS
      if (currentTime - lastTime < frameInterval) {
        animationFrameId = requestAnimationFrame(draw)
        return
      }
      lastTime = currentTime

      // Only draw if video is ready
      if (!videoRef.current || videoRef.current.videoWidth === 0 || videoRef.current.readyState < 2) {
        animationFrameId = requestAnimationFrame(draw)
        return
      }

      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Draw video frame
      try {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height)
      } catch (err) {
        // Video might not be ready yet, skip this frame
        animationFrameId = requestAnimationFrame(draw)
        return
      }

      // Draw hand keypoints
      if (hands.length > 0) {
        hands.forEach((hand) => {
          if (!hand.keypoints || hand.keypoints.length < 21) return

          // Draw connections first (so keypoints appear on top)
          ctx.strokeStyle = '#00ff00'
          ctx.lineWidth = 2

          const drawConnection = (p1: HandPoseKeypoint, p2: HandPoseKeypoint) => {
            ctx.beginPath()
            ctx.moveTo(p1.x, p1.y)
            ctx.lineTo(p2.x, p2.y)
            ctx.stroke()
          }

          // Thumb
          drawConnection(hand.keypoints[0], hand.keypoints[1])
          drawConnection(hand.keypoints[1], hand.keypoints[2])
          drawConnection(hand.keypoints[2], hand.keypoints[3])
          drawConnection(hand.keypoints[3], hand.keypoints[4])

          // Index finger
          drawConnection(hand.keypoints[0], hand.keypoints[5])
          drawConnection(hand.keypoints[5], hand.keypoints[6])
          drawConnection(hand.keypoints[6], hand.keypoints[7])
          drawConnection(hand.keypoints[7], hand.keypoints[8])

          // Middle finger
          drawConnection(hand.keypoints[0], hand.keypoints[9])
          drawConnection(hand.keypoints[9], hand.keypoints[10])
          drawConnection(hand.keypoints[10], hand.keypoints[11])
          drawConnection(hand.keypoints[11], hand.keypoints[12])

          // Ring finger
          drawConnection(hand.keypoints[0], hand.keypoints[13])
          drawConnection(hand.keypoints[13], hand.keypoints[14])
          drawConnection(hand.keypoints[14], hand.keypoints[15])
          drawConnection(hand.keypoints[15], hand.keypoints[16])

          // Pinky
          drawConnection(hand.keypoints[0], hand.keypoints[17])
          drawConnection(hand.keypoints[17], hand.keypoints[18])
          drawConnection(hand.keypoints[18], hand.keypoints[19])
          drawConnection(hand.keypoints[19], hand.keypoints[20])

          // Draw keypoints on top
          hand.keypoints.forEach((keypoint) => {
            ctx.beginPath()
            ctx.arc(keypoint.x, keypoint.y, 5, 0, 2 * Math.PI)
            ctx.fillStyle = '#00ff00'
            ctx.fill()
            ctx.strokeStyle = '#ffffff'
            ctx.lineWidth = 2
            ctx.stroke()
          })
        })
      }

      animationFrameId = requestAnimationFrame(draw)
    }

    animationFrameId = requestAnimationFrame(draw)
    return () => {
      cancelAnimationFrame(animationFrameId)
    }
  }, [hands, isOpen, videoReady])

  if (!isOpen) return null

  return (
    <div className="fixed bottom-20 right-4 z-50">
      <div className="bg-white rounded-lg shadow-2xl border-2 border-purple-500 overflow-hidden w-64">
        {/* Small Header */}
        <div className="bg-purple-500 text-white px-2 py-1 flex items-center justify-between">
          <span className="text-xs font-semibold">Gesture Debug</span>
          <button
            onClick={onClose}
            className="p-0.5 hover:bg-purple-600 rounded transition-colors"
            title="Close"
          >
            <X size={14} />
          </button>
        </div>

        <div className="p-2 space-y-2">
          {/* Small Video/Canvas Preview */}
          <div className="relative bg-black rounded overflow-hidden aspect-video">
            <canvas
              ref={canvasRef}
              className="w-full h-full"
              style={{ display: 'block' }}
            />
            <video
              ref={videoRef}
              className="absolute top-0 left-0 w-full h-full opacity-0 pointer-events-none"
              playsInline
              muted
              autoPlay
            />
            {!videoReady && !cameraError && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <p className="text-white text-xs text-center px-2">Waiting for camera...</p>
              </div>
            )}
            {(cameraError || handPoseError) && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-900/50">
                <p className="text-white text-xs text-center px-2">Camera Error</p>
              </div>
            )}
          </div>

          {/* Compact Status */}
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  isGestureActive && isDetecting
                    ? 'bg-green-500 animate-pulse'
                    : isGestureActive && isInitialized
                    ? 'bg-yellow-500'
                    : isGestureActive
                    ? 'bg-gray-400 animate-pulse'
                    : 'bg-gray-400'
                }`}
              />
              <span className="text-xs text-gray-700 truncate">
                {isGestureActive
                  ? isDetecting
                    ? 'Detecting'
                    : isInitialized
                    ? 'Ready'
                    : 'Initializing...'
                  : 'Disabled'}
              </span>
            </div>

            {/* Detected Gesture */}
            {(detectedGesture || lastGesture) && (
              <div className="bg-blue-50 rounded px-2 py-1">
                <p className="text-xs font-semibold text-blue-900 capitalize truncate">
                  {detectedGesture || lastGesture}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default GestureDebugOverlay

