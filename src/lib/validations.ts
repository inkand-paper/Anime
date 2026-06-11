import { z } from "zod";

export const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(64),
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128)
    .regex(/[A-Z]/, "Must contain an uppercase letter")
    .regex(/[0-9]/, "Must contain a number"),
  referralCode: z.string().optional().or(z.literal("")),
});

export const LoginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const SubscriptionSchema = z.object({
  plan: z.enum(["MONTHLY", "YEARLY"]),
  paymentMethod: z.enum(["PAYPAL", "GOOGLE_PAY", "CARD"]),
  externalId: z.string().optional(),
});

export const WatchRoomSchema = z.object({
  animeId: z.string().min(1),
  episode: z.number().int().min(1),
});

export const WebhookSchema = z.object({
  event_type: z.string().optional(),
  type: z.string().optional(),
  resource: z.record(z.unknown()).optional(),
  data: z.record(z.unknown()).optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
