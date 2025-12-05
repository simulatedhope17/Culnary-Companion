import MobileHeader from '../components/MobileHeader'
import PersistentNavBar from '../components/PersistentNavBar'
import RecipeCard from '../components/RecipeCard'
import { mockRecipes } from '../data/mockData'
import { useRecipeContext } from '../context/RecipeContext'
import { Heart } from 'lucide-react'

const FavoritesScreen = () => {
  const { favorites } = useRecipeContext()
  const favoriteRecipes = mockRecipes.filter(recipe => favorites.includes(recipe.id))

  return (
    <div className="min-h-screen bg-white pb-20">
      <MobileHeader title="Favorites" showBack />
      
      <main className="px-4 py-4">
        {favoriteRecipes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {favoriteRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                id={recipe.id}
                title={recipe.title}
                image={recipe.image}
                difficulty={recipe.difficulty}
                prepTime={recipe.prepTime}
                cookTime={recipe.cookTime}
              />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Heart className="text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 mb-2">No favorites yet</p>
            <p className="text-sm text-gray-400">Start adding recipes to your favorites!</p>
          </div>
        )}
      </main>

      <PersistentNavBar />
    </div>
  )
}

export default FavoritesScreen

