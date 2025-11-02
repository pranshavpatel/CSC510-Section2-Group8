// Mock data for VibeDish MVP

export interface SurplusItem {
  id: number
  restaurant: string
  name: string
  price: number
  originalPrice: number
  discount: number
  lat: number
  lng: number
  cuisine: string
  image: string
  description: string
}

export interface MoodRecommendation {
  id: number
  name: string
  mood: string
  restaurant: string
  price: number
  image: string
  description: string
}

export interface Restaurant {
  id: number
  name: string
  lat: number
  lng: number
  cuisine: string
  rating: number
}

export const surplusItems: SurplusItem[] = [
  {
    id: 1,
    restaurant: "GreenBite Cafe",
    name: "Vegan Buddha Bowl",
    price: 400,
    originalPrice: 800,
    discount: 50,
    lat: 28.6139,
    lng: 77.209,
    cuisine: "Vegan",
    image: "/vegan-buddha-bowl-colorful-vegetables.jpg",
    description: "Fresh seasonal vegetables with quinoa and tahini dressing",
  },
  {
    id: 2,
    restaurant: "PizzaHub",
    name: "Margherita Pizza",
    price: 360,
    originalPrice: 600,
    discount: 40,
    lat: 28.624,
    lng: 77.212,
    cuisine: "Italian",
    image: "/margherita-pizza-fresh-basil.jpg",
    description: "Classic Italian pizza with fresh mozzarella and basil",
  },
  {
    id: 3,
    restaurant: "SoupStop",
    name: "Tomato Basil Soup",
    price: 180,
    originalPrice: 300,
    discount: 40,
    lat: 28.618,
    lng: 77.215,
    cuisine: "Comfort Food",
    image: "/tomato-basil-soup-bowl.jpg",
    description: "Creamy tomato soup with fresh basil and croutons",
  },
  {
    id: 4,
    restaurant: "CreamyCloud",
    name: "Artisan Ice Cream",
    price: 150,
    originalPrice: 250,
    discount: 40,
    lat: 28.621,
    lng: 77.208,
    cuisine: "Dessert",
    image: "/artisan-ice-cream-cone-colorful.jpg",
    description: "Handcrafted ice cream with natural ingredients",
  },
  {
    id: 5,
    restaurant: "Spice Route",
    name: "Butter Chicken",
    price: 450,
    originalPrice: 750,
    discount: 40,
    lat: 28.616,
    lng: 77.211,
    cuisine: "Indian",
    image: "/butter-chicken-curry-rice.jpg",
    description: "Rich and creamy butter chicken with naan bread",
  },
  {
    id: 6,
    restaurant: "Fresh Bowl",
    name: "Acai Bowl",
    price: 320,
    originalPrice: 550,
    discount: 42,
    lat: 28.619,
    lng: 77.213,
    cuisine: "Healthy",
    image: "/acai-bowl-berries-granola.jpg",
    description: "Acai smoothie bowl topped with fresh fruits and granola",
  },
]

export const moodRecommendations: MoodRecommendation[] = [
  {
    id: 1,
    name: "Comfort Tomato Soup",
    mood: "Sad",
    restaurant: "SoupStop",
    price: 300,
    image: "/comfort-tomato-soup-warm.jpg",
    description: "Warm and comforting soup to lift your spirits",
  },
  {
    id: 2,
    name: "Celebration Ice Cream",
    mood: "Happy",
    restaurant: "CreamyCloud",
    price: 250,
    image: "/celebration-ice-cream-sundae.jpg",
    description: "Sweet treat to celebrate your good mood",
  },
  {
    id: 3,
    name: "Energy Buddha Bowl",
    mood: "Energetic",
    restaurant: "GreenBite Cafe",
    price: 550,
    image: "/energy-bowl-colorful-healthy.jpg",
    description: "Nutrient-packed bowl to fuel your energy",
  },
  {
    id: 4,
    name: "Cozy Pasta",
    mood: "Relaxed",
    restaurant: "PizzaHub",
    price: 450,
    image: "/cozy-pasta-comfort-food.jpg",
    description: "Comforting pasta for a relaxed evening",
  },
]

export const restaurants: Restaurant[] = [
  { id: 1, name: "GreenBite Cafe", lat: 28.6139, lng: 77.209, cuisine: "Vegan", rating: 4.5 },
  { id: 2, name: "PizzaHub", lat: 28.624, lng: 77.212, cuisine: "Italian", rating: 4.3 },
  { id: 3, name: "SoupStop", lat: 28.618, lng: 77.215, cuisine: "Comfort Food", rating: 4.6 },
  { id: 4, name: "CreamyCloud", lat: 28.621, lng: 77.208, cuisine: "Dessert", rating: 4.7 },
  { id: 5, name: "Spice Route", lat: 28.616, lng: 77.211, cuisine: "Indian", rating: 4.4 },
  { id: 6, name: "Fresh Bowl", lat: 28.619, lng: 77.213, cuisine: "Healthy", rating: 4.5 },
]
