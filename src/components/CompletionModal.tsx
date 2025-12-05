import { CheckCircle } from 'lucide-react'

interface CompletionModalProps {
  isOpen: boolean
  recipeTitle: string
  onGoHome: () => void
}

const CompletionModal = ({ isOpen, recipeTitle, onGoHome }: CompletionModalProps) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg w-full max-w-sm p-6 shadow-xl text-center">
        <div className="mb-4">
          <CheckCircle className="mx-auto text-green-500" size={64} />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
        <p className="text-gray-600 mb-6">
          You've completed <span className="font-semibold">{recipeTitle}</span>
        </p>
        <button
          onClick={onGoHome}
          className="w-full bg-orange-primary text-white font-semibold py-3 rounded-lg hover:bg-orange-dark transition-colors"
        >
          Go to Home
        </button>
      </div>
    </div>
  )
}

export default CompletionModal

