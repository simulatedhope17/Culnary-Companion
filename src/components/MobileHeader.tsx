import { useNavigate } from 'react-router-dom'
import { ChefHat, User } from 'lucide-react'

interface MobileHeaderProps {
  title?: string
  showBack?: boolean
  onBack?: () => void
}

const MobileHeader = ({ title, showBack = false, onBack }: MobileHeaderProps) => {
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
        <div className="flex items-center gap-3">
          {showBack && (
            <button
              onClick={handleBack}
              className="text-gray-700 hover:text-orange-primary transition-colors"
            >
              <span className="text-lg font-semibold">‹</span>
            </button>
          )}
          {title ? (
            <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
          ) : (
            <div className="flex items-center gap-2">
              <ChefHat className="text-orange-primary" size={24} />
              <span className="text-lg font-semibold text-gray-900">Culinary Companion</span>
            </div>
          )}
        </div>
        <button 
          onClick={() => navigate('/settings')}
          className="text-gray-700 hover:text-orange-primary transition-colors"
        >
          <User size={20} />
        </button>
      </div>
    </header>
  )
}

export default MobileHeader

