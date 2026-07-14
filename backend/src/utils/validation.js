import { z } from "zod";

export const RegisterUserBody = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8),
  role: z.enum(["fan", "volunteer", "organizer", "staff", "admin"]).default("fan"),
  language: z.string().default("en"),
});

export const LoginUserBody = z.object({
  email: z.string().email(),
  password: z.string(),
});

export const UpdateZoneCountBody = z.object({
  count: z.number().min(0),
});

export const AnalyzeCrowdBody = z.object({
  venueId: z.string(),
  zoneIds: z.array(z.string()).optional(),
  context: z.string().optional(),
});

export const GetNavigationRouteBody = z.object({
  venueId: z.string(),
  origin: z.string().optional(),
  destination: z.string(),
  accessibility: z.boolean().default(false),
  language: z.string().default("en"),
});

export const SendChatMessageBody = z.object({
  message: z.string(),
  language: z.string().default("en"),
});

export const QueryDecisionSupportBody = z.object({
  query: z.string(),
  context: z.string().optional(),
});

export const UpdateUserBody = z.object({
  name: z.string().optional(),
  role: z.enum(["fan", "volunteer", "organizer", "staff", "admin"]).optional(),
  language: z.string().optional(),
  assignedZone: z.string().nullable().optional(),
});

export const CreateVenueBody = z.object({
  name: z.string(),
  totalCapacity: z.number(),
  address: z.string(),
  amenities: z.array(z.string()).optional(),
});
