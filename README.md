# Culinary Companion

A mobile-first recipe application designed for hands-free cooking with voice and gesture controls.

## Features

- **Home Hub Screen**: Browse editor's picks, recent recipes, and continue cooking
- **Recipe Overview**: View recipe details, ingredients, and cooking steps
- **Active Cooking Mode**: Step-by-step cooking instructions with tabbed interface
- **Settings**: Configure voice commands, gesture controls, and notifications
- **Persistent Navigation**: Easy access to all main features from any screen

## Tech Stack

- React 18 with TypeScript
- Vite for build tooling
- Tailwind CSS for styling
- React Router for navigation
- Lucide React for icons
- **ml5.js HandPose** for gesture recognition
- **Web Speech API** for voice commands
- **Web Speech Synthesis API** for text-to-speech

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- **Google Chrome** (required for voice and gesture controls)

### Installing Node.js and npm

npm comes bundled with Node.js, so installing Node.js will also install npm. Here are installation options:

**Option 1: Official Installer (Recommended)**
1. Visit [nodejs.org](https://nodejs.org/)
2. Download the LTS (Long Term Support) version for your operating system
3. Run the installer and follow the setup wizard
4. Verify installation by opening a terminal and running:
   ```bash
   node --version
   npm --version
   ```

**Option 2: Using a Package Manager**

- **macOS (using Homebrew)**:
  ```bash
  brew install node
  ```

- **Linux (Ubuntu/Debian)**:
  ```bash
  sudo apt update
  sudo apt install nodejs npm
  ```

- **Windows (using Chocolatey)**:
  ```bash
  choco install nodejs
  ```

After installation, verify that both Node.js and npm are installed correctly:
```bash
node --version  # Should show v18.x.x or higher
npm --version   # Should show 9.x.x or higher
```

### Installation

1. Install dependencies:

```bash
npm install --legacy-peer-deps
```
or

```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. **Important**: Open **Google Chrome** and navigate to `http://localhost:5173`

4. **Enable Mobile View** (Required for optimal experience):
   - Press `F12` or right-click and select "Inspect" to open Developer Tools
   - Click the device toolbar icon (or press `Ctrl+Shift+M` / `Cmd+Shift+M`)
   - Select **iPhone 14 Pro** from the device dropdown (or any mobile device)
   - This ensures the mobile-first UI displays correctly and camera access works properly for gesture controls

5. **Allow Camera and Microphone Access** (Required for voice and gesture controls):
   - When prompted by Chrome, click **"Allow"** for camera access (needed for gesture detection)
   - Click **"Allow"** for microphone access (needed for voice commands)
   - If you previously denied access, click the camera/microphone icon in Chrome's address bar and select "Always allow" for localhost
   - You can also manage permissions in Chrome Settings → Privacy and security → Site settings → Camera/Microphone

### Why Chrome?

- Voice commands require Chrome's Web Speech API
- Gesture controls use ml5.js HandPose which works best in Chrome
- Camera access for gesture detection is most reliable in Chrome
- Microphone access for voice commands works seamlessly in Chrome

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory.

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── MobileHeader.tsx
│   ├── PersistentNavBar.tsx
│   └── RecipeCard.tsx
├── screens/            # Main application screens
│   ├── HomeScreen.tsx
│   ├── RecipeOverviewScreen.tsx
│   ├── ActiveCookingScreen.tsx
│   ├── SettingsScreen.tsx
│   ├── FavoritesScreen.tsx
│   ├── SearchScreen.tsx
│   └── ContinueCookingScreen.tsx
├── data/              # Mock data
│   └── mockData.ts
├── App.tsx            # Main app component with routing
├── main.tsx          # Entry point
└── index.css         # Global styles
```

## Voice and Gesture Controls

### 🎤 Voice Commands

#### Navigation Commands (Available on Cooking/Steps Page)
- **"Next"** / **"Next step"** → Go to next step
- **"Back"** / **"Go back"** / **"Previous"** / **"Previous step"** → Go to previous step
- **"Show ingredients"** / **"Ingredients"** / **"Ingredient list"** → Switch to ingredients tab
- **"Show steps"** / **"Steps"** / **"Cooking"** → Switch to steps/cooking tab

#### Timer Commands (Available on Timer Page)
- **"Timer"** / **"Set timer"** → Go to timer page (creates 5 min timer if none exists)
- **"Timer [number]"** (e.g., "Timer 10") → Create and start timer for specified minutes (1-120)
- **"[Number] minutes"** / **"[Number] min"** / **"[Number]"** (e.g., "5 minutes", "10 min", "7") → Create and start timer for that duration
- **"Start"** → Start the current timer (or create 5 min timer if none exists)
- **"Pause"** → Pause the current timer
- **"Restart"** → Reset and restart the current timer

#### Ingredient Commands (Available on Ingredients Page)
- **"[Ingredient name]"** (e.g., "Chicken", "Onion") → Toggle ingredient checkbox
- **"Check all"** → Check all ingredients
- **"Uncheck all"** → Uncheck all ingredients

### 👋 Gesture Controls

#### On Cooking/Steps Page

**Navigation Gestures:**
- **Thumbs Up** → Next step
- **Thumbs Down** → Previous step
- **Open Palm** (all 5 fingers extended) → Go to steps/cooking page
- **Pointing Up** (index finger pointing upward) → Go to timer page
- **Rock Sign** (index + pinky extended) → Go to ingredients page
- **OK Sign** (thumb and index forming circle) → Go to cooking/steps page

#### On Timer Page

**Timer Duration Gestures:**
- **1 Finger** → Create and start 5 minute timer
- **2 Fingers** → Create and start 10 minute timer
- **3 Fingers** → Create and start 15 minute timer
- **4 Fingers** → Create and start 30 minute timer

**Timer Control Gestures:**
- **Fist** (all fingers closed) → Toggle timer (pause if running, start if paused)
- **Thumbs Down** → Pause timer

### 📝 Notes

- All gestures require **1 frame** of consistent detection before activation
- Voice commands work independently of gesture controls
- TTS (Text-to-Speech) reads steps aloud automatically when enabled (on by default)
- Gestures are context-aware (different actions on different pages)
- All commands provide visual and audio feedback when TTS is enabled
- Enable voice/gesture controls from the settings or using the toggle buttons on the cooking screen
- Debug overlay available for gesture detection (enable in settings)

## Design Principles

This application follows the requirements document's design principles:

- **Hub-Centered Architecture**: Non-linear navigation between recipe steps, ingredients, and timers
- **Tabbed Document Interface (TDI)**: Used in Active Cooking Screen for switching between steps and ingredients
- **Multimodal Interaction**: Fully implemented voice and gesture commands for hands-free cooking
- **Mobile-First Design**: Optimized for touch interactions with large, accessible targets
- **Minimalist Active Cooking Screen**: Large, readable text for distance viewing

## Mock Data

The application uses mock recipe data defined in `src/data/mockData.ts`. You can modify this file to add or change recipes for testing.

## Features

- ✅ Voice command recognition
- ✅ Gesture control implementation (ml5.js HandPose)
- ✅ Timer functionality with multiple timers
- ✅ Text-to-speech (TTS) for step reading
- ✅ Recipe favorites
- ✅ Recipe search and filtering
- ✅ Settings page for configuring controls

## Future Enhancements

- Recipe favorites persistence (localStorage)
- User authentication
- Recipe sharing
- Custom recipe creation
- Nutritional information
- Cooking history and analytics

