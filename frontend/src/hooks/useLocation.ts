import { useState, useCallback } from 'react'

interface LocationState {
  latitude: number | null
  longitude: number | null
  error: string | null
  loading: boolean
}

export function useLocation() {
  const [state, setState] = useState<LocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  })

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation is not supported by your browser.' }))
      return
    }

    setState((s) => ({ ...s, loading: true, error: null }))

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setState({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          error: null,
          loading: false,
        })
      },
      (err) => {
        setState((s) => ({
          ...s,
          error: `Location access denied: ${err.message}`,
          loading: false,
        }))
      },
      { timeout: 10000, enableHighAccuracy: true }
    )
  }, [])

  const clearLocation = useCallback(() => {
    setState({ latitude: null, longitude: null, error: null, loading: false })
  }, [])

  const hasLocation = state.latitude !== null && state.longitude !== null

  return { ...state, hasLocation, requestLocation, clearLocation }
}
