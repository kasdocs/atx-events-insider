import type { VIBE_OPTIONS } from './constants';

export type VibeValue = (typeof VIBE_OPTIONS)[number]['value'];

export type Event = {
  id: number;
  title: string;
  event_date: string;
  location: string;
  event_type: string;
  vibe?: VibeValue[];
  subtype_1?: string;
  subtype_2?: string;
  subtype_3?: string;
  slug?: string;
  neighborhood?: string;
  pricing_type: string;
  description?: string;
  image_url?: string;
  price?: string;
  time?: string;
  instagram_url?: string;
  insider_tip?: string;
};

export type Story = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  cover_image?: string;
  story_type?: string;
  author?: string | null;
  author_id?: string | null;
  published_date: string;
  event_id?: number;
  featured: boolean;
};

export type Author = {
  id: string;
  name: string;
  slug: string;
  bio?: string | null;
  favorite_event_type?: string | null;
  avatar_url?: string | null;
  created_at?: string | null;
};

export type Subscriber = {
  id: number;
  email: string;
  subscribed_at: string;
  source: string;
  active: boolean;
};

export type OrganizerInquiry = {
  id: number | string;
  created_at?: string;
  status?: string;

  name?: string;
  email?: string;
  phone?: string;

  event_name?: string;
  event_date?: string;
  event_description?: string;

  package_interest?: string;
  goals_and_questions?: string;

  [key: string]: any;
};

export type FeaturedRow = {
  id: string;
  event_id: number;
  rank: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  updated_at: string;
  events?: {
    id: number;
    title: string;
    event_date?: string;
    location?: string;
    vibe?: string[];
    pricing_type?: string;
    price?: string | null;
    time?: string | null;
  } | null;
};
