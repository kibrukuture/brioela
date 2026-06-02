import { z } from "@schnl/shared/zod";

export const bindDeviceSchema = z.object({
  deviceId: z.string().min(1, "deviceId is required"),
  platform: z.string().optional(),
  model: z.string().optional(),
  fingerprint: z.unknown().optional(),
  pushToken: z.string().optional(),
});

export const verifyDeviceSchema = z.object({
  deviceId: z.string().min(1, "deviceId is required"),
});

export type BindDeviceInput = z.infer<typeof bindDeviceSchema>;
export type VerifyDeviceInput = z.infer<typeof verifyDeviceSchema>;
