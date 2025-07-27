export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      areas: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          order_index: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          order_index?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          order_index?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      area_ratings: {
        Row: {
          id: string
          area_id: string
          user_id: string | null
          overall_rating: number
          schools_rating: number | null
          transportation_rating: number | null
          shopping_rating: number | null
          restaurants_rating: number | null
          safety_rating: number | null
          quietness_rating: number | null
          walkability_rating: number | null
          nightlife_rating: number | null
          healthcare_rating: number | null
          parks_rating: number | null
          comment: string | null
          ip_address: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          area_id: string
          user_id?: string | null
          overall_rating: number
          schools_rating?: number | null
          transportation_rating?: number | null
          shopping_rating?: number | null
          restaurants_rating?: number | null
          safety_rating?: number | null
          quietness_rating?: number | null
          walkability_rating?: number | null
          nightlife_rating?: number | null
          healthcare_rating?: number | null
          parks_rating?: number | null
          comment?: string | null
          ip_address?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          area_id?: string
          user_id?: string | null
          overall_rating?: number
          schools_rating?: number | null
          transportation_rating?: number | null
          shopping_rating?: number | null
          restaurants_rating?: number | null
          safety_rating?: number | null
          quietness_rating?: number | null
          walkability_rating?: number | null
          nightlife_rating?: number | null
          healthcare_rating?: number | null
          parks_rating?: number | null
          comment?: string | null
          ip_address?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      area_ratings_summary: {
        Row: {
          area_id: string
          total_ratings: number
          avg_overall_rating: number | null
          avg_schools_rating: number | null
          avg_transportation_rating: number | null
          avg_shopping_rating: number | null
          avg_restaurants_rating: number | null
          avg_safety_rating: number | null
          avg_quietness_rating: number | null
          avg_walkability_rating: number | null
          avg_nightlife_rating: number | null
          avg_healthcare_rating: number | null
          avg_parks_rating: number | null
        }
        Insert: {
          area_id: string
          total_ratings: number
          avg_overall_rating?: number | null
          avg_schools_rating?: number | null
          avg_transportation_rating?: number | null
          avg_shopping_rating?: number | null
          avg_restaurants_rating?: number | null
          avg_safety_rating?: number | null
          avg_quietness_rating?: number | null
          avg_walkability_rating?: number | null
          avg_nightlife_rating?: number | null
          avg_healthcare_rating?: number | null
          avg_parks_rating?: number | null
        }
        Update: {
          area_id?: string
          total_ratings?: number
          avg_overall_rating?: number | null
          avg_schools_rating?: number | null
          avg_transportation_rating?: number | null
          avg_shopping_rating?: number | null
          avg_restaurants_rating?: number | null
          avg_safety_rating?: number | null
          avg_quietness_rating?: number | null
          avg_walkability_rating?: number | null
          avg_nightlife_rating?: number | null
          avg_healthcare_rating?: number | null
          avg_parks_rating?: number | null
        }
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          icon: string | null
          order_index: number | null
          image_url: string | null
          name_en: string | null
          name_ar: string | null
          description_en: string | null
          description_ar: string | null
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
          image_url?: string | null
          name_en?: string | null
          name_ar?: string | null
          description_en?: string | null
          description_ar?: string | null
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
          image_url?: string | null
          name_en?: string | null
          name_ar?: string | null
          description_en?: string | null
          description_ar?: string | null
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
          area_id: string | null
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
          thumbnail_url: string | null
          location_iframe_url: string | null
          order_index: number | null
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
          area_id?: string | null
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
          thumbnail_url?: string | null
          location_iframe_url?: string | null
          order_index?: number | null
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
          area_id?: string | null
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
          thumbnail_url?: string | null
          location_iframe_url?: string | null
          order_index?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
      }
      property_images: {
        Row: {
          id: string
          property_id: string | null
          url: string
          thumbnail_url: string | null
          alt_text: string | null
          order_index: number | null
          is_main: boolean | null
          created_at: string | null
        }
        Insert: {
          id?: string
          property_id?: string | null
          url: string
          thumbnail_url?: string | null
          alt_text?: string | null
          order_index?: number | null
          is_main?: boolean | null
          created_at?: string | null
        }
        Update: {
          id?: string
          property_id?: string | null
          url?: string
          thumbnail_url?: string | null
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
