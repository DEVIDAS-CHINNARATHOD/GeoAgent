import React, { useState } from 'react'
import { Calendar, MapPin, Utensils, Lightbulb, Download, ChevronDown, ChevronUp, AlertTriangle, Cloud } from 'lucide-react'
import { api } from '../api/client'
import type { PlanResponse, PlanRequest, UserProfile, ItineraryDay } from '../types'

interface Props {
  userProfile?: UserProfile
}

function DayCard({ day, isOpen, onToggle }: { day: ItineraryDay; isOpen: boolean; onToggle: () => void }) {
  return (
    <div className="glass-panel rounded-2xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3.5 flex items-center justify-between text-left hover:bg-white/[0.03] transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-accent-blue/15 border border-accent-blue/25 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-accent-blue">{day.day}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-text-primary">{day.theme}</p>
            <p className="text-[11px] text-text-tertiary mt-0.5">
              {day.activities.length} activities · {day.meals.length} meals
            </p>
          </div>
        </div>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-text-tertiary flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-text-tertiary flex-shrink-0" />
        )}
      </button>

      {isOpen && (
        <div className="border-t border-white/[0.06] px-4 pb-4 space-y-3 animate-fade-up">
          {day.activities.length > 0 && (
            <div className="pt-3">
              <div className="flex items-center gap-1.5 mb-2">
                <MapPin className="w-3.5 h-3.5 text-accent-cyan" />
                <span className="text-[11px] font-semibold text-accent-cyan uppercase tracking-wider">Activities</span>
              </div>
              <ul className="space-y-1.5">
                {day.activities.map((a, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                    <span className="text-text-tertiary mt-0.5">–</span>
                    {a}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {day.meals.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Utensils className="w-3.5 h-3.5 text-accent-amber" />
                <span className="text-[11px] font-semibold text-accent-amber uppercase tracking-wider">Dining</span>
              </div>
              <ul className="space-y-1.5">
                {day.meals.map((m, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                    <span className="text-text-tertiary mt-0.5">–</span>
                    {m}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {day.tips.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2">
                <Lightbulb className="w-3.5 h-3.5 text-accent-green" />
                <span className="text-[11px] font-semibold text-accent-green uppercase tracking-wider">Tips</span>
              </div>
              <ul className="space-y-1.5">
                {day.tips.map((t, i) => (
                  <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                    <span className="text-text-tertiary mt-0.5">–</span>
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export const ItineraryPanel: React.FC<Props> = ({ userProfile }) => {
  const [destination, setDestination] = useState('')
  const [days, setDays] = useState(3)
  const [plan, setPlan] = useState<PlanResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openDays, setOpenDays] = useState<Set<number>>(new Set([1]))
  const [exporting, setExporting] = useState(false)

  const handleGenerate = async () => {
    if (!destination.trim()) return
    setLoading(true)
    setError(null)
    setPlan(null)
    try {
      const req: PlanRequest = {
        destination: destination.trim(),
        days,
        user_profile: userProfile,
      }
      const result = await api.plan(req)
      setPlan(result)
      setOpenDays(new Set([1]))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate plan')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    if (!plan) return
    setExporting(true)
    try {
      const blob = await api.exportPlan({ plan, include_map: false })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${plan.destination.replace(/\s+/g, '_').toLowerCase()}_itinerary.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      setError('PDF export failed. Ensure the backend has reportlab installed.')
    } finally {
      setExporting(false)
    }
  }

  const toggleDay = (day: number) => {
    setOpenDays((prev) => {
      const next = new Set(prev)
      if (next.has(day)) next.delete(day)
      else next.add(day)
      return next
    })
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-5 py-4 border-b border-white/[0.06]">
        <h2 className="text-sm font-semibold text-text-primary tracking-tight">Travel Planner</h2>
        <p className="text-xs text-text-tertiary mt-0.5">Generate a detailed multi-day itinerary</p>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {/* Form */}
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">Destination</label>
            <input
              type="text"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleGenerate()}
              placeholder="Bangalore, Goa, Jaipur..."
              className="input-base w-full px-3.5 py-2.5 rounded-xl text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-text-secondary mb-1.5">
              Duration — {days} {days === 1 ? 'day' : 'days'}
            </label>
            <input
              type="range"
              min={1}
              max={14}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full accent-accent-blue h-1.5 rounded-full cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-text-tertiary mt-1">
              <span>1</span>
              <span>7</span>
              <span>14</span>
            </div>
          </div>
          <button
            onClick={handleGenerate}
            disabled={!destination.trim() || loading}
            className="btn-primary w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="flex gap-1">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
                <span>Planning...</span>
              </>
            ) : (
              <>
                <Calendar className="w-4 h-4" />
                Generate Itinerary
              </>
            )}
          </button>
        </div>

        {error && (
          <div className="px-3.5 py-2.5 rounded-xl bg-accent-red/10 border border-accent-red/20">
            <p className="text-xs text-accent-red">{error}</p>
          </div>
        )}

        {plan && (
          <div className="space-y-4 animate-fade-up">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-semibold text-text-primary">{plan.destination}</h3>
                <p className="text-xs text-text-tertiary">{plan.days}-day itinerary</p>
              </div>
              <button
                onClick={handleExport}
                disabled={exporting}
                className="btn-ghost px-3 py-1.5 rounded-xl text-xs flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                {exporting ? 'Exporting...' : 'Export PDF'}
              </button>
            </div>

            {/* Weather */}
            {plan.weather_summary && (
              <div className="flex items-start gap-2.5 px-3.5 py-3 rounded-xl glass-panel">
                <Cloud className="w-4 h-4 text-accent-cyan flex-shrink-0 mt-0.5" />
                <p className="text-xs text-text-secondary leading-relaxed">{plan.weather_summary}</p>
              </div>
            )}

            {/* Safety */}
            {plan.safety_notes.length > 0 && (
              <div className="px-3.5 py-3 rounded-xl bg-accent-amber/8 border border-accent-amber/20">
                <div className="flex items-center gap-1.5 mb-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-accent-amber" />
                  <span className="text-[11px] font-semibold text-accent-amber uppercase tracking-wider">Safety Notes</span>
                </div>
                <ul className="space-y-1">
                  {plan.safety_notes.slice(0, 4).map((note, i) => (
                    <li key={i} className="text-xs text-text-secondary flex items-start gap-2">
                      <span className="text-accent-amber mt-0.5">–</span>
                      {note}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Days */}
            <div className="space-y-2">
              {plan.itinerary.map((day) => (
                <DayCard
                  key={day.day}
                  day={day}
                  isOpen={openDays.has(day.day)}
                  onToggle={() => toggleDay(day.day)}
                />
              ))}
            </div>

            {/* Agent trace */}
            {plan.agent_trace.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {plan.agent_trace.map((a, i) => (
                  <span key={i} className="text-[10px] px-2 py-0.5 rounded-full border border-white/8 text-text-tertiary font-mono">
                    {a}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
