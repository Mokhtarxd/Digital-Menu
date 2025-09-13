export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      dishes: {
        Row: {
          id: string
          name: string
          description: string | null
          price: number
          category: string | null
          image_url: string | null
          is_available: boolean
          is_hidden: boolean
          loyalty_points: number | null
          wait_time: number | null
          currency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          price: number
          category?: string | null
          image_url?: string | null
          is_available?: boolean
          is_hidden?: boolean
          loyalty_points?: number | null
          wait_time?: number | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          price?: number
          category?: string | null
          image_url?: string | null
          is_available?: boolean
          is_hidden?: boolean
          loyalty_points?: number | null
          wait_time?: number | null
          currency?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          user_type: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          user_type?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          user_type?: string
          created_at?: string
          updated_at?: string
        }
      }
      reservations: {
        Row: {
          id: string
          table_id: string | null
          user_id: string | null
          party_size: number
          reserved_at: string
          status: string
          notes: string | null
          created_at: string
          client_id: string
        }
        Insert: {
          id?: string
          table_id?: string | null
          user_id?: string | null
          party_size: number
          reserved_at: string
          status?: string
          notes?: string | null
          created_at?: string
          client_id: string
        }
        Update: {
          id?: string
          table_id?: string | null
          user_id?: string | null
          party_size?: number
          reserved_at?: string
          status?: string
          notes?: string | null
          created_at?: string
          client_id?: string
        }
      }
      tables: {
        Row: {
          id: string
          label: string
          seats: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          label: string
          seats: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          label?: string
          seats?: number
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
      [_ in never]: never
    }
  }
}
