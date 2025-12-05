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

## Getting Started

### Prerequisites

- Node.js 18+ and npm

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

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

## Design Principles

This application follows the requirements document's design principles:

- **Hub-Centered Architecture**: Non-linear navigation between recipe steps, ingredients, and timers
- **Tabbed Document Interface (TDI)**: Used in Active Cooking Screen for switching between steps and ingredients
- **Multimodal Interaction**: Designed to support voice and gesture commands (UI ready, implementation pending)
- **Mobile-First Design**: Optimized for touch interactions with large, accessible targets
- **Minimalist Active Cooking Screen**: Large, readable text for distance viewing

## Mock Data

The application uses mock recipe data defined in `src/data/mockData.ts`. You can modify this file to add or change recipes for testing.

## Future Enhancements

- Voice command recognition
- Gesture control implementation
- Timer functionality
- Recipe favorites persistence
- User authentication
- Recipe search and filtering

