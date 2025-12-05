export interface Recipe {
  id: string
  title: string
  image: string
  difficulty: 'Easy' | 'Medium' | 'Hard'
  cuisine: string
  prepTime: number // in minutes
  cookTime: number // in minutes
  servings: number
  description: string
  ingredients: Ingredient[]
  steps: CookingStep[]
  isFavorite?: boolean
  isInProgress?: boolean
  currentStep?: number
}

export interface Ingredient {
  name: string
  amount: string
  unit?: string
}

export interface CookingStep {
  stepNumber: number
  instruction: string
  duration?: number // in minutes
}

export const mockRecipes: Recipe[] = [
  {
    id: '1',
    title: 'Flavorful Spicy Chicken Curry',
    image: 'https://images.unsplash.com/photo-1588166524941-3bf61a9c41db?w=800',
    difficulty: 'Medium',
    cuisine: 'Indian',
    prepTime: 20,
    cookTime: 35,
    servings: 4,
    description: 'A quick and delicious stir-fry packed with tender chicken, crisp vegetables, and a savory spicy sauce. Perfect for a weeknight meal.',
    ingredients: [
      { name: 'Chicken breast', amount: '500', unit: 'g' },
      { name: 'Onion', amount: '1', unit: 'large' },
      { name: 'Garlic', amount: '3', unit: 'cloves' },
      { name: 'Ginger', amount: '1', unit: 'tbsp' },
      { name: 'Curry powder', amount: '2', unit: 'tbsp' },
      { name: 'Coconut milk', amount: '400', unit: 'ml' },
      { name: 'Tomatoes', amount: '2', unit: 'medium' },
      { name: 'Cilantro', amount: '1/4', unit: 'cup' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Cut the chicken breast into bite-sized pieces and season with salt and pepper.',
        duration: 5,
      },
      {
        stepNumber: 2,
        instruction: 'Heat oil in a large pan over medium-high heat. Add the chicken and cook until golden brown, about 5-7 minutes.',
        duration: 7,
      },
      {
        stepNumber: 3,
        instruction: 'Sauté aromatic vegetables until softened and fragrant, about 5-7 minutes.',
        duration: 7,
      },
      {
        stepNumber: 4,
        instruction: 'Add curry powder and stir for 1 minute until fragrant.',
        duration: 1,
      },
      {
        stepNumber: 5,
        instruction: 'Pour in coconut milk and bring to a simmer. Cook for 15 minutes until chicken is tender.',
        duration: 15,
      },
      {
        stepNumber: 6,
        instruction: 'Garnish with fresh cilantro and serve hot with rice.',
        duration: 2,
      },
    ],
    isFavorite: false,
    isInProgress: false,
  },
  {
    id: '2',
    title: 'Quick Avocado Toast',
    image: 'https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=800',
    difficulty: 'Easy',
    cuisine: 'American',
    prepTime: 5,
    cookTime: 5,
    servings: 2,
    description: 'A simple and healthy breakfast option that comes together in minutes.',
    ingredients: [
      { name: 'Bread', amount: '2', unit: 'slices' },
      { name: 'Avocado', amount: '1', unit: 'ripe' },
      { name: 'Lemon juice', amount: '1', unit: 'tsp' },
      { name: 'Salt', amount: 'to taste' },
      { name: 'Black pepper', amount: 'to taste' },
      { name: 'Red pepper flakes', amount: 'pinch' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Toast the bread until golden brown.',
        duration: 3,
      },
      {
        stepNumber: 2,
        instruction: 'Mash the avocado with lemon juice, salt, and pepper.',
        duration: 2,
      },
      {
        stepNumber: 3,
        instruction: 'Spread the avocado mixture on toast and sprinkle with red pepper flakes.',
        duration: 1,
      },
    ],
    isFavorite: true,
    isInProgress: false,
  },
  {
    id: '3',
    title: 'Lemon Herb Salmon',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?w=800',
    difficulty: 'Easy',
    cuisine: 'Mediterranean',
    prepTime: 10,
    cookTime: 15,
    servings: 4,
    description: 'Light and flavorful salmon with fresh herbs and lemon.',
    ingredients: [
      { name: 'Salmon fillets', amount: '4', unit: '6oz each' },
      { name: 'Lemon', amount: '2', unit: 'medium' },
      { name: 'Fresh dill', amount: '2', unit: 'tbsp' },
      { name: 'Fresh parsley', amount: '2', unit: 'tbsp' },
      { name: 'Olive oil', amount: '2', unit: 'tbsp' },
      { name: 'Garlic', amount: '2', unit: 'cloves' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Preheat oven to 400°F. Line a baking sheet with parchment paper.',
        duration: 5,
      },
      {
        stepNumber: 2,
        instruction: 'Mix herbs, lemon zest, garlic, and olive oil in a bowl.',
        duration: 3,
      },
      {
        stepNumber: 3,
        instruction: 'Place salmon on baking sheet and spread herb mixture on top.',
        duration: 2,
      },
      {
        stepNumber: 4,
        instruction: 'Bake for 12-15 minutes until salmon flakes easily.',
        duration: 15,
      },
    ],
    isFavorite: false,
    isInProgress: true,
    currentStep: 2,
  },
  {
    id: '4',
    title: 'Spicy Chicken Stir-Fry',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800',
    difficulty: 'Easy',
    cuisine: 'Asian',
    prepTime: 15,
    cookTime: 15,
    servings: 4,
    description: 'A quick and delicious stir-fry packed with tender chicken, crisp vegetables, and a savory spicy sauce.',
    ingredients: [
      { name: 'Chicken breast', amount: '500', unit: 'g' },
      { name: 'Bell peppers', amount: '2', unit: 'medium' },
      { name: 'Broccoli', amount: '200', unit: 'g' },
      { name: 'Soy sauce', amount: '3', unit: 'tbsp' },
      { name: 'Sesame oil', amount: '1', unit: 'tbsp' },
      { name: 'Ginger', amount: '1', unit: 'tbsp' },
      { name: 'Garlic', amount: '3', unit: 'cloves' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Cut chicken into thin strips and marinate with soy sauce for 10 minutes.',
        duration: 10,
      },
      {
        stepNumber: 2,
        instruction: 'Heat sesame oil in a wok over high heat.',
        duration: 1,
      },
      {
        stepNumber: 3,
        instruction: 'Sauté aromatic vegetables until softened and fragrant, about 5-7 minutes.',
        duration: 7,
      },
      {
        stepNumber: 4,
        instruction: 'Add chicken and cook until no longer pink, about 5 minutes.',
        duration: 5,
      },
      {
        stepNumber: 5,
        instruction: 'Add vegetables and stir-fry for 3-4 minutes until crisp-tender.',
        duration: 4,
      },
    ],
    isFavorite: false,
    isInProgress: false,
  },
  {
    id: '5',
    title: 'Classic Margherita Pizza',
    image: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
    difficulty: 'Medium',
    cuisine: 'Italian',
    prepTime: 30,
    cookTime: 15,
    servings: 2,
    description: 'A classic Italian pizza with fresh mozzarella, basil, and tomato sauce.',
    ingredients: [
      { name: 'Pizza dough', amount: '1', unit: 'lb' },
      { name: 'Tomato sauce', amount: '1/2', unit: 'cup' },
      { name: 'Fresh mozzarella', amount: '8', unit: 'oz' },
      { name: 'Fresh basil', amount: '10', unit: 'leaves' },
      { name: 'Olive oil', amount: '2', unit: 'tbsp' },
      { name: 'Salt', amount: 'to taste' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Preheat oven to 475°F. Roll out pizza dough on a floured surface.',
        duration: 10,
      },
      {
        stepNumber: 2,
        instruction: 'Spread tomato sauce evenly over the dough, leaving a border.',
        duration: 2,
      },
      {
        stepNumber: 3,
        instruction: 'Top with sliced mozzarella and drizzle with olive oil.',
        duration: 3,
      },
      {
        stepNumber: 4,
        instruction: 'Bake for 12-15 minutes until crust is golden and cheese is bubbly.',
        duration: 15,
      },
      {
        stepNumber: 5,
        instruction: 'Remove from oven and top with fresh basil leaves before serving.',
        duration: 1,
      },
    ],
    isFavorite: false,
    isInProgress: true,
    currentStep: 1,
  },
  {
    id: '6',
    title: 'Beef Tacos',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80',
    difficulty: 'Easy',
    cuisine: 'Mexican',
    prepTime: 15,
    cookTime: 20,
    servings: 4,
    description: 'Delicious ground beef tacos with fresh toppings and warm tortillas.',
    ingredients: [
      { name: 'Ground beef', amount: '500', unit: 'g' },
      { name: 'Taco seasoning', amount: '1', unit: 'packet' },
      { name: 'Tortillas', amount: '8', unit: 'small' },
      { name: 'Lettuce', amount: '2', unit: 'cups' },
      { name: 'Tomatoes', amount: '2', unit: 'medium' },
      { name: 'Cheddar cheese', amount: '1', unit: 'cup' },
      { name: 'Sour cream', amount: '1/2', unit: 'cup' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Brown ground beef in a large skillet over medium-high heat.',
        duration: 8,
      },
      {
        stepNumber: 2,
        instruction: 'Add taco seasoning and water, simmer for 5 minutes.',
        duration: 5,
      },
      {
        stepNumber: 3,
        instruction: 'Warm tortillas in a dry pan or microwave.',
        duration: 2,
      },
      {
        stepNumber: 4,
        instruction: 'Fill tortillas with beef and top with lettuce, tomatoes, cheese, and sour cream.',
        duration: 5,
      },
    ],
    isFavorite: false,
    isInProgress: false,
  },
  {
    id: '7',
    title: 'Chocolate Chip Cookies',
    image: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?w=800',
    difficulty: 'Easy',
    cuisine: 'American',
    prepTime: 15,
    cookTime: 12,
    servings: 24,
    description: 'Classic homemade chocolate chip cookies that are crispy on the outside and chewy on the inside.',
    ingredients: [
      { name: 'Butter', amount: '1', unit: 'cup' },
      { name: 'Brown sugar', amount: '3/4', unit: 'cup' },
      { name: 'White sugar', amount: '3/4', unit: 'cup' },
      { name: 'Eggs', amount: '2', unit: 'large' },
      { name: 'Vanilla extract', amount: '2', unit: 'tsp' },
      { name: 'Flour', amount: '2 1/4', unit: 'cups' },
      { name: 'Baking soda', amount: '1', unit: 'tsp' },
      { name: 'Chocolate chips', amount: '2', unit: 'cups' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Preheat oven to 375°F. Cream butter and sugars until light and fluffy.',
        duration: 5,
      },
      {
        stepNumber: 2,
        instruction: 'Beat in eggs and vanilla extract.',
        duration: 2,
      },
      {
        stepNumber: 3,
        instruction: 'Mix in flour and baking soda until just combined.',
        duration: 3,
      },
      {
        stepNumber: 4,
        instruction: 'Stir in chocolate chips.',
        duration: 2,
      },
      {
        stepNumber: 5,
        instruction: 'Drop rounded tablespoons onto baking sheets and bake for 9-11 minutes.',
        duration: 11,
      },
    ],
    isFavorite: false,
    isInProgress: false,
  },
  {
    id: '8',
    title: 'Pad Thai',
    image: 'https://images.unsplash.com/photo-1559314809-0d155014e29e?w=800',
    difficulty: 'Medium',
    cuisine: 'Thai',
    prepTime: 20,
    cookTime: 15,
    servings: 4,
    description: 'Authentic Thai stir-fried noodles with tamarind, fish sauce, and fresh vegetables.',
    ingredients: [
      { name: 'Rice noodles', amount: '200', unit: 'g' },
      { name: 'Shrimp', amount: '300', unit: 'g' },
      { name: 'Tamarind paste', amount: '2', unit: 'tbsp' },
      { name: 'Fish sauce', amount: '2', unit: 'tbsp' },
      { name: 'Palm sugar', amount: '2', unit: 'tbsp' },
      { name: 'Bean sprouts', amount: '1', unit: 'cup' },
      { name: 'Peanuts', amount: '1/4', unit: 'cup' },
      { name: 'Lime', amount: '2', unit: 'wedges' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Soak rice noodles in warm water for 30 minutes until pliable.',
        duration: 30,
      },
      {
        stepNumber: 2,
        instruction: 'Mix tamarind paste, fish sauce, and palm sugar to make the sauce.',
        duration: 3,
      },
      {
        stepNumber: 3,
        instruction: 'Stir-fry shrimp in a wok until pink, then set aside.',
        duration: 5,
      },
      {
        stepNumber: 4,
        instruction: 'Add noodles and sauce to the wok, stir-fry for 3-4 minutes.',
        duration: 4,
      },
      {
        stepNumber: 5,
        instruction: 'Add bean sprouts and peanuts, serve with lime wedges.',
        duration: 2,
      },
    ],
    isFavorite: false,
    isInProgress: false,
  },
  {
    id: '9',
    title: 'Caesar Salad',
    image: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=800',
    difficulty: 'Easy',
    cuisine: 'American',
    prepTime: 10,
    cookTime: 5,
    servings: 4,
    description: 'Classic Caesar salad with crisp romaine, homemade croutons, and creamy dressing.',
    ingredients: [
      { name: 'Romaine lettuce', amount: '2', unit: 'heads' },
      { name: 'Parmesan cheese', amount: '1/2', unit: 'cup' },
      { name: 'Croutons', amount: '1', unit: 'cup' },
      { name: 'Anchovies', amount: '4', unit: 'fillets' },
      { name: 'Garlic', amount: '2', unit: 'cloves' },
      { name: 'Lemon juice', amount: '2', unit: 'tbsp' },
      { name: 'Olive oil', amount: '1/4', unit: 'cup' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Wash and chop romaine lettuce into bite-sized pieces.',
        duration: 5,
      },
      {
        stepNumber: 2,
        instruction: 'Make dressing by mashing anchovies and garlic, then whisking with lemon juice and olive oil.',
        duration: 3,
      },
      {
        stepNumber: 3,
        instruction: 'Toss lettuce with dressing, parmesan, and croutons.',
        duration: 2,
      },
    ],
    isFavorite: false,
    isInProgress: false,
  },
  {
    id: '10',
    title: 'Beef Stroganoff',
    image: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=800',
    difficulty: 'Medium',
    cuisine: 'Russian',
    prepTime: 15,
    cookTime: 30,
    servings: 4,
    description: 'Rich and creamy beef stroganoff with tender strips of beef and mushrooms.',
    ingredients: [
      { name: 'Beef sirloin', amount: '500', unit: 'g' },
      { name: 'Mushrooms', amount: '200', unit: 'g' },
      { name: 'Onion', amount: '1', unit: 'large' },
      { name: 'Sour cream', amount: '1/2', unit: 'cup' },
      { name: 'Beef broth', amount: '1', unit: 'cup' },
      { name: 'Flour', amount: '2', unit: 'tbsp' },
      { name: 'Butter', amount: '3', unit: 'tbsp' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Cut beef into thin strips and season with salt and pepper.',
        duration: 5,
      },
      {
        stepNumber: 2,
        instruction: 'Sauté mushrooms and onions in butter until golden.',
        duration: 8,
      },
      {
        stepNumber: 3,
        instruction: 'Add beef and cook until browned, about 5 minutes.',
        duration: 5,
      },
      {
        stepNumber: 4,
        instruction: 'Stir in flour, then add broth and simmer for 15 minutes.',
        duration: 15,
      },
      {
        stepNumber: 5,
        instruction: 'Stir in sour cream and heat through. Serve over egg noodles.',
        duration: 2,
      },
    ],
    isFavorite: false,
    isInProgress: false,
  },
  {
    id: '11',
    title: 'Vegetable Stir-Fry',
    image: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=800',
    difficulty: 'Easy',
    cuisine: 'Asian',
    prepTime: 15,
    cookTime: 10,
    servings: 4,
    description: 'Colorful mix of fresh vegetables stir-fried with a savory sauce.',
    ingredients: [
      { name: 'Broccoli', amount: '2', unit: 'cups' },
      { name: 'Carrots', amount: '2', unit: 'medium' },
      { name: 'Bell peppers', amount: '2', unit: 'medium' },
      { name: 'Snow peas', amount: '1', unit: 'cup' },
      { name: 'Soy sauce', amount: '3', unit: 'tbsp' },
      { name: 'Ginger', amount: '1', unit: 'tbsp' },
      { name: 'Garlic', amount: '3', unit: 'cloves' },
      { name: 'Sesame oil', amount: '1', unit: 'tbsp' },
    ],
    steps: [
      {
        stepNumber: 1,
        instruction: 'Cut all vegetables into uniform pieces.',
        duration: 10,
      },
      {
        stepNumber: 2,
        instruction: 'Heat sesame oil in a wok over high heat.',
        duration: 1,
      },
      {
        stepNumber: 3,
        instruction: 'Stir-fry vegetables with ginger and garlic for 5-7 minutes.',
        duration: 7,
      },
      {
        stepNumber: 4,
        instruction: 'Add soy sauce and toss to combine. Serve immediately.',
        duration: 2,
      },
    ],
    isFavorite: false,
    isInProgress: false,
  },
]

export const getRecipeById = (id: string): Recipe | undefined => {
  return mockRecipes.find(recipe => recipe.id === id)
}

export const getRecipesInProgress = (): Recipe[] => {
  return mockRecipes.filter(recipe => recipe.isInProgress)
}

export const getFavoriteRecipes = (): Recipe[] => {
  return mockRecipes.filter(recipe => recipe.isFavorite)
}

