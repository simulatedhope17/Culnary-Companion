import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react'

export interface Timer {
  id: string
  label: string
  totalSeconds: number
  remainingSeconds: number
  isRunning: boolean
  createdAt: number
}

interface TimerContextType {
  timers: Timer[]
  addTimer: (label: string, minutes: number) => string
  removeTimer: (id: string) => void
  toggleTimer: (id: string) => void
  resetTimer: (id: string) => void
  updateTimer: (id: string, minutes: number) => void
  getActiveTimers: () => Timer[]
}

const TimerContext = createContext<TimerContextType | undefined>(undefined)

export const TimerProvider = ({ children }: { children: ReactNode }) => {
  const [timers, setTimers] = useState<Timer[]>([])

  // Timer countdown logic
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prevTimers) =>
        prevTimers.map((timer) => {
          if (timer.isRunning && timer.remainingSeconds > 0) {
            const newRemaining = timer.remainingSeconds - 1
            if (newRemaining === 0) {
              // Timer completed - play sound or notification
              if ('vibrate' in navigator) {
                navigator.vibrate([200, 100, 200])
              }
            }
            return { ...timer, remainingSeconds: newRemaining }
          }
          return timer
        })
      )
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const addTimer = useCallback((label: string, minutes: number): string => {
    const id = `timer-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    const newTimer: Timer = {
      id,
      label,
      totalSeconds: minutes * 60,
      remainingSeconds: minutes * 60,
      isRunning: false,
      createdAt: Date.now(),
    }
    setTimers((prev) => [...prev, newTimer])
    return id
  }, [])

  const removeTimer = useCallback((id: string) => {
    setTimers((prev) => prev.filter((timer) => timer.id !== id))
  }, [])

  const toggleTimer = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((timer) =>
        timer.id === id ? { ...timer, isRunning: !timer.isRunning } : timer
      )
    )
  }, [])

  const resetTimer = useCallback((id: string) => {
    setTimers((prev) =>
      prev.map((timer) =>
        timer.id === id
          ? { ...timer, remainingSeconds: timer.totalSeconds, isRunning: false }
          : timer
      )
    )
  }, [])

  const updateTimer = useCallback((id: string, minutes: number) => {
    setTimers((prev) =>
      prev.map((timer) =>
        timer.id === id
          ? {
              ...timer,
              totalSeconds: minutes * 60,
              remainingSeconds: minutes * 60,
            }
          : timer
      )
    )
  }, [])

  const getActiveTimers = useCallback(() => {
    return timers.filter((timer) => timer.isRunning && timer.remainingSeconds > 0)
  }, [timers])

  return (
    <TimerContext.Provider
      value={{
        timers,
        addTimer,
        removeTimer,
        toggleTimer,
        resetTimer,
        updateTimer,
        getActiveTimers,
      }}
    >
      {children}
    </TimerContext.Provider>
  )
}

export const useTimers = () => {
  const context = useContext(TimerContext)
  if (!context) {
    throw new Error('useTimers must be used within TimerProvider')
  }
  return context
}


