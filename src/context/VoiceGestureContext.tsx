import { createContext, useContext, useState, ReactNode, useCallback, useEffect, useRef } from 'react'

interface VoiceGestureContextType {
  isVoiceActive: boolean
  isGestureActive: boolean
  isListening: boolean
  isGestureDetecting: boolean
  lastCommand: string | null
  lastRawTranscript: string | null
  lastGesture: string | null
  startVoiceListening: () => void
  stopVoiceListening: () => void
  pauseVoiceListening: () => void
  resumeVoiceListening: () => void
  processVoiceCommand: (command: string) => void
  processGesture: (gesture: string) => void
  clearFeedback: () => void
}

const VoiceGestureContext = createContext<VoiceGestureContextType | undefined>(undefined)

// Check if Web Speech API is available
const isSpeechRecognitionSupported = () => {
  return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window
}

export const VoiceGestureProvider = ({ children }: { children: ReactNode }) => {
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isGestureActive, setIsGestureActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isGestureDetecting, setIsGestureDetecting] = useState(false)
  const [lastCommand, setLastCommand] = useState<string | null>(null)
  const [lastRawTranscript, setLastRawTranscript] = useState<string | null>(null)
  const [lastGesture, setLastGesture] = useState<string | null>(null)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const processVoiceCommandRef = useRef<(command: string) => void>(() => {})
  const retryCountRef = useRef(0)
  const maxRetries = 3
  const permissionDeniedLoggedRef = useRef(false)
  const isPausedRef = useRef(false)

  // Load settings from localStorage and listen for changes
  useEffect(() => {
    const updateSettings = () => {
      const voiceEnabled = localStorage.getItem('voice-commands-enabled') !== 'false'
      const gestureEnabled = localStorage.getItem('gesture-controls-enabled') !== 'false'
      setIsVoiceActive(voiceEnabled)
      setIsGestureActive(gestureEnabled)
    }

    updateSettings()
    
    // Listen for storage changes (when settings are updated)
    window.addEventListener('storage', updateSettings)
    
    // Also check periodically (for same-tab updates)
    const interval = setInterval(updateSettings, 500)
    
    return () => {
      window.removeEventListener('storage', updateSettings)
      clearInterval(interval)
    }
  }, [])

  // Initialize Speech Recognition
  useEffect(() => {
    if (!isSpeechRecognitionSupported() || !isVoiceActive) {
      return
    }

    const SpeechRecognitionClass = window.webkitSpeechRecognition || window.SpeechRecognition
    if (!SpeechRecognitionClass) return
    
    const recognition = new SpeechRecognitionClass()
    
    recognition.continuous = true
    recognition.interimResults = false
    recognition.lang = 'en-US'

    recognition.onstart = () => {
      setIsListening(true)
    }

    recognition.onend = () => {
      setIsListening(false)
      // Don't restart if paused (e.g., when TTS is speaking)
      if (isPausedRef.current) {
        retryCountRef.current = 0
        return
      }
      // Only restart if voice is still active and we haven't hit max retries
      if (isVoiceActive && retryCountRef.current < maxRetries) {
        retryCountRef.current++
        try {
          recognition.start()
        } catch (e) {
          // Ignore errors when restarting
        }
      } else {
        retryCountRef.current = 0
      }
    }

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      setIsListening(false)
      
      // Don't log or retry on 'no-speech' errors (normal when user isn't speaking)
      if (event.error === 'no-speech') {
        return
      }
      
      // Don't retry on permission or service errors - these require user action
      const nonRetryableErrors = ['not-allowed', 'aborted', 'service-not-allowed']
      if (nonRetryableErrors.includes(event.error)) {
        // Only log once, and only in development
        if (retryCountRef.current === 0 && event.error === 'not-allowed') {
          console.info('Voice commands require microphone permission. Enable it in your browser settings to use voice commands.')
        }
        retryCountRef.current = 0
        return
      }
      
      // Log other errors but don't spam the console
      if (retryCountRef.current === 0) {
        console.error('Speech recognition error:', event.error, event.message)
      }
      
      // Only retry on recoverable errors (network, audio-capture) and if under max retries
      const retryableErrors = ['network', 'audio-capture']
      if (isVoiceActive && retryableErrors.includes(event.error) && retryCountRef.current < maxRetries) {
        retryCountRef.current++
        setTimeout(() => {
          if (isVoiceActive && recognitionRef.current) {
            try {
              recognitionRef.current.start()
            } catch (e) {
              // Ignore errors
            }
          }
        }, 2000) // Longer delay for retries
      } else {
        retryCountRef.current = 0
      }
    }

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      // Don't process if paused (e.g., when TTS is speaking)
      if (isPausedRef.current) {
        console.log('Voice recognition result ignored - paused')
        return
      }
      
      const transcript = event.results[event.results.length - 1][0].transcript.toLowerCase().trim()
      console.log('Voice recognition received transcript:', transcript)
      
      // Store raw transcript for ingredient name matching
      setLastRawTranscript(transcript)
      
      // Normalize and process the command
      let processedCommand = transcript
      
      // Check for numbers first (for timer commands like "5 minutes" or just "5")
      const numberMatch = transcript.match(/\b(\d+)\b/)
      const hasNumber = numberMatch !== null
      const number = hasNumber ? parseInt(numberMatch![1]) : null
      
      // Map various phrasings to our commands
      if (transcript.includes('next') || transcript.includes('next step') || transcript.includes('advance')) {
        processedCommand = 'next'
      } else if (transcript.includes('back') || transcript.includes('go back') || transcript.includes('previous') || transcript.includes('previous step')) {
        processedCommand = 'back'
      } else if (transcript.includes('pause')) {
        processedCommand = 'pause'
      } else if (transcript.includes('start') && !transcript.includes('timer')) {
        processedCommand = 'start'
      } else if (transcript.includes('restart')) {
        processedCommand = 'restart'
      } else if (transcript.includes('check all')) {
        processedCommand = 'check all'
      } else if (transcript.includes('uncheck all')) {
        processedCommand = 'uncheck all'
      } else if (transcript.includes('ingredients') || transcript.includes('show ingredients') || transcript.includes('ingredient list')) {
        processedCommand = 'ingredients'
      } else if (transcript.includes('timer') || transcript.includes('set timer')) {
        // Timer command - check for duration
        if (hasNumber && number! > 0 && number! <= 120) {
          processedCommand = `timer ${number}`
        } else {
          processedCommand = 'timer'
        }
      } else if (hasNumber && number! > 0 && number! <= 120 && (transcript.includes('minute') || transcript.includes('min'))) {
        // Just a number with "minutes" or "min" (e.g., "5 minutes", "10 min", "7min")
        processedCommand = `${number} min`
      } else if (hasNumber && number! > 0 && number! <= 120 && transcript.split(/\s+/).length <= 2) {
        // Just a number (e.g., "5", "10", "7") - likely a timer command
        processedCommand = `${number} min`
      } else if (transcript.includes('steps') || transcript.includes('show steps') || transcript.includes('cooking')) {
        processedCommand = 'show steps'
      } else {
        // Could be an ingredient name - pass raw transcript
        processedCommand = transcript
      }
      
      console.log('Processed command:', processedCommand, '(from transcript:', transcript, ')')
      processVoiceCommandRef.current(processedCommand)
    }

    recognitionRef.current = recognition
    retryCountRef.current = 0

    // Request microphone permission and start recognition
    const startRecognition = async () => {
      try {
        // Request microphone permission if not already granted
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          try {
            await navigator.mediaDevices.getUserMedia({ audio: true })
            // Reset the flag if permission is granted
            permissionDeniedLoggedRef.current = false
          } catch (permError: any) {
            // Only log permission denial once to avoid console spam
            if (!permissionDeniedLoggedRef.current) {
              permissionDeniedLoggedRef.current = true
              console.info('Microphone permission is required for voice commands. Please enable microphone access in your browser settings.')
            }
            return
          }
        }
        
        recognition.start()
      } catch (e: any) {
        // Don't log AbortError or NotAllowedError as they're expected in some cases
        if (e.name !== 'AbortError' && e.name !== 'NotAllowedError') {
          console.error('Failed to start speech recognition:', e)
        }
      }
    }
    
    startRecognition()

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop()
        } catch (e) {
          // Ignore errors
        }
        recognitionRef.current = null
      }
      retryCountRef.current = 0
    }
  }, [isVoiceActive])

  const startVoiceListening = useCallback(() => {
    if (isVoiceActive && recognitionRef.current) {
      try {
        recognitionRef.current.start()
        setIsListening(true)
      } catch (e) {
        console.error('Failed to start listening:', e)
      }
    }
  }, [isVoiceActive])

  const stopVoiceListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop()
      } catch (e) {
        // Ignore errors
      }
    }
    setIsListening(false)
    isPausedRef.current = false
  }, [])

  const pauseVoiceListening = useCallback(() => {
    isPausedRef.current = true
    if (recognitionRef.current) {
      try {
        // Try abort first (more immediate), fallback to stop
        if (typeof recognitionRef.current.abort === 'function') {
          recognitionRef.current.abort()
        } else {
          recognitionRef.current.stop()
        }
      } catch (e) {
        // If abort doesn't work, try stop
        try {
          recognitionRef.current.stop()
        } catch (e2) {
          // Ignore errors
        }
      }
    }
    setIsListening(false)
  }, [])

  const resumeVoiceListening = useCallback(() => {
    if (!isVoiceActive || !recognitionRef.current) return
    
    isPausedRef.current = false
    try {
      // Only start if not already listening
      if (!isListening) {
        recognitionRef.current.start()
        setIsListening(true)
      }
    } catch (e) {
      // Ignore errors (might already be started)
    }
  }, [isVoiceActive, isListening])

  const processVoiceCommand = useCallback((command: string) => {
    if (!isVoiceActive) {
      console.log('Voice command ignored - voice not active')
      return
    }

    console.log('Processing voice command:', command)
    setIsListening(false)
    setLastCommand(command)
    
    // Clear feedback after 2 seconds
    setTimeout(() => {
      setLastCommand(null)
      setLastRawTranscript(null)
    }, 2000)
  }, [isVoiceActive])

  // Update ref when processVoiceCommand changes
  useEffect(() => {
    processVoiceCommandRef.current = processVoiceCommand
  }, [processVoiceCommand])

  const processGesture = useCallback((gesture: string) => {
    if (!isGestureActive) {
      console.log('Gesture not processed: gesture control not active')
      return
    }

    console.log(`processGesture called with: "${gesture}"`)
    setLastGesture(gesture)
    setIsGestureDetecting(false)
    
    // Clear feedback after 2 seconds
    setTimeout(() => {
      setLastGesture(null)
    }, 2000)
  }, [isGestureActive])

  const clearFeedback = useCallback(() => {
    setLastCommand(null)
    setLastRawTranscript(null)
    setLastGesture(null)
  }, [])

  // Keyboard shortcuts as fallback (when speech recognition is not available or for testing)
  // Only active in Active Cooking Screen, not in input fields
  useEffect(() => {
    // Only enable keyboard shortcuts if speech recognition is not supported
    if (isSpeechRecognitionSupported()) {
      return
    }

    const handleKeyPress = (e: KeyboardEvent) => {
      // Only work when voice is active
      if (!isVoiceActive) return

      // Don't trigger if user is typing in an input, textarea, or contenteditable
      const target = e.target as HTMLElement
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return
      }

      // Press 'N' for "next step"
      if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        processVoiceCommand('next step')
      }
      // Press 'B' for "go back"
      else if (e.key === 'b' || e.key === 'B') {
        e.preventDefault()
        processVoiceCommand('go back')
      }
      // Press 'I' for "show ingredients"
      else if (e.key === 'i' || e.key === 'I') {
        e.preventDefault()
        processVoiceCommand('show ingredients')
      }
      // Press 'T' for "timer"
      else if (e.key === 't' || e.key === 'T') {
        e.preventDefault()
        processVoiceCommand('set timer')
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isVoiceActive, processVoiceCommand])

  // Mock gesture detection (using mouse/touch events) - DISABLED
  // This is now handled by real HandPose detection via HandPoseGestureDetector
  // Keeping this disabled to prevent conflicts with actual hand gesture detection
  // useEffect(() => {
  //   if (!isGestureActive) return
  //   ... (mock gesture code disabled)
  // }, [isGestureActive, isGestureDetecting, processGesture])

  return (
    <VoiceGestureContext.Provider
      value={{
        isVoiceActive,
        isGestureActive,
        isListening,
        isGestureDetecting,
        lastCommand,
        lastRawTranscript,
        lastGesture,
        startVoiceListening,
        stopVoiceListening,
        pauseVoiceListening,
        resumeVoiceListening,
        processVoiceCommand,
        processGesture,
        clearFeedback,
      }}
    >
      {children}
    </VoiceGestureContext.Provider>
  )
}

export const useVoiceGesture = () => {
  const context = useContext(VoiceGestureContext)
  if (!context) {
    throw new Error('useVoiceGesture must be used within VoiceGestureProvider')
  }
  return context
}

