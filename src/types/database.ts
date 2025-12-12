export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          name: string
          slug: string
          price_monthly_cents: number
          price_yearly_cents: number | null
          currency: string
          features: Json | null
          limits: Json | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          price_monthly_cents?: number
          price_yearly_cents?: number | null
          currency?: string
          features?: Json | null
          limits?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          price_monthly_cents?: number
          price_yearly_cents?: number | null
          currency?: string
          features?: Json | null
          limits?: Json | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      tenant_subscriptions: {
        Row: {
          id: string
          tenant_id: string
          plan_id: string
          status: string
          renew_period: string
          current_period_start: string
          current_period_end: string | null
          trial_ends_at: string | null
          cancel_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          plan_id: string
          status?: string
          renew_period?: string
          current_period_start?: string
          current_period_end?: string | null
          trial_ends_at?: string | null
          cancel_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          plan_id?: string
          status?: string
          renew_period?: string
          current_period_start?: string
          current_period_end?: string | null
          trial_ends_at?: string | null
          cancel_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      stores: {
        Row: {
          id: string
          tenant_id: string
          name: string
          slug: string
          niche: 'acai' | 'burger' | 'hotdog' | 'marmita' | 'butcher' | 'ice_cream' | 'other'
          mode: 'store' | 'home'
          is_active: boolean
          logo_url: string | null
          banner_url: string | null
          phone: string | null
          whatsapp: string | null
          address: string | null
          latitude: number | null
          longitude: number | null
          settings: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tenant_id: string
          name: string
          slug: string
          niche: 'acai' | 'burger' | 'hotdog' | 'marmita' | 'butcher' | 'ice_cream' | 'other'
          mode: 'store' | 'home'
          is_active?: boolean
          logo_url?: string | null
          banner_url?: string | null
          phone?: string | null
          whatsapp?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          tenant_id?: string
          name?: string
          slug?: string
          niche?: 'acai' | 'burger' | 'hotdog' | 'marmita' | 'butcher' | 'ice_cream' | 'other'
          mode?: 'store' | 'home'
          is_active?: boolean
          logo_url?: string | null
          banner_url?: string | null
          phone?: string | null
          whatsapp?: string | null
          address?: string | null
          latitude?: number | null
          longitude?: number | null
          settings?: Json | null
          created_at?: string
          updated_at?: string
        }
      }
      users: {
        Row: {
          id: string
          name: string
          email: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          created_at?: string
          updated_at?: string
        }
      }
      store_users: {
        Row: {
          id: string
          store_id: string
          user_id: string
          role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'KITCHEN' | 'DELIVERY'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          user_id: string
          role: 'OWNER' | 'MANAGER' | 'CASHIER' | 'KITCHEN' | 'DELIVERY'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          user_id?: string
          role?: 'OWNER' | 'MANAGER' | 'CASHIER' | 'KITCHEN' | 'DELIVERY'
          created_at?: string
          updated_at?: string
        }
      }
      categories: {
        Row: {
          id: string
          store_id: string
          name: string
          description: string | null
          sort_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          description?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          description?: string | null
          sort_order?: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      products: {
        Row: {
          id: string
          store_id: string
          category_id: string
          name: string
          description: string | null
          base_price: number
          unit_type: 'unit' | 'weight'
          price_per_unit: number | null
          image_url: string | null
          is_active: boolean
          stock_quantity: number | null
          track_inventory: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          category_id: string
          name: string
          description?: string | null
          base_price?: number
          unit_type: 'unit' | 'weight'
          price_per_unit?: number | null
          image_url?: string | null
          is_active?: boolean
          stock_quantity?: number | null
          track_inventory?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          category_id?: string
          name?: string
          description?: string | null
          base_price?: number
          unit_type?: 'unit' | 'weight'
          price_per_unit?: number | null
          image_url?: string | null
          is_active?: boolean
          stock_quantity?: number | null
          track_inventory?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          store_id: string
          customer_id: string | null
          table_id: string | null
          code: string
          channel: 'COUNTER' | 'DELIVERY' | 'TAKEAWAY'
          status: 'PENDING' | 'ACCEPTED' | 'IN_PREPARATION' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
          subtotal_amount: number
          discount_amount: number
          delivery_fee: number | null
          total_amount: number
          payment_method: 'PIX' | 'CASH' | 'CARD' | 'ONLINE'
          coupon_id: string | null
          delivery_address_id: string | null
          notes: string | null
          cash_register_id: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          customer_id?: string | null
          table_id?: string | null
          code: string
          channel: 'COUNTER' | 'DELIVERY' | 'TAKEAWAY'
          status: 'PENDING' | 'ACCEPTED' | 'IN_PREPARATION' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
          subtotal_amount?: number
          discount_amount?: number
          delivery_fee?: number | null
          total_amount?: number
          payment_method: 'PIX' | 'CASH' | 'CARD' | 'ONLINE'
          coupon_id?: string | null
          delivery_address_id?: string | null
          notes?: string | null
          cash_register_id?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          customer_id?: string | null
          table_id?: string | null
          code?: string
          channel?: 'COUNTER' | 'DELIVERY' | 'TAKEAWAY'
          status?: 'PENDING' | 'ACCEPTED' | 'IN_PREPARATION' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
          subtotal_amount?: number
          discount_amount?: number
          delivery_fee?: number | null
          total_amount?: number
          payment_method?: 'PIX' | 'CASH' | 'CARD' | 'ONLINE'
          coupon_id?: string | null
          delivery_address_id?: string | null
          notes?: string | null
          cash_register_id?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          store_id: string
          name: string
          phone: string
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          phone: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          phone?: string
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      tables: {
        Row: {
          id: string
          store_id: string
          number: string
          capacity: number
          qr_code: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          number: string
          capacity?: number
          qr_code?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          number?: string
          capacity?: number
          qr_code?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      modifier_groups: {
        Row: {
          id: string
          store_id: string
          name: string
          min_quantity: number
          max_quantity: number
          required: boolean
          applies_to_all_products: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          store_id: string
          name: string
          min_quantity?: number
          max_quantity?: number
          required?: boolean
          applies_to_all_products?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          store_id?: string
          name?: string
          min_quantity?: number
          max_quantity?: number
          required?: boolean
          applies_to_all_products?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      modifier_options: {
        Row: {
          id: string
          group_id: string
          name: string
          extra_price: number
          is_active: boolean
          sort_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          group_id: string
          name: string
          extra_price?: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          group_id?: string
          name?: string
          extra_price?: number
          is_active?: boolean
          sort_order?: number
          created_at?: string
          updated_at?: string
        }
      }
      product_modifier_groups: {
        Row: {
          id: string
          product_id: string
          group_id: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          group_id: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          group_id?: string
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          title_snapshot: string
          unit_price: number
          quantity: number
          unit_type: 'unit' | 'weight'
          weight: number | null
          subtotal: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          product_id: string
          title_snapshot: string
          unit_price: number
          quantity?: number
          unit_type: 'unit' | 'weight'
          weight?: number | null
          subtotal: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          product_id?: string
          title_snapshot?: string
          unit_price?: number
          quantity?: number
          unit_type?: 'unit' | 'weight'
          weight?: number | null
          subtotal?: number
          created_at?: string
          updated_at?: string
        }
      }
      order_item_modifiers: {
        Row: {
          id: string
          order_item_id: string
          modifier_option_id: string
          name_snapshot: string
          extra_price: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_item_id: string
          modifier_option_id: string
          name_snapshot: string
          extra_price: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_item_id?: string
          modifier_option_id?: string
          name_snapshot?: string
          extra_price?: number
          created_at?: string
          updated_at?: string
        }
      }
      order_events: {
        Row: {
          id: string
          order_id: string
          type: 'CREATED' | 'ACCEPTED' | 'IN_PREPARATION' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'NOTE'
          message: string | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          type: 'CREATED' | 'ACCEPTED' | 'IN_PREPARATION' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'NOTE'
          message?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          type?: 'CREATED' | 'ACCEPTED' | 'IN_PREPARATION' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'NOTE'
          message?: string | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      customer_addresses: {
        Row: {
          id: string
          customer_id: string
          label: string | null
          street: string
          number: string
          complement: string | null
          district: string
          city: string
          state: string
          zip_code: string
          reference: string | null
          latitude: number | null
          longitude: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          label?: string | null
          street: string
          number: string
          complement?: string | null
          district: string
          city: string
          state: string
          zip_code: string
          reference?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          label?: string | null
          street?: string
          number?: string
          complement?: string | null
          district?: string
          city?: string
          state?: string
          zip_code?: string
          reference?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      store_niche_enum: 'acai' | 'burger' | 'hotdog' | 'marmita' | 'butcher' | 'ice_cream' | 'other'
      store_mode_enum: 'store' | 'home'
      user_role_enum: 'OWNER' | 'MANAGER' | 'CASHIER' | 'KITCHEN' | 'DELIVERY'
      product_unit_type_enum: 'unit' | 'weight'
      order_channel_enum: 'COUNTER' | 'DELIVERY' | 'TAKEAWAY'
      order_status_enum: 'PENDING' | 'ACCEPTED' | 'IN_PREPARATION' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED'
      payment_method_enum: 'PIX' | 'CASH' | 'CARD' | 'ONLINE'
      order_event_type_enum: 'CREATED' | 'ACCEPTED' | 'IN_PREPARATION' | 'READY' | 'OUT_FOR_DELIVERY' | 'DELIVERED' | 'CANCELLED' | 'NOTE'
      notification_channel_enum: 'IN_APP' | 'WHATSAPP' | 'PUSH'
      notification_status_enum: 'PENDING' | 'SENT' | 'FAILED'
    }
  }
}
