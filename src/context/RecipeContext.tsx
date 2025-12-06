import { createContext, useContext, useState, ReactNode } from 'react'

interface RecipeContextType {
  favorites: string[]
  inProgress: { [key: string]: number } // recipeId -> currentStep
  toggleFavorite: (recipeId: string) => void
  isFavorite: (recipeId: string) => boolean
  setInProgress: (recipeId: string, step: number) => void
  clearInProgress: (recipeId: string) => void
  getCurrentStep: (recipeId: string) => number | undefined
}

const RecipeContext = createContext<RecipeContextType | undefined>(undefined)

export const RecipeProvider = ({ children }: { children: ReactNode }) => {
  const [favorites, setFavorites] = useState<string[]>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('culinary-companion-favorites')
    return saved ? JSON.parse(saved) : ['2'] // Default: Quick Avocado Toast is favorite
  })

  const [inProgress, setInProgressState] = useState<{ [key: string]: number }>(() => {
    // Load from localStorage
    const saved = localStorage.getItem('culinary-companion-in-progress')
    return saved ? JSON.parse(saved) : { '3': 2, '5': 1 } // Default: Lemon Herb Salmon at step 2, Margherita Pizza at step 1
  })

  const toggleFavorite = (recipeId: string) => {
    setFavorites((prev) => {
      const newFavorites = prev.includes(recipeId)
        ? prev.filter((id) => id !== recipeId)
        : [...prev, recipeId]
      localStorage.setItem('culinary-companion-favorites', JSON.stringify(newFavorites))
      return newFavorites
    })
  }

  const isFavorite = (recipeId: string) => {
    return favorites.includes(recipeId)
  }

  const setInProgress = (recipeId: string, step: number) => {
    setInProgressState((prev) => {
      const newState = { ...prev, [recipeId]: step }
      localStorage.setItem('culinary-companion-in-progress', JSON.stringify(newState))
      return newState
    })
  }

  const clearInProgress = (recipeId: string) => {
    setInProgressState((prev) => {
      const newState = { ...prev }
      delete newState[recipeId]
      localStorage.setItem('culinary-companion-in-progress', JSON.stringify(newState))
      return newState
    })
  }

  const getCurrentStep = (recipeId: string) => {
    return inProgress[recipeId]
  }

  return (
    <RecipeContext.Provider
      value={{
        favorites,
        inProgress,
        toggleFavorite,
        isFavorite,
        setInProgress,
        clearInProgress,
        getCurrentStep,
      }}
    >
      {children}
    </RecipeContext.Provider>
  )
}

export const useRecipeContext = () => {
  const context = useContext(RecipeContext)
  if (!context) {
    throw new Error('useRecipeContext must be used within RecipeProvider')
  }
  return context
}

