'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface UseDriverRealtimeReturn {
  isConnected: boolean
}

export function useDriverRealtime(
  storeId: string | null,
  onNewDelivery: () => void,
  soundEnabled: boolean = true
): UseDriverRealtimeReturn {
  const [isConnected, setIsConnected] = useState(false)
  const lastCountRef = useRef(0)

  const playNotificationSound = useCallback(() => {
    if (!soundEnabled) return

    try {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
      const audioContext = new AudioContextClass()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()

      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)

      oscillator.frequency.value = 800
      oscillator.type = 'sine'
      gainNode.gain.value = 0.3

      oscillator.start()
      setTimeout(() => {
        oscillator.stop()
        audioContext.close()
      }, 200)

      // Segundo beep
      setTimeout(() => {
        const audioContext2 = new AudioContextClass()
        const oscillator2 = audioContext2.createOscillator()
        const gainNode2 = audioContext2.createGain()

        oscillator2.connect(gainNode2)
        gainNode2.connect(audioContext2.destination)

        oscillator2.frequency.value = 1000
        oscillator2.type = 'sine'
        gainNode2.gain.value = 0.3

        oscillator2.start()
        setTimeout(() => {
          oscillator2.stop()
          audioContext2.close()
        }, 200)
      }, 250)
    } catch (err) {
      console.log('Erro ao tocar som:', err)
    }
  }, [soundEnabled])

  useEffect(() => {
    if (!storeId) return

    const supabase = createClient()
    const channel = supabase
      .channel('driver-deliveries')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'deliveries',
          filter: `store_id=eq.${storeId}`
        },
        (payload: { eventType: string }) => {
          console.log('Delivery change:', payload)

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            playNotificationSound()
          }

          onNewDelivery()
        }
      )
      .subscribe((status: string) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, onNewDelivery, playNotificationSound])

  return { isConnected }
}
