import React, { useState } from 'react'
import { MapPin, Star, Navigation, Search, Coffee, Landmark, ShoppingBag, Trees, Moon } from 'lucide-react'
import { api } from '../api/client'
import { useLocation } from '../hooks/useLocation'
import type { NearbyPlace, NearbyResponse } from '../types'
import clsx from 'clsx'

const CATEGORIES = [
  { id: 'attractions', label: 'Attractions', icon: Landmark },
  { id: 'food', label: 'Food', icon: Coffee },
  { id: 'nature', label: 'Nature', icon: Trees },
  { id: 'shopping', label: 'Shopping', icon: ShoppingBag },
  { id: 'nightlife', label: 'Nightlife', icon: Moon },
]

function PlaceCard({ place }: { place: NearbyPlace }) {
  return (
    <div className="glass-panel rounded-2xl p-4 hover:bg-white/[0.05] transition-all duration-200 group">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-medium text-text-primary truncate group-hover:text-white transition-colors">
            {place.name}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/[0.06] border border-white/[0.08] text-text-tertiary">
              {place.category}
            </span>
            {place.distance_km != null && (
              <span className="text-[11px] text-text-tertiary flex items-center gap-1">
                <Navigation className="w-2.5 h-2.5" />
                {place.distance_km} km
              </span>
            )}
          </div>
          {place.address && (
            <p className="text-xs text-text-tertiary mt-1.5 flex items-start gap-1.5">
              <MapPin className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="truncate">{place.address}</span>
            </p>
          )}
          {place.description && (
            <p className="text-xs text-text-secondary mt-2 leading-relaxed line-clamp-2">
              {place.description}
            </p>
          )}
        </div>
        {place.rating != null && (
          <div className="flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded-xl bg-accent-amber/10 border border-accent-amber/20">
            <Star className="w-3 h-3 text-accent-amber fill-accent-amber" />
            <span className="text-xs font-semibold text-accent-amber">{place.rating.toFixed(1)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="glass-panel rounded-2xl p-4">
      <div className="shimmer-bg h-4 rounded-lg w-3/4 mb-2" />
      <div className="shimmer-bg h-3 rounded-lg w-1/3 mb-3" />
      <div className="shimmer-bg h-3 rounded-lg w-full mb-1.5" />
      <div className="shimmer-bg h-3 rounded-lg w-4/5" />
    </div>
  )
}

export const NearbyPanel: React.FC = () => {
  const { latitude, longitude, hasLocation, loading: locLoading, requestLocation } = useLocation()
  const [selectedCats, setSelectedCats] = useState<string[]>(['attractions', 'food'])
  const [radius, setRadius] = useState(5)
  const [result, setResult] = useState<NearbyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const toggleCategory = (id: string) => {
    setSelectedCats((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    )
  }

  const handleSearch = async () => {
    if (!hasLocation) {
      requestLocation()
      return
    }
    setLoading(true)
    setError(null)
    try {
      const data = await api.nearby({
        latitude: latitude!,
        longitude: longitude!,
        radius_km: radius,
        categories: selectedCats.length > 0 ? selectedCats : undefined,
      })
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch nearby places')
    } finally {
      setLoading(false)
    }
  }

  const filteredPlaces = result?.places ?? []

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-text-primary tracking-tight">Nearby Explorer</h2>
        <p className="text-xs text-text-tertiary mt-0.5">Discover places around your location</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Location status */}
        {!hasLocation ? (
          <div className="glass-panel rounded-2xl p-5 flex flex-col items-center text-center">
            <div className="w-12 h-12 rounded-2xl bg-accent-blue/10 border border-accent-blue/20 flex items-center justify-center mb-3">
              <MapPin className="w-5 h-5 text-accent-blue" />
            </div>
            <p className="text-sm font-medium text-text-primary mb-1">Location Required</p>
            <p className="text-xs text-text-tertiary mb-4 max-w-xs">
              Allow location access to discover nearby attractions, restaurants, and more.
            </p>
            <button
              onClick={requestLocation}
              disabled={locLoading}
              className="btn-primary px-5 py-2 rounded-xl text-sm font-medium flex items-center gap-2"
            >
              <Navigation className="w-4 h-4" />
              {locLoading ? 'Detecting Location...' : 'Enable Location'}
            </button>
          </div>
        ) : (
          <>
            {/* Location confirmed */}
            <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-accent-green/8 border border-accent-green/20">
              <div className="w-2 h-2 rounded-full bg-accent-green animate-pulse" />
              <span className="text-xs text-accent-green">
                Location active — {latitude!.toFixed(4)}, {longitude!.toFixed(4)}
              </span>
            </div>

            {/* Category filters */}
            <div>
              <p className="text-xs font-medium text-text-secondary mb-2">Categories</p>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => toggleCategory(id)}
                    className={clsx(
                      'flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all duration-150',
                      selectedCats.includes(id)
                        ? 'bg-accent-blue/15 border-accent-blue/35 text-accent-blue'
                        : 'glass-panel text-text-secondary hover:text-text-primary hover:border-white/15'
                    )}
                  >
                    <Icon className="w-3 h-3" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Radius */}
            <div>
              <p className="text-xs font-medium text-text-secondary mb-1.5">
                Search radius — {radius} km
              </p>
              <input
                type="range"
                min={1}
                max={20}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full accent-accent-blue h-1.5 rounded-full cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
                <span>1 km</span>
                <span>10 km</span>
                <span>20 km</span>
              </div>
            </div>

            <button
              onClick={handleSearch}
              disabled={loading}
              className="btn-primary w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="flex gap-1">
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                    <span className="typing-dot" />
                  </span>
                  <span>Searching...</span>
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Search Nearby
                </>
              )}
            </button>
          </>
        )}

        {/* Error */}
        {error && (
          <div className="px-3.5 py-2.5 rounded-xl bg-accent-red/10 border border-accent-red/20">
            <p className="text-xs text-accent-red">{error}</p>
          </div>
        )}

        {/* Loading skeletons */}
        {loading && (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        )}

        {/* Results */}
        {!loading && result && (
          <div className="space-y-3 animate-fade-up">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium text-text-secondary">
                {result.total} places found
              </p>
              <p className="text-[11px] text-text-tertiary">within {radius} km</p>
            </div>

            {filteredPlaces.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-text-tertiary">No places found in this area.</p>
                <p className="text-xs text-text-tertiary mt-1">Try increasing the radius.</p>
              </div>
            ) : (
              filteredPlaces.map((place, i) => (
                <div key={i} className="animate-fade-up" style={{ animationDelay: `${i * 40}ms` }}>
                  <PlaceCard place={place} />
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  )
}
