import { useTimers } from '../context/TimerContext'
import { Clock, Play, Pause, RotateCcw, X } from 'lucide-react'

interface MultiTimerPanelProps {
  isOpen: boolean
  onClose: () => void
  onAddTimer: () => void
}

const MultiTimerPanel = ({ isOpen, onClose, onAddTimer }: MultiTimerPanelProps) => {
  const { timers, toggleTimer, resetTimer, removeTimer } = useTimers()

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
      <div className="bg-white rounded-t-2xl w-full max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Timers</h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onAddTimer}
              className="px-4 py-2 bg-orange-primary text-white rounded-lg font-semibold hover:bg-orange-dark transition-colors text-sm"
            >
              + Add Timer
            </button>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {timers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-center">
              <Clock className="text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 mb-2">No timers yet</p>
              <p className="text-sm text-gray-400">Add a timer to get started</p>
            </div>
          ) : (
            <div className="space-y-3">
              {timers.map((timer) => {
                const isExpired = timer.remainingSeconds === 0
                const progress = (timer.remainingSeconds / timer.totalSeconds) * 100

                return (
                  <div
                    key={timer.id}
                    className={`border rounded-lg p-4 ${
                      isExpired ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{timer.label}</h3>
                        <div className="text-2xl font-bold text-orange-primary">
                          {formatTime(timer.remainingSeconds)}
                        </div>
                      </div>
                      <button
                        onClick={() => removeTimer(timer.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors ml-2"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isExpired ? 'bg-red-500' : 'bg-orange-primary'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>

                    {/* Controls */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => toggleTimer(timer.id)}
                        className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg font-semibold transition-colors ${
                          timer.isRunning
                            ? 'bg-gray-500 text-white hover:bg-gray-600'
                            : 'bg-orange-primary text-white hover:bg-orange-dark'
                        }`}
                      >
                        {timer.isRunning ? (
                          <>
                            <Pause size={18} />
                            Pause
                          </>
                        ) : (
                          <>
                            <Play size={18} />
                            Start
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => resetTimer(timer.id)}
                        className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-semibold hover:bg-gray-200 transition-colors"
                      >
                        <RotateCcw size={18} />
                        Reset
                      </button>
                    </div>

                    {isExpired && (
                      <div className="mt-2 text-center">
                        <p className="text-sm font-semibold text-red-600">Timer Complete!</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default MultiTimerPanel




