import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { RecipeProvider } from './context/RecipeContext'
import { VoiceGestureProvider } from './context/VoiceGestureContext'
import { TimerProvider } from './context/TimerContext'
import HomeScreen from './screens/HomeScreen'
import RecipeOverviewScreen from './screens/RecipeOverviewScreen'
import ActiveCookingScreen from './screens/ActiveCookingScreen'
import SettingsScreen from './screens/SettingsScreen'
import FavoritesScreen from './screens/FavoritesScreen'
import SearchScreen from './screens/SearchScreen'
import RecentsScreen from './screens/RecentsScreen'
import GestureDebugScreen from './screens/GestureDebugScreen'

function App() {
  return (
    <RecipeProvider>
      <VoiceGestureProvider>
        <TimerProvider>
          <Router>
            <div className="min-h-screen bg-white">
              <Routes>
            <Route path="/" element={<HomeScreen />} />
            <Route path="/recipe/:id" element={<RecipeOverviewScreen />} />
            <Route path="/cooking/:id" element={<ActiveCookingScreen />} />
            <Route path="/settings" element={<SettingsScreen />} />
            <Route path="/favorites" element={<FavoritesScreen />} />
            <Route path="/search" element={<SearchScreen />} />
            <Route path="/recents" element={<RecentsScreen />} />
            <Route path="/gesture-debug" element={<GestureDebugScreen />} />
              </Routes>
            </div>
          </Router>
        </TimerProvider>
      </VoiceGestureProvider>
    </RecipeProvider>
  )
}

export default App

