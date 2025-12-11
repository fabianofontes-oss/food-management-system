import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      tenants: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
      }
      stores: {
        Row: {
          id: string
          tenant_id: string
          name: string
          slug: string
          phone: string
          email: string
          address: string
          city: string
          state: string
          zip_code: string
          is_active: boolean
          created_at: string
        }
      }
      categories: {
        Row: {
          id: string
          store_id: string
          name: string
          display_order: number
          is_active: boolean
          created_at: string
        }
      }
      products: {
        Row: {
          id: string
          store_id: string
          category_id: string
          name: string
          description: string
          base_price: number
          image_url: string | null
          is_active: boolean
          created_at: string
        }
      }
      orders: {
        Row: {
          id: string
          store_id: string
          order_code: string
          customer_name: string
          customer_phone: string
          customer_email: string
          delivery_address: string | null
          order_type: 'delivery' | 'pickup' | 'dine_in'
          payment_method: 'pix' | 'credit_card' | 'debit_card' | 'cash'
          subtotal: number
          delivery_fee: number
          discount: number
          total_amount: number
          status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'out_for_delivery' | 'delivered' | 'cancelled'
          notes: string | null
          created_at: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          product_id: string
          quantity: number
          unit_price: number
          subtotal: number
          notes: string | null
        }
      }
    }
  }
}
