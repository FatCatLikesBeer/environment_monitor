import { z } from "zod";

export const DeviceDataSchema = z.object({
  temperature: z.number(),
  humidity: z.number(),
  device_id: z.string(),
  sensor_id: z.string(),
});

export type DeviceData = z.infer<typeof DeviceDataSchema>;

export const BuildingUpdateSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export type BuildingUpdate = z.infer<typeof BuildingUpdateSchema>;
