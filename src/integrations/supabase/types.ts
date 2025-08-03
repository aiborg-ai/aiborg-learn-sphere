export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      announcements: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          priority: number | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          priority?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          priority?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      cms_content: {
        Row: {
          content_key: string
          content_type: string
          content_value: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          section_name: string
          updated_at: string
        }
        Insert: {
          content_key: string
          content_type: string
          content_value: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          section_name: string
          updated_at?: string
        }
        Update: {
          content_key?: string
          content_type?: string
          content_value?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          section_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      courses: {
        Row: {
          audience: string
          category: string
          created_at: string
          description: string
          duration: string
          features: string[]
          id: number
          is_active: boolean
          keywords: string[]
          level: string
          mode: string
          prerequisites: string | null
          price: string
          sort_order: number | null
          start_date: string
          title: string
          updated_at: string
        }
        Insert: {
          audience: string
          category: string
          created_at?: string
          description: string
          duration: string
          features?: string[]
          id?: number
          is_active?: boolean
          keywords?: string[]
          level: string
          mode?: string
          prerequisites?: string | null
          price: string
          sort_order?: number | null
          start_date: string
          title: string
          updated_at?: string
        }
        Update: {
          audience?: string
          category?: string
          created_at?: string
          description?: string
          duration?: string
          features?: string[]
          id?: number
          is_active?: boolean
          keywords?: string[]
          level?: string
          mode?: string
          prerequisites?: string | null
          price?: string
          sort_order?: number | null
          start_date?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      enrollments: {
        Row: {
          course_id: number
          created_at: string
          enrolled_at: string
          id: string
          payment_amount: number | null
          payment_status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: number
          created_at?: string
          enrolled_at?: string
          id?: string
          payment_amount?: number | null
          payment_status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: number
          created_at?: string
          enrolled_at?: string
          id?: string
          payment_amount?: number | null
          payment_status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      event_registrations: {
        Row: {
          created_at: string
          event_id: number
          id: string
          payment_amount: number | null
          payment_status: string
          registered_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: number
          id?: string
          payment_amount?: number | null
          payment_status?: string
          registered_at?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: number
          id?: string
          payment_amount?: number | null
          payment_status?: string
          registered_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_registrations_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          activities: string[]
          category: string
          created_at: string
          current_registrations: number | null
          description: string
          end_time: string
          event_date: string
          id: number
          is_active: boolean
          location: string
          max_capacity: number | null
          price: number
          start_time: string
          title: string
          updated_at: string
        }
        Insert: {
          activities?: string[]
          category?: string
          created_at?: string
          current_registrations?: number | null
          description: string
          end_time: string
          event_date: string
          id?: number
          is_active?: boolean
          location: string
          max_capacity?: number | null
          price: number
          start_time: string
          title: string
          updated_at?: string
        }
        Update: {
          activities?: string[]
          category?: string
          created_at?: string
          current_registrations?: number | null
          description?: string
          end_time?: string
          event_date?: string
          id?: number
          is_active?: boolean
          location?: string
          max_capacity?: number | null
          price?: number
          start_time?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          preferences: Json | null
          role: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          preferences?: Json | null
          role?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          preferences?: Json | null
          role?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean
          course_id: number | null
          course_mode: string | null
          course_period: string | null
          created_at: string
          display_name_option: string
          id: string
          rating: number
          review_type: string
          updated_at: string
          user_id: string
          video_review_url: string | null
          voice_review_url: string | null
          written_review: string | null
        }
        Insert: {
          approved?: boolean
          course_id?: number | null
          course_mode?: string | null
          course_period?: string | null
          created_at?: string
          display_name_option?: string
          id?: string
          rating: number
          review_type?: string
          updated_at?: string
          user_id: string
          video_review_url?: string | null
          voice_review_url?: string | null
          written_review?: string | null
        }
        Update: {
          approved?: boolean
          course_id?: number | null
          course_mode?: string | null
          course_period?: string | null
          created_at?: string
          display_name_option?: string
          id?: string
          rating?: number
          review_type?: string
          updated_at?: string
          user_id?: string
          video_review_url?: string | null
          voice_review_url?: string | null
          written_review?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_current_user_role: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
