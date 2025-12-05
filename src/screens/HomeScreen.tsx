import { useNavigate } from 'react-router-dom'
import MobileHeader from '../components/MobileHeader'
import PersistentNavBar from '../components/PersistentNavBar'
import RecipeCard from '../components/RecipeCard'
import { mockRecipes } from '../data/mockData'

const HomeScreen = () => {
  const navigate = useNavigate()
  const editorPick = mockRecipes[0] // Flavorful Spicy Chicken Curry
  const recentRecipes = mockRecipes.slice(1, 3) // Quick Avocado Toast, Lemon Herb Salmon

  return (
    <div className="min-h-screen bg-white pb-20">
      <MobileHeader />
      
      <main className="px-4 py-4 space-y-6">
        {/* Editor's Pick Section */}
        <section>
          <div className="mb-3">
            <span className="text-xs font-semibold text-orange-primary bg-orange-50 px-2 py-1 rounded">
              Editor's Pick
            </span>
          </div>
          <div
            onClick={() => navigate(`/recipe/${editorPick.id}`)}
            className="relative h-64 rounded-lg overflow-hidden shadow-md cursor-pointer active:scale-98 transition-transform"
          >
            <img
              src={editorPick.image}
              alt={editorPick.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 left-0 right-0 p-4">
              <h2 className="text-xl font-bold text-white mb-3">{editorPick.title}</h2>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  navigate(`/recipe/${editorPick.id}`)
                }}
                className="bg-orange-primary text-white font-semibold px-6 py-2 rounded-lg hover:bg-orange-dark transition-colors"
              >
                View Recipe
              </button>
            </div>
          </div>
        </section>

        {/* Recent Recipes Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Recent Recipes</h2>
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
        </section>


        {/* Explore Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Explore</h2>
          <div className="grid grid-cols-2 gap-3">
            {mockRecipes
              .filter(recipe => 
                recipe.id !== editorPick.id && 
                !recentRecipes.some(r => r.id === recipe.id)
              )
              .slice(0, 4)
              .map((recipe) => (
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
        </section>
      </main>

      <PersistentNavBar />
    </div>
  )
}

export default HomeScreen

