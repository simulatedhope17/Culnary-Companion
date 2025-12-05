import { useState, useEffect } from 'react'
import MobileHeader from '../components/MobileHeader'
import PersistentNavBar from '../components/PersistentNavBar'
import { Volume2, Hand, Bell, Smartphone } from 'lucide-react'

const SettingsScreen = () => {
  const [voiceCommands, setVoiceCommands] = useState(() => {
    return localStorage.getItem('voice-commands-enabled') !== 'false'
  })
  const [gestureControls, setGestureControls] = useState(() => {
    return localStorage.getItem('gesture-controls-enabled') !== 'false'
  })
  const [recipeReminders, setRecipeReminders] = useState(false)
  const [appUpdates, setAppUpdates] = useState(true)

  useEffect(() => {
    localStorage.setItem('voice-commands-enabled', voiceCommands.toString())
  }, [voiceCommands])

  useEffect(() => {
    localStorage.setItem('gesture-controls-enabled', gestureControls.toString())
  }, [gestureControls])

  const ToggleSwitch = ({
    enabled,
    onToggle,
  }: {
    enabled: boolean
    onToggle: (enabled: boolean) => void
  }) => {
    return (
      <button
        onClick={() => onToggle(!enabled)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
          enabled ? 'bg-orange-primary' : 'bg-gray-300'
        }`}
      >
        <span
          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
            enabled ? 'translate-x-6' : 'translate-x-1'
          }`}
        />
      </button>
    )
  }

  const SettingItem = ({
    icon: Icon,
    title,
    description,
    enabled,
    onToggle,
  }: {
    icon: any
    title: string
    description: string
    enabled: boolean
    onToggle: (enabled: boolean) => void
  }) => {
    return (
      <div className="flex items-start justify-between py-4 border-b border-gray-100">
        <div className="flex items-start gap-3 flex-1">
          <div className="mt-1">
            <Icon size={20} className="text-orange-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
            <p className="text-sm text-gray-600 leading-relaxed">{description}</p>
          </div>
        </div>
        <div className="ml-4">
          <ToggleSwitch enabled={enabled} onToggle={onToggle} />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      <MobileHeader title="Settings" showBack />
      
      <main className="px-4 py-4">
        {/* Assistance Features Section */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Assistance Features</h2>
          <div className="bg-white rounded-lg border border-gray-200">
            <SettingItem
              icon={Volume2}
              title="Voice Commands"
              description="Enable hands-free interaction with recipes."
              enabled={voiceCommands}
              onToggle={setVoiceCommands}
            />
            <SettingItem
              icon={Hand}
              title="Gesture Controls"
              description="Use specific hand gestures for navigation and actions."
              enabled={gestureControls}
              onToggle={setGestureControls}
            />
          </div>
        </section>

        {/* Notifications Section */}
        <section className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Notifications</h2>
          <div className="bg-white rounded-lg border border-gray-200">
            <SettingItem
              icon={Bell}
              title="Recipe Reminders"
              description="Get alerts for meal prep and cooking schedules."
              enabled={recipeReminders}
              onToggle={setRecipeReminders}
            />
            <SettingItem
              icon={Smartphone}
              title="App Updates"
              description="Receive notifications about new features and versions."
              enabled={appUpdates}
              onToggle={setAppUpdates}
            />
          </div>
        </section>

        {/* Appearance Section */}
        <section>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Appearance</h2>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <p className="text-sm text-gray-600">Appearance settings coming soon...</p>
          </div>
        </section>
      </main>

      <PersistentNavBar />
    </div>
  )
}

export default SettingsScreen

