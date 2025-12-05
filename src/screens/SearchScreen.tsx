import { useState } from 'react'
import MobileHeader from '../components/MobileHeader'
import PersistentNavBar from '../components/PersistentNavBar'
import RecipeCard from '../components/RecipeCard'
import { mockRecipes } from '../data/mockData'
import { Search } from 'lucide-react'

const SearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState('')
  
  const filteredRecipes = mockRecipes.filter(recipe =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.cuisine.toLowerCase().includes(searchQuery.toLowerCase()) ||
    recipe.difficulty.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-white pb-20">
      <MobileHeader title="Search" showBack />
      
      <main className="px-4 py-4">
        {/* Search Bar */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-primary focus:border-transparent"
          />
        </div>

        {/* Search Results */}
        {searchQuery ? (
          filteredRecipes.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredRecipes.map((recipe) => (
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
              <Search className="text-gray-300 mb-4" size={48} />
              <p className="text-gray-500 mb-2">No recipes found</p>
              <p className="text-sm text-gray-400">Try a different search term</p>
            </div>
          )
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Search className="text-gray-300 mb-4" size={48} />
            <p className="text-gray-500">Start typing to search for recipes</p>
          </div>
        )}
      </main>

      <PersistentNavBar />
    </div>
  )
}

export default SearchScreen

