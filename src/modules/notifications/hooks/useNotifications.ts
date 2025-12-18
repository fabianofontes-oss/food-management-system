'use client'

/**
 * Hook para gerenciar notificações in-app com Realtime
 */

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { Notification, NotificationState } from '../types'

export function useNotifications(storeId: string | null) {
  const [state, setState] = useState<NotificationState>({
    notifications: [],
    unreadCount: 0,
    isLoading: true,
  })

  const supabase = createClient()

  // Carregar notificações iniciais
  const loadNotifications = useCallback(async () => {
    if (!storeId) return

    setState(prev => ({ ...prev, isLoading: true }))

    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('store_id', storeId)
      .order('created_at', { ascending: false })
      .limit(50)

    if (!error && data) {
      const notifications = data.map((n: Record<string, unknown>) => ({
        id: n.id,
        storeId: n.store_id,
        type: n.type,
        title: n.title,
        message: n.message,
        data: n.data,
        read: n.read,
        createdAt: n.created_at,
      })) as Notification[]

      setState({
        notifications,
        unreadCount: notifications.filter(n => !n.read).length,
        isLoading: false,
      })
    } else {
      setState(prev => ({ ...prev, isLoading: false }))
    }
  }, [storeId, supabase])

  // Marcar como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ),
      unreadCount: Math.max(0, prev.unreadCount - 1),
    }))
  }, [supabase])

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!storeId) return

    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('store_id', storeId)
      .eq('read', false)

    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }))
  }, [storeId, supabase])

  // Subscribe to realtime
  useEffect(() => {
    if (!storeId) return

    loadNotifications()

    // Realtime subscription
    const channel = supabase
      .channel(`notifications:${storeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `store_id=eq.${storeId}`,
        },
        (payload: { new: Record<string, unknown> }) => {
          const n = payload.new
          const newNotification: Notification = {
            id: n.id as string,
            storeId: n.store_id as string,
            type: n.type as Notification['type'],
            title: n.title as string,
            message: n.message as string,
            data: n.data as Record<string, unknown> | undefined,
            read: n.read as boolean,
            createdAt: n.created_at as string,
          }

          setState(prev => ({
            ...prev,
            notifications: [newNotification, ...prev.notifications],
            unreadCount: prev.unreadCount + 1,
          }))
        }
      )
      .subscribe()

    // Cleanup
    return () => {
      supabase.removeChannel(channel)
    }
  }, [storeId, supabase, loadNotifications])

  return {
    ...state,
    markAsRead,
    markAllAsRead,
    refresh: loadNotifications,
  }
}
