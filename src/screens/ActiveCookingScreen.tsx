import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MobileHeader from '../components/MobileHeader'
import VoiceGestureFeedback from '../components/VoiceGestureFeedback'
import CompletionModal from '../components/CompletionModal'
import { getRecipeById } from '../data/mockData'
import { useRecipeContext } from '../context/RecipeContext'
import { useVoiceGesture } from '../context/VoiceGestureContext'
import { useTimers } from '../context/TimerContext'
import { ChevronLeft, ChevronRight, Clock, UtensilsCrossed, ChefHat, Play, Pause, RotateCcw, CheckCircle2 } from 'lucide-react'

const ActiveCookingScreen = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = id ? getRecipeById(id) : null
  const { getCurrentStep, setInProgress, clearInProgress } = useRecipeContext()
  const { lastCommand, lastGesture, isVoiceActive, isGestureActive } = useVoiceGesture()
  const { addTimer, timers, removeTimer, toggleTimer, resetTimer } = useTimers()
  const [activeTab, setActiveTab] = useState<'steps' | 'ingredients' | 'timer'>('steps')
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showCompletion, setShowCompletion] = useState(false)
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set())

  // Initialize from saved progress
  useEffect(() => {
    if (recipe && id) {
      const savedStep = getCurrentStep(id)
      if (savedStep !== undefined) {
        setCurrentStepIndex(savedStep)
      }
    }
  }, [recipe, id, getCurrentStep])

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
      const newIndex = currentStepIndex + 1
      setCurrentStepIndex(newIndex)
      setInProgress(id, newIndex)
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
      const newIndex = currentStepIndex - 1
      setCurrentStepIndex(newIndex)
      setInProgress(id, newIndex)
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


  // Handle voice commands
  useEffect(() => {
    if (!lastCommand || !isVoiceActive) return

    switch (lastCommand.toLowerCase()) {
      case 'next step':
        handleNext()
        break
      case 'go back':
        handlePrevious()
        break
      case 'show ingredients':
        setActiveTab('ingredients')
        break
      case 'set timer':
        setActiveTab('timer')
        break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastCommand, isVoiceActive, currentStep])

  // Handle gesture commands (as per project report Section 5.0)
  useEffect(() => {
    if (!lastGesture || !isGestureActive) return

    switch (lastGesture) {
      case 'swipe right':
        // Swipe right advances to next step (project report Section 5.0, line 62)
        if (canGoForward) {
          handleNext()
        }
        break
      case 'swipe left':
        // Swipe left returns to previous step (project report Section 5.0, line 63)
        if (canGoBack) {
          handlePrevious()
        }
        break
      case 'wave':
        // Wake screen / activate voice (already handled by context)
        break
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lastGesture, isGestureActive])

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <MobileHeader title="Cooking Mode" showBack onBack={() => navigate(`/recipe/${id}`)} />
      
      {/* Voice/Gesture Command Feedback (floating notifications) */}
      <VoiceGestureFeedback />

      <main className="flex-1 overflow-hidden pb-32">
        {activeTab === 'steps' ? (
          <div className="px-6 py-4 w-full max-w-4xl h-full flex flex-col items-center justify-center mx-auto">
            {/* Step Number - Subtle */}
            <div className="text-center mb-4 flex-shrink-0">
              <span className="text-base font-medium text-gray-400 uppercase tracking-wider">STEP {currentStep.stepNumber}</span>
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
                    <>Say &quot;Next&quot; or &quot;Back&quot; • Swipe right or left</>
                  )}
                  {isVoiceActive && !isGestureActive && (
                    <>Say &quot;Next&quot; or &quot;Back&quot; to navigate</>
                  )}
                  {!isVoiceActive && isGestureActive && (
                    <>Swipe right or left to navigate</>
                  )}
                </p>
              </div>
            )}

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

