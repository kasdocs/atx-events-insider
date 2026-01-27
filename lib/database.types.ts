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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      authors: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          favorite_event_type: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          favorite_event_type?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          favorite_event_type?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      event_analytics_daily: {
        Row: {
          day: string
          event_id: number
          outbound_clicks: number
          outbound_clicks_instagram: number
          outbound_clicks_ticket: number
          rsvps: number
          saves: number
          unique_viewers: number
          updated_at: string
          views: number
        }
        Insert: {
          day: string
          event_id: number
          outbound_clicks?: number
          outbound_clicks_instagram?: number
          outbound_clicks_ticket?: number
          rsvps?: number
          saves?: number
          unique_viewers?: number
          updated_at?: string
          views?: number
        }
        Update: {
          day?: string
          event_id?: number
          outbound_clicks?: number
          outbound_clicks_instagram?: number
          outbound_clicks_ticket?: number
          rsvps?: number
          saves?: number
          unique_viewers?: number
          updated_at?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "event_analytics_daily_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_popularity"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_analytics_daily_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_analytics_events: {
        Row: {
          event_id: number
          event_name: Database["public"]["Enums"]["analytics_event_name"]
          id: number
          meta: Json
          occurred_at: string
          pathname: string | null
          referrer: string | null
          session_id: string
          user_id: string | null
          viewer_id: string
        }
        Insert: {
          event_id: number
          event_name: Database["public"]["Enums"]["analytics_event_name"]
          id?: number
          meta?: Json
          occurred_at?: string
          pathname?: string | null
          referrer?: string | null
          session_id: string
          user_id?: string | null
          viewer_id: string
        }
        Update: {
          event_id?: number
          event_name?: Database["public"]["Enums"]["analytics_event_name"]
          id?: number
          meta?: Json
          occurred_at?: string
          pathname?: string | null
          referrer?: string | null
          session_id?: string
          user_id?: string | null
          viewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_analytics_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_popularity"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_analytics_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: number
          id: number
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: number
          id?: number
          status: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: number
          id?: number
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      event_submissions: {
        Row: {
          approved_at: string | null
          approved_event_id: number | null
          description: string | null
          event_date: string
          event_type: string
          id: number
          image_url: string | null
          insider_tip: string | null
          instagram_url: string | null
          ip_address: string | null
          location: string
          neighborhood: string | null
          organizer_email: string
          organizer_instagram: string | null
          organizer_name: string
          organizer_phone: string | null
          price: string | null
          pricing_type: string
          status: string | null
          submitted_at: string | null
          subtype_1: string | null
          subtype_2: string | null
          subtype_3: string | null
          time: string | null
          title: string
          user_agent: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_event_id?: number | null
          description?: string | null
          event_date: string
          event_type: string
          id?: number
          image_url?: string | null
          insider_tip?: string | null
          instagram_url?: string | null
          ip_address?: string | null
          location: string
          neighborhood?: string | null
          organizer_email: string
          organizer_instagram?: string | null
          organizer_name: string
          organizer_phone?: string | null
          price?: string | null
          pricing_type: string
          status?: string | null
          submitted_at?: string | null
          subtype_1?: string | null
          subtype_2?: string | null
          subtype_3?: string | null
          time?: string | null
          title: string
          user_agent?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_event_id?: number | null
          description?: string | null
          event_date?: string
          event_type?: string
          id?: number
          image_url?: string | null
          insider_tip?: string | null
          instagram_url?: string | null
          ip_address?: string | null
          location?: string
          neighborhood?: string | null
          organizer_email?: string
          organizer_instagram?: string | null
          organizer_name?: string
          organizer_phone?: string | null
          price?: string | null
          pricing_type?: string
          status?: string | null
          submitted_at?: string | null
          subtype_1?: string | null
          subtype_2?: string | null
          subtype_3?: string | null
          time?: string | null
          title?: string
          user_agent?: string | null
        }
        Relationships: []
      }
      event_unique_viewers_daily: {
        Row: {
          day: string
          event_id: number
          first_seen_at: string
          viewer_key: string
        }
        Insert: {
          day: string
          event_id: number
          first_seen_at?: string
          viewer_key: string
        }
        Update: {
          day?: string
          event_id?: number
          first_seen_at?: string
          viewer_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_unique_viewers_daily_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_popularity"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_unique_viewers_daily_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_view_sessions: {
        Row: {
          event_id: number
          first_viewed_at: string
          last_viewed_at: string
          session_id: string
          view_count: number
          viewer_key: string
        }
        Insert: {
          event_id: number
          first_viewed_at?: string
          last_viewed_at?: string
          session_id: string
          view_count?: number
          viewer_key: string
        }
        Update: {
          event_id?: number
          first_viewed_at?: string
          last_viewed_at?: string
          session_id?: string
          view_count?: number
          viewer_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_view_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_popularity"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_view_sessions_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_views: {
        Row: {
          event_id: number
          id: number
          viewed_at: string
        }
        Insert: {
          event_id: number
          id?: number
          viewed_at?: string
        }
        Update: {
          event_id?: number
          id?: number
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_views_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_popularity"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "event_views_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string
          description: string | null
          event_date: string
          event_type: string
          featured_expires_at: string | null
          geocode_place_name: string | null
          geocode_provider: string | null
          geocode_status: string
          geocoded_at: string | null
          id: number
          image_url: string | null
          insider_tip: string | null
          instagram_url: string | null
          is_featured: boolean | null
          latitude: number | null
          location: string
          longitude: number | null
          neighborhood: string | null
          paid_promotion_notes: string | null
          price: string | null
          pricing_type: string
          promotion_tier: string | null
          slug: string | null
          subtype_1: string | null
          subtype_2: string | null
          subtype_3: string | null
          time: string | null
          title: string
          vibe: Database["public"]["Enums"]["vibe"][]
        }
        Insert: {
          created_at?: string
          description?: string | null
          event_date: string
          event_type: string
          featured_expires_at?: string | null
          geocode_place_name?: string | null
          geocode_provider?: string | null
          geocode_status?: string
          geocoded_at?: string | null
          id?: number
          image_url?: string | null
          insider_tip?: string | null
          instagram_url?: string | null
          is_featured?: boolean | null
          latitude?: number | null
          location: string
          longitude?: number | null
          neighborhood?: string | null
          paid_promotion_notes?: string | null
          price?: string | null
          pricing_type: string
          promotion_tier?: string | null
          slug?: string | null
          subtype_1?: string | null
          subtype_2?: string | null
          subtype_3?: string | null
          time?: string | null
          title: string
          vibe?: Database["public"]["Enums"]["vibe"][]
        }
        Update: {
          created_at?: string
          description?: string | null
          event_date?: string
          event_type?: string
          featured_expires_at?: string | null
          geocode_place_name?: string | null
          geocode_provider?: string | null
          geocode_status?: string
          geocoded_at?: string | null
          id?: number
          image_url?: string | null
          insider_tip?: string | null
          instagram_url?: string | null
          is_featured?: boolean | null
          latitude?: number | null
          location?: string
          longitude?: number | null
          neighborhood?: string | null
          paid_promotion_notes?: string | null
          price?: string | null
          pricing_type?: string
          promotion_tier?: string | null
          slug?: string | null
          subtype_1?: string | null
          subtype_2?: string | null
          subtype_3?: string | null
          time?: string | null
          title?: string
          vibe?: Database["public"]["Enums"]["vibe"][]
        }
        Relationships: []
      }
      featured_events: {
        Row: {
          created_at: string
          ends_at: string | null
          event_id: number
          id: string
          is_active: boolean
          rank: number
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          ends_at?: string | null
          event_id: number
          id?: string
          is_active?: boolean
          rank?: number
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          ends_at?: string | null
          event_id?: number
          id?: string
          is_active?: boolean
          rank?: number
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "event_popularity"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "featured_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_subscribers: {
        Row: {
          active: boolean
          email: string
          id: number
          source: string | null
          subscribed_at: string
        }
        Insert: {
          active?: boolean
          email: string
          id?: number
          source?: string | null
          subscribed_at?: string
        }
        Update: {
          active?: boolean
          email?: string
          id?: number
          source?: string | null
          subscribed_at?: string
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          active: boolean | null
          created_at: string
          emails: string
          id: number
          source: string | null
          subscribed_at: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          emails: string
          id?: number
          source?: string | null
          subscribed_at?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          emails?: string
          id?: number
          source?: string | null
          subscribed_at?: string | null
        }
        Relationships: []
      }
      organizer_inquiries: {
        Row: {
          admin_notes: string | null
          created_at: string | null
          email: string
          event_date: string | null
          event_description: string | null
          event_name: string | null
          goals_and_questions: string | null
          id: string
          invoice_sent: boolean | null
          linked_event_id: number | null
          name: string
          package_interest: string | null
          payment_received: boolean | null
          phone: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string | null
          email: string
          event_date?: string | null
          event_description?: string | null
          event_name?: string | null
          goals_and_questions?: string | null
          id?: string
          invoice_sent?: boolean | null
          linked_event_id?: number | null
          name: string
          package_interest?: string | null
          payment_received?: boolean | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          created_at?: string | null
          email?: string
          event_date?: string | null
          event_description?: string | null
          event_name?: string | null
          goals_and_questions?: string | null
          id?: string
          invoice_sent?: boolean | null
          linked_event_id?: number | null
          name?: string
          package_interest?: string | null
          payment_received?: boolean | null
          phone?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "organizer_inquiries_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "event_popularity"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "organizer_inquiries_linked_event_id_fkey"
            columns: ["linked_event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_events: {
        Row: {
          created_at: string
          event_id: number
          id: number
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: number
          id?: number
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: number
          id?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "event_popularity"
            referencedColumns: ["event_id"]
          },
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          author: string | null
          author_id: string | null
          content: string | null
          cover_image: string | null
          created_at: string
          event_id: number | null
          excerpt: string | null
          featured: boolean | null
          id: number
          published_date: string
          slug: string
          story_type: string | null
          title: string
        }
        Insert: {
          author?: string | null
          author_id?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          event_id?: number | null
          excerpt?: string | null
          featured?: boolean | null
          id?: number
          published_date: string
          slug: string
          story_type?: string | null
          title: string
        }
        Update: {
          author?: string | null
          author_id?: string | null
          content?: string | null
          cover_image?: string | null
          created_at?: string
          event_id?: number | null
          excerpt?: string | null
          featured?: boolean | null
          id?: number
          published_date?: string
          slug?: string
          story_type?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
      }
      user_preferences: {
        Row: {
          created_at: string
          favorite_event_type: string | null
          favorite_neighborhood: string | null
          favorite_vibes: string[] | null
          user_id: string
        }
        Insert: {
          created_at?: string
          favorite_event_type?: string | null
          favorite_neighborhood?: string | null
          favorite_vibes?: string[] | null
          user_id: string
        }
        Update: {
          created_at?: string
          favorite_event_type?: string | null
          favorite_neighborhood?: string | null
          favorite_vibes?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      event_popularity: {
        Row: {
          event_id: number | null
          last_viewed_at: string | null
          slug: string | null
          title: string | null
          total_views: number | null
          unique_viewers: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_going_count: { Args: { p_event_id: number }; Returns: number }
      track_event_outbound_click: {
        Args: {
          p_event_id: number
          p_kind: string
          p_pathname?: string
          p_referrer?: string
          p_session_id?: string
          p_url?: string
          p_viewer_id?: string
        }
        Returns: undefined
      }
      track_event_view: {
        Args: {
          p_event_id: number
          p_pathname?: string
          p_referrer?: string
          p_session_id: string
          p_viewer_id: string
        }
        Returns: undefined
      }
      viewer_key: {
        Args: { p_user_id: string; p_viewer_id: string }
        Returns: string
      }
    }
    Enums: {
      analytics_event_name:
        | "view"
        | "save"
        | "unsave"
        | "rsvp"
        | "unrsvp"
        | "outbound_click"
      vibe:
        | "good_for_groups"
        | "meet_people"
        | "date_night"
        | "family_friendly"
        | "kid_friendly"
        | "pet_friendly"
        | "low_key"
        | "high_energy"
        | "chill"
        | "cozy"
        | "dancey"
        | "live_music"
        | "dj_set"
        | "late_night"
        | "food_trucks_nearby"
        | "munchies"
        | "coffee_hang"
        | "dessert_run"
        | "outdoor_hang"
        | "sweat_level_light"
        | "sweat_level_real"
        | "artsy"
        | "makers"
        | "diy"
        | "nerdy"
        | "vintage"
        | "thrifty"
        | "grounding"
        | "soft_morning"
        | "beginner_friendly"
        | "civic_action"
        | "protest"
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
      analytics_event_name: [
        "view",
        "save",
        "unsave",
        "rsvp",
        "unrsvp",
        "outbound_click",
      ],
      vibe: [
        "good_for_groups",
        "meet_people",
        "date_night",
        "family_friendly",
        "kid_friendly",
        "pet_friendly",
        "low_key",
        "high_energy",
        "chill",
        "cozy",
        "dancey",
        "live_music",
        "dj_set",
        "late_night",
        "food_trucks_nearby",
        "munchies",
        "coffee_hang",
        "dessert_run",
        "outdoor_hang",
        "sweat_level_light",
        "sweat_level_real",
        "artsy",
        "makers",
        "diy",
        "nerdy",
        "vintage",
        "thrifty",
        "grounding",
        "soft_morning",
        "beginner_friendly",
        "civic_action",
        "protest",
      ],
    },
  },
} as const
