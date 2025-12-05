import { useCallback, useRef, useState } from 'react'

interface TTSOptions {
  rate?: number
  pitch?: number
  volume?: number
  lang?: string
}

export const useTTS = () => {
  // Initialize speech synthesis ref - safe to do directly since refs don't cause re-renders
  const synthRef = useRef<SpeechSynthesis | null>(
    typeof window !== 'undefined' && 'speechSynthesis' in window
      ? window.speechSynthesis
      : null
  )
  const [isSpeaking, setIsSpeaking] = useState(false)

  const speak = useCallback((text: string, options: TTSOptions = {}) => {
    if (!synthRef.current) {
      console.warn('Speech synthesis not supported')
      return
    }

    console.log('TTS speak called with text:', text)

    // Cancel any ongoing speech
    synthRef.current.cancel()
    
    // Small delay to ensure previous speech is fully cancelled and browser is ready
    setTimeout(() => {
      if (!synthRef.current) return
      
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = options.rate ?? 1.0
      utterance.pitch = options.pitch ?? 1.0
      utterance.volume = options.volume ?? 1.0
      utterance.lang = options.lang ?? 'en-US'

      utterance.onstart = () => {
        console.log('TTS started speaking')
        setIsSpeaking(true)
      }

      utterance.onend = () => {
        console.log('TTS finished speaking')
        setIsSpeaking(false)
      }

      utterance.onerror = (error: SpeechSynthesisErrorEvent) => {
        console.error('TTS error:', error.error, error.message || '')
        setIsSpeaking(false)
        // If error is 'not-allowed', it might be a timing issue or browser restriction
        if (error.error === 'not-allowed') {
          console.warn('TTS not-allowed error - browser may require user interaction or have restrictions')
        } else if (error.error === 'interrupted') {
          // Interrupted is normal when cancelling, don't log as error
          console.log('TTS interrupted (normal when cancelling)')
        }
      }

      try {
        synthRef.current.speak(utterance)
        console.log('TTS speak() called successfully')
      } catch (error) {
        console.error('Error calling TTS speak():', error)
        setIsSpeaking(false)
      }
    }, 150) // Small delay to ensure previous speech is cancelled and browser is ready
  }, [])

  const stop = useCallback(() => {
    if (synthRef.current) {
      synthRef.current.cancel()
      setIsSpeaking(false)
    }
  }, [])

  return { speak, stop, isSpeaking }
}
