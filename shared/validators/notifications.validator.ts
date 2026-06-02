import { z } from "@schnl/shared/zod";

export const pushRegisterSchema = z.object({
  device_id: z.string().min(1),
  provider: z.enum(["expo", "apns", "fcm"]),
  token: z.string().min(1),
  platform: z.string().optional(),
  model: z.string().optional(),
});

export type PushRegisterInput = z.infer<typeof pushRegisterSchema>;

export const pushUnregisterSchema = z.object({
  device_id: z.string().min(1),
});

export type PushUnregisterInput = z.infer<typeof pushUnregisterSchema>;

export const pushRegisterResponseSchema = z.object({
  status: z.literal("ok"),
});
export type PushRegisterResponse = z.infer<typeof pushRegisterResponseSchema>;

export const pushUnregisterResponseSchema = z.object({
  status: z.literal("removed"),
});
export type PushUnregisterResponse = z.infer<
  typeof pushUnregisterResponseSchema
>;

export const courierMintJwtResponseSchema = z.object({
  token: z.string().min(1),
});
export type CourierMintJwtResponse = z.infer<
  typeof courierMintJwtResponseSchema
>;

export const pushSendSchema = z.union([
  z.object({
    template_id: z.string().min(1),
    data: z.record(z.string(), z.string()).optional(),
  }),
  z.object({
    title: z.string().min(1),
    body: z.string().min(1),
    data: z.record(z.string(), z.string()).optional(),
  }),
]);
export type PushSendInput = z.infer<typeof pushSendSchema>;

export const pushSendResponseSchema = z.object({
  status: z.literal("queued"),
  requestId: z.string().min(1),
});
export type PushSendResponse = z.infer<typeof pushSendResponseSchema>;

export const pushAdminSendSchema = z.union([
  z.object({
    user_id: z.string().min(1),
    template_id: z.string().min(1),
    data: z.record(z.string(), z.string()).optional(),
  }),
  z.object({
    user_id: z.string().min(1),
    title: z.string().min(1),
    body: z.string().min(1),
    data: z.record(z.string(), z.string()).optional(),
  }),
]);
export type PushAdminSendInput = z.infer<typeof pushAdminSendSchema>;
