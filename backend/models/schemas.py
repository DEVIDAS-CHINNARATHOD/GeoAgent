from pydantic import BaseModel, Field
from typing import Optional, List, Any
from enum import Enum


class InterestCategory(str, Enum):
    HISTORY = "history"
    FOOD = "food"
    NATURE = "nature"
    ADVENTURE = "adventure"
    CULTURE = "culture"
    SHOPPING = "shopping"
    NIGHTLIFE = "nightlife"


class BudgetLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class UserProfile(BaseModel):
    budget: BudgetLevel = BudgetLevel.MEDIUM
    interests: List[InterestCategory] = Field(default_factory=list)
    travel_style: Optional[str] = None


class ChatRequest(BaseModel):
    query: str = Field(..., min_length=1, max_length=2000)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    user_profile: Optional[UserProfile] = None
    session_id: Optional[str] = None


class ChatResponse(BaseModel):
    answer: str
    sources: List[str] = Field(default_factory=list)
    agent_trace: List[str] = Field(default_factory=list)
    session_id: Optional[str] = None


class PlanRequest(BaseModel):
    destination: str = Field(..., min_length=1)
    days: int = Field(default=3, ge=1, le=30)
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    user_profile: Optional[UserProfile] = None


class ItineraryDay(BaseModel):
    day: int
    theme: str
    activities: List[str]
    meals: List[str]
    tips: List[str]


class PlanResponse(BaseModel):
    destination: str
    days: int
    itinerary: List[ItineraryDay]
    safety_notes: List[str]
    weather_summary: Optional[str] = None
    agent_trace: List[str] = Field(default_factory=list)


class NearbyRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = Field(default=5.0, ge=0.5, le=50.0)
    categories: Optional[List[str]] = None


class NearbyPlace(BaseModel):
    name: str
    category: str
    address: Optional[str] = None
    distance_km: Optional[float] = None
    rating: Optional[float] = None
    description: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None


class NearbyResponse(BaseModel):
    places: List[NearbyPlace]
    total: int
    location: dict


class WeatherInfo(BaseModel):
    temperature: float
    condition: str
    humidity: Optional[int] = None
    wind_speed: Optional[float] = None
    description: str


class SafetyInfo(BaseModel):
    risk_level: str
    warnings: List[str]
    recommendations: List[str]


class ExportRequest(BaseModel):
    plan: PlanResponse
    include_map: bool = False


class AgentMessage(BaseModel):
    agent: str
    status: str
    output: Any
