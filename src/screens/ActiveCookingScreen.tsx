import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MobileHeader from '../components/MobileHeader'
import VoiceGestureFeedback from '../components/VoiceGestureFeedback'
import HandPoseGestureDetector from '../components/HandPoseGestureDetector'
import GestureDebugOverlay from '../components/GestureDebugOverlay'
import CompletionModal from '../components/CompletionModal'
import { getRecipeById } from '../data/mockData'
import { useRecipeContext } from '../context/RecipeContext'
import { useVoiceGesture } from '../context/VoiceGestureContext'
import { useTimers } from '../context/TimerContext'
import { useTTS } from '../hooks/useTTS'
import { ChevronLeft, ChevronRight, Clock, UtensilsCrossed, ChefHat, Play, Pause, RotateCcw, CheckCircle2, Volume2, VolumeX, Mic, MicOff, Hand } from 'lucide-react'

const ActiveCookingScreen = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = id ? getRecipeById(id) : null
  const { getCurrentStep, setInProgress, clearInProgress } = useRecipeContext()
  const { lastCommand, lastRawTranscript, lastGesture, isVoiceActive, isGestureActive, isListening, isGestureDetecting, pauseVoiceListening, resumeVoiceListening } = useVoiceGesture()
  const { addTimer, timers, removeTimer, toggleTimer, resetTimer } = useTimers()
  const { speak, stop, isSpeaking } = useTTS()
  const [activeTab, setActiveTab] = useState<'steps' | 'ingredients' | 'timer'>('steps')
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showCompletion, setShowCompletion] = useState(false)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())
  const [showDebugOverlay, setShowDebugOverlay] = useState(false)
  // Debug button visibility (hidden by default, controlled by settings)
  const [showDebugButton, setShowDebugButton] = useState(() => {
    return localStorage.getItem('debug-button-enabled') === 'true'
  })
  
  // Listen for settings changes
  useEffect(() => {
    const updateSetting = () => {
      const enabled = localStorage.getItem('debug-button-enabled') === 'true'
      setShowDebugButton(enabled)
    }
    
    updateSetting()
    window.addEventListener('storage', updateSetting)
    const interval = setInterval(updateSetting, 500)
    
    return () => {
      window.removeEventListener('storage', updateSetting)
      clearInterval(interval)
    }
  }, [])
  const hasReadInitialStep = useRef(false)
  const lastReadStepIndex = useRef<number | null>(null)
  const processedCommandsRef = useRef<Set<string>>(new Set())
  const skipStepReadingRef = useRef(false) // Skip useEffect step reading when set by voice command
  
  // TTS enabled state (defaults to true, stored in localStorage)
  const [isTTSEnabled, setIsTTSEnabled] = useState(() => {
    const stored = localStorage.getItem('tts-enabled')
    // Default to true if not set or if explicitly set to true
    if (stored === null || stored === 'true') {
      return true
    }
    return stored === 'true'
  })

  // Save TTS enabled state to localStorage
  useEffect(() => {
    localStorage.setItem('tts-enabled', isTTSEnabled.toString())
  }, [isTTSEnabled])

  // Toggle TTS on/off
  const toggleTTS = () => {
    setIsTTSEnabled(prev => {
      const newValue = !prev
      if (!newValue) {
        // Stop any ongoing speech when disabling
        stop()
      }
      return newValue
    })
  }

  // Toggle voice commands on/off
  const toggleVoiceCommands = () => {
    const newValue = !isVoiceActive
    localStorage.setItem('voice-commands-enabled', newValue.toString())
    // The VoiceGestureContext will pick up the change via its useEffect
  }

  // Toggle gesture control on/off
  const toggleGestureControl = () => {
    const newValue = !isGestureActive
    localStorage.setItem('gesture-controls-enabled', newValue.toString())
    // The VoiceGestureContext will pick up the change via its useEffect
  }

  // Initialize from saved progress
  useEffect(() => {
    if (recipe && id) {
      const savedStep = getCurrentStep(id)
      if (savedStep !== undefined) {
        setCurrentStepIndex(savedStep)
        // Don't set lastReadStepIndex here - let the step reading useEffect handle it
      }
    }
  }, [recipe, id, getCurrentStep])

  // Pause voice recognition when TTS is speaking
  useEffect(() => {
    if (!isVoiceActive) return
    
    if (isSpeaking) {
      // Immediately pause when TTS starts
      pauseVoiceListening()
    } else {
      // Resume after a longer delay to ensure TTS has fully stopped and audio has cleared
      const resumeTimeout = setTimeout(() => {
        if (isVoiceActive && !isSpeaking) {
          resumeVoiceListening()
        }
      }, 1500) // Longer delay to prevent picking up TTS audio
      return () => clearTimeout(resumeTimeout)
    }
  }, [isSpeaking, isVoiceActive, pauseVoiceListening, resumeVoiceListening])

  // Read out current step when component mounts, tab changes to steps, or step changes
  useEffect(() => {
    if (!recipe) {
      console.log('Step reading: No recipe')
      return
    }

    // Only read when on steps tab
    if (activeTab !== 'steps') {
      console.log('Step reading: Not on steps tab, activeTab:', activeTab)
      // Reset flag when leaving steps tab so it reads when coming back
      if (hasReadInitialStep.current) {
        hasReadInitialStep.current = false
        lastReadStepIndex.current = null
      }
      return
    }

    const currentStep = recipe.steps[currentStepIndex]
    if (!currentStep) {
      console.log('Step reading: No current step at index:', currentStepIndex)
      return
    }

    // Only read if TTS is enabled (TTS works independently of voice commands)
    if (!isTTSEnabled) {
      console.log('Step reading: TTS disabled')
      // Reset flag if TTS is disabled
      if (hasReadInitialStep.current) {
        hasReadInitialStep.current = false
        lastReadStepIndex.current = null
      }
      return
    }

    let timeoutId: NodeJS.Timeout | null = null

    // Skip reading if it was triggered by a voice command (which handles reading itself)
    if (skipStepReadingRef.current) {
      console.log('Step reading: Skipped because triggered by voice command')
      skipStepReadingRef.current = false // Reset for next time
      return
    }

    // Check if step has changed - compare with the last step that was actually read
    const stepChanged = lastReadStepIndex.current === null || lastReadStepIndex.current !== currentStepIndex
    console.log('Step reading check - lastReadStepIndex:', lastReadStepIndex.current, 'currentStepIndex:', currentStepIndex, 'stepChanged:', stepChanged, 'hasReadInitialStep:', hasReadInitialStep.current)

    // Read step on initial mount or when step changes
    // Always try to read - browser may allow it, and if not, error will be handled gracefully
    if (!hasReadInitialStep.current) {
      // Initial step - read immediately
      console.log('Reading initial step automatically')
      hasReadInitialStep.current = true
      // Small delay to ensure page is loaded, then speak
      timeoutId = setTimeout(() => {
        // Pause voice listening if active (to avoid conflicts)
        if (isVoiceActive) {
          pauseVoiceListening()
        }
        if (isTTSEnabled) {
          const stepText = `Step ${currentStep.stepNumber}. ${currentStep.instruction}`
          console.log('Reading initial step:', stepText)
          speak(stepText, { rate: 0.85 })
        }
        // Update lastReadStepIndex AFTER we've started reading
        setTimeout(() => {
          lastReadStepIndex.current = currentStepIndex
        }, 200)
      }, 500) // Reduced delay for faster initial reading
    } else if (stepChanged) {
      // Step changed - read the new step (triggered by navigation via click, gesture, or voice)
      console.log('Step changed from', lastReadStepIndex.current, 'to', currentStepIndex, '- reading new step')
      // Stop any ongoing speech immediately
      stop()
      // Pause voice listening if active (to avoid conflicts)
      if (isVoiceActive) {
        pauseVoiceListening()
      }
      // Small delay to ensure previous TTS is stopped
      timeoutId = setTimeout(() => {
        if (isTTSEnabled) {
          const stepText = `Step ${currentStep.stepNumber}. ${currentStep.instruction}`
          console.log('Reading step:', stepText)
          speak(stepText, { rate: 0.85 })
        }
        // Update lastReadStepIndex AFTER we've started reading
        setTimeout(() => {
          lastReadStepIndex.current = currentStepIndex
        }, 200)
      }, 300) // Reduced delay for faster step reading
    } else {
      console.log('Step reading: No change detected or already read - lastReadStepIndex:', lastReadStepIndex.current, 'currentStepIndex:', currentStepIndex)
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
    }
  }, [recipe, currentStepIndex, isVoiceActive, isTTSEnabled, activeTab, speak, stop, pauseVoiceListening])

  // Cleanup TTS on unmount
  useEffect(() => {
    return () => {
      stop()
    }
  }, [stop])

  if (!recipe) {
    return (
      <div className="min-h-screen bg-white">
        <MobileHeader title="Recipe Not Found" showBack />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Recipe not found</p>
        </div>
      </div>
    )
  }

  const currentStep = recipe.steps[currentStepIndex]
  const canGoBack = currentStepIndex > 0
  const canGoForward = currentStepIndex < recipe.steps.length - 1

  const handleNext = () => {
    if (canGoForward && id) {
      // Mark that user has interacted (button click, gesture, or voice command)
      const newIndex = currentStepIndex + 1
      console.log('handleNext: changing from', currentStepIndex, 'to', newIndex, 'lastReadStepIndex:', lastReadStepIndex.current)
      setCurrentStepIndex(newIndex)
      setInProgress(id, newIndex)
      // Ensure we're on steps tab for step reading
      if (activeTab !== 'steps') {
        setActiveTab('steps')
      }
      // Reset lastReadStepIndex to trigger step reading in useEffect
      lastReadStepIndex.current = currentStepIndex
      // Step will be read automatically by useEffect when currentStepIndex changes
    }
  }

  const handleDone = () => {
    if (id) {
      clearInProgress(id)
      setShowCompletion(true)
    }
  }

  const handleCompletionGoHome = () => {
    if (id) {
      clearInProgress(id)
      setShowCompletion(false)
      navigate('/')
    }
  }

  const handlePrevious = () => {
    if (canGoBack && id) {
      // Mark that user has interacted (button click, gesture, or voice command)
      const newIndex = currentStepIndex - 1
      console.log('handlePrevious: changing from', currentStepIndex, 'to', newIndex, 'lastReadStepIndex:', lastReadStepIndex.current)
      setCurrentStepIndex(newIndex)
      setInProgress(id, newIndex)
      // Ensure we're on steps tab for step reading
      if (activeTab !== 'steps') {
        setActiveTab('steps')
      }
      // Reset lastReadStepIndex to trigger step reading in useEffect
      lastReadStepIndex.current = currentStepIndex
      // Step will be read automatically by useEffect when currentStepIndex changes
    }
  }

  const handleTimerClick = () => {
    setActiveTab('timer')
    // Auto-create 5 minute timer if none exists
    if (timers.length === 0) {
      addTimer('5 minutes', 5)
    }
  }


  const handleIngredientsClick = () => {
    setActiveTab('ingredients')
  }


  // Helper function to find ingredient by name
  const findIngredientIndex = (ingredientName: string): number | null => {
    if (!recipe) return null
    
    const normalizedName = ingredientName.toLowerCase().trim()
    
    for (let i = 0; i < recipe.ingredients.length; i++) {
      const ingredient = recipe.ingredients[i]
      const normalizedIngredientName = ingredient.name.toLowerCase().trim()
      
      // Exact match
      if (normalizedIngredientName === normalizedName) {
        return i
      }
      
      // Partial match (ingredient name contains the spoken name or vice versa)
      if (normalizedIngredientName.includes(normalizedName) || normalizedName.includes(normalizedIngredientName)) {
        return i
      }
    }
    
    return null
  }

  // Handle voice commands
  useEffect(() => {
    if (!lastCommand || !isVoiceActive) {
      if (lastCommand) {
        console.log('Voice command ignored - lastCommand:', lastCommand, 'isVoiceActive:', isVoiceActive)
      }
      return
    }

    const command = lastCommand.toLowerCase().trim()
    console.log('Handling voice command:', command)
    
    // Prevent duplicate command processing
    if (processedCommandsRef.current.has(command)) {
      console.log('Command already processed, ignoring:', command)
      return
    }
    processedCommandsRef.current.add(command)
    console.log('Command added to processed set:', command)
    
    // Clear old processed commands after 2 seconds
    setTimeout(() => {
      processedCommandsRef.current.delete(command)
    }, 2000)
    
    if (command === 'next') {
      console.log('Executing NEXT command')
      // Pause voice before navigating to prevent picking up TTS
      pauseVoiceListening()
      handleNext()
      // Step will be read automatically by useEffect when currentStepIndex changes
    } else if (command === 'back') {
      console.log('Executing BACK command')
      // Pause voice before navigating to prevent picking up TTS
      pauseVoiceListening()
      handlePrevious()
      // Step will be read automatically by useEffect when currentStepIndex changes
    } else if (command === 'ingredients') {
      console.log('Executing INGREDIENTS command')
      pauseVoiceListening() // Pause BEFORE speaking
      setActiveTab('ingredients')
      stop()
      // Call TTS immediately (within user interaction context)
      if (isTTSEnabled) {
        speak('Showing ingredients', { rate: 1.0 })
      }
    } else if (command === 'show steps' || command === 'steps') {
      console.log('Executing STEPS command')
      pauseVoiceListening() // Pause BEFORE speaking
      // Mark to skip useEffect step reading (we'll handle it here in user interaction context)
      skipStepReadingRef.current = true
      // Mark as read BEFORE state update so useEffect doesn't try to read it
      if (recipe && recipe.steps.length > 0) {
        hasReadInitialStep.current = true
        lastReadStepIndex.current = currentStepIndex
      }
      setActiveTab('steps')
      stop()
      // Call TTS immediately (within user interaction context)
      if (isTTSEnabled) {
        speak('Showing steps', { rate: 1.0 })
        // Also read the current step immediately (user interaction context)
        if (recipe && recipe.steps.length > 0) {
          const currentStep = recipe.steps[currentStepIndex]
          const stepText = `Step ${currentStep.stepNumber}. ${currentStep.instruction}`
          // Read step after a brief delay to let "Showing steps" finish
          setTimeout(() => {
            pauseVoiceListening()
            speak(stepText, { rate: 0.85 })
          }, 1000) // Wait for "Showing steps" to finish
        }
      }
    } else if (command === 'timer') {
      console.log('Executing TIMER command')
      pauseVoiceListening() // Pause BEFORE speaking
      setActiveTab('timer')
      stop()
      // Call TTS immediately (within user interaction context) - no setTimeout
      if (isTTSEnabled) {
        speak('Timer page', { rate: 1.0 })
      }
      // Auto-create 5 minute timer if none exists
      if (timers.length === 0) {
        addTimer('5 minutes', 5)
      }
    } else if (command.startsWith('timer ')) {
      // Timer with duration (e.g., "timer 5" or "timer 10" or "7min")
      const timerMatch = command.match(/timer (\d+)/)
      if (timerMatch) {
        const minutes = parseInt(timerMatch[1])
        console.log('Executing TIMER command with duration:', minutes, 'minutes')
        if (minutes > 0 && minutes <= 120) {
          pauseVoiceListening() // Pause BEFORE speaking
          setActiveTab('timer')
          // Remove existing timers
          timers.forEach(t => removeTimer(t.id))
          // Add new timer and start it automatically
          const label = `${minutes} minute${minutes > 1 ? 's' : ''}`
          const timerId = addTimer(label, minutes)
          // Start the timer automatically after a brief delay
          setTimeout(() => {
            toggleTimer(timerId)
          }, 100)
          stop()
          // Call TTS immediately (within user interaction context)
          if (isTTSEnabled) {
            speak(`Timer started for ${minutes} minutes`, { rate: 1.0 })
          }
        }
      }
    } else if (/^\d+$/.test(command) || /^\d+\s*(min|minute|minutes)$/i.test(command)) {
      // Just a number (e.g., "7", "7min", "7 minutes") - create and start timer
      const numberMatch = command.match(/(\d+)/)
      if (numberMatch) {
        const minutes = parseInt(numberMatch[1])
        console.log('Executing NUMBER command as timer:', minutes, 'minutes')
        if (minutes > 0 && minutes <= 120) {
          pauseVoiceListening() // Pause BEFORE speaking
          setActiveTab('timer')
          // Remove existing timers
          timers.forEach(t => removeTimer(t.id))
          // Add new timer and start it automatically
          const label = `${minutes} minute${minutes > 1 ? 's' : ''}`
          const timerId = addTimer(label, minutes)
          // Start the timer automatically after a brief delay
          setTimeout(() => {
            toggleTimer(timerId)
          }, 100)
          stop()
          // Call TTS immediately (within user interaction context)
          if (isTTSEnabled) {
            speak(`Timer started for ${minutes} minutes`, { rate: 1.0 })
          }
        }
      }
    } else if (command === 'pause') {
      console.log('Executing PAUSE command')
      pauseVoiceListening() // Pause BEFORE speaking
      if (timers.length > 0 && timers[0].isRunning) {
        toggleTimer(timers[0].id)
        stop()
        // Call TTS immediately (within user interaction context)
        if (isTTSEnabled) {
          speak('Timer paused', { rate: 1.0 })
        }
      } else {
        stop()
        // Call TTS immediately (within user interaction context)
        if (isTTSEnabled) {
          speak('No timer running', { rate: 1.0 })
        }
      }
    } else if (command === 'start') {
      console.log('Executing START command')
      pauseVoiceListening() // Pause BEFORE speaking
      if (timers.length > 0 && !timers[0].isRunning) {
        toggleTimer(timers[0].id)
        stop()
        // Call TTS immediately (within user interaction context)
        if (isTTSEnabled) {
          speak('Timer started', { rate: 1.0 })
        }
      } else if (timers.length > 0 && timers[0].isRunning) {
        stop()
        // Call TTS immediately (within user interaction context)
        if (isTTSEnabled) {
          speak('Timer already running', { rate: 1.0 })
        }
      } else {
        // Create default timer if none exists
        const timerId = addTimer('5 minutes', 5)
        // Start the timer after a brief delay to ensure it's added
        setTimeout(() => {
          toggleTimer(timerId)
        }, 100)
        stop()
        // Call TTS immediately (within user interaction context)
        if (isTTSEnabled) {
          speak('Timer started for 5 minutes', { rate: 1.0 })
        }
      }
    } else if (command === 'restart' && activeTab === 'timer') {
      // Restart command is handled in separate useEffect for timer tab
      // This prevents duplicate handling
      console.log('RESTART command will be handled in timer tab useEffect')
      return
    } else if (command === 'check all') {
      console.log('Executing CHECK ALL command')
      pauseVoiceListening() // Pause BEFORE speaking
      if (recipe) {
        setCheckedIngredients(new Set(recipe.ingredients.map((_, i) => i)))
        stop()
        // Call TTS immediately (within user interaction context)
        if (isTTSEnabled) {
          speak('All ingredients checked', { rate: 1.0 })
        }
      }
    } else if (command === 'uncheck all') {
      console.log('Executing UNCHECK ALL command')
      pauseVoiceListening() // Pause BEFORE speaking
      setCheckedIngredients(new Set())
      stop()
      // Call TTS immediately (within user interaction context)
      if (isTTSEnabled) {
        speak('All ingredients unchecked', { rate: 1.0 })
      }
    } else if (activeTab === 'ingredients' && lastRawTranscript) {
      // Try to match ingredient name
      console.log('Trying to match ingredient:', lastRawTranscript)
      const ingredientIndex = findIngredientIndex(lastRawTranscript)
      if (ingredientIndex !== null && recipe) {
        console.log('Found ingredient at index:', ingredientIndex)
        pauseVoiceListening() // Pause BEFORE speaking
        const ingredient = recipe.ingredients[ingredientIndex]
        const isChecked = checkedIngredients.has(ingredientIndex)
        const newChecked = new Set(checkedIngredients)
        
        if (isChecked) {
          newChecked.delete(ingredientIndex)
          setCheckedIngredients(newChecked)
          stop()
          // Call TTS immediately (within user interaction context)
          if (isTTSEnabled) {
            speak(`${ingredient.name} unchecked`, { rate: 1.0 })
          }
        } else {
          newChecked.add(ingredientIndex)
          setCheckedIngredients(newChecked)
          stop()
          // Call TTS immediately (within user interaction context)
          if (isTTSEnabled) {
            speak(`${ingredient.name} checked`, { rate: 1.0 })
          }
        }
      } else {
        console.log('Ingredient not found:', lastRawTranscript)
        pauseVoiceListening() // Pause BEFORE speaking
        stop()
        // Call TTS immediately (within user interaction context)
        if (isTTSEnabled) {
          speak('Ingredient not found', { rate: 1.0 })
        }
      }
    } else {
      console.log('Command not recognized or not applicable:', command, 'activeTab:', activeTab)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCommand, lastRawTranscript, isVoiceActive, isTTSEnabled, activeTab, timers, checkedIngredients, recipe])

  // Handle gesture commands with TTS and toast feedback
  useEffect(() => {
    if (!lastGesture || !isGestureActive) return

    const gesture = lastGesture.toLowerCase().trim()
    console.log('Handling gesture command:', gesture)

    // Prevent duplicate gesture processing
    if (processedCommandsRef.current.has(`gesture-${gesture}`)) {
      console.log('Gesture already processed, ignoring:', gesture)
      return
    }
    processedCommandsRef.current.add(`gesture-${gesture}`)

    // Clear old processed gestures after 2 seconds
    setTimeout(() => {
      processedCommandsRef.current.delete(`gesture-${gesture}`)
    }, 2000)

    // Pause voice before processing gesture (if voice is active)
    if (isVoiceActive) {
      pauseVoiceListening()
    }

    // Handle timer-specific gestures when on timer tab
    if (activeTab === 'timer') {
      switch (gesture) {
        case '1 finger':
          console.log('Executing 1 FINGER gesture - 5 min timer and start')
          timers.forEach(t => removeTimer(t.id))
          const timerId1 = addTimer('5 minutes', 5)
          // Start the timer immediately
          if (timerId1) {
            toggleTimer(timerId1)
          }
          stop()
          if (isTTSEnabled) {
            speak('5 minute timer started', { rate: 1.0 })
          }
          return
        case '2 fingers':
          console.log('Executing 2 FINGERS gesture - 10 min timer and start')
          timers.forEach(t => removeTimer(t.id))
          const timerId2 = addTimer('10 minutes', 10)
          // Start the timer immediately
          if (timerId2) {
            toggleTimer(timerId2)
          }
          stop()
          if (isTTSEnabled) {
            speak('10 minute timer started', { rate: 1.0 })
          }
          return
        case '3 fingers':
          console.log('Executing 3 FINGERS gesture - 15 min timer and start')
          timers.forEach(t => removeTimer(t.id))
          const timerId3 = addTimer('15 minutes', 15)
          // Start the timer immediately
          if (timerId3) {
            toggleTimer(timerId3)
          }
          stop()
          if (isTTSEnabled) {
            speak('15 minute timer started', { rate: 1.0 })
          }
          return
        case '4 fingers':
          console.log('Executing 4 FINGERS gesture - 30 min timer and start')
          timers.forEach(t => removeTimer(t.id))
          const timerId4 = addTimer('30 minutes', 30)
          // Start the timer immediately
          if (timerId4) {
            toggleTimer(timerId4)
          }
          stop()
          if (isTTSEnabled) {
            speak('30 minute timer started', { rate: 1.0 })
          }
          return
        case 'fist':
          console.log('Executing FIST gesture - toggle timer (pause/start)')
          if (timers.length > 0) {
            const timer = timers[0]
            toggleTimer(timer.id)
            stop()
            if (isTTSEnabled) {
              if (timer.isRunning) {
                speak('Timer paused', { rate: 1.0 })
              } else {
                speak('Timer started', { rate: 1.0 })
              }
            }
          } else {
            stop()
            if (isTTSEnabled) {
              speak('No timer to control', { rate: 1.0 })
            }
          }
          return
      }
    }

    // Handle general navigation gestures (on cooking/steps page)
    switch (gesture) {
      case 'next':
      case 'thumbs up':
        // Thumbs up advances to next step
        if (canGoForward) {
          console.log('Executing NEXT gesture (thumbs up)')
          handleNext()
          // Don't speak "Next step" - the step reading useEffect will read the actual step
          // Just stop any current speech
          stop()
        } else {
          stop()
          if (isTTSEnabled) {
            speak('No more steps', { rate: 1.0 })
          }
        }
        break
      case 'back':
      case 'thumbs down':
        // Thumbs down returns to previous step
        if (canGoBack) {
          console.log('Executing BACK gesture (thumbs down)')
          handlePrevious()
          // Don't speak "Previous step" - the step reading useEffect will read the actual step
          // Just stop any current speech
          stop()
        } else {
          stop()
          if (isTTSEnabled) {
            speak('Already at first step', { rate: 1.0 })
          }
        }
        break
      case 'show steps':
      case 'open palm':
        // Open palm goes to steps/cooking page
        console.log('Executing SHOW STEPS gesture (open palm)')
        skipStepReadingRef.current = true
        if (recipe && recipe.steps.length > 0) {
          hasReadInitialStep.current = true
          lastReadStepIndex.current = currentStepIndex
        }
        setActiveTab('steps')
        stop()
        if (isTTSEnabled) {
          speak('Showing steps', { rate: 1.0 })
          if (recipe && recipe.steps.length > 0) {
            const currentStep = recipe.steps[currentStepIndex]
            const stepText = `Step ${currentStep.stepNumber}. ${currentStep.instruction}`
            setTimeout(() => {
              if (isVoiceActive) {
                pauseVoiceListening()
              }
              speak(stepText, { rate: 0.85 })
            }, 1000)
          }
        }
        break
      case 'ingredients':
      case 'rock':
        // Rock sign shows ingredients
        console.log('Executing INGREDIENTS gesture (rock)')
        setActiveTab('ingredients')
        stop()
        if (isTTSEnabled) {
          speak('Showing ingredients', { rate: 1.0 })
        }
        break
      case 'timer':
      case 'pointing up':
        // Pointing up shows timer
        console.log('Executing TIMER gesture (pointing up)')
        setActiveTab('timer')
        stop()
        if (isTTSEnabled) {
          speak('Timer page', { rate: 1.0 })
        }
        if (timers.length === 0) {
          addTimer('5 minutes', 5)
        }
        break
      default:
        console.log('Gesture not recognized:', gesture)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastGesture, isGestureActive, isTTSEnabled, isVoiceActive, pauseVoiceListening, stop, speak])

  // Handle restart command when on timer tab
  useEffect(() => {
    if (!lastCommand || !isVoiceActive || activeTab !== 'timer') return

    const command = lastCommand.toLowerCase().trim()
    
    if (command === 'restart') {
      // Prevent duplicate processing
      if (processedCommandsRef.current.has('restart-timer')) {
        return
      }
      processedCommandsRef.current.add('restart-timer')
      
      setTimeout(() => {
        processedCommandsRef.current.delete('restart-timer')
      }, 2000)

      pauseVoiceListening() // Pause BEFORE speaking
      if (timers.length > 0) {
        resetTimer(timers[0].id)
        stop()
        // Call TTS immediately (within user interaction context)
        if (isTTSEnabled) {
          speak('Timer restarted', { rate: 1.0 })
        }
      } else {
        stop()
        // Call TTS immediately (within user interaction context)
        if (isTTSEnabled) {
          speak('No timer to restart', { rate: 1.0 })
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCommand, isVoiceActive, isTTSEnabled, activeTab, timers, pauseVoiceListening, stop, speak, resetTimer])

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <MobileHeader 
        title="Cooking Mode" 
        showBack 
        onBack={() => navigate(`/recipe/${id}`)}
        isListening={isListening}
        isGestureDetecting={isGestureDetecting}
        isVoiceActive={isVoiceActive}
        isGestureActive={isGestureActive}
      />
      
      {/* HandPose Gesture Detector - pause when debug overlay is open */}
      <HandPoseGestureDetector enabled={isGestureActive && !showDebugOverlay} />
      
      {/* Voice/Gesture Command Feedback (floating notifications) */}
      <VoiceGestureFeedback />

      <main className="flex-1 overflow-hidden pb-32">
        {activeTab === 'steps' ? (
          <div className="px-6 py-4 w-full max-w-4xl h-full flex flex-col items-center justify-start mx-auto relative">

            {/* Step Number - Subtle */}
            <div className="text-center mb-4 mt-16 flex-shrink-0">
              <span className="text-base font-medium text-gray-400 uppercase tracking-wider">STEP {currentStep.stepNumber}/{recipe.steps.length}</span>
            </div>

            {/* Step Instruction - Dynamic size based on length, as large as possible */}
            <div className="flex-1 flex items-center justify-center mb-4 min-h-0 w-full px-4">
              <p 
                className="font-bold text-gray-900 text-center leading-tight w-full"
                style={{
                  fontSize: currentStep.instruction.length > 120 
                    ? 'clamp(2rem, 5vw, 3rem)' 
                    : currentStep.instruction.length > 80
                    ? 'clamp(2.5rem, 6vw, 3.5rem)'
                    : currentStep.instruction.length > 50
                    ? 'clamp(3rem, 7vw, 4rem)'
                    : 'clamp(3.5rem, 8vw, 5rem)'
                }}
              >
                {currentStep.instruction}
              </p>
            </div>

            {/* On-screen prompts for voice/gesture commands (as per project report Section 3.0) */}
            {(isVoiceActive || isGestureActive) && (
              <div className="text-center mb-4 flex-shrink-0">
                <p className="text-sm text-gray-500 italic">
                  {isVoiceActive && isGestureActive && (
                    <>Say &quot;Next&quot; or &quot;Back&quot; • Thumbs up/down to navigate • Point up for timer • Rock for ingredients</>
                  )}
                  {isVoiceActive && !isGestureActive && (
                    <>Say &quot;Next&quot; or &quot;Back&quot; to navigate • &quot;Timer&quot; for timer • &quot;Ingredients&quot; for ingredients</>
                  )}
                  {!isVoiceActive && isGestureActive && (
                    <>Thumbs up: next • Thumbs down: back • Point up: timer • Rock: ingredients</>
                  )}
                </p>
              </div>
            )}

            {/* Control Buttons - TTS, Voice, Gesture - Positioned horizontally above navigation */}
            <div className="flex-shrink-0 flex items-center justify-center gap-4 mb-6">
              {/* TTS Indicator Button */}
              <button
                onClick={() => {
                  if (isSpeaking) {
                    stop()
                  } else {
                    // Toggle TTS on/off
                    toggleTTS()
                  }
                }}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md relative ${
                  isSpeaking
                    ? 'bg-orange-primary text-white animate-pulse'
                    : isTTSEnabled
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500'
                }`}
                title={
                  isSpeaking 
                    ? 'TTS Speaking (click to stop)' 
                    : isTTSEnabled 
                    ? 'TTS On (click to toggle off)' 
                    : 'TTS Off (click to toggle on)'
                }
              >
                {isTTSEnabled ? <Volume2 size={22} /> : <VolumeX size={22} />}
                {isSpeaking && (
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-600 rounded-full animate-ping"></span>
                )}
              </button>

              {/* Voice Control Indicator Button */}
              <button
                onClick={toggleVoiceCommands}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md relative ${
                  isListening
                    ? 'bg-green-500 text-white animate-pulse'
                    : isVoiceActive
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-500'
                }`}
                title={
                  isListening
                    ? 'Voice Listening... (click to toggle off)'
                    : isVoiceActive
                    ? 'Voice Control On (click to toggle off)'
                    : 'Voice Control Off (click to toggle on)'
                }
              >
                {isVoiceActive ? <Mic size={22} /> : <MicOff size={22} />}
                {isListening && (
                  <>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-600 rounded-full animate-ping"></span>
                    <span className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping" style={{ animationDelay: '0.5s' }}></span>
                  </>
                )}
              </button>

              {/* Gesture Control Indicator Button */}
              <button
                onClick={toggleGestureControl}
                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md relative ${
                  isGestureDetecting
                    ? 'bg-blue-500 text-white animate-pulse'
                    : isGestureActive
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-500'
                }`}
                title={
                  isGestureDetecting
                    ? 'Gesture Detecting... (click to toggle off)'
                    : isGestureActive
                    ? 'Gesture Control On (click to toggle off)'
                    : 'Gesture Control Off (click to toggle on)'
                }
              >
                <Hand size={22} />
                {isGestureDetecting && (
                  <>
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full animate-ping"></span>
                    <span className="absolute inset-0 rounded-full border-2 border-blue-400 animate-ping" style={{ animationDelay: '0.5s' }}></span>
                  </>
                )}
              </button>

              {/* Debug Overlay Toggle Button - Only show when gesture is active AND debug button is enabled in settings */}
              {isGestureActive && showDebugButton && (
                <button
                  onClick={() => setShowDebugOverlay(!showDebugOverlay)}
                  className={`w-14 h-14 rounded-full flex items-center justify-center transition-all shadow-md relative ${
                    showDebugOverlay
                      ? 'bg-purple-500 text-white'
                      : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                  }`}
                  title={showDebugOverlay ? 'Close Debug Overlay' : 'Open Gesture Debug Overlay'}
                >
                  <span className="text-xs font-bold">DEBUG</span>
                </button>
              )}
            </div>

            {/* Navigation Buttons - Show Done on last step, otherwise show Next/Previous */}
            <div className="flex-shrink-0 flex items-center justify-center gap-12">
              {canGoForward ? (
                <>
                  <button
                    onClick={handlePrevious}
                    disabled={!canGoBack}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-md ${
                      canGoBack
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft size={28} />
                  </button>

                  <button
                    onClick={handleNext}
                    className="w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-md bg-gray-200 text-gray-700 hover:bg-gray-300"
                  >
                    <ChevronRight size={28} />
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handlePrevious}
                    disabled={!canGoBack}
                    className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors shadow-md ${
                      canGoBack
                        ? 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <ChevronLeft size={28} />
                  </button>

                  <button
                    onClick={handleDone}
                    className="px-10 py-3 bg-orange-primary text-white font-bold text-lg rounded-lg hover:bg-orange-dark transition-colors shadow-md"
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        ) : activeTab === 'ingredients' ? (
          <div className="px-6 py-6 h-full overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-semibold text-gray-900">All Ingredients</h2>
              <button
                onClick={() => {
                  if (checkedIngredients.size === recipe.ingredients.length) {
                    setCheckedIngredients(new Set())
                  } else {
                    setCheckedIngredients(new Set(recipe.ingredients.map((_, i) => i)))
                  }
                }}
                className="text-orange-primary font-semibold text-base hover:text-orange-dark transition-colors"
              >
                {checkedIngredients.size === recipe.ingredients.length ? 'Uncheck All' : 'Check All'}
              </button>
            </div>
            
            {/* Control hints for ingredients page */}
            {(isVoiceActive || isGestureActive) && (
              <div className="text-center mb-6">
                <p className="text-sm text-gray-500 italic">
                  {isVoiceActive && isGestureActive && (
                    <>Say ingredient name or &quot;Check all&quot; • Rock sign to go back to steps</>
                  )}
                  {isVoiceActive && !isGestureActive && (
                    <>Say ingredient name to toggle • &quot;Check all&quot; / &quot;Uncheck all&quot; • &quot;Steps&quot; to go back</>
                  )}
                  {!isVoiceActive && isGestureActive && (
                    <>Rock sign: go to steps • Point up: timer</>
                  )}
                </p>
              </div>
            )}
            <div className="space-y-4">
              {recipe.ingredients.map((ingredient, index) => {
                const isChecked = checkedIngredients.has(index)
                return (
                  <div
                    key={index}
                    className={`bg-gray-50 rounded-lg p-5 flex items-center gap-4 transition-all ${
                      isChecked ? 'opacity-60' : ''
                    }`}
                  >
                    <button
                      onClick={() => {
                        const newChecked = new Set(checkedIngredients)
                        if (isChecked) {
                          newChecked.delete(index)
                        } else {
                          newChecked.add(index)
                        }
                        setCheckedIngredients(newChecked)
                      }}
                      className="flex-shrink-0"
                    >
                      {isChecked ? (
                        <CheckCircle2 className="text-orange-primary" size={28} />
                      ) : (
                        <span className="w-7 h-7 border-2 border-orange-primary rounded-full flex items-center justify-center">
                        </span>
                      )}
                    </button>
                    <span className={`text-gray-900 font-medium text-lg flex-1 ${isChecked ? 'line-through' : ''}`}>
                      {ingredient.amount} {ingredient.unit || ''} {ingredient.name}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="px-6 py-6 h-full flex flex-col items-center justify-center">
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Timers</h2>
            
            {/* Control hints for timer page */}
            {(isVoiceActive || isGestureActive) && (
              <div className="text-center mb-6 w-full max-w-sm">
                <p className="text-sm text-gray-500 italic">
                  {isVoiceActive && isGestureActive && (
                    <>Say &quot;Timer [minutes]&quot; or show 1-4 fingers • Fist to pause/start</>
                  )}
                  {isVoiceActive && !isGestureActive && (
                    <>Say &quot;Timer [minutes]&quot; or &quot;[number] minutes&quot; • &quot;Start&quot; or &quot;Pause&quot;</>
                  )}
                  {!isVoiceActive && isGestureActive && (
                    <>1-4 fingers: set timer • Fist: pause/start</>
                  )}
                </p>
              </div>
            )}
            
            {/* Preset Timer Buttons */}
            <div className="grid grid-cols-2 gap-4 mb-12 w-full max-w-sm">
              {[5, 10, 15, 30].map((minutes) => (
                <button
                  key={minutes}
                  onClick={() => {
                    // Remove existing timer if any
                    if (timers.length > 0) {
                      timers.forEach(t => removeTimer(t.id))
                    }
                    // Add new timer
                    const label = `${minutes} minute${minutes > 1 ? 's' : ''}`
                    addTimer(label, minutes)
                  }}
                  className="bg-orange-primary text-white font-bold text-xl py-5 rounded-lg hover:bg-orange-dark transition-colors shadow-md"
                >
                  {minutes} min
                </button>
              ))}
            </div>

            {/* Single Timer Display */}
            {timers.length > 0 ? (
              <div className="flex flex-col items-center justify-center w-full flex-1">
                {(() => {
                  const timer = timers[0]
                  const remainingSeconds = timer.remainingSeconds
                  const totalSeconds = timer.totalSeconds
                  const progress = (remainingSeconds / totalSeconds) * 100
                  const mins = Math.floor(remainingSeconds / 60)
                  const secs = remainingSeconds % 60
                  const isExpired = remainingSeconds === 0

                  return (
                    <>
                      {/* Big Countdown Display */}
                      <div className="text-center mb-12 flex-1 flex items-center justify-center">
                        <div className={`text-9xl font-bold ${isExpired ? 'text-red-600' : 'text-orange-primary'}`}>
                          {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
                        </div>
                        {isExpired && (
                          <p className="text-2xl font-semibold text-red-600 mt-4">Timer Complete!</p>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="w-full max-w-md bg-gray-200 rounded-full h-4 mb-8">
                        <div
                          className={`h-4 rounded-full transition-all ${
                            isExpired ? 'bg-red-500' : 'bg-orange-primary'
                          }`}
                          style={{ width: `${progress}%` }}
                        />
                      </div>

                      {/* Control Buttons */}
                      <div className="flex items-center justify-center gap-6">
                        {/* Restart Button */}
                        <button
                          onClick={() => resetTimer(timer.id)}
                          className="w-20 h-20 rounded-full flex items-center justify-center bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors shadow-lg border-2 border-gray-300"
                        >
                          <RotateCcw size={32} />
                        </button>

                        {/* Pause/Play Button */}
                        <button
                          onClick={() => toggleTimer(timer.id)}
                          className={`w-32 h-32 rounded-full flex items-center justify-center transition-colors shadow-xl border-4 border-white ${
                            timer.isRunning
                              ? 'bg-gray-500 text-white hover:bg-gray-600'
                              : 'bg-orange-primary text-white hover:bg-orange-dark'
                          }`}
                        >
                          {timer.isRunning ? (
                            <Pause size={48} />
                          ) : (
                            <Play size={48} />
                          )}
                        </button>
                      </div>
                    </>
                  )
                })()}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center flex-1 text-center">
                <Clock className="text-gray-300 mb-4" size={64} />
                <p className="text-gray-500 mb-2 text-lg">No timers yet</p>
                <p className="text-sm text-gray-400">Tap a preset above to create a timer</p>
              </div>
            )}
          </div>
        )}
      </main>


      {/* Cooking Mode Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="flex justify-around items-center h-16 px-2">
          <button
            onClick={handleTimerClick}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${
              activeTab === 'timer' ? 'text-orange-primary' : 'text-gray-500 hover:text-orange-primary'
            }`}
          >
            <div className="relative">
              <Clock size={24} />
              {timers.length > 0 && timers[0].isRunning && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-orange-primary rounded-full animate-pulse"></span>
              )}
            </div>
            <span className="text-xs mt-1">Timer</span>
          </button>
          <button 
            onClick={() => setActiveTab('steps')}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === 'steps' ? 'text-red-500' : 'text-gray-500 hover:text-red-500'
            }`}
          >
            <ChefHat size={24} />
            <span className="text-xs mt-1">Cooking</span>
          </button>
          <button
            onClick={handleIngredientsClick}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              activeTab === 'ingredients' ? 'text-orange-primary' : 'text-gray-500 hover:text-orange-primary'
            }`}
          >
            <UtensilsCrossed size={24} />
            <span className="text-xs mt-1">Ingredients</span>
          </button>
        </div>
        {(isVoiceActive || isGestureActive) && (
          <div className="bg-green-50 border-t border-green-200 px-4 py-2 text-center">
            <p className="text-xs text-green-700 font-medium flex items-center justify-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              {isVoiceActive && isGestureActive
                ? 'VOICE AND GESTURE COMMANDS ACTIVATED'
                : isVoiceActive
                ? 'VOICE COMMANDS ACTIVATED'
                : 'GESTURE COMMANDS ACTIVATED'}
            </p>
          </div>
        )}
      </nav>


      {/* Gesture Debug Overlay */}
      <GestureDebugOverlay
        isOpen={showDebugOverlay}
        onClose={() => setShowDebugOverlay(false)}
      />

      {/* Completion Modal */}
      <CompletionModal
        isOpen={showCompletion}
        recipeTitle={recipe.title}
        onGoHome={handleCompletionGoHome}
      />
    </div>
  )
}

export default ActiveCookingScreen

