import { z } from 'zod';

export const eventStatusSchema = z.enum(['scheduled', 'cancelled', 'postponed', 'tentative', 'past']);

export const eventSchema = z.object({
  id: z.string().min(3),
  slug: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  title: z.string().min(3),
  description: z.string().optional(),
  agent_summary: z.string().min(20),
  why_go: z.string().optional(),
  best_for: z.array(z.string()).default([]),
  trip_planning_notes: z.array(z.string()).default([]),
  start_at: z.string().datetime({ offset: true }),
  end_at: z.string().datetime({ offset: true }).optional(),
  timezone: z.string().default('America/Chicago'),
  status: eventStatusSchema.default('scheduled'),
  location: z.object({
    name: z.string().optional(),
    address1: z.string().optional(),
    city: z.string(),
    region: z.string().default('TX'),
    postal_code: z.string().optional(),
    country: z.string().default('US'),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
  }),
  geo: z.object({
    distance_from_park_miles: z.number().nonnegative().optional(),
    radius_tier: z.union([z.literal(15), z.literal(50)]).optional(),
    estimated_drive_time_minutes: z.number().int().positive().optional(),
  }),
  links: z.object({
    web_url: z.string().url().optional(),
    source_url: z.string().url(),
    tickets_url: z.string().url().optional(),
    calendar_url: z.string().url().optional(),
  }),
  admission: z.object({
    is_free: z.boolean().optional(),
    requires_ticket: z.boolean().optional(),
    registration_required: z.boolean().optional(),
    price_min: z.number().nonnegative().optional(),
    price_max: z.number().nonnegative().optional(),
    currency: z.literal('USD').default('USD'),
    availability: z.enum(['available', 'sold_out', 'cancelled', 'unknown', 'not_applicable']).default('unknown'),
    purchase_url: z.string().url().optional(),
  }),
  categories: z.array(z.string()).min(1),
  tags: z.array(z.string()).default([]),
  rv_context: z.object({
    family_friendly: z.boolean().optional(),
    pet_friendly: z.boolean().nullable().optional(),
    outdoor: z.boolean().optional(),
    rainy_day_friendly: z.boolean().optional(),
    senior_friendly: z.boolean().optional(),
    rv_parking_notes: z.string().optional(),
    ideal_stay_length_days: z.number().positive().optional(),
    booking_prompt: z.string().optional(),
  }),
  relevance: z.object({
    score: z.number().min(0).max(1000),
    score_version: z.string(),
    reasons: z.array(z.string()).default([]),
  }),
  source: z.object({
    name: z.string(),
    type: z.string(),
    source_event_id: z.string().optional(),
    source_url: z.string().url(),
    first_seen_at: z.string().datetime({ offset: true }).optional(),
    last_seen_at: z.string().datetime({ offset: true }),
    confidence: z.number().min(0).max(1),
  }),
  moderation: z.object({
    status: z.enum(['pending', 'approved', 'rejected', 'needs_review']),
    reviewed_by: z.enum(['ai', 'human']).optional(),
    reviewed_at: z.string().datetime({ offset: true }).optional(),
    risk_flags: z.array(z.string()).default([]),
  }),
  created_at: z.string().datetime({ offset: true }),
  updated_at: z.string().datetime({ offset: true }),
});

export const publicEventsFeedSchema = z.object({
  schema_version: z.string(),
  generated_at: z.string().datetime({ offset: true }),
  timezone: z.string(),
  event_count: z.number().int().nonnegative(),
  source_count: z.number().int().nonnegative(),
  filters: z.object({
    cities: z.array(z.string()),
    categories: z.array(z.string()),
    radius_tiers: z.array(z.number()),
  }),
  events: z.array(eventSchema),
});

export type CanonicalEvent = z.infer<typeof eventSchema>;
export type PublicEventsFeed = z.infer<typeof publicEventsFeedSchema>;
