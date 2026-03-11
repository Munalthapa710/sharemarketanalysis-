import { z } from "zod";

export const symbolSchema = z.object({
  symbol: z
    .string()
    .min(1)
    .max(15)
    .regex(/^[A-Za-z0-9]+$/)
    .transform((value) => value.toUpperCase())
});

export const searchSchema = z.object({
  q: z.string().min(1).max(40)
});
