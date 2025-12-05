import { useEffect, useState } from 'react'
import { useVoiceGesture } from '../context/VoiceGestureContext'
import { Mic, Hand, CheckCircle, XCircle, Loader } from 'lucide-react'

const VoiceGestureFeedback = () => {
  const { isListening, isGestureDetecting, lastCommand, lastGesture, isVoiceActive, isGestureActive } = useVoiceGesture()
  const [showFeedback, setShowFeedback] = useState(false)
  const [feedbackType, setFeedbackType] = useState<'success' | 'error' | 'listening' | null>(null)
  const [feedbackMessage, setFeedbackMessage] = useState('')

  useEffect(() => {
    // Don't show "Listening..." here anymore - it's in the header
    // Only show success/error feedback for commands
    if (lastCommand) {
      setShowFeedback(true)
      setFeedbackType('success')
      setFeedbackMessage(`Voice: "${lastCommand}"`)
      setTimeout(() => setShowFeedback(false), 2000)
    } else if (lastGesture) {
      setShowFeedback(true)
      setFeedbackType('success')
      setFeedbackMessage(`Gesture: "${lastGesture}"`)
      setTimeout(() => setShowFeedback(false), 2000)
    } else {
      setShowFeedback(false)
    }
  }, [lastCommand, lastGesture])

  if (!showFeedback) return null

  return (
    <div className="fixed top-20 left-1/2 transform -translate-x-1/2 z-50">
      {/* Command Feedback - Only show success/error messages, not listening status */}
      {showFeedback && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg shadow-lg transition-all ${
            feedbackType === 'success'
              ? 'bg-green-500 text-white'
              : feedbackType === 'error'
              ? 'bg-red-500 text-white'
              : 'bg-blue-500 text-white'
          }`}
        >
          {feedbackType === 'success' ? (
            <CheckCircle size={20} />
          ) : (
            <XCircle size={20} />
          )}
          <span className="font-semibold text-sm">{feedbackMessage}</span>
        </div>
      )}
    </div>
  )
}

export default VoiceGestureFeedback

