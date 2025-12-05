import { useState, useEffect } from 'react'
import { X, Play, Pause, RotateCcw, Plus } from 'lucide-react'
import { useTimers } from '../context/TimerContext'

interface TimerModalProps {
  isOpen: boolean
  onClose: () => void
  initialMinutes?: number
  onTimerComplete?: () => void
  onAddToMultiTimer?: (label: string, minutes: number) => void
}

const TimerModal = ({ isOpen, onClose, initialMinutes = 0, onTimerComplete, onAddToMultiTimer }: TimerModalProps) => {
  const { addTimer } = useTimers()
  const [minutes, setMinutes] = useState(initialMinutes)
  const [seconds, setSeconds] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [customMinutes, setCustomMinutes] = useState('')
  const [timerLabel, setTimerLabel] = useState('')

  useEffect(() => {
    if (isOpen && initialMinutes) {
      setMinutes(initialMinutes)
      setSeconds(0)
      setIsRunning(false)
      setTimerLabel(`Step Timer - ${initialMinutes} min`)
    }
  }, [isOpen, initialMinutes])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isRunning && (minutes > 0 || seconds > 0)) {
      interval = setInterval(() => {
        setSeconds((prev) => {
          if (prev > 0) {
            return prev - 1
          } else if (minutes > 0) {
            setMinutes((prev) => prev - 1)
            return 59
          } else {
            setIsRunning(false)
            if (onTimerComplete) {
              onTimerComplete()
            }
            return 0
          }
        })
      }, 1000)
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isRunning, minutes, seconds, onTimerComplete])

  const handleStart = () => {
    if (minutes > 0 || seconds > 0) {
      setIsRunning(true)
    }
  }

  const handlePause = () => {
    setIsRunning(false)
  }

  const handleReset = () => {
    setIsRunning(false)
    setMinutes(initialMinutes || 0)
    setSeconds(0)
  }

  const handleSetCustom = () => {
    const mins = parseInt(customMinutes)
    if (!isNaN(mins) && mins >= 0) {
      setMinutes(mins)
      setSeconds(0)
      setCustomMinutes('')
    }
  }

  const formatTime = (mins: number, secs: number) => {
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">Timer</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className="text-6xl font-bold text-orange-primary mb-4">
            {formatTime(minutes, seconds)}
          </div>
          {isRunning && (
            <p className="text-sm text-green-600 font-medium">Timer Running...</p>
          )}
        </div>

        {/* Quick Set Buttons */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[5, 10, 15, 20, 30, 60].map((mins) => (
            <button
              key={mins}
              onClick={() => {
                setMinutes(mins)
                setSeconds(0)
                setIsRunning(false)
              }}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-semibold text-gray-700 transition-colors"
            >
              {mins}m
            </button>
          ))}
        </div>

        {/* Custom Timer Input */}
        <div className="flex gap-2 mb-6">
          <input
            type="number"
            placeholder="Minutes"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-primary"
            min="0"
          />
          <button
            onClick={handleSetCustom}
            className="px-4 py-2 bg-orange-primary text-white rounded-lg font-semibold hover:bg-orange-dark transition-colors"
          >
            Set
          </button>
        </div>

        {/* Timer Label Input (for multi-timer) */}
        {onAddToMultiTimer && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Timer label (optional)"
              value={timerLabel}
              onChange={(e) => setTimerLabel(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-primary"
            />
          </div>
        )}

        {/* Control Buttons */}
        <div className="space-y-3">
          <div className="flex gap-3">
            {!isRunning ? (
              <button
                onClick={handleStart}
                disabled={minutes === 0 && seconds === 0}
                className="flex-1 flex items-center justify-center gap-2 bg-orange-primary text-white py-3 rounded-lg font-semibold hover:bg-orange-dark transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                <Play size={20} />
                Start
              </button>
            ) : (
              <button
                onClick={handlePause}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-500 text-white py-3 rounded-lg font-semibold hover:bg-gray-600 transition-colors"
              >
                <Pause size={20} />
                Pause
              </button>
            )}
            <button
              onClick={handleReset}
              className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              <RotateCcw size={20} />
            </button>
          </div>

          {/* Add to Multi-Timer Button */}
          {onAddToMultiTimer && (
            <button
              onClick={() => {
                const label = timerLabel || `Timer ${minutes} min`
                onAddToMultiTimer(label, minutes)
                onClose()
              }}
              className="w-full flex items-center justify-center gap-2 bg-green-500 text-white py-3 rounded-lg font-semibold hover:bg-green-600 transition-colors"
            >
              <Plus size={20} />
              Add to Multi-Timer
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default TimerModal

