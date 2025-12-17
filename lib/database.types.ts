export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      event_submissions: {
        Row: {
          id: number;
          created_at: string | null;
          title: string | null;
          event_date: string | null;
          time: string | null;
          location: string | null;
          instagram_url: string | null;
          description: string | null;
          event_type: string | null;
          subtype_1: string | null;
          subtype_2: string | null;
          subtype_3: string | null;
          neighborhood: string | null;
          pricing_type: string | null;
          price: string | null;
          insider_tip: string | null;
          organizer_name: string | null;
          organizer_email: string | null;
          organizer_phone: string | null;
          organizer_instagram: string | null;
          status: string | null;
          submitted_at: string | null;
          image_url: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string | null;
          title?: string | null;
          event_date?: string | null;
          time?: string | null;
          location?: string | null;
          instagram_url?: string | null;
          description?: string | null;
          event_type?: string | null;
          subtype_1?: string | null;
          subtype_2?: string | null;
          subtype_3?: string | null;
          neighborhood?: string | null;
          pricing_type?: string | null;
          price?: string | null;
          insider_tip?: string | null;
          organizer_name?: string | null;
          organizer_email?: string | null;
          organizer_phone?: string | null;
          organizer_instagram?: string | null;
          status?: string | null;
          submitted_at?: string | null;
          image_url?: string | null;
        };
        Update: Partial<{
          created_at: string | null;
          title: string | null;
          event_date: string | null;
          time: string | null;
          location: string | null;
          instagram_url: string | null;
          description: string | null;
          event_type: string | null;
          subtype_1: string | null;
          subtype_2: string | null;
          subtype_3: string | null;
          neighborhood: string | null;
          pricing_type: string | null;
          price: string | null;
          insider_tip: string | null;
          organizer_name: string | null;
          organizer_email: string | null;
          organizer_phone: string | null;
          organizer_instagram: string | null;
          status: string | null;
          submitted_at: string | null;
          image_url: string | null;
        }>;
        Relationships: [];
      };

      stories: {
        Row: {
          id: number;
          created_at: string | null;
          title: string | null;
          slug: string | null;
          content: string | null;
          cover_image: string | null;
          author: string | null;
          published_date: string | null;
          event_id: number | null;
          featured: boolean | null;
          excerpt: string | null;
          story_type: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string | null;
          title?: string | null;
          slug?: string | null;
          content?: string | null;
          cover_image?: string | null;
          author?: string | null;
          published_date?: string | null;
          event_id?: number | null;
          featured?: boolean | null;
          excerpt?: string | null;
          story_type?: string | null;
        };
        Update: Partial<{
          created_at: string | null;
          title: string | null;
          slug: string | null;
          content: string | null;
          cover_image: string | null;
          author: string | null;
          published_date: string | null;
          event_id: number | null;
          featured: boolean | null;
          excerpt: string | null;
          story_type: string | null;
        }>;
        Relationships: [];
      };

      events: {
        Row: {
          id: number;
          created_at: string | null;
          title: string | null;
          location: string | null;
          image_url: string | null;
          pricing_type: string | null;
          event_type: string | null;
          event_date: string | null;
          time: string | null;
          instagram_url: string | null;
          description: string | null;
          neighborhood: string | null;
          subtype_1: string | null;
          subtype_2: string | null;
          subtype_3: string | null;
          price: string | null;
          insider_tip: string | null;
          slug: string | null;
          vibe: string[] | null;
        };
        Insert: {
          id?: number;
          created_at?: string | null;
          title?: string | null;
          location?: string | null;
          image_url?: string | null;
          pricing_type?: string | null;
          event_type?: string | null;
          event_date?: string | null;
          time?: string | null;
          instagram_url?: string | null;
          description?: string | null;
          neighborhood?: string | null;
          subtype_1?: string | null;
          subtype_2?: string | null;
          subtype_3?: string | null;
          price?: string | null;
          insider_tip?: string | null;
          slug?: string | null;
          vibe?: string[] | null;
        };
        Update: Partial<{
          created_at: string | null;
          title: string | null;
          location: string | null;
          image_url: string | null;
          pricing_type: string | null;
          event_type: string | null;
          event_date: string | null;
          time: string | null;
          instagram_url: string | null;
          description: string | null;
          neighborhood: string | null;
          subtype_1: string | null;
          subtype_2: string | null;
          subtype_3: string | null;
          price: string | null;
          insider_tip: string | null;
          slug: string | null;
          vibe: string[] | null;
        }>;
        Relationships: [];
      };

      saved_events: {
        Row: {
          id: number;
          created_at: string | null;
          user_id: string;
          event_id: number;
        };
        Insert: {
          id?: number;
          created_at?: string | null;
          user_id: string;
          event_id: number;
        };
        Update: Partial<{
          created_at: string | null;
          user_id: string;
          event_id: number;
        }>;
        Relationships: [];
      };

      newsletter_subscribers: {
        Row: {
          id: number;
          created_at: string | null;
          email: string;
          source: string | null;
          active: boolean | null;
        };
        Insert: {
          id?: number;
          created_at?: string | null;
          email: string;
          source?: string | null;
          active?: boolean | null;
        };
        Update: Partial<{
          created_at: string | null;
          email: string;
          source: string | null;
          active: boolean | null;
        }>;
        Relationships: [];
      };
    };

    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
