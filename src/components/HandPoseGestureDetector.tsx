import { useEffect, useRef } from 'react'
import { useHandPose } from '../hooks/useHandPose'
import { useVoiceGesture } from '../context/VoiceGestureContext'

interface HandPoseGestureDetectorProps {
  enabled?: boolean
}

const HandPoseGestureDetector = ({ enabled = true }: HandPoseGestureDetectorProps) => {
  const { isGestureActive, processGesture } = useVoiceGesture()
  const lastGestureRef = useRef<string | null>(null)
  const lastProcessedGestureRef = useRef<string | null>(null)
  const gestureTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const cooldownRef = useRef(false)
  const gestureHoldCountRef = useRef(0)

  const { isDetecting, hands, error, startDetection, stopDetection, detectGesture } = useHandPose({
    enabled: enabled && isGestureActive,
    onResults: (results) => {
      if (results.length > 0) {
        // Skip if in cooldown period (but still track gesture for hold count)
        if (cooldownRef.current) {
          // Still update gesture tracking even during cooldown
          const gesture = detectGesture(results[0])
          if (gesture && gesture === lastGestureRef.current) {
            gestureHoldCountRef.current++
          }
          return
        }
        // Use the first detected hand
        const gesture = detectGesture(results[0])
        
        if (gesture) {
          // If same gesture as last detected, increment hold count
          if (gesture === lastGestureRef.current) {
            gestureHoldCountRef.current++
          } else {
            // New gesture detected, reset counters
            lastGestureRef.current = gesture
            gestureHoldCountRef.current = 1
          }

          // Only process if:
          // 1. It's a different gesture from the last processed one, AND
          // 2. The gesture has been held for at least 1 frame (immediate detection)
          // All gestures require 1 frame for fast, responsive behavior
          const shouldProcess = 
            gesture !== lastProcessedGestureRef.current && 
            gestureHoldCountRef.current >= 1

          if (shouldProcess) {
            console.log(`Processing gesture: ${gesture} (held for ${gestureHoldCountRef.current} frames)`)
            
            // Mark as processed immediately to prevent re-processing on next frame
            lastProcessedGestureRef.current = gesture
            
            // Clear previous timeout
            if (gestureTimeoutRef.current) {
              clearTimeout(gestureTimeoutRef.current)
            }

            // Process gesture after a short delay
            gestureTimeoutRef.current = setTimeout(() => {
              // Map HandPose gestures to app commands
              // 
              // Gesture Mappings (on cooking/steps page):
              // - fist → 'back' (previous step)
              // - open palm → 'next' (next step)
              // - pointing up → 'timer' (go to timer page)
              // - rock → 'ingredients' (go to ingredients page)
              // - 1 finger, 2 fingers, 3 fingers, 4 fingers → passed as-is (timer durations, handled in ActiveCookingScreen)
              // - thumbs up, fist → passed as-is (timer start/pause, handled in ActiveCookingScreen)
              //
              // Note: Context-specific gestures (timer page) are handled in ActiveCookingScreen
              let command = gesture

              // Map gestures to commands (general navigation)
              // Note: Context-specific gestures (timer page) are handled in ActiveCookingScreen
              switch (gesture) {
                case 'pointing up':
                  command = 'timer'  // Pointing up goes to timer page
                  break
                case 'rock':
                  command = 'ingredients'  // Rock sign goes to ingredients page
                  break
                case 'open palm':
                  command = 'show steps'  // Open palm goes to steps page
                  break
                // thumbs up, thumbs down, fist, and finger counts are context-specific and passed as-is
                default:
                  command = gesture
              }

              console.log(`Mapped gesture "${gesture}" to command "${command}"`)
              
              // Process the gesture
              processGesture(command)
              
              // Set cooldown to prevent immediate re-processing
              cooldownRef.current = true
              setTimeout(() => {
                cooldownRef.current = false
                // Reset after cooldown so same gesture can be used again
                lastProcessedGestureRef.current = null
              }, 1500) // Reduced to 1.5 second cooldown
            }, 100) // Reduced delay from 300ms to 100ms
          } else {
            // Log why gesture isn't being processed
            if (gesture === lastProcessedGestureRef.current) {
              console.log(`Gesture "${gesture}" already processed, waiting for cooldown`)
            } else if (gestureHoldCountRef.current < 3) {
              console.log(`Gesture "${gesture}" held for ${gestureHoldCountRef.current} frames, need 3`)
            }
          }
        }
      } else {
        // No hands detected, reset after a delay
        if (lastGestureRef.current) {
          gestureHoldCountRef.current = 0
          if (gestureTimeoutRef.current) {
            clearTimeout(gestureTimeoutRef.current)
          }
          gestureTimeoutRef.current = setTimeout(() => {
            lastGestureRef.current = null
            lastProcessedGestureRef.current = null
          }, 1000)
        }
      }
    },
  })

  useEffect(() => {
    let mounted = true

    const handleDetection = async () => {
      // Always stop first to ensure clean state
      if (mounted) {
        stopDetection()
        // Wait a bit for cleanup
        await new Promise(resolve => setTimeout(resolve, 200))
      }
      
      if (enabled && isGestureActive && mounted) {
        startDetection()
      }
    }

    handleDetection()

    return () => {
      mounted = false
      stopDetection()
      if (gestureTimeoutRef.current) {
        clearTimeout(gestureTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, isGestureActive])

  // Log errors but don't render anything
  useEffect(() => {
    if (error) {
      console.error('HandPose error:', error)
    }
  }, [error])

  // This component doesn't render anything - it's just a detector
  return null
}

export default HandPoseGestureDetector

