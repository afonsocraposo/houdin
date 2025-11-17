import { z } from "@/lib/zod";

export const Account = z.object({
  id: z.string(),
  name: z.string(),
  email: z.email(),
  emailVerified: z.boolean().default(false),
  image: z.url().optional(),
  plan: z.enum(["free", "plus"]).default("free"),
  createdAt: z.string().transform((str) => new Date(str)),
  updatedAt: z.string().transform((str) => new Date(str)),
});

export type Account = z.infer<typeof Account>;
