import type { Database } from '@/lib/database.types';

export type OrganizerInquiryStatus =
  Database['public']['Tables']['organizer_inquiries']['Row']['status'];

export const ORGANIZER_INQUIRY_STATUS_OPTIONS = [
  { value: 'new', label: 'New' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'quote_sent', label: 'Quote Sent' },
  { value: 'paid', label: 'Paid' },
  { value: 'completed', label: 'Completed' },
  { value: 'declined', label: 'Declined' },
] as const satisfies Array<{ value: NonNullable<OrganizerInquiryStatus> | 'new'; label: string }>;

// If you ever convert organizer_inquiries.status to a Postgres enum later,
// you can tighten the type above. For now it’s string|null in your DB types.

export type VibeValue = Database['public']['Enums']['vibe'];

export const VIBE_OPTIONS = [
  { value: 'good_for_groups', label: 'Good for Groups' },
  { value: 'meet_people', label: 'Meet People' },
  { value: 'date_night', label: 'Date Night' },
  { value: 'family_friendly', label: 'Family Friendly' },
  { value: 'kid_friendly', label: 'Kid Friendly' },
  { value: 'pet_friendly', label: 'Pet Friendly' },
  { value: 'low_key', label: 'Low Key' },
  { value: 'high_energy', label: 'High Energy' },
  { value: 'chill', label: 'Chill' },
  { value: 'cozy', label: 'Cozy' },
  { value: 'dancey', label: 'Dancey' },
  { value: 'live_music', label: 'Live Music' },
  { value: 'dj_set', label: 'DJ Set' },
  { value: 'late_night', label: 'Late Night' },
  { value: 'food_trucks_nearby', label: 'Food Trucks Nearby' },
  { value: 'munchies', label: 'Munchies' },
  { value: 'coffee_hang', label: 'Coffee Hang' },
  { value: 'dessert_run', label: 'Dessert Run' },
  { value: 'outdoor_hang', label: 'Outdoor Hang' },
  { value: 'sweat_level_light', label: 'Sweat Level Light' },
  { value: 'sweat_level_real', label: 'Sweat Level Real' },
  { value: 'artsy', label: 'Artsy' },
  { value: 'makers', label: 'Makers' },
  { value: 'diy', label: 'DIY' },
  { value: 'nerdy', label: 'Nerdy' },
  { value: 'vintage', label: 'Vintage' },
  { value: 'thrifty', label: 'Thrifty' },
  { value: 'grounding', label: 'Grounding' },
  { value: 'soft_morning', label: 'Soft Morning' },
  { value: 'beginner_friendly', label: 'Beginner Friendly' },
  { value: 'civic_action', label: 'Civic Action' },
  { value: 'protest', label: 'Protest' },
] as const satisfies ReadonlyArray<{ value: VibeValue; label: string }>;

export const STORY_TYPE_OPTIONS = [
  'Event Recap',
  'Venue Spotlight',
  'Interview',
  'Neighborhood Guide',
  'Tips & Guides',
  'Seasonal Roundup',
  'Hidden Gems',
  'Food & Drink Focus',
  'Community Stories',
  'Event Preview',
  'Top Lists',
  'News & Announcements',
] as const;
