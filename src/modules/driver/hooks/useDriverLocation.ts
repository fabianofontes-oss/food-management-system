'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Location {
  latitude: number
  longitude: number
  accuracy: number
  timestamp: number
}

interface UseDriverLocationOptions {
  deliveryId: string
  enabled?: boolean
  updateInterval?: number // em milissegundos
}

/**
 * Hook para compartilhar localização do motorista em tempo real
 */
export function useDriverLocation({ 
  deliveryId, 
  enabled = true,
  updateInterval = 10000 // 10 segundos
}: UseDriverLocationOptions) {
  const [location, setLocation] = useState<Location | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isTracking, setIsTracking] = useState(false)
  const [watchId, setWatchId] = useState<number | null>(null)

  const supabase = createClient()

  // Envia localização para o banco
  const sendLocation = useCallback(async (loc: Location) => {
    try {
      await supabase
        .from('deliveries')
        .update({
          driver_latitude: loc.latitude,
          driver_longitude: loc.longitude,
          driver_location_updated_at: new Date().toISOString()
        })
        .eq('id', deliveryId)
    } catch (err) {
      console.error('Erro ao enviar localização:', err)
    }
  }, [deliveryId, supabase])

  // Inicia o rastreamento
  const startTracking = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocalização não suportada')
      return
    }

    setIsTracking(true)
    setError(null)

    const id = navigator.geolocation.watchPosition(
      (position) => {
        const newLocation: Location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp
        }
        setLocation(newLocation)
        sendLocation(newLocation)
      },
      (err) => {
        console.error('Erro de geolocalização:', err)
        switch (err.code) {
          case err.PERMISSION_DENIED:
            setError('Permissão de localização negada')
            break
          case err.POSITION_UNAVAILABLE:
            setError('Localização indisponível')
            break
          case err.TIMEOUT:
            setError('Tempo esgotado')
            break
          default:
            setError('Erro desconhecido')
        }
        setIsTracking(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: updateInterval
      }
    )

    setWatchId(id)
  }, [sendLocation, updateInterval])

  // Para o rastreamento
  const stopTracking = useCallback(() => {
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId)
      setWatchId(null)
    }
    setIsTracking(false)
  }, [watchId])

  // Inicia/para baseado no enabled
  useEffect(() => {
    if (enabled) {
      startTracking()
    } else {
      stopTracking()
    }

    return () => {
      stopTracking()
    }
  }, [enabled])

  return {
    location,
    error,
    isTracking,
    startTracking,
    stopTracking
  }
}

/**
 * Hook para observar localização do motorista (lado do cliente)
 */
export function useWatchDriverLocation(deliveryId: string) {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)
  
  const supabase = createClient()

  useEffect(() => {
    if (!deliveryId) return

    // Buscar localização inicial
    async function fetchLocation() {
      const { data } = await supabase
        .from('deliveries')
        .select('driver_latitude, driver_longitude, driver_location_updated_at')
        .eq('id', deliveryId)
        .single()

      if (data?.driver_latitude && data?.driver_longitude) {
        setLocation({
          lat: data.driver_latitude,
          lng: data.driver_longitude
        })
        if (data.driver_location_updated_at) {
          setLastUpdate(new Date(data.driver_location_updated_at))
        }
      }
    }

    fetchLocation()

    // Subscrever para atualizações em tempo real
    const channel = supabase
      .channel(`driver-location-${deliveryId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'deliveries',
          filter: `id=eq.${deliveryId}`
        },
        (payload: { new: { driver_latitude?: number; driver_longitude?: number; driver_location_updated_at?: string } }) => {
          const newData = payload.new
          if (newData.driver_latitude && newData.driver_longitude) {
            setLocation({
              lat: newData.driver_latitude,
              lng: newData.driver_longitude
            })
            if (newData.driver_location_updated_at) {
              setLastUpdate(new Date(newData.driver_location_updated_at))
            }
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [deliveryId, supabase])

  return { location, lastUpdate }
}
