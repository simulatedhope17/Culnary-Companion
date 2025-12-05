import MobileHeader from '../components/MobileHeader'
import PersistentNavBar from '../components/PersistentNavBar'
import RecipeCard from '../components/RecipeCard'
import { mockRecipes } from '../data/mockData'
import { Clock } from 'lucide-react'

const RecentsScreen = () => {
  // Show recent recipes (last 3 viewed - for demo, we'll show recent recipes from the list)
  const recentRecipes = mockRecipes.slice(0, 6) // Show first 6 as "recent" for demo

  return (
    <div className="min-h-screen bg-white pb-20">
      <MobileHeader title="Recents" showBack />
      
      <main className="px-4 py-4">
        {recentRecipes.length > 0 ? (
          <div className="grid grid-cols-2 gap-3">
            {recentRecipes.map((recipe) => (
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
            <Clock className="text-gray-300 mb-4" size={48} />
            <p className="text-gray-500 mb-2">No recent recipes</p>
            <p className="text-sm text-gray-400">Start viewing recipes to see them here!</p>
          </div>
        )}
      </main>

      <PersistentNavBar />
    </div>
  )
}

export default RecentsScreen


