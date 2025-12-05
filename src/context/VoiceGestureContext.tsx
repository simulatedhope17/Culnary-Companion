import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react'

interface VoiceGestureContextType {
  isVoiceActive: boolean
  isGestureActive: boolean
  isListening: boolean
  isGestureDetecting: boolean
  lastCommand: string | null
  lastGesture: string | null
  startVoiceListening: () => void
  stopVoiceListening: () => void
  processVoiceCommand: (command: string) => void
  processGesture: (gesture: string) => void
  clearFeedback: () => void
}

const VoiceGestureContext = createContext<VoiceGestureContextType | undefined>(undefined)

export const VoiceGestureProvider = ({ children }: { children: ReactNode }) => {
  const [isVoiceActive, setIsVoiceActive] = useState(false)
  const [isGestureActive, setIsGestureActive] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [isGestureDetecting, setIsGestureDetecting] = useState(false)
  const [lastCommand, setLastCommand] = useState<string | null>(null)
  const [lastGesture, setLastGesture] = useState<string | null>(null)

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

  const startVoiceListening = useCallback(() => {
    if (isVoiceActive) {
      setIsListening(true)
      // Mock: simulate listening with visual feedback
    }
  }, [isVoiceActive])

  const stopVoiceListening = useCallback(() => {
    setIsListening(false)
  }, [])

  const processVoiceCommand = useCallback((command: string) => {
    if (!isVoiceActive) return

    setIsListening(false)
    setLastCommand(command)
    
    // Clear feedback after 2 seconds
    setTimeout(() => {
      setLastCommand(null)
    }, 2000)
  }, [isVoiceActive])

  const processGesture = useCallback((gesture: string) => {
    if (!isGestureActive) return

    setLastGesture(gesture)
    setIsGestureDetecting(false)
    
    // Clear feedback after 2 seconds
    setTimeout(() => {
      setLastGesture(null)
    }, 2000)
  }, [isGestureActive])

  const clearFeedback = useCallback(() => {
    setLastCommand(null)
    setLastGesture(null)
  }, [])

  // Keyboard shortcuts for demo (mock voice commands)
  // Only active in Active Cooking Screen, not in input fields
  useEffect(() => {
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

  // Mock gesture detection (using mouse/touch events)
  useEffect(() => {
    if (!isGestureActive) return

    let touchStartX = 0
    let touchStartY = 0

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX = e.touches[0].clientX
      touchStartY = e.touches[0].clientY
      setIsGestureDetecting(true)
    }

    const handleTouchEnd = (e: TouchEvent) => {
      if (!isGestureDetecting) return

      const touchEndX = e.changedTouches[0].clientX
      const touchEndY = e.changedTouches[0].clientY
      const deltaX = touchEndX - touchStartX
      const deltaY = touchEndY - touchStartY

      // Swipe right gesture (mock) - advance to next step
      if (deltaX > 50 && Math.abs(deltaY) < 50) {
        processGesture('swipe right')
      }
      // Swipe left gesture (mock) - return to previous step
      else if (deltaX < -50 && Math.abs(deltaY) < 50) {
        processGesture('swipe left')
      }
      // Wave/open palm (mock - detected as quick tap)
      else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        processGesture('wave')
      }

      setIsGestureDetecting(false)
    }

    // Mouse events for desktop demo
    let mouseStartX = 0
    let mouseStartY = 0
    let isMouseDown = false

    const handleMouseDown = (e: MouseEvent) => {
      mouseStartX = e.clientX
      mouseStartY = e.clientY
      isMouseDown = true
      setIsGestureDetecting(true)
    }

    const handleMouseUp = (e: MouseEvent) => {
      if (!isMouseDown) return

      const deltaX = e.clientX - mouseStartX
      const deltaY = e.clientY - mouseStartY

      // Swipe right gesture (mock) - advance to next step
      if (deltaX > 50 && Math.abs(deltaY) < 50) {
        processGesture('swipe right')
      }
      // Swipe left gesture (mock) - return to previous step
      else if (deltaX < -50 && Math.abs(deltaY) < 50) {
        processGesture('swipe left')
      }
      // Wave/open palm (mock)
      else if (Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10) {
        processGesture('wave')
      }

      isMouseDown = false
      setIsGestureDetecting(false)
    }

    // Add event listeners to document for gesture detection
    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchend', handleTouchEnd)
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mouseup', handleMouseUp)

    return () => {
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchend', handleTouchEnd)
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mouseup', handleMouseUp)
    }
  }, [isGestureActive, isGestureDetecting, processGesture])

  return (
    <VoiceGestureContext.Provider
      value={{
        isVoiceActive,
        isGestureActive,
        isListening,
        isGestureDetecting,
        lastCommand,
        lastGesture,
        startVoiceListening,
        stopVoiceListening,
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

