export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description_en: string | null
          description_it: string | null
          id: string
          image_url: string | null
          is_active: boolean
          meta_description_en: string | null
          meta_description_it: string | null
          meta_title_en: string | null
          meta_title_it: string | null
          name_en: string
          name_it: string
          parent_id: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description_en?: string | null
          description_it?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          meta_description_en?: string | null
          meta_description_it?: string | null
          meta_title_en?: string | null
          meta_title_it?: string | null
          name_en: string
          name_it: string
          parent_id?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description_en?: string | null
          description_it?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          meta_description_en?: string | null
          meta_description_it?: string | null
          meta_title_en?: string | null
          meta_title_it?: string | null
          name_en?: string
          name_it?: string
          parent_id?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      category_filters: {
        Row: {
          attribute_name: string
          category_id: string
          display_name_en: string
          display_name_it: string
          id: string
          is_active: boolean
          sort_order: number
        }
        Insert: {
          attribute_name: string
          category_id: string
          display_name_en: string
          display_name_it: string
          id?: string
          is_active?: boolean
          sort_order?: number
        }
        Update: {
          attribute_name?: string
          category_id?: string
          display_name_en?: string
          display_name_it?: string
          id?: string
          is_active?: boolean
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "category_filters_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_attributes: {
        Row: {
          attribute_name: string
          attribute_unit: string | null
          attribute_value: string
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          attribute_name: string
          attribute_unit?: string | null
          attribute_value: string
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          attribute_name?: string
          attribute_unit?: string | null
          attribute_value?: string
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand: string | null
          brands: string[]
          category_id: string | null
          created_at: string
          description_en: string | null
          description_it: string | null
          description_original: string | null
          id: string
          images: Json | null
          is_active: boolean
          meta_description_en: string | null
          meta_description_it: string | null
          meta_title_en: string | null
          meta_title_it: string | null
          mirror_status: string
          name_en: string
          name_it: string
          product_code: string
          search_vector_en: unknown
          search_vector_it: unknown
          slug: string
          source_url: string | null
          status: Database["public"]["Enums"]["product_status"]
          technical_specs: Json | null
          updated_at: string
        }
        Insert: {
          brand?: string | null
          brands?: string[]
          category_id?: string | null
          created_at?: string
          description_en?: string | null
          description_it?: string | null
          description_original?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean
          meta_description_en?: string | null
          meta_description_it?: string | null
          meta_title_en?: string | null
          meta_title_it?: string | null
          mirror_status?: string
          name_en: string
          name_it: string
          product_code: string
          search_vector_en?: unknown
          search_vector_it?: unknown
          slug: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          technical_specs?: Json | null
          updated_at?: string
        }
        Update: {
          brand?: string | null
          brands?: string[]
          category_id?: string | null
          created_at?: string
          description_en?: string | null
          description_it?: string | null
          description_original?: string | null
          id?: string
          images?: Json | null
          is_active?: boolean
          meta_description_en?: string | null
          meta_description_it?: string | null
          meta_title_en?: string | null
          meta_title_it?: string | null
          mirror_status?: string
          name_en?: string
          name_it?: string
          product_code?: string
          search_vector_en?: unknown
          search_vector_it?: unknown
          slug?: string
          source_url?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          technical_specs?: Json | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      quote_requests: {
        Row: {
          admin_notes: string | null
          company: string | null
          created_at: string
          email: string
          id: string
          language: Database["public"]["Enums"]["supported_language"]
          message: string | null
          name: string
          phone: string | null
          product_code: string | null
          product_id: string | null
          product_name: string | null
          status: Database["public"]["Enums"]["quote_status"]
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          company?: string | null
          created_at?: string
          email: string
          id?: string
          language?: Database["public"]["Enums"]["supported_language"]
          message?: string | null
          name: string
          phone?: string | null
          product_code?: string | null
          product_id?: string | null
          product_name?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          company?: string | null
          created_at?: string
          email?: string
          id?: string
          language?: Database["public"]["Enums"]["supported_language"]
          message?: string | null
          name?: string
          phone?: string | null
          product_code?: string | null
          product_id?: string | null
          product_name?: string | null
          status?: Database["public"]["Enums"]["quote_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "quote_requests_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      scrape_jobs: {
        Row: {
          batch_id: string | null
          category_id: string | null
          created_at: string
          error_message: string | null
          id: string
          processed_data: Json | null
          raw_data: Json | null
          source_link: string | null
          source_url: string
          status: Database["public"]["Enums"]["scrape_status"]
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          category_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          processed_data?: Json | null
          raw_data?: Json | null
          source_link?: string | null
          source_url: string
          status?: Database["public"]["Enums"]["scrape_status"]
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          category_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          processed_data?: Json | null
          raw_data?: Json | null
          source_link?: string | null
          source_url?: string
          status?: Database["public"]["Enums"]["scrape_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scrape_jobs_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      source_links: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          label: string | null
          last_discovered_at: string | null
          product_count: number
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          last_discovered_at?: string | null
          product_count?: number
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string | null
          last_discovered_at?: string | null
          product_count?: number
          url?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      filter_products: {
        Args: {
          _category_id: string
          _filters?: Json
          _lang?: string
          _page?: number
          _page_size?: number
          _sort?: string
        }
        Returns: {
          brand: string
          description_en: string
          description_it: string
          id: string
          images: Json
          name_en: string
          name_it: string
          product_code: string
          slug: string
          total_count: number
        }[]
      }
      get_brand_category_counts: {
        Args: { _brand: string }
        Returns: {
          category_id: string
          product_count: number
        }[]
      }
      get_scrape_job_counts: { Args: never; Returns: Json }
      get_source_link_stats: {
        Args: never
        Returns: {
          failed: number
          failed_brand: number
          imported: number
          pending: number
          processed: number
          scraped: number
          source_link: string
          total: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      product_status: "draft" | "pending_rewrite" | "published" | "archived"
      quote_status: "new" | "in_progress" | "quoted" | "closed"
      scrape_status: "pending" | "scraped" | "processed" | "imported" | "failed"
      supported_language: "it" | "en"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      product_status: ["draft", "pending_rewrite", "published", "archived"],
      quote_status: ["new", "in_progress", "quoted", "closed"],
      scrape_status: ["pending", "scraped", "processed", "imported", "failed"],
      supported_language: ["it", "en"],
    },
  },
} as const
