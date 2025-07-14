export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          order_index: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          icon?: string | null
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          icon?: string | null
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      properties: {
        Row: {
          id: string
          title: string
          description: string
          price: number
          price_per_meter: number | null
          location: string
          area: string
          bedrooms: number
          bathrooms: number
          size: number
          floor: number | null
          total_floors: number | null
          year_built: number | null
          category_id: string | null
          property_type: "sale" | "rent"
          owner_type: "owner" | "broker" | null
          status: "active" | "draft" | "sold" | "rented" | "inactive" | null
          features: string[] | null
          amenities: string[] | null
          is_new: boolean | null
          is_featured: boolean | null
          is_verified: boolean | null
          views: number | null
          location_lat: number | null
          location_lng: number | null
          contact_name: string
          contact_phone: string
          contact_whatsapp: string | null
          contact_email: string | null
          contact_avatar: string | null
          contact_is_verified: boolean | null
          response_time: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          price: number
          price_per_meter?: number | null
          location: string
          area: string
          bedrooms?: number
          bathrooms?: number
          size: number
          floor?: number | null
          total_floors?: number | null
          year_built?: number | null
          category_id?: string | null
          property_type: "sale" | "rent"
          owner_type?: "owner" | "broker" | null
          status?: "active" | "draft" | "sold" | "rented" | "inactive" | null
          features?: string[] | null
          amenities?: string[] | null
          is_new?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          views?: number | null
          location_lat?: number | null
          location_lng?: number | null
          contact_name: string
          contact_phone: string
          contact_whatsapp?: string | null
          contact_email?: string | null
          contact_avatar?: string | null
          contact_is_verified?: boolean | null
          response_time?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          price?: number
          price_per_meter?: number | null
          location?: string
          area?: string
          bedrooms?: number
          bathrooms?: number
          size?: number
          floor?: number | null
          total_floors?: number | null
          year_built?: number | null
          category_id?: string | null
          property_type?: "sale" | "rent"
          owner_type?: "owner" | "broker" | null
          status?: "active" | "draft" | "sold" | "rented" | "inactive" | null
          features?: string[] | null
          amenities?: string[] | null
          is_new?: boolean | null
          is_featured?: boolean | null
          is_verified?: boolean | null
          views?: number | null
          location_lat?: number | null
          location_lng?: number | null
          contact_name?: string
          contact_phone?: string
          contact_whatsapp?: string | null
          contact_email?: string | null
          contact_avatar?: string | null
          contact_is_verified?: boolean | null
          response_time?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      property_images: {
        Row: {
          id: string
          property_id: string | null
          url: string
          alt_text: string | null
          order_index: number | null
          is_main: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          property_id?: string | null
          url: string
          alt_text?: string | null
          order_index?: number | null
          is_main?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          property_id?: string | null
          url?: string
          alt_text?: string | null
          order_index?: number | null
          is_main?: boolean | null
          created_at?: string | null
        }
      }
      property_ratings: {
        Row: {
          id: string
          property_id: string | null
          schools: number | null
          transportation: number | null
          shopping: number | null
          restaurants: number | null
          safety: number | null
          quietness: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          property_id?: string | null
          schools?: number | null
          transportation?: number | null
          shopping?: number | null
          restaurants?: number | null
          safety?: number | null
          quietness?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          property_id?: string | null
          schools?: number | null
          transportation?: number | null
          shopping?: number | null
          restaurants?: number | null
          safety?: number | null
          quietness?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      user_profiles: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          phone: string | null
          role: "user" | "admin"
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: "user" | "admin"
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          phone?: string | null
          role?: "user" | "admin"
          created_at?: string | null
          updated_at?: string | null
        }
      }
      loved_properties: {
        Row: {
          id: string
          user_id: string | null
          property_id: string | null
          created_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          property_id?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string | null
          property_id?: string | null
          created_at?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      increment_property_views: {
        Args: {
          property_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      property_type: "sale" | "rent"
      owner_type: "owner" | "broker"
      property_status: "active" | "draft" | "sold" | "rented" | "inactive"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
