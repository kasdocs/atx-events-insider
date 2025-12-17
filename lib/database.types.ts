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
      events: {
        Row: {
          id: number;
          created_at: string | null;
          title: string | null;
          location: string | null;
          image_url: string | null;
          pricing_type: string | null;
          event_type: string | null;
          event_date: string | null; // Postgres date comes back as string
          time: string | null; // Postgres time comes back as string
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
        Update: Database["public"]["Tables"]["events"]["Insert"];
      };

      saved_events: {
        Row: {
          id: number;
          created_at: string | null;
          user_id: string; // uuid
          event_id: number;
        };
        Insert: {
          id?: number;
          created_at?: string | null;
          user_id: string;
          event_id: number;
        };
        Update: Partial<Database["public"]["Tables"]["saved_events"]["Insert"]>;
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
        Update: Partial<Database["public"]["Tables"]["newsletter_subscribers"]["Insert"]>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
};
