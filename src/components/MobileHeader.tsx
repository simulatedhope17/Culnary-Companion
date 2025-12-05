import { useNavigate } from 'react-router-dom'
import { ChefHat, User, Loader, Hand } from 'lucide-react'

interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  onBack?: () => void
  isListening?: boolean
  isGestureDetecting?: boolean
  isVoiceActive?: boolean
  isGestureActive?: boolean
}

const MobileHeader = ({ 
  title, 
  showBack = false, 
  onBack,
  isListening = false,
  isGestureDetecting = false,
  isVoiceActive = false,
  isGestureActive = false
}: MobileHeaderProps) => {
  const navigate = useNavigate()

  const handleBack = () => {
    if (onBack) {
      onBack()
    } else {
      navigate(-1)
    }
  }

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-gray-200">
      {/* Main header */}
      <div className="flex items-center justify-between px-4 py-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {showBack && (
            <button
              onClick={handleBack}
              className="text-gray-700 hover:text-orange-primary transition-colors flex-shrink-0"
            >
              <span className="text-lg font-semibold">‹</span>
            </button>
          )}
          {title ? (
            <h1 className="text-lg font-semibold text-gray-900 flex-shrink-0">{title}</h1>
          ) : (
            <div className="flex items-center gap-2 flex-shrink-0">
              <ChefHat className="text-orange-primary" size={24} />
              <span className="text-lg font-semibold text-gray-900">Culinary Companion</span>
            </div>
          )}
          
          {/* Status indicators (toasters) next to title */}
          <div className="flex items-center gap-2 ml-2 flex-shrink-0">
            {isListening && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500 text-white text-xs font-semibold">
                <Loader className="animate-spin" size={14} />
                <span>Listening...</span>
              </div>
            )}
            {isGestureDetecting && !isListening && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500 text-white text-xs font-semibold">
                <Hand size={14} />
                <span>Detecting...</span>
              </div>
            )}
            {isVoiceActive && !isListening && (
              <div className="px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold">
                Voice On
              </div>
            )}
            {isGestureActive && !isGestureDetecting && !isListening && (
              <div className="px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 text-xs font-semibold">
                Gesture On
              </div>
            )}
          </div>
        </div>
        <button 
          onClick={() => navigate('/settings')}
          className="text-gray-700 hover:text-orange-primary transition-colors flex-shrink-0"
        >
          <User size={20} />
        </button>
      </div>
    </header>
  )
}

export default MobileHeader

