import { useNavigate } from 'react-router-dom'
import { Clock } from 'lucide-react'

interface RecipeCardProps {
  id: string
  title: string
  image: string
  difficulty?: string
  prepTime?: number
  cookTime?: number
  badge?: string
  badgeColor?: string
}

const RecipeCard = ({
  id,
  title,
  image,
  difficulty,
  prepTime,
  cookTime,
  badge,
  badgeColor = 'bg-orange-primary',
}: RecipeCardProps) => {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/recipe/${id}`)}
      className="relative bg-white rounded-lg overflow-hidden shadow-sm border border-gray-100 cursor-pointer active:scale-98 transition-transform"
    >
      <div className="relative h-40 overflow-hidden">
        <img
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
        {badge && (
          <div className={`absolute top-2 right-2 ${badgeColor} text-white text-xs font-semibold px-2 py-1 rounded`}>
            {badge}
          </div>
        )}
        {difficulty && !badge && (
          <div className="absolute top-2 right-2 bg-white/90 text-gray-700 text-xs font-semibold px-2 py-1 rounded">
            {difficulty}
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-semibold text-gray-900 text-sm mb-1 line-clamp-2">{title}</h3>
        {(prepTime || cookTime) && (
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock size={12} />
            <span>
              {prepTime && cookTime ? `${prepTime} min Prep / ${cookTime} min Cook` : 
               prepTime ? `${prepTime} min` : 
               cookTime ? `${cookTime} min` : ''}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

export default RecipeCard

