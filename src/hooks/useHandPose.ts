import { useEffect, useRef, useState, useCallback } from 'react'

// Extend Window interface to include ml5
declare global {
  interface Window {
    ml5: any
  }
}

interface HandPoseKeypoint {
  x: number
  y: number
  z?: number
  confidence?: number
  name?: string
}

interface HandPoseResult {
  confidence: number
  handedness: string
  keypoints: HandPoseKeypoint[]
  keypoints3D?: HandPoseKeypoint[]
}

interface UseHandPoseOptions {
  maxHands?: number
  flipped?: boolean
  onResults?: (results: HandPoseResult[]) => void
  enabled?: boolean
}

export const useHandPose = (options: UseHandPoseOptions = {}) => {
  const {
    maxHands = 2,
    flipped = false,
    onResults,
    enabled = true,
  } = options

  const [isDetecting, setIsDetecting] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const [hands, setHands] = useState<HandPoseResult[]>([])
  const [error, setError] = useState<string | null>(null)
  
  const handPoseRef = useRef<any>(null)
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const isInitializedRef = useRef(false)
  const onResultsRef = useRef(onResults)

  // Update onResults ref when it changes
  useEffect(() => {
    onResultsRef.current = onResults
  }, [onResults])

  // Wait for ml5 to be available
  const waitForMl5 = useCallback((): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (window.ml5 && window.ml5.handPose) {
        resolve()
        return
      }

      // Wait for ml5 to load (check every 100ms, timeout after 10 seconds)
      let attempts = 0
      const maxAttempts = 100
      const checkInterval = setInterval(() => {
        attempts++
        if (window.ml5 && window.ml5.handPose) {
          clearInterval(checkInterval)
          resolve()
        } else if (attempts >= maxAttempts) {
          clearInterval(checkInterval)
          reject(new Error('ml5.js failed to load after 10 seconds'))
        }
      }, 100)
    })
  }, [])

  // Initialize HandPose model
  const initializeHandPose = useCallback(async () => {
    if (isInitializedRef.current) return

    try {
      // Wait for ml5 to be available
      await waitForMl5()

      // Initialize HandPose model
      // ml5.js can use either callback or Promise-based initialization
      let handPose: any
      
      // Try Promise-based initialization first (ml5.js v1.0+)
      const handPoseResult = window.ml5.handPose({
        maxHands,
        flipped,
        runtime: 'tfjs',
        modelType: 'full',
      })

      // Check if it's a Promise
      if (handPoseResult && typeof handPoseResult.then === 'function') {
        handPose = await handPoseResult
      } else if (handPoseResult && typeof handPoseResult === 'object') {
        // It's already the model object
        handPose = handPoseResult
      } else {
        // Try callback-based initialization
        handPose = await new Promise((resolve, reject) => {
          try {
            const result = window.ml5.handPose(
              {
                maxHands,
                flipped,
                runtime: 'tfjs',
                modelType: 'full',
              },
              (model: any) => {
                if (model) {
                  resolve(model)
                } else {
                  reject(new Error('HandPose callback returned null'))
                }
              }
            )
            // If it returns immediately (synchronous), use that
            if (result && typeof result !== 'function') {
              resolve(result)
            }
          } catch (err) {
            reject(err)
          }
        })
      }

      // Verify the model has the required methods
      if (!handPose) {
        throw new Error('HandPose model initialization returned null or undefined')
      }

      // Log available methods for debugging (check both own properties and prototype)
      const ownMethods = Object.keys(handPose).filter(key => typeof handPose[key] === 'function')
      const prototype = Object.getPrototypeOf(handPose)
      const prototypeMethods = prototype ? Object.getOwnPropertyNames(prototype).filter(key => typeof handPose[key] === 'function' && key !== 'constructor') : []
      const allMethods = [...new Set([...ownMethods, ...prototypeMethods])]
      console.log('HandPose available methods:', allMethods)
      
      // Check if detectStart exists (might be a getter or on prototype)
      const hasDetectStart = 'detectStart' in handPose || typeof handPose.detectStart === 'function'
      console.log('Has detectStart:', hasDetectStart, typeof handPose.detectStart)

      // ml5.js v1.0+ might use different method names
      // Check for detectStart, detect, or other detection methods
      // First check if detectStart exists and is callable
      const detectStartExists = hasDetectStart && typeof handPose.detectStart === 'function'
      
      if (!detectStartExists) {
        if (typeof handPose.detect === 'function') {
          console.warn('Using detect() instead of detectStart() - creating wrapper')
          // Create a wrapper for continuous detection
          let detectionInterval: NodeJS.Timeout | null = null
          handPose.detectStart = (video: HTMLVideoElement, callback: (results: HandPoseResult[]) => void) => {
            // Stop any existing detection
            if (detectionInterval) {
              clearInterval(detectionInterval)
            }
            // Start continuous detection
            const detectLoop = async () => {
              try {
                const results = await handPose.detect(video)
                callback(results || [])
              } catch (err) {
                console.error('Detection error:', err)
                callback([])
              }
            }
            // Run detection at ~30fps
            detectionInterval = setInterval(detectLoop, 33)
            detectLoop() // Run immediately
          }
          handPose.detectStop = () => {
            if (detectionInterval) {
              clearInterval(detectionInterval)
              detectionInterval = null
            }
          }
        } else if (typeof handPose.on === 'function') {
          // Event-based API
          console.warn('Using event-based API')
          handPose.detectStart = (video: HTMLVideoElement, callback: (results: HandPoseResult[]) => void) => {
            handPose.on('predict', callback)
            // Start detection - might need to call a start method
            if (typeof handPose.start === 'function') {
              handPose.start(video)
            }
          }
          handPose.detectStop = () => {
            handPose.off('predict')
            if (typeof handPose.stop === 'function') {
              handPose.stop()
            }
          }
        } else {
          // Try to find any method that might work
          const detectMethod = allMethods.find(m => m.toLowerCase().includes('detect') || m.toLowerCase().includes('start'))
          if (detectMethod) {
            console.warn(`Using ${detectMethod}() method`)
            handPose.detectStart = handPose[detectMethod]
          } else {
            throw new Error(`HandPose model initialized but detectStart method not available. Available methods: ${allMethods.join(', ')}`)
          }
        }
      }

      handPoseRef.current = handPose
      isInitializedRef.current = true
      setIsInitialized(true)
      setError(null)
      console.log('HandPose model initialized successfully', handPose)
    } catch (err: any) {
      console.error('Error initializing HandPose:', err)
      setError(err.message || 'Failed to initialize HandPose')
      isInitializedRef.current = false
    }
  }, [maxHands, flipped, waitForMl5])

  // Start detection
  const startDetection = useCallback(async (externalVideo?: HTMLVideoElement) => {
    // Prevent multiple simultaneous calls
    if (isDetecting) {
      console.warn('Detection already running, skipping startDetection call')
      return
    }

    // Ensure model is initialized
    if (!handPoseRef.current || !isInitializedRef.current) {
      await initializeHandPose()
      if (!handPoseRef.current) {
        setError('Failed to initialize HandPose model')
        setIsDetecting(false)
        return
      }
    }

    // Verify detectStart method exists
    if (typeof handPoseRef.current.detectStart !== 'function') {
      setError('HandPose detectStart method not available. Model may not be fully initialized.')
      setIsDetecting(false)
      return
    }

    try {
      let video: HTMLVideoElement

      if (externalVideo) {
        // Use external video element
        video = externalVideo
        videoRef.current = video
      } else {
        // Get user media (camera) and create video element
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
        })
        streamRef.current = stream

        // Create video element
        video = document.createElement('video')
        video.srcObject = stream
        video.autoplay = true
        video.playsInline = true
        video.width = 640
        video.height = 480
        videoRef.current = video

        // Wait for video to be ready and playing
        await new Promise<void>((resolve, reject) => {
          const handleLoadedMetadata = () => {
            if (!video) {
              reject(new Error('Video element lost'))
              return
            }
            video.play()
              .then(() => {
                // Wait a bit more to ensure video is actually rendering
                setTimeout(() => {
                  // Verify video is actually playing and has valid dimensions
                  if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
                    resolve()
                  } else {
                    reject(new Error('Video not ready'))
                  }
                }, 200)
              })
              .catch(reject)
            video.removeEventListener('loadedmetadata', handleLoadedMetadata)
          }
          
          if (video.readyState >= 2) {
            // Video already loaded
            handleLoadedMetadata()
          } else {
            video.addEventListener('loadedmetadata', handleLoadedMetadata)
          }
        })
      }

      // Verify video element exists and has a stream
      if (!video) {
        throw new Error('Video element not available')
      }

      // Check if video has a stream (srcObject) - this is more reliable than dimensions
      if (!video.srcObject) {
        console.warn('Video element has no stream (srcObject), video state:', {
          readyState: video.readyState,
          videoWidth: video.videoWidth,
          videoHeight: video.videoHeight,
          paused: video.paused,
          srcObject: video.srcObject
        })
        throw new Error('Video element has no stream (srcObject)')
      }

      console.log('Starting detection with video:', {
        readyState: video.readyState,
        videoWidth: video.videoWidth,
        videoHeight: video.videoHeight,
        paused: video.paused,
        hasSrcObject: !!video.srcObject
      })

      // Start detection - ensure we have a valid handPose instance
      // Note: We allow detection even if videoWidth/Height are 0, as they may be set later
      // ml5.js should handle this gracefully
      if (handPoseRef.current && typeof handPoseRef.current.detectStart === 'function') {
        // Set detecting state immediately when we start detection
        setIsDetecting(true)
        
        // Add a small delay if dimensions aren't ready yet to give GPU time
        const startDetection = () => {
          try {
            handPoseRef.current.detectStart(video, (results: HandPoseResult[]) => {
              setHands(results)
              // Keep isDetecting true (it's already set above)
              if (onResultsRef.current) {
                onResultsRef.current(results)
              }
            })
            setError(null)
          } catch (err: any) {
            console.error('Error in detectStart:', err)
            setError(err.message || 'Failed to start detection')
            setIsDetecting(false)
          }
        }

        // If video dimensions are ready, start immediately
        if (video.videoWidth > 0 && video.videoHeight > 0 && video.readyState >= 2) {
          startDetection()
        } else {
          // Wait a bit for dimensions to be available, but don't fail if they're not
          setTimeout(() => {
            if (video && video.srcObject) {
              startDetection()
            } else {
              setError('Video stream lost before detection could start')
              setIsDetecting(false)
            }
          }, 500)
        }
      } else {
        throw new Error('HandPose model not properly initialized')
      }
    } catch (err: any) {
      console.error('Error starting hand detection:', err)
      setError(err.message || 'Failed to start hand detection')
      setIsDetecting(false)
    }
  }, [initializeHandPose, isDetecting])

  // Stop detection
  const stopDetection = useCallback(() => {
    // Set detecting to false first to prevent new starts
    setIsDetecting(false)
    
    if (handPoseRef.current) {
      try {
        handPoseRef.current.detectStop()
      } catch (err) {
        console.error('Error stopping detection:', err)
      }
    }

    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop())
      streamRef.current = null
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
      videoRef.current = null
    }

    setHands([])
  }, [])

  // Initialize on mount if enabled
  useEffect(() => {
    if (enabled) {
      initializeHandPose()
    }

    return () => {
      if (enabled) {
        stopDetection()
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  // Detect gestures from hand keypoints
  const detectGesture = useCallback((hand: HandPoseResult): string | null => {
    if (!hand.keypoints || hand.keypoints.length < 21) return null

    const keypoints = hand.keypoints
    const wrist = keypoints[0]

    // Get keypoint indices (based on HandPose 21 keypoint model)
    // 0: wrist, 1-4: thumb, 5-8: index, 9-12: middle, 13-16: ring, 17-20: pinky
    const thumbTip = keypoints[4]
    const indexTip = keypoints[8]
    const middleTip = keypoints[12]
    const ringTip = keypoints[16]
    const pinkyTip = keypoints[20]
    const thumbMCP = keypoints[2]
    const thumbIP = keypoints[3]
    const indexMCP = keypoints[5]
    const indexPIP = keypoints[6]
    const middleMCP = keypoints[9]
    const middlePIP = keypoints[10]
    const ringMCP = keypoints[13]
    const ringPIP = keypoints[14]
    const pinkyMCP = keypoints[17]
    const pinkyPIP = keypoints[18]

    // Helper: check if finger is extended
    const isFingerExtended = (tip: HandPoseKeypoint, pip: HandPoseKeypoint, mcp: HandPoseKeypoint) => {
      return tip.y < pip.y && pip.y < mcp.y
    }

    // Helper: check if finger is closed
    const isFingerClosed = (tip: HandPoseKeypoint, pip: HandPoseKeypoint, mcp: HandPoseKeypoint) => {
      return tip.y > pip.y
    }

    // Check which fingers are extended
    const indexExtended = isFingerExtended(indexTip, indexPIP, indexMCP)
    const middleExtended = isFingerExtended(middleTip, middlePIP, middleMCP)
    const ringExtended = isFingerExtended(ringTip, ringPIP, ringMCP)
    const pinkyExtended = isFingerExtended(pinkyTip, pinkyPIP, pinkyMCP)
    const thumbExtended = thumbTip.y < thumbIP.y && thumbIP.y < thumbMCP.y

    // Count extended fingers (excluding thumb for 1-3, including thumb for 5)
    const extendedFingers = [indexExtended, middleExtended, ringExtended, pinkyExtended].filter(Boolean).length
    const allFingersExtended = indexExtended && middleExtended && ringExtended && pinkyExtended && thumbExtended

    // Detect pointing up gesture (index finger pointing upward)
    // Pointing up: index finger extended and pointing upward (index tip is above wrist)
    if (indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      const indexToWristX = indexTip.x - wrist.x
      const indexToWristY = indexTip.y - wrist.y
      const indexToWristDistance = Math.sqrt(indexToWristX * indexToWristX + indexToWristY * indexToWristY)
      
      // Only detect pointing up if index finger is extended away from wrist
      // Require minimum distance to distinguish from simple finger count
      if (indexToWristDistance > 40) {
        // Pointing up: index finger pointing upward (index tip is significantly above wrist)
        if (indexToWristY < -25 && Math.abs(indexToWristY) > Math.abs(indexToWristX) * 0.6) {
          console.log('Detected pointing up:', { indexToWristX, indexToWristY, distance: indexToWristDistance })
          return 'pointing up'
        }
      }
    }

    // Finger count gestures (check these first before open palm)
    // Order matters: check open palm (5 fingers) first, then 4, 3, 2, 1, then thumbs up, then fist
    
    // Open palm: all 5 fingers extended (index + middle + ring + pinky + thumb)
    // Check this first to avoid conflict with finger counts
    if (allFingersExtended) {
      return 'open palm'
    }
    
    // 1 finger = index only (check before 2, 3, and 4 to avoid conflicts)
    // But only if it's not pointing (pointing gestures are checked first)
    // Pointing gestures require index to be significantly offset from wrist
    if (extendedFingers === 1 && indexExtended && !middleExtended && !ringExtended && !pinkyExtended) {
      const indexToWristX = indexTip.x - wrist.x
      const indexToWristY = indexTip.y - wrist.y
      const indexToWristDistance = Math.sqrt(indexToWristX * indexToWristX + indexToWristY * indexToWristY)
      
      // If index is close to wrist (not pointing), it's a 1 finger count
      // Also check if it's not pointing horizontally or vertically (pointing gestures already handled above)
      // Pointing gestures require distance > 40 and significant offset, so if it's closer or less offset, it's a count
      if (indexToWristDistance < 40 || (Math.abs(indexToWristX) <= 15 && Math.abs(indexToWristY) <= 25)) {
        return '1 finger'
      }
      // Otherwise, it's a pointing gesture (already handled above, but return null here to avoid duplicate)
      return null
    }
    
    // 2 fingers = index + middle
    if (extendedFingers === 2 && indexExtended && middleExtended && !ringExtended && !pinkyExtended) {
      return '2 fingers'
    }
    
    // 3 fingers = index + middle + ring
    if (extendedFingers === 3 && indexExtended && middleExtended && ringExtended && !pinkyExtended) {
      return '3 fingers'
    }
    
    // 4 fingers = index + middle + ring + pinky (thumb closed)
    if (extendedFingers === 4 && indexExtended && middleExtended && ringExtended && pinkyExtended && !thumbExtended) {
      return '4 fingers'
    }

    // Fist: all fingers closed (including thumb)
    // IMPORTANT: Check fist BEFORE thumbs up/down to avoid confusion
    // A fist requires ALL fingers to be closed, including the thumb
    const allFingersClosed = !indexExtended && !middleExtended && !ringExtended && !pinkyExtended
    // Check thumb is closed (thumb tip below thumb IP and MCP, or thumb not extended)
    const thumbClosed = !thumbExtended || (thumbTip.y > thumbIP.y && thumbTip.y > thumbMCP.y)
    // Double-check: ensure all fingers are truly closed (tips below PIP and MCP)
    const indexTrulyClosed = indexTip.y > indexPIP.y && indexTip.y > indexMCP.y
    const middleTrulyClosed = middleTip.y > middlePIP.y && middleTip.y > middleMCP.y
    const ringTrulyClosed = ringTip.y > ringPIP.y && ringTip.y > ringMCP.y
    const pinkyTrulyClosed = pinkyTip.y > pinkyPIP.y && pinkyTip.y > pinkyMCP.y
    
    // Fist: all fingers must be closed (truly closed, not just not extended)
    // Thumb must also be closed (not extended upward or downward)
    if (allFingersClosed && thumbClosed && indexTrulyClosed && middleTrulyClosed && ringTrulyClosed && pinkyTrulyClosed) {
      return 'fist'
    }

    // Thumbs up: thumb extended upward, other fingers closed
    // Thumb should be clearly extended upward (thumb tip above thumb IP and MCP)
    // Other fingers should be closed
    // Only detect if thumb is clearly extended upward (not just not closed)
    const thumbUpExtended = thumbTip.y < thumbIP.y && thumbIP.y < thumbMCP.y
    const thumbUp = thumbUpExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended
    if (thumbUp) {
      return 'thumbs up'
    }

    // Thumbs down: thumb extended downward, other fingers closed
    // Thumb should be clearly extended downward (thumb tip significantly below thumb IP and MCP)
    // Other fingers should be closed
    // Only detect if thumb is clearly extended downward with significant movement
    const thumbDownExtended = thumbTip.y > thumbIP.y && thumbTip.y > thumbMCP.y && 
                              (thumbTip.y - thumbMCP.y) > 15 // Require significant downward extension
    const thumbDown = thumbDownExtended && !indexExtended && !middleExtended && !ringExtended && !pinkyExtended
    if (thumbDown) {
      return 'thumbs down'
    }

    // Rock sign: index and pinky extended, middle and ring closed
    // Thumb can be extended or not
    if (indexExtended && !middleExtended && !ringExtended && pinkyExtended) {
      return 'rock'
    }

    // OK sign: thumb and index form circle (thumb and index tips close together)
    // Other fingers should be closed
    const thumbIndexDistance = Math.sqrt(
      Math.pow(thumbTip.x - indexTip.x, 2) + Math.pow(thumbTip.y - indexTip.y, 2)
    )
    
    // Check if thumb and index are close (forming a circle)
    // Also check that middle, ring, and pinky are closed
    const middleClosed = !middleExtended
    const ringClosed = !ringExtended
    const pinkyClosed = !pinkyExtended
    
    // OK sign: thumb and index tips close (within 60px), other fingers closed
    const thumbIndexVeryClose = thumbIndexDistance < 60
    
    if (thumbIndexVeryClose && middleClosed && ringClosed && pinkyClosed) {
      // Index can be bent (for circle) or slightly extended, but thumb and index must be close
      return 'ok'
    }

    return null
  }, [])

  return {
    isDetecting,
    isInitialized,
    hands,
    error,
    startDetection,
    stopDetection,
    detectGesture,
    videoRef: videoRef,
  }
}

