import { useNavigate, useLocation } from 'react-router-dom'
import { Home, Heart, Search, Clock, Settings } from 'lucide-react'

const PersistentNavBar = () => {
  const navigate = useNavigate()
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/favorites', icon: Heart, label: 'Favorites' },
    { path: '/search', icon: Search, label: 'Search' },
    { path: '/recents', icon: Clock, label: 'Recents' },
    { path: '/settings', icon: Settings, label: 'Settings' },
  ]

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(path)
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
      <div className="flex justify-around items-center h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
                active ? 'text-orange-primary' : 'text-gray-500'
              }`}
            >
              <Icon size={24} className={active ? 'text-orange-primary' : 'text-gray-500'} />
              <span className={`text-xs mt-1 ${active ? 'text-orange-primary font-medium' : 'text-gray-500'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </div>
    </nav>
  )
}

export default PersistentNavBar

