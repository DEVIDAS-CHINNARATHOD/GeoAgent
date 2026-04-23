export type BudgetLevel = 'low' | 'medium' | 'high'

export type InterestCategory =
  | 'history'
  | 'food'
  | 'nature'
  | 'adventure'
  | 'culture'
  | 'shopping'
  | 'nightlife'

export interface UserProfile {
  budget: BudgetLevel
  interests: InterestCategory[]
  travel_style?: string
}

// Chat
export interface ChatRequest {
  query: string
  latitude?: number
  longitude?: number
  user_profile?: UserProfile
  session_id?: string
}

export interface ChatResponse {
  answer: string
  sources: string[]
  agent_trace: string[]
  session_id?: string
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  sources?: string[]
  agent_trace?: string[]
  isLoading?: boolean
}

// Plan
export interface PlanRequest {
  destination: string
  days: number
  latitude?: number
  longitude?: number
  user_profile?: UserProfile
}

export interface ItineraryDay {
  day: number
  theme: string
  activities: string[]
  meals: string[]
  tips: string[]
}

export interface PlanResponse {
  destination: string
  days: number
  itinerary: ItineraryDay[]
  safety_notes: string[]
  weather_summary?: string
  agent_trace: string[]
}

// Nearby
export interface NearbyRequest {
  latitude: number
  longitude: number
  radius_km?: number
  categories?: string[]
}

export interface NearbyPlace {
  name: string
  category: string
  address?: string
  distance_km?: number
  rating?: number
  description?: string
  latitude?: number
  longitude?: number
}

export interface NearbyResponse {
  places: NearbyPlace[]
  total: number
  location: { latitude: number; longitude: number }
}

// Export
export interface ExportRequest {
  plan: PlanResponse
  include_map: boolean
}

// UI state
export type ActiveTab = 'chat' | 'plan' | 'nearby'
export type LoadingState = 'idle' | 'loading' | 'success' | 'error'
