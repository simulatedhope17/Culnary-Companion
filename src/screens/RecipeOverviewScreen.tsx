import { useParams, useNavigate } from 'react-router-dom'
import MobileHeader from '../components/MobileHeader'
import PersistentNavBar from '../components/PersistentNavBar'
import { getRecipeById } from '../data/mockData'
import { useRecipeContext } from '../context/RecipeContext'
import { Clock, Users, ChefHat, Globe, Heart } from 'lucide-react'

const RecipeOverviewScreen = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const recipe = id ? getRecipeById(id) : null
  const { isFavorite, toggleFavorite, setInProgress } = useRecipeContext()

  if (!recipe) {
    return (
      <div className="min-h-screen bg-white pb-20">
        <MobileHeader title="Recipe Not Found" showBack />
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">Recipe not found</p>
        </div>
        <PersistentNavBar />
      </div>
    )
  }

  return (
    <div className="h-screen bg-white flex flex-col overflow-hidden">
      <MobileHeader title={recipe.title} showBack />
      
      <main className="flex-1 overflow-y-auto px-4 py-3">
        {/* Recipe Image - Smaller */}
        <div className="relative h-48 rounded-lg overflow-hidden mb-3 shadow-md">
          <img
            src={recipe.image}
            alt={recipe.title}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Time Info - Compact */}
        <div className="flex items-center gap-1 mb-3 text-xs text-gray-600">
          <Clock size={14} />
          <span>{recipe.prepTime} min Prep / {recipe.cookTime} min Cook</span>
        </div>

        {/* Overview Section */}
        <section className="mb-3">
          <div className="flex items-center justify-between mb-1">
            <h2 className="text-base font-semibold text-gray-900">Overview</h2>
            <button
              onClick={() => toggleFavorite(recipe.id)}
              className={`p-2 rounded-lg transition-colors border-2 ${
                isFavorite(recipe.id)
                  ? 'bg-orange-50 border-orange-primary text-orange-primary'
                  : 'bg-white border-gray-300 text-gray-700 hover:border-orange-primary hover:text-orange-primary'
              }`}
            >
              <Heart size={18} className={isFavorite(recipe.id) ? 'fill-current' : ''} />
            </button>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{recipe.description}</p>
        </section>

        {/* Start Cooking Button */}
        <button
          onClick={() => {
            setInProgress(recipe.id, 0)
            navigate(`/cooking/${recipe.id}`)
          }}
          className="w-full bg-orange-primary text-white font-semibold py-2.5 rounded-lg hover:bg-orange-dark transition-colors shadow-md text-sm mb-3"
        >
          Start Cooking
        </button>

        {/* Key Details - Compact */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <Users className="mx-auto mb-0.5 text-orange-primary" size={16} />
            <p className="text-xs text-gray-600">Servings</p>
            <p className="text-xs font-semibold text-gray-900">{recipe.servings}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <ChefHat className="mx-auto mb-0.5 text-orange-primary" size={16} />
            <p className="text-xs text-gray-600">Difficulty</p>
            <p className="text-xs font-semibold text-gray-900">{recipe.difficulty}</p>
          </div>
          <div className="bg-gray-50 rounded-lg p-2 text-center">
            <Globe className="mx-auto mb-0.5 text-orange-primary" size={16} />
            <p className="text-xs text-gray-600">Cuisine</p>
            <p className="text-xs font-semibold text-gray-900">{recipe.cuisine}</p>
          </div>
        </div>

        {/* Ingredients and Steps - Two Column Layout */}
        <div className="grid grid-cols-2 gap-4">
          {/* Ingredients - Left Column */}
          <section className="pr-4 border-r border-gray-200">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Ingredients</h2>
            <div className="space-y-1.5">
              {recipe.ingredients.map((ingredient, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 bg-orange-primary rounded-full flex-shrink-0"></span>
                  <span>
                    {ingredient.amount} {ingredient.unit || ''} {ingredient.name}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Steps - Right Column */}
          <section className="pl-4">
            <h2 className="text-base font-semibold text-gray-900 mb-2">Steps</h2>
            <p className="text-sm text-gray-600 mb-2">
              {recipe.steps.length} steps • Total time: {recipe.prepTime + recipe.cookTime} minutes
            </p>
            <div className="space-y-1.5">
              {recipe.steps.map((step, index) => (
                <div key={index} className="text-xs text-gray-600">
                  <span className="font-semibold text-gray-900">Step {step.stepNumber}:</span> {step.instruction.substring(0, 40)}...
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>

      <PersistentNavBar />
    </div>
  )
}

export default RecipeOverviewScreen

